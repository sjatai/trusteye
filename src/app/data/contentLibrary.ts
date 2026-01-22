import type { ContentItem } from '../types/content';

// Pre-built content library with mock performance data
export const contentLibrary: ContentItem[] = [
  // === EMAIL TEMPLATES (9) ===
  {
    id: 'email-referral-1',
    name: 'Referral Request - 5 Star Reviewers',
    type: 'template',
    channels: ['email'],
    campaignTypes: ['referral'],
    content: {
      subject: 'You made our day! Share the love?',
      body: `Hi {{first_name}},

Thank you so much for your amazing 5-star review! Your kind words mean the world to our team.

We'd love to ask a small favor - would you mind sharing your experience with friends or family who might also benefit from our services?

As a thank you, you'll both receive a special VIP discount on your next visit.

Share your referral link: {{referral_link}}

With gratitude,
The Premier Nissan Team`,
      cta: 'Share Now',
    },
    brandScore: 94,
    performance: { timesUsed: 127, avgOpenRate: 34.2, avgClickRate: 8.7, bestPerformingIn: 'referral', isMock: true },
    createdAt: '2025-11-15',
    updatedAt: '2026-01-10',
  },
  {
    id: 'email-recovery-1',
    name: 'Recovery Outreach - Negative Review',
    type: 'template',
    channels: ['email'],
    campaignTypes: ['recovery'],
    content: {
      subject: 'We hear you, {{first_name}} - let us make it right',
      body: `Hi {{first_name}},

I personally read your recent review, and I want to sincerely apologize for your experience. This is not the standard we hold ourselves to.

I'd like to understand what happened and make it right. Could we schedule a brief call at your convenience?

As a gesture of goodwill, I've already applied a $50 service credit to your account.

Please reply to this email or call me directly at {{manager_phone}}.

Best regards,
{{manager_name}}
Service Manager, Premier Nissan`,
      cta: 'Schedule Call',
    },
    brandScore: 92,
    performance: { timesUsed: 89, avgOpenRate: 31.5, avgClickRate: 12.3, bestPerformingIn: 'recovery', isMock: true },
    createdAt: '2025-10-20',
    updatedAt: '2026-01-08',
  },
  {
    id: 'email-winback-1',
    name: 'Win-back - 90 Day Inactive',
    type: 'template',
    channels: ['email'],
    campaignTypes: ['winback'],
    content: {
      subject: "We miss you, {{first_name}}! Here's 20% off",
      body: `Hi {{first_name}},

It's been a while since we've seen you, and we genuinely miss having you as a customer!

We've been making some exciting improvements, and we'd love to welcome you back with an exclusive 20% discount on your next service.

Your vehicle deserves the best care, and so do you.

Use code: WELCOMEBACK20 at checkout.

See you soon,
The Premier Nissan Team`,
      cta: 'Book Service Now',
    },
    brandScore: 91,
    performance: { timesUsed: 203, avgOpenRate: 22.4, avgClickRate: 6.1, bestPerformingIn: 'winback', isMock: true },
    createdAt: '2025-09-05',
    updatedAt: '2026-01-12',
  },
  {
    id: 'email-conquest-1',
    name: 'Conquest - Competitor Switch',
    type: 'template',
    channels: ['email'],
    campaignTypes: ['conquest'],
    content: {
      subject: 'Switch to Premier Nissan - 25% off first visit',
      body: `Hi {{first_name}},

Looking for a better service experience? We've been rated #1 in customer satisfaction for 3 years running.

Here's why customers switch to Premier Nissan:
• Average service time: 1.8 hours (vs. 2.5 industry average)
• Satisfaction guarantee: Not happy? We'll make it right
• Transparent pricing: No hidden fees, ever

Try us with 25% off your first service visit.

Ready to experience the difference?

Best,
Premier Nissan Team`,
      cta: 'Claim Your 25% Off',
    },
    brandScore: 89,
    performance: { timesUsed: 156, avgOpenRate: 24.8, avgClickRate: 5.9, bestPerformingIn: 'conquest', isMock: true },
    createdAt: '2025-08-12',
    updatedAt: '2026-01-05',
  },
  {
    id: 'email-welcome-1',
    name: 'Welcome - New Customer',
    type: 'template',
    channels: ['email'],
    campaignTypes: ['welcome'],
    content: {
      subject: 'Welcome to the Premier Nissan family, {{first_name}}!',
      body: `Hi {{first_name}},

Welcome to Premier Nissan! We're thrilled to have you as part of our family.

Here's what you can expect from us:
✓ Expert certified technicians
✓ Genuine Nissan parts
✓ Complimentary multi-point inspections
✓ Loyalty rewards on every visit

Your first oil change is on us! Just mention this email when you book.

Questions? Reply anytime - we're here to help.

Cheers,
The Premier Nissan Team`,
      cta: 'Book Free Oil Change',
    },
    brandScore: 96,
    performance: { timesUsed: 312, avgOpenRate: 41.2, avgClickRate: 15.3, bestPerformingIn: 'welcome', isMock: true },
    createdAt: '2025-07-01',
    updatedAt: '2026-01-14',
  },
  {
    id: 'email-loyalty-1',
    name: 'Loyalty Reward - VIP Tier',
    type: 'template',
    channels: ['email'],
    campaignTypes: ['loyalty'],
    content: {
      subject: 'Exclusive VIP reward inside, {{first_name}}!',
      body: `Hi {{first_name}},

You've been an amazing customer, and we want to say THANK YOU!

As a VIP member, you've earned {{points}} loyalty points - that's {{dollar_value}} in rewards!

Your exclusive VIP benefits:
⭐ Priority scheduling
⭐ Extended warranty coverage
⭐ Complimentary car washes
⭐ Birthday bonus points

Redeem your rewards on your next visit!

With appreciation,
Premier Nissan`,
      cta: 'View My Rewards',
    },
    brandScore: 95,
    performance: { timesUsed: 178, avgOpenRate: 38.2, avgClickRate: 11.4, bestPerformingIn: 'loyalty', isMock: true },
    createdAt: '2025-06-20',
    updatedAt: '2026-01-11',
  },
  {
    id: 'email-service-1',
    name: 'Service Reminder - Maintenance Due',
    type: 'template',
    channels: ['email'],
    campaignTypes: ['service'],
    content: {
      subject: 'Time for your {{service_type}}, {{first_name}}',
      body: `Hi {{first_name}},

Your {{vehicle_name}} is due for {{service_type}}! Regular maintenance keeps your vehicle running smoothly and safely.

We have appointments available this week:
{{available_slots}}

Book now and save 10% with code: SERVICE10

Your vehicle will thank you!

Best,
Premier Nissan Service Team`,
      cta: 'Book Appointment',
    },
    brandScore: 93,
    performance: { timesUsed: 445, avgOpenRate: 28.1, avgClickRate: 9.2, bestPerformingIn: 'service', isMock: true },
    createdAt: '2025-05-15',
    updatedAt: '2026-01-13',
  },
  {
    id: 'email-birthday-1',
    name: 'Birthday Celebration',
    type: 'template',
    channels: ['email'],
    campaignTypes: ['birthday'],
    content: {
      subject: 'Happy Birthday, {{first_name}}! 🎂 A gift inside',
      body: `Happy Birthday, {{first_name}}! 🎉

Today is YOUR day, and we wanted to celebrate with you!

As our birthday gift to you, enjoy:
🎁 FREE car wash & interior clean
🎁 Double loyalty points on your next visit
🎁 15% off any service this month

This special offer is valid for the entire month of {{birth_month}}.

Have an amazing birthday!

Warmly,
Your friends at Premier Nissan`,
      cta: 'Claim Birthday Gift',
    },
    brandScore: 97,
    performance: { timesUsed: 234, avgOpenRate: 52.3, avgClickRate: 18.7, bestPerformingIn: 'birthday', isMock: true },
    createdAt: '2025-04-10',
    updatedAt: '2026-01-09',
  },
  {
    id: 'email-seasonal-1',
    name: 'Seasonal - Winter Ready',
    type: 'template',
    channels: ['email'],
    campaignTypes: ['seasonal'],
    content: {
      subject: 'Is your {{vehicle_name}} winter-ready?',
      body: `Hi {{first_name}},

Winter is coming! Make sure your {{vehicle_name}} is ready for the cold weather.

Our Winter Ready Package includes:
❄️ Battery test & terminals cleaning
❄️ Antifreeze level check
❄️ Tire inspection & pressure adjustment
❄️ Wiper blade inspection
❄️ Heating system check

Special winter pricing: $89 (normally $129)

Don't get caught in the cold!

Stay safe,
Premier Nissan Service Team`,
      cta: 'Book Winter Check',
    },
    brandScore: 92,
    performance: { timesUsed: 167, avgOpenRate: 26.8, avgClickRate: 7.4, bestPerformingIn: 'seasonal', isMock: true },
    createdAt: '2025-10-01',
    updatedAt: '2026-01-07',
  },

  // === SMS TEMPLATES (9) ===
  {
    id: 'sms-referral-1',
    name: 'SMS - Referral Thank You',
    type: 'template',
    channels: ['sms'],
    campaignTypes: ['referral'],
    content: {
      body: 'Thanks for the 5-star review {{first_name}}! Share your referral link & you both get $25 off: {{referral_link}}',
    },
    brandScore: 91,
    performance: { timesUsed: 89, avgOpenRate: 98.0, avgClickRate: 12.3, bestPerformingIn: 'referral', isMock: true },
    createdAt: '2025-11-20',
    updatedAt: '2026-01-10',
  },
  {
    id: 'sms-recovery-1',
    name: 'SMS - Recovery Quick Response',
    type: 'template',
    channels: ['sms'],
    campaignTypes: ['recovery'],
    content: {
      body: 'Hi {{first_name}}, I saw your review and want to make things right. Call me directly at {{manager_phone}}. -{{manager_name}}, Service Manager',
    },
    brandScore: 90,
    performance: { timesUsed: 67, avgOpenRate: 98.0, avgClickRate: 8.9, bestPerformingIn: 'recovery', isMock: true },
    createdAt: '2025-10-25',
    updatedAt: '2026-01-08',
  },
  {
    id: 'sms-winback-1',
    name: 'SMS - Win-back Offer',
    type: 'template',
    channels: ['sms'],
    campaignTypes: ['winback'],
    content: {
      body: 'We miss you {{first_name}}! Come back for 20% off your next service. Use code WELCOMEBACK20. Book: {{booking_link}}',
    },
    brandScore: 88,
    performance: { timesUsed: 145, avgOpenRate: 97.0, avgClickRate: 9.1, bestPerformingIn: 'winback', isMock: true },
    createdAt: '2025-09-10',
    updatedAt: '2026-01-12',
  },
  {
    id: 'sms-conquest-1',
    name: 'SMS - Conquest Intro',
    type: 'template',
    channels: ['sms'],
    campaignTypes: ['conquest'],
    content: {
      body: 'Looking for better service? Try Premier Nissan - 25% off your first visit! Book now: {{booking_link}}',
    },
    brandScore: 86,
    performance: { timesUsed: 98, avgOpenRate: 96.0, avgClickRate: 6.7, bestPerformingIn: 'conquest', isMock: true },
    createdAt: '2025-08-15',
    updatedAt: '2026-01-05',
  },
  {
    id: 'sms-welcome-1',
    name: 'SMS - Welcome New Customer',
    type: 'template',
    channels: ['sms'],
    campaignTypes: ['welcome'],
    content: {
      body: 'Welcome to Premier Nissan {{first_name}}! Your first oil change is FREE. Book anytime: {{booking_link}}',
    },
    brandScore: 93,
    performance: { timesUsed: 267, avgOpenRate: 98.0, avgClickRate: 14.2, bestPerformingIn: 'welcome', isMock: true },
    createdAt: '2025-07-05',
    updatedAt: '2026-01-14',
  },
  {
    id: 'sms-loyalty-1',
    name: 'SMS - Loyalty Points Update',
    type: 'template',
    channels: ['sms'],
    campaignTypes: ['loyalty'],
    content: {
      body: '{{first_name}}, you have {{points}} loyalty points ({{dollar_value}})! Redeem on your next visit. View rewards: {{rewards_link}}',
    },
    brandScore: 90,
    performance: { timesUsed: 134, avgOpenRate: 97.0, avgClickRate: 10.8, bestPerformingIn: 'loyalty', isMock: true },
    createdAt: '2025-06-25',
    updatedAt: '2026-01-11',
  },
  {
    id: 'sms-service-1',
    name: 'SMS - Service Reminder',
    type: 'template',
    channels: ['sms'],
    campaignTypes: ['service'],
    content: {
      body: 'Hi {{first_name}}, your {{vehicle_name}} is due for {{service_type}}. Book now & save 10%: {{booking_link}}',
    },
    brandScore: 92,
    performance: { timesUsed: 389, avgOpenRate: 98.0, avgClickRate: 11.5, bestPerformingIn: 'service', isMock: true },
    createdAt: '2025-05-20',
    updatedAt: '2026-01-13',
  },
  {
    id: 'sms-birthday-1',
    name: 'SMS - Birthday Greeting',
    type: 'template',
    channels: ['sms'],
    campaignTypes: ['birthday'],
    content: {
      body: 'Happy Birthday {{first_name}}! Enjoy a FREE car wash + 15% off service this month. Claim: {{rewards_link}}',
    },
    brandScore: 94,
    performance: { timesUsed: 189, avgOpenRate: 98.0, avgClickRate: 16.2, bestPerformingIn: 'birthday', isMock: true },
    createdAt: '2025-04-15',
    updatedAt: '2026-01-09',
  },
  {
    id: 'sms-seasonal-1',
    name: 'SMS - Seasonal Winter Check',
    type: 'template',
    channels: ['sms'],
    campaignTypes: ['seasonal'],
    content: {
      body: 'Winter is here! Get your car ready with our $89 Winter Package (usually $129). Book: {{booking_link}}',
    },
    brandScore: 89,
    performance: { timesUsed: 112, avgOpenRate: 97.0, avgClickRate: 8.3, bestPerformingIn: 'seasonal', isMock: true },
    createdAt: '2025-10-05',
    updatedAt: '2026-01-07',
  },

  // === SOCIAL TEMPLATES - INSTAGRAM (6) ===
  {
    id: 'ig-team-spotlight',
    name: 'Instagram - Team Spotlight',
    type: 'template',
    channels: ['instagram'],
    campaignTypes: ['loyalty'],
    content: {
      body: "Meet {{technician_name}}, one of our certified master technicians! 🔧👨‍🔧\n\n{{technician_name}} has been with Premier Nissan for {{years}} years and has serviced over 5,000 vehicles. Their specialty? Diagnosing those tricky electrical issues!\n\n\"Every car tells a story. I love solving puzzles and getting customers back on the road safely.\" - {{technician_name}}\n\nNext time you visit, say hi! 👋\n\n#MeetTheTeam #PremierNissan #CertifiedTechnician #AutoCare #BehindTheScenes",
      hashtags: ['MeetTheTeam', 'PremierNissan', 'CertifiedTechnician', 'AutoCare', 'BehindTheScenes'],
      imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800',
    },
    brandScore: 95,
    performance: { timesUsed: 67, avgOpenRate: 0, avgClickRate: 5.8, bestPerformingIn: 'loyalty', isMock: true },
    createdAt: '2025-11-25',
    updatedAt: '2026-01-10',
  },
  {
    id: 'ig-car-care-tips',
    name: 'Instagram - Car Care Tips',
    type: 'template',
    channels: ['instagram'],
    campaignTypes: ['service'],
    content: {
      body: "🚗 Pro Tip Tuesday!\n\nDid you know? Your tire pressure drops about 1 PSI for every 10°F temperature drop. That means winter months require extra attention! 🌡️❄️\n\nQuick check:\n✅ Check pressure when tires are cold\n✅ Look for the sticker inside your door\n✅ Don't forget the spare!\n\nSave this post for later! 📌\n\n#CarCareTips #TireSafety #WinterDriving #PremierNissan #ProTips #AutoMaintenance",
      hashtags: ['CarCareTips', 'TireSafety', 'WinterDriving', 'PremierNissan', 'ProTips', 'AutoMaintenance'],
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    },
    brandScore: 93,
    performance: { timesUsed: 89, avgOpenRate: 0, avgClickRate: 7.2, bestPerformingIn: 'service', isMock: true },
    createdAt: '2025-09-15',
    updatedAt: '2026-01-12',
  },
  {
    id: 'ig-customer-story',
    name: 'Instagram - Customer Story',
    type: 'template',
    channels: ['instagram'],
    campaignTypes: ['loyalty'],
    content: {
      body: "Customer Spotlight! 🌟\n\n\"I've been bringing my family's cars to Premier Nissan for 8 years. They've watched my kids grow up, and they treat every visit like I'm family.\" - {{customer_name}}\n\nThank you for being part of our community! Stories like this are why we do what we do. ❤️\n\nTag someone who's been with us on their car journey!\n\n#CustomerLove #PremierNissan #CommunityFirst #ThankYou #CarFamily",
      hashtags: ['CustomerLove', 'PremierNissan', 'CommunityFirst', 'ThankYou', 'CarFamily'],
      imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
    },
    brandScore: 97,
    performance: { timesUsed: 45, avgOpenRate: 0, avgClickRate: 8.4, bestPerformingIn: 'loyalty', isMock: true },
    createdAt: '2025-08-20',
    updatedAt: '2026-01-05',
  },
  {
    id: 'ig-new-arrival',
    name: 'Instagram - New Model Showcase',
    type: 'template',
    channels: ['instagram'],
    campaignTypes: ['conquest'],
    content: {
      body: "Just arrived! 🚘✨\n\nThe all-new {{model_year}} {{model_name}} is here and it's stunning. Come see it in person!\n\nHighlights:\n⚡ {{feature_1}}\n🛡️ {{feature_2}}\n📱 {{feature_3}}\n\nTest drives available now. Link in bio to schedule yours!\n\n#NewArrival #Nissan{{model_name}} #PremierNissan #TestDrive #NewCar #{{model_year}}Nissan",
      hashtags: ['NewArrival', 'PremierNissan', 'TestDrive', 'NewCar'],
      imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
    },
    brandScore: 91,
    performance: { timesUsed: 34, avgOpenRate: 0, avgClickRate: 6.1, bestPerformingIn: 'conquest', isMock: true },
    createdAt: '2025-06-30',
    updatedAt: '2026-01-11',
  },
  {
    id: 'ig-community-event',
    name: 'Instagram - Community Event',
    type: 'template',
    channels: ['instagram'],
    campaignTypes: ['welcome'],
    content: {
      body: "📅 Mark your calendars!\n\nJoin us this {{event_date}} for our annual {{event_name}}! 🎉\n\n🚗 Free vehicle inspections\n🎈 Family fun activities\n🍕 Food trucks\n🎁 Giveaways & prizes\n\nBring the whole family - we can't wait to see you there!\n\nDrop a 🙌 if you're coming!\n\n#PremierNissan #CommunityEvent #FamilyFun #LocalEvent #CarShow",
      hashtags: ['PremierNissan', 'CommunityEvent', 'FamilyFun', 'LocalEvent', 'CarShow'],
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    },
    brandScore: 94,
    performance: { timesUsed: 28, avgOpenRate: 0, avgClickRate: 9.2, bestPerformingIn: 'welcome', isMock: true },
    createdAt: '2025-04-20',
    updatedAt: '2026-01-09',
  },
  {
    id: 'ig-behind-scenes',
    name: 'Instagram - Behind the Scenes',
    type: 'template',
    channels: ['instagram'],
    campaignTypes: ['loyalty'],
    content: {
      body: "Ever wonder what happens in our service bay? 👀🔧\n\nHere's a sneak peek at our state-of-the-art facility! We invest in the latest diagnostic equipment to keep your vehicle running perfectly.\n\nFun fact: Our team completes over 150 hours of training every year to stay certified. 📚\n\nSwipe to see more! ➡️\n\n#BehindTheScenes #AutoShop #PremierNissan #ServiceCenter #CertifiedTechnicians",
      hashtags: ['BehindTheScenes', 'AutoShop', 'PremierNissan', 'ServiceCenter', 'CertifiedTechnicians'],
      imageUrl: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800',
    },
    brandScore: 92,
    performance: { timesUsed: 52, avgOpenRate: 0, avgClickRate: 5.6, bestPerformingIn: 'loyalty', isMock: true },
    createdAt: '2025-10-10',
    updatedAt: '2026-01-07',
  },

  // === SOCIAL TEMPLATES - LINKEDIN (6) ===
  {
    id: 'li-industry-insight',
    name: 'LinkedIn - Industry Insight',
    type: 'template',
    channels: ['linkedin'],
    campaignTypes: ['conquest'],
    content: {
      body: "The automotive service industry is evolving rapidly. Here's what we're seeing:\n\n📊 EV maintenance requires new skill sets - we've invested $200K in training our technicians for hybrid and electric vehicles.\n\n🔧 Predictive maintenance is becoming standard - connected vehicles tell us what they need before problems occur.\n\n🤝 Customer experience matters more than ever - 78% of service customers say they'll pay more for a better experience.\n\nAt Premier Nissan, we're not just keeping up with change - we're driving it.\n\nWhat trends are you seeing in your industry?\n\n#AutomotiveIndustry #Leadership #CustomerExperience #EVMaintenance #Innovation",
    },
    brandScore: 94,
    performance: { timesUsed: 23, avgOpenRate: 0, avgClickRate: 3.8, bestPerformingIn: 'conquest', isMock: true },
    createdAt: '2025-11-20',
    updatedAt: '2026-01-10',
  },
  {
    id: 'li-team-achievement',
    name: 'LinkedIn - Team Achievement',
    type: 'template',
    channels: ['linkedin'],
    campaignTypes: ['loyalty'],
    content: {
      body: "Proud moment for our team! 🏆\n\nPremier Nissan has been recognized as a Nissan Award of Excellence winner for the 5th consecutive year.\n\nThis achievement reflects:\n• Our team's commitment to continuous improvement\n• Investment in state-of-the-art equipment\n• Focus on customer satisfaction (97.2% satisfaction rate)\n• Over 500 hours of combined team training annually\n\nThank you to our incredible team members who make this possible, and to our customers who trust us with their vehicles.\n\nHere's to setting new standards in automotive service.\n\n#NissanExcellence #TeamAchievement #AutomotiveService #CustomerFirst #PremierNissan",
    },
    brandScore: 96,
    performance: { timesUsed: 18, avgOpenRate: 0, avgClickRate: 4.5, bestPerformingIn: 'loyalty', isMock: true },
    createdAt: '2025-09-10',
    updatedAt: '2026-01-12',
  },
  {
    id: 'li-hiring-culture',
    name: 'LinkedIn - Hiring & Culture',
    type: 'template',
    channels: ['linkedin'],
    campaignTypes: ['welcome'],
    content: {
      body: "We're growing and looking for talented individuals to join our team!\n\n🔧 Open positions:\n• Certified Service Technician\n• Service Advisor\n• Parts Specialist\n\nWhat makes Premier Nissan different?\n\n✅ Competitive pay + performance bonuses\n✅ Full benefits from day one\n✅ Ongoing training & certification support\n✅ Family-owned culture, not corporate bureaucracy\n✅ Clear career advancement paths\n\nWe believe in investing in our people. That's why our average employee tenure is 8+ years.\n\nKnow someone who'd be a great fit? Tag them below!\n\n#Hiring #AutomotiveCareers #JoinOurTeam #TechnicianJobs #PremierNissan",
    },
    brandScore: 91,
    performance: { timesUsed: 31, avgOpenRate: 0, avgClickRate: 5.2, bestPerformingIn: 'welcome', isMock: true },
    createdAt: '2025-08-15',
    updatedAt: '2026-01-05',
  },
  {
    id: 'li-thought-leadership',
    name: 'LinkedIn - Thought Leadership',
    type: 'template',
    channels: ['linkedin'],
    campaignTypes: ['conquest'],
    content: {
      body: "I've been in the automotive service industry for 25 years. Here's the biggest lesson I've learned:\n\nTrust is earned in drops and lost in buckets.\n\nEvery vehicle that comes through our doors represents a family relying on safe transportation. That responsibility shapes everything we do:\n\n• We explain repairs in plain language\n• We show customers what we find\n• We never recommend unnecessary work\n• We stand behind our service 100%\n\nIn an industry where trust can be scarce, we've built our business on transparency.\n\nWhat principles guide your business decisions?\n\n#Leadership #Trust #AutomotiveService #BusinessValues #CustomerFirst",
    },
    brandScore: 95,
    performance: { timesUsed: 15, avgOpenRate: 0, avgClickRate: 4.1, bestPerformingIn: 'conquest', isMock: true },
    createdAt: '2025-07-01',
    updatedAt: '2026-01-11',
  },
  {
    id: 'li-community-impact',
    name: 'LinkedIn - Community Impact',
    type: 'template',
    channels: ['linkedin'],
    campaignTypes: ['loyalty'],
    content: {
      body: "Business isn't just about profit. It's about impact.\n\nThis year, Premier Nissan has:\n\n🎓 Sponsored automotive training for 12 local high school students\n🚗 Provided free vehicle inspections for 200+ families in need\n🌱 Reduced our environmental footprint by 30% through recycling initiatives\n💰 Contributed $50,000 to local charities\n\nWe believe that when businesses invest in their communities, everyone wins.\n\nWhat community initiatives is your organization proud of?\n\n#CommunityImpact #GivingBack #LocalBusiness #SocialResponsibility #PremierNissan",
    },
    brandScore: 97,
    performance: { timesUsed: 22, avgOpenRate: 0, avgClickRate: 5.8, bestPerformingIn: 'loyalty', isMock: true },
    createdAt: '2025-05-20',
    updatedAt: '2026-01-09',
  },
  {
    id: 'li-partnership',
    name: 'LinkedIn - Partnership Announcement',
    type: 'template',
    channels: ['linkedin'],
    campaignTypes: ['welcome'],
    content: {
      body: "Excited to announce our new partnership with {{partner_name}}! 🤝\n\nThis collaboration allows us to bring even more value to our customers through {{partnership_benefit}}.\n\nWhat this means for you:\n• {{benefit_1}}\n• {{benefit_2}}\n• {{benefit_3}}\n\nWe're always looking for ways to enhance our service. This partnership represents another step in that journey.\n\nStay tuned for more details!\n\n#Partnership #Innovation #CustomerValue #AutomotiveService #PremierNissan",
    },
    brandScore: 90,
    performance: { timesUsed: 12, avgOpenRate: 0, avgClickRate: 3.4, bestPerformingIn: 'welcome', isMock: true },
    createdAt: '2025-10-05',
    updatedAt: '2026-01-07',
  },

  // === SOCIAL TEMPLATES - TWITTER/X (6) ===
  {
    id: 'tw-quick-tip',
    name: 'Twitter - Quick Tip',
    type: 'template',
    channels: ['twitter'],
    campaignTypes: ['service'],
    content: {
      body: "🚗 Quick tip: Check your tire pressure every month and before long trips.\n\nUnder-inflated tires = poor fuel economy + faster wear.\n\nYour door jamb sticker has the right PSI. Don't go by what's on the tire!\n\n#CarTips #AutoCare",
    },
    brandScore: 91,
    performance: { timesUsed: 156, avgOpenRate: 0, avgClickRate: 2.8, bestPerformingIn: 'service', isMock: true },
    createdAt: '2025-11-15',
    updatedAt: '2026-01-10',
  },
  {
    id: 'tw-trivia',
    name: 'Twitter - Fun Trivia',
    type: 'template',
    channels: ['twitter'],
    campaignTypes: ['welcome'],
    content: {
      body: "🤔 Did you know?\n\nThe average car has about 30,000 parts. Our technicians know them all.\n\nWell, most of them. 😅\n\n#FunFact #Automotive #CarTrivia",
    },
    brandScore: 88,
    performance: { timesUsed: 89, avgOpenRate: 0, avgClickRate: 3.2, bestPerformingIn: 'welcome', isMock: true },
    createdAt: '2025-09-20',
    updatedAt: '2026-01-12',
  },
  {
    id: 'tw-weather-reminder',
    name: 'Twitter - Weather Alert',
    type: 'template',
    channels: ['twitter'],
    campaignTypes: ['seasonal'],
    content: {
      body: "❄️ Cold snap coming this week!\n\nReminder to:\n✅ Check your antifreeze\n✅ Test your battery\n✅ Inspect your tires\n\nNeed a quick check? We've got you covered.\n\n#WinterDriving #StaySafe #CarCare",
    },
    brandScore: 90,
    performance: { timesUsed: 67, avgOpenRate: 0, avgClickRate: 4.1, bestPerformingIn: 'seasonal', isMock: true },
    createdAt: '2025-08-25',
    updatedAt: '2026-01-05',
  },
  {
    id: 'tw-customer-shoutout',
    name: 'Twitter - Customer Shoutout',
    type: 'template',
    channels: ['twitter'],
    campaignTypes: ['loyalty'],
    content: {
      body: "Shoutout to {{customer_name}} for being with us for 10 years! 🎉\n\nYour trust means everything. Here's to many more miles together! 🚗\n\n#CustomerAppreciation #ThankYou #10Years",
    },
    brandScore: 94,
    performance: { timesUsed: 45, avgOpenRate: 0, avgClickRate: 5.6, bestPerformingIn: 'loyalty', isMock: true },
    createdAt: '2025-07-10',
    updatedAt: '2026-01-11',
  },
  {
    id: 'tw-poll',
    name: 'Twitter - Engagement Poll',
    type: 'template',
    channels: ['twitter'],
    campaignTypes: ['welcome'],
    content: {
      body: "Quick poll! 📊\n\nHow often do you check your tire pressure?\n\n🔵 Weekly\n🟢 Monthly\n🟡 When the light comes on\n🔴 There's a light for that?\n\n#CarPoll #Automotive #TireSafety",
    },
    brandScore: 87,
    performance: { timesUsed: 34, avgOpenRate: 0, avgClickRate: 8.9, bestPerformingIn: 'welcome', isMock: true },
    createdAt: '2025-06-05',
    updatedAt: '2026-01-09',
  },
  {
    id: 'tw-industry-news',
    name: 'Twitter - Industry News',
    type: 'template',
    channels: ['twitter'],
    campaignTypes: ['conquest'],
    content: {
      body: "📰 Big news in the auto world:\n\n{{news_headline}}\n\nOur take: {{our_perspective}}\n\nWhat do you think? 👇\n\n#AutoNews #Industry #{{news_topic}}",
    },
    brandScore: 89,
    performance: { timesUsed: 28, avgOpenRate: 0, avgClickRate: 3.7, bestPerformingIn: 'conquest', isMock: true },
    createdAt: '2025-10-15',
    updatedAt: '2026-01-07',
  },

  // === SLACK TEMPLATES (3) ===
  {
    id: 'slack-5star-1',
    name: 'Slack - 5-Star Review Alert',
    type: 'template',
    channels: ['slack'],
    campaignTypes: ['referral', 'loyalty'],
    content: {
      body: `🌟 *New 5-Star Review!*\n\n*Customer:* {{customer_name}}\n*Rating:* ⭐⭐⭐⭐⭐\n*Review:* "{{review_text}}"\n\n*Recommended Action:* Send referral request within 48 hours\n\n<{{action_url}}|View Customer Profile>`,
    },
    brandScore: 95,
    performance: { timesUsed: 234, avgOpenRate: 100, avgClickRate: 45.2, bestPerformingIn: 'referral', isMock: true },
    createdAt: '2025-08-01',
    updatedAt: '2026-01-14',
  },
  {
    id: 'slack-negative-1',
    name: 'Slack - Negative Review Alert',
    type: 'template',
    channels: ['slack'],
    campaignTypes: ['recovery'],
    content: {
      body: `🚨 *Urgent: Negative Review Received*\n\n*Customer:* {{customer_name}}\n*Rating:* {{rating}} ⭐\n*Review:* "{{review_text}}"\n\n*Response Required:* Within 2 hours\n*Suggested Action:* Personal outreach + $50 credit\n\n<{{action_url}}|Start Recovery Campaign>`,
    },
    brandScore: 92,
    performance: { timesUsed: 89, avgOpenRate: 100, avgClickRate: 78.3, bestPerformingIn: 'recovery', isMock: true },
    createdAt: '2025-07-15',
    updatedAt: '2026-01-08',
  },
  {
    id: 'slack-newcustomer-1',
    name: 'Slack - New Customer Notification',
    type: 'template',
    channels: ['slack'],
    campaignTypes: ['welcome'],
    content: {
      body: `👋 *New Customer Added!*\n\n*Name:* {{customer_name}}\n*Email:* {{customer_email}}\n*Source:* {{source}}\n*Vehicle:* {{vehicle_info}}\n\n*Auto-Enrolled:* Welcome email series\n*First Service:* Free oil change\n\n<{{action_url}}|View Customer>`,
    },
    brandScore: 94,
    performance: { timesUsed: 312, avgOpenRate: 100, avgClickRate: 32.1, bestPerformingIn: 'welcome', isMock: true },
    createdAt: '2025-06-01',
    updatedAt: '2026-01-14',
  },

  // === WEB BANNERS (5) ===
  {
    id: 'banner-referral-1',
    name: 'Banner - Referral Program (Leaderboard)',
    type: 'banner',
    channels: ['web-banner'],
    campaignTypes: ['referral'],
    content: {
      body: 'Refer a Friend, Get $25 Off! Share the Love Today →',
      cta: 'Share Now',
      dimensions: '728x90',
      imageUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=728&h=90&fit=crop',
    },
    brandScore: 90,
    performance: { timesUsed: 67, avgOpenRate: 0, avgClickRate: 2.3, bestPerformingIn: 'referral', isMock: true },
    createdAt: '2025-11-01',
    updatedAt: '2026-01-10',
  },
  {
    id: 'banner-winback-1',
    name: 'Banner - Win-back Offer (Square)',
    type: 'banner',
    channels: ['web-banner'],
    campaignTypes: ['winback'],
    content: {
      body: "We Miss You!\n20% Off Your Next Visit\nUse Code: WELCOMEBACK20",
      cta: 'Book Now',
      dimensions: '300x250',
      imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=300&h=250&fit=crop',
    },
    brandScore: 88,
    performance: { timesUsed: 45, avgOpenRate: 0, avgClickRate: 1.9, bestPerformingIn: 'winback', isMock: true },
    createdAt: '2025-09-20',
    updatedAt: '2026-01-12',
  },
  {
    id: 'banner-conquest-1',
    name: 'Banner - First Visit Discount (Hero)',
    type: 'banner',
    channels: ['web-banner'],
    campaignTypes: ['conquest'],
    content: {
      body: 'New to Premier Nissan? Get 25% Off Your First Service!',
      cta: 'Claim Offer',
      dimensions: '1200x400',
      imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=400&fit=crop',
    },
    brandScore: 87,
    performance: { timesUsed: 89, avgOpenRate: 0, avgClickRate: 2.1, bestPerformingIn: 'conquest', isMock: true },
    createdAt: '2025-08-25',
    updatedAt: '2026-01-05',
  },
  {
    id: 'banner-loyalty-1',
    name: 'Banner - VIP Rewards (Sidebar)',
    type: 'banner',
    channels: ['web-banner'],
    campaignTypes: ['loyalty'],
    content: {
      body: "You've Earned {{points}} Points!\nRedeem for Rewards",
      cta: 'View Rewards',
      dimensions: '160x600',
      imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=160&h=600&fit=crop',
    },
    brandScore: 92,
    performance: { timesUsed: 123, avgOpenRate: 0, avgClickRate: 3.4, bestPerformingIn: 'loyalty', isMock: true },
    createdAt: '2025-07-10',
    updatedAt: '2026-01-11',
  },
  {
    id: 'banner-seasonal-1',
    name: 'Banner - Winter Package (Leaderboard)',
    type: 'banner',
    channels: ['web-banner'],
    campaignTypes: ['seasonal'],
    content: {
      body: '❄️ Winter Ready Package - Only $89 (Save $40!) - Limited Time',
      cta: 'Book Winter Check',
      dimensions: '728x90',
      imageUrl: 'https://images.unsplash.com/photo-1516733968668-dbdce39c0651?w=728&h=90&fit=crop',
    },
    brandScore: 89,
    performance: { timesUsed: 56, avgOpenRate: 0, avgClickRate: 2.7, bestPerformingIn: 'seasonal', isMock: true },
    createdAt: '2025-10-15',
    updatedAt: '2026-01-07',
  },
];

// Helper functions
export function getContentByChannel(channel: string): ContentItem[] {
  return contentLibrary.filter(item => item.channels.includes(channel as any));
}

export function getContentByCampaignType(campaignType: string): ContentItem[] {
  return contentLibrary.filter(item => item.campaignTypes.includes(campaignType as any));
}

export function getContentById(id: string): ContentItem | undefined {
  return contentLibrary.find(item => item.id === id);
}

export function searchContent(query: string): ContentItem[] {
  const lowerQuery = query.toLowerCase();
  return contentLibrary.filter(item =>
    item.name.toLowerCase().includes(lowerQuery) ||
    item.campaignTypes.some(type => type.toLowerCase().includes(lowerQuery)) ||
    item.content.body.toLowerCase().includes(lowerQuery)
  );
}
