# Narrative Composer Layer

**Purpose:** Convert structured domain signals into natural, human-readable kundli text that feels like it was written by an experienced jyotishi.

---

## What This Layer Does

1. **Transforms signals to text** - Converts structured data into flowing paragraphs
2. **One paragraph per domain** - Creates natural, cohesive narrative for each life area
3. **Integrates time patches** - Weaves year/month patches naturally into text
4. **Hides technical details** - No planet names, rule IDs, yoga names, or technical terms
5. **Calm, grounded tone** - Language that feels thoughtful and experienced

---

## Input Format

```json
{
  "domain": "career_direction",
  "summary_metrics": {
    "pressure": "high",
    "support": "medium",
    "stability": "low",
    "confidence": 0.7
  },
  "themes": ["responsibility", "delay", "skill_building"],
  "time_windows": {
    "years": [
      { "from": 2025, "to": 2027, "nature": "consolidation" }
    ],
    "months": [
      { "from": "2026-03", "to": "2026-07", "nature": "decision_sensitive" }
    ]
  },
  "rule_trace": { ... }
}
```

---

## Output Format

```json
{
  "domain": "career_direction",
  "text": "Your professional life is entering a phase where professional responsibilities may feel more pronounced and progress may appear slower than expected. This period encourages patience, discipline, and steady development rather than quick gains. Over the coming years, consistent effort and thoughtful planning can gradually strengthen your position. Particular care is advised during certain months when decisions made in haste may have longer-lasting consequences. Approaching this phase with maturity and focus can turn pressure into long-term stability.",
  "summary_metrics": { ... },
  "themes": [ ... ],
  "time_windows": { ... },
  "rule_trace": { ... }
}
```

---

## Paragraph Structure

Each paragraph follows this structure:

1. **Opening** - Overall tone of the phase
   - Describes the current state based on metrics
   - Uses domain-specific vocabulary

2. **Explanation** - Pressure/support balance
   - Explains what this phase encourages or requires
   - Provides context for the metrics

3. **Time Awareness** - Year and month patches
   - Year patches: "Over the coming years..."
   - Month patches: "Particular care is advised during certain months..."
   - Never mentions exact dates

4. **Closing** - Guidance and hope
   - Empowering message about approach
   - Emphasizes control and agency

---

## Writing Guidelines

### Tone Rules

✅ **MUST feel:**
- Calm and grounded
- Thoughtful and experienced
- Empowering and responsible
- Honest and balanced

❌ **MUST NOT feel:**
- AI-generated or robotic
- Bullet-point explanations
- Planet-by-planet reporting
- Dramatic or fear-based

### Language Rules

✅ **Allowed:**
- Domain-specific vocabulary (career, finances, relationships, health)
- Natural, flowing sentences
- Reassuring and honest language
- Time references without exact dates

❌ **Strictly Disallowed:**
- Planet names (Saturn, Jupiter, etc.)
- Rule IDs or technical identifiers
- Yoga names (Gaja Kesari, etc.)
- Technical astrology terms
- Predictions of death, loss, divorce, disaster
- Exact dates or specific months/years

---

## Design Philosophy

### Why Planets/Yogas Are Hidden

- **User focus**: Users care about life areas, not planetary mechanics
- **Trust building**: Technical terms can feel like jargon or manipulation
- **Natural language**: Real jyotishis explain effects, not mechanisms
- **Accessibility**: Makes kundli readable for non-astrologers

### Why Language Is Non-Fear-Based

- **Responsibility over fear**: Emphasizes control and agency
- **Honest guidance**: Acknowledges challenges without panic
- **Trust building**: Fear-based language erodes trust
- **Empowerment**: Users should feel capable, not helpless

### Why One Paragraph Per Domain

- **Cohesive narrative**: Flows like a real jyotishi's explanation
- **Not bullet points**: Avoids AI-generated feel
- **Complete thought**: Each domain gets full context
- **Natural reading**: Feels like a conversation, not a report

---

## Domain-Specific Vocabulary

Each domain has its own vocabulary:

