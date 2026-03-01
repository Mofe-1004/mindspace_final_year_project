/**
 * Submissions API - Delete Submission
 *
 * DELETE /api/submissions/delete?id=<submission_id>
 *
 * Allows a student to delete their own submission.
 * The at_risk_alerts FK is ON DELETE SET NULL, so alerts
 * remain but lose the linked submission text.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  DeleteSubmissionResponse,
  ApiResponse,
  ErrorCode,
  ErrorMessages,
} from '../../types/shared';

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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only DELETE requests are allowed' },
    });
    return;
  }

  try {
    const auth = await validateToken(req.headers.authorization);
    if (!auth) {
      sendError(res, 401, ErrorCode.UNAUTHORIZED);
      return;
    }

    const submissionId = req.query.id as string;
    if (!submissionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId)) {
      sendError(res, 400, ErrorCode.VALIDATION_ERROR, 'A valid submission ID is required');
      return;
    }

    // Delete only if the submission belongs to the authenticated student
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
  } catch {
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
