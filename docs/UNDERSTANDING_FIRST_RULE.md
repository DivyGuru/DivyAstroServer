# UNDERSTANDING-FIRST RULE (MANDATORY)

## Global Rule

**You must NOT write any English text unless you FIRST understand the meaning.**

## Process for Every Book Object

### STEP 1 — UNDERSTAND (Required Before Writing)

Before writing anything, you MUST:

1. **Identify affected life area(s)**
   - Career, relationships, health, finances, etc.
   - Can be multiple areas

2. **Identify nature of effect**
   - Supportive (positive influence)
   - Challenging (difficulties/obstacles)
   - Mixed (both supportive and challenging)

3. **Identify time scale**
   - Short-term (days/weeks)
   - Long-term (months/years)
   - Conditional (depends on other factors)

4. **Identify tone**
   - Guidance (helpful advice)
   - Warning (cautionary)
   - Neutral (informational)

5. **Decide confidence level**
   - High (very clear meaning)
   - Medium (mostly clear, some ambiguity)
   - Low (unclear, needs review)

**If you cannot confidently answer these, DO NOT proceed.**

### STEP 2 — REWRITE (Only After Understanding)

Only after understanding is confirmed:

1. **Rewrite meaning in calm, human English**
   - Natural, conversational tone
   - Like an experienced jyotishi explaining to a person

2. **Remove fear-based language**
   - No "death", "disease", "divorce", "loss"
   - No catastrophic predictions

3. **Remove absolute guarantees**
   - No "will", "must", "always", "never"
   - Use "may", "can", "tends to", "often"

4. **Remove astrology jargon**
   - Avoid technical Sanskrit terms
   - Explain in plain English

5. **Sound human and experienced**
   - Not robotic or template-based
   - Natural flow and phrasing

## Strict Prohibitions

❌ **Do NOT translate word-for-word**
- Understand meaning, then rewrite
- Not literal translation

❌ **Do NOT generate generic planet-house templates**
- Each meaning must be specific
- No "Planet X in House Y may influence..."

❌ **Do NOT guess meanings**
- If unclear, mark as REJECTED
- Better to have fewer, accurate rules

❌ **Do NOT store Hindi/Sanskrit text**
- Original text is reference only
- Never stored in database

## Failure Handling

### If Meaning is Unclear

Mark as:
- **REJECTED**: Cannot understand, discard
- **NEEDS_REVIEW**: Requires human review

**Do NOT:**
- Generate generic English
- Guess the meaning
- Use templates
- Proceed without understanding

## Understanding Metadata Structure

Every understood meaning MUST have:

```json
{
  "understanding_metadata": {
    "life_areas": ["career", "reputation"],
    "effect_nature": "supportive" | "challenging" | "mixed",
    "time_scale": "short" | "long" | "conditional",
    "tone": "guidance" | "warning" | "neutral",
    "confidence": "high" | "medium" | "low"
  }
}
```

## Validation Rules

1. **No English without understanding_metadata**
   - Reject if metadata missing
   - Understanding is mandatory

2. **No generic templates**
   - Each meaning must be specific
   - Based on actual understanding

3. **No fear language**
   - Validate before storing
   - Reject if found

4. **No absolute guarantees**
   - Validate language
   - Reject if found

## Implementation Status

### Current Implementation

- ✅ Understanding-first rule enforced
- ✅ Rejection logic for unclear meanings
- ✅ Validation for understanding metadata
- ⚠️ **Understanding service**: Needs implementation

### Required Implementation

**Understanding Service Options:**

1. **Translation API**
   - Google Translate API
   - DeepL API
   - Other translation services

2. **AI Understanding Service**
   - GPT-based understanding
   - Custom NLP models
   - Hybrid AI + human review

3. **Manual Review**
   - Human jyotishi review
   - Batch processing
   - Quality control

4. **Hybrid Approach**
   - AI for initial understanding
   - Human review for validation
   - Iterative improvement

## Example: Correct Flow

### ❌ WRONG (Without Understanding)

```javascript
// Generic template - INVALID
"JUPITER in the 1st house may influence areas related to self."
```

### ✅ CORRECT (With Understanding)

```javascript
// Step 1: Understand
{
  life_areas: ["personality", "learning", "social_respect"],
  effect_nature: "supportive",
  time_scale: "long",
  tone: "guidance",
  confidence: "high"
}

// Step 2: Rewrite (only after understanding)
"Jupiter in the first house can be associated with a stronger 
learning orientation and constructive guidance from mentors. 
This placement often brings supportive personal direction and 
may enhance social respect over time."
```

## Remember

**Understanding is mandatory.**
**English writing without understanding is INVALID.**

