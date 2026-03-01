/**
 * Admin API - System Statistics
 *
 * GET /api/admin/stats
 *
 * Returns system-wide statistics for the admin dashboard.
 * Only accessible by users with role = 'admin'.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  AdminStatsResponse,
  ApiResponse,
  ErrorCode,
  ErrorMessages,
  UserRole,
} from '../../types/shared';

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
      sendError(res, 403, ErrorCode.FORBIDDEN, 'Only admins can access statistics');
      return;
    }

    // Run all queries in parallel for performance
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      studentsResult,
      counselorsResult,
      pendingResult,
      totalSubmissionsResult,
      highRiskResult,
      last7DaysResult,
      last30DaysResult,
    ] = await Promise.all([
      // Total students
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student'),
      // Total counselors
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'counselor'),
      // Total pending counselors
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'pending_counselor'),
      // Total submissions
      supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true }),
      // High risk submissions
      supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('risk_level', 'high'),
      // Submissions in last 7 days
      supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo),
      // Submissions in last 30 days
      supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo),
    ]);

    const stats: AdminStatsResponse = {
      total_students: studentsResult.count || 0,
      total_counselors: counselorsResult.count || 0,
      total_pending_counselors: pendingResult.count || 0,
      total_submissions: totalSubmissionsResult.count || 0,
      high_risk_submissions: highRiskResult.count || 0,
      submissions_last_7_days: last7DaysResult.count || 0,
      submissions_last_30_days: last30DaysResult.count || 0,
    };

    const response: ApiResponse<AdminStatsResponse> = {
      success: true,
      data: stats,
    };

    res.status(200).json(response);
  } catch {
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
