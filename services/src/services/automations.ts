/**
 * Automations Service
 * Handles workflow automations connecting external systems (Birdeye, CRM)
 * with internal systems (Email, Slack)
 */

import { sendEmail, generateCampaignEmailHtml } from './resend';
import { sendSlackMessage, sendCampaignApprovalRequest } from './slack';
import { supabase } from './db';

export interface AutomationTrigger {
  type: 'review' | 'appointment' | 'purchase' | 'inactivity' | 'signup' | 'service_due' | 'oil_change_due' | 'custom';
  source: 'birdeye' | 'crm' | 'internal' | 'webhook';
  conditions: Record<string, any>;
}

export interface AutomationAction {
  type: 'send_email' | 'send_slack' | 'create_campaign' | 'add_to_audience' | 'update_crm' | 'notify_team' | 'trigger_demo_site';
  config: Record<string, any>;
}

export interface AutomationMetrics {
  openRate: number;
  sendCount: number;
  lastRun: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  isActive: boolean;
  createdAt: string;
  executionCount: number;
  lastExecuted?: string;
  performanceStatus?: 'green' | 'yellow' | 'red';
  metrics?: AutomationMetrics;
}

export interface AutomationExecutionResult {
  automationId: string;
  success: boolean;
  actionsExecuted: {
    action: string;
    success: boolean;
    result?: any;
    error?: string;
  }[];
  timestamp: string;
}

// Pre-built automation templates
export const AUTOMATION_TEMPLATES: Omit<Automation, 'id' | 'createdAt' | 'executionCount'>[] = [
  {
    name: '5-Star Review Thank You',
    description: 'When a customer leaves a 5-star review on Birdeye, send a thank you email and notify the sales team on Slack',
    trigger: {
      type: 'review',
      source: 'birdeye',
      conditions: { rating: 5 }
    },
    actions: [
      {
        type: 'send_email',
        config: {
          template: 'review_thank_you',
          subject: 'Thank you for your wonderful review, {{customer_name}}!',
          delay: 0
        }
      },
      {
        type: 'send_slack',
        config: {
          channel: '#customer-wins',
          message: '5-star review received from {{customer_name}}! "{{review_text}}"'
        }
      }
    ],
    isActive: true,
    performanceStatus: 'green',
    metrics: { openRate: 34.2, sendCount: 2341, lastRun: '1 hour ago' }
  },
  {
    name: 'Negative Review Alert',
    description: 'When a customer leaves a 1-2 star review, immediately alert the manager and create a recovery campaign',
    trigger: {
      type: 'review',
      source: 'birdeye',
      conditions: { rating: { $lte: 2 } }
    },
    actions: [
      {
        type: 'send_slack',
        config: {
          channel: '#urgent-reviews',
          message: 'URGENT: {{rating}}-star review from {{customer_name}}. "{{review_text}}" - Immediate follow-up needed!'
        }
      },
      {
        type: 'create_campaign',
        config: {
          type: 'recovery',
          name: 'Recovery: {{customer_name}}',
          priority: 'high'
        }
      }
    ],
    isActive: true,
    performanceStatus: 'green',
    metrics: { openRate: 31.5, sendCount: 156, lastRun: '3 hours ago' }
  },
  {
    name: 'Service Appointment Reminder',
    description: 'Send reminder email and SMS 24 hours before scheduled service appointment',
    trigger: {
      type: 'appointment',
      source: 'crm',
      conditions: { hoursUntil: 24 }
    },
    actions: [
      {
        type: 'send_email',
        config: {
          template: 'appointment_reminder',
          subject: 'Reminder: Your service appointment is tomorrow, {{customer_name}}'
        }
      },
      {
        type: 'send_slack',
        config: {
          channel: '#service-team',
          message: 'Appointment reminder sent to {{customer_name}} for {{service_type}} tomorrow at {{appointment_time}}'
        }
      }
    ],
    isActive: true,
    performanceStatus: 'green',
    metrics: { openRate: 32.1, sendCount: 1893, lastRun: '30 minutes ago' }
  },
  {
    name: 'New Customer Welcome Series',
    description: 'When a new customer makes their first purchase, start a 3-email welcome series',
    trigger: {
      type: 'purchase',
      source: 'crm',
      conditions: { isFirstPurchase: true }
    },
    actions: [
      {
        type: 'send_email',
        config: {
          template: 'welcome_series_1',
          subject: 'Welcome to the Premier Nissan family, {{customer_name}}!',
          delay: 0
        }
      },
      {
        type: 'add_to_audience',
        config: {
          audience: 'new_customers',
          tags: ['welcome_series']
        }
      },
      {
        type: 'send_slack',
        config: {
          channel: '#new-customers',
          message: 'New customer alert! {{customer_name}} just made their first purchase.'
        }
      }
    ],
    isActive: true,
    performanceStatus: 'green',
    metrics: { openRate: 41.2, sendCount: 567, lastRun: '2 hours ago' }
  },
  {
    name: 'Lapsed Customer Win-Back',
    description: 'When a customer has been inactive for 90 days, trigger a win-back campaign',
    trigger: {
      type: 'inactivity',
      source: 'internal',
      conditions: { daysSinceLastActivity: 90 }
    },
    actions: [
      {
        type: 'create_campaign',
        config: {
          type: 'winback',
          name: 'Win-Back: {{customer_name}}',
          discount: '20%'
        }
      },
      {
        type: 'send_email',
        config: {
          template: 'winback',
          subject: 'We miss you, {{customer_name}}! Here\'s 20% off'
        }
      }
    ],
    isActive: true,
    performanceStatus: 'red',
    metrics: { openRate: 11.3, sendCount: 423, lastRun: '6 hours ago' }
  },
  {
    name: 'Service Reminder',
    description: 'Send reminder when customer last service was over 6 months ago',
    trigger: {
      type: 'service_due',
      source: 'internal',
      conditions: { lastServiceMonths: 6 }
    },
    actions: [
      {
        type: 'send_email',
        config: {
          template: 'service_reminder',
          subject: 'Time for your vehicle service, {{customer_name}}!'
        }
      }
    ],
    isActive: true,
    performanceStatus: 'green',
    metrics: { openRate: 28.3, sendCount: 1247, lastRun: '2 hours ago' }
  },
  {
    name: 'Oil Change Reminder',
    description: 'Send reminder when last oil change was over 4 months ago',
    trigger: {
      type: 'oil_change_due',
      source: 'internal',
      conditions: { lastOilChangeMonths: 4 }
    },
    actions: [
      {
        type: 'send_email',
        config: {
          template: 'oil_change_reminder',
          subject: 'Your oil change is due, {{customer_name}}'
        }
      }
    ],
    isActive: true,
    performanceStatus: 'yellow',
    metrics: { openRate: 18.1, sendCount: 892, lastRun: '4 hours ago' }
  }
];

