# PHASE 3: Dasha / Time Activation Layer - Guidance

**Date:** 2025-12-21  
**Purpose:** Define WHEN base Planet × House effects become more active, demanding attention or action

---

## Core Purpose

This phase answers:
- **WHEN** a known life issue becomes more active
- **WHEN** it demands attention or action
- **WHEN** choices matter more

Dasha rules introduce:
- ✅ Urgency
- ✅ Timing relevance
- ✅ Windows where choices matter more

---

## Critical Constraints

### MUST ALWAYS:

1. **Reference an existing Planet × House base rule**
   - Every Dasha rule MUST have a `base_rule_id`
   - Cannot exist independently
   - Activates or intensifies existing base rule

2. **Modify timing/intensity ONLY**
   - Changes WHEN, not WHAT
   - Activates existing effects
   - Intensifies or moderates base rule expression

3. **Never contradict base rules**
   - Dasha activation cannot override base rule meaning
   - Can only add timing/urgency context

---

## Severity & Urgency Guidance

### Dasha rules MAY describe:

- ✅ Periods of heightened pressure
- ✅ Times when mistakes have larger consequences
- ✅ Phases where effort or neglect matters more
- ✅ Windows requiring greater caution
- ✅ Phases demanding conscious effort
- ✅ Periods that can amplify existing challenges

### This is NOT fear.
### This is **responsibility timing**.

### Allowed Language:

- "requires greater caution"
- "demands conscious effort"
- "can amplify existing challenges"
- "may require more attention"
- "mistakes can have larger consequences"
- "effort matters more during this period"
- "neglect may lead to setbacks"

### Disallowed Language:

- ❌ "will definitely happen"
- ❌ "cannot be avoided"
- ❌ "guaranteed to cause"
- ❌ "inevitable"
- ❌ "must result in"
- ❌ Catastrophic language

---

## Rule Structure

### Required Fields

```json
{
  "rule_id": "SATURN_6_MD_SATURN",
  "base_rule_id": "lalkitab__lalkitab_u0189",
  "planet": "SATURN",
  "house": 6,
  "dasha_planet": "SATURN",
  "dasha_level": "mahadasha",
  "condition_tree": {
    "all": [
      {
        "planet_in_house": {
          "planet_in": ["SATURN"],
          "house_in": [6],
          "match_mode": "any",
          "min_planets": 1
        }
      },
      {
        "dasha_running": {
          "level": "mahadasha",
          "planet_in": [7]
        }
      }
    ]
  },
  "time_effect": {
    "activation": "on",
    "intensity_multiplier": 1.4,
    "urgency_level": "high"
  },
  "canonical_meaning": "During Saturn Mahadasha, the health pressure from Saturn in the 6th house becomes more active and demanding. This period requires greater attention to health management, as neglect may lead to more significant challenges. Conscious effort in health care matters more during this time.",
  "effect_json": {
    "theme": "health",
    "area": "saturn_house_6_dasha_saturn",
    "trend": "down",
    "intensity": 0.9,
    "tone": "cautionary",
    "trigger": "dasha",
    "scenario": "health_pressure_activated",
    "outcome_text": "During Saturn Mahadasha, the health pressure from Saturn in the 6th house becomes more active and demanding. This period requires greater attention to health management, as throat, respiratory, and digestive health concerns may intensify. Neglect during this period may lead to more significant challenges. Conscious effort in health care matters more during this time, and mistakes can have larger consequences.",
    "variant_meta": {
      "tone": "cautionary",
      "confidence_level": "medium",
      "dominance": "time_activation",
      "certainty_note": "This activates the base Saturn in 6th house rule during Saturn Mahadasha, adding timing and urgency context."
    }
  }
}
```

---

## Extraction Rules

### Extract Dasha rules ONLY when:

1. **Book explicitly links a dasha to planetary results**
   - Must be clear, not inferred
   - Must be book-driven, not general lore
   - Must specify which planet in which house is activated

2. **Timing connection is clear and specific**
   - Must describe WHEN the effect becomes active
   - Must link to Mahadasha or Antardasha
   - Must not be generic dasha description

3. **Base rule exists**
   - Must reference existing Planet × House rule
   - Cannot stand alone

### Generic Dasha Descriptions:

- ❌ "Saturn mahadasha is 19 years" → Reference knowledge only
- ❌ "During Saturn dasha, one becomes renunciate" → Generic, no house link
- ❌ "Mercury dasha is fortunate" → Generic, no specific placement

**MUST be excluded from engine rules**  
**Stored only as reference knowledge**

---

## Language Guidelines

### Allowed Phrasing:

- "becomes more active"
- "requires greater attention"
- "demands conscious effort"
- "can amplify"
- "may intensify"
- "mistakes can have larger consequences"
- "effort matters more"
- "neglect may lead to"

### Disallowed Phrasing:

- "will definitely"
- "cannot be avoided"
- "guaranteed to"
- "must result in"
- "inevitable"
- "always causes"

---

## Examples

### Example 1: Health Pressure Activation

**Base Rule:** "Saturn in 6th house creates sustained pressure in health management"

**Dasha Activation:**
> "During Saturn Mahadasha, the health pressure from Saturn in the 6th house becomes more active and demanding. This period requires greater attention to health management, as throat, respiratory, and digestive health concerns may intensify. Neglect during this period may lead to more significant challenges. Conscious effort in health care matters more during this time."

**Key Elements:**
- ✅ References base rule
- ✅ Adds timing (Saturn Mahadasha)
- ✅ Communicates urgency (requires greater attention)
- ✅ States consequence (neglect may lead to)
- ✅ Maintains responsibility tone (not fear)

---

### Example 2: Relationship Pressure Activation

**Base Rule:** "Saturn in 7th house creates structured approach to partnerships"

**Dasha Activation:**
> "During Saturn Mahadasha, the partnership dynamics from Saturn in the 7th house become more active. This period requires greater effort to maintain relationship harmony, as existing tensions may intensify. Mistakes in communication or commitment can have larger consequences during this time. Conscious attention to partnership matters more."

**Key Elements:**
- ✅ Activates base rule
- ✅ Adds timing context
- ✅ Communicates effort requirement
- ✅ States consequence of mistakes
- ✅ Maintains responsibility tone

---

## Final Intent

Dasha rules should make the user feel:

> "This period needs attention. If I act consciously, I can manage it better."

This is the **bridge to remedies** by:
- ✅ Creating awareness of timing
- ✅ Communicating urgency without panic
- ✅ Emphasizing responsibility and choice
- ✅ Motivating conscious action
- ✅ Connecting to remedy engagement

---

## Current Status for lalkitab

**Result:** 0 explicit Dasha × Planet × House rules found.

The book does not contain explicit statements linking dasha periods to specific planetary placements in houses. All flagged items were generic dasha information (durations, general effects) without explicit links to Planet × House base rules.

**Action:** No rules to extract at this time. System is ready for future books that may contain such explicit statements.

---

## Files

- **Scan Results:** `dasha.scan.v1.json`
- **Scan Report:** `DASHA_PHASE3_REPORT.md`
- **This Guidance:** `PHASE3_DASHA_ACTIVATION_GUIDANCE.md`
- **Base Rules:** `datasets/rules.v1.json` (84 rules)

---

**Status:** Framework Ready - No Extractable Rules Found in lalkitab

