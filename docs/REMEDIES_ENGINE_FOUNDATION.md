## Remedies Engine Foundation (Decoupled) — Reference

This document defines the **Remedies Engine Foundation** as a separate layer from prediction logic.
It is designed to be **deterministic**, **safe**, and **schema-enforced** where possible.

---

## 1) What this adds (without touching prediction rules/DB)

- A remedies-engine schema extension inside the existing DB schema file: `schema_divyastrodb.sql`
  - Adds new tables/types/functions/triggers for remedy actions, plan templates, and trigger rules.
  - Does **not** modify existing prediction tables or prediction rule logic.
- A decoupled engine module: `src/services/remediesEngineFoundation.js`
  - Given an input “signal”, it selects a remedy plan and returns actions.
- A seed script for examples: `scripts/seedRemediesEngineExamples.js`
  - Seeds 3 concrete example plans/rules (see below).

---

## 2) Strict global rules enforcement

### 2.1 Allowed categories only

Schema enforces categories via `remedy_action_category` enum:
- meditation
- jap
- donation
- feeding_beings
- fast
- puja

### 2.2 Minimum inner + outer practice rule (schema-enforced)

Rule:
- Every **active** remedy plan must include at least:
  - **one inner** practice: meditation or jap
  - **one outer** action: donation or feeding_beings

Enforced by:
- plan templates keep `inner_action_count` and `outer_action_count` (trigger-maintained)
- a trigger blocks activation of invalid plans

### 2.3 Contradiction prevention (logic-enforced)

- Engine checks `remedy_action_compatibility` with `relation='disallowed'`
- If a conflict exists, it deterministically drops the later action (stable order)
- Engine re-checks the minimum inner+outer rule after pruning

### 2.4 Safety validation (schema + logic)

- Schema blocks minimal banned language related to death/lifespan.
- Engine also runs text safety checks against banned patterns.

---

## 3) Remedies DB design (engine schema)

Core entities:
- `remedy_actions`
  - Remedy_ID: `id`
  - Remedy_Category: `category`
  - Applicable_Planets: `applicable_planets`
  - Description: `description` (neutral, non-fear)

- `remedy_plan_templates`
  - Intensity_Level: `intensity_level` (low/medium/high)
  - Timeframe: `timeframe` (temporary/period_based/long_term)
  - Enforced minimum inner+outer via counters + trigger

- `remedy_plan_actions`
  - Defines which actions belong to which plan (bundle composition)

- `remedy_trigger_rules`
  - Trigger_Conditions: `trigger_conditions` (JSONB; supports Dasha/Transit/Severity as data)
  - Severity mapping: `severity_min`, `severity_max`
  - Rule_Reference: `rule_reference`
  - Links to a plan template (`plan_id`)

- `remedy_action_compatibility`
  - Allowed_With / Disallowed_With implemented as relations between actions

---

## 4) Remedies Rule Layer (selection logic)

Input signal (decoupled):
- `pointCode` (optional)
- `severity` (0..1)
- `triggers` (object; may contain dasha/transit flags or severity-only markers)

Rule layer behavior:
- Maps severity → intensity (low/medium/high)
- Selects the best matching `remedy_trigger_rules` row:
  - point-specific preferred over generic
  - highest priority wins
- Returns:
  - plan template metadata
  - its actions (after compatibility pruning)
- Ensures minimum inner + outer practice is satisfied

---

## 5) 3 concrete example remedy plans (seeded)

Seed script: `scripts/seedRemediesEngineExamples.js`

- Business Loss Risk → pointCode: `MONEY_BUSINESS_LOSS_RISK`
- Partnership Conflict → pointCode: `MONEY_BUSINESS_PARTNERSHIP_COMPLEX`
- Growth Blockage → pointCode: `CAREER_GROWTH_BLOCKED`

Each plan includes:
- one inner practice (meditation or jap)
- one outer action (donation or feeding_beings)

---

## 6) Integration with existing prediction variants

This remedies engine is intentionally decoupled:
- Existing prediction generation can keep working as-is.
- Integration point is a **post-processing step** after rule evaluation:
  - Determine per-point or per-theme severity from applied rules / aggregated scores
  - Call `recommendRemedies({ pointCode, severity, triggers })`
  - Return remedy plan + actions alongside prediction response

No changes are required in prediction rule authoring files to adopt this.

---

## 7) Integration with future AI narrative composer

The engine output is structured and deterministic:
- `plan` metadata + ordered `actions`

Future LLM usage (optional):
- Convert plan/actions into user-facing narrative text
- Must not change categories or introduce restricted content
- LLM output remains a presentation layer; selection stays DB + engine-driven


