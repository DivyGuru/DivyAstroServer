## Prediction Composer Layer (Deterministic) — Reference

This document formalizes the **Prediction Composer Layer**.
It converts a set of already-matched variants into a coherent advisory output.

---

## 1) Purpose

- Many variants may be true at the same time.
- They are **not equal** in narrative importance.
- Composer produces a **safe, non-exaggerated** advisory narrative structure that can be:
  - returned directly by API, and/or
  - handed to an LLM as controlled input for narrative generation.

---

## 2) Inputs

Composer input is a list of matched variants.
Each variant must already contain:
- `score` (existing scoring)
- `effect_json.variant_meta` fields:
  - `tone`: `informational | cautionary | opportunity | stabilizing`
  - `confidence_level`: `low | medium | high`
  - `dominance`: `dominant | supporting | background`
  - `certainty_note`: short, neutral note (no astrology theory)

Composer never evaluates astrology conditions; it only consumes the matched list.

---

## 3) Deterministic decision logic

### 3.1 Sorting (strict order)

Variants are sorted by:
1. `dominance`: `dominant > supporting > background`
2. `confidence_level`: `high > medium > low`
3. `score` (existing) as tie-breaker
4. stable string tie-breakers (no randomness)

### 3.2 Suppression rules

Default suppression:
- `background` variants are suppressed by default.
- `low` confidence variants are suppressed by default.

Conditional inclusion:
- Background or low-confidence can be included only by explicit caller options.

### 3.3 Domain limiting

- Limit output to **max 2–4 variants per domain**.
- Domain is derived deterministically from `effect_json.area` / `effect_json.theme`.

### 3.4 Contradiction avoidance

Composer must avoid contradictory guidance in the same domain.
Conservative rule:
- If a dominant headline in a domain sets a primary guidance direction,
  a contradictory dominant headline is suppressed.

This is narrative control only; it does not change rule truth.

---

## 4) Narrative assembly rules

- Start with dominant variants → become `headlines`.
- Supporting variants → become `supporting_notes` (nuance, not new headlines).
- Tone control:
  - `opportunity`: action-forward but no guarantees
  - `cautionary`: risk-control framing, calm language
  - `stabilizing`: repair/structure framing
  - `informational`: neutral observation framing
- `certainty_note` is used as a soft justification:
  - never astrology theory
  - never exaggerated certainty
  - always neutral and guidance-focused

---

## 5) Safety and quality constraints (non-negotiable)

- No guarantees.
- No fear-based language.
- No contradictory guidance in the same output.
- Remedies are attached **after** narrative as a separate post-step.

---

## 6) Outputs (structured object)

Composer returns:
- `headlines[]`
- `supporting_notes[]`
- `suppressed_variants[]` (with reasons)
- `applied_tone` (tone of the top headline, else null)

This structure is designed for:
- API: return structured content directly
- LLM: provide controlled ordering + suppression + tone guidance

---

## 7) Consumption by API layer

Recommended API usage:
- after prediction generation produces `appliedVariants`:
  - call composer with that list
  - return composer output alongside prediction summary JSON

Composer output can be cached as part of prediction response payload if desired,
without altering rule evaluation.

---

## 8) Consumption by AI narrative generator (LLM)

LLM should receive:
- ordered `headlines` and `supporting_notes`
- explicit tone + dominance + confidence fields
- explicit instruction to:
  - keep language calm and non-exaggerated
  - soften low-confidence statements (if included)
  - avoid astrology theory explanations
  - never add remedies inside narrative (remedies are separate)


