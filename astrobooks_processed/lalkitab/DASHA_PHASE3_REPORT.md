# PHASE 3: Dasha / Time Activation Layer - Scan Report

**Date:** 2025-12-21  
**Book:** lalkitab  
**Status:** COMPLETE - No extractable rules found

---

## Executive Summary

**Result:** 0 explicit Dasha × Planet × House rules found in the book.

The scanner identified 9 chunks that contain dasha mentions, but upon manual review, **none** meet the strict "explicitly stated" criteria required for extraction. All flagged items are generic dasha information without explicit links to Planet × House base rules.

---

## Scan Methodology

1. **Pattern Detection:** Searched for explicit patterns like:
   - "DashaPlanet दशा में Planet House में"
   - "Planet House में DashaPlanet दशा में"
   - "DashaPlanet की दशा में Planet House"

2. **Base Rule Validation:** Verified that each candidate references an existing Planet × House base rule (84 rules from Phase 1).

3. **Explicit Statement Requirement:** Only flagged items where the pattern was **explicitly** stating a Dasha × Planet × House combination.

4. **Dasha Level Support:** Only Mahadasha and Antardasha were considered (Pratyantardasha excluded per requirements).

---

## Findings

### Explicit Candidates: 0

No chunks were found that explicitly state a Dasha × Planet × House rule in a clear, unambiguous manner.

### Flagged Items: 9 (All Generic Dasha Information)

All 9 flagged items were manually reviewed and determined to be **generic dasha information**:

1. **Dasha Duration Information:**
   - "Mercury mahadasha is 17 years" - general information
   - "Saturn mahadasha is 19 years" - general information
   - "Mars mahadasha is 7 years" - general information
   - "Moon mahadasha is 10 years" - general information

2. **Generic Dasha Effects:**
   - "During Mercury mahadasha, the native becomes fortunate" - generic, no house context
   - "During Saturn mahadasha, strong Saturn gives wealth" - generic, no specific house
   - "During Saturn dasha, one may become a renunciate" - generic, no planet/house link

3. **Missing Planet × House Links:**
   - All flagged items mention dasha and sometimes a planet, but **none** explicitly link a dasha to a specific planet in a specific house
   - Example: "शनि की दशा में संन्यासी हो जाता है" (becomes a renunciate during Saturn dasha) - generic statement, not tied to Saturn in 9th house

---

## Conclusion

**The book does NOT contain explicit Dasha × Planet × House statements.**

This is the **correct outcome** for Phase 3:
- ✅ No rules extracted (precision over volume)
- ✅ No false rules created
- ✅ Base Planet × House rules remain intact (84 rules)
- ✅ System ready for future dasha rules if found in other books

---

## Technical Analysis

### Why These Are Not Extractable:

1. **Generic Dasha Information:**
   - Dasha durations (e.g., "17 years", "19 years") are reference knowledge, not activation rules
   - General effects like "becomes fortunate" are not tied to specific placements

2. **Missing Explicit Links:**
   - Statements like "During X dasha, Y happens" don't specify which planet in which house is being activated
   - No clear temporal activation of existing Planet × House base rules

3. **Reference Knowledge vs. Rules:**
   - Dasha durations and general characteristics are **reference knowledge**
   - They inform understanding but don't create engine-expressible time-activation rules

---

## Recommendations

1. **Do NOT extract any dasha rules from lalkitab** - none meet explicit criteria
2. **Keep Phase 1 rules frozen** - 84 Planet × House rules remain the foundation
3. **Future books:** Re-run scanner on new books to check for explicit dasha rules
4. **Manual review:** If future scans find candidates, manually verify before extraction

---

## Supported Dasha Operators

The engine supports:
- `dasha_running`: Checks if a specific planet's mahadasha/antardasha is running
  - Parameters: `level` (mahadasha/antardasha), `planet_in` (array of planet IDs)
  - Planet IDs: Sun=1, Moon=2, Mars=3, Mercury=4, Jupiter=5, Venus=6, Saturn=7, Rahu=8, Ketu=9

Example supported structure:
```json
{
  "condition_tree": {
    "all": [
      { "planet_in_house": { "planet_in": ["JUPITER"], "house_in": [10] } },
      { "dasha_running": { "level": "mahadasha", "planet_in": [5] } }
    ]
  }
}
```

---

## Technical Notes

- Scanner script: `scripts/book/scanDashaRules.js`
- Scan output: `astrobooks_processed/lalkitab/dasha.scan.v1.json`
- Base rules: `astrobooks_processed/lalkitab/datasets/rules.v1.json` (84 rules)

---

**Phase 3 Status: COMPLETE - No action required**

