/**
 * Automations API Routes
 * Handles workflow automations connecting external systems (Birdeye, CRM)
 * with internal systems (Email, Slack)
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import {
  AUTOMATION_TEMPLATES,
  parseAutomationCommand,
  simulateBirdeyeReview,
  executeAutomation,
  Automation
} from '../services/automations';

const router = Router();

// GET /api/automations - List all automation templates
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const automations = AUTOMATION_TEMPLATES.map((template, index) => ({
    ...template,
    id: `template-${index}`,
    createdAt: new Date().toISOString(),
    executionCount: Math.floor(Math.random() * 100) // Mock execution count
  }));

  res.json({
    success: true,
    data: automations,
    count: automations.length
  });
}));

// GET /api/automations/templates - Get automation templates
router.get('/templates', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: AUTOMATION_TEMPLATES,
    message: 'Available automation templates'
  });
}));

// POST /api/automations/parse - Parse natural language to automation
router.post('/parse', asyncHandler(async (req: Request, res: Response) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({
      success: false,
      error: 'Command is required'
    });
  }

  const parsed = parseAutomationCommand(command);

  if (!parsed) {
    return res.status(400).json({
      success: false,
      error: 'Could not parse automation from command. Try something like: "When 5-star review received, send thank you email and notify sales team on Slack"'
    });
  }

  res.json({
    success: true,
    data: parsed,
    message: 'Automation parsed from natural language'
  });
}));

// POST /api/automations/create - Create automation from natural language
router.post('/create', asyncHandler(async (req: Request, res: Response) => {
  const { command, name } = req.body;

  if (!command) {
    return res.status(400).json({
      success: false,
      error: 'Command is required'
    });
  }

  const parsed = parseAutomationCommand(command);

  if (!parsed) {
    return res.status(400).json({
      success: false,
      error: 'Could not parse automation. Try: "When 5-star review received, send thank you email and notify Slack"'
    });
  }

  const automation: Automation = {
    ...parsed as any,
    id: `auto-${Date.now()}`,
    name: name || parsed.name || 'New Automation',
    createdAt: new Date().toISOString(),
    executionCount: 0
  };

  console.log(`✅ Automation created: ${automation.name}`);

  res.status(201).json({
    success: true,
    data: automation,
    message: `Automation "${automation.name}" created successfully`
  });
}));

// POST /api/automations/test - Test an automation with sample data
router.post('/test', asyncHandler(async (req: Request, res: Response) => {
  const { automationId, testData } = req.body;

  // Find the automation template
  const templateIndex = AUTOMATION_TEMPLATES.findIndex((_, i) => `template-${i}` === automationId);

  if (templateIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Automation not found'
    });
  }

  const template = AUTOMATION_TEMPLATES[templateIndex];
  const automation: Automation = {
    ...template,
    id: automationId,
    createdAt: new Date().toISOString(),
    executionCount: 0
  };

  const result = await executeAutomation(automation, {
    customer_name: testData?.customer_name || 'Test Customer',
    customer_email: testData?.customer_email || process.env.TEST_EMAIL,
    rating: testData?.rating || 5,
    review_text: testData?.review_text || 'Great service!',
    trigger_type: automation.trigger.type,
    ...testData
  });

  res.json({
    success: true,
    data: result,
    message: `Automation "${automation.name}" executed in test mode`
  });
}));

// POST /api/automations/webhook/birdeye - Simulate Birdeye webhook
router.post('/webhook/birdeye', asyncHandler(async (req: Request, res: Response) => {
  const { rating, text, customerName, customerEmail } = req.body;

  if (rating === undefined || !customerName) {
    return res.status(400).json({
      success: false,
      error: 'rating and customerName are required'
    });
  }

  console.log(`📥 Birdeye webhook received: ${rating}-star review from ${customerName}`);

  const results = await simulateBirdeyeReview({
    rating,
    text: text || '',
    customerName,
    customerEmail
  });

  res.json({
    success: true,
    data: {
      reviewProcessed: true,
      automationsTriggered: results.length,
      results
    },
    message: `Review processed. ${results.length} automation(s) triggered.`
  });
}));

// POST /api/automations/webhook/crm - Simulate CRM webhook
router.post('/webhook/crm', asyncHandler(async (req: Request, res: Response) => {
  const { eventType, customerId, customerName, customerEmail, data } = req.body;

  if (!eventType || !customerId) {
    return res.status(400).json({
      success: false,
      error: 'eventType and customerId are required'
    });
  }

  console.log(`📥 CRM webhook received: ${eventType} for customer ${customerId}`);

  // Find matching automations
  const matchingTemplates = AUTOMATION_TEMPLATES.filter(auto => {
    if (eventType === 'purchase' && auto.trigger.type === 'purchase') return true;
    if (eventType === 'appointment' && auto.trigger.type === 'appointment') return true;
    if (eventType === 'signup' && auto.trigger.type === 'signup') return true;
    return false;
  });

  const results = [];
  for (const template of matchingTemplates) {
    const automation: Automation = {
      ...template,
      id: `auto-${Date.now()}`,
      createdAt: new Date().toISOString(),
      executionCount: 0
    };

    const result = await executeAutomation(automation, {
      customer_id: customerId,
      customer_name: customerName || 'Customer',
      customer_email: customerEmail || process.env.TEST_EMAIL,
      trigger_type: eventType,
      ...data
    });

    results.push(result);
  }

  res.json({
    success: true,
    data: {
      eventProcessed: true,
      automationsTriggered: results.length,
      results
    },
    message: `CRM event processed. ${results.length} automation(s) triggered.`
  });
}));

// GET /api/automations/demo - Demo the automation with a 5-star review
router.get('/demo', asyncHandler(async (req: Request, res: Response) => {
  console.log('🎬 Running automation demo...');

  const results = await simulateBirdeyeReview({
    rating: 5,
    text: 'Excellent service! The team at Premier Nissan went above and beyond. Mike was extremely helpful and honest about what my car needed. Will definitely be back!',
    customerName: 'Sarah Johnson',
    customerEmail: process.env.TEST_EMAIL
  });

  res.json({
    success: true,
    data: {
      demoScenario: '5-star review from Sarah Johnson',
      automationsTriggered: results.length,
      results,
      explanation: 'This demo simulates a 5-star Birdeye review which triggers: 1) Thank you email to customer, 2) Slack notification to #customer-wins'
    },
    message: 'Automation demo completed!'
  });
}));

export default router;
