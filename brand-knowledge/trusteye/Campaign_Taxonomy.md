# Campaign Taxonomy & Query Mapping

**Created:** January 23, 2026  
**Purpose:** Handle ANY marketing query by mapping to structured campaigns

---

## The Problem

Birdeye will test with queries like:
- "Send a promo to all customers"
- "Post on Instagram about our new service"
- "Create a loyalty program"
- "Remind inactive customers"

The LLM needs to know:
1. **Is this a campaign or content?** (Don't send individual social posts as campaigns)
2. **What type of campaign?** (Map to our 15 types)
3. **What dimensions matter?** (Audience, content, channel, schedule, objective)

---

## Campaign vs. Content (Critical Distinction)

| Query Type | What It Is | Action |
|------------|------------|--------|
| **Campaign** | Targeted outreach to a specific audience | Create campaign → 3-gate approval → Send |
| **Content** | Brand engagement, not audience-targeted | Create content → Store in library |

### Examples

| User Says | Type | Why |
|-----------|------|-----|
| "Send thank you email to 5-star reviewers" | ✅ Campaign | Audience-targeted, personalized |
| "Post on Instagram about new car launch" | ❌ Content | Brand engagement, not targeted |
| "Remind customers who haven't visited in 90 days" | ✅ Campaign | Audience-targeted, trigger-based |
| "Create LinkedIn post about team achievement" | ❌ Content | Social brand content |
| "Send birthday emails" | ✅ Campaign | Audience-targeted, scheduled |
| "Tweet about quick service tips" | ❌ Content | Social brand content |

**Rule:** If it says "send to [audience]" → Campaign. If it says "post/create [content]" → Content.

---

## Campaign Type Mapping

### Our 15 Campaign Types

| Type | Trigger Words | Objective | Typical Channel |
|------|---------------|-----------|-----------------|
| **referral** | referral, refer a friend, bring a friend | Drive word-of-mouth | Email |
| **recovery** | recovery, complaint, negative, upset, apologize | Win back unhappy customers | Email + Phone |
| **win-back** | win-back, winback, inactive, lapsed, haven't seen | Re-engage inactive | Email + SMS |
| **conquest** | conquest, competitor, switch, new customer | Steal competitor customers | Email + Direct Mail |
| **service** | service reminder, maintenance, oil change | Drive service visits | Email + SMS |
| **birthday** | birthday, anniversary, celebrate | Build loyalty with occasions | Email |
| **welcome** | welcome, onboarding, new customer, first purchase | Nurture new customers | Email series |
| **loyalty** | loyalty, VIP, rewards, points, tier | Reward best customers | Email |
| **promotional** | promo, sale, discount, offer, deal | Drive immediate sales | Email + SMS |
| **product-launch** | new product, launch, introducing, unveiling | Announce new offerings | Email + Social |
| **nurture** | nurture, educate, tips, how-to | Build relationships | Email series |
| **event** | event, webinar, workshop, open house | Drive attendance | Email + SMS |
| **feedback** | feedback, survey, review request | Gather insights | Email |
| **announcement** | announcement, news, update | Share information | Email |
| **review** | review request, testimonial, rating | Generate reviews | Email + SMS |

---

## The 5 Dimensions Framework

Every campaign query should be mapped across these dimensions:

### 1. **Audience** (WHO)

| Audience Type | Query Signals | Example |
|---------------|---------------|---------|
| **Existing** | "customers who...", "people who bought..." | "Customers who bought in 2024" |
| **New** | "new customers", "first-time", "just signed up" | "Welcome new customers" |
| **Inactive** | "haven't visited", "lapsed", "inactive 30+ days" | "Haven't serviced in 6 months" |
| **High-value** | "VIP", "top customers", "spent over $X" | "Customers who spent $5,000+" |
| **Segment** | "in [location]", "bought [product]", "[age] years old" | "Customers near Riverside" |
| **Trigger-based** | "left 5-star review", "birthday approaching" | "Just left 5-star review" |

**LLM Task:** Extract audience criteria → Check if audience exists → Create if needed (findOrCreate pattern)

### 2. **Content** (WHAT)

| Content Type | Query Signals | Extract |
|--------------|---------------|---------|
| **Offer** | "25% off", "$50 credit", "free oil change" | Specific discount/offer |
| **Tone** | "friendly", "urgent", "professional" | Emotional tone |
| **Message** | "thank you", "we miss you", "congratulations" | Core message |
| **CTA** | "book appointment", "shop now", "claim offer" | Desired action |

**LLM Task:** Extract instructions → Pass to content generator → Apply brand voice

### 3. **Channel** (WHERE)

| Channel | Query Signals | Notes |
|---------|---------------|-------|
| **Email** | "send email", "email campaign", default if not specified | Primary channel |
| **SMS** | "text", "SMS", "send message" | Short, urgent |
| **Social** | "post on Instagram/LinkedIn/Twitter" | Content, not campaign |
| **Multi-channel** | "email and SMS", "all channels" | Coordinate send |

**Rule:** Default to email unless specified. If "post on [social]" → Content, not campaign.

### 4. **Schedule** (WHEN)

| Schedule Type | Query Signals | Implementation |
|---------------|---------------|----------------|
| **Immediate** | "now", "today", "send immediately" | Queue for send after approval |
| **Scheduled** | "tomorrow", "next week", "January 25" | Set send date |
| **Trigger-based** | "when [event]", "after [action]" | Create automation |
| **Recurring** | "every week", "monthly", "quarterly" | Create automation with repeat |

**LLM Task:** Extract timing → Set schedule or create automation

### 5. **Objective** (WHY)

| Objective | Query Signals | Success Metric |
|-----------|---------------|----------------|
| **Drive sales** | "promo", "discount", "buy", "purchase" | Revenue, conversions |
| **Generate reviews** | "review", "feedback", "rating" | Review count |
| **Book appointments** | "schedule", "book", "appointment" | Bookings |
| **Re-engage** | "win-back", "inactive", "lapsed" | Reactivation rate |
| **Build loyalty** | "loyalty", "VIP", "thank you" | Retention, LTV |
| **Educate** | "tips", "how-to", "guide" | Engagement, opens |

**LLM Task:** Infer objective → Set appropriate metrics → Show predicted outcomes

---

## Query Parsing Rules

### Rule 1: Campaign vs. Content Detection

```typescript
function isCampaign(query: string): boolean {
  const campaignSignals = [
    /send (to|email|sms)/i,
    /customers? who/i,
    /target/i,
    /segment/i,
    /audience/i,
    /remind/i,
    /notify/i
  ];
  
  const contentSignals = [
    /post on/i,
    /create (instagram|linkedin|twitter|social)/i,
    /share on/i,
    /publish/i
  ];
  
  // Check content signals first (more specific)
  if (contentSignals.some(pattern => pattern.test(query))) {
    return false; // It's content
  }
  
  // Default to campaign if any campaign signals
  return campaignSignals.some(pattern => pattern.test(query));
}
```

### Rule 2: Campaign Type Inference

```typescript
function inferCampaignType(query: string): CampaignType {
  const typeMap = {
    referral: /refer|bring a friend/i,
    recovery: /recovery|complaint|negative|upset|apolog/i,
    'win-back': /win-?back|inactive|lapsed|haven't (seen|visited)/i,
    conquest: /conquest|competitor|switch/i,
    service: /service (reminder|due)|maintenance|oil change/i,
    birthday: /birthday|anniversary/i,
    welcome: /welcome|onboarding|new customer|first (purchase|visit)/i,
    loyalty: /loyalty|VIP|rewards?|points|tier/i,
    promotional: /promo|sale|discount|offer|deal/i,
    'product-launch': /new product|launch|introduc|unveil/i,
    nurture: /nurture|educat|tips|how-?to|guide/i,
    event: /event|webinar|workshop|open house/i,
    feedback: /feedback|survey/i,
    announcement: /announc|news|update/i,
    review: /review|testimonial|rating/i
  };
  
  for (const [type, pattern] of Object.entries(typeMap)) {
    if (pattern.test(query)) {
      return type as CampaignType;
    }
  }
  
  return 'promotional'; // Default
}
```

### Rule 3: Audience Extraction

```typescript
function extractAudience(query: string): AudienceSpec {
  // Pattern: "customers who [condition]"
  const whoMatch = query.match(/customers? who (.+?)(?:with|,|$)/i);
  
  if (whoMatch) {
    const condition = whoMatch[1];
    return {
      name: deriveAudienceName(condition),
      conditions: parseCondition(condition),
      isNew: !audienceExists(deriveAudienceName(condition))
    };
  }
  
  // Pattern: "[adjective] customers"
  const adjMatch = query.match(/(inactive|new|VIP|top|lapsed) customers?/i);
  if (adjMatch) {
    return {
      name: `${adjMatch[1]} Customers`,
      conditions: getPresetConditions(adjMatch[1]),
      isNew: false
    };
  }
  
  return { name: 'All Customers', conditions: {}, isNew: false };
}
```

### Rule 4: Offer Extraction

```typescript
function extractOffer(query: string): string | null {
  // Percentage discount
  const percentMatch = query.match(/(\d+)%\s*(off|discount)/i);
  if (percentMatch) {
    return `Include a ${percentMatch[1]}% discount offer`;
  }
  
  // Dollar amount
  const dollarMatch = query.match(/\$(\d+)\s*(credit|off|discount)/i);
  if (dollarMatch) {
    return `Include a $${dollarMatch[1]} ${dollarMatch[2]} offer`;
  }
  
  // Free item
  const freeMatch = query.match(/free (.+?)(?:with|for|$)/i);
  if (freeMatch) {
    return `Include free ${freeMatch[1]} offer`;
  }
  
  return null;
}
```

---

## Example Query Mappings

### Example 1: Clear Campaign
**Query:** "Send thank you email to customers who left 5-star reviews yesterday with 15% discount"

**Mapping:**
- **Type:** Campaign (has "send to customers")
- **Campaign Type:** referral
- **Audience:** "5-Star Reviewers (Yesterday)" [NEW]
  - Conditions: `{ rating: 5, reviewDate: 'yesterday' }`
- **Content:** "Thank you message" + "15% discount"
- **Channel:** Email
- **Schedule:** Immediate
- **Objective:** Drive loyalty + Generate referrals

### Example 2: Social Content (NOT Campaign)
**Query:** "Create Instagram post about new Nissan GT-R launch"

**Mapping:**
- **Type:** Content (has "create Instagram post")
- **Content Type:** Social - Instagram
- **Topic:** "New Nissan GT-R launch"
- **Action:** Create content → Save to library → Show preview

**DO NOT:** Create a campaign, select audience, or go through 3-gate approval

### Example 3: Ambiguous Query
**Query:** "Remind everyone about service"

**Mapping:**
- **Type:** Campaign (has "remind")
- **Campaign Type:** service
- **Audience:** "All Customers" (default)
- **Content:** "Service reminder"
- **Channel:** Email (default)
- **Schedule:** Immediate (default)
- **Clarification Needed:** 
  - "All customers or only those due for service?"
  - "Email only or include SMS?"

**LLM Response:** "I'll create a service reminder campaign for all customers via email. Would you like to target only customers who are due for service (e.g., last service > 6 months)?"

---

## Edge Cases to Handle

### 1. Multi-step Campaigns
**Query:** "Send welcome email, then tips after 3 days, then offer after 7 days"

**Action:** This is an automation (sequence), not a single campaign.
- Detect: "then", "after [time]", "followed by"
- Route to: Automations builder, not campaign builder

### 2. Broad Social Queries
**Query:** "Generate content for all channels for holiday sale"

**Action:** Multi-channel content generation
- Create: Email content, SMS content, Social content (Instagram, LinkedIn, Twitter)
- Show: All content in one view
- Allow: Select which to turn into campaigns

### 3. Vague Queries
**Query:** "Do something for customers"

**Action:** Ask clarifying questions
- "What would you like to do? (send email, create offer, remind about service, etc.)"
- "Which customers? (all, VIP, inactive, etc.)"

---

## LLM System Prompt Addition

Add this to your Claude system prompt:

```
You are TrustEye's campaign intelligence system. When a user describes a marketing action:

1. FIRST: Determine if it's a CAMPAIGN (targeted to audience) or CONTENT (brand engagement)
   - Campaigns: "send to customers", "remind", "target", "notify"
   - Content: "post on Instagram", "create LinkedIn post", "share on Twitter"

2. IF CAMPAIGN: Extract these dimensions:
   - Type: referral, recovery, win-back, conquest, service, birthday, welcome, loyalty, promotional, product-launch, nurture, event, feedback, announcement, review
   - Audience: WHO (create new if doesn't exist)
   - Content: WHAT (extract offers, tone, message)
   - Channel: WHERE (email default, SMS if urgent, never social for campaigns)
   - Schedule: WHEN (immediate default)
   - Objective: WHY (infer from type)

3. IF CONTENT: Route to content library
   - Don't create campaigns for social posts
   - Don't select audience for brand content
   - Store in library, don't send

4. IF AMBIGUOUS: Ask clarifying questions

5. ALWAYS: Show what you mapped and why ("I interpreted this as a [type] campaign targeting [audience]")
```

---

## Testing Queries for Demo

Test these queries to ensure robust handling:

| Query | Expected Type | Expected Campaign Type |
|-------|---------------|------------------------|
| "Send promo to VIP customers" | Campaign | promotional |
| "Post on Instagram about new service" | Content | - |
| "Remind inactive customers we miss them" | Campaign | win-back |
| "Create LinkedIn post about team" | Content | - |
| "Thank 5-star reviewers with discount" | Campaign | referral |
| "Tweet about service tips" | Content | - |
| "Email customers who bought in 2024" | Campaign | promotional or nurture |
| "Generate content for all channels for sale" | Multi-channel content | - |
| "Send birthday wishes" | Campaign | birthday |
| "Share on social about new hours" | Content | - |

---

## Implementation Files to Update

1. **`services/src/services/intentParser.ts`**
   - Add `isCampaign()` function
   - Add `inferCampaignType()` function
   - Add dimension extractors

2. **`services/src/services/toolResolver.ts`**
   - Route to campaign builder vs. content generator
   - Handle multi-channel requests

3. **`services/src/config/templates.ts`**
   - Add this taxonomy as reference data

---

*Use this taxonomy to handle ANY marketing query Birdeye throws at you.*
