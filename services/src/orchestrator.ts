import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Campaign Orchestrator - Core orchestration engine
 */
export class CampaignOrchestrator {
  private anthropic: Anthropic;
  private resend: Resend;
  
  constructor() {
    // Initialize services in constructor (after env loaded)
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    this.resend = new Resend(process.env.RESEND_API_KEY);
    
    console.log('✅ Orchestrator initialized');
    console.log('  Anthropic API:', process.env.ANTHROPIC_API_KEY?.substring(0, 20) + '...');
    console.log('  Resend API:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
  }
  
  /**
   * Step 1: Get brand context from knowledge base
   */
  async getKnowledgeContext(): Promise<string> {
    console.log('📚 Retrieving brand knowledge...');
    
    // Read brand knowledge files
    const knowledgePath = path.join(__dirname, '../../brand-knowledge');
    const brandVoice = await fs.readFile(path.join(knowledgePath, 'brand-voice.md'), 'utf-8');
    const pastCampaigns = await fs.readFile(path.join(knowledgePath, 'past-campaigns.md'), 'utf-8');
    
    return `${brandVoice}\n\n${pastCampaigns}`;
  }
  
  /**
   * Step 2: Generate AI content (grounded in brand)
   */
  async generateContent(goal: string, segment: any): Promise<any> {
    console.log('✨ Generating content with Claude...');
    
    const context = await this.getKnowledgeContext();
    
    const prompt = `${context}

TASK: Create a win-back email campaign.
AUDIENCE: ${segment.count} inactive premium customers.

Write email matching StyleFit brand voice. Include subject, body (under 150 words), CTA, and offer code.

Return JSON: {"subject": "...", "body": "...", "cta": "...", "offerCode": "..."}`;

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });
    
    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  }
  
  /**
   * Step 3: Execute campaign
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
        html: `<div style="padding: 20px;">${content.body.replace(/\n/g, '<br>')}</div><a href="#" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; margin-top: 20px;">${content.cta}</a>`
      });
      console.log('✅ Email sent:', emailResult);
      results.email = emailResult;
    } catch (error) {
      console.error('❌ Email error:', error);
      results.email = { error: String(error) };
    }
    
    // Post to Slack
    try {
      console.log('💬 Posting to Slack...');
      console.log('Webhook URL:', process.env.SLACK_WEBHOOK_URL?.substring(0, 50) + '...');
      const slackResult = await axios.post(process.env.SLACK_WEBHOOK_URL!, {
        text: `🎯 Campaign launched to ${segment.count} customers!\n\nSubject: ${content.subject}\nOffer: ${content.offerCode}`
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
    const segment = { id: 'inactive-premium', name: 'Inactive Premium', count: 847 };
    const content = await this.generateContent(goal, segment);
    const results = await this.executeCampaign(content, segment);
    
    return { segment, content, results };
  }
}
