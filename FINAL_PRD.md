# TrustEye - Product Requirements Document

**Demo Date:** Friday, January 24, 2026
**Version:** Final
**Last Updated:** January 23, 2026

---

## What is TrustEye?

**AI marketing layer for Birdeye.** Reads customer data (reviews, contacts), creates campaigns, and proves every action was compliant.

**One-liner:** "AI mature enough to be a full-time employee. Accountable. Compliant. With receipts."

---

## The Moat: Trust Layer

| Competitor | Their Claim | Reality |
|------------|-------------|---------|
| Jasper | "Trust Foundation" | Vague infrastructure |
| **TrustEye** | **"Trust Layer"** | **Visible, verifiable, receipted proof** |

> "Competitors have AI that generates content. We have AI that generates content AND proves it was done right."

---

## Feature Status Overview

| Feature | Status | Demo Ready |
|---------|--------|------------|
| 3-Gate Approval System | ✅ Built | Yes |
| Command-Driven Interface | ✅ Built | Yes |
| AI Content Generation | ✅ Built | Yes |
| Brand Score | ✅ Built | Yes |
| Guardrails (17 rules) | ✅ Built | Yes |
| Compliance Receipts | ✅ Built | Yes |
| Proactive Suggestions | ✅ Built | Yes |
| Workflow Automations | ✅ Built | Yes |
| Feedback Loop ("What Changed") | ✅ Built | Yes |
| Campaign Templates (8) | ✅ Built | Yes |
| **Dynamic Campaign Builder** | ✅ Built | Yes |
| Recommendations Engine | ✅ Built | Yes |
| Demo Site Integration | ✅ Built | Yes |
| Slack Notifications | ✅ Built | Yes |
| **RAG Memory System** | ✅ Built | Yes |
| Email (Resend) | ✅ Fixed | Yes |
| **Content Library (Multi-Channel)** | ✅ Built | Yes |
| **Channel Previews** | ✅ Built | Yes |
| **Brand Tone Management** | ✅ Built | Yes |
| **Multi-Channel Content Generation** | ✅ Built | Yes |
| **Content → Campaign Integration** | ✅ Built | Yes |
| **Social Templates (Instagram/LinkedIn/Twitter)** | ✅ Built | Yes |
| **Visual Thumbnails for Social Content** | ✅ Built | Yes |
| **Audience → Campaign Integration** | ✅ Built | Yes |

---

## Core Features

### 1. 3-Gate Approval System

Every campaign goes through 3 gates before sending:

| Gate | Type | What It Checks |
|------|------|----------------|
| **Gate 1** | Rules (Automated) | CAN-SPAM, GDPR, required fields, profanity, PII |
| **Gate 2** | AI (Automated) | Brand score, toxicity, copyright risk |
| **Gate 3** | Human (Manual) | Slack approve/reject - AI cannot bypass |

**Key Point:** Gate 3 is non-negotiable. Shows who approved, when, and proves it was a real human click.

### 2. Command-Driven Interface

User types natural language, AI routes to correct action:

| User Says | AI Does |
|-----------|---------|
| "Create audience of 5-star reviewers" | Opens Audiences with filter |
| "Generate thank you email" | Creates content with brand voice |
| "When rating < 3, alert Slack" | Creates automation rule |
| "Show campaign performance" | Opens Analytics |

### 3. Feedback Loop - "What Changed Since Last Time"

**THE DIFFERENTIATOR.** Shows the system learns. Adjustments are **campaign-type specific**:

**Referral Campaign** (targeting 5-star reviewers):
```
🔁 Adjustments made:
– 👥 Excluded customers with unresolved negative reviews (73% lower conversion)
– ⏰ Increased wait time from 2 → 5 days (45% lower open rates if too soon)
– 🎯 Prioritized referral over discount (VIP respond 2.3x better to referrals)
```

**Recovery Campaign** (targeting negative reviewers):
```
🔁 Adjustments made:
– ⏰ Response time reduced to within 2 hours (recovery drops 50% after 24hr)
– 🎯 Added personal manager outreach (+40% resolution rate)
– ✍️ Lead with apology before compensation (+28% acceptance)
```

