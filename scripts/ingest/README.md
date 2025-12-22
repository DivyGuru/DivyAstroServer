# Database Ingestion Layer for Curated Astrology Rules

This directory contains scripts and migrations for ingesting curated astrology rules from the book extraction pipeline into the database.

---

## Overview

The ingestion layer stores curated rules from `astrobooks_processed/<bookId>/datasets/` into structured database tables. This is a **data storage layer only** - no astrology logic, narrative formatting, or engine expansion happens here.

---

## Database Schema

### Schema Extension

The ingestion layer **extends** the existing `rules` table in `schema_divyastrodb.sql` with additional columns:

1. **Extended `rules` table** - Stores all rule types
   - **Existing columns**: `id`, `rule_group_id`, `name`, `condition_tree`, `effect_json`, etc.
   - **New columns added**:
     - `rule_id` - Unique identifier from book extraction (e.g., "lalkitab__lalkitab_u0035")
     - `rule_type` - BASE | STRENGTH | YOGA | TRANSIT | DASHA | NAKSHATRA
     - `base_rule_ids` - JSONB array of rule_ids this rule modifies (for modifiers)
     - `canonical_meaning` - Human-readable meaning
     - `engine_status` - READY | PENDING_OPERATOR (default: READY)
     - `source_book` - Book identifier (e.g., "lalkitab")
     - `source_unit_id` - Source unit from book (e.g., "lalkitab_u0035")
     - `extraction_phase` - PHASE1 | PHASE2 | PHASE3 | PHASE4 | PHASE5
     - `planet`, `strength_state` - For STRENGTH rules
     - `yoga_name`, `planets` - For YOGA rules

2. **`rule_engine_requirements`** - Tracks missing operators
   - `rule_id` (FK)
   - `missing_operator` - e.g., "planet_strength_state", "yoga_present"
   - `notes` - Additional context

3. **`rule_provenance`** - Tracks source and extraction phase
   - `rule_id` (FK)
   - `book_name` - Book identifier
   - `extraction_phase` - PHASE1 | PHASE2 | PHASE3 | PHASE4 | PHASE5
   - `confidence_level` - low | medium | high

4. **`rule_ingestion_log`** - Logs each ingestion run
   - `book_id` - Book identifier
   - `ingestion_timestamp` - When ingestion ran
   - `rules_ingested` - Count of successfully ingested rules
   - `rules_skipped` - Count of skipped rules (errors)
   - `status` - success | partial | failed

---

## Setup

### 1. Run Migration

**First, ensure the base schema is applied:**
```bash
psql -U <user> -d <database> -f schema_divyastrodb.sql
```

**Then, apply the extension migration:**
```bash
psql -U <user> -d <database> -f migrations/002_extend_rules_table_for_book_ingestion.sql
```

Or if using the connection from `config/db.js`:

```bash
node -e "import('./config/db.js').then(async ({default: pool}) => { const fs = require('fs'); const sql = fs.readFileSync('migrations/002_extend_rules_table_for_book_ingestion.sql', 'utf8'); await pool.query(sql); console.log('✅ Migration complete'); process.exit(0); })"
```

### 2. Verify Extension

```sql
-- Check that new columns exist on rules table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rules' 
AND column_name IN ('rule_type', 'engine_status', 'base_rule_ids', 'source_book', 'extraction_phase');

-- Check helper tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('rule_engine_requirements', 'rule_provenance', 'rule_ingestion_log');
```

---

## Usage

### Ingest a Book

```bash
npm run ingest -- lalkitab
```

Or directly:

```bash
node scripts/ingest/ingestBookRules.js lalkitab
```

### What Gets Ingested

The script ingests rules from:

1. **Phase 1 (BASE rules)**: `astrobooks_processed/<bookId>/datasets/rules.v1.json`
   - Planet × House base rules (84 rules for lalkitab)

2. **Phase 5 (STRENGTH/YOGA rules)**: `astrobooks_processed/<bookId>/strength_yoga.rules.v1.json`
   - Strength state rules (86 rules for lalkitab)
   - Yoga combination rules (6 rules for lalkitab)

**Note**: Phases 2, 3, and 4 had 0 rules extracted for lalkitab, so they are not ingested. The schema supports them for future books.

---

## Engine Status

