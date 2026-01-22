// AI Routes
// Exposes all Intelligence Agent services via API

import { Router, Request, Response } from 'express';
import claude from '../services/claude';
import contentGen from '../services/contentGen';
import cache from '../services/cache';
import brandDiscovery from '../services/brandDiscovery';
import birdeye from '../services/birdeye';
import suggestions from '../services/suggestions';
import gateTwo from '../services/gateTwo';
import knowledgeBase from '../services/pinecone';
import intelligence from '../services/intelligenceOrchestrator';
import { parseIntent, quickParse } from '../services/intentParser';
import { calculateConfidence } from '../services/confidenceScorer';
import { getLearningStats, recordCorrection } from '../services/learningEngine';

const router = Router();

// ============================================
// CHAT
// ============================================

// POST /api/ai/chat - Chat with AI assistant
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [], brandId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const response = await claude.chat(message, history, brandId);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message'
    });
  }
});

// POST /api/ai/analyze-intent - Analyze user intent
router.post('/analyze-intent', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const intent = await claude.analyzeIntent(message);

    res.json({
      success: true,
      data: intent
    });
  } catch (error) {
    console.error('Intent analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze intent'
    });
  }
});

// ============================================
// CONTENT GENERATION
// ============================================

// POST /api/ai/content/generate - Generate content
router.post('/content/generate', async (req: Request, res: Response) => {
  try {
    const { campaignType, audience, channels, goal, brandId, customInstructions } = req.body;

    if (!campaignType || !audience || !channels || !goal) {
      return res.status(400).json({
        success: false,
        error: 'campaignType, audience, channels, and goal are required'
      });
    }

    const content = await contentGen.generateContent({
      campaignType,
      audience,
      channels,
      goal,
      brandId,
      customInstructions
    });

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate content'
    });
  }
});

// POST /api/ai/content/score - Calculate brand score
router.post('/content/score', async (req: Request, res: Response) => {
  try {
    const { content, brandId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const score = await contentGen.calculateBrandScore(content, brandId);

    res.json({
      success: true,
      data: score
    });
  } catch (error) {
    console.error('Brand score error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate brand score'
    });
  }
});

// POST /api/ai/content/variations - Generate variations
router.post('/content/variations', async (req: Request, res: Response) => {
  try {
    const { content, contentType, count = 3, brandId } = req.body;

    if (!content || !contentType) {
      return res.status(400).json({
        success: false,
        error: 'content and contentType are required'
      });
    }

    const variations = await contentGen.generateVariations(content, contentType, count, brandId);

    res.json({
      success: true,
      data: variations
    });
  } catch (error) {
    console.error('Variations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate variations'
    });
  }
});

// ============================================
// BRAND DISCOVERY
// ============================================

// POST /api/ai/brand/create - Create brand voice profile
router.post('/brand/create', async (req: Request, res: Response) => {
  try {
    const { brandName, websiteUrl, existingDocuments, industry } = req.body;

    if (!brandName) {
      return res.status(400).json({
        success: false,
        error: 'brandName is required'
      });
    }

    const profile = await brandDiscovery.createBrandVoice(brandName, {
      websiteUrl,
      existingDocuments,
      industry
    });

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Brand creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create brand profile'
    });
  }
});

// GET /api/ai/brand/:brandId - Get brand profile
router.get('/brand/:brandId', async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;

    const profile = await brandDiscovery.getBrandProfile(brandId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Brand profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Brand fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand profile'
    });
  }
});

// ============================================
// SUGGESTIONS
// ============================================

// GET /api/ai/suggestions/:businessId - Get proactive suggestions
router.get('/suggestions/:businessId', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;

    const suggestionsList = await suggestions.generateSuggestions(businessId);

    res.json({
      success: true,
      data: suggestionsList
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions'
    });
  }
});

// GET /api/ai/suggestions - Get suggestions (default business)
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const suggestionsList = await suggestions.generateSuggestions();

    res.json({
      success: true,
      data: suggestionsList
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions'
    });
  }
});

// ============================================
// REVIEWS (BIRDEYE)
// ============================================

