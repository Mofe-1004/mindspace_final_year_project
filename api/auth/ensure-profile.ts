/**
 * Auth API - Ensure Profile Exists
 *
 * POST /api/auth/ensure-profile
 *
 * Called after login to ensure the student record exists in the students table.
 * Uses the service role key to bypass RLS, solving the issue where the signup
 * insert fails because the user hasn't confirmed their email yet.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse, ErrorCode, ErrorMessages, UserRole } from '../_types/shared';

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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST requests are allowed' },
    });
    return;
  }

  try {
    // Validate the JWT token
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

    // Check if student record already exists
    const { data: existing } = await supabase
      .from('students')
      .select('id, role, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (existing) {
      // Already exists — return current role and name
      res.status(200).json({
        success: true,
        data: {
          role: existing.role,
          first_name: existing.first_name || null,
          last_name: existing.last_name || null,
          created: false,
        },
      });
      return;
    }

    // Create the student record using service role (bypasses RLS)
    const metadata = user.user_metadata || {};
    const email = user.email || '';
    const schoolDomain = metadata.school_domain || email.split('@')[1] || 'unknown';
    const role = metadata.role || UserRole.STUDENT;

    const phoneNumber = metadata.phone_number || null;
    const firstName = metadata.first_name || null;
    const lastName = metadata.last_name || null;

    const { error: insertError } = await supabase.from('students').insert({
      id: user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      school_domain: schoolDomain,
      role,
      email_verified: true,
    });

    if (insertError) {
      sendError(res, 500, ErrorCode.DATABASE_ERROR, 'Failed to create user profile');
      return;
    }

    // If pending counselor, also create approval request
    if (role === UserRole.PENDING_COUNSELOR) {
      const { error: approvalError } = await supabase
        .from('counselor_approvals')
        .insert({ user_id: user.id, status: 'pending' });

      if (approvalError) {
        // Non-critical — profile was created, approval request failed
      }
    }

    res.status(201).json({
      success: true,
      data: { role, first_name: firstName, last_name: lastName, created: true },
    });
  } catch {
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
