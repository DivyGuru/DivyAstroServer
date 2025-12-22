# Book Curation Scripts (File-First, English-Only)

This folder contains **file-first** scripts for curating book JSON content from `astrobooks/`.

## Rules (non-negotiable)

- **No DB writes**: scripts here only write JSON files under `astrobooks_processed/`.
- **English-only outputs**: no Hindi/Sanskrit source text is written into curated datasets.
- **Accuracy > coverage**: if something cannot be expressed with supported `condition_tree` operators, it must be flagged and excluded from engine datasets.

## Commands

From project root:

```bash
npm run book:scan -- lalkitab
npm run book:build -- lalkitab
```

## Output layout

```text
astrobooks_processed/
  <bookId>/
    scan.units.v1.json
    curation.overrides.v1.json
    datasets/
      units.curated.v1.json
      rules.v1.json
      remedies.v1.json
      manifest.v1.json
```


