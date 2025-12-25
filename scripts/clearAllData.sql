-- =============================================================================
-- CLEAR ALL DATA (DESTRUCTIVE)
-- =============================================================================
-- This script empties all tables while keeping the schema intact.
-- WARNING: This will delete ALL data from the database!
-- 
-- Usage:
--   psql -U <user> -d <database> -f scripts/clearAllData.sql
--   OR
--   node scripts/clearAllData.js --confirm
--
-- =============================================================================

BEGIN;

-- Disable triggers temporarily to avoid constraint issues
SET session_replication_role = 'replica';

-- =============================================================================
-- TRUNCATE TABLES (in dependency order)
-- =============================================================================

-- 1. Child tables (tables with foreign keys)
TRUNCATE TABLE prediction_recommended_remedies CASCADE;
TRUNCATE TABLE prediction_applied_rules CASCADE;
TRUNCATE TABLE prediction_feedback CASCADE;
TRUNCATE TABLE predictions CASCADE;
TRUNCATE TABLE astro_state_snapshots CASCADE;
TRUNCATE TABLE prediction_windows CASCADE;

-- 2. Remedy engine tables
TRUNCATE TABLE remedy_trigger_rules CASCADE;
TRUNCATE TABLE remedy_plan_actions CASCADE;
TRUNCATE TABLE remedy_plan_templates CASCADE;
TRUNCATE TABLE remedy_action_compatibility CASCADE;
TRUNCATE TABLE remedy_actions CASCADE;

-- 3. Rules and related tables
TRUNCATE TABLE rule_engine_requirements CASCADE;
TRUNCATE TABLE rule_provenance CASCADE;
TRUNCATE TABLE rule_ingestion_log CASCADE;
TRUNCATE TABLE rules CASCADE;
TRUNCATE TABLE text_template_localizations CASCADE;
TRUNCATE TABLE text_templates CASCADE;
TRUNCATE TABLE rule_groups CASCADE;

-- 4. Knowledge base tables
TRUNCATE TABLE knowledge_snippets CASCADE;
TRUNCATE TABLE scripture_sources CASCADE;

-- 5. Remedies table
TRUNCATE TABLE remedies CASCADE;

-- 6. User table (last, as it might be referenced)
TRUNCATE TABLE app_users CASCADE;

-- =============================================================================
-- RESET SEQUENCES
-- =============================================================================

-- Reset all sequences to start from 1
DO $$
DECLARE
    seq_record RECORD;
BEGIN
    FOR seq_record IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(seq_record.sequence_name) || ' RESTART WITH 1';
    END LOOP;
END $$;

-- Re-enable triggers
SET session_replication_role = 'origin';

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (optional - uncomment to run)
-- =============================================================================

-- Uncomment below to verify all tables are empty:
-- SELECT 
--     schemaname,
--     tablename,
--     n_live_tup as row_count
-- FROM pg_stat_user_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

