// Brand Discovery Service
// Creates brand voice profiles from website analysis

import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { withFailsafe } from '../utils/failsafe';
import knowledgeBase, { BrandDocument } from './pinecone';

// Initialize Anthropic client
let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  return client;
}

export interface BrandVoiceProfile {
  brandId: string;
  name: string;
  tagline?: string;
  personality: string[];
  tone: string[];
  values: string[];
  targetAudience: string[];
  doMessages: string[];
  dontMessages: string[];
  powerWords: string[];
  avoidWords: string[];
  exampleMessages: {
    email: string;
    sms: string;
    social: string;
  };
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  createdAt: string;
  source: 'website' | 'documents' | 'manual';
}

// Fetch website content
async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    // Try to fetch the main page
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'TrustEye Brand Discovery Bot/1.0'
      }
    });

    // Extract text content (basic HTML stripping)
    let content = response.data;
    if (typeof content === 'string') {
      // Remove scripts and styles
      content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      // Remove HTML tags
      content = content.replace(/<[^>]+>/g, ' ');
      // Clean up whitespace
      content = content.replace(/\s+/g, ' ').trim();
      // Limit length
      return content.substring(0, 15000);
    }
    return '';
  } catch (error) {
    console.error('Error fetching website:', error);
    return '';
  }
}

// Create brand voice profile from website
export async function createBrandVoice(
  brandName: string,
  options: {
    websiteUrl?: string;
    existingDocuments?: string;
    industry?: string;
  }
): Promise<BrandVoiceProfile> {
  const result = await withFailsafe(
    `brand_discovery_${brandName}`,
    async () => {
      const anthropic = getClient();

      // Gather source material
      let sourceMaterial = '';

      if (options.websiteUrl) {
        const websiteContent = await fetchWebsiteContent(options.websiteUrl);
        if (websiteContent) {
          sourceMaterial += `\n\nWEBSITE CONTENT:\n${websiteContent}`;
        }
      }

      if (options.existingDocuments) {
        sourceMaterial += `\n\nEXISTING DOCUMENTS:\n${options.existingDocuments}`;
      }

      if (!sourceMaterial) {
        sourceMaterial = `Industry: ${options.industry || 'general business'}`;
      }

      const prompt = `Analyze the following content for ${brandName} and create a comprehensive brand voice profile.

${sourceMaterial}

Based on this content, create a brand voice profile in the following JSON format:
{
  "personality": ["array of 4-6 personality traits"],
  "tone": ["array of 4-6 tone descriptors"],
  "values": ["array of 4-6 core values"],
  "targetAudience": ["array of 3-5 target audience descriptions"],
  "doMessages": ["array of 4-6 messaging do's with examples"],
  "dontMessages": ["array of 4-6 messaging don'ts with examples"],
  "powerWords": ["array of 10-15 brand-appropriate power words"],
  "avoidWords": ["array of 10-15 words to avoid"],
  "exampleMessages": {
    "email": "A sample email message in the brand voice (50-100 words)",
    "sms": "A sample SMS message in the brand voice (under 160 characters)",
    "social": "A sample social media post in the brand voice (under 280 characters)"
  },
  "tagline": "Optional tagline if discoverable"
}

Only respond with valid JSON, no other text.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      const text = textContent ? textContent.text : '{}';

      let profileData;
      try {
        profileData = JSON.parse(text);
      } catch {
        // Extract JSON from text if wrapped
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        profileData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      }

      const brandId = brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');

      const profile: BrandVoiceProfile = {
        brandId,
        name: brandName,
        tagline: profileData.tagline,
        personality: profileData.personality || ['Professional', 'Friendly', 'Trustworthy'],
        tone: profileData.tone || ['Warm', 'Clear', 'Helpful'],
        values: profileData.values || ['Quality', 'Trust', 'Community'],
        targetAudience: profileData.targetAudience || ['General consumers'],
        doMessages: profileData.doMessages || ['Be clear and concise'],
        dontMessages: profileData.dontMessages || ['Avoid jargon'],
        powerWords: profileData.powerWords || ['Quality', 'Trust', 'Expert'],
        avoidWords: profileData.avoidWords || ['Cheap', 'Best', 'Guaranteed'],
        exampleMessages: profileData.exampleMessages || {
          email: `Hello,\n\nThank you for choosing ${brandName}. We appreciate your business.\n\nBest regards,\nThe ${brandName} Team`,
          sms: `Thanks for choosing ${brandName}! We're here to help. Reply HELP for assistance.`,
          social: `Proud to serve our community! #${brandName.replace(/\s+/g, '')}`
        },
        createdAt: new Date().toISOString(),
        source: options.websiteUrl ? 'website' : options.existingDocuments ? 'documents' : 'manual'
      };

      // Index the brand profile in the knowledge base
      const docs: BrandDocument[] = [
        {
          id: `${brandId}:profile:main`,
          content: JSON.stringify(profile, null, 2),
          metadata: {
            filename: 'brand_profile.json',
            brandId,
            type: 'guidelines',
            section: 'Brand Voice Profile',
            lastUpdated: new Date().toISOString()
          }
        },
        {
          id: `${brandId}:profile:personality`,
          content: `Brand Personality for ${brandName}:\n\nPersonality Traits: ${profile.personality.join(', ')}\nTone: ${profile.tone.join(', ')}\nValues: ${profile.values.join(', ')}`,
          metadata: {
            filename: 'brand_personality.txt',
            brandId,
            type: 'guidelines',
            section: 'Personality',
            lastUpdated: new Date().toISOString()
          }
        },
        {
          id: `${brandId}:profile:messaging`,
          content: `Messaging Guidelines for ${brandName}:\n\nDo:\n${profile.doMessages.map(m => `- ${m}`).join('\n')}\n\nDon't:\n${profile.dontMessages.map(m => `- ${m}`).join('\n')}`,
          metadata: {
            filename: 'brand_messaging.txt',
            brandId,
            type: 'guidelines',
            section: 'Messaging',
            lastUpdated: new Date().toISOString()
          }
        }
      ];

      await knowledgeBase.indexDocuments(docs);
      console.log(`✅ Brand profile for ${brandName} indexed`);

      return profile;
    },
    // Default fallback profile
    {
      brandId: brandName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: brandName,
      personality: ['Professional', 'Friendly', 'Trustworthy', 'Knowledgeable'],
      tone: ['Warm', 'Clear', 'Helpful', 'Confident'],
      values: ['Quality', 'Trust', 'Community', 'Excellence'],
      targetAudience: ['General consumers', 'Local community'],
      doMessages: ['Be clear and concise', 'Use friendly language', 'Show appreciation'],
      dontMessages: ['Avoid jargon', 'No pressure tactics', 'Don\'t use ALL CAPS'],
      powerWords: ['Quality', 'Trust', 'Expert', 'Reliable', 'Care', 'Value'],
      avoidWords: ['Cheap', 'Best', 'Guaranteed', 'Free', 'Limited time'],
      exampleMessages: {
        email: `Hello,\n\nThank you for being a valued customer. We're here to help.\n\nBest regards,\nThe ${brandName} Team`,
        sms: `Thanks for choosing ${brandName}! We appreciate your business.`,
        social: `Serving our community with pride! #${brandName.replace(/\s+/g, '')}`
      },
      createdAt: new Date().toISOString(),
      source: 'manual'
    }
  );

  return result.data;
}