- **money_finance**: "financial life", "resource-building", "financial planning"
- **career_direction**: "professional life", "career growth", "work responsibilities"
- **relationships**: "relationships", "partnerships", "social connections"
- **family_home**: "family and home life", "family dynamics", "home environment"
- **health_body**: "health and well-being", "physical well-being", "body care"
- **mental_state**: "mental and emotional well-being", "mental clarity", "inner state"
- **spiritual_growth**: "spiritual growth", "inner growth", "spiritual practices"
- **timing_luck**: "timing and opportunities", "timing patterns", "life timing"
- **events_changes**: "life changes and events", "life transitions", "changes"
- **self_identity**: "self-identity and personal growth", "personal development", "self-understanding"

---

## Time Patch Integration

### Year Patches

- Described as "over the coming years" or "over the coming year"
- Nature determines phrasing:
  - `consolidation` → "consistent effort and thoughtful planning can gradually strengthen your position"
  - `growth` → "opportunities for growth and development are more accessible"
  - `restructuring` → "this phase may require adjustments and reorganization"
  - `sensitive` → "this period requires careful attention and thoughtful decision-making"
  - `transition` → "this phase involves transitions that benefit from patient adaptation"

### Month Patches

- Described as "certain months" or "some months"
- Nature determines phrasing:
  - `decision_sensitive` → "decisions made in haste may have longer-lasting consequences"
  - `caution_required` → "extra caution and careful planning"
  - `supportive` → "more favorable conditions for important decisions and actions"
  - `volatile` → "more frequent changes, requiring flexibility and adaptability"

**Never mentions exact months or years explicitly.**

---

## Usage

```javascript
import { composeNarrative } from './services/narrativeComposer.js';

// Get domain signals with time patches
const domainSignals = await aggregateSignals(astroSnapshot);
const signalsWithPatches = applyTimePatches(domainSignals, timingData);

// Compose narratives
const narrativeBlocks = composeNarrative(signalsWithPatches);

// Each block contains:
// - domain: domain identifier
// - text: natural language paragraph
// - summary_metrics: preserved for reference
// - themes: preserved for reference
// - time_windows: preserved for reference
// - rule_trace: preserved for transparency (not in text)
```

---

## Engineering Constraints

- **Deterministic**: Same input → same paragraph
- **Template-based**: Reusable sentence patterns
- **No randomness**: No LLM generation or probabilistic text
- **Domain-specific**: Vocabulary and patterns per domain
- **Confidence threshold**: Only composes for domains with confidence ≥ 0.3

---

## What This Layer DOES NOT Do

❌ **NO planet names**
- Does not mention Saturn, Jupiter, Mars, etc.
- Effects are described, not planetary causes

❌ **NO technical terms**
- No yoga names, rule IDs, or astrology jargon
- Natural language only

❌ **NO fear-based predictions**
- No death, loss, divorce, disaster predictions
- Challenges are described responsibly

❌ **NO exact dates**
- Year/month ranges only
- "Over the coming years", not "2025-2027"

❌ **NO remedies**
- Remedies are integrated in a separate layer
- This layer focuses on situation description

---

## Example Output

### Input:
```json
{
  "domain": "career_direction",
  "summary_metrics": {
    "pressure": "high",
    "support": "medium",
    "stability": "low",
    "confidence": 0.7
  },
  "time_windows": {
    "years": [{ "from": 2025, "to": 2027, "nature": "consolidation" }],
    "months": [{ "from": "2026-03", "to": "2026-07", "nature": "decision_sensitive" }]
  }
}
```

### Output:
```
"Your professional life is entering a phase where professional responsibilities may feel more pronounced and progress may appear slower than expected. This period encourages patience, discipline, and steady development rather than quick gains. Over the coming years, consistent effort and thoughtful planning can gradually strengthen your position. Particular care is advised during certain months when decisions made in haste may have longer-lasting consequences. Approaching this phase with maturity and focus can turn pressure into long-term stability."
```

---

## Future Enhancements

- **Tone variation**: Subtle variations based on confidence levels
- **Theme integration**: Weave themes more naturally into text
- **Multi-paragraph support**: For complex domains with multiple time patches
- **Language localization**: Support for multiple languages

---

**Status:** Ready for use. Final layer before PDF-style kundli output.

