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


