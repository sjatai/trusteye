# Marketing Intelligence Engine - Unified Build

**Created:** January 23, 2026  
**Demo:** Friday, January 24, 2026  
**Status:** Ready to Build

---

## CORE PRINCIPLE

**One router, four modes:**

```
User query → Router → [RAG | Patch | Match | Create]
```

| Mode | When | Who Owns State |
|------|------|----------------|
| **RAG** | Question about TrustEye | N/A |
| **Patch** | Modifying active draft | UI owns, AI suggests |
| **Match** | Pattern exists (>0.85) | Use from Pinecone |
| **Create** | Explicit create, no match | Engine creates → saves |

---

## THE ROUTER

```typescript
// services/src/services/marketingEngine.ts

interface EngineContext {
  activeDraft?: {
    type: 'campaign' | 'audience' | 'content';
    fields: Record<string, any>;
  };
  brandId?: string;
  userId?: string;
}

interface EngineResponse {
  mode: 'rag' | 'patch' | 'match' | 'create' | 'clarify';
  data: any;
  message: string;
}

export async function handleMarketingIntent(
  query: string, 
  context: EngineContext
): Promise<EngineResponse> {
  
  // MODE 1: Is it a question?
  if (await isQuestion(query)) {
    const answer = await answerWithRAG(query);
    return {
      mode: 'rag',
      data: answer,
      message: answer.response
    };
  }
  
  // MODE 2: Is there an active draft to modify?
  if (context.activeDraft) {
    const patch = await generatePatch(query, context.activeDraft);
    return {
      mode: 'patch',
      data: patch,
      message: `${patch.action} ${patch.value} to ${patch.field}?`
    };
  }
  
  // MODE 3: Does a pattern match exist?
  const intentType = await classifyIntent(query);
  const match = await searchForMatch(query, intentType);
  
  if (match && match.score > 0.85) {
    return {
      mode: 'match',
      data: match.asset,
      message: `Found existing ${intentType}: "${match.asset.name}". Use it?`
    };
  }
  
  // MODE 4: Explicit create request?
  if (await isExplicitCreate(query)) {
    const asset = await createAsset(query, intentType, context);
    await saveToLearning(asset, query);
    return {
      mode: 'create',
      data: asset,
      message: `Created new ${intentType}. Saved for future use.`
    };
  }
  
  // FALLBACK: Clarify
  return {
    mode: 'clarify',
    data: null,
    message: `I'm not sure what you'd like. Do you want to:\n- Create a new ${intentType}?\n- Search for an existing one?\n- Modify something?`
  };
}
```

---

## MODE 1: RAG (Questions)

Already built. Uses Pinecone with 144 documents indexed.

```typescript
async function isQuestion(query: string): Promise<boolean> {
  const questionPatterns = [
    /^what (is|are|can|does)/i,
    /^how (do|does|is|can)/i,
    /^why (is|do|does)/i,
    /^tell me about/i,
    /^explain/i,
    /\?$/
  ];
  return questionPatterns.some(p => p.test(query));
}

async function answerWithRAG(query: string) {
  // Existing implementation in services/src/services/pinecone.ts
  const results = await knowledgeBase.queryContext(query, 5);
  // ... generate answer using Claude with context
}
```

**Test:**
```
User: "What can TrustEye do?"
→ Mode: RAG
→ Returns specific answer from indexed docs
```

---

## MODE 2: PATCH (Modify Active Draft)

**This is the key to not breaking existing flows.**

When user has a campaign open and says "add SMS", the engine:
1. Recognizes there's an active draft
2. Generates a **patch** (not a new object)
3. UI confirms and applies

```typescript
interface Patch {
  field: string;       // 'channels' | 'audience' | 'type' | 'schedule'
  action: 'set' | 'add' | 'remove';
  value: any;
  confidence: number;
}

async function generatePatch(
  query: string, 
  draft: EngineContext['activeDraft']
): Promise<Patch> {
  
  // Use Claude to understand what user wants to change
  const prompt = `
The user is editing a ${draft.type} with these current values:
${JSON.stringify(draft.fields, null, 2)}

The user said: "${query}"

What field do they want to change? Return JSON:
{
  "field": "the field name",
  "action": "set" | "add" | "remove",
  "value": "the new value",
  "confidence": 0.0 to 1.0
}

Only return JSON, nothing else.
`;

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }]
  });
  
  return JSON.parse(response.content[0].text);
}
```

**UI applies patch:**

```typescript
// In frontend
function applyPatch(draft: CampaignDraft, patch: Patch): CampaignDraft {
  const updated = { ...draft };
  
  switch (patch.action) {
    case 'set':
      updated.fields[patch.field] = patch.value;
      break;
    case 'add':
      if (Array.isArray(updated.fields[patch.field])) {
        updated.fields[patch.field] = [...updated.fields[patch.field], patch.value];
      }
      break;
    case 'remove':
      if (Array.isArray(updated.fields[patch.field])) {
        updated.fields[patch.field] = updated.fields[patch.field].filter(
          (v: any) => v !== patch.value
        );
      }
      break;
  }
  
  return updated;
}
```

