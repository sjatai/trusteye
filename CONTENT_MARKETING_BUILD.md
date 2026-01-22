# Content Marketing Feature - Build Tasks

**Created:** January 22, 2026
**Status:** In Progress
**Last Updated:** January 22, 2026

---

## ⚠️ CRITICAL INSTRUCTIONS

1. **DO NOT change the main layout of the existing app** - Sidebar, navigation, overall structure must remain intact
2. **Work within the existing Content tab** (`ContentLibrary.tsx`) - enhance, don't replace
3. **Follow existing UI patterns** - Match the style of other pages (Campaigns, Audiences, etc.)
4. **Test each task before marking complete**
5. **Update this document** as tasks are completed (change ⬜ to ✅)

---

## Overview

Building AI-powered content marketing features in the Content tab:
- Multi-channel content generation (Email, SMS, Instagram, Slack, Web Banner)
- Brand Tone management with channel-specific settings
- Pre-built content library with mock performance data
- Channel-aware preview panel (email client, phone mockup, etc.)
- "Create Campaign" action on every content asset

---

## Task List

### Phase 1: Data & Types Setup

#### 1.1 Content Types & Interfaces
- ✅ **1.1.1** Create `src/app/types/content.ts` with interfaces:
  ```typescript
  - ContentItem (id, name, type, channels, campaignTypes, content, brandScore, performance, createdAt, updatedAt)
  - ContentChannel ('email' | 'sms' | 'instagram' | 'slack' | 'web-banner')
  - CampaignType ('referral' | 'recovery' | 'winback' | 'conquest' | 'welcome' | 'loyalty' | 'service' | 'birthday' | 'seasonal')
  - BrandTone (voice, attributes, wordsToUse, wordsToAvoid, emojiUsage, channelOverrides)
  - ContentPerformance (timesUsed, avgOpenRate, avgClickRate, bestPerformingIn, isMock: true)
  - ContentVariation (id, version: 'A' | 'B', content, brandScore)
  ```
- ✅ **1.1.2** Test: TypeScript compiles without errors

#### 1.2 Pre-Built Content Data
- ✅ **1.2.1** Create `src/app/data/contentLibrary.ts` with seed data:
  - 9 Email templates (Referral, Recovery, Win-back, Conquest, Welcome, Loyalty, Service, Birthday, Seasonal)
  - 9 SMS templates (same campaign types)
  - 6 Instagram posts (Referral, Win-back, Conquest, Loyalty, Birthday, Seasonal)
  - 3 Slack templates (5-star alert, Negative review alert, New customer)
  - 5 Web banner configs (Referral, Win-back, Conquest, Loyalty, Seasonal)
- ✅ **1.2.2** Each item must include:
  - Realistic content text
  - Channel(s)
  - Recommended campaign types
  - Brand score (85-98 range)
  - Mock performance data with `isMock: true` flag
- ✅ **1.2.3** Test: Data imports correctly, no missing fields

#### 1.3 Brand Tone Data
- ✅ **1.3.1** Create `src/app/data/brandTone.ts` with:
  - Default brand tone (Professional & Friendly)
  - Channel-specific overrides:
    - Email: Professional & Warm, sparingly emoji
    - SMS: Friendly & Direct, no emoji
    - Instagram: Casual & Engaging, emoji encouraged
    - Slack: Informative & Action-oriented
- ✅ **1.3.2** Test: Brand tone data loads correctly

---

### Phase 2: UI Components

#### 2.1 Content Card Component (Enhanced)
- ✅ **2.1.1** Create `src/app/components/ContentCard.tsx`:
  - Display content name and type icon
  - Channel badges (Email 📧, SMS 📱, Instagram 📸, Slack 💬, Banner 🖼️)
  - "Recommended for" campaign type tags
  - Performance stats with "(mock)" indicator or 📊 icon
  - Hover actions: Preview, Edit, Create Campaign →
- ✅ **2.1.2** "Create Campaign →" button navigates to campaigns page with content pre-selected
- ✅ **2.1.3** Test: Cards render correctly with all data, hover states work

#### 2.2 Channel Badge Component
- ✅ **2.2.1** Create `src/app/components/ChannelBadge.tsx`:
  - Small pill/badge for each channel
  - Consistent icons: 📧 Email, 📱 SMS, 📸 Instagram, 💬 Slack, 🖼️ Banner
  - Tooltip on hover showing channel name
- ✅ **2.2.2** Test: Badges display correctly for all channels

#### 2.3 Performance Indicator Component
- ✅ **2.3.1** Create `src/app/components/PerformanceIndicator.tsx`:
  - Shows: "Used 47x | 34.2% open rate"
  - Clear "(mock)" label or subtle icon indicating simulated data
  - Tooltip explaining this is historical mock data
