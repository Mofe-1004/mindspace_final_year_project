/**
 * Admin API - Update User Role
 *
 * PUT /api/admin/users/role
 *
 * Changes a user's role. Only accessible by admins.
 * Validates that the target role is a valid UserRole.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  UpdateUserRoleResponse,
  ApiResponse,
  ErrorCode,
  ErrorMessages,
  UserRole,
} from '../../../types/shared';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const roleUpdateSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid role' }) }),
});

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
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only PUT requests are allowed' },
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
      sendError(res, 403, ErrorCode.FORBIDDEN, 'Only admins can change user roles');
      return;
    }

    // Validate request body
    const parseResult = roleUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors[0]?.message;
      sendError(res, 400, ErrorCode.VALIDATION_ERROR, errorMessage);
      return;
    }

    const { user_id, role } = parseResult.data;

    // Prevent admin from demoting themselves
    if (user_id === auth.userId) {
      sendError(res, 400, ErrorCode.VALIDATION_ERROR, 'You cannot change your own role');
      return;
    }

    // Check target user exists
    const { data: targetUser, error: findError } = await supabase
      .from('students')
      .select('id, role')
      .eq('id', user_id)
      .single();

    if (findError || !targetUser) {
      sendError(res, 404, ErrorCode.RECORD_NOT_FOUND, 'User not found');
      return;
    }

    // Update the role in students table
    const { error: updateError } = await supabase
      .from('students')
      .update({ role })
      .eq('id', user_id);

    if (updateError) {
      sendError(res, 500, ErrorCode.DATABASE_ERROR);
      return;
    }

    // Also update JWT metadata so the role is recognized on next sign-in
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
      user_id,
      { user_metadata: { role } }
    );

    if (authUpdateError) {
      // Don't fail the request — the DB role is already updated and
      // AuthContext will pick it up from the background DB check.
    }

    // If promoting to counselor, clean up any pending approval record
    if (role === UserRole.COUNSELOR) {
      await supabase
        .from('counselor_approvals')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('user_id', user_id)
        .eq('status', 'pending');
    }

    const response: ApiResponse<UpdateUserRoleResponse> = {
      success: true,
      data: {
        message: `User role updated to ${role}`,
        user_id,
        new_role: role,
      },
    };

    res.status(200).json(response);
  } catch {
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
