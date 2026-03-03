/**
 * Counselors API - Pending Approvals & Approve/Reject
 *
 * GET  /api/counselors - List pending counselor approval requests
 * POST /api/counselors - Approve or reject a counselor request
 *
 * Only accessible by users with role = 'counselor'.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  GetPendingApprovalsResponse,
  PendingApprovalItem,
  ApproveCounselorResponse,
  ApiResponse,
  ErrorCode,
  ErrorMessages,
  UserRole,
} from '../../types/shared';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const approveSchema = z.object({
  user_id: z.string().uuid(),
  approve: z.boolean(),
  rejection_reason: z.string().max(500).optional(),
});

async function validateToken(
  authHeader: string | undefined
): Promise<{ userId: string; email: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return { userId: user.id, email: user.email || '' };
  } catch {
    return null;
  }
}

async function verifyCounselorRole(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('students')
    .select('role')
    .eq('id', userId)
    .single();
  if (error || !data) return false;
  return data.role === UserRole.COUNSELOR;
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

async function handleGetPending(
  _req: VercelRequest,
  res: VercelResponse,
  auth: { userId: string; email: string }
): Promise<void> {
  const isCounselor = await verifyCounselorRole(auth.userId);
  if (!isCounselor) {
    sendError(res, 403, ErrorCode.FORBIDDEN, 'Only approved counselors can view pending approvals');
    return;
  }

  const { data: approvals, error: fetchError } = await supabase
    .from('counselor_approvals')
    .select(`
      id,
      user_id,
      status,
      requested_at,
      students!counselor_approvals_user_id_fkey (
        email
      )
    `)
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });

  if (fetchError) {
    sendError(res, 500, ErrorCode.DATABASE_ERROR);
    return;
  }

  const pendingItems: PendingApprovalItem[] = (approvals || []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    user_id: a.user_id as string,
    user_email: ((a.students as Record<string, string> | null)?.email) || 'Unknown',
    status: a.status as 'pending' | 'approved' | 'rejected',
    requested_at: a.requested_at as string,
  }));

  const response: ApiResponse<GetPendingApprovalsResponse> = {
    success: true,
    data: {
      approvals: pendingItems,
      total_count: pendingItems.length,
    },
  };
  res.status(200).json(response);
}

async function handleApprove(
  req: VercelRequest,
  res: VercelResponse,
  auth: { userId: string; email: string }
): Promise<void> {
  const isCounselor = await verifyCounselorRole(auth.userId);
  if (!isCounselor) {
    sendError(res, 403, ErrorCode.FORBIDDEN, 'Only approved counselors can approve requests');
    return;
  }

  const parseResult = approveSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMessage = parseResult.error.errors[0]?.message;
    sendError(res, 400, ErrorCode.VALIDATION_ERROR, errorMessage);
    return;
  }

  const { user_id, approve, rejection_reason } = parseResult.data;

  const { data: approvalRecord, error: checkError } = await supabase
    .from('counselor_approvals')
    .select('id, status')
    .eq('user_id', user_id)
    .single();

  if (checkError || !approvalRecord) {
    sendError(res, 404, ErrorCode.RECORD_NOT_FOUND, 'Approval request not found');
    return;
  }

  if (approvalRecord.status !== 'pending') {
    sendError(res, 400, ErrorCode.VALIDATION_ERROR, 'This request has already been processed');
    return;
  }

  const { error: updateApprovalError } = await supabase
    .from('counselor_approvals')
    .update({
      status: approve ? 'approved' : 'rejected',
      approved_by: approve ? auth.userId : null,
      reviewed_at: new Date().toISOString(),
      rejection_reason: approve ? null : (rejection_reason || 'No reason provided'),
    })
    .eq('user_id', user_id);

  if (updateApprovalError) {
    sendError(res, 500, ErrorCode.DATABASE_ERROR);
    return;
  }

  if (approve) {
    const { error: updateRoleError } = await supabase
      .from('students')
      .update({ role: UserRole.COUNSELOR })
      .eq('id', user_id);

    if (updateRoleError) {
      await supabase
        .from('counselor_approvals')
        .update({ status: 'pending', approved_by: null, reviewed_at: null })
        .eq('user_id', user_id);
      sendError(res, 500, ErrorCode.DATABASE_ERROR, 'Failed to update user role');
      return;
    }
  }

  const response: ApiResponse<ApproveCounselorResponse> = {
    success: true,
    data: {
      success: true,
      message: approve
        ? 'Counselor has been approved successfully'
        : 'Counselor request has been rejected',
    },
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
      await handleGetPending(req, res, auth);
    } else if (req.method === 'POST') {
      await handleApprove(req, res, auth);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET and POST requests are allowed' },
      });
    }
  } catch {
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
