# TrustEye Demo Script

**Demo Date:** Friday, January 24, 2026
**Duration:** 5-6 minutes
**Audience:** Board / Investors

---

## Pre-Demo Checklist

- [x] Backend running: `http://localhost:3009/health` returns OK *(Verified Jan 23)*
- [x] AI endpoints returning dynamic content *(Verified Jan 23)*
- [x] 3-gate approval flow working *(Verified Jan 23)*
- [ ] Frontend running: `http://localhost:5173`
- [ ] Demo site running: `http://localhost:3001`
- [ ] Slack open (for approval notification)
- [ ] Phone ready (show real email)
- [x] Resend API key valid (test email works) *(Verified Jan 23)*

---

## The Hook (30 seconds)

> "Imagine you're a Birdeye customer. 500+ locations. Every day, happy customers leave reviews. But turning those into revenue? That's where the ball gets dropped.
>
> TrustEye is an AI marketing layer that sits on Birdeye. It spots opportunities, creates campaigns, and—here's what matters—**proves** every action was compliant. Let me show you."

---

## Demo Flow

### Step 1: Show Proactive Suggestions (60 sec)

**Action:** Open TrustEye dashboard

**You'll see:** "3 AI Suggestions" badge

**Say:**
> "TrustEye just found 12 happy customers who left 5-star reviews yesterday. It's suggesting we send them a VIP thank-you offer."

**Action:** Click the suggestion

**You'll see:** Campaign Studio with AI-generated content

**Say:**
> "In one click, AI created the campaign. Email subject, body, audience—all aligned to brand."

---

### Step 2: Show "What Changed" - THE DIFFERENTIATOR (60 sec)

**Action:** Point to the adjustments panel (amber/orange section)

**You'll see (for Referral Campaign):**
```
🔁 Adjustments made:
– 👥 Excluded customers with unresolved negative reviews
– ⏰ Increased wait time from 2 → 5 days
– 🎯 Prioritized referral over discount offers
```

**Say:**
> "But here's what's different. See these adjustments? This is what the system **learned** since last time.
>
> It excluded customers with unresolved complaints—73% lower conversion. It increased wait time between messages—45% better open rates. It knows referrals work better than discounts for VIPs.
>
> This isn't just generating content. It's **learning and adapting**. Memory. Causality. Control."

**IMPORTANT:** Adjustments are campaign-type specific!

| If you demo... | You'll see adjustments for... |
|----------------|------------------------------|
| Referral (5-star) | Exclude negative, wait 5 days, prioritize referral |
| Recovery (1-2 star) | Respond in 2 hours, personal manager, lead with apology |
| Win-back (inactive) | 20% discount, "we miss you" lead, add SMS |
| Conquest (competitor) | Speed advantage, 25% first visit, satisfaction guarantee |

---

### Step 3: Show Trust Layer (90 sec) - THE MOAT

**Action:** Point to Guardrails Panel

**You'll see:** Checkmarks appearing in real-time

**Say:**
> "See these checkmarks? That's our Trust Layer:
>
> ✓ No hate speech
> ✓ Brand name present
> ✓ Unsubscribe link
> ✓ No competitor mentions
>
> **12 guardrails**, checked automatically. Some AI can't bypass—like safety. Others are brand-specific."

**Action:** Show Brand Score (94%)

**Say:**
> "Brand alignment: 94%. Tone and messaging match the brand guidelines. AI verified."

**Action:** Click "Review & Launch"

**You'll see:** 3-Gate visualization

**Say:**
> "Now trust becomes visible.
>
> **Gate 1: Rules** — CAN-SPAM, GDPR. Deterministic. Pass or fail.
>
> **Gate 2: AI** — Brand score 94%, toxicity 0%. Probabilistic.
>
> **Gate 3: Human** — Non-negotiable. AI cannot approve itself."

---

### Step 4: Human Approval (60 sec)

**Action:** Switch to Slack

**You'll see:** Approval notification with [Approve] [Reject]

**Say:**
> "The approver sees exactly what AI reviewed. Gate 1 passed. Gate 2 passed—94% brand score. One-click approve or reject.
>
> This could be a manager, compliance officer—whoever your workflow requires."

