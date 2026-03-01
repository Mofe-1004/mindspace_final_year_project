/**
 * Submissions API - Get Submission History
 *
 * GET /api/submissions/history?limit=20&offset=0
 *
 * Returns the authenticated student's past submissions (last 30 days).
 * Includes entry text so students can review their own past entries.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  GetSubmissionHistoryResponse,
  SubmissionHistoryItem,
  ApiResponse,
  ErrorCode,
  ErrorMessages,
  Sentiment,
  RiskLevel,
} from '../../types/shared';

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
 * Main handler for GET /api/submissions/history
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET requests are allowed' },
    });
    return;
  }

  try {
    // Validate authentication
    const auth = await validateToken(req.headers.authorization);
    if (!auth) {
      sendError(res, 401, ErrorCode.UNAUTHORIZED);
      return;
    }

    // Parse query parameters
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    // Only show entries from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    // Get total count (within 30-day window)
    const { count, error: countError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', auth.userId)
      .gte('created_at', cutoffDate);

    if (countError) {
      sendError(res, 500, ErrorCode.DATABASE_ERROR);
      return;
    }

    const totalCount = count || 0;

    // Fetch submissions with full details (within 30-day window)
    const { data: submissions, error: fetchError } = await supabase
      .from('submissions')
      .select('id, text_encrypted, sentiment, risk_level, dominant_emotion, confidence, empathetic_message, bible_verse_reference, bible_verse_text, created_at')
      .eq('student_id', auth.userId)
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      sendError(res, 500, ErrorCode.DATABASE_ERROR);
      return;
    }

    // Transform to response format
    const historyItems: SubmissionHistoryItem[] = (submissions || []).map((sub) => ({
      id: sub.id,
      text: sub.text_encrypted,
      sentiment: sub.sentiment as Sentiment,
      risk_level: sub.risk_level as RiskLevel,
      dominant_emotion: sub.dominant_emotion ?? null,
      confidence: sub.confidence,
      empathetic_message: sub.empathetic_message ?? null,
      bible_verse_reference: sub.bible_verse_reference ?? null,
      bible_verse_text: sub.bible_verse_text ?? null,
      created_at: sub.created_at,
    }));

    const response: ApiResponse<GetSubmissionHistoryResponse> = {
      success: true,
      data: {
        submissions: historyItems,
        total_count: totalCount,
        has_more: offset + limit < totalCount,
      },
    };

    res.status(200).json(response);
  } catch {
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
