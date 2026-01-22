import { Router, Request, Response } from 'express';
import { supabase } from '../services/db';
import { asyncHandler } from '../middleware/errorHandler';
import { Rule, ApiResponse } from '../types';

const router = Router();

// GET /api/rules - List all rules
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { is_active, trigger_type, limit = 50 } = req.query;

  let query = supabase
    .from('rules')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Number(limit));

  if (is_active !== undefined) {
    query = query.eq('is_active', is_active === 'true');
  }
  if (trigger_type) {
    query = query.eq('trigger_type', trigger_type);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  res.json({
    success: true,
    data
  } as ApiResponse<Rule[]>);
}));

// GET /api/rules/:id - Get single rule
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('rules')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(404).json({
      success: false,
      error: 'Rule not found'
    } as ApiResponse<null>);
  }

  res.json({
    success: true,
    data
  } as ApiResponse<Rule>);
}));

// POST /api/rules - Create rule
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, description, trigger_type, trigger_conditions, actions } = req.body;

  if (!name || !trigger_type) {
    return res.status(400).json({
      success: false,
      error: 'Name and trigger_type are required'
    } as ApiResponse<null>);
  }

  const { data, error } = await supabase
    .from('rules')
    .insert({
      name,
      description,
      trigger_type,
      trigger_conditions: trigger_conditions || {},
      actions: actions || [],
      is_active: true
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  console.log(`✅ Rule created: ${data.id} - ${name}`);

  res.status(201).json({
    success: true,
    data,
    message: 'Rule created successfully'
  } as ApiResponse<Rule>);
}));

// PUT /api/rules/:id - Update rule
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  delete updates.id;
  delete updates.created_at;

  const { data, error } = await supabase
    .from('rules')
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

  console.log(`✅ Rule updated: ${id}`);

  res.json({
    success: true,
    data,
    message: 'Rule updated successfully'
  } as ApiResponse<Rule>);
}));

// DELETE /api/rules/:id - Delete rule
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('rules')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  console.log(`✅ Rule deleted: ${id}`);

  res.json({
    success: true,
    message: 'Rule deleted successfully'
  } as ApiResponse<null>);
}));

// POST /api/rules/:id/toggle - Toggle rule active status
router.post('/:id/toggle', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Get current status
  const { data: current, error: fetchError } = await supabase
    .from('rules')
    .select('is_active')
    .eq('id', id)
    .single();

  if (fetchError) {
    return res.status(404).json({
      success: false,
      error: 'Rule not found'
    } as ApiResponse<null>);
  }

  // Toggle status
  const { data, error } = await supabase
    .from('rules')
    .update({ is_active: !current.is_active })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  console.log(`✅ Rule ${data.is_active ? 'activated' : 'deactivated'}: ${id}`);

  res.json({
    success: true,
    data,
    message: `Rule ${data.is_active ? 'activated' : 'deactivated'}`
  } as ApiResponse<Rule>);
}));

// POST /api/rules/parse - Parse natural language to rule (placeholder for AI)
router.post('/parse', asyncHandler(async (req: Request, res: Response) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      success: false,
      error: 'Text is required'
    } as ApiResponse<null>);
  }

  // Mock NL parsing - Intelligence Agent will implement real version
  const parsedRule = parseNaturalLanguageRule(text);

  res.json({
    success: true,
    data: parsedRule,
    message: 'Rule parsed from natural language'
  });
}));

// Helper function to parse natural language rules (mock)
function parseNaturalLanguageRule(text: string): Partial<Rule> {
  const lowerText = text.toLowerCase();

  let triggerType: string = 'custom';
  let triggerConditions: any = {};
  let actions: any[] = [];

  // Detect trigger type
  if (lowerText.includes('review') || lowerText.includes('star')) {
    triggerType = 'review';

    // Extract star rating if mentioned
    const starMatch = lowerText.match(/(\d)[- ]?star/);
    if (starMatch) {
      triggerConditions.rating = parseInt(starMatch[1]);
    }
  } else if (lowerText.includes('purchase') || lowerText.includes('buy')) {
    triggerType = 'purchase';
  } else if (lowerText.includes('signup') || lowerText.includes('register')) {
    triggerType = 'signup';
  } else if (lowerText.includes('inactive') || lowerText.includes('dormant')) {
    triggerType = 'inactivity';

    // Extract days if mentioned
    const daysMatch = lowerText.match(/(\d+)\s*days?/);
    if (daysMatch) {
      triggerConditions.days = parseInt(daysMatch[1]);
    }
  }

  // Detect actions
  if (lowerText.includes('referral')) {
    actions.push({ type: 'suggest_campaign', config: { campaign_type: 'referral' } });
  }
  if (lowerText.includes('email')) {
    actions.push({ type: 'send_notification', config: { channel: 'email' } });
  }
  if (lowerText.includes('campaign')) {
    actions.push({ type: 'suggest_campaign', config: {} });
  }

  return {
    name: `Auto-generated rule`,
    trigger_type: triggerType as any,
    trigger_conditions: triggerConditions,
    actions: actions.length > 0 ? actions : [{ type: 'suggest_campaign', config: {} }]
  };
}

export default router;
