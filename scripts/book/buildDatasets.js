#!/usr/bin/env node

/**
 * Build curated datasets from:
 * - scan.units.v1.json
 * - curation.overrides.v1.json
 *
 * Outputs (English-only):
 * - datasets/units.curated.v1.json
 * - datasets/rules.v1.json
 * - datasets/remedies.v1.json
 * - datasets/manifest.v1.json
 */

import path from 'path';
import {
  mustGetBookId,
  getPathsForBook,
  readJson,
  writeJson,
  nowIso,
  KNOWLEDGE_TYPES,
  assertEnglishOnly,
  validateConditionTree,
} from './_shared.js';

function indexBy(arr, key) {
  const m = new Map();
  for (const item of arr || []) {
    if (!item || item[key] == null) continue;
    m.set(item[key], item);
  }
  return m;
}

function validateOverride(o) {
  if (!o || typeof o !== 'object') throw new Error('override must be an object');
  if (!o.unit_id) throw new Error('override.unit_id missing');
  if (!o.knowledge_type || !KNOWLEDGE_TYPES.includes(o.knowledge_type)) {
    throw new Error(`override.knowledge_type invalid for ${o.unit_id}`);
  }
  if (!o.canonical_meaning || typeof o.canonical_meaning !== 'string') {
    throw new Error(`override.canonical_meaning missing for ${o.unit_id}`);
  }
  assertEnglishOnly(`canonical_meaning (${o.unit_id})`, o.canonical_meaning);

  if (o.knowledge_type === 'rule' && o.rule) {
    assertEnglishOnly(`rule.label (${o.unit_id})`, o.rule.label || '');
    assertEnglishOnly(`rule.effect_json.outcome_text (${o.unit_id})`, o.rule?.effect_json?.outcome_text || '');
    assertEnglishOnly(
      `rule.effect_json.variant_meta.certainty_note (${o.unit_id})`,
      o.rule?.effect_json?.variant_meta?.certainty_note || ''
    );
    if (o.rule.condition_tree) validateConditionTree(o.rule.condition_tree);
  }

  if (o.knowledge_type === 'remedy' && o.remedy) {
    assertEnglishOnly(`remedy.name (${o.unit_id})`, o.remedy.name || '');
    assertEnglishOnly(`remedy.description (${o.unit_id})`, o.remedy.description || '');
    assertEnglishOnly(`remedy.safety_notes (${o.unit_id})`, o.remedy.safety_notes || '');
  }

  if (o.knowledge_type === 'remedy' && Array.isArray(o.remedies)) {
    o.remedies.forEach((r, idx) => {
      assertEnglishOnly(`remedies[${idx}].name (${o.unit_id})`, r?.name || '');
      assertEnglishOnly(`remedies[${idx}].description (${o.unit_id})`, r?.description || '');
      assertEnglishOnly(`remedies[${idx}].safety_notes (${o.unit_id})`, r?.safety_notes || '');
    });
  }
}

async function main() {
  const bookId = mustGetBookId(process.argv);
  const paths = getPathsForBook(bookId);

  const scan = await readJson(paths.scanPath);
  const overridesFile = await readJson(paths.overridesPath);
  const overrides = Array.isArray(overridesFile.overrides) ? overridesFile.overrides : [];

  // Validate overrides first
  for (const o of overrides) validateOverride(o);

  const overridesByUnit = indexBy(overrides, 'unit_id');

  const curatedUnits = [];
  const rules = [];
  const remedies = [];

  for (const u of scan.units || []) {
    const ov = overridesByUnit.get(u.unit_id) || null;
    if (!ov) continue; // only export curated units

    const curated = {
      unit_id: u.unit_id,
      source: u.source,
      knowledge_type: ov.knowledge_type,
      canonical_meaning: ov.canonical_meaning,
      curation_status: 'curated',
      flags: ov.flags || [],
    };

    curatedUnits.push(curated);

    if (ov.knowledge_type === 'rule' && ov.rule && ov.rule.condition_tree && ov.rule.effect_json) {
      rules.push({
        id: `${bookId}__${u.unit_id}`,
        source_unit_id: u.unit_id,
        point_code: null,
        variant_code: `${bookId}__${u.unit_id}`,
        applicable_scopes: ['life_theme'],
        condition_tree: ov.rule.condition_tree,
        effect_json: ov.rule.effect_json,
        base_weight: typeof ov.rule.base_weight === 'number' ? ov.rule.base_weight : 1.0,
        is_active: ov.rule.is_active !== false,
      });
    }

    if (ov.knowledge_type === 'remedy' && ov.remedy) {
      remedies.push({
        id: `${bookId}__${u.unit_id}`,
        source_unit_id: u.unit_id,
        type: ov.remedy.type,
        name: ov.remedy.name,
        description: ov.remedy.description,
        target_planets: Array.isArray(ov.remedy.target_planets) ? ov.remedy.target_planets : [],
        target_themes: Array.isArray(ov.remedy.target_themes) ? ov.remedy.target_themes : ['general'],
        min_duration_days: ov.remedy.min_duration_days ?? null,
        recommended_frequency: ov.remedy.recommended_frequency ?? null,
        safety_notes: ov.remedy.safety_notes ?? null,
        is_active: ov.remedy.is_active !== false,
      });
    }

    if (ov.knowledge_type === 'remedy' && Array.isArray(ov.remedies) && ov.remedies.length) {
      ov.remedies.forEach((r, idx) => {
        remedies.push({
          id: `${bookId}__${u.unit_id}__R${String(idx + 1).padStart(2, '0')}`,
          source_unit_id: u.unit_id,
          type: r.type,
          name: r.name,
          description: r.description,
          target_planets: Array.isArray(r.target_planets) ? r.target_planets : [],
          target_themes: Array.isArray(r.target_themes) ? r.target_themes : ['general'],
          min_duration_days: r.min_duration_days ?? null,
          recommended_frequency: r.recommended_frequency ?? null,
          safety_notes: r.safety_notes ?? null,
          is_active: r.is_active !== false,
        });
      });
    }
  }

  const manifest = {
    schema_version: 1,
    built_at: nowIso(),
    book_id: bookId,
    source_scan_file: path.relative(paths.root, paths.scanPath),
    source_overrides_file: path.relative(paths.root, paths.overridesPath),
    counts: {
      curated_units: curatedUnits.length,
      rules_exported: rules.length,
      remedies_exported: remedies.length,
    },
  };

  await writeJson(paths.curatedUnitsPath, { schema_version: 1, book_id: bookId, units: curatedUnits });
  await writeJson(paths.rulesPath, { schema_version: 1, book_id: bookId, rules });
  await writeJson(paths.remediesPath, { schema_version: 1, book_id: bookId, remedies });
  await writeJson(paths.manifestPath, manifest);

  console.log(`✅ Built datasets for ${bookId}`);
  console.log(`   - ${path.relative(paths.root, paths.curatedUnitsPath)} (units=${curatedUnits.length})`);
  console.log(`   - ${path.relative(paths.root, paths.rulesPath)} (rules=${rules.length})`);
  console.log(`   - ${path.relative(paths.root, paths.remediesPath)} (remedies=${remedies.length})`);
  console.log(`   - ${path.relative(paths.root, paths.manifestPath)}`);
}

main().catch((err) => {
  console.error('❌ buildDatasets failed:', err.message);
  process.exit(1);
});


