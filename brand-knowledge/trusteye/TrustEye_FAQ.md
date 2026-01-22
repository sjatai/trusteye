# TrustEye Frequently Asked Questions

## General Questions

### What can TrustEye do?
TrustEye can create three types of marketing campaigns from your real Birdeye data:
1. **Referral campaigns** from 5-star reviews - identify happy customers and ask for referrals
2. **Conquest campaigns** based on competitor weaknesses - target customers unhappy with competitors like Valley Honda
3. **Recovery campaigns** from negative reviews - immediately reach out to unhappy customers

All campaigns go through 3-gate approval (Rules, AI, Human) before sending. The system learns from past performance and shows you "what changed since last time."

Want me to create one of these campaigns?

### How is TrustEye different from Jasper?
Jasper has what they call a "Trust Foundation" - infrastructure underneath their tools. It's a promise.

TrustEye has a "Trust Layer" - verification that's visible, auditable, and defensible. It's evidence.

**Jasper says "trust us." TrustEye says "here's the proof."**

Every campaign in TrustEye generates a compliance receipt with:
- What rules were checked
- AI review scores
- Who approved it and when
- SHA-256 hash (tamper-proof)

When regulators ask "prove this campaign was compliant" - you hand them the receipt.

### What integrations exist?
TrustEye integrates with:
- **Birdeye** - Customer reviews, contacts, competitor data
- **Slack** - Team notifications and approval workflow
- **Resend** - Email delivery (with in10.ai domain)
- **Late.dev** - Social media posting to Facebook, Instagram, Twitter, LinkedIn
- **Supabase** - Database for campaigns, audiences, and receipts

### What is the 3-gate approval system?
Every campaign goes through 3 gates before sending:

**Gate 1: Rules Engine** (Automated)
- CAN-SPAM, GDPR compliance
- Profanity filter, PII detection
- Required fields check
- Binary: Pass or Fail

**Gate 2: AI Review** (Automated)
- Brand score (target 85%+)
- Toxicity check (target 0%)
- Copyright risk assessment
- Probabilistic scoring

**Gate 3: Human Approval** (Manual)
- Slack notification with Approve/Reject
- Records who approved, when, how long they reviewed
- Non-negotiable: AI cannot approve itself

### How does brand voice work?
TrustEye learns your brand voice from uploaded documents:
1. Upload brand guidelines, past campaigns, style guides
2. TrustEye indexes and learns the patterns
3. When generating content, it scores against your brand voice
4. Brand Score shows alignment (0-100%)

For Premier Nissan, the voice is:
- Professional yet friendly
- Trustworthy and transparent
- Community-focused
- Value-conscious (not cheap)

---

## Campaign Questions

### How do I create a referral campaign?
Say: "Create a referral campaign from 5-star reviews"

TrustEye will:
1. Find customers who left 5-star reviews recently
2. Generate a personalized thank-you email
3. Include a referral ask with reciprocal benefit
4. Send through 3-gate approval

Best practice: Send within 48 hours of the review for best response.

### How do I create a conquest campaign?
Say: "Create a conquest campaign targeting Valley Honda customers"

TrustEye will:
1. Analyze Valley Honda's weaknesses from competitor data
2. Identify their pain points (slow service, hidden fees)
3. Create content highlighting our strengths
4. Target relevant audience segments

### How do I create a recovery campaign?
Say: "Create a recovery campaign for negative reviews"

TrustEye will:
1. Find customers with 1-2 star reviews
2. Create personalized recovery outreach
3. Include appropriate offer (20% is optimal for win-back)
4. Route for immediate human approval

Best practice: Respond within 2 hours of negative review.

---

## Technical Questions

### What guardrails does TrustEye check?
TrustEye runs 17 guardrails including:
- No hate speech
- No profanity
- Brand name present
- Unsubscribe link included
- No competitor mentions
- No PII exposed
- Appropriate tone
- Required legal elements

### How does the feedback loop work?
TrustEye shows "What changed since last time" - adjustments made based on past performance:

Example adjustments:
- "Excluded customers with unresolved negative reviews" (73% lower conversion)
- "Increased wait time from 2 to 5 days" (45% better open rates)
- "Prioritized referral over discount" (VIP responds 2.3x better)

This demonstrates the system has:
- **Memory** - remembers past results
- **Causality** - understands why things worked
- **Adaptation** - changes behavior automatically
- **Control** - shows you what changed

### Can AI approve campaigns by itself?
No. Gate 3 (Human Approval) is non-delegable. The system verifies:
- Click came from a human
- Interaction duration (not instant)
- Session verification
- Identity validation

AI cannot bypass this gate. Every approval creates an audit trail.