// Execute a single automation action
async function executeAction(
  action: AutomationAction,
  context: Record<string, any>
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    switch (action.type) {
      case 'send_email': {
        const subject = replaceVariables(action.config.subject, context);
        const template = action.config.template || 'generic';

        const html = generateCampaignEmailHtml({
          campaignType: template,
          businessName: 'Premier Nissan',
          headline: subject,
          body: replaceVariables(action.config.body || getTemplateBody(template, context), context),
          ctaText: action.config.ctaText || 'Learn More',
          ctaUrl: action.config.ctaUrl || 'https://premiernissan.com'
        });

        const emailResult = await sendEmail({
          to: context.customer_email || process.env.TEST_EMAIL || 'test@example.com',
          subject,
          html
        });

        return { success: emailResult.success, result: emailResult };
      }

      case 'send_slack': {
        const message = replaceVariables(action.config.message, context);
        const channel = action.config.channel || '#general';

        const slackResult = await sendSlackMessage(`${channel}: ${message}`);
        return { success: slackResult, result: { channel, messageSent: slackResult } };
      }

      case 'create_campaign': {
        const campaignName = replaceVariables(action.config.name, context);

        const { data, error } = await supabase
          .from('campaigns')
          .insert({
            name: campaignName,
            type: action.config.type || 'promotional',
            status: 'draft',
            channels: ['email'],
            content: {
              subject: `${action.config.type === 'recovery' ? 'We want to make it right' : 'Special offer for you'}, ${context.customer_name}`,
              body: getTemplateBody(action.config.type, context)
            }
          })
          .select()
          .single();

        if (error) throw error;
        return { success: true, result: { campaignId: data.id, campaignName } };
      }

      case 'add_to_audience': {
        // Add customer to specified audience
        return {
          success: true,
          result: {
            audience: action.config.audience,
            customerId: context.customer_id,
            tags: action.config.tags
          }
        };
      }

      case 'notify_team': {
        const message = replaceVariables(action.config.message, context);
        await sendSlackMessage(message);
        return { success: true, result: { notified: true } };
      }

      case 'trigger_demo_site': {
        // Trigger action on demo site
        const axios = (await import('axios')).default;
        const demoSiteUrl = process.env.DEMO_SITE_URL || 'http://localhost:3001';

        const response = await axios.post(`${demoSiteUrl}/api/${action.config.endpoint}`, {
          ...action.config.payload,
          ...context
        });

        return { success: true, result: response.data };
      }

      default:
        return { success: false, error: `Unknown action type: ${action.type}` };
    }
  } catch (error: any) {
    console.error(`Action ${action.type} failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Replace {{variables}} in strings
function replaceVariables(template: string, context: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return context[key] !== undefined ? String(context[key]) : match;
  });
}

// Get template body based on type
function getTemplateBody(templateType: string, context: Record<string, any>): string {
  const templates: Record<string, string> = {
    review_thank_you: `Hi ${context.customer_name || 'there'},\n\nThank you so much for taking the time to leave us a wonderful review! Your kind words mean the world to our team.\n\nWe're committed to providing the best service possible, and feedback like yours motivates us to keep raising the bar.\n\nAs a token of our appreciation, here's 15% off your next service visit.\n\nSee you soon!\nThe Premier Nissan Team`,

    appointment_reminder: `Hi ${context.customer_name || 'there'},\n\nJust a friendly reminder that your service appointment is scheduled for tomorrow.\n\n${context.service_type ? `Service: ${context.service_type}` : ''}\n${context.appointment_time ? `Time: ${context.appointment_time}` : ''}\n\nIf you need to reschedule, please call us or reply to this email.\n\nWe look forward to seeing you!\nThe Premier Nissan Team`,

    welcome_series_1: `Hi ${context.customer_name || 'there'},\n\nWelcome to the Premier Nissan family! We're thrilled to have you.\n\nAt Premier Nissan, we believe in building lasting relationships. Here's what you can expect from us:\n\n- Honest, transparent service\n- Fair pricing - always\n- A team that knows you by name\n\nAs a welcome gift, here's 15% off your first service appointment.\n\nSee you soon!\nThe Premier Nissan Team`,

    winback: `Hi ${context.customer_name || 'there'},\n\nIt's been a while since we've seen you, and honestly? We miss you.\n\nWe'd love to welcome you back to Premier Nissan. As a special offer, here's 20% off your next service visit.\n\nWhether you need an oil change, tire rotation, or just a check-up, we're here for you.\n\nWe hope to see you soon!\nThe Premier Nissan Team`,

    recovery: `Hi ${context.customer_name || 'there'},\n\nWe recently received your feedback, and we want you to know that we hear you.\n\nYour experience didn't meet the standards we set for ourselves, and we sincerely apologize.\n\nWe'd love the opportunity to make it right. Our Service Director, Mike, would like to personally assist you with your next visit.\n\nPlease call us at (555) 123-4567 or reply to this email, and we'll take care of everything.\n\nSincerely,\nThe Premier Nissan Team`,

    service_reminder: `Hi ${context.customer_name || 'there'},\n\nIt's been 6 months since your last service visit, and we wanted to check in!\n\nRegular maintenance keeps your vehicle running smoothly and can prevent costly repairs down the road.\n\nOur service team is ready to help with:\n- Multi-point inspection\n- Fluid checks and top-offs\n- Tire rotation\n- Brake inspection\n\nSchedule your appointment today and get 10% off your next service.\n\nWe look forward to seeing you!\nThe Premier Nissan Service Team`,

    oil_change_reminder: `Hi ${context.customer_name || 'there'},\n\nJust a friendly reminder - it's time for your oil change!\n\nRegular oil changes are one of the most important things you can do to keep your engine healthy.\n\nBook your oil change today:\n- Quick 30-minute service\n- Free multi-point inspection\n- Complimentary car wash\n\nSchedule online or call us at (555) 123-4567.\n\nSee you soon!\nThe Premier Nissan Service Team`,

    generic: `Hi ${context.customer_name || 'there'},\n\nWe have some news we think you'll love.\n\nAs a valued customer, we wanted to share this special offer with you first.\n\nSee you soon!\nThe Premier Nissan Team`
  };

  return templates[templateType] || templates.generic;
}