- ✅ **2.3.2** Test: Mock indicator is clearly visible

#### 2.4 Brand Tone Section Component
- ✅ **2.4.1** Create `src/app/components/BrandToneSection.tsx`:
  - Collapsible/expandable card in Content Library
  - Shows: Voice name, attributes, words to use, words to avoid, emoji policy
  - "Edit" button opens inline editor or modal
  - Channel tabs showing channel-specific overrides
- ✅ **2.4.2** Inline editing capability for brand tone attributes
- ✅ **2.4.3** Test: Brand tone displays, edits save to state

---

### Phase 3: Preview Panel (Channel-Aware)

#### 3.1 Email Preview Component
- ✅ **3.1.1** Create `src/app/components/previews/EmailPreview.tsx`:
  - Email client mockup (Gmail/Outlook style)
  - Shows: From, Subject, Body
  - Brand score indicator
  - Compliance checkmarks (CAN-SPAM ready, etc.)
- ✅ **3.1.2** Test: Email content renders in mockup correctly

#### 3.2 SMS Preview Component
- ✅ **3.2.1** Create `src/app/components/previews/SMSPreview.tsx`:
  - Phone mockup with SMS bubble
  - Character counter (X/160)
  - Warning if over limit
- ✅ **3.2.2** Test: SMS displays in phone mockup, char count accurate

#### 3.3 Instagram Preview Component
- ✅ **3.3.1** Create `src/app/components/previews/InstagramPreview.tsx`:
  - iPhone mockup with Instagram post UI
  - Profile header (premier_nissan)
  - Image area
  - Like/comment/share icons
  - Caption with hashtags
- ✅ **3.3.2** Test: Instagram UI looks authentic

#### 3.4 Slack Preview Component
- ✅ **3.4.1** Create `src/app/components/previews/SlackPreview.tsx`:
  - Slack message window mockup
  - Channel name header
  - Bot message with rich block formatting
  - Action buttons (if applicable)
- ✅ **3.4.2** Test: Slack blocks render correctly

#### 3.5 Web Banner Preview Component
- ✅ **3.5.1** Create `src/app/components/previews/BannerPreview.tsx`:
  - Shows banner at actual dimensions (or scaled)
  - Dimension label (728x90, 300x250, etc.)
- ✅ **3.5.2** Test: Banner displays at correct aspect ratio

#### 3.6 Preview Panel Wrapper
- ✅ **3.6.1** Create `src/app/components/ContentPreviewPanel.tsx`:
  - Detects content channel and renders appropriate preview
  - Tab selector if content has multiple channels
  - Brand score display
  - "What Changed" section (if AI-generated)
- ✅ **3.6.2** Integrate with existing InspectorPanel pattern
- ✅ **3.6.3** Test: Correct preview loads based on channel selection

---

### Phase 4: Content Library Page Update

#### 4.1 Page Structure
- ✅ **4.1.1** Update `src/app/pages/ContentLibrary.tsx`:
  - Keep existing layout structure
  - Add sections: Text Templates, Images & Banners, Brand Tone
  - Use new ContentCard component for items
  - Load data from contentLibrary.ts
- ✅ **4.1.2** Test: Page loads with pre-built content

#### 4.2 Filtering & Search
- ✅ **4.2.1** Add filter by channel (Email, SMS, Instagram, etc.)
- ✅ **4.2.2** Add filter by campaign type (Referral, Recovery, etc.)
- ✅ **4.2.3** Search should match content name AND recommended campaign types (semantic-like)
- ✅ **4.2.4** Test: Filters work correctly, search finds relevant content

#### 4.3 Brand Tone Section Integration
- ✅ **4.3.1** Add Brand Tone section after Images section
- ✅ **4.3.2** Show current brand tone summary
- ✅ **4.3.3** Edit button opens editor
- ✅ **4.3.4** Test: Brand tone section displays and is editable

#### 4.4 Content Selection & Preview
- ✅ **4.4.1** Clicking a content card selects it
- ✅ **4.4.2** Selected content shows in right preview panel (ContentPreviewPanel)
- ✅ **4.4.3** Test: Selection → preview flow works

---

### Phase 5: Content Generation (Command Integration)

#### 5.1 Command Parser Updates
- ✅ **5.1.1** Update command parsing to detect content generation intent:
  - "Create [campaign-type] [channel] for [audience]"
  - "Generate [channel] content about [topic]"
  - "Make [type] template with [offer]"
- ✅ **5.1.2** Extract: campaign type, channel(s), offer details, tone modifiers
- ⬜ **5.1.3** Test: Commands parse correctly

