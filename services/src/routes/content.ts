// Content Library Routes
// CRUD operations for content templates and brand tone management

import { Router, Request, Response } from 'express';

const router = Router();

// In-memory storage (would be Supabase in production)
interface ContentItem {
  id: string;
  name: string;
  type: 'template' | 'asset' | 'banner';
  channels: string[];
  campaignTypes: string[];
  content: {
    subject?: string;
    body?: string;
    cta?: string;
  };
  brandScore: number;
  performance: {
    timesUsed: number;
    avgOpenRate: number;
    avgClickRate: number;
    bestPerformingIn: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BrandTone {
  id: string;
  brandId: string;
  voice: string;
  attributes: string[];
  wordsToUse: string[];
  wordsToAvoid: string[];
  emojiUsage: 'never' | 'sparingly' | 'encouraged';
  exclamationPolicy: 'never' | 'sparingly' | 'freely';
  channelOverrides: Record<string, Partial<BrandTone>>;
  updatedAt: string;
}

// Mock data stores
const contentLibrary: Map<string, ContentItem> = new Map();
const brandTones: Map<string, BrandTone> = new Map();

// Initialize with default brand tone
brandTones.set('premier-nissan', {
  id: 'premier-nissan-tone',
  brandId: 'premier-nissan',
  voice: 'Friendly & Professional',
  attributes: ['Trustworthy', 'Helpful', 'Knowledgeable', 'Approachable'],
  wordsToUse: ['family', 'value', 'service', 'trusted', 'community', 'experience', 'quality', 'reliable'],
  wordsToAvoid: ['cheap', 'discount', 'desperate', 'urgent', 'limited time only'],
  emojiUsage: 'sparingly',
  exclamationPolicy: 'sparingly',
  channelOverrides: {
    'instagram': {
      emojiUsage: 'encouraged',
      attributes: ['Friendly', 'Engaging', 'Visual'],
    },
    'sms': {
      exclamationPolicy: 'never',
      attributes: ['Concise', 'Direct', 'Helpful'],
    },
  },
  updatedAt: new Date().toISOString(),
});

// Initialize with some mock content
const mockContent: ContentItem[] = [
  {
    id: 'tpl-001',
    name: '5-Star Review Thank You',
    type: 'template',
    channels: ['email'],
    campaignTypes: ['referral'],
    content: {
      subject: 'Thank you for your amazing review, {{first_name}}!',
      body: 'Hi {{first_name}},\n\nWe just saw your 5-star review and wanted to personally thank you! Your kind words mean the world to our team.\n\nAs a thank you, we\'d love to offer you and your friends something special...',
      cta: 'Share the Love',
    },
    brandScore: 92,
    performance: {
      timesUsed: 156,
      avgOpenRate: 34.2,
      avgClickRate: 12.8,
      bestPerformingIn: 'referral',
    },
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
  },
  {
    id: 'tpl-002',
    name: 'Service Reminder',
    type: 'template',
    channels: ['email', 'sms'],
    campaignTypes: ['service'],
    content: {
      subject: 'Time for your {{vehicle}} service, {{first_name}}',
      body: 'Hi {{first_name}},\n\nIt\'s been 6 months since we last serviced your {{vehicle}}. Keeping up with regular maintenance helps ensure your vehicle runs smoothly for years to come.\n\nSchedule your service appointment today!',
      cta: 'Book Service',
    },
    brandScore: 88,
    performance: {
      timesUsed: 234,
      avgOpenRate: 28.5,
      avgClickRate: 15.2,
      bestPerformingIn: 'service',
    },
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
  },
];

mockContent.forEach(item => contentLibrary.set(item.id, item));

// ============================================
// CONTENT LIBRARY CRUD
// ============================================

// GET /api/content - List all content
router.get('/', async (req: Request, res: Response) => {
  try {
    const { channel, campaignType, type } = req.query;

    let items = Array.from(contentLibrary.values());

    // Filter by channel
    if (channel) {
      items = items.filter(item => item.channels.includes(channel as string));
    }

    // Filter by campaign type
    if (campaignType) {
      items = items.filter(item => item.campaignTypes.includes(campaignType as string));
    }

    // Filter by type
    if (type) {
      items = items.filter(item => item.type === type);
    }

    // Sort by updatedAt desc
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    res.json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (error) {
    console.error('List content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list content'
    });
  }
});

// GET /api/content/:id - Get single content item
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = contentLibrary.get(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content'
    });
  }
});

// POST /api/content - Create content
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, channels, campaignTypes, content, brandScore } = req.body;

    if (!name || !type || !channels || !content) {
      return res.status(400).json({
        success: false,
        error: 'name, type, channels, and content are required'
      });
    }

    const id = `tpl-${Date.now()}`;
    const now = new Date().toISOString();

    const newItem: ContentItem = {
      id,
      name,
      type,
      channels,
      campaignTypes: campaignTypes || [],
      content,
      brandScore: brandScore || 85,
      performance: {
        timesUsed: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        bestPerformingIn: campaignTypes?.[0] || 'promotional',
      },
      createdAt: now,
      updatedAt: now,
    };

    contentLibrary.set(id, newItem);

    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Content created successfully'
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create content'
    });
  }
});

// PUT /api/content/:id - Update content
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = contentLibrary.get(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    const updated: ContentItem = {
      ...existing,
      ...updates,
      id, // Prevent id change
      updatedAt: new Date().toISOString(),
    };

    contentLibrary.set(id, updated);

    res.json({
      success: true,
      data: updated,
      message: 'Content updated successfully'
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update content'
    });
  }
});

// DELETE /api/content/:id - Delete content
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!contentLibrary.has(id)) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    contentLibrary.delete(id);

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete content'
    });
  }
});

// ============================================
// BRAND TONE CRUD
// ============================================

// GET /api/content/brand-tone - Get brand tone
router.get('/brand-tone/:brandId', async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;
    const tone = brandTones.get(brandId);

    if (!tone) {
      // Return default tone
      return res.json({
        success: true,
        data: brandTones.get('premier-nissan')
      });
    }

    res.json({
      success: true,
      data: tone
    });
  } catch (error) {
    console.error('Get brand tone error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get brand tone'
    });
  }
});

// PUT /api/content/brand-tone/:brandId - Update brand tone
router.put('/brand-tone/:brandId', async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;
    const updates = req.body;

    const existing = brandTones.get(brandId) || brandTones.get('premier-nissan')!;

    const updated: BrandTone = {
      ...existing,
      ...updates,
      brandId,
      updatedAt: new Date().toISOString(),
    };

    brandTones.set(brandId, updated);

    res.json({
      success: true,
      data: updated,
      message: 'Brand tone updated successfully'
    });
  } catch (error) {
    console.error('Update brand tone error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update brand tone'
    });
  }
});

// PUT /api/content/brand-tone/:brandId/channel/:channel - Update channel override
router.put('/brand-tone/:brandId/channel/:channel', async (req: Request, res: Response) => {
  try {
    const { brandId, channel } = req.params;
    const override = req.body;

    const existing = brandTones.get(brandId) || brandTones.get('premier-nissan')!;

    const updated: BrandTone = {
      ...existing,
      channelOverrides: {
        ...existing.channelOverrides,
        [channel]: {
          ...(existing.channelOverrides[channel] || {}),
          ...override,
        },
      },
      updatedAt: new Date().toISOString(),
    };

    brandTones.set(brandId, updated);

    res.json({
      success: true,
      data: updated,
      message: `Channel override for ${channel} updated successfully`
    });
  } catch (error) {
    console.error('Update channel override error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update channel override'
    });
  }
});

export default router;
