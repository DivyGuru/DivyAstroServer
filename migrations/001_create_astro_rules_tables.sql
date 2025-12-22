-- DEPRECATED: This migration is no longer used.
-- Use migrations/002_extend_rules_table_for_book_ingestion.sql instead.
-- 
-- This file extended the schema by creating NEW tables (astro_rules, etc.).
-- The correct approach is to EXTEND the existing rules table in schema_divyastrodb.sql.
-- 
-- Migration: Create tables for curated astrology rules ingestion
-- Safe to run multiple times (uses IF NOT EXISTS)
-- Date: 2025-12-21
-- Status: DEPRECATED - DO NOT USE

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
      'PENDING_OPERATOR'    -- Rule requires engine enhancement (e.g., strength state checking, yoga_present)
    );
  END IF;
END$$;

-- =========================
-- 2. MAIN RULES TABLE
-- =========================

CREATE TABLE IF NOT EXISTS astro_rules (
    id                  BIGSERIAL PRIMARY KEY,
    rule_id             TEXT UNIQUE NOT NULL,  -- e.g., "lalkitab__lalkitab_u0035", "SUN_DEBILITATED"
    rule_type           astro_rule_type NOT NULL,
    
    -- Base rule linkage (for modifiers like STRENGTH, YOGA, TRANSIT, DASHA, NAKSHATRA)
    base_rule_ids        TEXT[],  -- Array of rule_ids this rule modifies
    
    -- Rule structure
    condition_tree      JSONB NOT NULL,  -- Engine condition tree
    effect_json         JSONB NOT NULL, -- Effect metadata and outcome text
    
    -- Human-readable meaning
    canonical_meaning   TEXT,
    
    -- Engine status
    engine_status       engine_status NOT NULL DEFAULT 'READY',
    
    -- Source tracking
    source_book         TEXT NOT NULL,  -- e.g., "lalkitab"
    source_unit_id      TEXT,          -- e.g., "lalkitab_u0035"
    
    -- Versioning
    version             INTEGER DEFAULT 1,
    
    -- Metadata
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    
    -- Additional fields for specific rule types
    planet              TEXT,           -- For STRENGTH rules
    strength_state      TEXT,           -- For STRENGTH rules (EXALTED, DEBILITATED, etc.)
    yoga_name           TEXT,           -- For YOGA rules
    planets             TEXT[],         -- For YOGA rules (array of planet names)
    
    CONSTRAINT chk_astro_rules_base_rule_ids
      CHECK (
        (rule_type = 'BASE' AND (base_rule_ids IS NULL OR array_length(base_rule_ids, 1) = 0)) OR
        (rule_type != 'BASE' AND base_rule_ids IS NOT NULL AND array_length(base_rule_ids, 1) > 0)
      )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_astro_rules_rule_id ON astro_rules (rule_id);
CREATE INDEX IF NOT EXISTS idx_astro_rules_type ON astro_rules (rule_type);
CREATE INDEX IF NOT EXISTS idx_astro_rules_source_book ON astro_rules (source_book);
CREATE INDEX IF NOT EXISTS idx_astro_rules_engine_status ON astro_rules (engine_status);
CREATE INDEX IF NOT EXISTS idx_astro_rules_base_rule_ids ON astro_rules USING GIN (base_rule_ids);

-- =========================
-- 3. ENGINE REQUIREMENTS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS astro_rule_engine_requirements (
    id                  BIGSERIAL PRIMARY KEY,
    rule_id             TEXT NOT NULL REFERENCES astro_rules(rule_id) ON DELETE CASCADE,
    missing_operator     TEXT NOT NULL,  -- e.g., "planet_strength_state", "yoga_present"
    notes                TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(rule_id, missing_operator)
);

CREATE INDEX IF NOT EXISTS idx_astro_rule_engine_requirements_rule_id 
  ON astro_rule_engine_requirements (rule_id);

-- =========================
-- 4. PROVENANCE TABLE
-- =========================

CREATE TABLE IF NOT EXISTS astro_rule_provenance (
    id                  BIGSERIAL PRIMARY KEY,
    rule_id             TEXT NOT NULL REFERENCES astro_rules(rule_id) ON DELETE CASCADE,
    book_name           TEXT NOT NULL,
    extraction_phase    TEXT NOT NULL,  -- e.g., "PHASE1", "PHASE5"
    confidence_level    TEXT,            -- e.g., "low", "medium", "high"
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(rule_id, book_name, extraction_phase)
);

CREATE INDEX IF NOT EXISTS idx_astro_rule_provenance_rule_id 
  ON astro_rule_provenance (rule_id);
CREATE INDEX IF NOT EXISTS idx_astro_rule_provenance_book 
  ON astro_rule_provenance (book_name);

-- =========================
-- 5. INGESTION LOG TABLE
-- =========================

CREATE TABLE IF NOT EXISTS astro_rule_ingestion_log (
    id                  BIGSERIAL PRIMARY KEY,
    book_id             TEXT NOT NULL,
    ingestion_timestamp  TIMESTAMPTZ DEFAULT NOW(),
    rules_ingested       INTEGER DEFAULT 0,
    rules_skipped       INTEGER DEFAULT 0,
    errors              JSONB,
    status              TEXT NOT NULL,  -- 'success', 'partial', 'failed'
    notes               TEXT
);

CREATE INDEX IF NOT EXISTS idx_astro_rule_ingestion_log_book_id 
  ON astro_rule_ingestion_log (book_id);
CREATE INDEX IF NOT EXISTS idx_astro_rule_ingestion_log_timestamp 
  ON astro_rule_ingestion_log (ingestion_timestamp);

-- =========================
-- 6. COMMENTS
-- =========================

COMMENT ON TABLE astro_rules IS 
  'Stores curated astrology rules from book extraction pipeline. All rule types (BASE, STRENGTH, YOGA, etc.) are stored here.';

COMMENT ON TABLE astro_rule_engine_requirements IS 
  'Tracks which rules require engine enhancements (missing operators). Used for future engine development.';

COMMENT ON TABLE astro_rule_provenance IS 
  'Tracks the source and extraction phase for each rule. Used for auditing and debugging.';

COMMENT ON TABLE astro_rule_ingestion_log IS 
  'Logs each ingestion run for a book. Used for tracking and debugging ingestion issues.';

