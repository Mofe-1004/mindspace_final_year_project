/**
 * Admin API - Counselor-Student Assignments
 *
 * GET  /api/admin/assignments - List all assignments
 * POST /api/admin/assignments - Create assignments (assign students to a counselor)
 * DELETE /api/admin/assignments?id=xxx - Remove an assignment
 *
 * Only accessible by admins.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  AssignmentWithDetails,
  GetAssignmentsResponse,
  CreateAssignmentResponse,
  ApiResponse,
  ErrorCode,
  ErrorMessages,
  UserRole,
} from '../../types/shared';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const createAssignmentSchema = z.object({
  counselor_id: z.string().uuid('Invalid counselor ID'),
  student_ids: z.array(z.string().uuid()).min(1, 'At least one student required'),
});

async function validateToken(
  authHeader: string | undefined
): Promise<{ userId: string; email: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
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
  if (!['GET', 'POST', 'DELETE'].includes(req.method || '')) {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
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

    const isAdmin = await verifyAdminRole(auth.userId);
    if (!isAdmin) {
      sendError(res, 403, ErrorCode.FORBIDDEN, 'Only admins can manage assignments');
      return;
    }

    if (req.method === 'GET') {
      await handleGet(res);
    } else if (req.method === 'POST') {
      await handlePost(req, res, auth.userId);
    } else if (req.method === 'DELETE') {
      await handleDelete(req, res);
    }
  } catch {
    sendError(res, 500, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleGet(res: VercelResponse): Promise<void> {
  const { data: assignments, error } = await supabase
    .from('counselor_student_assignments')
    .select(`
      id,
      counselor_id,
      student_id,
      assigned_by,
      assigned_at,
      status,
      counselor:students!counselor_student_assignments_counselor_id_fkey (email),
      student:students!counselor_student_assignments_student_id_fkey (email)
    `)
    .eq('status', 'active')
    .order('assigned_at', { ascending: false });

  if (error) {
    sendError(res, 500, ErrorCode.DATABASE_ERROR);
    return;
  }

  const items: AssignmentWithDetails[] = (assignments || []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    counselor_id: a.counselor_id as string,
    counselor_email: ((a.counselor as Record<string, string> | null)?.email) || 'Unknown',
    student_id: a.student_id as string,
    student_email: ((a.student as Record<string, string> | null)?.email) || 'Unknown',
    assigned_by: a.assigned_by as string,
    assigned_at: a.assigned_at as string,
    status: a.status as 'active' | 'inactive',
  }));

  const response: ApiResponse<GetAssignmentsResponse> = {
    success: true,
    data: { assignments: items, total_count: items.length },
  };
  res.status(200).json(response);
}

async function handlePost(
  req: VercelRequest,
  res: VercelResponse,
  adminId: string
): Promise<void> {
  const parseResult = createAssignmentSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 400, ErrorCode.VALIDATION_ERROR, parseResult.error.errors[0]?.message);
    return;
  }

  const { counselor_id, student_ids } = parseResult.data;

  // Verify counselor exists and has counselor role
  const { data: counselor } = await supabase
    .from('students')
    .select('role')
    .eq('id', counselor_id)
    .single();

  if (!counselor || counselor.role !== UserRole.COUNSELOR) {
    sendError(res, 400, ErrorCode.VALIDATION_ERROR, 'Target user is not an approved counselor');
    return;
  }

  // Insert assignments, skipping duplicates
  let created = 0;
  let skipped = 0;

  for (const student_id of student_ids) {
    const { error } = await supabase
      .from('counselor_student_assignments')
      .insert({
        counselor_id,
        student_id,
        assigned_by: adminId,
      });

    if (error) {
      // Unique constraint violation or other insert error
      skipped++;
    } else {
      created++;
    }
  }

  const response: ApiResponse<CreateAssignmentResponse> = {
    success: true,
    data: {
      created,
      skipped,
      message: `${created} assignment(s) created, ${skipped} skipped (already assigned or invalid)`,
    },
  };
  res.status(201).json(response);
}

async function handleDelete(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const assignmentId = req.query.id as string;
  if (!assignmentId) {
    sendError(res, 400, ErrorCode.VALIDATION_ERROR, 'Assignment ID is required');
    return;
  }

  const { error } = await supabase
    .from('counselor_student_assignments')
    .update({ status: 'inactive' })
    .eq('id', assignmentId);

  if (error) {
    sendError(res, 500, ErrorCode.DATABASE_ERROR);
    return;
  }

  res.status(200).json({
    success: true,
    data: { message: 'Assignment deactivated' },
  });
}
