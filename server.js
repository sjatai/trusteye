import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Configuration - use environment variables
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL || '';
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'test@example.com';

// Mock Database
const mockData = {
  audiences: [
    { 
      id: '1', 
      name: 'Inactive 30 Days', 
      count: 81704, 
      description: 'Users who haven\'t logged in for 30+ days',
      filters: [
        { field: 'last_login', operator: '>', value: 30 }
      ]
    },
    { 
      id: '2', 
      name: 'Inactive 60 Days', 
      count: 12431, 
      description: 'Users who haven\'t logged in for 60+ days',
      filters: [
        { field: 'last_login', operator: '>', value: 60 }
      ]
    },
    { 
      id: '3', 
      name: 'High-Value Dormant', 
      count: 3241, 
      description: 'Previously active users with $500+ LTV',
      filters: [
        { field: 'ltv', operator: '>=', value: 500 },
        { field: 'last_login', operator: '>', value: 30 }
      ]
    },
    {
      id: '4',
      name: 'Trial Users - Day 3',
      count: 5832,
      description: 'Users on day 3 of trial period',
      filters: [
        { field: 'trial_day', operator: '=', value: 3 }
      ]
    }
  ],
  campaigns: []
};

// API Routes

// Get audiences
app.get('/api/audiences', (req, res) => {
  res.json(mockData.audiences);
});

// Create campaign
app.post('/api/campaigns', (req, res) => {
  const campaign = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date(),
    status: 'draft'
  };
  
  mockData.campaigns.push(campaign);
  res.json(campaign);
});

// Send test email (via Resend)
app.post('/api/send-email', async (req, res) => {
  const { subject, body, audience } = req.body;
  
  try {
    // For demo purposes, we'll use a simple HTML email
    // In production, you'd use Resend API with proper API key
    
    console.log('📧 EMAIL WOULD BE SENT:');
    console.log('To:', DEMO_EMAIL);
    console.log('Subject:', subject);
    console.log('Audience:', audience?.name, '-', audience?.count, 'users');
    
    // Send Slack notification
    await sendSlackNotification({
      text: `🎯 Campaign Test Sent!`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Campaign Test Sent Successfully* ✅\n\n*Subject:* ${subject}\n*Audience:* ${audience?.name} (${audience?.count?.toLocaleString()} users)\n*To:* ${DEMO_EMAIL}`
          }
        }
      ]
    });
    
    res.json({ 
      success: true, 
      message: 'Test email sent successfully',
      recipients: 1,
      audience: audience?.count 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send Slack notification
async function sendSlackNotification(payload) {
  try {
    await axios.post(SLACK_WEBHOOK, payload);
    console.log('✅ Slack notification sent');
  } catch (error) {
    console.error('❌ Slack notification failed:', error.message);
    throw error;
  }
}

// Schedule campaign
app.post('/api/campaigns/:id/schedule', async (req, res) => {
  const { id } = req.params;
  const { scheduledFor } = req.body;
  
  const campaign = mockData.campaigns.find(c => c.id === id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  
  campaign.status = 'scheduled';
  campaign.scheduledFor = scheduledFor;
  
  // Send Slack notification
  await sendSlackNotification({
    text: `📅 Campaign Scheduled: ${campaign.name}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Campaign Scheduled* 📅\n\n*Name:* ${campaign.name}\n*Audience:* ${campaign.audience?.count?.toLocaleString()} users\n*Scheduled for:* ${new Date(scheduledFor).toLocaleString()}`
        }
      }
    ]
  });
  
  res.json(campaign);
});

// Create automation
app.post('/api/automations', async (req, res) => {
  const { trigger, actions, name } = req.body;
  
  const automation = {
    id: Date.now().toString(),
    name,
    trigger,
    actions,
    createdAt: new Date(),
    status: 'active'
  };
  
  // Send Slack notification
  await sendSlackNotification({
    text: `⚡ Automation Created: ${name}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Automation Created* ⚡\n\n*Name:* ${name}\n*Trigger:* ${trigger}\n*Actions:* ${actions.length} step(s)\n*Status:* Active`
        }
      }
    ]
  });
  
  res.json(automation);
});

// Generate content (mock AI generation)
app.post('/api/generate-content', (req, res) => {
  const { campaignType, audience } = req.body;
  
  // Mock content generation
  const content = {
    subject: "We've missed you at KQ! Here's what's new 🎉",
    previewText: "Exclusive features waiting for you + special welcome-back offer",
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f766e 0%, #10b981 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome Back! 👋</h1>
        </div>
        
        <div style="padding: 40px; background: white;">
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">Hi there,</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            It's been a while since you logged into KQ. We wanted to personally reach out and share some exciting updates:
          </p>
          
          <div style="background: #f0fdfa; border-left: 4px solid #0f766e; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 12px 0; color: #0f766e;">🚀 What's New</h3>
            <ul style="margin: 0; padding-left: 20px; color: #374151;">
              <li style="margin-bottom: 8px;"><strong>AI Studio:</strong> Create campaigns with natural language</li>
              <li style="margin-bottom: 8px;"><strong>Smart Segmentation:</strong> Dynamic audience builder</li>
              <li style="margin-bottom: 8px;"><strong>Multi-channel Automation:</strong> Email, Slack, SMS in one place</li>
            </ul>
          </div>
          
          <div style="background: #fff7ed; border: 2px dashed #f59e0b; padding: 20px; margin: 24px 0; text-align: center; border-radius: 8px;">
            <p style="font-size: 18px; font-weight: bold; color: #92400e; margin: 0 0 8px 0;">
              🎁 Special Offer Just for You
            </p>
            <p style="font-size: 24px; font-weight: bold; color: #ea580c; margin: 0;">
              30% OFF Your Next Month
            </p>
            <p style="font-size: 14px; color: #92400e; margin: 8px 0 0 0;">
              Return this week to claim your discount
            </p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="#" style="display: inline-block; background: #0f766e; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Explore What's New →
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            We'd love to have you back,<br/>
            <strong>The KQ Team</strong>
          </p>
        </div>
      </div>
    `,
    generatedAt: new Date()
  };
  
  res.json(content);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 KQ Studio Backend running on http://localhost:${PORT}`);
  console.log(`📧 Demo email: ${DEMO_EMAIL}`);
  console.log(`💬 Slack webhook configured`);
});
