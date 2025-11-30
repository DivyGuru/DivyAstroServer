## DivyAstroDB – Local Postgres Setup (macOS, Homebrew)

### 1. Postgres service start / status

```bash
# Check installed postgres version
brew services list | grep postgres

# Start postgres (adjust version as needed)
brew services start postgresql@14
# or for other versions:
# brew services start postgresql
# brew services start postgresql@16
```

Verify it's running:

```bash
pg_isready
```

### 2. Create Database

From project root (`/Users/vikassharma/Desktop/Vikas/ReactNative/DivyAstroDB`):

**Option A - Simple (recommended):**
```bash
createdb divyastrodb_dev
```

**Option B - Using psql:**
```bash
psql postgres -c "CREATE DATABASE divyastrodb_dev;"
```

Verify database exists:
```bash
psql -l | grep divyastrodb_dev
```

### 3. Load the Prediction Schema

From project root:

```bash
cd /Users/vikassharma/Desktop/Vikas/ReactNative/DivyAstroDB
psql divyastrodb_dev -f schema_divyastrodb.sql
```

Expected output: Multiple `CREATE TABLE`, `CREATE INDEX`, `DO` messages (no errors).

### 4. Verify Tables Created

```bash
psql divyastrodb_dev -c "\dt"
```

Or interactive mode:

```bash
psql divyastrodb_dev
```

Then inside `psql`:

```sql
\dt
\d prediction_windows
\d predictions
\q
```

### 5. Complete Schema Overview

Your **Prediction DB** is now ready with **13 tables**:

**Core Time Windows:**
- `prediction_windows` - Time/dasha windows (hourly → lifelong)
- `astro_state_snapshots` - Astro context snapshots per window

**Knowledge Base:**
- `rule_groups` - Rule group definitions
- `rules` - Individual rules with condition_tree JSONB
- `text_templates` - Prediction text templates
- `text_template_localizations` - Multi-language template translations

**Scriptures:**
- `scripture_sources` - Source references
- `knowledge_snippets` - Extracted scripture chunks

**Predictions:**
- `predictions` - Final predictions per window
- `prediction_applied_rules` - Which rules were applied

**Remedies:**
- `remedies` - Remedy definitions
- `prediction_recommended_remedies` - Remedies linked to predictions

**Feedback:**
- `prediction_feedback` - User ratings/accuracy feedback

### Connection String (for apps)

```
postgresql://vikassharma@localhost:5432/divyastrodb_dev
```

Or with password (if set):
```
postgresql://vikassharma:password@localhost:5432/divyastrodb_dev
```


