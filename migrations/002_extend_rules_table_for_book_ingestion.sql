-- Migration: Extend existing rules table for book ingestion pipeline
-- Date: 2025-12-21
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS checks)
-- 
-- This extends the existing schema_divyastrodb.sql schema.
-- DO NOT create new tables - only extend existing ones.

-- =========================
-- 1. ENUM TYPES
-- =========================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'astro_rule_type') THEN
    CREATE TYPE astro_rule_type AS ENUM (
      'BASE',           -- Planet × House base rules (Phase 1)
      'STRENGTH',       -- Planetary strength states (Phase 5)
      'YOGA',           -- Multi-planet combinations (Phase 5)
      'TRANSIT',        -- Transit triggers (Phase 4)
      'DASHA',          -- Dasha activations (Phase 3)
      'NAKSHATRA'       -- Nakshatra refinements (Phase 2)
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'engine_status') THEN
    CREATE TYPE engine_status AS ENUM (
      'READY',              -- Rule is fully executable with current engine
      'PENDING_OPERATOR'    -- Rule requires engine enhancement
    );
  END IF;
END$$;

-- =========================
-- 2. EXTEND EXISTING rules TABLE
-- =========================

-- Add rule_type column (nullable for backward compatibility)
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS rule_type astro_rule_type;

-- Add engine_status column (default READY for backward compatibility)
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS engine_status engine_status DEFAULT 'READY';

-- Add base_rule_ids column (JSONB array for modifier rules)
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS base_rule_ids JSONB DEFAULT '[]'::jsonb;

-- Add source_book column (for tracking book origin)
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS source_book TEXT;

-- Add extraction_phase column (PHASE1, PHASE2, etc.)
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS extraction_phase TEXT;

-- Add source_unit_id column (for tracking source unit from book)
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS source_unit_id TEXT;

-- Add canonical_meaning column (human-readable meaning from curation)
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS canonical_meaning TEXT;

-- Add rule_id column (unique identifier from book extraction, e.g., "lalkitab__lalkitab_u0035")
-- This is separate from the auto-incrementing `id` column
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS rule_id TEXT;

-- Add specific fields for STRENGTH rules
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS planet TEXT;

ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS strength_state TEXT;

-- Add specific fields for YOGA rules
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS yoga_name TEXT;

ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS planets TEXT[];

-- =========================
-- 3. INDEXES
-- =========================

-- Index for rule_id lookups (if rule_id is used as primary identifier)
CREATE INDEX IF NOT EXISTS idx_rules_rule_id ON rules (rule_id)
WHERE rule_id IS NOT NULL;

-- Index for rule_type filtering
CREATE INDEX IF NOT EXISTS idx_rules_rule_type ON rules (rule_type)
WHERE rule_type IS NOT NULL;

-- Index for engine_status filtering
CREATE INDEX IF NOT EXISTS idx_rules_engine_status ON rules (engine_status);

-- Index for source_book filtering
CREATE INDEX IF NOT EXISTS idx_rules_source_book ON rules (source_book)
WHERE source_book IS NOT NULL;

-- Index for extraction_phase filtering
CREATE INDEX IF NOT EXISTS idx_rules_extraction_phase ON rules (extraction_phase)
WHERE extraction_phase IS NOT NULL;

-- GIN index for base_rule_ids array lookups
CREATE INDEX IF NOT EXISTS idx_rules_base_rule_ids_gin ON rules USING GIN (base_rule_ids)
WHERE base_rule_ids IS NOT NULL AND jsonb_array_length(base_rule_ids) > 0;

-- =========================
-- 4. ENGINE REQUIREMENTS TRACKING TABLE
-- =========================
-- This is a lightweight helper table for tracking missing operators.
-- It's separate from rules table to avoid over-normalization.

CREATE TABLE IF NOT EXISTS rule_engine_requirements (
    id                  BIGSERIAL PRIMARY KEY,
    rule_id             BIGINT NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
    missing_operator     TEXT NOT NULL,  -- e.g., "planet_strength_state", "yoga_present"
    notes                TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(rule_id, missing_operator)
);

CREATE INDEX IF NOT EXISTS idx_rule_engine_requirements_rule_id 
  ON rule_engine_requirements (rule_id);

CREATE INDEX IF NOT EXISTS idx_rule_engine_requirements_operator 
  ON rule_engine_requirements (missing_operator);

-- =========================
-- 5. PROVENANCE TRACKING TABLE
-- =========================
-- Tracks source and extraction phase for each rule.
-- Separate table to support multiple provenance records per rule if needed.

CREATE TABLE IF NOT EXISTS rule_provenance (
    id                  BIGSERIAL PRIMARY KEY,
    rule_id             BIGINT NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
    book_name           TEXT NOT NULL,
    extraction_phase    TEXT NOT NULL,  -- e.g., "PHASE1", "PHASE5"
    confidence_level    TEXT,            -- e.g., "low", "medium", "high"
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(rule_id, book_name, extraction_phase)
);

CREATE INDEX IF NOT EXISTS idx_rule_provenance_rule_id 
  ON rule_provenance (rule_id);

CREATE INDEX IF NOT EXISTS idx_rule_provenance_book 
  ON rule_provenance (book_name);

-- =========================
-- 6. INGESTION LOG TABLE
-- =========================
-- Logs each ingestion run for tracking and debugging.

CREATE TABLE IF NOT EXISTS rule_ingestion_log (
    id                  BIGSERIAL PRIMARY KEY,
    book_id             TEXT NOT NULL,
    ingestion_timestamp  TIMESTAMPTZ DEFAULT NOW(),
    rules_ingested       INTEGER DEFAULT 0,
    rules_skipped       INTEGER DEFAULT 0,
    errors              JSONB,
    status              TEXT NOT NULL,  -- 'success', 'partial', 'failed'
    notes               TEXT
);

CREATE INDEX IF NOT EXISTS idx_rule_ingestion_log_book_id 
  ON rule_ingestion_log (book_id);

CREATE INDEX IF NOT EXISTS idx_rule_ingestion_log_timestamp 
  ON rule_ingestion_log (ingestion_timestamp);

-- =========================
-- 7. COMMENTS
-- =========================

COMMENT ON COLUMN rules.rule_type IS 
  'Type of rule: BASE (Planet × House), STRENGTH, YOGA, TRANSIT, DASHA, NAKSHATRA';

COMMENT ON COLUMN rules.engine_status IS 
  'Engine execution status: READY (executable) or PENDING_OPERATOR (requires enhancement)';

COMMENT ON COLUMN rules.base_rule_ids IS 
  'JSONB array of rule_ids that this rule modifies (for STRENGTH, YOGA, etc.)';

COMMENT ON COLUMN rules.source_book IS 
  'Source book identifier (e.g., "lalkitab")';

COMMENT ON COLUMN rules.extraction_phase IS 
  'Extraction phase: PHASE1, PHASE2, PHASE3, PHASE4, PHASE5';

COMMENT ON COLUMN rules.rule_id IS 
  'Unique rule identifier from book extraction (e.g., "lalkitab__lalkitab_u0035"). Separate from auto-incrementing id.';

COMMENT ON TABLE rule_engine_requirements IS 
  'Tracks which rules require engine enhancements (missing operators). Used for future engine development.';

COMMENT ON TABLE rule_provenance IS 
  'Tracks the source and extraction phase for each rule. Used for auditing and debugging.';

COMMENT ON TABLE rule_ingestion_log IS 
  'Logs each ingestion run for a book. Used for tracking and debugging ingestion issues.';

