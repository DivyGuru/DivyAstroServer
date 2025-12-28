-- DivyAstro Prediction DB schema
-- Safe to run multiple times (uses IF NOT EXISTS)

-- =========================
-- 1. ENUM TYPES
-- =========================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prediction_scope') THEN
    CREATE TYPE prediction_scope AS ENUM (
      'hourly',
      'choghadiya',
      'daily',
      'weekly',
      'monthly',
      'yearly',
      'mahadasha',
      'antardasha',
      'pratyantardasha',
      'life_theme'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rule_category') THEN
    CREATE TYPE rule_category AS ENUM (
      'prediction',
      'yoga_detection',
      'dosha_detection',
      'remedy_suggestion',
      'meta'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'condition_logic_op') THEN
    CREATE TYPE condition_logic_op AS ENUM ('AND', 'OR');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prediction_theme') THEN
    CREATE TYPE prediction_theme AS ENUM (
      'money', 'career', 'relationship', 'health', 'spirituality',
      'general', 'travel', 'education', 'family'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prediction_status') THEN
    CREATE TYPE prediction_status AS ENUM (
      'pending', 'generated', 'error'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'remedy_type') THEN
    CREATE TYPE remedy_type AS ENUM (
      'mantra',
      'meditation',
      'donation',
      'feeding_beings',
      'fast',
      'puja'
    );
  END IF;
END$$;

-- =========================
-- 2. USER MANAGEMENT
-- =========================

CREATE TABLE IF NOT EXISTS app_users (
    id              BIGSERIAL PRIMARY KEY,
    firebase_uid    TEXT UNIQUE NOT NULL,
    email           TEXT,
    phone           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_firebase_uid ON app_users (firebase_uid);

-- =========================
-- 3. CORE TIME WINDOW TABLES
-- =========================

CREATE TABLE IF NOT EXISTS prediction_windows (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    chart_id            BIGINT NOT NULL,

    scope               prediction_scope NOT NULL,

    -- time-based scopes:
    start_at            TIMESTAMPTZ,
    end_at              TIMESTAMPTZ,

    -- dashā-based scopes:
    dasha_level         SMALLINT,
    dasha_id            BIGINT,

    -- extra tags for choghadiya etc.
    sub_scope_code      TEXT,
    timezone            TEXT NOT NULL,

    -- performance / caching flags
    is_processed        BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_prediction_windows_time_fields
    CHECK (
      (scope IN ('hourly','choghadiya','daily','weekly','monthly','yearly')
          AND start_at IS NOT NULL AND end_at IS NOT NULL)
      OR
      (scope IN ('mahadasha','antardasha','pratyantardasha','life_theme'))
    )
);

-- =========================
-- 3. ASTRO CONTEXT SNAPSHOTS
-- =========================

CREATE TABLE IF NOT EXISTS astro_state_snapshots (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    chart_id        BIGINT NOT NULL,
    window_id       BIGINT UNIQUE REFERENCES prediction_windows(id) ON DELETE CASCADE,

    -- high-level info
    lagna_sign      SMALLINT,
    moon_sign       SMALLINT,
    moon_nakshatra  SMALLINT,
    running_mahadasha_planet   SMALLINT,
    running_antardasha_planet  SMALLINT,
    running_pratyantardasha_planet SMALLINT,
    running_sookshma_planet    SMALLINT,
    running_sookshma_start     TIMESTAMPTZ,
    running_sookshma_end       TIMESTAMPTZ,

    -- planets, houses, yogs, dosh, transit sab ek hi JSON me:
    planets_state   JSONB,
    houses_state    JSONB,
    yogas_state     JSONB,
    doshas_state    JSONB,
    transits_state  JSONB,

    -- strength & scoring:
    overall_benefic_score   NUMERIC,
    overall_malefic_score   NUMERIC,

    computed_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Backward-compatible migration (safe if columns already exist)
ALTER TABLE IF EXISTS astro_state_snapshots
  ADD COLUMN IF NOT EXISTS running_sookshma_planet SMALLINT;
ALTER TABLE IF EXISTS astro_state_snapshots
  ADD COLUMN IF NOT EXISTS running_sookshma_start TIMESTAMPTZ;
ALTER TABLE IF EXISTS astro_state_snapshots
  ADD COLUMN IF NOT EXISTS running_sookshma_end TIMESTAMPTZ;

-- =========================
-- 4. KNOWLEDGE BASE / RULES
-- =========================

CREATE TABLE IF NOT EXISTS rule_groups (
    id              BIGSERIAL PRIMARY KEY,
    code            TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    category        rule_category NOT NULL,
    description     TEXT,
    priority        INTEGER DEFAULT 0,
    version         INTEGER DEFAULT 1,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS text_templates (
    id              BIGSERIAL PRIMARY KEY,
    code            TEXT UNIQUE NOT NULL,
    theme           prediction_theme NOT NULL,
    scopes          prediction_scope[] NOT NULL,
    default_language    TEXT NOT NULL DEFAULT 'hi',
    tone            TEXT,
    template_body   TEXT NOT NULL,
    created_by      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rules (
    id                  BIGSERIAL PRIMARY KEY,
    rule_group_id       BIGINT NOT NULL REFERENCES rule_groups(id) ON DELETE CASCADE,

    name                TEXT NOT NULL,
    description         TEXT,
    priority            INTEGER DEFAULT 0,

    applicable_scopes   prediction_scope[] NOT NULL,
    min_score           NUMERIC DEFAULT 0,
    max_score           NUMERIC DEFAULT 1,

    condition_logic     condition_logic_op DEFAULT 'AND',
    condition_tree      JSONB NOT NULL,

    effect_json         JSONB NOT NULL,
    base_weight         NUMERIC DEFAULT 1.0,

    template_id         BIGINT REFERENCES text_templates(id),

    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_rules_score_range
    CHECK (min_score <= max_score)
);

-- Attach problem taxonomy points to rules (authoring layer)
ALTER TABLE IF NOT EXISTS rules
  ADD COLUMN IF NOT EXISTS point_code TEXT;

-- Variant code for authoring-level idempotency and diagnostics
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS variant_code TEXT;

CREATE INDEX IF NOT EXISTS idx_rules_point_variant
ON rules (point_code, variant_code);

CREATE TABLE IF NOT EXISTS text_template_localizations (
    id              BIGSERIAL PRIMARY KEY,
    template_id     BIGINT NOT NULL REFERENCES text_templates(id) ON DELETE CASCADE,
    language_code   TEXT NOT NULL,
    localized_body  TEXT NOT NULL,
    UNIQUE(template_id, language_code)
);

-- =========================
-- 5. SCRIPTURES / SNIPPETS
-- =========================

CREATE TABLE IF NOT EXISTS scripture_sources (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    author          TEXT,
    edition         TEXT,
    notes           TEXT
);

CREATE TABLE IF NOT EXISTS knowledge_snippets (
    id                      BIGSERIAL PRIMARY KEY,
    source_id               BIGINT REFERENCES scripture_sources(id),
    location_ref            TEXT,
    original_text           TEXT NOT NULL,
    normalized_summary      TEXT,
    tags                    TEXT[],
    related_rule_group_id   BIGINT REFERENCES rule_groups(id),
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- 6. PREDICTIONS
-- =========================

CREATE TABLE IF NOT EXISTS predictions (
    id                  BIGSERIAL PRIMARY KEY,
    window_id           BIGINT NOT NULL REFERENCES prediction_windows(id) ON DELETE CASCADE,
    user_id             BIGINT NOT NULL,
    chart_id            BIGINT NOT NULL,

    scope               prediction_scope NOT NULL,

    status              prediction_status DEFAULT 'pending',
    language_code       TEXT NOT NULL DEFAULT 'hi',

    summary_json        JSONB,
    short_summary       TEXT,
    final_text          TEXT,

    highlight_on_home   BOOLEAN DEFAULT FALSE,

    generated_by        TEXT,
    generated_at        TIMESTAMPTZ,
    error_message       TEXT,

    CONSTRAINT uq_predictions_window_language
    UNIQUE (window_id, language_code)
);

CREATE TABLE IF NOT EXISTS prediction_applied_rules (
    id                  BIGSERIAL PRIMARY KEY,
    prediction_id       BIGINT NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    rule_id             BIGINT NOT NULL REFERENCES rules(id),
    weight              NUMERIC NOT NULL,
    score               NUMERIC,
    effect_json         JSONB,
    explanation_snippet TEXT
);

-- =========================
-- 7. REMEDIES
-- =========================

CREATE TABLE IF NOT EXISTS remedies (
    id                  BIGSERIAL PRIMARY KEY,
    name                TEXT NOT NULL,
    type                remedy_type NOT NULL,
    description         TEXT NOT NULL,

    target_planets      SMALLINT[],
    target_themes       prediction_theme[],

    min_duration_days   INTEGER,
    recommended_frequency TEXT,

    safety_notes        TEXT,
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS prediction_recommended_remedies (
    id                  BIGSERIAL PRIMARY KEY,
    prediction_id       BIGINT NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    remedy_id           BIGINT NOT NULL REFERENCES remedies(id),
    suggested_by_rule_id BIGINT REFERENCES rules(id),
    reason_json         JSONB,
    priority            INTEGER DEFAULT 0
);

-- =========================
-- 8. USER FEEDBACK
-- =========================

CREATE TABLE IF NOT EXISTS prediction_feedback (
    id              BIGSERIAL PRIMARY KEY,
    prediction_id   BIGINT NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL,
    rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),
    is_accurate     BOOLEAN,
    comments        TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- 9. INDEXES (performance)
-- =========================

-- prediction_windows: lookups by user/chart, scope, time
CREATE INDEX IF NOT EXISTS idx_prediction_windows_user_scope_time
ON prediction_windows (user_id, scope, start_at);

CREATE INDEX IF NOT EXISTS idx_prediction_windows_chart_scope_time
ON prediction_windows (chart_id, scope, start_at);

-- astro_state_snapshots: join by window
CREATE INDEX IF NOT EXISTS idx_astro_state_snapshots_window
ON astro_state_snapshots (window_id);

CREATE INDEX IF NOT EXISTS idx_rules_applicable_scopes
ON rules USING GIN (applicable_scopes);

-- rule_groups: active by category
DROP INDEX IF EXISTS idx_rules_active_category;
CREATE INDEX IF NOT EXISTS idx_rule_groups_active_category
ON rule_groups (is_active, category);

-- predictions: by window, user, scope, time
CREATE INDEX IF NOT EXISTS idx_predictions_window
ON predictions (window_id);

CREATE INDEX IF NOT EXISTS idx_predictions_user_scope
ON predictions (user_id, scope, generated_at);

-- prediction_applied_rules: fetch rules for a given prediction
CREATE INDEX IF NOT EXISTS idx_prediction_applied_rules_prediction
ON prediction_applied_rules (prediction_id);

-- NOTE: For heavy JSONB querying later, you can add GIN indexes like:
-- CREATE INDEX IF NOT EXISTS idx_rules_condition_tree_gin
--   ON rules USING GIN (condition_tree);
-- CREATE INDEX IF NOT EXISTS idx_astro_state_planets_state_gin
--   ON astro_state_snapshots USING GIN (planets_state);

-- =============================================================================
-- 10. REMEDIES ENGINE FOUNDATION (DECOUPLED EXTENSION)
-- =============================================================================
-- NOTE:
-- - This section extends the SAME PostgreSQL database with new types/tables only.
-- - No CREATE DATABASE.
-- - No changes to existing prediction rules or prediction tables are required.

-- =========================
-- 10.1 ENUM TYPES (Engine-local)
-- =========================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'remedy_action_category') THEN
    CREATE TYPE remedy_action_category AS ENUM (
      'meditation',
      'jap',
      'donation',
      'feeding_beings',
      'fast',
      'puja'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'remedy_intensity_level') THEN
    CREATE TYPE remedy_intensity_level AS ENUM ('low', 'medium', 'high');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'remedy_timeframe') THEN
    CREATE TYPE remedy_timeframe AS ENUM ('temporary', 'period_based', 'long_term');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'remedy_compatibility_relation') THEN
    CREATE TYPE remedy_compatibility_relation AS ENUM ('allowed', 'disallowed');
  END IF;
END$$;

-- =========================
-- 10.2 REMEDY ACTIONS (Atomic, category-limited)
-- =========================

CREATE TABLE IF NOT EXISTS remedy_actions (
  id                BIGSERIAL PRIMARY KEY,
  code              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  category          remedy_action_category NOT NULL,
  description       TEXT NOT NULL,

  -- planets as numeric IDs (same convention used in snapshots/dasha fields)
  applicable_planets  SMALLINT[] NULL,

  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Hard safety enforcement at schema level (minimal, non-negotiable)
  CONSTRAINT chk_remedy_actions_no_death_language
    CHECK (description !~* '(death|die|lifespan|life\\s*span)')
);

CREATE INDEX IF NOT EXISTS idx_remedy_actions_category ON remedy_actions (category);
CREATE INDEX IF NOT EXISTS idx_remedy_actions_active ON remedy_actions (is_active);

-- =========================
-- 10.3 COMPATIBILITY LAYER (Allow/Disallow pairs)
-- =========================

CREATE TABLE IF NOT EXISTS remedy_action_compatibility (
  action_id        BIGINT NOT NULL REFERENCES remedy_actions(id) ON DELETE CASCADE,
  other_action_id  BIGINT NOT NULL REFERENCES remedy_actions(id) ON DELETE CASCADE,
  relation         remedy_compatibility_relation NOT NULL,
  reason           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_remedy_action_compatibility PRIMARY KEY (action_id, other_action_id),
  CONSTRAINT chk_remedy_action_compatibility_no_self CHECK (action_id <> other_action_id)
);

-- =========================
-- 10.4 REMEDY PLAN TEMPLATES (Bundles)
-- =========================

CREATE TABLE IF NOT EXISTS remedy_plan_templates (
  id                BIGSERIAL PRIMARY KEY,
  code              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  intensity_level   remedy_intensity_level NOT NULL,
  timeframe         remedy_timeframe NOT NULL,
  description       TEXT NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,

  -- maintained by trigger; used for enforceable checks
  inner_action_count  INTEGER NOT NULL DEFAULT 0,
  outer_action_count  INTEGER NOT NULL DEFAULT 0,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_remedy_plan_no_death_language
    CHECK (description !~* '(death|die|lifespan|life\\s*span)')
);

CREATE TABLE IF NOT EXISTS remedy_plan_actions (
  plan_id     BIGINT NOT NULL REFERENCES remedy_plan_templates(id) ON DELETE CASCADE,
  action_id   BIGINT NOT NULL REFERENCES remedy_actions(id) ON DELETE RESTRICT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_remedy_plan_actions PRIMARY KEY (plan_id, action_id)
);

-- =========================
-- 10.5 TRIGGERS: maintain inner/outer counts + enforce inner+outer rule
-- =========================

CREATE OR REPLACE FUNCTION fn_recompute_plan_counts(p_plan_id BIGINT)
RETURNS VOID AS $$
DECLARE
  inner_count INTEGER;
  outer_count INTEGER;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN a.category IN ('meditation','jap') THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN a.category IN ('donation','feeding_beings') THEN 1 ELSE 0 END), 0)
  INTO inner_count, outer_count
  FROM remedy_plan_actions pa
  JOIN remedy_actions a ON a.id = pa.action_id
  WHERE pa.plan_id = p_plan_id
    AND a.is_active = TRUE;

  UPDATE remedy_plan_templates
  SET inner_action_count = inner_count,
      outer_action_count = outer_count,
      updated_at = NOW()
  WHERE id = p_plan_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_remedy_plan_actions_recount()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM fn_recompute_plan_counts(OLD.plan_id);
    RETURN OLD;
  ELSE
    PERFORM fn_recompute_plan_counts(NEW.plan_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_remedy_plan_actions_recount_ins ON remedy_plan_actions;
DROP TRIGGER IF EXISTS trg_remedy_plan_actions_recount_upd ON remedy_plan_actions;
DROP TRIGGER IF EXISTS trg_remedy_plan_actions_recount_del ON remedy_plan_actions;

CREATE TRIGGER trg_remedy_plan_actions_recount_ins
AFTER INSERT ON remedy_plan_actions
FOR EACH ROW EXECUTE FUNCTION trg_remedy_plan_actions_recount();

CREATE TRIGGER trg_remedy_plan_actions_recount_upd
AFTER UPDATE ON remedy_plan_actions
FOR EACH ROW EXECUTE FUNCTION trg_remedy_plan_actions_recount();

CREATE TRIGGER trg_remedy_plan_actions_recount_del
AFTER DELETE ON remedy_plan_actions
FOR EACH ROW EXECUTE FUNCTION trg_remedy_plan_actions_recount();

CREATE OR REPLACE FUNCTION trg_remedy_plan_templates_enforce_inner_outer()
RETURNS TRIGGER AS $$
BEGIN
  -- Strict global rule:
  -- Every ACTIVE plan must include at least:
  -- - one inner practice (Meditation or Jap)
  -- - one outward action (Donation or Feeding beings)
  IF (NEW.is_active = TRUE) THEN
    IF (NEW.inner_action_count < 1 OR NEW.outer_action_count < 1) THEN
      RAISE EXCEPTION 'Active remedy plan % must include >=1 inner (meditation/jap) and >=1 outer (donation/feeding_beings) action', NEW.code;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_remedy_plan_templates_enforce ON remedy_plan_templates;
CREATE TRIGGER trg_remedy_plan_templates_enforce
BEFORE INSERT OR UPDATE ON remedy_plan_templates
FOR EACH ROW EXECUTE FUNCTION trg_remedy_plan_templates_enforce_inner_outer();

-- =========================
-- 10.6 REMEDY RULE LAYER (Triggers → plan templates)
-- =========================

CREATE TABLE IF NOT EXISTS remedy_trigger_rules (
  id              BIGSERIAL PRIMARY KEY,
  code            TEXT UNIQUE NOT NULL,

  -- Optional binding: a point code or generic rule
  point_code      TEXT NULL,

  -- Trigger conditions: Dasha / Transit / Severity (extensible JSON)
  trigger_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Severity mapping (0..1 scale)
  severity_min    NUMERIC NOT NULL DEFAULT 0,
  severity_max    NUMERIC NOT NULL DEFAULT 1,

  intensity_level remedy_intensity_level NOT NULL,
  timeframe       remedy_timeframe NOT NULL,

  plan_id         BIGINT NOT NULL REFERENCES remedy_plan_templates(id) ON DELETE RESTRICT,

  -- Free-form reference (e.g. point code, rule codes, or external KB reference)
  rule_reference  TEXT NULL,

  priority        INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_remedy_trigger_rules_severity_range
    CHECK (severity_min >= 0 AND severity_max <= 1 AND severity_min <= severity_max)
);

CREATE INDEX IF NOT EXISTS idx_remedy_trigger_rules_point ON remedy_trigger_rules (point_code);
CREATE INDEX IF NOT EXISTS idx_remedy_trigger_rules_active ON remedy_trigger_rules (is_active);
CREATE INDEX IF NOT EXISTS idx_remedy_trigger_rules_priority ON remedy_trigger_rules (priority);


-- =============================================================================
-- OPTIONAL: CLEAR ALL DATA (DESTRUCTIVE)
-- =============================================================================
-- To clear all table data while keeping the schema, run:
--   scripts/clearAllData.sql
--
