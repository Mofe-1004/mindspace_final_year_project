/**
 * Email Service - Send alert notifications via Resend
 *
 * Sends email notifications to counselors when high-risk submissions
 * are detected. Uses Resend (free tier: 100 emails/day).
 *
 * PRIVACY: Emails contain NO student names, submission text, or
 * identifying details — only a prompt to check the dashboard.
 */

interface SendAlertEmailParams {
  counselorEmail: string;
  alertId: string;
  riskLevel: 'moderate' | 'high';
}

/**
 * Sends an alert notification email to a counselor.
 * Fire-and-forget — errors don't block the caller.
 */
export async function sendAlertEmail({
  counselorEmail,
  alertId,
  riskLevel,
}: SendAlertEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.APP_URL;

  if (!apiKey) {
    return false;
  }

  if (!appUrl) {
    return false;
  }

  const urgency = riskLevel === 'high' ? 'urgent' : 'important';
  const subject = riskLevel === 'high'
    ? 'MindSpace Alert: High-Risk Student Submission'
    : 'MindSpace Notice: Moderate-Risk Student Submission';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'MindSpace Alerts <onboarding@resend.dev>',
        to: [counselorEmail],
        subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${riskLevel === 'high' ? '#dc2626' : '#d97706'};">
              ${riskLevel === 'high' ? 'High-Risk' : 'Moderate-Risk'} Alert
            </h2>
            <p>A student in your care has submitted an entry flagged as <strong>${urgency}</strong>.</p>
            <p>Please check your MindSpace counselor dashboard to review and acknowledge this alert.</p>
            <p style="margin-top: 24px;">
              <a href="${appUrl}/counselor"
                 style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Open Dashboard
              </a>
            </p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
              Alert ID: ${alertId}<br/>
              This email contains no student-identifying information for privacy protection.
            </p>
          </div>
        `,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
