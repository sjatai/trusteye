import { Router, Request, Response } from 'express';
import { supabase } from '../services/db';
import { asyncHandler } from '../middleware/errorHandler';
import { AnalyticsOverview, ApiResponse } from '../types';

const router = Router();

// GET /api/analytics/overview - Get analytics overview
router.get('/overview', asyncHandler(async (req: Request, res: Response) => {
  // Get campaign counts by status
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('id, status, metrics');

  if (campaignsError) {
    return res.status(500).json({
      success: false,
      error: campaignsError.message
    } as ApiResponse<null>);
  }

  // Calculate overview metrics
  const totalCampaigns = campaigns?.length || 0;
  const activeCampaigns = campaigns?.filter(c => c.status === 'running').length || 0;

  let totalSent = 0;
  let totalOpened = 0;
  let totalClicked = 0;

  campaigns?.forEach(campaign => {
    if (campaign.metrics) {
      totalSent += campaign.metrics.sent || 0;
      totalOpened += campaign.metrics.opened || 0;
      totalClicked += campaign.metrics.clicked || 0;
    }
  });

  const overview: AnalyticsOverview = {
    total_campaigns: totalCampaigns,
    active_campaigns: activeCampaigns,
    total_sent: totalSent,
    total_opened: totalOpened,
    total_clicked: totalClicked,
    average_open_rate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
    average_click_rate: totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0
  };

  res.json({
    success: true,
    data: overview
  } as ApiResponse<AnalyticsOverview>);
}));

// GET /api/analytics/campaigns/:id - Get campaign-specific analytics
router.get('/campaigns/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Get campaign with metrics
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, name, type, status, metrics, created_at')
    .eq('id', id)
    .single();

  if (campaignError) {
    return res.status(404).json({
      success: false,
      error: 'Campaign not found'
    } as ApiResponse<null>);
  }

  // Get campaign events for timeline
  const { data: events, error: eventsError } = await supabase
    .from('campaign_events')
    .select('*')
    .eq('campaign_id', id)
    .order('created_at', { ascending: true });

  const metrics = campaign.metrics || {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    converted: 0
  };

  // Calculate rates
  const openRate = metrics.delivered > 0 ? Math.round((metrics.opened / metrics.delivered) * 100) : 0;
  const clickRate = metrics.opened > 0 ? Math.round((metrics.clicked / metrics.opened) * 100) : 0;
  const conversionRate = metrics.clicked > 0 ? Math.round((metrics.converted / metrics.clicked) * 100) : 0;
  const deliveryRate = metrics.sent > 0 ? Math.round((metrics.delivered / metrics.sent) * 100) : 0;

  const analytics = {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      created_at: campaign.created_at
    },
    metrics: {
      ...metrics,
      open_rate: openRate,
      click_rate: clickRate,
      conversion_rate: conversionRate,
      delivery_rate: deliveryRate
    },
    events: events || [],
    insights: generateInsights(metrics, openRate, clickRate)
  };

  res.json({
    success: true,
    data: analytics
  });
}));

// GET /api/analytics/insights - Get AI-generated insights
router.get('/insights', asyncHandler(async (req: Request, res: Response) => {
  // Get recent campaigns for analysis
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  // Generate insights based on campaign data
  const insights = [];

  // Check for win-back opportunities
  const inactiveCampaigns = campaigns?.filter(c => c.type === 'win-back') || [];
  if (inactiveCampaigns.length === 0) {
    insights.push({
      type: 'opportunity',
      priority: 'high',
      title: 'Win-Back Campaign Opportunity',
      description: 'You haven\'t run a win-back campaign recently. Consider targeting customers who haven\'t engaged in 90+ days.',
      action: 'Create win-back campaign'
    });
  }

  // Check campaign performance
  const completedCampaigns = campaigns?.filter(c => c.status === 'completed') || [];
  const avgOpenRate = completedCampaigns.reduce((acc, c) => {
    const metrics = c.metrics || {};
    return acc + (metrics.delivered > 0 ? (metrics.opened / metrics.delivered) * 100 : 0);
  }, 0) / (completedCampaigns.length || 1);

  if (avgOpenRate > 25) {
    insights.push({
      type: 'success',
      priority: 'medium',
      title: 'Great Open Rates',
      description: `Your average open rate is ${Math.round(avgOpenRate)}%, which is above industry average.`,
      action: 'Keep up the good work!'
    });
  } else if (completedCampaigns.length > 0) {
    insights.push({
      type: 'improvement',
      priority: 'medium',
      title: 'Improve Open Rates',
      description: 'Your open rates could be improved. Consider A/B testing subject lines.',
      action: 'Test new subject lines'
    });
  }

  // Check for referral opportunities
  insights.push({
    type: 'suggestion',
    priority: 'low',
    title: 'Referral Program',
    description: 'Customers who left 5-star reviews are great candidates for referral campaigns.',
    action: 'Launch referral campaign'
  });

  res.json({
    success: true,
    data: {
      insights,
      generated_at: new Date().toISOString()
    }
  });
}));

// GET /api/analytics/trends - Get performance trends
router.get('/trends', asyncHandler(async (req: Request, res: Response) => {
  const { period = '30d' } = req.query;

  // Calculate date range
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get campaigns in date range
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('created_at, status, metrics')
    .gte('created_at', startDate.toISOString());

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  // Group by day
  const dailyData: Record<string, { campaigns: number; sent: number; opened: number }> = {};

  campaigns?.forEach(campaign => {
    const day = campaign.created_at.split('T')[0];
    if (!dailyData[day]) {
      dailyData[day] = { campaigns: 0, sent: 0, opened: 0 };
    }
    dailyData[day].campaigns++;
    if (campaign.metrics) {
      dailyData[day].sent += campaign.metrics.sent || 0;
      dailyData[day].opened += campaign.metrics.opened || 0;
    }
  });

  // Convert to array for charting
  const trends = Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      ...data,
      open_rate: data.sent > 0 ? Math.round((data.opened / data.sent) * 100) : 0
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    success: true,
    data: {
      period,
      trends
    }
  });
}));

// Helper function to generate insights based on metrics
function generateInsights(metrics: any, openRate: number, clickRate: number): string[] {
  const insights: string[] = [];

  if (openRate > 30) {
    insights.push('Excellent open rate! Your subject line is performing well.');
  } else if (openRate > 20) {
    insights.push('Good open rate. Consider A/B testing subject lines to improve further.');
  } else if (openRate > 0) {
    insights.push('Open rate could be improved. Try more personalized or urgent subject lines.');
  }

  if (clickRate > 10) {
    insights.push('Great click-through rate! Your content is engaging.');
  } else if (clickRate > 5) {
    insights.push('Decent click rate. Consider making CTAs more prominent.');
  } else if (clickRate > 0) {
    insights.push('Click rate needs improvement. Try clearer call-to-actions.');
  }

  if (metrics.converted > 0) {
    const conversionValue = metrics.converted * 150; // Assume $150 avg value
    insights.push(`Estimated revenue impact: $${conversionValue.toLocaleString()}`);
  }

  return insights;
}

export default router;
