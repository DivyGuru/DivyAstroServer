-- Migration: Add Universal Knowledge Aware Fields
-- Date: 2025-12-23
-- Safe to run multiple times (uses IF NOT EXISTS)

-- =========================
-- 1. ADD NEW COLUMNS TO rules TABLE
-- =========================

-- Rule nature: EXECUTABLE | ADVISORY | OBSERVATIONAL
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS rule_nature VARCHAR(20) DEFAULT 'ADVISORY';

-- Execution status: READY | PENDING | RAW
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS execution_status VARCHAR(20) DEFAULT 'PENDING';

-- Raw rule type from extraction (direct, warning, behavioral, etc.)
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS raw_rule_type VARCHAR(30);

-- Confidence level: HIGH | MEDIUM | LOW
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS confidence_level VARCHAR(10) DEFAULT 'MEDIUM';

-- =========================
-- 2. CREATE INDEXES
-- =========================

CREATE INDEX IF NOT EXISTS idx_rules_rule_nature ON rules (rule_nature)
WHERE rule_nature IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rules_execution_status ON rules (execution_status)
WHERE execution_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rules_confidence_level ON rules (confidence_level)
WHERE confidence_level IS NOT NULL;

-- =========================
-- 3. COMMENTS
-- =========================

COMMENT ON COLUMN rules.rule_nature IS 
  'Nature of rule: EXECUTABLE (can be evaluated by engine), ADVISORY (guidance/behavioral), OBSERVATIONAL (philosophical/observational)';

COMMENT ON COLUMN rules.execution_status IS 
  'Execution readiness: READY (can execute now), PENDING (needs setup), RAW (knowledge only, not executable)';

COMMENT ON COLUMN rules.raw_rule_type IS 
  'Original rule type from extraction: direct, warning, behavioral, situational, symbolic, observation, philosophical';

COMMENT ON COLUMN rules.confidence_level IS 
  'Confidence in extraction: HIGH (clear), MEDIUM (some ambiguity), LOW (vague but astrological)';