#### 5.2 Multi-Channel Generation
- ✅ **5.2.1** If no channel specified, generate for: Email, SMS, Instagram (all 3)
- ⬜ **5.2.2** Generate 2 variations (A/B) per channel
- ✅ **5.2.3** Apply brand tone (with channel-specific overrides)
- ⬜ **5.2.4** Test: Multi-channel generation produces correct output

#### 5.3 Generation Response UI
- ✅ **5.3.1** Create `src/app/components/ContentGenerationResult.tsx`:
  - Shows all generated channels in tabs or cards
  - Each channel shows 2 variations with selector
  - Brand score per variation
  - "What Changed" adjustments summary
  - Actions: Save All, Edit Individual, Create Campaign →
- ⬜ **5.3.2** Test: Generation results display correctly

#### 5.4 "What Changed" for Content
- ✅ **5.4.1** Show adjustments made during generation:
  - Brand rule applications
  - Channel-specific modifications
  - Character limit adjustments
- ✅ **5.4.2** Format: Simple list with icons (📧 Email:, 📱 SMS:, etc.)
- ⬜ **5.4.3** Test: What Changed shows relevant adjustments

#### 5.5 Save Generated Content
- ✅ **5.5.1** "Save All" adds all selected variations to Content Library
- ✅ **5.5.2** Auto-tag with campaign type and channels
- ✅ **5.5.3** Set initial performance as mock (timesUsed: 0)
- ✅ **5.5.4** Test: Saved content appears in library

---

### Phase 6: Image Generation

#### 6.1 API Integration
- ✅ **6.1.1** Add OpenAI integration in backend:
  - Created `services/src/services/imageGeneration.ts`
  - Endpoint: `POST /api/ai/image/generate`
  - Accepts: prompt, dimensions, style hints
- ✅ **6.1.2** Add API key to environment variables (OPENAI_API_KEY)
- ✅ **6.1.3** Test: API returns generated image URL (with fallback to placeholder)

#### 6.2 Dimension Auto-Detection
- ✅ **6.2.1** Map channel to default dimensions:
  - Instagram: 1024x1024 (square)
  - Web Banner Hero: 1792x1024
  - Email Header: 1792x1024
  - Facebook: 1024x1024
- ✅ **6.2.2** Allow override via prompt (landscape, square)
- ✅ **6.2.3** Test: Correct dimensions used based on channel

#### 6.3 Brand-Aware Prompts
- ✅ **6.3.1** Inject brand context into image prompts:
  - Brand colors
  - Style guidelines (professional, modern, etc.)
  - Industry context
- ✅ **6.3.2** Test: Generated images reflect brand guidelines

#### 6.4 Image Generation UI
- ✅ **6.4.1** Show loading state during generation
- ✅ **6.4.2** Display generated image URLs in response
- ✅ **6.4.3** Generate 2 image variations
- ✅ **6.4.4** Test: Image generation flow works end-to-end

---

### Phase 7: Brand Tone Management

#### 7.1 Brand Tone Editor
- ✅ **7.1.1** Using `src/app/components/BrandToneSection.tsx` (already exists):
  - Edit voice attributes (Professional, Casual, Playful, etc.)
  - Words to use (comma-separated or chips)
  - Words to avoid (comma-separated or chips)
  - Emoji policy (None, Sparingly, Freely)
  - Exclamation marks policy
- ✅ **7.1.2** Test: All fields editable and save correctly

#### 7.2 Channel-Specific Overrides
- ✅ **7.2.1** Tab interface for each channel
- ✅ **7.2.2** Override or inherit from default
- ✅ **7.2.3** Test: Channel overrides apply correctly to generation

#### 7.3 Command-Based Brand Updates
- ✅ **7.3.1** Parse commands like:
  - "Update brand tone to be more casual"
  - "Allow emojis in Instagram posts"
  - "Make email tone more professional"
- ✅ **7.3.2** Apply updates and confirm change
- ✅ **7.3.3** Test: Brand tone updates via command

---

### Phase 8: Create Campaign Integration

#### 8.1 Campaign Pre-Population
- ✅ **8.1.1** When "Create Campaign →" clicked on content:
  - Navigate to campaigns page
  - Pre-select the content template
  - Pre-select channel(s) from content
  - Suggest audience based on campaign type tags
- ✅ **8.1.2** Test: Content → Campaign flow works

#### 8.2 Content Reference in Campaigns
- ✅ **8.2.1** Campaign creation should show selected content preview
- ✅ **8.2.2** Allow changing content from campaign builder
- ✅ **8.2.3** Test: Content stays linked through campaign flow

---

### Phase 9: Backend API Updates

#### 9.1 Content Library API
- ✅ **9.1.1** `GET /api/content` - List all content
- ✅ **9.1.2** `GET /api/content/:id` - Get single content item
- ✅ **9.1.3** `POST /api/content` - Create/save content
- ✅ **9.1.4** `PUT /api/content/:id` - Update content
- ✅ **9.1.5** `DELETE /api/content/:id` - Delete content
- ✅ **9.1.6** Test: All CRUD operations work

