# CONTENT-FIRST INGESTION WORKFLOW

## Mandatory Rule

**No rule may enter the database unless its meaning has been semantically understood and rewritten in human English first.**

## Process Overview

### PART A — UNDERSTAND & REWRITE

1. **Read Hindi/Sanskrit source text**
   - Load original text from book chunks
   - Preserve source references (unit_id, chunk_ids, page_numbers)

2. **Understand jyotish intent and context**
   - Parse astrological meaning
   - Identify key concepts
   - Understand cultural/contextual nuances

3. **Rewrite meaning in calm, human English**
   - Remove fear-based language
   - Remove absolute guarantees ("will", "must", "always", "never")
   - Use real-life framing
   - Maintain jyotish accuracy

4. **Output MEANING OBJECTS only**
   - No rules created yet
   - Just understood meanings
   - Store in `meanings.v1.json`

### PART B — STRUCTURE & INGEST

5. **Classify meaning into one of 5 layers**
   - BASE (Planet × House)
   - NAKSHATRA (Planet × House × Nakshatra)
   - DASHA (Time-based activation)
   - TRANSIT (Gochar/Transit triggers)
   - STRENGTH (Exaltation/Debilitation)
   - YOGA (Planet combinations)

6. **Convert meaning into engine-safe rule**
   - Create condition_tree
   - Create effect_json
   - Validate expressibility

7. **Validate expressibility and tone**
   - Check English-only
   - Check for fear language
   - Check for absolute guarantees
   - Verify engine operators exist

8. **Write datasets**
   - `meanings.v1.json` (PART A output)
   - `rules.v1.json` (PART B output)
   - `manifest.v1.json`

9. **ONLY THEN ingest into DB**
   - Database is final destination
   - Never store intermediate Hindi/Sanskrit
   - Never store unclear meanings

## Strict Constraints

- ✅ **English-only storage**: All canonical_meaning and outcome_text must be English
- ✅ **Hindi/Sanskrit never stored**: Original text is reference only, not in DB
- ✅ **Precision > volume**: Discard unclear meanings rather than guessing
- ✅ **DB is final destination**: Never store intermediate data in DB

## Meaning Object Structure

```json
{
  "meaning_id": "bookId__meaning_unitId",
  "source": {
    "book_id": "bookId",
    "unit_id": "unit_id",
    "chunk_ids": ["chunk_id"],
    "page_numbers": [1, 2],
    "original_text": "Hindi/Sanskrit text (reference only)"
  },
  "understood_meaning": {
    "english_rewrite": "Calm, human English description",
    "jyotish_context": "Astrological concept",
    "confidence": "high" | "medium" | "low",
    "notes": "Clarifications"
  },
  "classification": {
    "layer": "BASE" | "NAKSHATRA" | "DASHA" | "TRANSIT" | "STRENGTH" | "YOGA",
    "entities": {
      "planets": ["SUN"],
      "houses": [1],
      "nakshatras": ["ASHWINI"],
      "strength_states": ["EXALTED"],
      "yoga_names": ["RAJA_YOGA"]
    },
    "is_expressible": true,
    "expressibility_notes": "Why expressible"
  },
  "status": "pending" | "ready_for_rule" | "converted_to_rule" | "discarded"
}
```

## Workflow Files

1. **`meanings.v1.json`** (PART A output)
   - All understood meanings
   - Before rule conversion
   - Human-readable English

2. **`rules.v1.json`** (PART B output)
   - Converted from meanings
   - Engine-safe structure
   - Ready for DB ingestion

## Implementation Status

### Current Implementation

- ✅ Workflow structure created
- ✅ Meaning object schema defined
- ✅ Validation functions created
- ⚠️ **Hindi-to-English understanding**: Requires implementation

### Required Implementation

1. **Translation/Understanding Service**
   - Hindi-to-English translation
   - Jyotish context understanding
   - Cultural nuance preservation

2. **Meaning Rewriting Logic**
   - Remove fear language
   - Remove absolute guarantees
   - Calm, human English framing

3. **Rule Conversion Logic**
   - Convert meanings to rules
   - Validate expressibility
   - Create condition_tree and effect_json

## Usage

```bash
# PART A: Understand & Rewrite
node scripts/book/contentFirstIngestion.js <bookId>

# PART B: Convert to Rules (to be implemented)
node scripts/book/convertMeaningsToRules.js <bookId>

# Ingest to DB
npm run ingest -- <bookId>
```

## Examples

### Example 1: BASE Rule

**Source (Hindi):**
```
"गुरु पहले घर में होने से व्यक्ति को ज्ञान, धन और सम्मान मिलता है"
```

**Understood Meaning (English):**
```
"Jupiter in the first house can be associated with learning orientation, 
resource-building opportunities, and social respect. This placement may 
bring constructive guidance and generally supportive personal direction."
```

**Classification:**
- Layer: BASE
- Entities: { planets: ["JUPITER"], houses: [1] }

**Rule:**
- condition_tree: { planet_in_house: { planet_in: ["JUPITER"], house_in: [1] } }
- effect_json: { theme: "general", outcome_text: "..." }

### Example 2: Discarded Meaning

**Source (Hindi):**
```
"मृत्यु योग होगा"
```

**Reason for Discard:**
- Contains fear-based language ("death")
- Cannot be rewritten in calm, human English
- Discarded at PART A stage

## Migration from Old Workflow

For existing books (Lal Kitab, BParasharHoraShastra):

1. Review existing rules
2. Re-understand Hindi/Sanskrit sources
3. Rewrite meanings in calm English
4. Re-classify and re-convert
5. Re-ingest to DB

This ensures all rules follow CONTENT-FIRST principle.