**Test:**
```
Context: { activeDraft: { type: 'campaign', fields: { channels: ['email'] } } }
User: "add SMS"
→ Mode: patch
→ Patch: { field: 'channels', action: 'add', value: 'sms', confidence: 0.95 }
→ UI shows: "Add SMS to channels? [Apply] [Cancel]"
→ User clicks Apply → channels becomes ['email', 'sms']
```

---

## MODE 3: MATCH (Use Existing Pattern)

Search Pinecone for patterns that match the user's intent.

```typescript
async function searchForMatch(
  query: string, 
  intentType: string
): Promise<{ score: number; asset: any } | null> {
  
  const results = await pinecone.query({
    vector: await getEmbedding(query),
    filter: { type: intentType },
    topK: 3,
    includeMetadata: true
  });
  
  if (results.matches[0]?.score > 0.85) {
    return {
      score: results.matches[0].score,
      asset: results.matches[0].metadata
    };
  }
  
  return null;
}
```

**Test:**
```
User: "Find customers who left 5-star reviews"
→ Mode: match (pattern exists from seed data)
→ Returns: { name: "5-Star Reviewers", criteria: { rating: 5 }, count: 47 }
→ UI shows: "Found '5-Star Reviewers' (47 customers). Use it?"
```

---

## MODE 4: CREATE (New Asset)

Only triggers when:
1. No active draft (not modifying)
2. No match found (nothing exists)
3. Explicit create intent ("create", "make", "build", etc.)

```typescript
async function isExplicitCreate(query: string): Promise<boolean> {
  const createKeywords = [
    'create', 'make', 'build', 'generate', 'new',
    'set up', 'design', 'draft', 'write'
  ];
  return createKeywords.some(kw => query.toLowerCase().includes(kw));
}

async function createAsset(
  query: string, 
  intentType: string,
  context: EngineContext
): Promise<any> {
  
  switch (intentType) {
    case 'audience':
      return await createAudience(query, context);
    case 'content':
      return await createContent(query, context);
    case 'campaign':
      return await createCampaign(query, context);
    default:
      throw new Error(`Unknown type: ${intentType}`);
  }
}

async function saveToLearning(asset: any, originalQuery: string) {
  // Save to Pinecone so system learns
  await pinecone.upsert({
    id: `${asset.type}-${Date.now()}`,
    values: await getEmbedding(originalQuery),
    metadata: {
      ...asset,
      originalQuery,
      createdAt: new Date().toISOString(),
      source: 'auto-created'
    }
  });
  
  console.log(`💡 Learned new pattern: "${originalQuery}" → ${asset.type}`);
}
```

**Test:**
```
User: "Create an audience of customers who mentioned Mike in reviews"
→ Mode: create (no match, explicit create)
→ Creates: { type: 'audience', name: 'Mentioned Mike', criteria: { reviewContains: 'Mike' } }
→ Saves to Pinecone
→ Next time same query → Mode: match (instant)
```

---

## INTENT CLASSIFICATION

```typescript
async function classifyIntent(query: string): Promise<string> {
  // Fast keyword check first
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('audience') || queryLower.includes('customers who') || queryLower.includes('segment')) {
    return 'audience';
  }
  if (queryLower.includes('email') || queryLower.includes('content') || queryLower.includes('write')) {
    return 'content';
  }
  if (queryLower.includes('campaign') || queryLower.includes('send to') || queryLower.includes('launch')) {
    return 'campaign';
  }
  
  // Fall back to Claude for ambiguous cases
  const prompt = `
Classify this marketing request:
"${query}"

Return ONE word: audience | content | campaign | question | unknown
`;
  
  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 10,
    messages: [{ role: 'user', content: prompt }]
  });
  
  return response.content[0].text.trim().toLowerCase();
}
```

---

## API INTEGRATION

Update the chat endpoint to use the engine:

```typescript
// services/src/routes/ai.ts

import { handleMarketingIntent } from '../services/marketingEngine';

router.post('/chat', async (req, res) => {
  const { message, activeDraft, brandId, userId } = req.body;
  
  const context: EngineContext = {
    activeDraft: activeDraft || null,
    brandId: brandId || 'premier-nissan',
    userId
  };
  
  const result = await handleMarketingIntent(message, context);
  
  res.json({
    success: true,
    mode: result.mode,
    data: result.data,
    message: result.message
  });
});
```

---

## FRONTEND CHANGES

### Pass activeDraft to API

```typescript
// When user types in CommandBox while campaign is open
async function sendMessage(message: string) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      activeDraft: currentDraft ? {
        type: 'campaign',
        fields: {
          type: currentDraft.type,
          channels: currentDraft.channels,
          audience: currentDraft.audience,
          schedule: currentDraft.schedule
        }
      } : null
    })
  });
  
  const result = await response.json();
  
  // Handle based on mode
  if (result.mode === 'patch') {
    showPatchConfirmation(result.data, result.message);
  } else if (result.mode === 'match') {
    showMatchConfirmation(result.data, result.message);
  } else if (result.mode === 'create') {
    showCreatedAsset(result.data, result.message);
  } else {
    showMessage(result.message);
  }
}
```

