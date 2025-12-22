import fs from 'fs';
import path from 'path';

export function mustGetBookId(argv) {
  const bookId = argv?.[2] ? String(argv[2]).trim() : '';
  if (!bookId) {
    throw new Error('bookId missing. Usage: node scripts/book/<script>.js <bookId>');
  }
  return bookId;
}

export function getPathsForBook(bookId) {
  const root = process.cwd();
  return {
    root,
    bookId,
    sourceBookPath: path.resolve(root, 'astrobooks', `${bookId}.json`),
    processedDir: path.resolve(root, 'astrobooks_processed', bookId),
    scanPath: path.resolve(root, 'astrobooks_processed', bookId, 'scan.units.v1.json'),
    overridesPath: path.resolve(root, 'astrobooks_processed', bookId, 'curation.overrides.v1.json'),
    datasetsDir: path.resolve(root, 'astrobooks_processed', bookId, 'datasets'),
    curatedUnitsPath: path.resolve(root, 'astrobooks_processed', bookId, 'datasets', 'units.curated.v1.json'),
    rulesPath: path.resolve(root, 'astrobooks_processed', bookId, 'datasets', 'rules.v1.json'),
    remediesPath: path.resolve(root, 'astrobooks_processed', bookId, 'datasets', 'remedies.v1.json'),
    manifestPath: path.resolve(root, 'astrobooks_processed', bookId, 'datasets', 'manifest.v1.json'),
  };
}

export async function readJson(filePath) {
  const raw = await fs.promises.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export async function writeJson(filePath, obj) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(obj, null, 2), 'utf8');
}

export function nowIso() {
  return new Date().toISOString();
}

export function hasDevanagari(text) {
  if (!text) return false;
  // Basic Devanagari block detection
  return /[\u0900-\u097F]/.test(text);
}

export function assertEnglishOnly(fieldName, value) {
  if (value == null) return;
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string (got ${typeof value})`);
  }
  if (hasDevanagari(value)) {
    throw new Error(`${fieldName} must be English-only (contains Devanagari characters)`);
  }
}

export const KNOWLEDGE_TYPES = [
  'philosophical_or_conceptual',
  'definition',
  'rule',
  'exception',
  'procedure',
  'remedy',
];

export const RULE_ENGINE_LEAF_KEYS = [
  'planet_in_house',
  'transit_planet_in_house',
  'dasha_running',
  'planet_strength',
  'transit_planet_strength',
  'house_lord_in_house',
  'transit_house_lord_in_house',
  'planet_in_nakshatra',
  'transit_planet_in_nakshatra',
  'planet_in_nakshatra_group',
  'transit_planet_in_nakshatra_group',
  'dasha_lord_in_nakshatra',
  'dasha_lord_in_nakshatra_group',
  'overall_benefic_score',
  'overall_malefic_score',
  'generic_condition',
];

export function validateConditionTree(node, pathStr = 'condition_tree') {
  if (!node || typeof node !== 'object') {
    throw new Error(`${pathStr} must be an object`);
  }

  if (Array.isArray(node.all)) {
    node.all.forEach((child, idx) => validateConditionTree(child, `${pathStr}.all[${idx}]`));
    return;
  }
  if (Array.isArray(node.any)) {
    node.any.forEach((child, idx) => validateConditionTree(child, `${pathStr}.any[${idx}]`));
    return;
  }

  const keys = Object.keys(node);
  if (keys.length !== 1) {
    throw new Error(`${pathStr} leaf must have exactly one key`);
  }
  const key = keys[0];
  if (!RULE_ENGINE_LEAF_KEYS.includes(key)) {
    throw new Error(`${pathStr} uses unsupported leaf operator: ${key}`);
  }
}


