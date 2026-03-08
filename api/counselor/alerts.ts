/**
 * Counselor API - Alerts
 *
 * GET  /api/counselor/alerts - Get my pending/recent alerts
 * PUT  /api/counselor/alerts?id=xxx&action=acknowledge|resolve - Update alert status
 *
 * Only accessible by counselors.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  AlertWithDetails,
  GetAlertsResponse,
  ApiResponse,
  ErrorCode,
  ErrorMessages,
  UserRole,
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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (!['GET', 'PUT'].includes(req.method || '')) {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
    });
    return;
  }

  try {
    const auth = await validateToken(req.headers.authorization);
    if (!auth) {
      sendError(res, 401, ErrorCode.UNAUTHORIZED);
      return;
    }

    const isCounselor = await verifyCounselorRole(auth.userId);
    if (!isCounselor) {
      sendError(res, 403, ErrorCode.FORBIDDEN, 'Only counselors can access alerts');
      return;
    }

    if (req.method === 'GET') {
      await handleGet(auth.userId, res);
    } else if (req.method === 'PUT') {
      await handlePut(req, res, auth.userId);
    }
  } catch {
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleGet(counselorId: string, res: VercelResponse): Promise<void> {
  // Fetch alerts for this counselor, including the flagged submission text
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
      submission:submissions!at_risk_alerts_submission_id_fkey (text_encrypted)
    `)
    .eq('counselor_id', counselorId)
    .order('triggered_at', { ascending: false })
    .limit(50);

  if (error) {
    sendError(res, 500, ErrorCode.DATABASE_ERROR);
    return;
  }

  const alertItems: AlertWithDetails[] = (alerts || []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    student_id: a.student_id as string,
    counselor_id: a.counselor_id as string,
    submission_id: (a.submission_id as string) || null,
    risk_level: a.risk_level as 'moderate' | 'high',
    status: a.status as 'pending' | 'acknowledged' | 'resolved',
    triggered_at: a.triggered_at as string,
    acknowledged_at: (a.acknowledged_at as string) || null,
    resolved_at: (a.resolved_at as string) || null,
    resolution_notes: (a.resolution_notes as string) || null,
    student_email: ((a.student as Record<string, string> | null)?.email) || 'Unknown',
    counselor_email: null,
    submission_text: ((a.submission as Record<string, string> | null)?.text_encrypted) || null,
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

async function handlePut(
  req: VercelRequest,
  res: VercelResponse,
  counselorId: string
): Promise<void> {
  const alertId = req.query.id as string;
  const action = req.query.action as string;

  if (!alertId || !['acknowledge', 'resolve'].includes(action)) {
    sendError(res, 400, ErrorCode.VALIDATION_ERROR, 'Valid alert ID and action (acknowledge|resolve) required');
    return;
  }

  const updates: Record<string, string> = {};

  if (action === 'acknowledge') {
    updates.status = 'acknowledged';
    updates.acknowledged_at = new Date().toISOString();
    updates.acknowledged_by = counselorId;
  } else if (action === 'resolve') {
    updates.status = 'resolved';
    updates.resolved_at = new Date().toISOString();
    if (req.body?.resolution_notes) {
      updates.resolution_notes = req.body.resolution_notes;
    }
  }

  const { error } = await supabase
    .from('at_risk_alerts')
    .update(updates)
    .eq('id', alertId)
    .eq('counselor_id', counselorId);

  if (error) {
    sendError(res, 500, ErrorCode.DATABASE_ERROR);
    return;
  }

  res.status(200).json({
    success: true,
    data: { message: `Alert ${action}d successfully` },
  });
}