### Show Patch Confirmation

```typescript
function showPatchConfirmation(patch: Patch, message: string) {
  // Show toast or modal
  toast({
    title: message,
    action: (
      <>
        <Button onClick={() => {
          const updated = applyPatch(currentDraft, patch);
          setCurrentDraft(updated);
          toast.dismiss();
        }}>
          Apply
        </Button>
        <Button variant="ghost" onClick={() => toast.dismiss()}>
          Cancel
        </Button>
      </>
    )
  });
}
```

---

## SEED DATA

Add these patterns to Pinecone (run once):

```typescript
// services/scripts/seedPatterns.ts

const patterns = [
  // Audience patterns
  {
    type: 'audience',
    name: '5-Star Reviewers',
    pattern: 'customers who left 5-star reviews',
    criteria: { rating: 5 },
    tags: ['reviews', 'loyalty', 'referral']
  },
  {
    type: 'audience',
    name: 'Lapsed Customers',
    pattern: 'customers who haven\'t visited in 90 days',
    criteria: { daysSinceVisit: 90 },
    tags: ['winback', 'churn']
  },
  {
    type: 'audience',
    name: 'Negative Reviewers',
    pattern: 'customers who left negative reviews',
    criteria: { rating: { $lte: 2 } },
    tags: ['recovery', 'service']
  },
  
  // Content patterns
  {
    type: 'content',
    name: 'Referral Email',
    pattern: 'referral email for happy customers',
    template: 'Thanks for your amazing review! Share your experience...',
    channel: 'email',
    tags: ['referral']
  },
  {
    type: 'content',
    name: 'Win-back Email',
    pattern: 'win-back email for inactive customers',
    template: 'We miss you! It\'s been a while since your last visit...',
    channel: 'email',
    tags: ['winback']
  },
  {
    type: 'content',
    name: 'Recovery Email',
    pattern: 'recovery email for unhappy customers',
    template: 'We\'re sorry to hear about your experience. Let us make it right...',
    channel: 'email',
    tags: ['recovery']
  },
  
  // Campaign patterns
  {
    type: 'campaign',
    name: 'Referral Campaign',
    pattern: 'referral campaign for 5-star reviewers',
    workflow: ['find reviewers', 'generate email', '3-gate', 'send'],
    tags: ['referral', 'automated']
  },
  {
    type: 'campaign',
    name: 'Recovery Campaign',
    pattern: 'recovery campaign for negative reviews',
    workflow: ['find negative', 'generate apology', '3-gate', 'send'],
    tags: ['recovery']
  }
];

async function seedPatterns() {
  for (const pattern of patterns) {
    await pinecone.upsert({
      id: `seed-${pattern.type}-${pattern.name.toLowerCase().replace(/\s/g, '-')}`,
      values: await getEmbedding(pattern.pattern),
      metadata: pattern
    });
  }
  console.log(`✅ Seeded ${patterns.length} patterns`);
}
```

---

## TASK LIST

| Task | Priority | Status |
|------|----------|--------|
| Create marketingEngine.ts with router | P0 | ⬜ |
| Add classifyIntent function | P0 | ⬜ |
| Add generatePatch function | P0 | ⬜ |
| Add searchForMatch function | P0 | ⬜ |
| Add createAsset functions | P1 | ⬜ |
| Add saveToLearning function | P1 | ⬜ |
| Update /api/ai/chat to use engine | P0 | ⬜ |
| Frontend: pass activeDraft | P0 | ⬜ |
| Frontend: show patch confirmation | P0 | ⬜ |
| Run seed script for patterns | P1 | ⬜ |
| Test all 4 modes | P0 | ⬜ |

---

## TEST SCENARIOS

### Test 1: RAG Mode
```
Input: "What can TrustEye do?"
Expected: mode=rag, detailed answer from knowledge base
```

### Test 2: Patch Mode
```
Context: activeDraft = { type: 'campaign', fields: { channels: ['email'] } }
Input: "add SMS"
Expected: mode=patch, data={ field: 'channels', action: 'add', value: 'sms' }
```

### Test 3: Match Mode
```
Input: "Find 5-star reviewers"
Expected: mode=match, data={ name: '5-Star Reviewers', criteria: { rating: 5 } }
```

### Test 4: Create Mode
```
Input: "Create audience of customers who mentioned Sarah"
Expected: mode=create, new audience created and saved to Pinecone
```

### Test 5: Learning Works
```
Run Test 4 twice
Second time: mode=match (not create) because pattern now exists
```

---

## SAFETY GATES

1. **Existing handlers win** - Check tools-registry first
2. **High threshold for match** - 0.85+ score required
3. **Explicit create only** - Must have create keyword
4. **UI confirms patches** - Never apply silently
5. **Clarify on ambiguity** - Ask rather than guess

---

**Ready to build. This won't break existing flows.**