// GET /api/ai/reviews/:businessId - Get reviews
router.get('/reviews/:businessId', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const { count, minRating, maxRating } = req.query;

    const reviews = await birdeye.getReviews(businessId, {
      count: count ? parseInt(count as string) : undefined,
      minRating: minRating ? parseInt(minRating as string) : undefined,
      maxRating: maxRating ? parseInt(maxRating as string) : undefined
    });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
});

// POST /api/ai/reviews/analyze - Analyze reviews
router.post('/reviews/analyze', async (req: Request, res: Response) => {
  try {
    const { reviews, businessId } = req.body;

    let reviewsToAnalyze = reviews;

    // If no reviews provided, fetch them
    if (!reviewsToAnalyze && businessId) {
      reviewsToAnalyze = await birdeye.getReviews(businessId, { count: 20 });
    }

    if (!reviewsToAnalyze || reviewsToAnalyze.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No reviews to analyze'
      });
    }

    const summary = await birdeye.analyzeReviews(reviewsToAnalyze);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Reviews analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze reviews'
    });
  }
});

// POST /api/ai/reviews/analyze-single - Analyze single review
router.post('/reviews/analyze-single', async (req: Request, res: Response) => {
  try {
    const { review } = req.body;

    if (!review) {
      return res.status(400).json({
        success: false,
        error: 'Review is required'
      });
    }

    const analysis = await birdeye.analyzeReview(review);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Review analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze review'
    });
  }
});

// ============================================
// GATE 2 - AI REVIEW
// ============================================

// POST /api/ai/review - Review content (Gate 2)
router.post('/review', async (req: Request, res: Response) => {
  try {
    const { content, brandId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const result = await gateTwo.reviewContent(content, brandId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Gate 2 review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to review content'
    });
  }
});

// POST /api/ai/review/quick - Quick content check
router.post('/review/quick', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const result = gateTwo.quickCheck(content);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Quick review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check content'
    });
  }
});

// ============================================
// KNOWLEDGE BASE
// ============================================

// GET /api/ai/knowledge/stats - Get knowledge base stats
router.get('/knowledge/stats', async (req: Request, res: Response) => {
  try {
    const stats = await knowledgeBase.getIndexStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Knowledge stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get knowledge stats'
    });
  }
});

// POST /api/ai/knowledge/query - Query knowledge base
router.post('/knowledge/query', async (req: Request, res: Response) => {
  try {
    const { query, topK = 5, filter } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const results = await knowledgeBase.queryContext(query, topK, filter);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Knowledge query error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to query knowledge base'
    });
  }
});

// ============================================
// CACHING
// ============================================

// GET /api/ai/cache/stats - Get cache statistics
router.get('/cache/stats', async (req: Request, res: Response) => {
  try {
    const stats = cache.getAllStats();

    // Calculate totals
    const totalHits = Object.values(stats).reduce((sum, s) => sum + s.hits, 0);
    const totalMisses = Object.values(stats).reduce((sum, s) => sum + s.misses, 0);
    const totalSize = Object.values(stats).reduce((sum, s) => sum + s.size, 0);
    const overallHitRate = totalHits + totalMisses > 0
      ? totalHits / (totalHits + totalMisses)
      : 0;

    res.json({
      success: true,
      data: {
        caches: stats,
        totals: {
          hits: totalHits,
          misses: totalMisses,
          size: totalSize,
          hitRate: overallHitRate,
          savedTokens: stats.ai.savedTokens,
          savedMs: stats.ai.savedMs
        }
      }
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache stats'
    });
  }
});

// POST /api/ai/cache/clear - Clear all caches
router.post('/cache/clear', async (req: Request, res: Response) => {
  try {
    cache.clearAll();

    res.json({
      success: true,
      message: 'All caches cleared'
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear caches'
    });
  }
});

// ============================================
// INTELLIGENCE ENGINE
// ============================================

// POST /api/ai/intelligence/process - Process message with full intelligence
router.post('/intelligence/process', async (req: Request, res: Response) => {
  try {
    const { message, sessionId, brandId, userId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const session = sessionId || intelligence.generateSessionId();
    const result = await intelligence.processMessage(
      message,
      session,
      brandId || 'premier-nissan',
      userId
    );

    res.json({
      success: true,
      data: {
        ...result,
        sessionId: session
      }
    });
  } catch (error) {
    console.error('Intelligence process error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
});

// POST /api/ai/intelligence/quick - Quick process without AI
router.post('/intelligence/quick', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const result = intelligence.quickProcess(message);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Quick process error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to quick process message'
    });
  }
});