**Action:** Click "Approve"

**You'll see:** UI updates to "Approved by sj@... at 2:15 PM"

**Say:**
> "Notice: WHO approved, WHEN, and that it was a real click—3.4 seconds interaction. Not automated. A real human decision."

---

### Step 5: Compliance Receipt (60 sec) - LEGAL PROOF

**Action:** Click "View Compliance Receipt"

**You'll see:** Receipt with SHA-256 hash

**Say:**
> "This is what we give legal.
>
> Every campaign generates an immutable receipt:
> - Gate 1 results
> - Gate 2 results
> - Gate 3: who approved, when
> - SHA-256 hash: tamper-proof
>
> When regulators ask 'prove this was compliant'—you hand them this."

**Action:** Click "Download"

**Say:**
> "PDF. JSON. Every campaign, every time, with receipts."

---

### Step 6: Execute & Demo Site (60 sec)

**Action:** Click "Send Campaign"

**You'll see:** Campaign sent confirmation

**Say:**
> "Campaign executing. 12 recipients."

**Action:** Show demo site (localhost:3001)

**You'll see:** Loyalty points display in header

**Say:**
> "And look at the customer's side. They see their loyalty points. When they book a weekend appointment..."

**Action:** Click "Book Now" on services page

**You'll see:** Points increase with animation (+150)

**Say:**
> "...they get bonus points. The system knows it's a weekend. Rule applied automatically. This is the closed loop."

---

### Step 7: AI Knowledge Demo (Optional - 30 sec)

**Action:** Type in command box: "What can TrustEye do?"

**You'll see:** Detailed, specific response listing exact capabilities

**Say:**
> "Quick aside—watch what happens when I ask about the system itself.
>
> 'What can TrustEye do?'
>
> Notice: it doesn't give generic marketing speak. It knows: three campaign types—referral, conquest, recovery. It knows the 3-gate system. It knows we integrate with Birdeye, Slack, Resend.
>
> **132 documents indexed.** The AI knows exactly what it can do—and what it can't. That's enterprise-ready."

**Alternative questions to demo:**
- "How is TrustEye different from Jasper?" → Trust Layer vs Trust Foundation
- "Can AI approve campaigns by itself?" → Explains Gate 3 is non-delegable

---

### Step 8: Dynamic Campaign Builder (Optional - 60 sec) 🆕

**Action:** Type a unique campaign request:
```
Create a December holiday campaign for customers who bought a car in 2024 with 25% service discount
```

**You'll see:**
1. **AI-DERIVED** badge on campaign label ("December Holiday" - not "Custom")
2. **NEW AUDIENCE** badge ("2024 Buyers" audience auto-created)
3. **Content with 25% discount** baked in (extracted from your request)
4. Campaign-specific adjustments in "What Changed" panel

**Say:**
> "Watch this. I'm asking for a campaign that doesn't exist in our templates.
>
> 'Create a December holiday campaign for 2024 buyers with 25% discount.'
>
> Look what happened:
> - **Smart Label** — AI derived 'December Holiday' from my request. Not 'Custom Campaign'.
> - **Auto-Audience** — It created '2024 Buyers' audience automatically. If that audience existed, it would have used it.
> - **Extracted Instructions** — The 25% discount is already in the email copy.
>
> This is a **dynamic campaign builder**. Any campaign. Any audience. Any offer. AI figures it out."

**Alternative prompts to demo:**
- "Create a friendly thank you campaign for weekend service customers with free car wash" → Shows tone extraction + offer extraction
- "Create an urgent flash sale for customers near Riverside location with $50 credit" → Shows urgency + dollar amount extraction + location

---

### Step 8.5: Automations Tab (Optional - 60 sec) 🆕

**Action:** Click "Automations" in sidebar

**You'll see:** List of 7 automations with performance indicators (green/yellow/red)

**Say:**
> "Here's where marketing sets up automations. Like Zapier, but built for dealerships.
>
> See these indicators? Green means performing well—34% open rate. This yellow one? 18% open rate. The system flagged it.
>
> And this red one—Win-back campaign, 11% open rate. The feedback loop identified it's not working."

