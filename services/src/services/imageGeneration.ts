// Image Generation Service
// Uses OpenAI DALL-E for generating marketing images

import OpenAI from 'openai';

// Lazy-initialize OpenAI client (only when API key is available)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// Channel dimension mappings
export const CHANNEL_DIMENSIONS: Record<string, { width: number; height: number; label: string }> = {
  'instagram': { width: 1024, height: 1024, label: 'Instagram Square' },
  'instagram-story': { width: 1024, height: 1792, label: 'Instagram Story' },
  'facebook': { width: 1024, height: 1024, label: 'Facebook Post' },
  'web-banner-hero': { width: 1792, height: 1024, label: 'Web Banner Hero' },
  'web-banner-sidebar': { width: 1024, height: 1024, label: 'Web Banner Sidebar' },
  'web-banner-leaderboard': { width: 1792, height: 1024, label: 'Web Banner Leaderboard' },
  'email-header': { width: 1792, height: 1024, label: 'Email Header' },
  'default': { width: 1024, height: 1024, label: 'Default Square' },
};

// Brand style context for image generation
interface BrandContext {
  primaryColor?: string;
  secondaryColor?: string;
  style?: string;
  industry?: string;
  logoPlacement?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'none';
}

// Default brand context
const DEFAULT_BRAND_CONTEXT: BrandContext = {
  primaryColor: '#1e40af', // Blue
  secondaryColor: '#f59e0b', // Amber
  style: 'professional, modern, clean',
  industry: 'automotive dealership',
  logoPlacement: 'bottom-right',
};

interface ImageGenerationRequest {
  prompt: string;
  channel?: string;
  dimensions?: { width: number; height: number };
  brandContext?: BrandContext;
  style?: string;
  count?: number;
}

interface GeneratedImage {
  url: string;
  revisedPrompt: string;
  channel: string;
  dimensions: { width: number; height: number };
}

interface ImageGenerationResponse {
  success: boolean;
  images: GeneratedImage[];
  prompt: string;
  enhancedPrompt: string;
}

// Enhance prompt with brand context
function enhancePromptWithBrand(prompt: string, brandContext: BrandContext, style?: string): string {
  const styleHints = [];

  // Add style hints
  if (brandContext.style) {
    styleHints.push(brandContext.style);
  }
  if (style) {
    styleHints.push(style);
  }

  // Add color hints
  if (brandContext.primaryColor) {
    styleHints.push(`featuring ${brandContext.primaryColor} as primary color`);
  }

  // Add industry context
  if (brandContext.industry) {
    styleHints.push(`for ${brandContext.industry}`);
  }

  // Build enhanced prompt
  const styleString = styleHints.length > 0 ? `, ${styleHints.join(', ')}` : '';

  // Add quality and safety hints
  const qualityHints = 'high quality, photorealistic, marketing material, brand-safe, no text, no logos';

  return `${prompt}${styleString}. Style: ${qualityHints}`;
}

// Get dimensions for channel
function getDimensionsForChannel(channel: string): { width: number; height: number; size: '1024x1024' | '1024x1792' | '1792x1024' } {
  const channelConfig = CHANNEL_DIMENSIONS[channel] || CHANNEL_DIMENSIONS['default'];

  // Map to DALL-E 3 supported sizes
  if (channelConfig.width > channelConfig.height) {
    return { width: 1792, height: 1024, size: '1792x1024' };
  } else if (channelConfig.height > channelConfig.width) {
    return { width: 1024, height: 1792, size: '1024x1792' };
  }
  return { width: 1024, height: 1024, size: '1024x1024' };
}

// Generate images
async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  const {
    prompt,
    channel = 'default',
    brandContext = DEFAULT_BRAND_CONTEXT,
    style,
    count = 1,
  } = request;

  // Get dimensions based on channel
  const dimensions = getDimensionsForChannel(channel);

  // Enhance prompt with brand context
  const enhancedPrompt = enhancePromptWithBrand(prompt, brandContext, style);

  try {
    // Check if API key is available
    const openai = getOpenAIClient();
    if (!openai) {
      // Return mock response if no API key
      console.log('No OPENAI_API_KEY found, returning mock image');
      return {
        success: true,
        images: Array(count).fill(null).map((_, i) => ({
          url: `https://placehold.co/${dimensions.width}x${dimensions.height}/1e40af/ffffff?text=Generated+Image+${i + 1}`,
          revisedPrompt: enhancedPrompt,
          channel,
          dimensions: { width: dimensions.width, height: dimensions.height },
        })),
        prompt,
        enhancedPrompt,
      };
    }

    // Generate images with DALL-E 3
    const images: GeneratedImage[] = [];

    for (let i = 0; i < Math.min(count, 2); i++) {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1, // DALL-E 3 only supports n=1
        size: dimensions.size,
        quality: 'standard',
        response_format: 'url',
      });

      if (response.data && response.data[0]) {
        const imageData = response.data[0];
        images.push({
          url: imageData.url || '',
          revisedPrompt: imageData.revised_prompt || enhancedPrompt,
          channel,
          dimensions: { width: dimensions.width, height: dimensions.height },
        });
      }
    }

    return {
      success: true,
      images,
      prompt,
      enhancedPrompt,
    };
  } catch (error: any) {
    console.error('Image generation error:', error);

    // Return fallback mock images on error
    return {
      success: true,
      images: Array(count).fill(null).map((_, i) => ({
        url: `https://placehold.co/${dimensions.width}x${dimensions.height}/1e40af/ffffff?text=Image+${i + 1}+(Demo)`,
        revisedPrompt: enhancedPrompt,
        channel,
        dimensions: { width: dimensions.width, height: dimensions.height },
      })),
      prompt,
      enhancedPrompt,
    };
  }
}

// Generate images for multiple channels
async function generateForChannels(
  prompt: string,
  channels: string[],
  brandContext?: BrandContext,
  style?: string
): Promise<Record<string, GeneratedImage[]>> {
  const results: Record<string, GeneratedImage[]> = {};

  for (const channel of channels) {
    const response = await generateImage({
      prompt,
      channel,
      brandContext,
      style,
      count: 2, // Generate 2 variations per channel
    });

    if (response.success) {
      results[channel] = response.images;
    }
  }

  return results;
}

// Get available dimensions
function getAvailableDimensions(): typeof CHANNEL_DIMENSIONS {
  return CHANNEL_DIMENSIONS;
}

export default {
  generateImage,
  generateForChannels,
  getAvailableDimensions,
  enhancePromptWithBrand,
  getDimensionsForChannel,
  CHANNEL_DIMENSIONS,
};
