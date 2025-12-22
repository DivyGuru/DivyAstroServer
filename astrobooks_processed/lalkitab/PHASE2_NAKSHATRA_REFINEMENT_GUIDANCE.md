# PHASE 2: Planet × House × Nakshatra Refinement Layer - Guidance

**Date:** 2025-12-21  
**Purpose:** Refine HOW base Planet × House effects manifest through Nakshatra

---

## Core Purpose

This phase refines **HOW** a base Planet × House effect manifests, not **WHAT** the effect is.

Nakshatra rules should:
- ✅ Sharpen behavioral patterns
- ✅ Clarify emotional or psychological tendencies
- ✅ Explain WHY similar placements behave differently
- ✅ Increase precision and personal relatability

---

## Critical Constraints

### MUST ALWAYS:

1. **Reference an existing Planet × House rule**
   - Every Nakshatra rule MUST have a `base_rule_id`
   - Cannot exist independently

2. **Modify intensity or quality ONLY**
   - Changes HOW, not WHAT
   - Modifies manner/quality of manifestation
   - Does NOT redefine life domains

3. **Never contradict base rules**
   - Nakshatra refinement cannot override base rule meaning
   - Can only add nuance, intensity, or behavioral clarity

---

## Allowed Refinement Types

### 1. Behavioral Pattern Sharpening

**Example:**
- Base: "Saturn in 6th house creates health pressure"
- Nakshatra Refinement: "In Ashwini, the health pressure manifests with more reactive responses and impulsive health decisions"

**Allowed Language:**
- "more reactive"
- "less flexible"
- "emotionally sensitive"
- "prone to impulsive decisions"
- "tends to internalize stress"
- "more expressive in communication"

### 2. Emotional/Psychological Tendencies

**Example:**
- Base: "Jupiter in 7th house supports partnership"
- Nakshatra Refinement: "In Rohini, partnership support manifests with greater emotional attachment and need for stability"

**Allowed Language:**
- "emotionally sensitive"
- "needs greater reassurance"
- "more expressive"
- "tends to internalize"
- "requires more validation"

### 3. Intensity Modifiers

**Example:**
- Base: "Mars in 1st house indicates assertiveness"
- Nakshatra Refinement: "In Mula, assertiveness is intensified with more direct confrontation and less tolerance for delays"

**Allowed Language:**
- "intensified"
- "moderated"
- "more pronounced"
- "less visible"
- "heightened sensitivity"

### 4. Volatility/Rigidity Indicators

**Example:**
- Base: "Mercury in 2nd house affects communication"
- Nakshatra Refinement: "In Ardra, communication becomes more volatile with rapid mood shifts affecting speech patterns"

**Allowed Language:**
- "more volatile"
- "less flexible"
- "increased rigidity"
- "more unstable"
- "prone to sudden shifts"

---

## Disallowed Patterns

### ❌ Fear-Based Prophecy

**BAD:**
- "In Mula, Saturn in 8th house will cause death"
- "Guaranteed health problems in Ashwini"

**GOOD:**
- "In Mula, Saturn in 8th house health risk may manifest with more sudden health crises requiring immediate attention"
- "In Ashwini, health challenges may appear more abruptly, requiring faster response"

### ❌ Event Guarantees

**BAD:**
- "Will definitely cause divorce"
- "Always leads to financial loss"

**GOOD:**
- "May create more tension in relationships"
- "Can increase financial volatility"

### ❌ Redefining Life Domains

**BAD:**
- "In Rohini, Saturn in 6th house becomes about creativity" (wrong - 6th house is health/service)

**GOOD:**
- "In Rohini, Saturn in 6th house health pressure manifests with more emotional sensitivity to health concerns"

---

## Rule Structure

### Required Fields

```json
{
  "rule_id": "SATURN_6_NAKSHATRA_ASHWINI",
  "base_rule_id": "lalkitab__lalkitab_u0189",
  "planet": "SATURN",
  "house": 6,
  "nakshatra": "ASHWINI",
  "condition_tree": {
    "all": [
      {
        "planet_in_house": {
          "planet_in": ["SATURN"],
          "house_in": [6]
        }
      },
      {
        "planet_in_nakshatra": {
          "planet_in": ["SATURN"],
          "nakshatra_in": ["ASHWINI"]
        }
      }
    ]
  },
  "refinement_type": "behavioral_pattern",
  "intensity_delta": 0.15,
  "qualitative_modifier": "more_reactive",
  "canonical_meaning": "In Ashwini, Saturn in the 6th house health pressure manifests with more reactive responses and impulsive health decisions, requiring greater awareness of sudden health changes.",
  "effect_json": {
    "theme": "health",
    "area": "saturn_house_6_nakshatra_ashwini",
    "trend": "mixed",
    "intensity": 0.8,
    "tone": "cautionary",
    "trigger": "natal",
    "scenario": "health_pressure_reactive",
    "outcome_text": "In Ashwini, Saturn in the 6th house health pressure manifests with more reactive responses and impulsive health decisions. Health concerns may appear more suddenly, requiring faster response and greater awareness of sudden changes. The base health pressure remains, but the manner of manifestation is more immediate and less predictable.",
    "variant_meta": {
      "tone": "cautionary",
      "confidence_level": "medium",
      "dominance": "refinement",
      "certainty_note": "This refines the base Saturn in 6th house rule by adding behavioral pattern clarity specific to Ashwini nakshatra."
    }
  }
}
```

---

## Extraction Rules

### Extract Nakshatra rules ONLY when:

1. **Book explicitly connects nakshatra to planetary placement**
   - Must be clear, not inferred
   - Must be book-driven, not general lore

2. **Nakshatra changes HOW the result unfolds**
   - Not WHAT the result is
   - Changes manner/quality/behavioral pattern

3. **Base rule exists**
   - Must reference existing Planet × House rule
   - Cannot stand alone

### If unclear:

- ✅ Flag for review
- ❌ Do NOT guess
- ❌ Do NOT infer from general nakshatra meanings

---

## Language Guidelines

### Allowed Phrasing:

- "manifests with"
- "expresses as"
- "tends to"
- "may appear more"
- "can create"
- "requires greater"
- "needs more"

### Disallowed Phrasing:

- "will definitely"
- "always causes"
- "guaranteed to"
- "must result in"
- "inevitably leads to"

---

## Final Intent

Nakshatra rules should make the user feel:

> "Now I understand why this issue plays out in a specific way in my life."

This deepens trust and emotional engagement by:
- ✅ Explaining behavioral patterns
- ✅ Clarifying emotional responses
- ✅ Showing why similar placements differ
- ✅ Increasing personal relatability

---

## Current Status for lalkitab

**Result:** 0 explicit Planet × House × Nakshatra rules found.

The book does not contain explicit statements linking nakshatras to planetary placements in houses. All flagged items were false positives (e.g., "हस्त" in "हस्तकला" meaning handicraft, not Hasta nakshatra).

**Action:** No rules to extract at this time. System is ready for future books that may contain such explicit statements.

---

## Files

- **Scan Results:** `nakshatra.scan.v1.json`
- **Scan Report:** `NAKSHATRA_PHASE2_REPORT.md`
- **This Guidance:** `PHASE2_NAKSHATRA_REFINEMENT_GUIDANCE.md`
- **Base Rules:** `datasets/rules.v1.json` (84 rules)

---

**Status:** Framework Ready - No Extractable Rules Found in lalkitab