**Action:** Point to the Feedback Loop Alert banner (amber warning)

**Say:**
> "See this warning banner? That's the feedback loop in action. It tells marketing exactly which automations need attention."

**Action:** Click on Service Reminder automation

**Say:**
> "This one's analytics-driven. Our data shows cars need service every 6 months. So when a customer hits that mark, they get this email automatically.
>
> No manual work. The system knows."

**Action:** Click "New Automation" button

**You'll see:** Create Automation modal with trigger/action selection

**Say:**
> "Creating a new automation takes 30 seconds:
> - Pick a trigger—5-star review, service due, whatever.
> - Pick an action—send email, notify Slack, create campaign.
> - Preview the workflow.
> - Activate.
>
> Done. Marketing can build their own workflows without engineering."

---

### Step 9: Content Library (Optional - 45 sec) 🆕

**Action:** Navigate to Content tab

**You'll see:** 44 pre-built templates organized by channel, with Social Templates at the top

**Say:**
> "Quick sidebar on content management. We have 44 pre-built templates across 7 channels."

**Action:** Click on "Social" in the left sidebar

**You'll see:** Social section expands to show Instagram, LinkedIn, Twitter sub-channels

**Say:**
> "Notice the Social section. This is different from campaigns—these are brand engagement templates for social media."

**Action:** Click on an Instagram template

**You'll see:** Visual thumbnail with Instagram platform badge, brand score overlay

**Say:**
> "Each social template has:
> - **Visual preview** — See the actual image thumbnail
> - **Platform badge** — Instagram, LinkedIn, or Twitter icon
> - **Brand alignment score** — This one is 92%
> - **One-click campaign creation** — Opens AI Studio with template pre-selected"

**Action:** Click "Create Campaign" on a LinkedIn template

**You'll see:** AI Studio opens with template content pre-loaded

**Say:**
> "One click, and we're in the studio with this LinkedIn post ready to customize. Audience selection next."

**Action:** Show Brand Tone section

**You'll see:** Brand voice settings with channel overrides (including LinkedIn, Twitter)

**Say:**
> "Brand tone is channel-aware. LinkedIn gets professional language. Twitter gets conversational. Instagram gets casual with emojis. All automatic."

---

### Step 10: Multi-Channel Content Generation (Optional - 45 sec) 🆕

**Action:** Type in command box:
```
Generate content for all channels for a holiday sale
```

**You'll see:**
1. **Email content** - Subject, body, CTA
2. **SMS content** - 160-char optimized message
3. **Social content** - Instagram/LinkedIn/Twitter posts with hashtags
4. **"What Changed" panel** - Shows AI adjustments

**Say:**
> "Watch this. 'Generate content for all channels for a holiday sale.'
>
> In one command, AI created:
> - **Email** — Subject under 50 chars, body under 150 words, clear CTA
> - **SMS** — Exactly 160 characters, no special characters
> - **Instagram** — Engaging post with relevant hashtags
> - **LinkedIn** — Professional tone, industry hashtags
> - **Twitter** — 280-char optimized, trending tags
>
> And look at these adjustments:
> - Added personalization placeholders (+23% engagement)
> - Applied channel-specific best practices
> - Maintained brand tone across all channels"

**Action:** Click "Create Campaign" on any content

**You'll see:** Campaign modal pre-populated with content

**Say:**
> "One click, and this content becomes a campaign. Template already attached, channel selected, ready to send through the 3-gate system."

---

### Step 10.5: Social Template Generation (Optional - 45 sec) 🆕

**Action:** Type in command box:
```
Create new template for New Nissan car launch for Instagram
```

**You'll see:**
1. **Social content generated** - Instagram post with car launch messaging
2. **Hashtags included** - Relevant automotive + campaign hashtags
3. **Brand score** - Shows alignment percentage
4. **"What Changed" panel** - Instagram-specific optimizations

