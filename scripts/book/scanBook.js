#!/usr/bin/env node

/**
 * Scan a book JSON in astrobooks/<bookId>.json and produce:
 * - scan.units.v1.json (English-only metadata; no source text is written)
 *
 * This is intentionally NOT a full extraction. It is a deterministic pre-pass
 * that helps focus curation on rule/remedy candidates.
 */

import fs from 'fs';
import path from 'path';
import {
  mustGetBookId,
  getPathsForBook,
  nowIso,
  writeJson,
} from './_shared.js';

const HINDI_PLANET_TOKENS = [
  { token: 'सूर्य', planet: 'SUN' },
  { token: 'सूरज', planet: 'SUN' },
  { token: 'चंद्र', planet: 'MOON' },
  { token: 'चन्द्र', planet: 'MOON' },
  { token: 'मंगल', planet: 'MARS' },
  { token: 'बुध', planet: 'MERCURY' },
  { token: 'गुरु', planet: 'JUPITER' },
  { token: 'बृहस्पति', planet: 'JUPITER' },
  { token: 'शुक्र', planet: 'VENUS' },
  { token: 'शनि', planet: 'SATURN' },
  { token: 'राहु', planet: 'RAHU' },
  { token: 'केतु', planet: 'KETU' },
];

const HOUSE_HINTS = [
  { token: 'पहला', house: 1 },
  { token: 'प्रथम', house: 1 },
  { token: 'दूसरा', house: 2 },
  { token: 'द्वितीय', house: 2 },
  { token: 'तीसरा', house: 3 },
  { token: 'तृतीय', house: 3 },
  { token: 'चौथा', house: 4 },
  { token: 'चतुर्थ', house: 4 },
  { token: 'पांचवां', house: 5 },
  { token: 'पंचम', house: 5 },
  { token: 'छठा', house: 6 },
  { token: 'षष्ठ', house: 6 },
  { token: 'सातवां', house: 7 },
  { token: 'सप्तम', house: 7 },
  { token: 'आठवां', house: 8 },
  { token: 'अष्टम', house: 8 },
  { token: 'नवम', house: 9 },
  { token: 'दसवां', house: 10 },
  { token: 'दशम', house: 10 },
  { token: 'ग्यारहवां', house: 11 },
  { token: 'एकादश', house: 11 },
  { token: 'बारहवां', house: 12 },
  { token: 'द्वादश', house: 12 },
];

const MARKERS = {
  ruleIfThen: ['यदि', 'अगर', 'मान लीजिए', 'तो '],
  remedy: ['उपाय', 'दान', 'जप', 'जाप', 'मंत्र', 'पूजा', 'व्रत', 'रत्न', 'यंत्र', 'शांति'],
  definition: ['तालिका', 'सूचक', 'उच्च', 'नीच', 'परिचायक', 'स्वामी', 'कारक'],
  nakshatra: ['नक्षत्र', 'नक्षत्र में', 'नक्षत्र के', 'नक्षत्र का'],
  dasha: ['दशा', 'महादशा', 'महा दशा', 'अंतरदशा', 'अन्तरदशा', 'अंतर दशा', 'दशा में', 'दशा के'],
  transit: ['गोचर', 'गोचर में', 'गोचर के', 'गोचर का', 'ट्रांजिट', 'भ्रमण', 'भ्रमण में'],
  strength: ['उच्च', 'नीच', 'मूल त्रिकोण', 'स्वराशि', 'मित्र', 'शत्रु', 'बल', 'दुर्बल', 'बली', 'अबली'],
  yoga: ['योग', 'योग बनता है', 'योग बन रहा', 'संयोग', 'युति'],
};

