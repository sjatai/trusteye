import { Resend } from 'resend';
import axios from 'axios';

/**
 * Campaign Orchestrator - Mock version (no API calls)
 */
export class CampaignOrchestrator {
  private resend: Resend;
  
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Orchestrator initialized (MOCK MODE - no AI API calls)');
  }
  
  /**
   * Generate mock content (pre-written, brand-aligned)
   */
  async generateContent(goal: string, segment: any): Promise<any> {
    console.log('✨ Generating content (using mock data)...');
    
    // Pre-written, on-brand content
    return {
      subject: "We miss you at StyleFit ✨",
      body: `Hey there,

It's been a while since you shopped with us, and we wanted to reach out personally.

We've been busy designing some of our best pieces yet—think buttery-soft leggings, breathable tops, and versatile layers that take you from studio to street. All made with our signature sustainable materials.

As a welcome back gift, here's 25% off your next purchase.

Whether you're crushing a new PR or embracing a rest day, we've got you covered.

Stay strong,
The StyleFit Team

P.S. This offer expires in 7 days—don't miss out!`,
      cta: "Shop New Arrivals →",
      offerCode: "WELCOME25"
    };
  }
  
  /**
   * Execute campaign
   */
  async executeCampaign(content: any, segment: any): Promise<any> {
    console.log('🚀 Launching campaign...');
    console.log('Content:', JSON.stringify(content, null, 2));
    
    const results: any = {};
    
    // Send email
    try {
      console.log('📧 Sending email to sumitjain@gmail.com...');
      const emailResult = await this.resend.emails.send({
        from: 'StyleFit <onboarding@resend.dev>',
        to: ['sumitjain@gmail.com'],
        subject: content.subject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">StyleFit Athletic</h1>
            </div>
            
            <div style="padding: 40px; background: white;">
              <div style="color: #333; line-height: 1.8; white-space: pre-line; font-size: 16px;">
${content.body}
              </div>
              
              <div style="margin: 40px 0; text-align: center;">
                <a href="https://demo.stylefit.com?code=${content.offerCode}" 
                   style="background: #667eea; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
                  ${content.cta}
                </a>
              </div>
              
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #eee; color: #999; font-size: 13px;">
                <p><strong>Campaign Details:</strong></p>
                <p>Segment: ${segment.name} (${segment.count.toLocaleString()} customers)</p>
                <p>Offer Code: <strong>${content.offerCode}</strong></p>
                <p>Valid for 7 days</p>
              </div>
            </div>
          </div>
        `
      });
      console.log('✅ Email sent:', (emailResult.data as any)?.id);
      results.email = emailResult;
    } catch (error) {
      console.error('❌ Email error:', error);
      results.email = { error: String(error) };
    }
    
    // Post to Slack
    try {
      console.log('💬 Posting to Slack...');
      const slackResult = await axios.post(process.env.SLACK_WEBHOOK_URL!, {
        text: `🎯 *Campaign Launched: Win-Back Premium Customers*`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎯 Campaign Launched!'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Campaign:*\nWin-Back Premium Customers`
              },
              {
                type: 'mrkdwn',
                text: `*Audience:*\n${segment.count.toLocaleString()} customers`
              },
              {
                type: 'mrkdwn',
                text: `*Subject:*\n${content.subject}`
              },
              {
                type: 'mrkdwn',
                text: `*Offer:*\n${content.offerCode} - 25% off`
              },
              {
                type: 'mrkdwn',
                text: `*Expected Revenue:*\n$15,400`
              },
              {
                type: 'mrkdwn',
                text: `*Projected ROI:*\n7.3x`
              }
            ]
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Sent via KQ Studio • ${new Date().toLocaleString()}`
              }
            ]
          }
        ]
      });
      console.log('✅ Slack sent:', slackResult.status);
      results.slack = 'sent';
    } catch (error: any) {
      console.error('❌ Slack error:', error.response?.data || error.message);
      results.slack = { error: String(error) };
    }
    
    return results;
  }
  
  async createCampaign(goal: string) {
    const segment = { 
      id: 'inactive-premium', 
      name: 'Inactive Premium Customers', 
      count: 847 
    };
    
    const content = await this.generateContent(goal, segment);
    const results = await this.executeCampaign(content, segment);
    
    return { segment, content, results };
  }
}
