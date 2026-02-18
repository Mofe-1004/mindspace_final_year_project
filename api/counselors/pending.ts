/**
 * Counselors API - Get Pending Approvals
 *
 * GET /api/counselors/pending
 *
 * Returns list of pending counselor approval requests.
 * Only accessible by users with role = 'counselor'.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  GetPendingApprovalsResponse,
  PendingApprovalItem,
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
 * Main handler for GET /api/counselors/pending
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

    // Verify counselor role
    const isCounselor = await verifyCounselorRole(auth.userId);
    if (!isCounselor) {
      sendError(res, 403, ErrorCode.FORBIDDEN, 'Only approved counselors can view pending approvals');
      return;
    }

    // Fetch pending approvals with user emails
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
      console.error('Fetch error:', fetchError);
      sendError(res, 500, ErrorCode.DATABASE_ERROR);
      return;
    }

    // Transform to response format
    const pendingItems: PendingApprovalItem[] = (approvals || []).map((a: any) => ({
      id: a.id,
      user_id: a.user_id,
      user_email: a.students?.email || 'Unknown',
      status: a.status,
      requested_at: a.requested_at,
    }));

    const response: ApiResponse<GetPendingApprovalsResponse> = {
      success: true,
      data: {
        approvals: pendingItems,
        total_count: pendingItems.length,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Unexpected error in pending handler:', error);
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
