## Authoring Workflow – How to Generate Rules and Remedies

### 1. Point IDs (Source of Truth)

- All points are defined in `src/config/problemTaxonomy.js`.
- `CHECKLIST.md` mirrors the same structure: **Theme → Subtype → Point ID**.
- Use the `Point ID` from these files when calling scripts (e.g. `MONEY_BUSINESS_GENERAL`).

---

### 2. Generate Planetary Conditions (Rules)

Run from project root:

```bash
npm run set:conditions -- POINT_ID
# example:
npm run set:conditions -- MONEY_BUSINESS_GENERAL
```

What this does:

- Reads point metadata from `problemTaxonomy`.
- Builds a `condition_tree` + `effect_json` via `generateConditionsForPoint(point)`.
- Saves JSON to:

  `astro-authoring/rules/<theme>/<subtype>/<POINT_ID>.json`

- Upserts a draft rule into the `rules` table with:
  - `point_code = POINT_ID`
  - `applicable_scopes = point.defaultScopes`
  - `priority` based on `point.kind`.

---

### 3. Generate Remedies

Run from project root:

```bash
npm run set:remedies -- POINT_ID
# example:
npm run set:remedies -- MONEY_BUSINESS_GENERAL
```

What this does:

- Reads point metadata from `problemTaxonomy`.
- Builds a theme-aware remedies array via `generateRemediesForPoint(point)`.
- Saves JSON to:

  `astro-authoring/remedies/<theme>/<subtype>/<POINT_ID>.remedies.json`

- Upserts remedies into the `remedies` table:
  - Name is prefixed with `[POINT_ID]`.
  - If the same name already exists, it updates instead of inserting a duplicate.
  - `target_themes` always includes the mapped theme (money, career, relationship, etc).

---

### 4. Folder Structure Overview

```text
astro-authoring/
  rules/
    <theme>/
      <subtype>/
        <POINT_ID>.json
  remedies/
    <theme>/
      <subtype>/
        <POINT_ID>.remedies.json
```

Examples:

- `astro-authoring/rules/money_finance/money_business/MONEY_BUSINESS_GENERAL.json`
- `astro-authoring/remedies/money_finance/money_business/MONEY_BUSINESS_GENERAL.remedies.json`

---

### 5. Typical Daily Authoring Loop

1. Open `CHECKLIST.md`, pick a point (e.g. `MONEY_BUSINESS_GENERAL`).
2. Generate conditions:

   ```bash
   npm run set:conditions -- MONEY_BUSINESS_GENERAL
   ```

3. Generate remedies:

   ```bash
   npm run set:remedies -- MONEY_BUSINESS_GENERAL
   ```

4. Open the generated JSON files under `astro-authoring/` if you want to refine them.
5. Mark the corresponding row in `CHECKLIST.md`:
   - `Conditions` → `[x]` once rule is acceptable.
   - `Remedies` → `[x]` once remedies are acceptable.
   - `Review` → `[x]` after final human review.

---

### 6. Notes for Future AI Integration

- **Conditions**: AI should always output JSON compatible with `generateConditionsForPoint` schema:
  - Top-level keys: `condition_tree`, `effect_json`.
  - `condition_tree` uses logical blocks like `all` with objects such as `planet_in_house`.
- **Remedies**: AI should output an array of remedy objects compatible with `generateRemediesForPoint` schema.
- The scripts already handle:
  - Saving AI JSON into the correct folders.
  - Upserting into Postgres safely.