**Win-Back Campaign** (targeting inactive 90+ days):
```
🔁 Adjustments made:
– ✍️ Increased discount from 15% to 20% (15% under-performs by 23%)
– ✍️ Lead with "we miss you" before discount (+34% response)
– 🎯 Added SMS follow-up to email (+52% reactivation)
```

**Conquest Campaign** (targeting competitor customers):
```
🔁 Adjustments made:
– ✍️ Highlighted speed advantage 1.8hr vs 2.5hr (#1 competitor complaint)
– 🎯 Increased first-visit discount to 25% (switching cost barrier)
– ✍️ Added satisfaction guarantee (-45% perceived risk)
```

**Demonstrates:**
- **Memory** - Remembers past campaign performance
- **Causality** - Understands WHY things worked/failed
- **Adaptation** - Automatically adjusts behavior based on campaign type
- **Control** - User sees exactly what changed and why

### 4. Workflow Automations

Connect external systems (Birdeye, CRM) to internal systems (Email, Slack):

| Automation | Trigger | Actions | Performance |
|------------|---------|---------|-------------|
| 5-Star Thank You | 5-star review | Send email + Slack #customer-wins | 🟢 34.2% |
| Negative Review Alert | 1-2 star review | Slack #urgent + Create recovery campaign | 🟢 31.5% |
| Service Appointment Reminder | 24h before appointment | Send reminder email | 🟢 32.1% |
| New Customer Welcome | First purchase | Welcome email + Add to audience | 🟢 41.2% |
| Lapsed Customer Win-Back | 90 days inactive | Win-back campaign + Email | 🔴 11.3% |
| **Service Reminder** 🆕 | Service due (6+ months) | Send service reminder email | 🟢 28.3% |
| **Oil Change Reminder** 🆕 | Oil change due (4+ months) | Send oil change reminder email | 🟡 18.1% |

**Performance Indicators:**
- 🟢 **Green** (>25% open rate) - Performing well
- 🟡 **Yellow** (15-25% open rate) - Needs attention
- 🔴 **Red** (<15% open rate) - Underperforming, flagged for review

**Feedback Loop Alert:**
When automations underperform, the system displays a warning banner with actionable insights.

**Create Automation Modal:**
- Select trigger type (review, service due, oil change due, appointment, etc.)
- Select action type (send email, Slack, create campaign, add to audience)
- Choose email template or "Create with AI"
- Preview workflow before saving

### 5. Campaign Templates (8)

Pre-built in brand voice with predicted outcomes:

| Template | Type | Expected Open Rate |
|----------|------|-------------------|
| 5-Star Referral Request | referral | 34.2% |
| Win-Back Campaign | winback | 22.4% |
| Service Reminder | service | 28.1% |
| Recovery Campaign | recovery | 31.5% |
| New Customer Welcome | welcome | 41.2% |
| VIP Loyalty Reward | loyalty | 38.2% |
| Conquest Campaign | conquest | 24.8% |
| Birthday Celebration | birthday | 52.3% |

### 6. Dynamic Campaign Builder 🆕

**Any campaign. Any audience. Any offer.** No templates required.

User describes campaign in plain English, AI builds everything:

**Input:**
```
Create a December holiday campaign for customers who bought a car in 2024 with 25% service discount
```

**AI Does:**
1. **Smart Label** - Derives "December Holiday" (not generic "Custom")
2. **Auto-Audience** - Creates "2024 Buyers" audience if doesn't exist (findOrCreate)
3. **Content Instructions** - Extracts 25% discount and bakes into content
4. **Campaign-Specific Adjustments** - Shows relevant "What Changed" for custom campaigns

**Content Instruction Extraction:**
| User Says | AI Extracts |
|-----------|-------------|
| "25% discount" | `Include a 25% discount offer` |
| "$50 credit" | `Include a $50 credit offer` |
| "urgent" or "limited time" | `Add urgency messaging` |
| "friendly" or "warm" | `Use a warm, friendly tone` |

