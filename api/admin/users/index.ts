/**
 * Admin API - List Users
 *
 * GET /api/admin/users
 *
 * Returns all users with their role, school domain, and activity info.
 * Only accessible by users with role = 'admin'.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  AdminUserItem,
  GetAdminUsersResponse,
  ApiResponse,
  ErrorCode,
  ErrorMessages,
  UserRole,
} from '../../../types/shared';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function validateToken(
  authHeader: string | undefined
): Promise<{ userId: string; email: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return { userId: user.id, email: user.email || '' };
  } catch {
    return null;
  }
}

async function verifyAdminRole(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('students')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  return data.role === UserRole.ADMIN;
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
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET requests are allowed' },
    });
    return;
  }

  try {
    const auth = await validateToken(req.headers.authorization);
    if (!auth) {
      sendError(res, 401, ErrorCode.UNAUTHORIZED);
      return;
    }

    const isAdmin = await verifyAdminRole(auth.userId);
    if (!isAdmin) {
      sendError(res, 403, ErrorCode.FORBIDDEN, 'Only admins can access this resource');
      return;
    }

    // Fetch all users
    const { data: users, error: fetchError } = await supabase
      .from('students')
      .select('id, email, role, school_domain, created_at, last_active')
      .order('created_at', { ascending: false });

    if (fetchError) {
      sendError(res, 500, ErrorCode.DATABASE_ERROR);
      return;
    }

    const userItems: AdminUserItem[] = (users || []).map((u: { id: string; email: string; role: UserRole; school_domain: string; created_at: string; last_active: string | null }) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      school_domain: u.school_domain,
      created_at: u.created_at,
      last_active: u.last_active,
    }));

    const response: ApiResponse<GetAdminUsersResponse> = {
      success: true,
      data: {
        users: userItems,
        total_count: userItems.length,
      },
    };

    res.status(200).json(response);
  } catch {
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
