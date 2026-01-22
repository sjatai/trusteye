import axios from 'axios';
import { withFailsafe } from '../utils/failsafe';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export interface SlackMessage {
  text?: string;
  blocks?: any[];
  attachments?: any[];
}

export interface CampaignApprovalPayload {
  campaignId: string;
  campaignName: string;
  campaignType: string;
  audienceSize: number;
  channels: string[];
  gate1Passed: boolean;
  gate2Passed: boolean;
  brandScore: number;
  predictions?: {
    openRate?: number;
    revenue?: number;
  };
}

// Send a simple text message to Slack
export async function sendSlackMessage(text: string): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    console.error('SLACK_WEBHOOK_URL not configured');
    return false;
  }

  const result = await withFailsafe(
    'slack_message',
    async () => {
      const response = await axios.post(SLACK_WEBHOOK_URL, { text });
      return response.status === 200;
    },
    false
  );

  if (result.data) {
    console.log('✅ Slack message sent');
  }

  return result.data;
}

// Send campaign approval request with rich formatting
export async function sendCampaignApprovalRequest(payload: CampaignApprovalPayload): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    console.error('SLACK_WEBHOOK_URL not configured');
    return false;
  }

  const message: SlackMessage = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔔 Campaign Approval Request',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Campaign:*\n${payload.campaignName}`
          },
          {
            type: 'mrkdwn',
            text: `*Type:*\n${payload.campaignType}`
          },
          {
            type: 'mrkdwn',
            text: `*Audience:*\n${payload.audienceSize.toLocaleString()} customers`
          },
          {
            type: 'mrkdwn',
            text: `*Channels:*\n${payload.channels.join(', ')}`
          }
        ]
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Gate 1 (Rules):* ${payload.gate1Passed ? '✓ Passed' : '✗ Failed'}`
          },
          {
            type: 'mrkdwn',
            text: `*Gate 2 (AI):* ${payload.gate2Passed ? `✓ ${payload.brandScore}% brand score` : '✗ Failed'}`
          }
        ]
      }
    ]
  };

  // Add predictions if available
  if (payload.predictions) {
    message.blocks!.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Predictions:*\n• Open rate: ${payload.predictions.openRate || 'N/A'}%\n• Estimated revenue: $${(payload.predictions.revenue || 0).toLocaleString()}`
      }
    });
  }

  // Add action buttons
  message.blocks!.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '👀 Preview',
          emoji: true
        },
        url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/campaigns/${payload.campaignId}`
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '✅ Approve',
          emoji: true
        },
        style: 'primary',
        value: `approve_${payload.campaignId}`
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '❌ Reject',
          emoji: true
        },
        style: 'danger',
        value: `reject_${payload.campaignId}`
      }
    ]
  });

  const result = await withFailsafe(
    `slack_approval_${payload.campaignId}`,
    async () => {
      const response = await axios.post(SLACK_WEBHOOK_URL, message);
      return response.status === 200;
    },
    false
  );

  if (result.data) {
    console.log(`✅ Campaign approval request sent to Slack: ${payload.campaignId}`);
  }

  return result.data;
}

// Send campaign execution notification
export async function sendCampaignExecutionNotification(
  campaignName: string,
  status: 'started' | 'completed' | 'failed',
  details?: string
): Promise<boolean> {
  const statusEmoji = {
    started: '🚀',
    completed: '✅',
    failed: '❌'
  };

  const text = `${statusEmoji[status]} Campaign "${campaignName}" ${status}${details ? `\n${details}` : ''}`;

  return sendSlackMessage(text);
}

// Send milestone notification
export async function sendMilestoneNotification(milestone: string): Promise<boolean> {
  return sendSlackMessage(milestone);
}

export default {
  sendSlackMessage,
  sendCampaignApprovalRequest,
  sendCampaignExecutionNotification,
  sendMilestoneNotification
};