**Audience Auto-Creation:**
- AI extracts audience criteria from description
- Checks if audience exists by name (case-insensitive)
- If exists → uses existing audience
- If not → creates new audience with extracted conditions
- Shows **NEW AUDIENCE** badge in UI

**Supported Campaign Types:**
| Known Type | Trigger Words |
|------------|---------------|
| referral | "referral", "refer" |
| recovery | "recovery", "negative", "complaint" |
| win-back | "win-back", "winback", "inactive" |
| conquest | "conquest", "competitor" |
| service | "service", "maintenance", "reminder" |
| birthday | "birthday" |
| welcome | "welcome" |
| loyalty | "loyalty", "vip" |
| **custom** | Any other description → AI-derived label |

### 7. Recommendations Engine

Based on customer profile, recommends best campaign with predictions:

```json
{
  "templateName": "VIP Loyalty Reward",
  "score": 90,
  "predictedOutcomes": {
    "openRate": 45.3,
    "clickRate": 8.3,
    "estimatedRevenue": 66,
    "roi": 13131
  },
  "adjustmentsMade": [
    "Excluded negative reviews",
    "Increased wait time 2→5 days",
    "Prioritized referral over discount"
  ]
}
```

### 8. Demo Site Integration

TrustEye controls Premier Nissan demo site:

- **Loyalty Points Display** - Points + tier in header
- **Weekend Appointment Bonus** - +100 extra points on weekends
- **Campaign Banners** - Triggered from TrustEye
- **Real-time Updates** - Points animate when changed

### 9. RAG Memory System (Knowledge Base)

AI can answer ANY question about TrustEye's capabilities:

**What's Indexed (132 documents):**
- All 15 tool definitions with parameters and examples
- 3 campaign workflows (Referral, Conquest, Recovery)
- 3-gate approval system documentation
- Feedback loop explanations
- FAQs with specific answers
- Brand voice guidelines

**Example Questions AI Can Answer:**
- "What can TrustEye do?" → Lists 3 campaign types with specifics
- "How is TrustEye different from Jasper?" → Trust Layer vs Trust Foundation
- "What is the 3-gate approval system?" → Detailed gate-by-gate explanation
- "What integrations exist?" → Birdeye, Slack, Resend, Late.dev

**No Generic Marketing Speak** - AI gives specific tools, real workflows, actual features.

### 10. Content Library (Multi-Channel)

Pre-built content templates across 7 channels with brand-aware previews:

**Channels Supported:**
| Channel | Icon | Templates | Preview Type |
|---------|------|-----------|--------------|
| Email | 📧 | 9 | Email client mockup |
| SMS | 📱 | 9 | Phone with message bubble |
| Instagram | 📸 | 6 | Instagram post UI with image thumbnail |
| LinkedIn | 💼 | 6 | Professional post format |
| Twitter/X | 🐦 | 6 | Tweet format (280 chars) |
| Slack | 💬 | 3 | Slack message window |
| Web Banner | 🖼️ | 5 | Scaled banner with dimensions + thumbnail |

**Campaign Types:**
- Referral, Recovery, Win-back, Conquest, Welcome, Loyalty, Service, Birthday, Seasonal

**Features:**
- **44 Pre-built Templates** - Ready to use across all channels
- **Channel-Specific Previews** - See exactly how content appears
- **Brand Score on Every Item** - 85-98% brand alignment
- **Mock Performance Data** - Simulated usage stats with clear "(mock)" label
- **Filter by Channel/Type** - Find content quickly
- **Create Campaign →** - One-click campaign creation from any content

### 10.1 Social Templates 🆕

**Social section in left navigation** with expandable sub-channels:

| Platform | Templates | Content Focus |
|----------|-----------|---------------|
| **Instagram** | 6 | Visual engagement posts - Team Spotlight, Car Care Tips, Customer Story, New Model Showcase, Community Event, Behind the Scenes |
| **LinkedIn** | 6 | Professional content - Industry Insight, Team Achievement, Hiring & Culture, Thought Leadership, Community Impact, Partnership Announcement |
| **Twitter/X** | 6 | Quick engagement - Quick Tips, Fun Trivia, Weather Alerts, Customer Shoutouts, Engagement Polls, Industry News |

