# TrustEye Demo Script

**Demo Date:** Friday, January 24, 2026
**Duration:** 30-45 minutes
**Presenter:** SJ

---

## Pre-Demo Setup

### Start Services
```bash
# Terminal 1: Backend
cd /Users/sj/dev/kq-studio/services && npm run dev

# Terminal 2: Frontend
cd /Users/sj/dev/kq-studio && npm run dev

# Terminal 3: Demo Site
cd /Users/sj/dev/kq-studio/demo-site && npm run dev
```

### Open These Windows
1. **TrustEye Studio:** http://localhost:5173
2. **Demo Site:** http://localhost:3000 (keep visible for live updates)
3. **Slack:** Keep open for approval notifications

### Reset State (if needed)
- Clear any existing campaigns from previous demos
- Refresh both browser windows

---

## Opening (2 min)

> "Today I'm going to show you TrustEye - an AI-powered marketing platform with a unique Trust Layer that ensures every piece of content is compliant, on-brand, and human-approved before it reaches customers."

> "What makes TrustEye different is our 3-Gate Approval System. Every campaign passes through:
> 1. **Gate 1: Rules Validation** - Automated compliance checks
> 2. **Gate 2: AI Review** - Brand alignment scoring
> 3. **Gate 3: Human Approval** - Final sign-off via Slack"

> "Let me show you how it works..."

---

## Demo Flow

### 1. AI Suggestions Badge (2 min)

**What to show:** The proactive AI that identifies opportunities

**Steps:**
1. Point to the badge showing "3 AI Suggestions" in the nav
2. Click on it to expand

**Say:**
> "TrustEye proactively analyzes your customer data. Right now it's found 3 opportunities - let's look at this one about recent 5-star reviews."

**Click:** "12 customers left 5-star reviews this week"

> "The AI has identified customers who just left great reviews - perfect candidates for a referral program or loyalty reward."

---

### 2. Campaign 1: Review Response Email (5 min)

**What to show:** Full campaign creation with 3-gate approval

**Type in Command Box:**
```
create email campaign for customers who left 5-star reviews, thank them and offer 15% referral bonus
```

**Wait for generation, then say:**
> "Watch the right panel - TrustEye is generating brand-aligned content. You can see the Brand Score updating in real-time. Our AI has been trained on your brand voice and guidelines."

**Point out:**
- Brand Score (should be 85%+)
- Email preview with subject line
- The generated content matches brand tone

**Type:**
```
review
```

**Say:**
> "Now let's run this through our Trust Layer. Watch the 3-Gate system..."

**Point out as gates process:**
- Gate 1: Rules checking (no profanity, compliant language)
- Gate 2: AI reviewing brand alignment
- Gate 3: Awaiting human approval

> "Gate 3 requires human approval. Check Slack..."

**Show Slack notification, click Approve**

> "Once approved, the campaign is ready to execute. This audit trail is stored - we have a complete compliance receipt."

**Type:**
```
execute
```

**Show the email being sent confirmation**

---

### 3. Campaign 2: Multi-Channel Campaign (5 min)

**What to show:** Same campaign across Email + SMS + Website Banner

**Type in Command Box:**
```
create campaign for weekend flash sale 20% off, send via email, sms, and website banner
```

**Say:**
> "TrustEye supports multi-channel campaigns. One command creates coordinated content across all channels."

**Point out:**
- Email version with full details
- SMS version (concise, character-limited)
- Website banner (visual, CTA-focused)

**Type:**
```
review and launch
```

**After approval, say:**
> "Let's see this live on the website..."

**Switch to Demo Site tab** - Show the banner appearing

> "Real-time deployment. The banner is now live on your site, and emails/SMS are queued."

---

### 4. Campaign 3: Instagram Post (3 min)

**What to show:** Social media content with hashtags and visual guidance

**Type:**
```
create instagram post announcing new summer collection with lifestyle imagery
```

**Point out:**
- Post copy with emojis and brand voice
- Suggested hashtags
- Image guidance for the creative team

**Type:**
```
save to library
```

> "Content can be saved to the library for future use or scheduled posting."

---

### 5. Campaign 4: Win-Back SMS (3 min)

**What to show:** Targeted re-engagement campaign

**Type:**
```
create sms campaign for customers who haven't purchased in 90 days, offer free shipping on next order
```

**Point out:**
- SMS character count
- Urgency language
- Clear CTA

**Run through gates and execute**

---

### 6. Content Creation (3 min)

**Navigate to:** Content Library tab

**Say:**
> "The Content Library stores all your brand assets and generated content. Let's create some standalone content."

**Type:**
```
write 3 email subject lines for black friday sale
```

**Point out:**
- Multiple variations generated
- Can save favorites to library
- Brand tone consistency

**Type:**
```
create product description for wireless earbuds, premium and sophisticated tone
```

> "Any content type can be generated and stored for later use in campaigns."

---

### 7. Audience Building (3 min)

**Navigate to:** Audiences tab

**Say:**
> "Audiences are the foundation of targeted marketing. Let's create a smart segment."

**Type:**
```
create audience of high-value customers who spent over $500 in last 6 months
```

**Point out:**
- Audience criteria being set
- Estimated size
- Can be used in future campaigns

**Type:**
```
create audience of customers in California who bought electronics
```

> "Audiences can combine behavioral, geographic, and purchase data."

---

### 8. Automation Building (3 min)

**Navigate to:** Automations tab

