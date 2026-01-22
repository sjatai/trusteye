import { Router, Request, Response } from 'express';
import { supabase } from '../services/db';
import { asyncHandler } from '../middleware/errorHandler';
import { Campaign, ApiResponse, ReviewResult, GateResult } from '../types';
import { sendCampaignApprovalRequest } from '../services/slack';
import { sendEmail, generateCampaignEmailHtml } from '../services/resend';
import { runGuardrails } from '../services/guardrailRunner';
import cache from '../services/cache';

const router = Router();

// POST /api/campaigns/test-email - Send test email
router.post('/test-email', asyncHandler(async (req: Request, res: Response) => {
  const { to, subject, message } = req.body;

  const testEmail = to || process.env.TEST_EMAIL || 'test@example.com';

  const result = await sendEmail({
    to: testEmail,
    subject: subject || 'TrustEye Test Email',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #1B3A6D;">TrustEye Test Email</h1>
        <p>${message || 'This is a test email from TrustEye. If you received this, email is working correctly!'}</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Sent from TrustEye at ${new Date().toISOString()}</p>
      </div>
    `,
    text: message || 'This is a test email from TrustEye.'
  });

  if (result.success) {
    console.log(`✅ Test email sent to ${testEmail}`);
  } else {
    console.error(`❌ Test email failed: ${result.error}`);
  }

  res.json({
    success: result.success,
    data: {
      to: testEmail,
      emailId: result.id,
      error: result.error
    },
    message: result.success ? 'Test email sent successfully' : `Email failed: ${result.error}`
  });
}));

// GET /api/campaigns - List all campaigns
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { status, type, limit = 50 } = req.query;

  // Check cache first (30 second TTL for campaign list)
  const cacheKey = 'campaigns:list';
  const cacheParams = { status, type, limit };
  const cached = cache.api.get(cacheKey, cacheParams);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  let query = supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Number(limit));

  if (status) {
    query = query.eq('status', status);
  }
  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  const response = {
    success: true,
    data
  } as ApiResponse<Campaign[]>;

  // Cache the response (30 second TTL)
  cache.api.set(cacheKey, cacheParams, response, 30000);
  res.setHeader('X-Cache', 'MISS');

  res.json(response);
}));

// GET /api/campaigns/:id - Get single campaign
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(404).json({
      success: false,
      error: 'Campaign not found'
    } as ApiResponse<null>);
  }

  res.json({
    success: true,
    data
  } as ApiResponse<Campaign>);
}));

// POST /api/campaigns - Create campaign
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, type, channels, audience_id, content, schedule } = req.body;

  if (!name || !type) {
    return res.status(400).json({
      success: false,
      error: 'Name and type are required'
    } as ApiResponse<null>);
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      name,
      type,
      channels: channels || [],
      audience_id,
      content: content || {},
      schedule: schedule || {},
      status: 'draft'
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  console.log(`✅ Campaign created: ${data.id} - ${name}`);

  // Invalidate campaign list cache
  cache.api.invalidate('campaigns:list');

  res.status(201).json({
    success: true,
    data,
    message: 'Campaign created successfully'
  } as ApiResponse<Campaign>);
}));

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  // Remove fields that shouldn't be updated directly
  delete updates.id;
  delete updates.created_at;

  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  console.log(`✅ Campaign updated: ${id}`);

  // Invalidate campaign list cache
  cache.api.invalidate('campaigns:list');

  res.json({
    success: true,
    data,
    message: 'Campaign updated successfully'
  } as ApiResponse<Campaign>);
}));

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  console.log(`✅ Campaign deleted: ${id}`);

  // Invalidate campaign list cache
  cache.api.invalidate('campaigns:list');

  res.json({
    success: true,
    message: 'Campaign deleted successfully'
  } as ApiResponse<null>);
}));

// POST /api/campaigns/:id/review - Submit campaign for 3-gate review
router.post('/:id/review', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Get the campaign
  const { data: campaign, error: fetchError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !campaign) {
    return res.status(404).json({
      success: false,
      error: 'Campaign not found'
    } as ApiResponse<null>);
  }

  const gateResults: GateResult[] = [];

  // Gate 1: Rules Validation (automated, instant)
  const gate1: GateResult = {
    gate: 1,
    passed: true,
    details: {
      checks: {},
      errors: [] as string[]
    },
    timestamp: new Date().toISOString()
  };

  // Check required fields
  if (!campaign.name) {
    gate1.passed = false;
    gate1.details.errors.push('Campaign name is required');
  }
  if (!campaign.channels || campaign.channels.length === 0) {
    gate1.passed = false;
    gate1.details.errors.push('At least one channel is required');
  }

  gate1.details.checks = {
    hasName: !!campaign.name,
    hasChannels: campaign.channels?.length > 0,
    hasContent: Object.keys(campaign.content || {}).length > 0
  };

  // Run content guardrails (profanity, explicit content, etc.)
  const content = campaign.content || {};
  const contentText = [
    content.subject || '',
    content.body || '',
    content.cta || ''
  ].filter(Boolean).join('\n\n');

  if (contentText) {
    const guardrailReport = runGuardrails(contentText, {
      brandId: 'premier-nissan',
      type: 'email',
      bannedWords: ['sex', 'sexy'] // Custom banned words from rules
    });

    // Add any blocking violations to errors
    if (guardrailReport.blockers.length > 0) {
      gate1.passed = false;
      guardrailReport.blockers.forEach((blocker: string) => {
        gate1.details.errors.push(`Content blocked: ${blocker}`);
      });
    }

    // Include warnings in details
    gate1.details.guardrailWarnings = guardrailReport.warnings;
    gate1.details.guardrailBlockers = guardrailReport.blockers;
  }

  // Set error message if failed
  if (!gate1.passed && gate1.details.errors.length > 0) {
    gate1.details.error = gate1.details.errors.join('; ');
  }

  gateResults.push(gate1);

  // Gate 2: AI Review (placeholder - will be handled by Intelligence Agent)
  const gate2: GateResult = {
    gate: 2,
    passed: gate1.passed, // Only run if Gate 1 passed
    details: {
      brandScore: 94,
      toneCheck: 'professional',
      riskLevel: 'low'
    },
    timestamp: new Date().toISOString()
  };
  gateResults.push(gate2);

  // Gate 3: Human Approval (triggered via Slack)
  const gate3: GateResult = {
    gate: 3,
    passed: false, // Pending human approval
    details: {
      status: 'pending_approval',
      notificationSent: false
    },
    timestamp: new Date().toISOString()
  };

  // If Gates 1 & 2 pass, send Slack notification for Gate 3
  if (gate1.passed && gate2.passed) {
    // Send actual Slack notification
    const slackSent = await sendCampaignApprovalRequest({
      campaignId: id,
      campaignName: campaign.name,
      campaignType: campaign.type || 'general',
      audienceSize: campaign.audience_id ? 100 : 0, // TODO: Get actual count
      channels: campaign.channels || [],
      gate1Passed: gate1.passed,
      gate2Passed: gate2.passed,
      brandScore: gate2.details.brandScore as number
    });
    gate3.details.notificationSent = slackSent;
    gate3.details.status = slackSent ? 'awaiting_approval' : 'notification_failed';
    console.log(`📤 Slack notification ${slackSent ? 'sent' : 'failed'} for campaign: ${id}`);
  }

  gateResults.push(gate3);

  // Update campaign with gate results
  const { error: updateError } = await supabase
    .from('campaigns')
    .update({
      gate_results: gateResults,
      status: gate1.passed && gate2.passed ? 'scheduled' : 'draft'
    })
    .eq('id', id);

  if (updateError) {
    console.error('Failed to update campaign with gate results:', updateError);
  }

  const result: ReviewResult = {
    campaign_id: id,
    gates: gateResults,
    overall_passed: gate1.passed && gate2.passed,
    brand_score: gate2.details.brandScore as number,
    risk_level: gate2.details.riskLevel as 'low' | 'medium' | 'high'
  };

  console.log(`✅ Campaign review completed: ${id} - Gates passed: ${result.overall_passed}`);

  res.json({
    success: true,
    data: result
  } as ApiResponse<ReviewResult>);
}));

// POST /api/campaigns/:id/execute - Execute campaign (send emails, etc.)
router.post('/:id/execute', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Get the campaign
  const { data: campaign, error: fetchError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !campaign) {
    return res.status(404).json({
      success: false,
      error: 'Campaign not found'
    } as ApiResponse<null>);
  }

  // Check if campaign can be executed
  if (campaign.status !== 'scheduled') {
    return res.status(400).json({
      success: false,
      error: 'Campaign must be in scheduled status to execute'
    } as ApiResponse<null>);
  }

  // Update status to running
  await supabase
    .from('campaigns')
    .update({ status: 'running' })
    .eq('id', id);

  // Log the execution event
  await supabase
    .from('campaign_events')
    .insert({
      campaign_id: id,
      event_type: 'execution_started',
      event_data: {
        channels: campaign.channels,
        started_at: new Date().toISOString()
      }
    });

  // Send actual emails via Resend if email channel is enabled
  let emailResult = null;
  if (campaign.channels?.includes('email')) {
    const content = campaign.content || {};
    const htmlContent = generateCampaignEmailHtml({
      campaignType: campaign.type || 'promotional',
      businessName: 'Premier Nissan',
      headline: content.subject || campaign.name,
      body: content.body || 'Thank you for being a valued customer.',
      ctaText: content.cta || 'Learn More',
      ctaUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
    });

    // For demo, send to a test email (configured in env or default)
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    emailResult = await sendEmail({
      to: testEmail,
      subject: content.subject || `[Campaign] ${campaign.name}`,
      html: htmlContent
    });

    console.log(`📧 Email ${emailResult.success ? 'sent' : 'failed'}: ${emailResult.id || emailResult.error}`);
  }

  const executionResult = {
    campaign_id: id,
    status: 'running',
    channels_triggered: campaign.channels,
    started_at: new Date().toISOString(),
    email_id: emailResult?.id || null,
    email_sent: emailResult?.success || false
  };

  console.log(`🚀 Campaign execution started: ${id}`);

  res.json({
    success: true,
    data: executionResult,
    message: 'Campaign execution started'
  } as ApiResponse<typeof executionResult>);
}));

// POST /api/campaigns/:id/pause - Pause running campaign
router.post('/:id/pause', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('campaigns')
    .update({ status: 'paused' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  console.log(`⏸️ Campaign paused: ${id}`);

  // Invalidate campaign list cache
  cache.api.invalidate('campaigns:list');

  res.json({
    success: true,
    data,
    message: 'Campaign paused'
  } as ApiResponse<Campaign>);
}));

// POST /api/campaigns/:id/resume - Resume paused campaign
router.post('/:id/resume', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('campaigns')
    .update({ status: 'running' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  console.log(`▶️ Campaign resumed: ${id}`);

  // Invalidate campaign list cache
  cache.api.invalidate('campaigns:list');

  res.json({
    success: true,
    data,
    message: 'Campaign resumed'
  } as ApiResponse<Campaign>);
}));

// POST /api/campaigns/slack/approval - Handle Slack approval button response
router.post('/slack/approval', asyncHandler(async (req: Request, res: Response) => {
  const { action, campaign_id, user } = req.body;

  if (!campaign_id || !action) {
    return res.status(400).json({
      success: false,
      error: 'campaign_id and action are required'
    } as ApiResponse<null>);
  }

  const validActions = ['approve', 'reject'];
  if (!validActions.includes(action)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid action. Must be approve or reject'
    } as ApiResponse<null>);
  }

  // Get campaign
  const { data: campaign, error: fetchError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaign_id)
    .single();

  if (fetchError || !campaign) {
    return res.status(404).json({
      success: false,
      error: 'Campaign not found'
    } as ApiResponse<null>);
  }

  // Update campaign status based on action
  const newStatus = action === 'approve' ? 'scheduled' : 'draft';
  const gateResults = campaign.gate_results || [];

  // Update Gate 3 result
  const gate3Index = gateResults.findIndex((g: any) => g.gate === 3);
  if (gate3Index >= 0) {
    gateResults[gate3Index] = {
      ...gateResults[gate3Index],
      passed: action === 'approve',
      details: {
        status: action === 'approve' ? 'approved' : 'rejected',
        approvedBy: user || 'unknown',
        approvedAt: new Date().toISOString()
      }
    };
  }

  const { data, error } = await supabase
    .from('campaigns')
    .update({
      status: newStatus,
      gate_results: gateResults
    })
    .eq('id', campaign_id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  console.log(`✅ Campaign ${action}d via Slack: ${campaign_id} by ${user || 'unknown'}`);

  res.json({
    success: true,
    data,
    message: `Campaign ${action}d successfully`
  } as ApiResponse<Campaign>);
}));

// POST /api/campaigns/webhook/birdeye - Handle Birdeye review webhook
router.post('/webhook/birdeye', asyncHandler(async (req: Request, res: Response) => {
  const { review, business_id, event_type } = req.body;

  console.log(`📥 Birdeye webhook received: ${event_type}`);

  if (event_type !== 'review.created' && event_type !== 'review.updated') {
    return res.json({ success: true, message: 'Event type ignored' });
  }

  if (!review) {
    return res.status(400).json({
      success: false,
      error: 'Review data is required'
    } as ApiResponse<null>);
  }

  const { rating, reviewer_name, content } = review;

  // Log the review event
  await supabase
    .from('campaign_events')
    .insert({
      campaign_id: null,
      event_type: 'birdeye_review',
      event_data: {
        business_id,
        rating,
        reviewer_name,
        content,
        received_at: new Date().toISOString()
      }
    });

  // Trigger actions based on rating
  let suggestion = null;

  if (rating >= 4) {
    // Positive review - suggest referral campaign
    suggestion = {
      type: 'referral',
      trigger: 'positive_review',
      customer: reviewer_name,
      rating,
      message: `${reviewer_name} left a ${rating}-star review. Consider a referral campaign.`
    };
    console.log(`⭐ Positive review (${rating} stars) - Referral campaign suggested`);
  } else if (rating <= 2) {
    // Negative review - alert for recovery
    suggestion = {
      type: 'recovery',
      trigger: 'negative_review',
      customer: reviewer_name,
      rating,
      message: `${reviewer_name} left a ${rating}-star review. Consider a recovery outreach.`
    };
    console.log(`⚠️ Negative review (${rating} stars) - Recovery action suggested`);
  }

  res.json({
    success: true,
    data: {
      received: true,
      rating,
      suggestion
    },
    message: 'Webhook processed successfully'
  });
}));

export default router;