// Get existing brand profile from knowledge base
export async function getBrandProfile(brandId: string): Promise<BrandVoiceProfile | null> {
  try {
    const results = await knowledgeBase.queryContext(
      'brand profile personality tone values',
      1,
      { brandId }
    );

    if (results.length > 0 && results[0].content.includes('"brandId"')) {
      return JSON.parse(results[0].content);
    }
    return null;
  } catch {
    return null;
  }
}

// Update brand profile
export async function updateBrandProfile(
  brandId: string,
  updates: Partial<BrandVoiceProfile>
): Promise<BrandVoiceProfile | null> {
  const existing = await getBrandProfile(brandId);
  if (!existing) return null;

  const updated: BrandVoiceProfile = {
    ...existing,
    ...updates,
    brandId // Ensure brandId doesn't change
  };

  // Re-index the updated profile
  const docs: BrandDocument[] = [{
    id: `${brandId}:profile:main`,
    content: JSON.stringify(updated, null, 2),
    metadata: {
      filename: 'brand_profile.json',
      brandId,
      type: 'guidelines',
      section: 'Brand Voice Profile',
      lastUpdated: new Date().toISOString()
    }
  }];

  await knowledgeBase.indexDocuments(docs);
  return updated;
}

export default {
  createBrandVoice,
  getBrandProfile,
  updateBrandProfile
};