**Say:**
> "Here's something powerful. 'Create new template for New Nissan car launch for Instagram.'
>
> AI detected:
> - **Channel** — Instagram (not email or SMS)
> - **Topic** — 'New Nissan car launch' extracted
> - **Content type** — Brand engagement post, not campaign
>
> This generates Instagram-ready content with hashtags, optimized caption length, and brand-aligned messaging."

**Alternative prompts:**
- "Create LinkedIn post about team achievement" → Professional content
- "Generate Twitter thread about service tips" → Tweet-optimized
- "Make Instagram story for customer spotlight" → Visual-first content

---

### Step 11: Close (30 sec)

**Say:**
> "What just happened:
>
> 1. AI spotted opportunity from Birdeye data
> 2. AI created campaign—but showed what it **learned** since last time
> 3. Three gates verified: rules, AI, human
> 4. A real person approved with proof
> 5. Campaign executed, customer rewarded
> 6. AI demonstrated it knows its own capabilities (132 docs indexed)
> 7. AI built a completely custom campaign—audience, label, content—from a single sentence
> 8. **44 templates across 7 channels**—including Instagram, LinkedIn, Twitter—all brand-aligned
> 9. Social templates for brand engagement, with visual thumbnails and platform-specific content
>
> That's TrustEye. **AI mature enough to be a full-time employee.** Accountable. Compliant. With receipts.
>
> *Jasper says 'trust us.' We say 'here's the proof.'*"

---

## Key Phrases

| Moment | Say |
|--------|-----|
| Showing adjustments | "This is what it **learned** since last time" |
| Showing guardrails | "12 guardrails, checked automatically" |
| Showing 3 gates | "Rules catch obvious. AI catches subtle. Humans own the decision." |
| After approval | "Not automated. A real human decision." |
| Showing receipt | "When regulators ask, you hand them this." |
| AI knowledge demo | "132 documents indexed. The AI knows exactly what it can do." |
| Dynamic builder demo | "Any campaign. Any audience. Any offer. AI figures it out." |
| **Automations demo** | "Like Zapier, but built for dealerships. Feedback loop flags underperformers." |
| Content Library demo | "44 templates. 7 channels. Brand-aligned and ready to use." |
| **Social templates demo** 🆕 | "Instagram, LinkedIn, Twitter—visual thumbnails, platform-specific content." |
| Multi-channel generation | "One command. All channels. Platform-optimized." |
| **Social generation demo** 🆕 | "AI detects Instagram, extracts topic, generates platform-ready content." |
| Close | "AI mature enough to be a full-time employee. With receipts." |

---

## Don't Say

- "Our AI is smarter than..."
- "100% accurate"
- "Fully automated" (human in loop is the point)
- "Replace your marketing team"
- "No risk"

---

## If Something Breaks

| Problem | Recovery |
|---------|----------|
| Slack notification missing | Show previous notification already in Slack |
| Email doesn't arrive | "Here's one that came through earlier" |
| API slow | "Demo environment—production is faster" |
| Anything crashes | Switch to screen recording backup |

---

## Objection Responses

**"How is this different from Jasper?"**
> "Jasper has a 'Trust Foundation'—infrastructure underneath. We have a Trust **Layer**—visible, auditable, defensible. Their trust is a promise. Ours is evidence."

**"What if AI makes a mistake?"**
> "Three gates. Gate 1 catches rule violations. Gate 2 catches brand/safety. Gate 3 is the human who owns the decision. Plus full audit trail and one-click rollback."

**"Can AI approve itself?"**
> "No. Gate 3 is non-delegable. We verify the click came from a human—interaction duration, session verification. AI cannot bypass this gate."

**"Does the AI actually understand your product?"**
> "Yes. We indexed 132 documents—every tool, workflow, integration. Ask it 'What can TrustEye do?' and it lists the three campaign types, the 3-gate system, all integrations. No generic marketing speak. It knows exactly what it can and can't do."

**"What if we need a campaign type you haven't built?"**
> "You describe it in plain English. Say 'Create a December holiday campaign for 2024 buyers with 25% discount.' AI creates a smart label, finds or creates the audience automatically, and extracts the offer into the content. No templates needed. Any campaign, any audience, any offer."

