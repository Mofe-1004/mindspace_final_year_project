/**
 * Submissions API - Get Submission History
 *
 * GET /api/submissions/history?limit=20&offset=0
 *
 * Returns the authenticated student's past submissions for trend visualization.
 * Does NOT return text_encrypted for privacy.
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
      console.error('Token validation error:', error);
      return null;
    }

    return { userId: user.id, email: user.email || '' };
  } catch (error) {
    console.error('Token validation exception:', error);
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

    // Get total count first
    const { count, error: countError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', auth.userId);

    if (countError) {
      console.error('Count error:', countError);
      sendError(res, 500, ErrorCode.DATABASE_ERROR);
      return;
    }

    const totalCount = count || 0;

    // Fetch submissions (without text_encrypted for privacy)
    const { data: submissions, error: fetchError } = await supabase
      .from('submissions')
      .select('id, sentiment, risk_level, dominant_emotion, confidence, created_at')
      .eq('student_id', auth.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      sendError(res, 500, ErrorCode.DATABASE_ERROR);
      return;
    }

    // Transform to response format
    const historyItems: SubmissionHistoryItem[] = (submissions || []).map((sub) => ({
      id: sub.id,
      sentiment: sub.sentiment as Sentiment,
      risk_level: sub.risk_level as RiskLevel,
      dominant_emotion: sub.dominant_emotion ?? null,
      confidence: sub.confidence,
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
  } catch (error) {
    console.error('Unexpected error in history handler:', error);
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
