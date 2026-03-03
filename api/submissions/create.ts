/**
 * Submissions API - Create Submission
 *
 * POST /api/submissions/create
 *
 * Flow:
 * 1. Validate JWT token (user must be authenticated)
 * 2. Validate input text (10-2000 chars)
 * 3. Analyze text with ML service (AfriBERTa + MentalBERT)
 * 4. Generate empathetic response
 * 5. Select appropriate Bible verse
 * 6. Save submission to database
 * 7. Return result to user
 *
 * Response time target: <5 seconds
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { analyzeText } from '../_lib/ml-service';
import { generateResponsePackage } from '../_lib/response-generator';
import { selectVerse } from '../_lib/verse-selector';
import { validateTextQuality } from '../_lib/gibberish-detector';
import { createAtRiskAlert } from '../_lib/alert-service';
import {
  CreateSubmissionResponse,
  ApiResponse,
  ErrorCode,
  ErrorMessages,
  VALIDATION_RULES,
} from '../../types/shared';

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Request validation schema
const submissionSchema = z.object({
  text: z
    .string()
    .min(VALIDATION_RULES.TEXT_SUBMISSION.MIN_LENGTH, {
      message: `Text must be at least ${VALIDATION_RULES.TEXT_SUBMISSION.MIN_LENGTH} characters`,
    })
    .max(VALIDATION_RULES.TEXT_SUBMISSION.MAX_LENGTH, {
      message: `Text cannot exceed ${VALIDATION_RULES.TEXT_SUBMISSION.MAX_LENGTH} characters`,
    }),
});

/**
 * Extracts and validates JWT token from Authorization header
 */
async function validateToken(
  authHeader: string | undefined
): Promise<{ userId: string; email: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    // Verify the JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return { userId: user.id, email: user.email || '' };
  } catch {
    return null;
  }
}

/**
 * Ensures a student record exists in the students table
 * Creates one if it doesn't exist (first-time submission)
 */
async function ensureStudentExists(userId: string, email: string): Promise<boolean> {
  // Check if student already exists
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id')
    .eq('id', userId)
    .single();

  if (existingStudent) {
    return true; // Student already exists
  }

  // Extract school domain from email
  const emailParts = email.split('@');
  const schoolDomain = emailParts.length > 1 ? emailParts[1] : 'unknown';

  // Create student record
  const { error: insertError } = await supabase
    .from('students')
    .insert({
      id: userId,
      email: email,
      email_verified: true, // They're authenticated, so email is verified
      school_domain: schoolDomain,
      role: 'student',
    });

  if (insertError) {
    return false;
  }

  return true;
}

/**
 * Sends an error response with consistent format
 */
function sendError(
  res: VercelResponse,
  statusCode: number,
  code: ErrorCode,
  message?: string
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message: message || ErrorMessages[code],
    },
  };
  res.status(statusCode).json(response);
}

/**
 * Main handler for POST /api/submissions/create
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST requests are allowed' },
    });
    return;
  }

  try {
    // Step 1: Validate authentication
    const auth = await validateToken(req.headers.authorization);
    if (!auth) {
      sendError(res, 401, ErrorCode.UNAUTHORIZED);
      return;
    }

    // Step 1.5: Ensure student record exists (creates if first-time user)
    const studentExists = await ensureStudentExists(auth.userId, auth.email);
    if (!studentExists) {
      sendError(res, 500, ErrorCode.DATABASE_ERROR, 'Failed to create user profile');
      return;
    }

    // Step 2: Validate request body
    const parseResult = submissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors[0]?.message;
      if (errorMessage?.includes('at least')) {
        sendError(res, 400, ErrorCode.TEXT_TOO_SHORT, errorMessage);
      } else if (errorMessage?.includes('exceed')) {
        sendError(res, 400, ErrorCode.TEXT_TOO_LONG, errorMessage);
      } else {
        sendError(res, 400, ErrorCode.VALIDATION_ERROR, errorMessage);
      }
      return;
    }

    const { text } = parseResult.data;

    // Step 2.5: Validate text quality (reject gibberish before expensive ML)
    const quality = validateTextQuality(text);
    if (!quality.valid) {
      sendError(res, 400, ErrorCode.GIBBERISH_DETECTED, quality.reason);
      return;
    }

    // Step 3: Analyze text with ML service
    const mlResult = await analyzeText(text);

    // Step 4: Generate empathetic response
    const responsePackage = generateResponsePackage(
      mlResult.sentiment,
      mlResult.risk_level,
      mlResult.language_detected
    );

    // Step 5: Select Bible verse
    const verse = await selectVerse(mlResult.sentiment, mlResult.risk_level, mlResult.dominant_emotion, mlResult.has_concern_language, mlResult.concern_type, text);

    // Step 6: Save to database
    const { data: submission, error: dbError } = await supabase
      .from('submissions')
      .insert({
        student_id: auth.userId,
        text_encrypted: text, // In production, encrypt this
        sentiment: mlResult.sentiment,
        risk_level: mlResult.risk_level,
        dominant_emotion: mlResult.dominant_emotion,
        confidence: mlResult.confidence,
        language_detected: mlResult.language_detected,
        empathetic_message: responsePackage.message,
        bible_verse_reference: verse.reference,
        bible_verse_text: verse.text,
      })
      .select('id, created_at')
      .single();

    if (dbError) {
      sendError(res, 500, ErrorCode.DATABASE_ERROR);
      return;
    }

    // Step 6.5: Create at-risk alert for HIGH risk only (fire-and-forget)
    // Moderate risk still shows counselor suggestion on the result page, but doesn't alert counselors
    if (mlResult.risk_level === 'high') {
      createAtRiskAlert({
        studentId: auth.userId,
        submissionId: submission.id,
        riskLevel: 'high',
      }).catch(() => { /* fire-and-forget */ });
    }

    // Step 7: Build and return response
    const response: ApiResponse<CreateSubmissionResponse> = {
      success: true,
      data: {
        id: submission.id,
        sentiment: mlResult.sentiment,
        risk_level: mlResult.risk_level,
        dominant_emotion: mlResult.dominant_emotion,
        confidence: mlResult.confidence,
        empathetic_message: responsePackage.message,
        bible_verse: {
          reference: verse.reference,
          text: verse.text,
        },
        show_counselor_option: responsePackage.showCounselorOption,
        created_at: submission.created_at,
      },
    };

    // Add follow-up suggestion header if present (for moderate/high risk)
    if (responsePackage.followUpSuggestion) {
      res.setHeader('X-Follow-Up-Suggestion', responsePackage.followUpSuggestion);
    }

    res.status(201).json(response);
  } catch (error) {
    // Check if it's a timeout-related error
    if (error instanceof Error && error.message.includes('timeout')) {
      sendError(res, 503, ErrorCode.ML_SERVICE_TIMEOUT);
      return;
    }

    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