// Nakshatra names (Hindi to English)
const NAKSHATRA_MAP = {
  'अश्विनी': 'ASHWINI',
  'भरणी': 'BHARANI',
  'कृतिका': 'KRITTIKA',
  'रोहिणी': 'ROHINI',
  'मृगशिर': 'MRIGASHIRA',
  'आर्द्रा': 'ARDRA',
  'पुनर्वसु': 'PUNARVASU',
  'पुष्य': 'PUSHYA',
  'पुष्या': 'PUSHYA',
  'आश्लेषा': 'ASHLESHA',
  'मघा': 'MAGHA',
  'पूर्व फाल्गुनी': 'PURVA_PHALGUNI',
  'पूर्व फाल्गिनी': 'PURVA_PHALGUNI',
  'उत्तर फाल्गुनी': 'UTTARA_PHALGUNI',
  'उत्तर फाल्गिनी': 'UTTARA_PHALGUNI',
  'हस्त': 'HASTA',
  'चित्रा': 'CHITRA',
  'स्वाती': 'SWATI',
  'विशाखा': 'VISHHAKHA',
  'अनुराधा': 'ANURADHA',
  'ज्येष्ठा': 'JYESHTHA',
  'मूल': 'MULA',
  'पूर्वाषाढ़ा': 'PURVA_ASHADHA',
  'उत्तराषाढ़ा': 'UTTARA_ASHADHA',
  'श्रवण': 'SHRAVANA',
  'धनिष्ठा': 'DHANISHTHA',
  'शतभिषा': 'SHATABHISHA',
  'पूर्व भाद्रपद': 'PURVA_BHADRAPADA',
  'उत्तर भाद्रपद': 'UTTARA_BHADRAPADA',
  'रेवती': 'REVATI',
};

function includesAny(text, arr) {
  for (const s of arr) {
    if (text.includes(s)) return true;
  }
  return false;
}

function detectPlanets(text) {
  const planets = new Set();
  for (const p of HINDI_PLANET_TOKENS) {
    if (text.includes(p.token)) planets.add(p.planet);
  }
  // Also support uppercase English planet names if present
  const english = text.match(/\b(SUN|MOON|MARS|MERCURY|JUPITER|VENUS|SATURN|RAHU|KETU)\b/g);
  if (english) english.forEach((x) => planets.add(x));
  return Array.from(planets);
}

function detectHouses(text) {
  const houses = new Set();
  for (const h of HOUSE_HINTS) {
    if (text.includes(h.token)) houses.add(h.house);
  }
  // Numeric house hints like "1st house" won't appear much here; still support plain digits 1..12.
  const nums = text.match(/\b(1[0-2]|[1-9])\b/g);
  if (nums) {
    nums.map(Number).filter((n) => n >= 1 && n <= 12).forEach((n) => houses.add(n));
  }
  return Array.from(houses).sort((a, b) => a - b);
}

function detectNakshatras(text) {
  const nakshatras = new Set();
  for (const [hindi, english] of Object.entries(NAKSHATRA_MAP)) {
    if (text.includes(hindi)) {
      nakshatras.add(english);
    }
  }
  return Array.from(nakshatras);
}

function detectPossibleLayers(text, planets, houses) {
  const layers = {
    BASE: false,
    NAKSHATRA: false,
    DASHA: false,
    TRANSIT: false,
    STRENGTH: false,
    YOGA: false,
    REMEDY: false,
  };

  // BASE: Planet × House (if both present)
  if (planets.length > 0 && houses.length > 0) {
    layers.BASE = true;
  }

  // NAKSHATRA: Explicit nakshatra mention + planet + house
  if (includesAny(text, MARKERS.nakshatra) && planets.length > 0 && houses.length > 0) {
    const nakshatras = detectNakshatras(text);
    if (nakshatras.length > 0) {
      layers.NAKSHATRA = true;
    }
  }

  // DASHA: Explicit dasha mention + planet + house
  if (includesAny(text, MARKERS.dasha) && planets.length > 0 && houses.length > 0) {
    layers.DASHA = true;
  }

  // TRANSIT: Explicit transit/gochar mention + planet + house
  if (includesAny(text, MARKERS.transit) && planets.length > 0) {
    layers.TRANSIT = true;
  }

  // STRENGTH: Explicit strength state mention + planet
  if (includesAny(text, MARKERS.strength) && planets.length > 0) {
    layers.STRENGTH = true;
  }

  // YOGA: Explicit yoga mention + multiple planets
  if (includesAny(text, MARKERS.yoga) && planets.length >= 2) {
    layers.YOGA = true;
  }

  // REMEDY: Explicit remedy markers
  if (includesAny(text, MARKERS.remedy)) {
    layers.REMEDY = true;
  }

  return layers;
}

