# Time Patch Engine

**Purpose:** Convert aggregated domain signals into meaningful time-based patches that explain WHEN a life area needs attention or offers opportunity.

---

## What This Layer Does

1. **Populates time_windows** - Adds year and month patches to domain signals
2. **Creates year patches** - Long-term periods (1-3 per domain) from dasha data
3. **Creates month patches** - Short-term periods (0-2 per domain) from transit data
4. **Conservative approach** - Empty time_windows is a valid outcome

---

## Inputs

### Required:
- `domainSignals` - Array of domain signals from Signal Aggregation Layer
  ```json
  {
    "domain": "career_direction",
    "summary_metrics": { "pressure": "high", "support": "medium", ... },
    "themes": ["career"],
    "time_windows": { "years": [], "months": [] },
    "rule_trace": { ... }
  }
  ```

### Optional:
- `timingData` - Timing data object
  ```javascript
  {
    dashaTimeline: {
      periods: [
        { from_year: 2025, to_year: 2027, dasha_type: "mahadasha", planet: 5 }
      ]
    },
    transitWindows: {
      periods: [
        { from_month: "2026-03", to_month: "2026-07", planet: "SATURN", house: 10 }
      ]
    },
    currentYear: 2025
  }
  ```

---

## Output Structure

```json
{
  "domain": "career_direction",
  "summary_metrics": { ... },
  "themes": [ ... ],
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

### Year Patch Nature Values:
- `consolidation` - High support + high stability
- `growth` - High support + medium stability
- `restructuring` - High pressure + low stability
- `stabilization` - Default for balanced metrics
- `transition` - Medium pressure + low stability
- `sensitive` - High pressure + medium stability

### Month Patch Nature Values:
- `decision_sensitive` - High pressure or default
- `caution_required` - High pressure + low stability
- `supportive` - High support
- `volatile` - Low stability

---

## When Patches Are Created

### Year Patches (1-3 max per domain):

**Created when:**
- Dasha timeline data exists AND metrics indicate significant activity
- OR (if no dasha data) high confidence (≥0.7) AND sustained long-term metrics

**Not created when:**
- No dasha data AND metrics are not significant
- Low confidence (<0.7)
- Metrics indicate low activity

### Month Patches (0-2 max per domain):

**Created when:**
- Transit window data exists AND metrics indicate significant activity
- OR rule_trace has pending_rules (sensitivity indicators)

**Not created when:**
- No transit data AND no sensitivity indicators
- Metrics indicate low activity

---

## When Patches Remain Empty

**Empty time_windows is a VALID outcome when:**
- No dasha timeline data available
- No transit window data available
- Metrics do not indicate significant activity
- Confidence is too low to create meaningful patches

**This is intentional** - Conservative approach prevents over-prediction.

---

## Design Philosophy

### Human-Readable, Not Precise

- **Year patches**: 1-3 year ranges, not exact dates
- **Month patches**: Month ranges (YYYY-MM), not exact dates
- **Nature values**: Simple, meaningful words (not astrology jargon)

### Conservative Approach

- **Maximum limits**: 3 year patches, 2 month patches per domain
- **Significance threshold**: Only create patches when metrics indicate real activity
- **No over-prediction**: Empty time_windows is better than fake predictions

### Deterministic

- Same input → same output
- No randomness
- No mutation of signal metrics (only adds time_windows)

---

## Usage

```javascript
import { applyTimePatches, extractDashaTimeline, extractTransitWindows } from './services/timePatchEngine.js';

// Get domain signals from Signal Aggregation Layer
const domainSignals = await aggregateSignals(astroSnapshot);

// Extract timing data from astro snapshot
const dashaTimeline = extractDashaTimeline(astroSnapshot);
const transitWindows = extractTransitWindows(astroSnapshot);

// Apply time patches
const signalsWithPatches = applyTimePatches(domainSignals, {
  dashaTimeline,
  transitWindows,
  currentYear: 2025
});

// signalsWithPatches now have populated time_windows
```

---

## Algorithm

1. **For each domain signal:**
   - Check if dasha timeline exists
     - If yes: Create year patches from dasha periods (up to 3)
     - If no: Check if metrics indicate long-term activity → create fallback patch
   - Check if transit windows exist
     - If yes: Create month patches from transit periods (up to 2)
     - If no: Skip month patches
   - Populate time_windows field

2. **Patch creation rules:**
   - Only create if metrics indicate significant activity
   - Respect maximum limits (3 years, 2 months)
   - Determine nature based on pressure/support/stability

---

## What This Layer DOES NOT Do

❌ **NO narrative text generation**
- Does not create paragraphs or explanations
- Does not use LLM language generation
- Output is structured data only

❌ **NO exact dates**
- Year patches: year ranges only
- Month patches: month ranges only (YYYY-MM format)
- No day-level precision

❌ **NO over-prediction**
- Empty time_windows is valid
- Maximum limits enforced
- Significance threshold required

❌ **NO mutation of signals**
- Does not modify summary_metrics
- Does not modify themes
- Only adds time_windows field

---

## Future Enhancements

- **Dasha calculations**: Integrate actual dasha period calculations from birth data
- **Transit calculations**: Integrate actual transit period calculations
- **Sensitivity windows**: Derive from rule_trace.pending_rules more intelligently
- **Confidence refinement**: Consider rule confidence levels when creating patches

---

**Status:** Ready for use. Foundation for Narrative Composer layer.

