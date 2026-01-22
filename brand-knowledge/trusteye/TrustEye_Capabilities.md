# TrustEye AI Marketing Platform - Capabilities

## What is TrustEye?

TrustEye is an AI marketing layer that sits on top of Birdeye. It reads real customer data (reviews, contacts) and creates smart, compliant marketing campaigns automatically.

**Key differentiator:** "Jasper says 'trust us.' TrustEye says 'here's the proof.'"

TrustEye provides visible, verifiable, receipted proof of every AI action - not just a promise of trust.

---

## Core Capabilities

### 1. Create Marketing Campaigns
TrustEye can create three types of campaigns from real Birdeye data:

**Referral Campaign (from 5-star reviews)**
- Identifies customers who left 5-star reviews
- Creates personalized thank-you emails asking for referrals
- Offers reciprocal benefits ($100 for both parties)
- Best sent within 48 hours of the review

**Conquest Campaign (from competitor weaknesses)**
- Analyzes competitor reviews (e.g., Valley Honda)
- Identifies their weaknesses (slow service, hidden fees)
- Creates targeted campaigns highlighting our strengths
- Uses competitive intelligence from brand knowledge

**Recovery Campaign (from negative reviews)**
- Monitors 1-2 star reviews in real-time
- Creates immediate recovery outreach
- Personal manager follow-up increases resolution by 40%
- 20% discount optimal for win-back

### 2. 3-Gate Approval System
Every campaign goes through 3 gates before sending:

**Gate 1: Rules Engine (Automated)**
- CAN-SPAM compliance check
- GDPR requirements
- Required fields validation
- Profanity filter
- PII detection
- Unsubscribe link verification
- Deterministic: Pass or Fail

**Gate 2: AI Review (Automated)**
- Brand score calculation (target: 85%+)
- Toxicity check (target: 0%)
- Copyright risk assessment
- Tone alignment
- Probabilistic: Smart pattern matching

**Gate 3: Human Approval (Manual)**
- Slack notification with Approve/Reject buttons
- Shows who approved, when, interaction duration
- Non-negotiable: AI cannot approve itself
- Creates audit trail

### 3. Compliance Receipts
Every campaign generates an immutable compliance receipt:
- Gate 1 results (rules checked)
- Gate 2 results (AI scores)
- Gate 3 results (who approved, when)
- SHA-256 hash for tamper-proof verification
- Downloadable as PDF or JSON

### 4. Feedback Loop ("What Changed Since Last Time")
The system learns and adapts:
- Remembers past campaign performance
- Shows adjustments made based on data
- Example adjustments:
  - "Excluded customers with unresolved negative reviews" (73% lower conversion)
  - "Increased wait time from 2 to 5 days" (45% lower open rates when contacted too soon)
  - "Prioritized referral over discount offers" (VIP customers respond 2.3x better)

### 5. Brand Voice Enforcement
- Learns brand voice from uploaded documents
- Calculates brand alignment score (0-100%)
- Ensures consistent messaging across all channels
- Premier Nissan voice: Professional, Trustworthy, Community-focused

---

## Available Tools

### Demo Site Tools
- **Trigger Loyalty Campaign**: Show loyalty banner on website
- **Update Display Ad**: Change display ad content
- **Push Site Notification**: Show notification toast to visitors

### Email Tools
- **Send Email Campaign**: Send to audience segment via Resend
- **Send Single Email**: Send to one recipient

### Slack Tools
- **Send Slack Notification**: Post message to Slack channel
- **Request Slack Approval**: Send approval request with buttons

### SMS Tools
- **Send SMS Campaign**: Send SMS via Birdeye

### Social Media Tools
- **Post to Social Media**: Post via Late.dev to Facebook, Instagram, Twitter, LinkedIn

### Data Tools
- **Get Audience Segment**: Retrieve audience details
- **Create Audience Segment**: Build new audience with conditions
- **Get Birdeye Reviews**: Fetch reviews with filters
- **Analyze Reviews**: AI sentiment and theme analysis
- **Get Competitor Insights**: Fetch competitor data
- **Create Campaign**: Create marketing campaign
- **Generate Content**: AI-generate marketing content with brand voice

---

## Integrations

| Integration | Purpose |
|-------------|---------|
| Birdeye | Customer reviews, contacts, competitor data |
| Slack | Team notifications, approval workflow |
| Resend | Email delivery |
| Late.dev | Social media posting |
| Supabase | Database for campaigns, audiences, receipts |

---

## Campaign Templates

TrustEye includes 8 pre-built campaign templates:

1. **5-Star Referral Request** - 34.2% open rate
2. **Win-Back Campaign** - 22.4% open rate
3. **Service Reminder** - 28.1% open rate
4. **Recovery Campaign** - 31.5% open rate
5. **New Customer Welcome** - 41.2% open rate
6. **VIP Loyalty Reward** - 38.2% open rate
7. **Conquest Campaign** - 24.8% open rate
8. **Birthday Celebration** - 52.3% open rate

---

## Workflow Automations

TrustEye can create automated workflows:

**Example: "When a 5-star review is received, send thank you email and notify Slack"**
- Trigger: Birdeye webhook for 5-star review
- Action 1: Send personalized thank you email
- Action 2: Notify #customer-wins on Slack

**Available Triggers:**
- Review received (by rating)
- Appointment scheduled
- Customer inactive for X days
- First purchase

**Available Actions:**
- Send email
- Send Slack notification
- Create campaign
- Add to audience