// POST /api/ai/intelligence/parse - Parse intent from message
router.post('/intelligence/parse', async (req: Request, res: Response) => {
  try {
    const { message, useAI = false } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const intent = useAI ? await parseIntent(message) : quickParse(message);

    res.json({
      success: true,
      data: intent
    });
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse intent'
    });
  }
});

// POST /api/ai/intelligence/confidence - Calculate confidence score
router.post('/intelligence/confidence', async (req: Request, res: Response) => {
  try {
    const { intent } = req.body;

    if (!intent) {
      return res.status(400).json({
        success: false,
        error: 'Intent is required'
      });
    }

    const confidence = calculateConfidence(intent);

    res.json({
      success: true,
      data: confidence
    });
  } catch (error) {
    console.error('Confidence error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate confidence'
    });
  }
});

// POST /api/ai/intelligence/correction - Record a correction
router.post('/intelligence/correction', async (req: Request, res: Response) => {
  try {
    const { sessionId, originalInput, correction, brandId, userId } = req.body;

    if (!originalInput || !correction) {
      return res.status(400).json({
        success: false,
        error: 'originalInput and correction are required'
      });
    }

    await intelligence.handleCorrection(
      sessionId,
      originalInput,
      correction,
      brandId || 'premier-nissan',
      userId
    );

    res.json({
      success: true,
      message: 'Correction recorded'
    });
  } catch (error) {
    console.error('Correction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record correction'
    });
  }
});

// GET /api/ai/intelligence/stats - Get learning stats
router.get('/intelligence/stats', async (req: Request, res: Response) => {
  try {
    const { brandId } = req.query;

    const stats = await getLearningStats(brandId as string);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get learning stats'
    });
  }
});

// GET /api/ai/intelligence/status - Get system status
router.get('/intelligence/status', async (req: Request, res: Response) => {
  try {
    const { brandId } = req.query;

    const status = await intelligence.getSystemStatus(brandId as string);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status'
    });
  }
});

// GET /api/ai/intelligence/conversation/:sessionId - Get conversation summary
router.get('/intelligence/conversation/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const summary = await intelligence.getConversationSummary(sessionId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Conversation summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation summary'
    });
  }
});

// ============================================
// TEMPLATES & RECOMMENDATIONS
// ============================================

import { CAMPAIGN_TEMPLATES, getTemplateById, getTemplatesByType, renderTemplate } from '../config/templates';
import { getRecommendationsForCustomer, getMarketingInsights, analyzeCampaignConcept } from '../services/recommendations';
import feedbackLoop from '../services/feedbackLoop';
import imageGeneration from '../services/imageGeneration';

// GET /api/ai/templates - Get all campaign templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    const templates = type
      ? getTemplatesByType(type as string)
      : CAMPAIGN_TEMPLATES;

    res.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get templates'
    });
  }
});

// GET /api/ai/templates/:id - Get single template
router.get('/templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template'
    });
  }
});

// POST /api/ai/templates/:id/render - Render template with variables
router.post('/templates/:id/render', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { variables } = req.body;

    const template = getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    const rendered = renderTemplate(template, variables || {});

    res.json({
      success: true,
      data: {
        template: template.name,
        ...rendered
      }
    });
  } catch (error) {
    console.error('Render error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to render template'
    });
  }
});

// POST /api/ai/recommendations - Get campaign recommendations for customer
router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const { customer, limit } = req.body;

    if (!customer) {
      return res.status(400).json({
        success: false,
        error: 'Customer profile is required'
      });
    }

    const recommendations = getRecommendationsForCustomer(customer, limit || 3);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    });
  }
});

// GET /api/ai/marketing-insights - Get marketing insights
router.get('/marketing-insights', async (req: Request, res: Response) => {
  try {
    const { segment, campaignType } = req.query;

    const insights = getMarketingInsights(
      segment as string || 'regular',
      campaignType as string || 'promotional'
    );

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get marketing insights'
    });
  }
});

