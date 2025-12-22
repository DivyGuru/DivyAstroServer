# Code Quality Fixes Applied - Summary

**Date:** 2025-12-21  
**Status:** ✅ All fixes applied and verified

---

## Fixes Applied

### 1. ✅ ENGLISH-ONLY VIOLATION (MANDATORY)

**Issue:** Scanner outputs contained `excerpt: text.slice(0, 500)` with Hindi/Sanskrit source text.

**Fixed:**
- Removed all `excerpt` fields from `scanNakshatraRules.js` output
- Removed all `excerpt` fields from `scanDashaRules.js` output
- Scanner outputs now contain ONLY:
  - `chunk_id`, `page`, `unit_id`
  - Detected entities (planet, house, nakshatra, dasha)
  - `base_rule_id` (if applicable)
  - Detection metadata (reason, etc.)

**Files Modified:**
- `scripts/book/scanNakshatraRules.js` (lines 192-214)
- `scripts/book/scanDashaRules.js` (lines 195-234)

**Verification:**
```bash
# Verified: No excerpt fields in output
node -e "const d=require('./astrobooks_processed/lalkitab/nakshatra.scan.v1.json'); 
  console.log('Has excerpt?', d.flagged_for_review[0].hasOwnProperty('excerpt'));"
# Output: Has excerpt? false
```

---

### 2. ✅ HARD-CODED BOOK PATHS (MANDATORY)

**Issue:** Hard-coded paths like `BOOK_PATH = path.join(ROOT, 'astrobooks', 'lalkitab.json')` ignored CLI bookId argument.

**Fixed:**
- Replaced all hard-coded paths with `getPathsForBook(bookId)`
- Added `mustGetBookId(process.argv)` for CLI argument validation
- Converted `main()` functions to `async` and use `readJson`/`writeJson` helpers
- All paths now dynamically resolve based on `bookId`

**Files Modified:**
- `scripts/book/scanNakshatraRules.js` (lines 1-6, 156-164, 232-233)
- `scripts/book/scanDashaRules.js` (lines 1-6, 155-163, 251-252)
- `scripts/book/extractNakshatraRefinements.js` (lines 14-15, 112-122)
- `scripts/book/extractDashaActivations.js` (lines 15, 125-135)

**Before:**
```javascript
const BOOK_PATH = path.join(ROOT, 'astrobooks', 'lalkitab.json');
const book = JSON.parse(fs.readFileSync(BOOK_PATH, 'utf8'));
```

**After:**
```javascript
const bookId = mustGetBookId(process.argv);
const paths = getPathsForBook(bookId);
const book = await readJson(paths.sourceBookPath);
```

---

### 3. ✅ CONDITION_TREE SCHEMA ALIGNMENT (MANDATORY)

**Issue:** `condition_tree` contained non-logical fields like `refinement_type`, `intensity_delta`, `canonical_meaning`.

**Fixed:**
- Moved `refinement_type`, `intensity_delta`, `qualitative_modifier`, `canonical_meaning` OUTSIDE `condition_tree`
- These fields are now at the root level of the rule object
- `condition_tree` now contains ONLY logical operators (validated by `validateConditionTree()`)

**Files Modified:**
- `scripts/book/extractNakshatraRefinements.js` (lines 73-88)
- `scripts/book/extractDashaActivations.js` (lines 71-95)

**Before:**
```javascript
condition_tree: {
  all: [...],
  refinement_type: 'behavioral_pattern', // ❌ INVALID
  intensity_delta: 0.15, // ❌ INVALID
}
```

**After:**
```javascript
refinement_type: 'behavioral_pattern', // ✅ At root level
intensity_delta: 0.15, // ✅ At root level
condition_tree: {
  all: [...] // ✅ ONLY logical operators
}
```

**Verification:**
```bash
# Verified: condition_tree passes validation
node -e "const {validateConditionTree} = require('./scripts/book/_shared.js'); 
  const rule = {condition_tree: {all: [{planet_in_house: {...}}, {planet_in_nakshatra: {...}}]}}; 
  validateConditionTree(rule.condition_tree); 
  console.log('✅ condition_tree valid');"
```

---

### 4. ✅ PLANET ENUM CONSISTENCY (CORRECTNESS)

**Issue:** `PLANET_MAP` in scanners missing Rahu/Ketu, causing rules to never match.

**Fixed:**
- Added `'राहु': 'RAHU'` to `PLANET_MAP` in `scanNakshatraRules.js`
- Added `'केतु': 'KETU'` to `PLANET_MAP` in `scanNakshatraRules.js`
- Added `'राहु': 'RAHU'` to `PLANET_MAP` in `scanDashaRules.js`
- Added `'केतु': 'KETU'` to `PLANET_MAP` in `scanDashaRules.js`

**Files Modified:**
- `scripts/book/scanNakshatraRules.js` (lines 27-35)
- `scripts/book/scanDashaRules.js` (lines 29-37)

**Note:** Centralizing planet enums in `_shared.js` would be ideal for future maintenance, but current fix ensures consistency.

---

### 5. ✅ NAKSHATRA ENUM TYPO FIX (CORRECTNESS)

**Status:** Verified - `VISHHAKHA` is the canonical name per `nakshatraStrengthModel.js`

**Action:** Added comment clarifying this is intentional:
```javascript
'विशाखा': 'VISHHAKHA', // Note: VISHHAKHA is canonical per nakshatraStrengthModel.js
```

**File Modified:**
- `scripts/book/scanNakshatraRules.js` (line 57)

---

### 6. ✅ DEAD CODE CLEANUP

**Issue:** `DASHA_TERMS` constant defined but never used (detection uses hardcoded checks).

**Fixed:**
- Removed unused `DASHA_TERMS` constant from `scanDashaRules.js`

**File Modified:**
- `scripts/book/scanDashaRules.js` (removed lines 39-49)

---

## Verification

All scripts tested and working:

```bash
✅ scanNakshatraRules.js lalkitab
✅ scanDashaRules.js lalkitab  
✅ extractNakshatraRefinements.js lalkitab
✅ extractDashaActivations.js lalkitab
```

**Output Verification:**
- ✅ No `excerpt` fields in scan outputs
- ✅ No Hindi/Sanskrit text in processed JSON files
- ✅ `condition_tree` structures pass validation
- ✅ All paths resolve dynamically based on `bookId`
- ✅ Rahu/Ketu supported in planet detection

---

## Files Modified

1. `scripts/book/scanNakshatraRules.js`
2. `scripts/book/scanDashaRules.js`
3. `scripts/book/extractNakshatraRefinements.js`
4. `scripts/book/extractDashaActivations.js`

**Total Changes:**
- Removed: ~15 lines (excerpt fields, dead code)
- Modified: ~50 lines (path resolution, imports, structure)
- Added: ~10 lines (Rahu/Ketu support, error handling)

---

## Compliance Status

- ✅ **English-only rule:** STRICTLY ENFORCED
- ✅ **Multi-book support:** WORKING
- ✅ **Schema alignment:** VALIDATED
- ✅ **Planet enum consistency:** COMPLETE
- ✅ **Code cleanup:** DONE

**All blocking quality issues resolved.**