**"Do you support social media?"**
> "Yes. We have 18 social templates across Instagram, LinkedIn, and Twitter. But here's what's different—these are brand engagement posts, not marketing campaigns. Team spotlights, customer stories, industry insights. Each platform gets its own tone: Instagram casual with emojis, LinkedIn professional, Twitter conversational. And they all show visual thumbnails so you see exactly what you're posting."

**"Can I create social content from a command?"**
> "Absolutely. Say 'Create Instagram post for new car launch' and AI detects the channel, extracts the topic, and generates platform-optimized content with hashtags. Works for LinkedIn, Twitter too. The system knows which channel you want and applies the right tone automatically."

---

## Timing

| Section | Duration | Cumulative |
|---------|----------|------------|
| Hook | 0:30 | 0:30 |
| Suggestions | 1:00 | 1:30 |
| What Changed | 1:00 | 2:30 |
| Trust Layer | 1:30 | 4:00 |
| Human Approval | 1:00 | 5:00 |
| Receipt | 0:30 | 5:30 |
| Execute + Demo Site | 0:30 | 6:00 |
| AI Knowledge (optional) | 0:30 | 6:30 |
| Dynamic Builder (optional) | 1:00 | 7:30 |
| **Automations (optional)** 🆕 | 1:00 | 8:30 |
| Content Library (optional) | 0:45 | 9:15 |
| Multi-Channel Generation (optional) | 0:45 | 10:00 |
| **Social Template Generation (optional)** 🆕 | 0:45 | 10:45 |

**Target: 5:30-6:00** (10:45 with all optional demos including social templates)

---

## API Test Results (Verified Jan 23, 2026)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /health` | ✅ Working | Returns `{"status":"ok"}` |
| `GET /api/ai/suggestions` | ✅ Working | Returns 4 real suggestions (recovery, win-back, seasonal, competitive) |
| `GET /api/ai/feedback/what-changed/:type` | ✅ Working | Returns campaign-specific adjustments (91% confidence) |
| `POST /api/ai/chat` | ✅ Working | RAG-powered responses about TrustEye capabilities |
| `POST /api/ai/content/generate` | ✅ Working | Real AI-generated content with brand scores (e.g., 89%) |
| `POST /api/campaigns` | ✅ Working | Creates campaigns in Supabase |
| `POST /api/campaigns/:id/review` | ✅ Working | 3-gate flow: Gate 1 (Rules), Gate 2 (AI - 94% brand score), Gate 3 (Human awaiting) |
| `POST /api/campaigns/test-email` | ✅ Working | Email sent to sumitjain@gmail.com |

**Key Verification:** AI endpoints return **dynamic content**, not static. Tested with unique queries and received unique, contextual responses.

---

## Test Commands (Day Before)

```bash
# Verify all services
curl http://localhost:3009/health
curl http://localhost:3009/api/ai/suggestions
curl http://localhost:3009/api/ai/feedback/what-changed/referral
curl http://localhost:3009/api/automations  # Should return 7 automations with performanceStatus
curl http://localhost:3001/api/loyalty

# Test RAG knowledge (should give specific answers, not generic)
curl -X POST http://localhost:3009/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What can TrustEye do?"}'

# Test email
curl -X POST http://localhost:3009/api/campaigns/test-email \
  -H "Content-Type: application/json" \
  -d '{"subject":"Test"}'

# Test social content generation (NEW)
curl -X POST http://localhost:3009/api/ai/content/generate \
  -H "Content-Type: application/json" \
  -d '{"channels":["social"],"goal":"New Nissan car launch for Instagram","campaignType":"promotional"}'
```

## UI Test Commands (In Browser)

Test these commands in the CommandBox to verify social template generation:

```
# Should generate Instagram content
Create new template for New Nissan car launch for Instagram

# Should generate LinkedIn content
Generate LinkedIn post about team achievement

# Should generate Twitter content
Create Twitter post about quick service tips

# Should generate all channels
Generate content for all channels for holiday sale
```

---

*Practice this 3x before demo day.*
