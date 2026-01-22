/**
 * Campaign Content Templates
 * Pre-built templates in Premier Nissan's brand voice
 * Based on brand-knowledge/premier-nissan/Brand_Voice_Guidelines.md
 */

export interface CampaignTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  subject: string;
  body: string;
  cta: string;
  variables: string[];
  targetAudience: string;
  expectedOpenRate: number;
  expectedClickRate: number;
  bestSendTime: string;
}

// Templates based on Premier Nissan brand voice and Q3 performance data
export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'referral-5star',
    name: '5-Star Referral Request',
    type: 'referral',
    description: 'Ask happy customers (5-star reviewers) for referrals',
    subject: '{{customer_name}}, know someone who needs a great car?',
    body: `Hi {{customer_name}},

Thank you again for your wonderful review! It means the world to our team.

We're always looking to help more people in our community find their perfect vehicle. If you know someone who's in the market for a car or needs reliable service, we'd love to take care of them the same way we take care of you.

As a thank you for any referral, you'll both receive $100 off your next service.

Just have them mention your name when they come in, or reply to this email with their contact info and we'll reach out.

Thanks for being part of the Premier family!

The Premier Nissan Team`,
    cta: 'Refer a Friend',
    variables: ['customer_name'],
    targetAudience: '5-star reviewers, VIP customers',
    expectedOpenRate: 34.2,
    expectedClickRate: 6.8,
    bestSendTime: 'Saturday 10 AM'
  },
  {
    id: 'winback-lapsed',
    name: 'Win-Back Campaign',
    type: 'winback',
    description: 'Re-engage customers inactive for 90+ days',
    subject: 'We miss you, {{customer_name}}! Here\'s 20% off',
    body: `Hi {{customer_name}},

It's been a while since we've seen you, and honestly? We miss you.

We'd love to welcome you back to Premier Nissan. As one of our valued customers, here's a special offer just for you:

**20% off your next service visit**

Whether your {{vehicle}} needs an oil change, tire rotation, or just a check-up, we're here to help keep it running smoothly.

This offer is valid for the next 14 days.

We hope to see you soon!

The Premier Nissan Team`,
    cta: 'Book Service Now',
    variables: ['customer_name', 'vehicle'],
    targetAudience: 'Lapsed customers (90+ days inactive)',
    expectedOpenRate: 22.4,
    expectedClickRate: 3.1,
    bestSendTime: 'Tuesday 10 AM'
  },
  {
    id: 'service-reminder',
    name: 'Service Reminder',
    type: 'service',
    description: 'Remind customers about upcoming maintenance',
    subject: '{{customer_name}}, your {{vehicle}} is due for some TLC',
    body: `Hi {{customer_name}},

Your {{vehicle}} has been a great companion for {{mileage}} miles! Around this time, most vehicles benefit from a check-up to keep running smoothly.

Here's what we recommend:
- Oil change
- Tire rotation
- Multi-point inspection

**This month: 15% off our maintenance package**

Book your appointment and we'll have you back on the road in no time.

See you soon!

The Premier Nissan Team`,
    cta: 'Schedule Service',
    variables: ['customer_name', 'vehicle', 'mileage'],
    targetAudience: 'Customers due for service',
    expectedOpenRate: 28.1,
    expectedClickRate: 4.2,
    bestSendTime: 'Tuesday 10 AM'
  },
  {
    id: 'recovery-negative',
    name: 'Recovery Campaign',
    type: 'recovery',
    description: 'Win back customers after negative experience',
    subject: '{{customer_name}}, we want to make this right',
    body: `Hi {{customer_name}},

We received your recent feedback, and we want you to know that we hear you.

Your experience didn't meet the standards we set for ourselves at Premier Nissan, and we sincerely apologize.

We'd love the opportunity to make it right. Our Service Director, Mike, would like to personally assist you with your next visit.

**We'll cover 50% of your next service** as our way of saying sorry and showing you the Premier experience you deserve.

Please call us at (555) 123-4567 or reply to this email, and we'll take care of everything.

Sincerely,

The Premier Nissan Team`,
    cta: 'Contact Us',
    variables: ['customer_name'],
    targetAudience: 'Customers with negative reviews or complaints',
    expectedOpenRate: 31.5,
    expectedClickRate: 5.4,
    bestSendTime: 'Immediately (within 2 hours)'
  },
  {
    id: 'welcome-new',
    name: 'New Customer Welcome',
    type: 'welcome',
    description: 'Welcome new customers after first purchase',
    subject: 'Welcome to the Premier Nissan family, {{customer_name}}!',
    body: `Hi {{customer_name}},

Welcome to the Premier Nissan family! We're thrilled to have you.

Congratulations on your {{vehicle}}! You've made a great choice, and we're here to support you every mile of the way.

Here's what you can expect from us:
- Honest, transparent service
- Fair pricing - always
- A team that knows you by name

As a welcome gift, here's **15% off your first service appointment**.

We're more than just a dealership - we're your neighbors. We've been serving this community for 25 years, and we're honored to count you among our family now.

See you soon!

The Premier Nissan Team`,
    cta: 'Book First Service',
    variables: ['customer_name', 'vehicle'],
    targetAudience: 'New customers (first purchase)',
    expectedOpenRate: 41.2,
    expectedClickRate: 7.1,
    bestSendTime: 'Immediately after purchase'
  },
  {
    id: 'loyalty-vip',
    name: 'VIP Loyalty Reward',
    type: 'loyalty',
    description: 'Reward loyal VIP customers',
    subject: 'A special thank you, {{customer_name}}',
    body: `Hi {{customer_name}},

We wanted to take a moment to say thank you.

You've been part of the Premier Nissan family for {{years_customer}} years now, and your trust means everything to us.

As a token of our appreciation, we'd like to offer you our **VIP Perks Package**:
- Priority scheduling (no waiting)
- Complimentary loaner vehicle
- Free car wash with any service
- 15% off all services

This is our way of saying thanks for being such a valued member of our community.

We look forward to seeing you soon!

With gratitude,

The Premier Nissan Team`,
    cta: 'Claim VIP Perks',
    variables: ['customer_name', 'years_customer'],
    targetAudience: 'VIP customers (5+ services)',
    expectedOpenRate: 38.2,
    expectedClickRate: 8.7,
    bestSendTime: 'Saturday 10 AM'
  },
  {
    id: 'conquest-competitor',
    name: 'Conquest Campaign',
    type: 'conquest',
    description: 'Win customers from competitors',
    subject: 'Thinking of switching? Here\'s what Premier offers',
    body: `Hi {{customer_name}},

Looking for a better car service experience? We get it.

At Premier Nissan, we do things differently:

**No surprises.** We'll tell you exactly what your car needs and what it costs before we start any work.

**No pressure.** We recommend what's best for your car, not our bottom line.

**No strangers.** Our team gets to know you and your vehicle.

Try us out with **25% off your first service**. If you're not completely satisfied, we'll refund the difference from what you were paying before.

Fair enough?

The Premier Nissan Team`,
    cta: 'Try Premier',
    variables: ['customer_name'],
    targetAudience: 'Customers of competitors, conquest leads',
    expectedOpenRate: 24.8,
    expectedClickRate: 3.4,
    bestSendTime: 'Tuesday 10 AM'
  },
  {
    id: 'birthday',
    name: 'Birthday Celebration',
    type: 'birthday',
    description: 'Celebrate customer birthdays',
    subject: 'Happy birthday from Premier Nissan, {{customer_name}}!',
    body: `Happy Birthday, {{customer_name}}!

We hope your day is filled with joy and celebration.

As our gift to you, here's **$25 off your next service visit** - no strings attached, no minimum purchase.

Treat yourself (or your car) to something nice!

Valid all month long.

Cheers to another wonderful year!

The Premier Nissan Team`,
    cta: 'Claim Birthday Gift',
    variables: ['customer_name'],
    targetAudience: 'Customers with birthdays this month',
    expectedOpenRate: 52.3,
    expectedClickRate: 12.4,
    bestSendTime: 'Birthday morning'
  }
];

// Get template by ID
export function getTemplateById(id: string): CampaignTemplate | undefined {
  return CAMPAIGN_TEMPLATES.find(t => t.id === id);
}

// Get templates by type
export function getTemplatesByType(type: string): CampaignTemplate[] {
  return CAMPAIGN_TEMPLATES.filter(t => t.type === type);
}

// Get all template types
export function getTemplateTypes(): string[] {
  return [...new Set(CAMPAIGN_TEMPLATES.map(t => t.type))];
}

// Render template with variables
export function renderTemplate(template: CampaignTemplate, variables: Record<string, any>): {
  subject: string;
  body: string;
  cta: string;
} {
  const render = (text: string) => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  };

  return {
    subject: render(template.subject),
    body: render(template.body),
    cta: render(template.cta)
  };
}

export default {
  CAMPAIGN_TEMPLATES,
  getTemplateById,
  getTemplatesByType,
  getTemplateTypes,
  renderTemplate
};