Rules are automatically marked with `engine_status`:

- **READY**: Rule is fully executable with current engine operators
- **PENDING_OPERATOR**: Rule requires engine enhancement (e.g., strength state checking, yoga_present operator)

### Current Limitations

Rules using `generic_condition` as placeholder are marked as `PENDING_OPERATOR`. These include:
- Strength state rules (EXALTED, DEBILITATED, etc.) - need `planet_strength` with state parameter
- Yoga rules - need `yoga_present` operator

These rules are stored in the database but won't execute until the engine is enhanced.

---

## Idempotency

The ingestion script is **idempotent** - safe to run multiple times:

- Existing rules are **updated** (not duplicated)
- New rules are **inserted**
- Provenance and engine requirements are **upserted**

This allows:
- Re-running ingestion after dataset updates
- Fixing ingestion errors without data loss
- Incremental ingestion of new books

---

## Validation

Before inserting, the script validates:

- ✅ `rule_id` uniqueness
- ✅ `condition_tree` is valid JSON
- ✅ `effect_json` is valid JSON
- ✅ English-only text (preserved from curation)
- ✅ Base rule linkage (for modifier rules)

---

## Querying Rules

### Get all BASE rules for a book

```sql
SELECT rule_id, canonical_meaning, engine_status
FROM rules
WHERE rule_type = 'BASE' AND source_book = 'lalkitab';
```

### Get all executable rules

```sql
SELECT rule_id, rule_type, canonical_meaning
FROM rules
WHERE engine_status = 'READY';
```

### Get rules requiring engine enhancement

```sql
SELECT r.rule_id, r.rule_type, req.missing_operator, req.notes
FROM rules r
JOIN rule_engine_requirements req ON r.id = req.rule_id
WHERE r.engine_status = 'PENDING_OPERATOR';
```

### Get rules with provenance

```sql
SELECT r.rule_id, r.rule_type, p.extraction_phase, p.confidence_level
FROM rules r
JOIN rule_provenance p ON r.id = p.rule_id
WHERE r.source_book = 'lalkitab';
```

### Get ingestion history

```sql
SELECT book_id, ingestion_timestamp, rules_ingested, rules_skipped, status
FROM rule_ingestion_log
ORDER BY ingestion_timestamp DESC;
```

---

## Troubleshooting

### Migration Fails

- Check PostgreSQL version (requires 9.5+ for JSONB)
- Verify database connection
- Check for existing tables (migration uses IF NOT EXISTS)

### Ingestion Fails

- Verify dataset files exist in `astrobooks_processed/<bookId>/`
- Check database connection
- Review error messages in console output
- Check `astro_rule_ingestion_log` for details

### Duplicate Rules

- Ingestion is idempotent - duplicates are updated, not inserted
- If you see duplicates, check `rule_id` uniqueness in source files

### Missing Base Rules

- Modifier rules (STRENGTH, YOGA, etc.) must reference existing BASE rules
- If base rules are missing, ingestion will still succeed but base_rule_ids will be empty
- Check `base_rule_ids` array in database to verify linkage

---

## Future Enhancements

1. **Engine Operator Support**
   - Add `planet_strength` with state parameter (EXALTED, DEBILITATED, etc.)
   - Add `yoga_present` operator for checking specific yogas
   - Update `engine_status` to READY when operators are added

2. **Additional Rule Types**
   - Support TRANSIT rules (Phase 4) when extracted
   - Support DASHA rules (Phase 3) when extracted
   - Support NAKSHATRA rules (Phase 2) when extracted

3. **Remedies Ingestion**
   - Add remedies ingestion script (if remedies.v1.json exists)
   - Link remedies to rules via rule_id

---

## Files

- **Base Schema**: `schema_divyastrodb.sql` (must be applied first)
- **Extension Migration**: `migrations/002_extend_rules_table_for_book_ingestion.sql`
- **Ingestion Script**: `scripts/ingest/ingestBookRules.js`
- **This README**: `scripts/ingest/README.md`

**Note**: The old migration file `001_create_astro_rules_tables.sql` is deprecated. Use `002_extend_rules_table_for_book_ingestion.sql` instead, which extends the existing schema.

---

**Status**: Ready for ingestion of curated rules from book extraction pipeline.