**Say:**
> "Automations run 24/7, responding to customer behavior in real-time."

**Type:**
```
create automation: when customer abandons cart, wait 2 hours, send reminder email with 10% discount
```

**Point out:**
- Trigger condition
- Wait step
- Action (email)
- Visual workflow display

**Type:**
```
create automation: when customer makes first purchase, send welcome email immediately, then after 7 days send product recommendations
```

> "Multi-step automations nurture customers through their journey."

---

### 9. Generic Commands Demo (2 min)

**Navigate back to:** AI Studio tab

**Show these quick commands:**

```
what campaigns are running right now?
```
> "Natural language queries about your marketing state."

```
show me top performing campaigns this month
```
> "Instant analytics access."

```
pause the flash sale campaign
```
> "Quick actions without leaving the command center."

```
what's our brand tone?
```
> "The AI knows your brand guidelines."

---

### 10. Trust Layer Violation Demo (3 min)

**What to show:** The guardrails actually work

**Type:**
```
create email with subject "You'd be CRAZY not to buy this!!!"
```

**Say:**
> "Let me show you what happens when content doesn't meet our standards..."

**Run review**

**Point out Gate 1 or Gate 2 failing:**
> "The Trust Layer caught that the language is too aggressive and doesn't match brand voice. This would never reach customers."

**Type:**
```
make it more professional and on-brand
```

> "TrustEye suggests corrections while maintaining your intent."

---

### 11. Compliance Receipt (2 min)

**Navigate to:** A completed campaign in Inspector panel

**Say:**
> "Every approved campaign has a full compliance receipt - who approved it, when, what checks passed. This is your audit trail for regulatory compliance."

**Point out:**
- Gate results
- Approver name and timestamp
- Brand score
- All checks passed

---

## Closing (2 min)

> "What you've seen today is marketing that's fast, intelligent, and trustworthy. TrustEye gives your team AI superpowers while ensuring nothing goes out without proper oversight."

> "The Trust Layer is our moat - it's what makes AI marketing safe for enterprise use."

**Questions?**

---

## What Works on Demo Site

| Feature | Status | Notes |
|---------|--------|-------|
| Website Banner Display | ✅ Works | Real-time updates via API |
| Banner Content Changes | ✅ Works | Headline, body, CTA update |
| Banner Visibility Toggle | ✅ Works | Can show/hide banner |
| Loyalty Banner | ✅ Works | Shows reward points |
| Toast Notifications | ✅ Works | Appears when campaign executes |

---

## What Doesn't Work (Demo Limitations)

| Feature | Status | Workaround |
|---------|--------|------------|
| Actual Email Delivery | ⚠️ Limited | Emails send to TEST_EMAIL only |
| SMS Delivery | ❌ Mock | Shows success but no real SMS |
| Instagram Posting | ❌ Mock | Content generated but not posted |
| Real Customer Data | ❌ Mock | Using synthetic data for demo |
| Birdeye Live Sync | ⚠️ Limited | API connected but demo uses cached data |
| Analytics Charts | ⚠️ Static | Real data structure, mock values |

---

## Future Roadmap (What's Coming)

### Q1 2026
- **Real SMS Integration** - Twilio integration for actual SMS delivery
- **Instagram API** - Direct posting to Instagram Business
- **Advanced Analytics** - Real-time dashboards with live data
- **A/B Testing** - Built-in variant testing for campaigns

### Q2 2026
- **Multi-Brand Support** - Manage multiple brands from one account
- **Custom Guardrails** - Define your own compliance rules
- **Approval Workflows** - Multi-level approval chains
- **Calendar View** - Visual campaign scheduling

### Q3 2026
- **WhatsApp Integration** - Business messaging channel
- **AI Image Generation** - Generate campaign visuals with AI
- **Predictive Analytics** - AI-powered performance forecasting
- **Customer Journey Builder** - Visual cross-channel journeys

### Beyond
- **Self-Serve Onboarding** - Automated brand training
- **Partner Integrations** - Salesforce, HubSpot, Shopify
- **Mobile App** - Approve campaigns on the go
- **Enterprise SSO** - SAML/OIDC authentication

---

## Demo Recovery Scenarios

### If AI doesn't respond:
> "Let me refresh the connection..." (Refresh page)

### If gate fails unexpectedly:
> "This is actually the Trust Layer working - let me adjust the content..."

### If Slack notification doesn't appear:
> "The notification may take a moment..." (Check webhook, or manually approve in UI)

### If demo site doesn't update:
> "Let me trigger a refresh..." (Refresh demo site tab)

---

## Key Talking Points

1. **Trust Layer is the differentiator** - No other platform has 3-gate human-in-the-loop approval
2. **AI + Human oversight** - Best of both worlds
3. **Compliance built-in** - Audit trail for regulated industries
4. **Brand safety guaranteed** - Nothing off-brand reaches customers
5. **Speed without sacrifice** - Fast content creation, careful review

---

## Technical Specs (If Asked)

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express
- **AI:** Claude (Anthropic) for content generation
- **Database:** Supabase (PostgreSQL)
- **Vector Search:** Pinecone for brand knowledge
- **Notifications:** Slack Webhooks + Resend (email)
- **Integrations:** Birdeye (reviews), extensible architecture

---

## Contact

**Demo issues:** Check services terminal for errors
**Questions:** sj@trusteye.com

---

*Last updated: January 23, 2026*
