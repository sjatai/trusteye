import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const DEMO_SITE_URL = process.env.DEMO_SITE_URL || 'http://localhost:3001';

// Trigger a loyalty campaign on the demo site
router.post('/loyalty', async (req: Request, res: Response) => {
  try {
    const { action, points, reason, rule_id, message, offer_code, cta_text, cta_url } = req.body;

    let endpoint = '/api/loyalty';
    let payload: any = {};

    if (action === 'add_points') {
      payload = { action: 'add_points', points, reason };
    } else if (action === 'trigger_rule') {
      payload = { action: 'trigger_rule', rule_id };
    } else if (action === 'set_rule') {
      payload = { action: 'set_rule', ...req.body };
    } else if (action === 'banner' || message) {
      // Show loyalty banner
      payload = { message, offer_code, cta_text, cta_url };
    } else {
      return res.status(400).json({ success: false, error: 'Unknown action' });
    }

    const response = await axios.post(`${DEMO_SITE_URL}${endpoint}`, payload);
    res.json({ success: true, demoSiteResponse: response.data });
  } catch (error: any) {
    console.error('Failed to trigger loyalty on demo site:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger notification on demo site
router.post('/notify', async (req: Request, res: Response) => {
  try {
    const { message, type, duration_seconds } = req.body;

    const response = await axios.post(`${DEMO_SITE_URL}/api/notify`, {
      message,
      type: type || 'info',
      duration_seconds: duration_seconds || 5,
    });

    res.json({ success: true, demoSiteResponse: response.data });
  } catch (error: any) {
    console.error('Failed to send notification to demo site:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger display ad change on demo site
router.post('/ad', async (req: Request, res: Response) => {
  try {
    const { headline, body, image_url, cta_text, cta_url } = req.body;

    const response = await axios.post(`${DEMO_SITE_URL}/api/display-ad`, {
      headline,
      body,
      image_url,
      cta_text,
      cta_url,
    });

    res.json({ success: true, demoSiteResponse: response.data });
  } catch (error: any) {
    console.error('Failed to update ad on demo site:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger appointment booking (simulates loyalty rule trigger)
router.post('/appointment', async (req: Request, res: Response) => {
  try {
    const { service, date, isWeekend } = req.body;

    const response = await axios.post(`${DEMO_SITE_URL}/api/appointment`, {
      service: service || 'Service Appointment',
      date: date || new Date().toISOString(),
      isWeekend: isWeekend ?? true, // Force weekend bonus for demo
    });

    res.json({ success: true, demoSiteResponse: response.data });
  } catch (error: any) {
    console.error('Failed to trigger appointment on demo site:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get demo site state
router.get('/state', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${DEMO_SITE_URL}/api/state`);
    res.json({ success: true, state: response.data });
  } catch (error: any) {
    console.error('Failed to get demo site state:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute a loyalty campaign on demo site
router.post('/execute-campaign', async (req: Request, res: Response) => {
  try {
    const { campaignType, audience, content } = req.body;

    // Different actions based on campaign type
    if (campaignType === 'loyalty') {
      // Trigger loyalty banner with the campaign content
      await axios.post(`${DEMO_SITE_URL}/api/loyalty`, {
        message: content?.subject || 'Special offer for our loyal customers!',
        offer_code: content?.offerCode || 'LOYALTY100',
        cta_text: content?.cta || 'Claim Now',
        cta_url: '/services',
      });

      res.json({
        success: true,
        message: 'Loyalty campaign executed on demo site',
        demoSiteUrl: DEMO_SITE_URL
      });
    } else if (campaignType === 'ad' || campaignType === 'promotional') {
      // Update display ad
      await axios.post(`${DEMO_SITE_URL}/api/display-ad`, {
        headline: content?.subject || 'Special Offer',
        body: content?.body || 'Check out our latest deals!',
        cta_text: content?.cta || 'Learn More',
        cta_url: '/inventory',
      });

      res.json({
        success: true,
        message: 'Ad campaign executed on demo site',
        demoSiteUrl: DEMO_SITE_URL
      });
    } else if (campaignType === 'notification') {
      // Send notification
      await axios.post(`${DEMO_SITE_URL}/api/notify`, {
        message: content?.body || content?.subject || 'New notification!',
        type: 'success',
        duration_seconds: 8,
      });

      res.json({
        success: true,
        message: 'Notification sent to demo site',
        demoSiteUrl: DEMO_SITE_URL
      });
    } else {
      // Default: send notification
      await axios.post(`${DEMO_SITE_URL}/api/notify`, {
        message: `Campaign "${content?.subject || 'New Campaign'}" is now live!`,
        type: 'info',
        duration_seconds: 6,
      });

      res.json({
        success: true,
        message: 'Campaign notification sent to demo site',
        demoSiteUrl: DEMO_SITE_URL
      });
    }
  } catch (error: any) {
    console.error('Failed to execute campaign on demo site:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