// Execute an automation workflow
export async function executeAutomation(
  automation: Automation,
  triggerContext: Record<string, any>
): Promise<AutomationExecutionResult> {
  console.log(`🚀 Executing automation: ${automation.name}`);

  const result: AutomationExecutionResult = {
    automationId: automation.id,
    success: true,
    actionsExecuted: [],
    timestamp: new Date().toISOString()
  };

  for (const action of automation.actions) {
    const actionResult = await executeAction(action, triggerContext);
    result.actionsExecuted.push({
      action: action.type,
      ...actionResult
    });

    if (!actionResult.success) {
      result.success = false;
    }
  }

  console.log(`✅ Automation ${automation.name} completed: ${result.success ? 'SUCCESS' : 'PARTIAL FAILURE'}`);

  return result;
}

// Parse natural language to create automation
export function parseAutomationCommand(command: string): Partial<Automation> | null {
  const lower = command.toLowerCase();

  // Detect trigger
  let trigger: AutomationTrigger | null = null;

  if (lower.includes('5-star') || lower.includes('5 star') || lower.includes('positive review')) {
    trigger = { type: 'review', source: 'birdeye', conditions: { rating: 5 } };
  } else if (lower.includes('negative review') || lower.includes('bad review') || lower.includes('1-star') || lower.includes('2-star')) {
    trigger = { type: 'review', source: 'birdeye', conditions: { rating: { $lte: 2 } } };
  } else if (lower.includes('review')) {
    trigger = { type: 'review', source: 'birdeye', conditions: {} };
  } else if (lower.includes('appointment') || lower.includes('service')) {
    trigger = { type: 'appointment', source: 'crm', conditions: {} };
  } else if (lower.includes('purchase') || lower.includes('buy')) {
    trigger = { type: 'purchase', source: 'crm', conditions: {} };
  } else if (lower.includes('inactive') || lower.includes('lapsed')) {
    const daysMatch = lower.match(/(\d+)\s*days?/);
    trigger = {
      type: 'inactivity',
      source: 'internal',
      conditions: { daysSinceLastActivity: daysMatch ? parseInt(daysMatch[1]) : 90 }
    };
  }

  if (!trigger) return null;

  // Detect actions
  const actions: AutomationAction[] = [];

  if (lower.includes('email') || lower.includes('send') || lower.includes('thank')) {
    actions.push({
      type: 'send_email',
      config: {
        template: trigger.type === 'review' ? 'review_thank_you' : 'generic',
        subject: lower.includes('thank') ? 'Thank you, {{customer_name}}!' : 'A message from Premier Nissan'
      }
    });
  }

  if (lower.includes('slack') || lower.includes('notify') || lower.includes('alert') || lower.includes('team')) {
    actions.push({
      type: 'send_slack',
      config: {
        channel: trigger.conditions.rating <= 2 ? '#urgent-reviews' : '#customer-wins',
        message: trigger.type === 'review'
          ? '{{rating}}-star review from {{customer_name}}: "{{review_text}}"'
          : 'Action triggered for {{customer_name}}'
      }
    });
  }

  if (lower.includes('campaign') || lower.includes('recovery')) {
    actions.push({
      type: 'create_campaign',
      config: {
        type: lower.includes('recovery') ? 'recovery' : 'promotional',
        name: '{{trigger_type}}: {{customer_name}}'
      }
    });
  }

  if (actions.length === 0) {
    // Default action
    actions.push({
      type: 'send_slack',
      config: {
        channel: '#notifications',
        message: 'Automation triggered: {{trigger_type}} for {{customer_name}}'
      }
    });
  }

  return {
    name: `Auto: ${command.substring(0, 50)}`,
    description: command,
    trigger,
    actions,
    isActive: true
  };
}