**Key Difference:** Social templates are for **brand engagement**, not direct marketing campaigns. Unlike email/SMS campaigns, these are community-building posts.

**Visual Features:**
- **Image Thumbnails** - Social and banner templates show visual previews in cards
- **Platform Badge Overlay** - Instagram (pink), LinkedIn (blue), Twitter (gray) icons
- **Brand Score Overlay** - Shows alignment percentage on thumbnail

**Integration:**
- **Create Campaign →** button opens AI Studio with template pre-selected
- **Content → Studio Flow** - Seamless handoff with context preserved

### 11. Brand Tone Management

Centralized brand voice control with channel-specific overrides:

**Default Tone:** Professional & Friendly
- Voice attributes: Warm, Trustworthy, Customer-focused
- Words to use: appreciate, thank you, valued, premium
- Words to avoid: cheap, buy now, act fast, guarantee
- Emoji policy: Sparingly

**Channel Overrides:**
| Channel | Voice | Emoji |
|---------|-------|-------|
| Email | Professional & Warm | Sparingly |
| SMS | Friendly & Direct | None |
| Instagram | Casual & Engaging | Freely |
| LinkedIn | Professional & Thought-leading | None |
| Twitter/X | Conversational & Punchy | Sparingly |
| Slack | Informative & Action-oriented | Sparingly |
| Banner | Punchy & Clear | Sparingly |

### 12. Multi-Channel Content Generation 🆕

**Command-driven content creation across Email, SMS, and Social channels.**

**Example Commands:**
- "Create email for holiday sale" → Generates email content
- "Generate SMS template for win-back" → Generates SMS message
- "Create content for all channels" → Generates Email, SMS, Social together
- "Write Instagram post about referral program" → Instagram-specific content
- "Create new template for New Nissan car launch for Instagram" → Instagram post with car images
- "Generate LinkedIn post about team achievement" → Professional LinkedIn content
- "Create Twitter thread about service tips" → Twitter-optimized content

**Generation Features:**
- **Automatic Channel Detection** - AI parses which channels to generate (instagram, linkedin, twitter, sms, email)
- **Default to All Channels** - If no channel specified, creates Email + SMS + Social
- **Campaign Type Inference** - Detects referral, recovery, win-back, etc. from query
- **Custom Instructions Extraction** - Pulls offers, tone hints, audience from command
- **Topic Extraction** - Detects topics like "New Nissan car launch" from natural language

**Output Includes:**
| Channel | Content Generated |
|---------|-------------------|
| Email | Subject, Preview Text, Body, CTA |
| SMS | Message (with 160-char limit check) |
| Instagram | Post, Hashtags, Image suggestions |
| LinkedIn | Professional post, Industry hashtags |
| Twitter/X | Tweet (280 chars), Hashtags |

**"What Changed" for Content:**
Shows AI adjustments made during generation:
- 📧 "Applied email best practices" (subject under 50 chars, clear CTA)
- 📱 "Optimized for SMS delivery" (char count, no special characters)
- 📸 "Added engagement elements" (relevant hashtags, post length)
- 💼 "Professional tone applied" (LinkedIn-appropriate language)
- 🐦 "Tweet optimized" (280 char limit, trending hashtags)
- 🎯 "Personalization placeholders added" (+23% engagement)
- Campaign-type specific adjustments (referral/recovery/win-back messaging)

### 13. Cross-Page Integration 🆕

**Content Library → AI Studio:**
- Click "Create Campaign" on any template
- AI Studio opens with template content pre-loaded
- Workflow state includes selected content
- One-click to proceed to audience selection

**Audiences → AI Studio:**
- Click "Create Campaign" on any audience card
- AI Studio opens with audience pre-selected
- Shows audience name and customer count
- Ready for content generation