function suggestType({ text }) {
  const hasRemedy = includesAny(text, MARKERS.remedy);
  const hasIf = includesAny(text, MARKERS.ruleIfThen);
  const hasDef = includesAny(text, MARKERS.definition);

  if (hasRemedy && hasIf) return 'remedy';
  if (hasRemedy) return 'remedy';
  if (hasIf) return 'rule';
  if (hasDef) return 'definition';
  return 'philosophical_or_conceptual';
}

async function main() {
  const bookId = mustGetBookId(process.argv);
  const paths = getPathsForBook(bookId);

  if (!fs.existsSync(paths.sourceBookPath)) {
    throw new Error(`Book not found: ${paths.sourceBookPath}`);
  }

  const raw = await fs.promises.readFile(paths.sourceBookPath, 'utf8');
  const chunks = JSON.parse(raw);
  if (!Array.isArray(chunks)) {
    throw new Error('Book JSON must be an array of chunk objects');
  }

  const sorted = [...chunks].sort((a, b) => {
    const pa = Number(a.page_number || 0);
    const pb = Number(b.page_number || 0);
    if (pa !== pb) return pa - pb;
    const ca = Number(a.chunk_index || 0);
    const cb = Number(b.chunk_index || 0);
    return ca - cb;
  });

  const units = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const c = sorted[i];
    const text = typeof c.text === 'string' ? c.text : '';
    const languages = Array.isArray(c.languages) ? c.languages : [];

    const planets = detectPlanets(text);
    const houses = detectHouses(text);
    const nakshatras = detectNakshatras(text);
    const type = suggestType({ text });
    const possibleLayers = detectPossibleLayers(text, planets, houses);

    units.push({
      unit_id: `${bookId}_u${String(i + 1).padStart(4, '0')}`,
      source: {
        book_id: bookId,
        chunk_ids: [c.chunk_id].filter(Boolean),
        page_numbers: [c.page_number].filter((x) => x != null),
      },
      detection: {
        languages,
        markers: {
          rule_like: includesAny(text, MARKERS.ruleIfThen),
          remedy_like: includesAny(text, MARKERS.remedy),
          definition_like: includesAny(text, MARKERS.definition),
          nakshatra_like: includesAny(text, MARKERS.nakshatra),
          dasha_like: includesAny(text, MARKERS.dasha),
          transit_like: includesAny(text, MARKERS.transit),
          strength_like: includesAny(text, MARKERS.strength),
          yoga_like: includesAny(text, MARKERS.yoga),
        },
        entities: { 
          planets, 
          houses,
          nakshatras,
        },
        possible_layers: possibleLayers,
      },
      suggested_knowledge_type: type,
      curation_status: 'pending',
      notes_english: 'Scan only. Curate canonical meaning in overrides file.',
    });
  }

  const payload = {
    schema_version: 1,
    generated_at: nowIso(),
    book_id: bookId,
    source_file: path.relative(paths.root, paths.sourceBookPath),
    unit_count: units.length,
    units,
  };

  await writeJson(paths.scanPath, payload);

  // Create a starter overrides file if missing (empty skeleton).
  if (!fs.existsSync(paths.overridesPath)) {
    await writeJson(paths.overridesPath, {
      schema_version: 1,
      book_id: bookId,
      created_at: nowIso(),
      overrides: [],
    });
  }

  console.log(`✅ Scan complete: ${path.relative(paths.root, paths.scanPath)} (units=${units.length})`);
  console.log(`🧩 Overrides: ${path.relative(paths.root, paths.overridesPath)}`);
}

main().catch((err) => {
  console.error('❌ scanBook failed:', err.message);
  process.exit(1);
});


