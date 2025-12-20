## MASTER OBJECTIVE / ARCHITECTURE CONTEXT (Permanent Reference)

This document is a **permanent system-level reference** for the DivyAstroServer project.
It exists to keep the objective, strategy, and data flow unambiguous for humans and AI.

---

## 1. END GOAL

- Build an **Astrology Prediction Database** that can generate **hourly, daily, weekly, monthly, yearly, and life-level** predictions.
- Predictions are derived from **Swiss Ephemeris** chart outputs saved as **planetary snapshots**.
- Predictions must be **explainable**, driven by:
  - **Rules** (explicit condition trees + effect metadata)
  - **Remedies** (safe, practical guidance linked to matched rules)

---

## 2. CORE IDEA

- **One point ≠ one prediction.**
- **One point = multiple POSSIBILITIES** (typically **8–15 realistic Jyotish variants**).
- Each possibility is a **separate rule**:
  - Different `condition_tree`
  - Different `effect_json`
  - Covers realistic scenarios (benefic/malefic, timing, delays, sudden events, etc.)
- Runtime prediction does not “pick a single point output”; it selects and aggregates **best-matching variants**.

---

## 3. DATA FLOW (HIGH LEVEL)

1. **User chart → Planetary snapshot**
   - Swiss Ephemeris / chart pipeline produces chart data.
   - Snapshot is stored in DB as `astro_state_snapshots` (planets/houses/yogas/doshas/transits + running dasha fields).

2. **Snapshot → ruleEvaluator**
   - For a given `prediction_window`, load:
     - `astro_state_snapshot`
     - all active rules for the window’s scope
   - Evaluate each rule’s `condition_tree` against the normalized snapshot.

3. **ruleEvaluator → matching variants**
   - Only rules whose conditions evaluate to true are “applied”.
   - Each applied rule contributes a weighted score derived from its effect metadata.

4. **Variants → weighted aggregation**
   - Applied rules are aggregated into **theme + area** scores.
   - Aggregation produces structured summary JSON (themes, levels, trends, tones, ranking).

5. **Aggregation → final prediction themes + remedies**
   - Short summary text is built from the aggregated theme summary.
   - Remedies are linked based on applied rule point codes / matching patterns.
   - Final API returns:
     - prediction
     - applied rules
     - remedies

---

## 4. AUTHORING STRATEGY

- AI is **not** used to directly write to the database.
- AI is used only to **author code/data** (rule variants + remedy definitions) in files.
- All DB inserts/updates happen through **Node scripts** (idempotent, safe re-runs).
- Authoring is **point-by-point**:
  - Never bulk, never blind generation.
  - Each point is intentionally reviewed and iterated.

---

## 5. MODULAR ARCHITECTURE

- **One prediction point = one file.**
- **One file contains logic for exactly one point.**
- A folder represents only **one domain/subtype**, never mixed domains in one folder.
- `scripts/setPlanetaryConditions.js` is **only an orchestrator/router**, not a knowledge container.
- Knowledge (variants) is stored in modular authoring modules under:
  - `src/authoring/planetary/`
  - with a central registry mapping `pointId → variants loader`

---

## 6. AI DATA FEEDING RULES

- AI feeds data only when **creating/updating a point file** under the authoring modules.
- AI must output **multiple realistic Jyotish possibilities** per point (usually 8–15).
- Output must be **strict JS arrays/objects** compatible with the authoring modules:
  - No explanation text inside the data
  - No prose output as “the data”
  - Only code-level structures: `condition_tree`, `effect_json`, and optional metadata (e.g., `code`, `label`, `scopes`)

---

## 7. QUALITY PRINCIPLES

- Jyotish logic must be:
  - **realistic**
  - **explainable**
  - compatible with the supported `condition_tree` operators
- Variants should cover:
  - benefic vs malefic dynamics
  - dasha and transit timing
  - delays, sudden gains/losses, recovery phases, discipline-driven outcomes
- Avoid fear-based predictions:
  - use calm, non-alarming tone even for negative scenarios
  - prefer “caution / sensitivity / risk-control” framing
- Remedies must be:
  - safe
  - practical
  - non-superstitious in language and delivery
  - respectful and optional

---

## 8. SCALE STRATEGY

- The system is designed to support **hundreds of points**.
- Files must never become heavy:
  - no mega files containing many points
  - no centralized “god file” knowledge store
- Adding a new point should be:
  - create new point file (single point)
  - generate 8–15 variants
  - register it in the registry
  - run authoring script to persist JSON + DB
- **No future refactor should be required** to scale authoring.

---

## 9. WHAT THIS PROJECT IS NOT

- Not a single hardcoded kundli prediction script.
- Not a static astrology content app.
- Not a brittle rule engine that depends on one-off hardcoding.

---

## 10. LONG-TERM VISION

- This database becomes a **hybrid knowledge base**:
  - AI-assisted authoring
  - human review and refinement
  - versioned, explainable rules and safe remedies
- Runtime LLM usage is **optional**, never mandatory.
- Core intelligence must remain in:
  - DB + rule engine
  - modular authored rule variants
  - deterministic evaluation and aggregation

---

## 11. POINT COMPLETION CRITERIA

A prediction point is considered **complete** only when all of the following are true:

- At least **8 realistic Jyotish variants** have been authored for the point.
- The variant set includes (at minimum) these required case-types:
  - benefic-dominant scenario
  - malefic-dominant scenario
  - mixed / neutral scenario
  - dasha-driven scenario
  - transit-driven scenario
- All variants are **evaluatable** using the **current `ruleEvaluator` supported operators** (no unsupported condition keys).
- After DB insertion/update, a **basic human sanity review** has been completed (logic sanity + non-fear tone + no obvious duplicates).

---

## 12. OPERATOR EVOLUTION RULE

- New Jyotish logic **must not** be added directly into authoring files as new/unknown condition types.
- Any new logic must first be implemented in the **rule engine** as a **supported `condition_tree` operator**.
- Authoring modules may only use **supported operators**.
- This preserves deterministic evaluation, consistent behavior, and long-term engine stability.

---

## 13. AI FALLBACK & SAFETY PRINCIPLE

- AI-authored variants are always treated as **draft** by default.
- Human review is the **final override authority** for correctness, tone, and safety.
- If AI output is shallow, duplicate, or unrealistic:
  - the point is considered **incomplete**
  - **generic fallback** rules may be used temporarily
- Coverage pressure must never override quality:
  - **no quality compromise** for speed or quantity

---

## ADVANCED DEPTH STRATEGY (PER MODULE)

- Each major module (Money, Career, Relationships, Health, Mind, Spiritual) will not be limited to basic coverage only.
- Within each module:
  - after core points (general / growth / loss) are completed
  - advanced, nuanced, real-life scenarios will also be intentionally covered

Advanced depth means covering sub-scenarios such as:
- partnership risk vs solo success
- cash-flow vs profit illusion
- slow stability vs sudden spike
- recovery phases vs permanent damage
- emotional attachment vs practical decision

Within the same module, depth must explicitly include:
- short-term vs long-term effects
- dasha-dominant vs transit-dominant outcomes
- strength-based vs weakness-based manifestations

Rules:
- Advanced depth points are not optional; they are intentional.
- Core points must be completed first, then depth points are added.
- A module is considered "complete" only when:
  - basic coverage exists
  - and at least some advanced depth points are included

Purpose:
- Avoid surface-level, generic predictions.
- Reflect real human life complexity.
- Keep the system meaningful long-term.

Constraints:
- Depth must always remain rule-based and evaluatable.
- No speculative or fear-driven expansion.