// POST /api/ai/analyze-campaign - Analyze campaign concept
router.post('/analyze-campaign', async (req: Request, res: Response) => {
  try {
    const { type, targetSegment, discount, sendTime } = req.body;

    if (!type || !targetSegment) {
      return res.status(400).json({
        success: false,
        error: 'Campaign type and targetSegment are required'
      });
    }

    const analysis = analyzeCampaignConcept({ type, targetSegment, discount, sendTime });

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze campaign'
    });
  }
});

// ============================================
// FEEDBACK LOOP - "What changed since last time"
// Demonstrates: Memory, Causality, Adaptation, Control
// ============================================

// GET /api/ai/feedback/what-changed/:campaignType - Get "What changed since last time"
router.get('/feedback/what-changed/:campaignType', async (req: Request, res: Response) => {
  try {
    const { campaignType } = req.params;

    const whatChanged = feedbackLoop.getWhatChanged(campaignType);

    res.json({
      success: true,
      data: whatChanged
    });
  } catch (error) {
    console.error('What changed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get adjustments'
    });
  }
});

// GET /api/ai/feedback/what-changed - Get adjustments (default: referral)
router.get('/feedback/what-changed', async (req: Request, res: Response) => {
  try {
    const campaignType = (req.query.campaignType as string) || 'referral';

    const whatChanged = feedbackLoop.getWhatChanged(campaignType);

    res.json({
      success: true,
      data: whatChanged
    });
  } catch (error) {
    console.error('What changed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get adjustments'
    });
  }
});

// GET /api/ai/feedback/summary/:campaignType - Get full feedback summary
router.get('/feedback/summary/:campaignType', async (req: Request, res: Response) => {
  try {
    const { campaignType } = req.params;

    const summary = feedbackLoop.getFeedbackSummary(campaignType);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Feedback summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feedback summary'
    });
  }
});

// GET /api/ai/feedback/learnings - Get all learnings
router.get('/feedback/learnings', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    const learnings = feedbackLoop.getLearnings(type as any);

    res.json({
      success: true,
      data: learnings,
      count: learnings.length
    });
  } catch (error) {
    console.error('Learnings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get learnings'
    });
  }
});

// POST /api/ai/feedback/record - Record a new learning
router.post('/feedback/record', async (req: Request, res: Response) => {
  try {
    const { type, insight, action, source, confidence, impact } = req.body;

    if (!type || !insight || !action || !source) {
      return res.status(400).json({
        success: false,
        error: 'type, insight, action, and source are required'
      });
    }

    const learning = feedbackLoop.recordLearning({
      type,
      insight,
      action,
      source,
      confidence: confidence || 80,
      impact
    });

    res.json({
      success: true,
      data: learning,
      message: 'Learning recorded successfully'
    });
  } catch (error) {
    console.error('Record learning error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record learning'
    });
  }
});

// ============================================
// IMAGE GENERATION (DALL-E)
// ============================================

// POST /api/ai/image/generate - Generate marketing image
router.post('/image/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, channel, brandContext, style, count } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = await imageGeneration.generateImage({
      prompt,
      channel: channel || 'default',
      brandContext,
      style,
      count: count || 2
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate image'
    });
  }
});

// POST /api/ai/image/generate-multi - Generate images for multiple channels
router.post('/image/generate-multi', async (req: Request, res: Response) => {
  try {
    const { prompt, channels, brandContext, style } = req.body;

    if (!prompt || !channels || !Array.isArray(channels)) {
      return res.status(400).json({
        success: false,
        error: 'Prompt and channels array are required'
      });
    }

    const results = await imageGeneration.generateForChannels(
      prompt,
      channels,
      brandContext,
      style
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Multi-channel image generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate images'
    });
  }
});

// GET /api/ai/image/dimensions - Get available image dimensions
router.get('/image/dimensions', async (req: Request, res: Response) => {
  try {
    const dimensions = imageGeneration.getAvailableDimensions();

    res.json({
      success: true,
      data: dimensions
    });
  } catch (error) {
    console.error('Dimensions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dimensions'
    });
  }
});

export default router;
