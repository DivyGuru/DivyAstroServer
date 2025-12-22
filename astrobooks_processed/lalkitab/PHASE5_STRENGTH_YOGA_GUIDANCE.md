# PHASE 5: Strength & Yoga (Combination) Layer - Guidance

**Date:** 2025-12-21  
**Purpose:** Define HOW STRONG or EFFECTIVE existing Planet × House effects are, and how MULTI-PLANET COMBINATIONS create synergy

---

## Core Purpose

This phase answers TWO questions:

1. **How STRONG or WEAK is an existing base effect?**
   - Exaltation, Debilitation, Own Sign, Retrograde
   - Functional strength or weakness (book-explicit)

2. **Do MULTI-PLANET COMBINATIONS create SYNERGY?**
   - Named yogas (Gaja Kesari, Raja Yoga, etc.)
   - Multi-planet combinations that modify existing effects

This phase modifies:
- ✅ INTENSITY
- ✅ EFFECTIVENESS
- ✅ RELIABILITY

It does NOT introduce new life domains.

---

## Critical Constraints

### MUST ALWAYS:

1. **Reference existing Planet × House base rules**
   - Every Strength/Yoga rule MUST have `base_rule_ids`
   - Cannot exist independently
   - Modifies intensity/effectiveness of existing base rules

2. **Modify power ONLY (not WHAT, but HOW STRONG)**
   - Changes intensity/effectiveness, not meaning
   - Enhances or reduces base rule expression
   - Never redefines life domains

3. **Never contradict base rules**
   - Strength/Yoga modifiers cannot override base rule meaning
   - Can only adjust intensity, effectiveness, reliability

4. **Only extract when book explicitly describes**
   - Must be book-driven, not inferred
   - Must clearly modify planetary results
   - Must not be generic strength/yoga lore

---

## PART A — PLANETARY STRENGTH STATES

### Allowed Strength States:

- ✅ **Exaltation** (उच्च) - Planet in its exaltation sign
- ✅ **Debilitation** (नीच) - Planet in its debilitation sign
- ✅ **Own Sign** (स्वराशि) - Planet in its own sign
- ✅ **Retrograde** (वक्री) - Planet in retrograde motion
- ✅ **Mooltrikona** (मूलत्रिकोण) - Planet in mooltrikona sign
- ✅ **Functional strength/weakness** (book-explicit)

### Strength Rules MAY:

- ✅ Increase or decrease intensity
- ✅ Improve or reduce consistency of results
- ✅ Modify effectiveness and reliability

### Strength Rules MUST NOT:

- ❌ Create new predictions
- ❌ Promise outcomes
- ❌ Use fear-based or absolute language

### Example (GOOD):

> "An exalted Jupiter tends to express its results with greater stability and confidence."

### Example (BAD):

> "Exalted Jupiter guarantees success."

---

## PART B — YOGA (COMBINATION) RULES

### Yoga Rules MUST:

- ✅ Involve TWO OR MORE planets
- ✅ Be explicitly named or clearly described in the book
- ✅ Modify existing Planet × House effects

### Yoga Rules MUST NOT:

- ❌ Stand alone without base rules
- ❌ Promise guaranteed events
- ❌ Override base meanings

### Yoga Rules Answer:

> "What changes when these planets act together?"

### Common Yogas:

- **Gaja Kesari Yoga** - Moon and Jupiter in specific relationship
- **Raja Yoga** - Multiple planets in specific combination
- **Dhana Yoga** - Wealth-related combinations
- **Vidya Yoga** - Education-related combinations
- **Chandra Mangal Yoga** - Moon and Mars combination
- **Kala Sarpa Yoga** - All planets between Rahu and Ketu

---

## Allowed Rule Types

Strength and Yoga rules may ONLY:

- ✅ Increase or decrease intensity
- ✅ Improve or weaken effectiveness
- ✅ Change stability or reliability

They MUST NOT:

- ❌ Redefine life domains
- ❌ Predict specific events
- ❌ Use fatalistic language

---

## Rule Structure

### Strength Rule Structure (Example)

```json
{
  "rule_id": "JUPITER_EXALTED",
  "base_rule_ids": ["JUPITER_1", "JUPITER_5", "JUPITER_9"],
  "planet": "JUPITER",
  "strength_state": "EXALTED",
  "condition_tree": {
    "generic_condition": {
      "note": "Planet JUPITER in EXALTED state - requires engine support for strength state checking"
    }
  },
  "effect_json": {
    "intensity_multiplier": 1.3,
    "stability": "high",
    "effectiveness": "enhanced",
    "theme": "general",
    "area": "jupiter_strength_exalted",
    "trend": "mixed",
    "intensity": 0.8,
    "tone": "informational",
    "scenario": "strength_modifier",
    "outcome_text": "When Jupiter is in EXALTED state, the effects associated with Jupiter placements may manifest with greater stability, consistency, and constructive expression. This modifies the intensity and effectiveness of base Jupiter rules.",
    "variant_meta": {
      "tone": "informational",
      "confidence_level": "medium",
      "dominance": "strength_modifier",
      "certainty_note": "This modifies the intensity and effectiveness of base JUPITER rules when the planet is in EXALTED state."
    }
  },
  "canonical_meaning": "When Jupiter is in EXALTED state, its effects tend to manifest with greater stability and consistency.",
  "engine_expressibility": "requires_generic_condition"
}
```

### Yoga Rule Structure (Example)

