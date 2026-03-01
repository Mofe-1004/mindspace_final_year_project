/**
 * Trends API - Get Aggregate Trends
 *
 * GET /api/trends/aggregate?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 *
 * Returns anonymized aggregate emotional trends for counselors.
 * Only accessible by users with role = 'counselor'.
 * Data comes from the emotional_trends table (K-anonymity >= 5).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  GetAggregateTrendsResponse,
  DailyTrendSummary,
  HourlyTrendDetail,
  ApiResponse,
  ErrorCode,
  ErrorMessages,
  Sentiment,
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
 * Main handler for GET /api/trends/aggregate
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
      sendError(res, 403, ErrorCode.FORBIDDEN, 'Only approved counselors can access trends');
      return;
    }

    // Parse date range (default: last 7 days)
    const today = new Date();
    const defaultStartDate = new Date(today);
    defaultStartDate.setDate(today.getDate() - 7);

    const startDate = req.query.start_date as string || defaultStartDate.toISOString().split('T')[0];
    const endDate = req.query.end_date as string || today.toISOString().split('T')[0];

    // Fetch hourly trend data
    const { data: hourlyData, error: fetchError } = await supabase
      .from('emotional_trends')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('hour', { ascending: true });

    if (fetchError) {
      sendError(res, 500, ErrorCode.DATABASE_ERROR);
      return;
    }

    const trends = hourlyData || [];

    // Transform to hourly details
    const hourlyDetails: HourlyTrendDetail[] = trends.map((t) => ({
      date: t.date,
      hour: t.hour,
      positive_count: t.positive_count,
      neutral_count: t.neutral_count,
      negative_count: t.negative_count,
      low_risk_count: t.low_risk_count,
      moderate_risk_count: t.moderate_risk_count,
      high_risk_count: t.high_risk_count,
      total_submissions: t.total_submissions,
    }));

    // Aggregate into daily summaries
    const dailyMap = new Map<string, {
      positive: number;
      neutral: number;
      negative: number;
      low: number;
      moderate: number;
      high: number;
      total: number;
    }>();

    for (const t of trends) {
      const existing = dailyMap.get(t.date) || {
        positive: 0, neutral: 0, negative: 0,
        low: 0, moderate: 0, high: 0, total: 0
      };

      dailyMap.set(t.date, {
        positive: existing.positive + t.positive_count,
        neutral: existing.neutral + t.neutral_count,
        negative: existing.negative + t.negative_count,
        low: existing.low + t.low_risk_count,
        moderate: existing.moderate + t.moderate_risk_count,
        high: existing.high + t.high_risk_count,
        total: existing.total + t.total_submissions,
      });
    }

    const dailySummary: DailyTrendSummary[] = Array.from(dailyMap.entries()).map(([date, data]) => {
      const total = data.total || 1; // Avoid division by zero
      return {
        date,
        positive_percentage: Math.round((data.positive / total) * 100),
        neutral_percentage: Math.round((data.neutral / total) * 100),
        negative_percentage: Math.round((data.negative / total) * 100),
        low_risk_percentage: Math.round((data.low / total) * 100),
        moderate_risk_percentage: Math.round((data.moderate / total) * 100),
        high_risk_percentage: Math.round((data.high / total) * 100),
        total_submissions: Math.round(data.total / 5) * 5, // Round to nearest 5 for privacy
      };
    });

    // Calculate overall stats
    let totalPositive = 0, totalNeutral = 0, totalNegative = 0;
    let totalLow = 0, totalModerate = 0, totalHigh = 0;
    let totalSubmissions = 0;

    for (const t of trends) {
      totalPositive += t.positive_count;
      totalNeutral += t.neutral_count;
      totalNegative += t.negative_count;
      totalLow += t.low_risk_count;
      totalModerate += t.moderate_risk_count;
      totalHigh += t.high_risk_count;
      totalSubmissions += t.total_submissions;
    }

    // Determine most common sentiment
    let mostCommonSentiment: Sentiment = Sentiment.NEUTRAL;
    if (totalPositive >= totalNeutral && totalPositive >= totalNegative) {
      mostCommonSentiment = Sentiment.POSITIVE;
    } else if (totalNegative >= totalPositive && totalNegative >= totalNeutral) {
      mostCommonSentiment = Sentiment.NEGATIVE;
    }

    // Calculate average risk level (1 = low, 2 = moderate, 3 = high)
    const totalRiskSubmissions = totalLow + totalModerate + totalHigh;
    const averageRiskLevel = totalRiskSubmissions > 0
      ? (totalLow * 1 + totalModerate * 2 + totalHigh * 3) / totalRiskSubmissions
      : 1.0;

    const response: ApiResponse<GetAggregateTrendsResponse> = {
      success: true,
      data: {
        daily_summary: dailySummary,
        hourly_details: hourlyDetails,
        overall_stats: {
          total_students_contributing: Math.round(totalSubmissions / 5) * 5, // Rounded for privacy
          most_common_sentiment: mostCommonSentiment,
          average_risk_level: Math.round(averageRiskLevel * 10) / 10,
        },
      },
    };

    res.status(200).json(response);
  } catch {
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
