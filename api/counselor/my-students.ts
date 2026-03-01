/**
 * Counselor API - My Students Aggregate Trends
 *
 * GET /api/counselor/my-students
 *
 * Returns aggregate submission trends for the counselor's assigned students.
 * Only shows aggregated data — never individual submissions.
 * Requires at least 3 distinct students to have submitted (k-anonymity).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  MyStudentsTrendsResponse,
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

    const isCounselor = await verifyCounselorRole(auth.userId);
    if (!isCounselor) {
      sendError(res, 403, ErrorCode.FORBIDDEN, 'Only counselors can access this resource');
      return;
    }

    // Get assigned student IDs
    const { data: assignments, error: assignError } = await supabase
      .from('counselor_student_assignments')
      .select('student_id')
      .eq('counselor_id', auth.userId)
      .eq('status', 'active');

    if (assignError) {
      sendError(res, 500, ErrorCode.DATABASE_ERROR);
      return;
    }

    const studentIds = (assignments || []).map((a: { student_id: string }) => a.student_id);

    if (studentIds.length === 0) {
      const response: ApiResponse<MyStudentsTrendsResponse> = {
        success: true,
        data: { daily_summary: [], assigned_students: [], total_assigned_students: 0 },
      };
      res.status(200).json(response);
      return;
    }

    // Fetch assigned student details (email, last active)
    const { data: studentRows } = await supabase
      .from('students')
      .select('id, email, last_active')
      .in('id', studentIds);

    // Parse date range from query params
    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Fetch submissions for assigned students, aggregate by day
    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select('student_id, sentiment, risk_level, created_at')
      .in('student_id', studentIds)
      .gte('created_at', startDate)
      .order('created_at', { ascending: true });

    if (subError) {
      sendError(res, 500, ErrorCode.DATABASE_ERROR);
      return;
    }

    // Aggregate by date
    const dailyMap = new Map<string, {
      date: string;
      positive_count: number;
      neutral_count: number;
      negative_count: number;
      low_risk_count: number;
      moderate_risk_count: number;
      high_risk_count: number;
      total_submissions: number;
      distinct_students: Set<string>;
    }>();

    for (const sub of submissions || []) {
      const date = sub.created_at.split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          positive_count: 0,
          neutral_count: 0,
          negative_count: 0,
          low_risk_count: 0,
          moderate_risk_count: 0,
          high_risk_count: 0,
          total_submissions: 0,
          distinct_students: new Set(),
        });
      }

      const day = dailyMap.get(date)!;
      day.total_submissions++;
      day.distinct_students.add(sub.student_id);

      if (sub.sentiment === 'positive') day.positive_count++;
      else if (sub.sentiment === 'neutral') day.neutral_count++;
      else if (sub.sentiment === 'negative') day.negative_count++;

      if (sub.risk_level === 'low') day.low_risk_count++;
      else if (sub.risk_level === 'moderate') day.moderate_risk_count++;
      else if (sub.risk_level === 'high') day.high_risk_count++;
    }

    // Apply k-anonymity: only include days with >= 3 distinct students
    const daily_summary = Array.from(dailyMap.values())
      .filter((d) => d.distinct_students.size >= 3)
      .map(({ distinct_students, ...rest }) => rest);

    // Build per-student summary (submission count + latest sentiment/risk)
    const studentSubmissionMap = new Map<string, {
      count: number;
      latestSentiment: string | null;
      latestRisk: string | null;
      latestDate: string;
    }>();

    for (const sub of submissions || []) {
      const existing = studentSubmissionMap.get(sub.student_id);
      if (!existing || sub.created_at > existing.latestDate) {
        studentSubmissionMap.set(sub.student_id, {
          count: (existing?.count || 0) + 1,
          latestSentiment: sub.sentiment,
          latestRisk: sub.risk_level,
          latestDate: sub.created_at,
        });
      } else {
        existing.count++;
      }
    }

    const assigned_students = (studentRows || []).map((s: { id: string; email: string; last_active: string | null }) => {
      const stats = studentSubmissionMap.get(s.id);
      return {
        id: s.id,
        email: s.email,
        last_active: s.last_active,
        total_submissions: stats?.count || 0,
        latest_sentiment: stats?.latestSentiment || null,
        latest_risk_level: stats?.latestRisk || null,
      };
    });

    const response: ApiResponse<MyStudentsTrendsResponse> = {
      success: true,
      data: {
        daily_summary,
        assigned_students,
        total_assigned_students: studentIds.length,
      },
    };

    res.status(200).json(response);
  } catch {
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