```json
{
  "rule_id": "YOGA_GAJA_KESARI",
  "base_rule_ids": ["MOON_1", "JUPITER_4"],
  "yoga_name": "GAJA_KESARI",
  "planets": ["MOON", "JUPITER"],
  "condition_tree": {
    "generic_condition": {
      "note": "Yoga GAJA_KESARI involving MOON, JUPITER - requires engine support for yoga checking"
    }
  },
  "effect_json": {
    "intensity_multiplier": 1.4,
    "effectiveness": "enhanced",
    "synergy": "positive",
    "theme": "general",
    "area": "yoga_gaja_kesari",
    "trend": "mixed",
    "intensity": 0.8,
    "tone": "informational",
    "scenario": "yoga_modifier",
    "outcome_text": "Gaja Kesari Yoga enhances the constructive influence when Moon and Jupiter operate together. This combination strengthens the combined effects of these planets, improving the intensity and effectiveness of their base rules.",
    "variant_meta": {
      "tone": "informational",
      "confidence_level": "medium",
      "dominance": "yoga_modifier",
      "certainty_note": "This yoga modifies the intensity and effectiveness of base rules when Moon and Jupiter operate together."
    }
  },
  "canonical_meaning": "Gaja Kesari Yoga enhances the constructive influence when Moon and Jupiter operate together, strengthening their combined effects.",
  "engine_expressibility": "requires_generic_condition"
}
```

---

## Engine Expressibility Constraints

### Current Status:

**NOTE:** Current engine supports:
- ✅ `planet_strength` operator (for numeric strength values with min/max)
- ✅ `generic_condition` operator (as placeholder)

**NOT YET SUPPORTED:**
- ❌ `planet_strength` with state parameter (EXALTED, DEBILITATED, etc.)
- ❌ `yoga_present` operator for checking specific yogas

### Current Workaround:

Rules use `generic_condition` as a placeholder with notes indicating:
- Strength state checking requirements
- Yoga checking requirements

**Future Enhancement Needed:**
- Engine may need to add support for:
  - `planet_strength` with `state` parameter
  - `yoga_present` operator

---

## Extraction Rules

### Extract Strength/Yoga rules ONLY when:

1. **Book explicitly describes strength condition or yoga**
   - Must be clear, not inferred
   - Must be book-driven, not general lore
   - Must specify which planets and how they modify results

2. **Base rules exist**
   - Must reference existing Planet × House rules
   - Cannot stand alone

3. **Effect modification is clear**
   - Must describe intensity/effectiveness changes
   - Must not be generic strength/yoga description

### Generic Strength/Yoga Descriptions:

- ❌ "Jupiter is exalted in Cancer" → Reference knowledge only
- ❌ "Yogas are generally beneficial" → Generic, no specific placement
- ❌ "Strength affects results" → Generic, no specific modification

**MUST be excluded from engine rules**  
**Stored only as reference knowledge**

---

## Language Guidelines

### Allowed Phrasing:

- "tends to express with greater stability"
- "may manifest more consistently"
- "enhances the constructive influence"
- "strengthens combined effects"
- "improves intensity and effectiveness"
- "modifies the intensity"

### Disallowed Phrasing:

- "will definitely"
- "guaranteed to"
- "must result in"
- "always causes"
- "cannot be avoided"
- "inevitable"

---

## Examples

### Example: Exalted Jupiter Intensity Enhancement

**Base Rule:** "Jupiter in 1st house creates confidence and clarity"

**Strength Modifier:**
> "When Jupiter is in EXALTED state, the effects associated with Jupiter placements may manifest with greater stability, consistency, and constructive expression. This modifies the intensity and effectiveness of base Jupiter rules."

**Key Elements:**
- ✅ References base rules
- ✅ Modifies intensity/effectiveness (not meaning)
- ✅ Communicates stability and consistency
- ✅ Maintains informational tone (not fear)
- ✅ Emphasizes modification, not replacement

### Example: Gaja Kesari Yoga Synergy

**Base Rules:** "Moon in 1st house" + "Jupiter in 4th house"

**Yoga Modifier:**
> "Gaja Kesari Yoga enhances the constructive influence when Moon and Jupiter operate together. This combination strengthens the combined effects of these planets, improving the intensity and effectiveness of their base rules."

**Key Elements:**
- ✅ References multiple base rules
- ✅ Describes synergy (combined effects)
- ✅ Modifies intensity/effectiveness
- ✅ Maintains informational tone
- ✅ Emphasizes enhancement, not new prediction

---

## Final Intent

Strength and Yoga rules should make the user feel:

> "This strength state or combination modifies how strongly these effects manifest. Understanding this helps me engage with remedies more effectively."

This bridges to remedies by:
- ✅ Creating awareness of intensity variations
- ✅ Communicating effectiveness differences without panic
- ✅ Emphasizing modification, not destiny
- ✅ Motivating conscious engagement
- ✅ Connecting to remedy effectiveness

---

## Current Status for lalkitab

**Result:** 86 Strength rules and 6 Yoga rules extracted.

The book contains explicit statements about planetary strength states and yoga combinations. These rules modify the intensity and effectiveness of base Planet × House rules.

**NOTE:** Current rules use `generic_condition` as placeholder - engine may need enhancement for full strength state and yoga support.

---

## Files

- **Scan Results:** `strength_yoga.scan.v1.json`
- **Rules:** `strength_yoga.rules.v1.json`
- **This Guidance:** `PHASE5_STRENGTH_YOGA_GUIDANCE.md`
- **Base Rules:** `datasets/rules.v1.json` (84 rules)

---

**Status:** Framework Complete - Rules Extracted (with engine enhancement notes)

