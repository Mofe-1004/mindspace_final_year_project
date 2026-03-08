/**
 * My Counselor API - Returns the student's assigned counselor contact info
 *
 * GET /api/counselor/my-counselor
 *
 * Returns the counselor's email and phone number if the student
 * has been assigned to one. This allows students to reach out
 * to their counselor directly, not just during alert situations.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse, ErrorCode, ErrorMessages } from '../_types/shared';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    // Validate JWT
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 401, ErrorCode.UNAUTHORIZED);
      return;
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      sendError(res, 401, ErrorCode.UNAUTHORIZED);
      return;
    }

    // Find active counselor assignment for this student
    const { data: assignment, error: assignError } = await supabase
      .from('counselor_student_assignments')
      .select('counselor_id')
      .eq('student_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (assignError || !assignment) {
      // No counselor assigned — not an error, just empty
      res.status(200).json({
        success: true,
        data: { counselor: null },
      });
      return;
    }

    // Fetch counselor contact details
    const { data: counselor, error: counselorError } = await supabase
      .from('students')
      .select('email, phone_number, first_name, last_name')
      .eq('id', assignment.counselor_id)
      .single();

    if (counselorError || !counselor) {
      res.status(200).json({
        success: true,
        data: { counselor: null },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        counselor: {
          first_name: counselor.first_name || null,
          last_name: counselor.last_name || null,
          email: counselor.email,
          phone_number: counselor.phone_number || null,
        },
      },
    });
  } catch {
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
