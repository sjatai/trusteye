import type { BrandTone } from '../types/content';

// Default brand tone for Premier Nissan
export const defaultBrandTone: BrandTone = {
  voice: 'Professional & Friendly',
  attributes: [
    'Warm',
    'Trustworthy',
    'Customer-focused',
    'Expert',
    'Approachable',
  ],
  wordsToUse: [
    'appreciate',
    'thank you',
    'valued',
    'welcome',
    'together',
    'care',
    'premium',
    'expert',
    'certified',
    'genuine',
    'family',
    'trust',
    'quality',
    'complimentary',
  ],
  wordsToAvoid: [
    'cheap',
    'discount' /* prefer 'savings' or 'offer' */,
    'buy now' /* too aggressive */,
    'limited time only' /* without context */,
    'act fast',
    'don\'t miss out',
    'you won\'t believe',
    'guarantee' /* unless legally backed */,
    'best price',
    'lowest',
  ],
  emojiUsage: 'sparingly',
  exclamationPolicy: 'sparingly',
  channelOverrides: {
    'email': {
      voice: 'Professional & Warm',
      attributes: ['Detailed', 'Helpful', 'Personal'],
      emojiUsage: 'sparingly',
      maxLength: 2000,
    },
    'sms': {
      voice: 'Friendly & Direct',
      attributes: ['Concise', 'Action-oriented', 'Clear'],
      emojiUsage: 'none',
      maxLength: 160,
    },
    'instagram': {
      voice: 'Casual & Engaging',
      attributes: ['Fun', 'Visual', 'Community-focused', 'Trendy'],
      emojiUsage: 'freely',
      maxLength: 2200,
    },
    'slack': {
      voice: 'Informative & Action-oriented',
      attributes: ['Clear', 'Urgent when needed', 'Data-driven'],
      emojiUsage: 'sparingly',
      maxLength: 4000,
    },
    'web-banner': {
      voice: 'Punchy & Clear',
      attributes: ['Concise', 'Eye-catching', 'Action-driven'],
      emojiUsage: 'sparingly',
      maxLength: 100,
    },
  },
};

// Helper to get effective tone for a channel
export function getChannelTone(channel: keyof typeof defaultBrandTone.channelOverrides): {
  voice: string;
  attributes: string[];
  emojiUsage: 'none' | 'sparingly' | 'freely';
  maxLength: number;
} {
  const override = defaultBrandTone.channelOverrides[channel];
  return {
    voice: override?.voice || defaultBrandTone.voice,
    attributes: override?.attributes || defaultBrandTone.attributes,
    emojiUsage: override?.emojiUsage || defaultBrandTone.emojiUsage,
    maxLength: override?.maxLength || 2000,
  };
}

// Emoji usage descriptions
export const EMOJI_USAGE_LABELS = {
  'none': 'No emojis',
  'sparingly': 'Use sparingly (1-2 per message)',
  'freely': 'Use freely where appropriate',
};

// Voice options for editing
export const VOICE_OPTIONS = [
  'Professional & Friendly',
  'Professional & Warm',
  'Friendly & Direct',
  'Casual & Engaging',
  'Formal & Authoritative',
  'Playful & Fun',
  'Informative & Action-oriented',
  'Empathetic & Supportive',
];

// Attribute suggestions
export const ATTRIBUTE_SUGGESTIONS = [
  'Warm',
  'Trustworthy',
  'Customer-focused',
  'Expert',
  'Approachable',
  'Detailed',
  'Helpful',
  'Personal',
  'Concise',
  'Action-oriented',
  'Clear',
  'Fun',
  'Visual',
  'Community-focused',
  'Trendy',
  'Urgent when needed',
  'Data-driven',
  'Eye-catching',
  'Empathetic',
  'Professional',
];
