import { describe, it, expect } from 'vitest';
import {
  parseCampaignCommand,
  isEventBasedCampaign,
  getTimingOptions,
  getAudienceOptions,
  validateChannels,
  CAMPAIGN_TYPES,
  EVENT_BASED_AUDIENCES,
  STANDARD_AUDIENCES,
  AVAILABLE_CHANNELS,
} from './campaignParser';

describe('Campaign Parser', () => {
  describe('parseCampaignCommand', () => {
    describe('Loyalty Campaigns (Event-Based)', () => {
      it('should detect loyalty campaign from "loyalty" keyword', () => {
        const result = parseCampaignCommand('create loyalty campaign for customers');
        expect(result.campaignType).toBe('loyalty');
        expect(result.isEventBased).toBe(true);
        expect(result.isCustomType).toBe(false);
      });

      it('should detect loyalty campaign from "reward" keyword', () => {
        const result = parseCampaignCommand('create reward campaign');
        expect(result.campaignType).toBe('loyalty');
        expect(result.isEventBased).toBe(true);
      });

      it('should detect loyalty campaign from "points" keyword', () => {
        const result = parseCampaignCommand('create points campaign for users');
        expect(result.campaignType).toBe('loyalty');
        expect(result.isEventBased).toBe(true);
      });

      it('should set audience to "Appointment Bookers" for booking-related queries', () => {
        const result = parseCampaignCommand('create loyalty campaign for customers booking appointment');
        expect(result.campaignType).toBe('loyalty');
        expect(result.audienceDescription).toBe('Appointment Bookers');
        expect(result.isEventBased).toBe(true);
      });

      it('should set audience to "Website Visitors" for website-related queries', () => {
        const result = parseCampaignCommand('create loyalty campaign for website visitors');
        expect(result.audienceDescription).toBe('Website Visitors');
      });

      it('should set audience to "Purchase Events" for purchase-related queries', () => {
        const result = parseCampaignCommand('create loyalty campaign for customers who buy');
        expect(result.audienceDescription).toBe('Purchase Events');
      });

      it('should set audience to "Service Completers" for completed service queries', () => {
        const result = parseCampaignCommand('create loyalty campaign for customers who complete');
        expect(result.audienceDescription).toBe('Service Completers');
      });

      it('should default to "Loyalty Program Members" for generic loyalty queries', () => {
        const result = parseCampaignCommand('create loyalty campaign');
        expect(result.audienceDescription).toBe('Loyalty Program Members');
      });
    });

    describe('Standard Campaign Types', () => {
      it('should detect referral campaign', () => {
        const result = parseCampaignCommand('create referral campaign for 5 star reviewers');
        expect(result.campaignType).toBe('referral');
        expect(result.campaignLabel).toBe('Referral');
        expect(result.isEventBased).toBe(false);
        expect(result.isCustomType).toBe(false);
      });

      it('should detect recovery campaign', () => {
        const result = parseCampaignCommand('create recovery campaign for negative reviews');
        expect(result.campaignType).toBe('recovery');
        expect(result.campaignLabel).toBe('Recovery');
        expect(result.isEventBased).toBe(false);
      });

      it('should detect win-back campaign', () => {
        const result = parseCampaignCommand('create winback campaign for inactive customers');
        expect(result.campaignType).toBe('win-back');
        expect(result.campaignLabel).toBe('Win-Back');
      });

      it('should detect conquest campaign', () => {
        const result = parseCampaignCommand('create conquest campaign for competitor customers');
        expect(result.campaignType).toBe('conquest');
        expect(result.campaignLabel).toBe('Conquest');
      });

      it('should detect birthday campaign', () => {
        const result = parseCampaignCommand('create birthday campaign');
        expect(result.campaignType).toBe('birthday');
        expect(result.campaignLabel).toBe('Birthday');
      });

      it('should detect welcome campaign', () => {
        const result = parseCampaignCommand('create welcome campaign for new customers');
        expect(result.campaignType).toBe('welcome');
        expect(result.campaignLabel).toBe('Welcome');
      });

      it('should detect service reminder campaign', () => {
        const result = parseCampaignCommand('create service reminder campaign');
        expect(result.campaignType).toBe('service');
        expect(result.campaignLabel).toBe('Service Reminder');
      });
    });

    describe('Channel Detection', () => {
      it('should default to email channel', () => {
        const result = parseCampaignCommand('create loyalty campaign');
        expect(result.channels).toContain('email');
      });

      it('should detect slack channel', () => {
        const result = parseCampaignCommand('create campaign via slack');
        expect(result.channels).toContain('slack');
      });

      it('should detect sms channel', () => {
        const result = parseCampaignCommand('create campaign via sms');
        expect(result.channels).toContain('sms');
      });

      it('should detect multiple channels', () => {
        const result = parseCampaignCommand('create campaign via email and sms and slack');
        expect(result.channels).toContain('email');
        expect(result.channels).toContain('sms');
        expect(result.channels).toContain('slack');
      });
    });

    describe('Custom Campaigns', () => {
      it('should mark unknown campaign types as custom', () => {
        const result = parseCampaignCommand('create something totally new');
        expect(result.campaignType).toBe('custom');
        expect(result.isCustomType).toBe(true);
      });
    });
  });

  describe('isEventBasedCampaign', () => {
    it('should return true for loyalty campaign', () => {
      expect(isEventBasedCampaign('loyalty')).toBe(true);
    });

    it('should return false for referral campaign', () => {
      expect(isEventBasedCampaign('referral')).toBe(false);
    });

    it('should return false for unknown campaign types', () => {
      expect(isEventBasedCampaign('unknown')).toBe(false);
    });
  });

  describe('getTimingOptions', () => {
    it('should return event-based timing options when isEventBased is true', () => {
      const options = getTimingOptions(true);
      expect(options).toContain('Ongoing (Always Active)');
      expect(options).toContain('Next 7 Days');
      expect(options).toContain('Next 30 Days');
      expect(options).not.toContain('Send Immediately');
    });

    it('should return standard timing options when isEventBased is false', () => {
      const options = getTimingOptions(false);
      expect(options).toContain('Send Immediately');
      expect(options).toContain('Schedule for Tomorrow');
      expect(options).not.toContain('Ongoing (Always Active)');
    });
  });

  describe('getAudienceOptions', () => {
    it('should return event-based audiences when isEventBased is true', () => {
      const options = getAudienceOptions(true);
      expect(options).toContain('Appointment Bookers');
      expect(options).toContain('Website Visitors');
      expect(options).not.toContain('5-Star Reviewers');
    });

    it('should return standard audiences when isEventBased is false', () => {
      const options = getAudienceOptions(false);
      expect(options).toContain('5-Star Reviewers');
      expect(options).toContain('VIP Members');
      expect(options).not.toContain('Appointment Bookers');
    });
  });

  describe('validateChannels', () => {
    it('should validate available channels', () => {
      const result = validateChannels(['email', 'sms']);
      expect(result.valid).toEqual(['email', 'sms']);
      expect(result.invalid).toEqual([]);
    });

    it('should identify invalid channels', () => {
      const result = validateChannels(['email', 'whatsapp', 'telegram']);
      expect(result.valid).toEqual(['email']);
      expect(result.invalid).toEqual(['whatsapp', 'telegram']);
    });

    it('should handle mixed valid and invalid channels', () => {
      const result = validateChannels(['slack', 'push', 'sms']);
      expect(result.valid).toEqual(['slack', 'sms']);
      expect(result.invalid).toEqual(['push']);
    });
  });

  describe('Constants', () => {
    it('should have loyalty in CAMPAIGN_TYPES with isEventBased=true', () => {
      const loyaltyType = CAMPAIGN_TYPES.find(t => t.value === 'loyalty');
      expect(loyaltyType).toBeDefined();
      expect(loyaltyType?.isEventBased).toBe(true);
    });

    it('should have Appointment Bookers in EVENT_BASED_AUDIENCES', () => {
      expect(EVENT_BASED_AUDIENCES).toContain('Appointment Bookers');
    });

    it('should have 5-Star Reviewers in STANDARD_AUDIENCES', () => {
      expect(STANDARD_AUDIENCES).toContain('5-Star Reviewers');
    });

    it('should have email, slack, sms in AVAILABLE_CHANNELS', () => {
      expect(AVAILABLE_CHANNELS).toContain('email');
      expect(AVAILABLE_CHANNELS).toContain('slack');
      expect(AVAILABLE_CHANNELS).toContain('sms');
    });
  });
});
