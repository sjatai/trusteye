import { Resend } from 'resend';
import { withFailsafe } from '../utils/failsafe';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface CampaignEmailPayload {
  campaignId: string;
  campaignName: string;
  recipients: string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

// Send a single email
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const defaultFrom = process.env.EMAIL_FROM || 'TrustEye <notifications@trusteye.ai>';
    const emailOptions: any = {
      from: payload.from || defaultFrom,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
    };

    if (payload.html) emailOptions.html = payload.html;
    if (payload.text) emailOptions.text = payload.text;
    if (payload.replyTo) emailOptions.reply_to = payload.replyTo;
    if (payload.tags) emailOptions.tags = payload.tags;

    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error(`❌ Email failed: ${error.message}`);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email sent: ${(data as any)?.id}`);
    return { success: true, id: (data as any)?.id };
  } catch (err: any) {
    console.error(`❌ Email error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Send campaign emails to multiple recipients
export async function sendCampaignEmails(payload: CampaignEmailPayload): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [] as string[]
  };

  // Send to each recipient (in batches for production)
  for (const recipient of payload.recipients) {
    const emailResult = await sendEmail({
      to: recipient,
      subject: payload.subject,
      html: payload.htmlContent,
      text: payload.textContent,
      tags: [
        { name: 'campaign_id', value: payload.campaignId },
        { name: 'campaign_name', value: payload.campaignName }
      ]
    });

    if (emailResult.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push(`${recipient}: ${emailResult.error}`);
    }
  }

  results.success = results.failed === 0;

  console.log(`📧 Campaign emails: ${results.sent} sent, ${results.failed} failed`);

  return results;
}

// Send test email
export async function sendTestEmail(to: string, campaignName: string): Promise<{ success: boolean; id?: string; error?: string }> {
  return sendEmail({
    to,
    subject: `[TEST] ${campaignName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Test Email</h1>
        <p>This is a test email for campaign: <strong>${campaignName}</strong></p>
        <p>If you received this, the email integration is working correctly.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Sent by TrustEye</p>
      </div>
    `,
    text: `Test Email\n\nThis is a test email for campaign: ${campaignName}\n\nIf you received this, the email integration is working correctly.\n\nSent by TrustEye`
  });
}

// Generate campaign email HTML from template
export function generateCampaignEmailHtml(params: {
  campaignType: string;
  businessName: string;
  headline: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
}): string {
  const colors = {
    'win-back': { primary: '#FF6B35', accent: '#FFF0EB' },
    'promotional': { primary: '#3B82F6', accent: '#EFF6FF' },
    'product-launch': { primary: '#8B5CF6', accent: '#F5F3FF' },
    'referral': { primary: '#10B981', accent: '#ECFDF5' },
    'review': { primary: '#F59E0B', accent: '#FFFBEB' }
  };

  const color = colors[params.campaignType as keyof typeof colors] || colors.promotional;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: ${color.primary}; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${params.businessName}</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 22px;">${params.headline}</h2>
                  <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 30px 0;">${params.body}</p>
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${params.ctaUrl}" style="display: inline-block; background-color: ${color.primary}; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold;">${params.ctaText}</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: ${color.accent}; padding: 20px 30px; text-align: center;">
                  <p style="color: #666; font-size: 12px; margin: 0;">
                    © 2026 ${params.businessName}. All rights reserved.<br>
                    <a href="#" style="color: ${color.primary};">Unsubscribe</a> | <a href="#" style="color: ${color.primary};">Privacy Policy</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export default {
  sendEmail,
  sendCampaignEmails,
  sendTestEmail,
  generateCampaignEmailHtml
};
