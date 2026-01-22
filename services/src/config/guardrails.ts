// Guardrails Configuration
// Defines what AI CANNOT do - safety checks

export interface GuardrailResult {
  passed: boolean;
  message?: string;
  transformed?: string;
}

export interface Guardrail {
  id: string;
  name: string;
  type: 'block' | 'warn' | 'transform';
  check: (content: string, context?: any) => GuardrailResult;
}

export const GUARDRAILS: Guardrail[] = [
  // ========================================
  // CONTENT SAFETY
  // ========================================
  {
    id: 'no_hate_speech',
    name: 'No Hate Speech',
    type: 'block',
    check: (content) => {
      const hatePhrases = [
        'hate', 'racist', 'sexist', 'bigot', 'discriminat'
      ];
      const found = hatePhrases.some(p => content.toLowerCase().includes(p));
      return {
        passed: !found,
        message: found ? 'Content may contain hate speech' : undefined
      };
    }
  },
  {
    id: 'no_threats',
    name: 'No Threats or Violence',
    type: 'block',
    check: (content) => {
      const threatPhrases = [
        'kill', 'hurt', 'attack', 'destroy', 'violence', 'threat'
      ];
      const found = threatPhrases.some(p => content.toLowerCase().includes(p));
      return {
        passed: !found,
        message: found ? 'Content contains threatening language' : undefined
      };
    }
  },
  {
    id: 'no_explicit_content',
    name: 'No Explicit Content',
    type: 'block',
    check: (content) => {
      const explicitPhrases = [
        'xxx', 'porn', 'nude', 'explicit', 'sex', 'sexual', 'erotic', 'adult content'
      ];
      const found = explicitPhrases.find(p => content.toLowerCase().includes(p));
      return {
        passed: !found,
        message: found ? `Content contains explicit material: "${found}"` : undefined
      };
    }
  },
  {
    id: 'no_profanity',
    name: 'No Profanity',
    type: 'block',
    check: (content) => {
      const profanityList = [
        'fuck', 'shit', 'damn', 'ass', 'bitch', 'crap', 'hell',
        'bastard', 'piss', 'dick', 'cock', 'pussy', 'whore', 'slut',
        'asshole', 'bullshit', 'goddamn', 'motherfucker', 'wtf', 'stfu'
      ];
      const found = profanityList.find(p => {
        const regex = new RegExp(`\\b${p}\\b`, 'i');
        return regex.test(content);
      });
      return {
        passed: !found,
        message: found ? `Content contains profanity: "${found}"` : undefined
      };
    }
  },

  // ========================================
  // PROFESSIONAL STANDARDS
  // ========================================
  {
    id: 'no_investment_advice',
    name: 'No Investment Advice',
    type: 'block',
    check: (content) => {
      const patterns = [
        'you should invest',
        'buy this stock',
        'guaranteed returns',
        'financial advice',
        'investment opportunity'
      ];
      const found = patterns.some(p => content.toLowerCase().includes(p));
      return {
        passed: !found,
        message: found ? 'Content contains investment advice' : undefined
      };
    }
  },
  {
    id: 'no_political_opinions',
    name: 'No Political Opinions',
    type: 'block',
    check: (content) => {
      const patterns = [
        'vote for',
        'political party',
        'democrat',
        'republican',
        'liberal',
        'conservative',
        'left wing',
        'right wing'
      ];
      const found = patterns.some(p => content.toLowerCase().includes(p));
      return {
        passed: !found,
        message: found ? 'Content contains political opinions' : undefined
      };
    }
  },
  {
    id: 'no_medical_claims',
    name: 'No Medical Claims',
    type: 'block',
    check: (content) => {
      const patterns = [
        'cure', 'treat disease', 'medical advice', 'diagnos'
      ];
      const found = patterns.some(p => content.toLowerCase().includes(p));
      return {
        passed: !found,
        message: found ? 'Content contains medical claims' : undefined
      };
    }
  },
  {
    id: 'no_slang_jargon',
    name: 'No Slang or Jargon',
    type: 'warn',
    check: (content) => {
      const slang = ['gonna', 'wanna', 'kinda', 'sorta', "ya'll", "ain't", 'gotta'];
      const found = slang.some(s => content.toLowerCase().includes(s));
      return {
        passed: !found,
        message: found ? 'Content contains slang' : undefined
      };
    }
  },

  // ========================================
  // BRAND COMPLIANCE (Premier Nissan specific)
  // ========================================
  {
    id: 'no_pressure_tactics',
    name: 'No Pressure Tactics',
    type: 'warn',
    check: (content) => {
      const patterns = [
        'act now',
        'limited time only',
        "don't miss out",
        'expires soon',
        'only \\d+ left',
        'before it\'s too late',
        'hurry',
        'last chance'
      ];
      const found = patterns.some(p => new RegExp(p, 'i').test(content));
      return {
        passed: !found,
        message: found ? 'Content uses pressure tactics (against brand guidelines)' : undefined
      };
    }
  },
  {
    id: 'no_fear_messaging',
    name: 'No Fear-Based Messaging',
    type: 'warn',
    check: (content) => {
      const patterns = [
        'your car could break',
        'dangerous',
        'unsafe',
        'risk of',
        'before it fails'
      ];
      const found = patterns.some(p => content.toLowerCase().includes(p));
      return {
        passed: !found,
        message: found ? 'Content uses fear-based messaging (against brand guidelines)' : undefined
      };
    }
  },
  {
    id: 'no_all_caps',
    name: 'No ALL CAPS',
    type: 'warn',
    check: (content) => {
      // Check for words with 4+ consecutive caps (excluding common acronyms)
      const capsPattern = /\b[A-Z]{4,}\b/g;
      const matches = content.match(capsPattern) || [];
      const allowedAcronyms = ['HTML', 'HTTP', 'JSON', 'API', 'SMS', 'CTA', 'URL'];
      const violations = matches.filter(m => !allowedAcronyms.includes(m));
      return {
        passed: violations.length === 0,
        message: violations.length ? `ALL CAPS detected: ${violations.join(', ')}` : undefined
      };
    }
  },
  {
    id: 'no_excessive_punctuation',
    name: 'No Excessive Punctuation',
    type: 'warn',
    check: (content) => {
      const multiExclamation = /!{2,}/.test(content);
      const multiQuestion = /\?{2,}/.test(content);
      const excessive = multiExclamation || multiQuestion;
      return {
        passed: !excessive,
        message: excessive ? 'Excessive punctuation (!! or ??) detected' : undefined
      };
    }
  },
  {
    id: 'no_misleading_claims',
    name: 'No Misleading Claims',
    type: 'block',
    check: (content) => {
      const patterns = [
        'best in town',
        'lowest price guaranteed',
        '#1 dealer',
        'number one',
        'unbeatable',
        'best deal ever'
      ];
      const found = patterns.some(p => content.toLowerCase().includes(p));
      return {
        passed: !found,
        message: found ? 'Content contains potentially misleading claims' : undefined
      };
    }
  },
  {
    id: 'no_competitor_negativity',
    name: 'No Competitor Negativity',
    type: 'warn',
    check: (content, context) => {
      const competitors = context?.competitors || [
        'valley honda', 'downtown toyota', 'metro chevrolet', 'city ford'
      ];
      const negativePatterns = ['worse than', 'better than', 'unlike', 'don\'t go to'];

      for (const competitor of competitors) {
        for (const pattern of negativePatterns) {
          if (content.toLowerCase().includes(`${pattern} ${competitor}`) ||
              content.toLowerCase().includes(`${competitor} ${pattern}`)) {
            return {
              passed: false,
              message: `Content disparages competitor: ${competitor}`
            };
          }
        }
      }

      return { passed: true };
    }
  },
  {
    id: 'brand_name_present',
    name: 'Brand Name Present',
    type: 'warn',
    check: (content, context) => {
      const brandName = context?.brandName || 'Premier Nissan';
      const found = content.toLowerCase().includes(brandName.toLowerCase());
      return {
        passed: found,
        message: !found ? `Content should mention ${brandName}` : undefined
      };
    }
  },
  {
    id: 'no_banned_words',
    name: 'No Banned Words',
    type: 'block',
    check: (content, context) => {
      const banned = context?.bannedWords || [];
      const found = banned.find((w: string) => content.toLowerCase().includes(w.toLowerCase()));
      return {
        passed: !found,
        message: found ? `Content contains banned word: ${found}` : undefined
      };
    }
  },

  // ========================================
  // GRAMMAR & QUALITY
  // ========================================
  {
    id: 'grammar_check',
    name: 'Grammar Check',
    type: 'warn',
    check: (content) => {
      const issues: string[] = [];

      // Double spaces
      if (content.includes('  ')) {
        issues.push('double spaces');
      }

      // Missing space after punctuation
      if (/[.!?][A-Za-z]/.test(content)) {
        issues.push('missing space after punctuation');
      }

      // Repeated words
      if (/\b(\w+)\s+\1\b/i.test(content)) {
        issues.push('repeated words');
      }

      return {
        passed: issues.length === 0,
        message: issues.length ? `Grammar issues: ${issues.join(', ')}` : undefined
      };
    }
  },

  // ========================================
  // EMAIL SPECIFIC
  // ========================================
  {
    id: 'email_length_check',
    name: 'Email Length Check',
    type: 'warn',
    check: (content, context) => {
      if (context?.type !== 'email') return { passed: true };

      const wordCount = content.split(/\s+/).length;
      const tooLong = wordCount > 200;

      return {
        passed: !tooLong,
        message: tooLong ? `Email too long: ${wordCount} words (recommended: under 150)` : undefined
      };
    }
  },
  {
    id: 'sms_length_check',
    name: 'SMS Length Check',
    type: 'warn',
    check: (content, context) => {
      if (context?.type !== 'sms') return { passed: true };

      const tooLong = content.length > 160;

      return {
        passed: !tooLong,
        message: tooLong ? `SMS too long: ${content.length} chars (max: 160)` : undefined
      };
    }
  }
];

export default GUARDRAILS;
