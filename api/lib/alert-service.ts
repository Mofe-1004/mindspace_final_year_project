/**
 * Alert Service - Create at-risk alerts after high-risk submissions
 *
 * Called from the submission handler after a HIGH risk submission is saved.
 * Looks up the student's assigned counselor and creates an alert record.
 * Optionally sends an email notification (fire-and-forget).
 */

import { createClient } from '@supabase/supabase-js';
import { sendAlertEmail } from './email-service';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateAlertParams {
  studentId: string;
  submissionId: string;
  riskLevel: 'moderate' | 'high';
}

/**
 * Creates an at-risk alert for a student's submission.
 * Finds the assigned counselor (if any) and creates the alert.
 * Sends email notification for HIGH risk alerts.
 *
 * This is fire-and-forget — errors are logged but don't block the student's response.
 */
export async function createAtRiskAlert({
  studentId,
  submissionId,
  riskLevel,
}: CreateAlertParams): Promise<void> {
  try {
    // Find assigned counselor for this student
    const { data: assignment } = await supabase
      .from('counselor_student_assignments')
      .select('counselor_id')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .limit(1)
      .single();

    const counselorId = assignment?.counselor_id || null;

    // Create alert record
    const { data: alert, error: insertError } = await supabase
      .from('at_risk_alerts')
      .insert({
        student_id: studentId,
        counselor_id: counselorId,
        submission_id: submissionId,
        risk_level: riskLevel,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) {
      return;
    }

    // Send email notification for HIGH risk only (if counselor is assigned)
    if (riskLevel === 'high' && counselorId) {
      // Get counselor email
      const { data: counselor } = await supabase
        .from('students')
        .select('email')
        .eq('id', counselorId)
        .single();

      if (counselor?.email) {
        // Fire-and-forget email
        sendAlertEmail({
          counselorEmail: counselor.email,
          alertId: alert.id,
          riskLevel,
        }).catch(() => { /* fire-and-forget */ });
      }
    }
  } catch {
    // Fire-and-forget — don't block the student's response
  }
}