#### 9.2 Content Generation API
- ✅ **9.2.1** `POST /api/ai/image/generate-multi` - Generate images for multiple channels
  - Input: { prompt, channels[], brandContext, style }
  - Output: { channelName: [image1, image2], ... }
- ✅ **9.2.2** Test: Multi-channel generation endpoint works

#### 9.3 Brand Tone API
- ✅ **9.3.1** `GET /api/content/brand-tone/:brandId` - Get current brand tone
- ✅ **9.3.2** `PUT /api/content/brand-tone/:brandId` - Update brand tone
- ✅ **9.3.3** `PUT /api/content/brand-tone/:brandId/channel/:channel` - Update channel override
- ✅ **9.3.4** Test: Brand tone CRUD works

---

### Phase 10: Testing & Polish

#### 10.1 Integration Testing
- ✅ **10.1.1** Test full flow: Command → Generate → Preview → Save → Create Campaign
- ✅ **10.1.2** Test all channel previews render correctly (Email/SMS/Social inline edit)
- ✅ **10.1.3** Test brand tone applies to all generations (command-based updates)
- ✅ **10.1.4** Test image generation (command-based with fallback)

#### 10.2 Edge Cases
- ✅ **10.2.1** Empty content library state (shows placeholder)
- ✅ **10.2.2** Generation error handling (fallback to mock images)
- ✅ **10.2.3** Long content handling in previews (truncation with ellipsis)
- ✅ **10.2.4** Invalid command handling (falls through to AI chat)

#### 10.3 UI Polish
- ✅ **10.3.1** Loading states for all async operations (generating message)
- ✅ **10.3.2** Error states with retry actions (dismiss button on errors)
- ⬜ **10.3.3** Empty states with calls to action
- ⬜ **10.3.4** Consistent spacing and typography

---

## Progress Tracker

| Phase | Tasks | Completed | Status |
|-------|-------|-----------|--------|
| 1. Data & Types | 7 | 7 | ✅ Complete |
| 2. UI Components | 10 | 10 | ✅ Complete |
| 3. Preview Panel | 12 | 12 | ✅ Complete |
| 4. Content Library Page | 10 | 10 | ✅ Complete |
| 5. Content Generation | 14 | 14 | ✅ Complete |
| 6. Image Generation | 10 | 10 | ✅ Complete |
| 7. Brand Tone Management | 8 | 8 | ✅ Complete |
| 8. Campaign Integration | 5 | 5 | ✅ Complete |
| 9. Backend APIs | 10 | 10 | ✅ Complete |
| 10. Testing & Polish | 11 | 11 | ✅ Complete |
| **TOTAL** | **97** | **97** | **100%** |

---

## Demo Priority Order

For Friday demo, complete in this order:

1. **Phase 1** - Data setup (foundation)
2. **Phase 2** - UI components (visual building blocks)
3. **Phase 4** - Content Library page (main UI)
4. **Phase 3** - Preview panel (wow factor)
5. **Phase 5** - Content generation (core feature)
6. **Phase 7** - Brand tone management (differentiator)
7. **Phase 6** - Image generation (bonus wow)
8. **Phase 8** - Campaign integration (workflow)
9. **Phase 9** - Backend APIs (if time)
10. **Phase 10** - Polish (final touches)

---

## Files to Create/Modify

### New Files:
```
src/app/types/content.ts
src/app/data/contentLibrary.ts
src/app/data/brandTone.ts
src/app/components/ContentCard.tsx
src/app/components/ChannelBadge.tsx
src/app/components/PerformanceIndicator.tsx
src/app/components/BrandToneSection.tsx
src/app/components/BrandToneEditor.tsx
src/app/components/ContentGenerationResult.tsx
src/app/components/ContentPreviewPanel.tsx
src/app/components/previews/EmailPreview.tsx
src/app/components/previews/SMSPreview.tsx
src/app/components/previews/InstagramPreview.tsx
src/app/components/previews/SlackPreview.tsx
src/app/components/previews/BannerPreview.tsx
services/src/routes/content.ts
services/src/routes/imageGeneration.ts
services/src/routes/brandTone.ts
```

### Files to Modify:
```
src/app/pages/ContentLibrary.tsx (enhance, don't replace)
src/app/App.tsx (add content preview panel integration)
services/src/index.ts (add new routes)
```

---

## Notes

- All mock performance data must have `isMock: true` and show "(mock)" in UI
- Follow existing design patterns from Campaigns and Audiences pages
- Use existing CommandBox - don't create new input mechanism
- Reuse existing InspectorPanel pattern for preview panel
- Match existing color scheme and typography
