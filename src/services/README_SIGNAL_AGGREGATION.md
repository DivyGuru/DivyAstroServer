# Signal Aggregation Layer

**Purpose:** Combine applicable rules for a user into domain-wise structured signals.

---

## What This Layer Does

1. **Queries rules from database** - Fetches all READY rules (BASE, STRENGTH, YOGA)
2. **Evaluates condition_tree** - Uses existing rule evaluator to match rules against astro snapshot
3. **Aggregates effects per domain** - Groups rules by life domain (career, money, relationship, etc.)
4. **Computes summary metrics** - Calculates pressure, support, stability, confidence
5. **Tracks rule trace** - Records which rules were applied (for transparency)

---

## Inputs

### Required:
- `astroSnapshot` - Astro state snapshot object (from `astro_state_snapshots` table)
  - Must contain: `planets_state`, `houses_state`, `yogas_state`, `doshas_state`, `transits_state`
  - Optional: `running_mahadasha_planet`, `running_antardasha_planet`, etc.

### Database:
- Rules table must be populated (via ingestion layer)
- Only rules with `engine_status = 'READY'` are used for computation
- Rules with `engine_status = 'PENDING_OPERATOR'` are tracked but not computed

---

## Output Structure

```json
{
  "domain": "career_direction",
  "summary_metrics": {
    "pressure": "high",
    "support": "medium",
    "stability": "low",
    "confidence": 0.7
  },
  "themes": ["career", "work"],
  "time_windows": {
    "years": [],
    "months": []
  },
  "rule_trace": {
    "base_rules_applied": ["lalkitab__lalkitab_u0205"],
    "strength_rules_applied": [],
    "yoga_rules_applied": [],
    "pending_rules": ["SUN_DEBILITATED"]
  }
}
```

### Metrics Explained:

- **pressure**: `low` | `medium` | `high` - Derived from intensity and negative trends
- **support**: `low` | `medium` | `high` - Derived from intensity and positive trends
- **stability**: `low` | `medium` | `high` - Derived from rule stability indicators
- **confidence**: `0.0` to `1.0` - Based on number of applicable rules (more rules = higher confidence)

### Rule Trace:

- **base_rules_applied**: Rule IDs of BASE rules that matched
- **strength_rules_applied**: Rule IDs of STRENGTH modifiers that were applied
- **yoga_rules_applied**: Rule IDs of YOGA modifiers that were applied
- **pending_rules**: Rule IDs of rules that matched but are PENDING_OPERATOR (not computed)

---

## What This Layer DOES NOT Do

❌ **NO narrative text generation**
- Does not create paragraphs or explanations
- Does not use LLM language generation
- Output is structured data only

❌ **NO exact dates**
- Time windows are empty arrays (to be populated by Time Patch Engine)
- Does not predict specific dates or events

❌ **NO over-weighting**
- All rules are weighted equally (by base_weight)
- No single rule dominates the output

❌ **NO randomness**
- Deterministic output (same input → same output)
- No probabilistic calculations

❌ **NO astrology lectures**
- No explanations of why rules match
- No educational content

---

## Usage

```javascript
import { aggregateSignals } from './services/signalAggregation.js';

// Get astro snapshot from database
const astroSnapshot = await getAstroSnapshot(windowId);

// Aggregate signals
const domainSignals = await aggregateSignals(astroSnapshot);

// domainSignals is an array of signals, one per domain
for (const signal of domainSignals) {
  console.log(`${signal.domain}: ${signal.summary_metrics.pressure} pressure`);
}
```

---

## Domains Supported

All domains from problem taxonomy:
- `money_finance`
- `career_direction`
- `relationships`
- `family_home`
- `health_body`
- `mental_state`
- `spiritual_growth`
- `timing_luck`
- `events_changes`
- `self_identity`

---

## Algorithm

1. **Normalize astro snapshot** - Convert to format expected by rule evaluator
2. **Fetch all rules** - Query database for READY and PENDING_OPERATOR rules
3. **For each domain:**
   - Evaluate all rules against astro snapshot
   - Filter rules that match condition_tree
   - Filter rules that apply to this domain (by theme)
   - Separate BASE, STRENGTH, YOGA, and PENDING rules
   - Apply STRENGTH/YOGA modifiers to BASE rules
   - Compute aggregated metrics
   - Build rule trace

---

## Deterministic Behavior

- Same astro snapshot → same signals
- No random number generation
- No time-based variations
- Conservative aggregation (averages, not extremes)

---

## Future Enhancements

- **Time windows**: Derive years from dasha data, months from transit data
- **Confidence refinement**: Consider rule confidence levels from provenance
- **Theme extraction**: Better keyword extraction from effect_json

---

**Status:** Ready for use. Foundation for Time Patch Engine and Narrative Composer.

