/**
 * Counselors API - Approve/Reject Counselor
 *
 * POST /api/counselors/approve
 * Body: { user_id: string, approve: boolean, rejection_reason?: string }
 *
 * Approves or rejects a pending counselor request.
 * Only accessible by users with role = 'counselor'.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  ApproveCounselorResponse,
  ApiResponse,
  ErrorCode,
  ErrorMessages,
  UserRole,
} from '../../types/shared';

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Request validation schema
const approveSchema = z.object({
  user_id: z.string().uuid(),
  approve: z.boolean(),
  rejection_reason: z.string().max(500).optional(),
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
 * Verifies user has counselor role
 */
async function verifyCounselorRole(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('students')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.role === UserRole.COUNSELOR;
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
 * Main handler for POST /api/counselors/approve
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
    // Validate authentication
    const auth = await validateToken(req.headers.authorization);
    if (!auth) {
      sendError(res, 401, ErrorCode.UNAUTHORIZED);
      return;
    }

    // Verify counselor role
    const isCounselor = await verifyCounselorRole(auth.userId);
    if (!isCounselor) {
      sendError(res, 403, ErrorCode.FORBIDDEN, 'Only approved counselors can approve requests');
      return;
    }

    // Validate request body
    const parseResult = approveSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors[0]?.message;
      sendError(res, 400, ErrorCode.VALIDATION_ERROR, errorMessage);
      return;
    }

    const { user_id, approve, rejection_reason } = parseResult.data;

    // Verify the approval request exists and is pending
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

    // Update the approval record
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

    // If approved, update the user's role to counselor
    if (approve) {
      const { error: updateRoleError } = await supabase
        .from('students')
        .update({ role: UserRole.COUNSELOR })
        .eq('id', user_id);

      if (updateRoleError) {
        // Rollback approval status
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
  } catch {
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
