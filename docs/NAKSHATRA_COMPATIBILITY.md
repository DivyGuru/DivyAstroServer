## Nakshatra Compatibility — System Design (Deterministic, Non‑Breaking)

This document defines **nakshatra-level support** as a first-class signal in the prediction engine.

Constraints:
- Deterministic only (no guessing / randomization)
- Non-breaking (existing variants keep working unchanged)
- No astrology theory prose in outputs (only structured signals)

---

## 1) Operator Definitions (Conceptual + Example Usage)

All operators are **optional**. If a snapshot doesn’t provide nakshatra fields, these operators simply evaluate to **false** and do not affect existing variants.

### 1.1 `planet_in_nakshatra`
Checks a natal planet’s nakshatra (and optional pada).

**Shape**:
- `planet_in`: string[] (planet names)
- `nakshatra_in`: (string|number)[] (canonical name or index 1..27)
- `pada_in` (optional): number[] (1..4)
- `match_mode` (optional): `any|all`
- `min_planets` (optional): number

**Example**:

```js
condition_tree: {
  planet_in_nakshatra: {
    planet_in: ['VENUS', 'JUPITER'],
    nakshatra_in: ['ROHINI', 'PUSHYA'],
    match_mode: 'any',
    min_planets: 1,
  },
}
```

### 1.2 `transit_planet_in_nakshatra`
Same as above, but for transit planets.

```js
condition_tree: {
  transit_planet_in_nakshatra: {
    planet_in: ['JUPITER'],
    nakshatra_in: [4, 7], // indexes allowed
    match_mode: 'any',
  },
}
```

### 1.3 `planet_in_nakshatra_group`
Checks whether a planet is in a **domain-context** group: `supportive|neutral|sensitive|obstructive`.

**Shape**:
- `planet_in`: string[]
- `group`: `{ context: string, kind: 'supportive'|'neutral'|'sensitive'|'obstructive' }`
- `match_mode` / `min_planets` optional

```js
condition_tree: {
  planet_in_nakshatra_group: {
    planet_in: ['VENUS'],
    group: { context: 'marriage', kind: 'supportive' },
  },
}
```

### 1.4 `transit_planet_in_nakshatra_group`
Same as group check, but for transits.

### 1.5 `dasha_lord_in_nakshatra`
Checks current running dasha lord’s nakshatra (mahadasha/antardasha/pratyantardasha).

**Shape**:
- `level`: `mahadasha|antardasha|pratyantardasha`
- `nakshatra_in`: (string|number)[]
- `pada_in` optional

```js
condition_tree: {
  dasha_lord_in_nakshatra: {
    level: 'antardasha',
    nakshatra_in: ['PUSHYA'],
  },
}
```

### 1.6 `dasha_lord_in_nakshatra_group`
Group-based version of the above.

---

## 2) Nakshatra Strength Model (Machine‑Usable)

File: `src/config/nakshatraStrengthModel.js`

### 2.1 Canonicalization
- Supports nakshatra as **name** or **index (1..27)**
- Normalizes common naming variants (minimal mapping only)

### 2.2 Strength Categories (Reusable Across Domains)
Each domain context supports:
- `supportive`
- `neutral`
- `sensitive`
- `obstructive`

Model is keyed as:

```js
NAKSHATRA_STRENGTH_MODEL = {
  marriage: { supportive: [], neutral: [], sensitive: [], obstructive: [] },
  progeny: { supportive: [], neutral: [], sensitive: [], obstructive: [] },
  // ...
}
```

Default behavior:
- If a nakshatra is not listed anywhere for a context, it evaluates as **neutral**.

---

## 3) How Variants Consume Nakshatra Signals (Non‑Breaking)

Rules:
- Existing variants remain unchanged.
- Nakshatra signals can be added as **additional conditions** to variants.
- They can be used as a **refinement layer**, not a standalone generator.

Allowed usage patterns:
- Add `planet_in_nakshatra` as an extra `all: [...]` constraint
- Add `transit_planet_in_nakshatra` to narrow short-term windows
- Add `dasha_lord_in_nakshatra` to refine dasha-based phases

Variant metadata usage:
- Nakshatra signals may be authored to **increase confidence** or **upgrade dominance**
- Nakshatra signals must **not** flip a negative variant to positive on their own

---

## 4) Timing Windows (Month–Year Ranges) — Refinement Flow

Nakshatra signals must **refine** windows produced by transit + dasha logic, not generate windows alone.

Deterministic pipeline:
1) Generate candidate windows (e.g., monthly for next N months)
2) Evaluate base marriage/progeny/career rules using existing operators:
   - `dasha_running`
   - `transit_planet_in_house`
   - score aggregations
3) Apply nakshatra operators as additional filters:
   - keep months where supportive nakshatra conditions are true
   - downrank months where sensitive/obstructive conditions are true
4) Group consecutive months into ranges:
   - Primary (strongest score band)
   - Secondary (next best band)

Output format:
- “Feb 2026 to Jun 2026” (range)
- no exact dates
- no guarantees

---

## 5) Migration Plan (Phase‑Wise)

### Phase 1 — Optional Nakshatra Support (Engine Compatibility)
- Add operators to `ruleEvaluator` (optional, non-breaking)
- Add canonicalization + empty/default strength model

### Phase 2 — Confidence Refinement (Authoring Discipline)
- **Implemented support utilities (non-breaking, not wired into runtime):**
  - `src/services/nakshatraRefinement.js`
    - `conditionTreeUsesNakshatra(conditionTree)` to identify nakshatra-refined variants
    - `extractNakshatraContextSignals(...)` to extract context signals from snapshots
- Authoring can now safely add nakshatra operators into variants.
- IMPORTANT: runtime composer sorting remains unchanged unless explicitly opted-in (composer is locked).

### Phase 3 — Precision Window Narrowing (Timing Layer)
- **Implemented deterministic window finder (uses DB snapshots + ruleEvaluator; non-breaking):**
  - `src/services/timingWindowFinder.js`
    - Scores monthly windows for a pointCode
    - Applies *small* nakshatra modifier (refinement only)
    - Groups consecutive months into month–year ranges
  - CLI helper:
    - `scripts/findMonthYearWindows.js`
      - prints JSON with `monthYearRanges[]` like “Feb 2026 to Jun 2026”