**CommandBox → Content Generation:**
- Works from any page (Content, Audiences, Studio)
- Commands like "create template for Instagram" route correctly
- Channel detection for instagram, linkedin, twitter, sms, email
- Falls through to multi-channel generation handler

---

## API Endpoints Reference

### Core AI Endpoints
```
POST /api/ai/chat              # Chat with AI
POST /api/ai/content/generate  # Generate content
POST /api/ai/content/score     # Get brand score
GET  /api/ai/suggestions       # Get proactive suggestions
```

### 3-Gate System
```
POST /api/campaigns/:id/review  # Submit for 3-gate review
POST /api/campaigns/:id/execute # Execute approved campaign
POST /api/campaigns/slack/approval # Slack webhook callback
```

### Feedback Loop
```
GET /api/ai/feedback/what-changed/:type  # Get "What changed"
GET /api/ai/feedback/learnings           # All learnings
```

### Recommendations
```
POST /api/ai/recommendations    # Get campaign recommendations
GET  /api/ai/marketing-insights # Get marketing insights
POST /api/ai/analyze-campaign   # Analyze campaign concept
```

### Templates
```
GET  /api/ai/templates          # List all templates
GET  /api/ai/templates/:id      # Get single template
POST /api/ai/templates/:id/render # Render with variables
```

### Automations
```
GET  /api/automations           # List automations
POST /api/automations/parse     # Parse natural language
POST /api/automations/webhook/birdeye # Simulate review
```

### Demo Site
```
POST /api/demo-site/loyalty     # Add/remove points
POST /api/demo-site/appointment # Book appointment
```

---

## Technical Architecture

### Backend Services
| Service | Status |
|---------|--------|
| Claude AI (Anthropic) | ✅ Working |
| Pinecone (93 docs indexed) | ✅ Working |
| Supabase (database) | ✅ Working |
| Slack (webhooks) | ✅ Working |
| Resend (email) | ⚠️ Need valid API key |
| Birdeye (reviews) | ✅ Working (mock) |

### Frontend Components
| Component | Purpose |
|-----------|---------|
| CommandBox | Natural language input |
| ConversationFeed | AI responses |
| InspectorPanel | Campaign preview + brand score |
| ReviewLaunchDrawer | 3-gate visualization |
| GateVisualization | Animated gate progress |
| GuardrailsLive | Real-time checkmarks |
| ComplianceReceipt | Downloadable proof |

---

## Environment Variables

```bash
# Required - All set ✅
SUPABASE_URL=✓
SUPABASE_ANON_KEY=✓
ANTHROPIC_API_KEY=✓
SLACK_WEBHOOK_URL=✓
PINECONE_API_KEY=✓
BIRDEYE_API_KEY=✓
BIRDEYE_BUSINESS_ID=149677737704490

# Needs Fix ⚠️
RESEND_API_KEY=re_...  # Get from resend.com/api-keys
TEST_EMAIL=sumitjain@gmail.com
```

---

## Known Issues

| Issue | Status | Fix |
|-------|--------|-----|
| Resend API key invalid | ⚠️ Blocking email | Update key in .env |
| Slack buttons | ℹ️ Workaround | Use webhook only |

---

## Quick Start

```bash
# Backend (port 3009)
cd /Users/sj/dev/kq-studio/services && npm run dev

# Frontend (port 5173)
cd /Users/sj/dev/kq-studio && npm run dev

# Demo Site (port 3001)
cd /Users/sj/dev/kq-studio/demo-site && npm run dev

# Test health
curl http://localhost:3009/health
```

---

## Files Structure

```
/Users/sj/dev/kq-studio/
├── src/app/                    # Frontend (React)
│   └── components/
│       └── TrustLayer/         # Gate visualization components
├── services/                   # Backend (Express)
│   └── src/
│       ├── routes/             # API endpoints
│       └── services/           # Business logic
│           ├── feedbackLoop.ts # "What changed"
│           ├── recommendations.ts
│           ├── automations.ts
│           └── ...
├── demo-site/                  # Premier Nissan site
└── brand-knowledge/            # Indexed documents
```

---

*This is the single source of truth for TrustEye functionality.*
