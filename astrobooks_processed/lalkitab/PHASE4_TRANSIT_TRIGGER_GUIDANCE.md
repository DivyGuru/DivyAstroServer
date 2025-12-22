# PHASE 4: Transit / Gochar Trigger Layer - Guidance

**Date:** 2025-12-21  
**Purpose:** Define WHEN base Planet × House effects become temporarily active during major transits

---

## Core Purpose

This phase answers:
- **WHEN** a known life issue becomes temporarily more active
- **WHEN** it requires greater attention during transit windows
- **WHEN** decision-making errors can have higher impact

Transit rules introduce:
- ✅ Temporary activation
- ✅ Risk sensitivity windows
- ✅ Contextual urgency

They are NOT new predictions.  
They NEVER redefine life domains.

---

## Critical Constraints

### MUST ALWAYS:

1. **Reference an existing Planet × House base rule**
   - Every Transit rule MUST have a `base_rule_id`
   - Cannot exist independently
   - Activates or intensifies existing base rule temporarily

2. **Modify timing/intensity ONLY**
   - Changes WHEN temporarily, not WHAT
   - Activates existing effects temporarily
   - Intensifies or moderates base rule expression during transit

3. **Never contradict base rules**
   - Transit activation cannot override base rule meaning
   - Can only add temporary timing/risk sensitivity context

4. **Only major transits**
   - Saturn, Jupiter, Rahu, Ketu ONLY
   - Moon, Mercury, Venus, Sun, Mars transits are OUT OF SCOPE

---

## Allowed Transit Scope (STRICT)

Only MAJOR TRANSITS are in scope:

- ✅ Saturn transit
- ✅ Jupiter transit
- ✅ Rahu transit
- ✅ Ketu transit

Transit rules in this phase are LIMITED to:
- ✅ Transit of a planet THROUGH A HOUSE

**OUT OF SCOPE:**
- ❌ Planet-to-planet transits (e.g., Saturn over Moon, Jupiter aspecting Mars)
- ❌ Minor or fast-moving planet transits (Moon, Mercury daily motion, etc.)
- ❌ Degree-based transits
- ❌ Aspect-based logic

---

## Severity & Risk Awareness Guidance

### Transit rules MAY describe:

- ✅ Periods where existing problems can escalate IF handled carelessly
- ✅ Windows where decision-making errors, negligence, or impulsive actions can have higher impact
- ✅ Temporary intensification of existing pressures
- ✅ Periods of higher risk sensitivity

### This is NOT fear.
### This is **temporary risk awareness**.

### Allowed Language:

- "may temporarily intensify"
- "requires greater attention during this period"
- "decision-making errors can have higher impact"
- "period of higher risk sensitivity"
- "temporary activation"
- "careless handling may escalate existing challenges"

### Disallowed Language:

- ❌ "will definitely happen"
- ❌ "cannot be avoided"
- ❌ "guaranteed to cause"
- ❌ "inevitable"
- ❌ Catastrophic language

---

## Rule Structure

### Required Fields

```json
{
  "rule_id": "SATURN_TRANSIT_10_TRIGGERS_SATURN_10",
  "base_rule_id": "lalkitab__lalkitab_u0205",
  "transit_planet": "SATURN",
  "house": 10,
  "base_planet": "SATURN",
  "condition_tree": {
    "all": [
      {
        "planet_in_house": {
          "planet_in": ["SATURN"],
          "house_in": [10],
          "match_mode": "any",
          "min_planets": 1
        }
      },
      {
        "transit_planet_in_house": {
          "planet_in": ["SATURN"],
          "house_in": [10],
          "match_mode": "any",
          "min_planets": 1
        }
      }
    ]
  },
  "time_effect": {
    "activation": "temporary",
    "intensity_multiplier": 1.2,
    "risk_sensitivity": "high"
  },
  "canonical_meaning": "When Saturn transits the 10th house, career-related responsibilities and pressures associated with Saturn in the 10th house may temporarily intensify, making careful decision-making especially important.",
  "effect_json": {
    "theme": "career",
    "area": "saturn_house_10_transit_saturn",
    "trend": "mixed",
    "intensity": 0.8,
    "tone": "cautionary",
    "trigger": "transit",
    "scenario": "transit_trigger",
    "outcome_text": "When Saturn transits the 10th house, career-related responsibilities and pressures associated with Saturn in the 10th house may temporarily intensify. This period requires greater attention to professional matters, as decision-making errors or negligence may have higher impact during this transit window. Careful handling of responsibilities is especially important.",
    "variant_meta": {
      "tone": "cautionary",
      "confidence_level": "medium",
      "dominance": "temporary_trigger",
      "certainty_note": "This temporarily activates the base Saturn in 10 house rule during Saturn transit, adding temporary sensitivity and risk awareness context."
    }
  }
}
```

