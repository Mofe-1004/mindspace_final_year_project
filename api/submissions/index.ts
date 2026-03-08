/**
 * Submissions API - History & Delete
 *
 * GET    /api/submissions?limit=20&offset=0 - Get submission history (last 30 days)
 * DELETE /api/submissions?id=<submission_id> - Delete a submission
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  GetSubmissionHistoryResponse,
  SubmissionHistoryItem,
  DeleteSubmissionResponse,
  ApiResponse,
  ErrorCode,
  ErrorMessages,
  Sentiment,
  RiskLevel,
} from '../_types/shared';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function validateToken(
  authHeader: string | undefined
): Promise<{ userId: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return { userId: user.id };
  } catch {
    return null;
  }
}

function sendError(
  res: VercelResponse,
  statusCode: number,
  code: ErrorCode,
  message?: string
): void {
  const response: ApiResponse = {
    success: false,
    error: { code, message: message || ErrorMessages[code] },
  };
  res.status(statusCode).json(response);
}

async function handleHistory(
  req: VercelRequest,
  res: VercelResponse,
  auth: { userId: string }
): Promise<void> {
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffDate = thirtyDaysAgo.toISOString();

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
}

async function handleDelete(
  req: VercelRequest,
  res: VercelResponse,
  auth: { userId: string }
): Promise<void> {
  const submissionId = req.query.id as string;
  if (!submissionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId)) {
    sendError(res, 400, ErrorCode.VALIDATION_ERROR, 'A valid submission ID is required');
    return;
  }

  const { data, error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', submissionId)
    .eq('student_id', auth.userId)
    .select('id')
    .single();

  if (error || !data) {
    sendError(res, 404, ErrorCode.VALIDATION_ERROR, 'Entry not found or already deleted');
    return;
  }

  const response: ApiResponse<DeleteSubmissionResponse> = {
    success: true,
    data: { deleted_id: data.id },
  };
  res.status(200).json(response);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    const auth = await validateToken(req.headers.authorization);
    if (!auth) {
      sendError(res, 401, ErrorCode.UNAUTHORIZED);
      return;
    }

    if (req.method === 'GET') {
      await handleHistory(req, res, auth);
    } else if (req.method === 'DELETE') {
      await handleDelete(req, res, auth);
    } else {
      res.setHeader('Allow', ['GET', 'DELETE']);
      res.status(405).json({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET and DELETE requests are allowed' },
      });
    }
  } catch {
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
