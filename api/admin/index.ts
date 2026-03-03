/**
 * Admin API - Stats & Alerts
 *
 * GET /api/admin?view=stats  - System-wide statistics
 * GET /api/admin?view=alerts - All system alerts
 *
 * Only accessible by admins.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  AdminStatsResponse,
  AlertWithDetails,
  GetAlertsResponse,
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

async function handleStats(res: VercelResponse): Promise<void> {
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
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('role', 'counselor'),
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('role', 'pending_counselor'),
    supabase.from('submissions').select('id', { count: 'exact', head: true }),
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('risk_level', 'high'),
    supabase.from('submissions').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('submissions').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
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
}

async function handleAlerts(res: VercelResponse): Promise<void> {
  const { data: alerts, error } = await supabase
    .from('at_risk_alerts')
    .select(`
      id,
      student_id,
      counselor_id,
      submission_id,
      risk_level,
      status,
      triggered_at,
      acknowledged_at,
      resolved_at,
      resolution_notes,
      student:students!at_risk_alerts_student_id_fkey (email),
      counselor:students!at_risk_alerts_counselor_id_fkey (email)
    `)
    .order('triggered_at', { ascending: false })
    .limit(100);

  if (error) {
    sendError(res, 500, ErrorCode.DATABASE_ERROR);
    return;
  }

  const alertItems: AlertWithDetails[] = (alerts || []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    student_id: a.student_id as string,
    counselor_id: (a.counselor_id as string) || null,
    submission_id: (a.submission_id as string) || null,
    risk_level: a.risk_level as 'moderate' | 'high',
    status: a.status as 'pending' | 'acknowledged' | 'resolved',
    triggered_at: a.triggered_at as string,
    acknowledged_at: (a.acknowledged_at as string) || null,
    resolved_at: (a.resolved_at as string) || null,
    resolution_notes: (a.resolution_notes as string) || null,
    student_email: ((a.student as Record<string, string> | null)?.email) || 'Unknown',
    counselor_email: ((a.counselor as Record<string, string> | null)?.email) || null,
    submission_text: null,
  }));

  const pendingCount = alertItems.filter((a) => a.status === 'pending').length;

  const response: ApiResponse<GetAlertsResponse> = {
    success: true,
    data: {
      alerts: alertItems,
      total_count: alertItems.length,
      pending_count: pendingCount,
    },
  };
  res.status(200).json(response);
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

    const view = req.query.view as string;
    if (view === 'alerts') {
      await handleAlerts(res);
    } else {
      // Default to stats
      await handleStats(res);
    }
  } catch {
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
