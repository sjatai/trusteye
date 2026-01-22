export interface LoyaltyBanner {
  active: boolean;
  message: string;
  offerCode: string;
  ctaText: string;
  ctaUrl: string;
}

export interface DisplayAd {
  headline: string;
  body: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  durationSeconds: number;
}

export interface LoyaltyPoints {
  customerId: string;
  customerName: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  weekendBonusActive: boolean;
  weekendBonusPoints: number;
}

export interface LoyaltyRule {
  id: string;
  name: string;
  condition: string;
  bonusPoints: number;
  active: boolean;
}

export interface DemoState {
  loyaltyBanner: LoyaltyBanner | null;
  displayAd: DisplayAd;
  notifications: Notification[];
  loyaltyPoints: LoyaltyPoints;
  loyaltyRules: LoyaltyRule[];
}

// Calculate tier based on points
function calculateTier(points: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (points >= 5000) return 'platinum';
  if (points >= 2500) return 'gold';
  if (points >= 1000) return 'silver';
  return 'bronze';
}

// Global state for demo (in-memory, resets on server restart)
export const state: DemoState = {
  loyaltyBanner: null,
  displayAd: {
    headline: "New 2024 Models",
    body: "Explore our latest inventory of Nissan vehicles",
    imageUrl: "/images/default-ad.jpg",
    ctaText: "View Inventory",
    ctaUrl: "/inventory"
  },
  notifications: [],
  loyaltyPoints: {
    customerId: 'demo-customer-1',
    customerName: 'John Smith',
    points: 1250,
    tier: 'silver',
    weekendBonusActive: true,
    weekendBonusPoints: 100,
  },
  loyaltyRules: [
    {
      id: 'weekend-appointment',
      name: 'Weekend Appointment Bonus',
      condition: 'Book appointment on Saturday or Sunday',
      bonusPoints: 100,
      active: true,
    },
    {
      id: 'service-visit',
      name: 'Service Visit',
      condition: 'Complete a service appointment',
      bonusPoints: 50,
      active: true,
    },
    {
      id: 'referral',
      name: 'Referral Bonus',
      condition: 'Refer a friend who makes a purchase',
      bonusPoints: 500,
      active: true,
    }
  ]
};

export { calculateTier };
