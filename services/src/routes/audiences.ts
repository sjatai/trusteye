import { Router, Request, Response } from 'express';
import { supabase } from '../services/db';
import { asyncHandler } from '../middleware/errorHandler';
import { Audience, ApiResponse } from '../types';
import cache from '../services/cache';

const router = Router();

// GET /api/audiences - List all audiences
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { limit = 50 } = req.query;

  // Check cache first (60 second TTL for audience list - changes less frequently)
  const cacheKey = 'audiences:list';
  const cacheParams = { limit };
  const cached = cache.api.get(cacheKey, cacheParams);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const { data, error } = await supabase
    .from('audiences')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Number(limit));

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  const response = {
    success: true,
    data
  } as ApiResponse<Audience[]>;

  // Cache the response (60 second TTL)
  cache.api.set(cacheKey, cacheParams, response, 60000);
  res.setHeader('X-Cache', 'MISS');

  res.json(response);
}));

// GET /api/audiences/:id - Get single audience
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('audiences')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(404).json({
      success: false,
      error: 'Audience not found'
    } as ApiResponse<null>);
  }

  res.json({
    success: true,
    data
  } as ApiResponse<Audience>);
}));

// POST /api/audiences - Create audience
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, description, conditions } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Name is required'
    } as ApiResponse<null>);
  }

  // Calculate estimated size based on conditions (mock for now)
  const estimatedSize = calculateEstimatedSize(conditions);

  const { data, error } = await supabase
    .from('audiences')
    .insert({
      name,
      description,
      conditions: conditions || {},
      estimated_size: estimatedSize
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  console.log(`✅ Audience created: ${data.id} - ${name}`);

  // Invalidate audience list cache
  cache.api.invalidate('audiences:list');

  res.status(201).json({
    success: true,
    data,
    message: 'Audience created successfully'
  } as ApiResponse<Audience>);
}));

// PUT /api/audiences/:id - Update audience
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  delete updates.id;
  delete updates.created_at;

  // Recalculate estimated size if conditions changed
  if (updates.conditions) {
    updates.estimated_size = calculateEstimatedSize(updates.conditions);
  }

  const { data, error } = await supabase
    .from('audiences')
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

  console.log(`✅ Audience updated: ${id}`);

  // Invalidate audience list cache
  cache.api.invalidate('audiences:list');

  res.json({
    success: true,
    data,
    message: 'Audience updated successfully'
  } as ApiResponse<Audience>);
}));

// DELETE /api/audiences/:id - Delete audience
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('audiences')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<null>);
  }

  console.log(`✅ Audience deleted: ${id}`);

  // Invalidate audience list cache
  cache.api.invalidate('audiences:list');

  res.json({
    success: true,
    message: 'Audience deleted successfully'
  } as ApiResponse<null>);
}));

// GET /api/audiences/:id/estimate - Estimate audience size
router.get('/:id/estimate', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('audiences')
    .select('conditions')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(404).json({
      success: false,
      error: 'Audience not found'
    } as ApiResponse<null>);
  }

  const estimatedSize = calculateEstimatedSize(data.conditions);

  res.json({
    success: true,
    data: {
      estimated_size: estimatedSize,
      calculated_at: new Date().toISOString()
    }
  });
}));

// Helper function to calculate estimated audience size
function calculateEstimatedSize(conditions: any): number {
  if (!conditions || Object.keys(conditions).length === 0) {
    return 0;
  }

  // Mock calculation based on conditions
  let baseSize = 5000; // Assume 5000 total customers

  if (conditions.inactive_days) {
    // More inactive days = smaller audience
    const factor = Math.max(0.1, 1 - (conditions.inactive_days / 365));
    baseSize = Math.floor(baseSize * factor);
  }

  if (conditions.min_purchase_value) {
    // Higher min purchase = smaller audience
    const factor = Math.max(0.1, 1 - (conditions.min_purchase_value / 10000));
    baseSize = Math.floor(baseSize * factor);
  }

  if (conditions.location) {
    // Location filter reduces by ~70%
    baseSize = Math.floor(baseSize * 0.3);
  }

  if (conditions.tags && conditions.tags.length > 0) {
    // Each tag reduces by ~20%
    const factor = Math.max(0.1, 1 - (conditions.tags.length * 0.2));
    baseSize = Math.floor(baseSize * factor);
  }

  return Math.max(10, baseSize); // Minimum 10 customers
}

export default router;