---

## Extraction Rules

### Extract Transit rules ONLY when:

1. **Book explicitly links a transit to planetary results**
   - Must be clear, not inferred
   - Must be book-driven, not general lore
   - Must specify which planet transiting which house affects which base rule

2. **Timing connection is clear and specific**
   - Must describe WHEN the effect becomes temporarily active
   - Must link to major transit (Saturn, Jupiter, Rahu, Ketu)
   - Must not be generic transit description

3. **Base rule exists**
   - Must reference existing Planet × House rule
   - Cannot stand alone

### Generic Transit Descriptions:

- ❌ "Saturn transit lasts 2.5 years" → Reference knowledge only
- ❌ "Jupiter transit is generally beneficial" → Generic, no house link
- ❌ "Transits affect life" → Generic, no specific placement

**MUST be excluded from engine rules**  
**Stored only as reference knowledge**

---

## Language Guidelines

### Allowed Phrasing:

- "may temporarily intensify"
- "requires greater attention during this period"
- "decision-making errors can have higher impact"
- "period of higher risk sensitivity"
- "temporary activation"
- "careless handling may escalate"

### Disallowed Phrasing:

- "will definitely"
- "cannot be avoided"
- "guaranteed to"
- "must result in"
- "inevitable"
- "always causes"

---

## Examples

### Example: Career Pressure Temporary Intensification

**Base Rule:** "Saturn in 10th house creates sustained pressure in professional life"

**Transit Trigger:**
> "When Saturn transits the 10th house, career-related responsibilities and pressures associated with Saturn in the 10th house may temporarily intensify. This period requires greater attention to professional matters, as decision-making errors or negligence may have higher impact during this transit window."

**Key Elements:**
- ✅ References base rule
- ✅ Adds temporary timing (Saturn transit)
- ✅ Communicates risk sensitivity (decision-making errors can have higher impact)
- ✅ Maintains responsibility tone (not fear)
- ✅ Emphasizes temporary nature

---

## Final Intent

Transit rules should make the user feel:

> "This transit period needs attention. If I act consciously and avoid careless decisions, I can manage it better."

This bridges to remedies by:
- ✅ Creating awareness of temporary timing
- ✅ Communicating risk sensitivity without panic
- ✅ Emphasizing responsibility and choice
- ✅ Motivating conscious action
- ✅ Connecting to remedy engagement

---

## Current Status for lalkitab

**Result:** 0 explicit Transit × Planet × House rules found.

The book does not contain explicit statements linking major transits to specific planetary placements in houses. This is a **valid and correct outcome**.

**Action:** No rules to extract at this time. System is ready for future books that may contain such explicit statements.

---

## Files

- **Scan Results:** `transit.scan.v1.json`
- **Triggers:** `transit.triggers.v1.json`
- **This Guidance:** `PHASE4_TRANSIT_TRIGGER_GUIDANCE.md`
- **Base Rules:** `datasets/rules.v1.json` (84 rules)

---

**Status:** Framework Ready - No Extractable Rules Found in lalkitab