// Simulate a Birdeye review webhook
export async function simulateBirdeyeReview(review: {
  rating: number;
  text: string;
  customerName: string;
  customerEmail?: string;
}): Promise<AutomationExecutionResult[]> {
  const results: AutomationExecutionResult[] = [];

  // Find matching automations
  const matchingAutomations = AUTOMATION_TEMPLATES.filter(auto => {
    if (auto.trigger.type !== 'review') return false;
    if (auto.trigger.conditions.rating && auto.trigger.conditions.rating !== review.rating) {
      if (typeof auto.trigger.conditions.rating === 'object') {
        const { $lte, $gte } = auto.trigger.conditions.rating;
        if ($lte && review.rating > $lte) return false;
        if ($gte && review.rating < $gte) return false;
      } else {
        return false;
      }
    }
    return true;
  });

  for (const template of matchingAutomations) {
    const automation: Automation = {
      ...template,
      id: `auto-${Date.now()}`,
      createdAt: new Date().toISOString(),
      executionCount: 0
    };

    const result = await executeAutomation(automation, {
      customer_name: review.customerName,
      customer_email: review.customerEmail || process.env.TEST_EMAIL,
      rating: review.rating,
      review_text: review.text,
      trigger_type: 'review'
    });

    results.push(result);
  }

  return results;
}

export default {
  AUTOMATION_TEMPLATES,
  executeAutomation,
  parseAutomationCommand,
  simulateBirdeyeReview
};
