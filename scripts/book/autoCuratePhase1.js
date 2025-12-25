#!/usr/bin/env node

/**
 * Automated Phase 1 Curation: Planet × House BASE Rules
 * 
 * Auto-generates curation overrides for Planet × House placements.
 * Strategy: Aggressive extraction with conservative summarization.
 * 
 * Usage: node scripts/book/autoCuratePhase1.js <bookId>
 */

import { mustGetBookId, getPathsForBook, readJson, writeJson, nowIso } from './_shared.js';
import path from 'path';

// House meanings (for generating neutral descriptions)
const HOUSE_MEANINGS = {
  1: { area: 'self_identity', keywords: ['self', 'personality', 'physical appearance', 'personal direction'] },
  2: { area: 'resources', keywords: ['resources', 'wealth', 'speech', 'family', 'food'] },
  3: { area: 'communication', keywords: ['siblings', 'courage', 'communication', 'short journeys'] },
  4: { area: 'home', keywords: ['mother', 'home', 'property', 'comfort', 'education'] },
  5: { area: 'creativity', keywords: ['children', 'creativity', 'education', 'speculation', 'romance'] },
  6: { area: 'health', keywords: ['health', 'service', 'enemies', 'debts', 'daily routine'] },
  7: { area: 'partnership', keywords: ['spouse', 'partnership', 'marriage', 'business partners'] },
  8: { area: 'transformation', keywords: ['longevity', 'transformation', 'occult', 'inheritance'] },
  9: { area: 'philosophy', keywords: ['father', 'philosophy', 'dharma', 'higher learning', 'long journeys'] },
  10: { area: 'career', keywords: ['career', 'reputation', 'public standing', 'authority', 'profession'] },
  11: { area: 'gains', keywords: ['income', 'gains', 'friendships', 'hopes', 'wishes'] },
  12: { area: 'spirituality', keywords: ['losses', 'expenses', 'spirituality', 'isolation', 'foreign lands'] }
};

// Planet characteristics (for generating neutral descriptions)
const PLANET_CHARACTERISTICS = {
  'SUN': { nature: 'authority', keywords: ['authority', 'ego', 'vitality', 'father', 'government'] },
  'MOON': { nature: 'mind', keywords: ['mind', 'emotions', 'mother', 'public', 'fluctuations'] },
  'MARS': { nature: 'energy', keywords: ['energy', 'courage', 'conflict', 'sports', 'surgery'] },
  'MERCURY': { nature: 'communication', keywords: ['communication', 'intellect', 'business', 'writing', 'siblings'] },
  'JUPITER': { nature: 'wisdom', keywords: ['wisdom', 'expansion', 'guru', 'philosophy', 'children'] },
  'VENUS': { nature: 'pleasure', keywords: ['pleasure', 'relationships', 'art', 'luxury', 'spouse'] },
  'SATURN': { nature: 'discipline', keywords: ['discipline', 'delay', 'karma', 'old age', 'service'] },
  'RAHU': { nature: 'desire', keywords: ['desire', 'materialism', 'foreign', 'unconventional', 'technology'] },
  'KETU': { nature: 'detachment', keywords: ['detachment', 'spirituality', 'mysticism', 'isolation', 'research'] }
};

/**
 * Generate neutral English description for Planet × House combination
 */
function generateNeutralDescription(planet, house) {
  const planetInfo = PLANET_CHARACTERISTICS[planet] || { nature: 'influence', keywords: [] };
  const houseInfo = HOUSE_MEANINGS[house] || { area: 'life_area', keywords: [] };
  
  // Conservative, neutral description
  const descriptions = [
    `${planet} in the ${house}${getOrdinalSuffix(house)} house may influence areas related to ${houseInfo.keywords[0] || 'this life area'}. This placement can bring its unique energies to these aspects of life.`,
    `When ${planet} is placed in the ${house}${getOrdinalSuffix(house)} house, it may affect ${houseInfo.keywords.join(' and ') || 'related life areas'}. The influence of ${planet} in this position can manifest in various ways depending on chart context.`,
    `${planet} in house ${house} relates to ${houseInfo.area || 'life areas'}. This placement may bring ${planetInfo.nature || 'influence'} to matters associated with this house.`
  ];
  
  return descriptions[0]; // Use first, most conservative description
}

function getOrdinalSuffix(num) {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
}

/**
 * Generate outcome text (neutral, informational)
 */
function generateOutcomeText(planet, house) {
  const planetInfo = PLANET_CHARACTERISTICS[planet] || {};
  const houseInfo = HOUSE_MEANINGS[house] || {};
  
  return `${planet} in the ${house}${getOrdinalSuffix(house)} house may influence areas related to ${houseInfo.keywords[0] || 'this life area'}. This placement can bring its unique energies to these aspects of life. Be mindful of the opportunities and challenges that arise during this period.`;
}

/**
 * Determine theme from house
 */
function getThemeFromHouse(house) {
  const themeMap = {
    1: 'general',
    2: 'money',
    3: 'general',
    4: 'family',
    5: 'general',
    6: 'health',
    7: 'relationships',
    8: 'general',
    9: 'general',
    10: 'career',
    11: 'money',
    12: 'general'
  };
  return themeMap[house] || 'general';
}

/**
 * Determine trend (conservative: mostly mixed/neutral)
 */
function getTrend(planet, house) {
  // Conservative approach: mostly mixed
  const beneficPlanets = ['JUPITER', 'VENUS', 'MOON'];
  const maleficPlanets = ['SATURN', 'MARS', 'SUN', 'RAHU', 'KETU'];
  
  if (beneficPlanets.includes(planet)) {
    return 'up';
  } else if (maleficPlanets.includes(planet)) {
    return 'mixed';
  }
  return 'mixed';
}

/**
 * Check if text contains fear-based language (to filter out)
 */
function containsFearLanguage(text) {
  if (!text) return false;
  const fearPatterns = [
    'मृत्यु', 'death', 'मर', 'die', 'नष्ट', 'destroy',
    'विभाजन', 'divorce', 'तलाक', 'separation',
    'रोग', 'disease', 'बीमारी', 'illness',
    'दुर्घटना', 'accident', 'हानि', 'loss'
  ];
  
  const lowerText = text.toLowerCase();
  return fearPatterns.some(pattern => lowerText.includes(pattern.toLowerCase()));
}

/**
 * Check if text contains explicit placement statement
 */
function isExplicitPlacement(text, planet, house) {
  if (!text) return false;
  
  // Look for patterns like "planet in house X" or "house X me planet"
  const planetNames = {
    'SUN': ['सूर्य', 'सूरज'],
    'MOON': ['चंद्र', 'चन्द्र'],
    'MARS': ['मंगल'],
    'MERCURY': ['बुध'],
    'JUPITER': ['गुरु', 'बृहस्पति'],
    'VENUS': ['शुक्र'],
    'SATURN': ['शनि'],
    'RAHU': ['राहु'],
    'KETU': ['केतु']
  };
  
  const houseNames = {
    1: ['पहला', 'प्रथम', 'लग्न'],
    2: ['दूसरा', 'द्वितीय'],
    3: ['तीसरा', 'तृतीय'],
    4: ['चौथा', 'चतुर्थ'],
    5: ['पांचवां', 'पंचम'],
    6: ['छठा', 'षष्ठ'],
    7: ['सातवां', 'सप्तम'],
    8: ['आठवां', 'अष्टम'],
    9: ['नवम'],
    10: ['दसवां', 'दशम'],
    11: ['ग्यारहवां', 'एकादश'],
    12: ['बारहवां', 'द्वादश']
  };
  
  const planetTokens = planetNames[planet] || [];
  const houseTokens = houseNames[house] || [];
  
  // Check if both planet and house appear in text
  const hasPlanet = planetTokens.some(token => text.includes(token)) || text.includes(planet);
  const hasHouse = houseTokens.some(token => text.includes(token)) || text.includes(`house ${house}`) || text.includes(`${house}th house`);
  
  return hasPlanet && hasHouse;
}

async function autoCuratePhase1(bookId) {
  console.log(`\n🤖 Auto-curating Phase 1 (Planet × House) for ${bookId}...\n`);
  
  const paths = getPathsForBook(bookId);
  
  // Load scan
  const scan = await readJson(paths.scanPath);
  const units = scan.units || [];
  
  // Load existing overrides (if any)
  let existingOverrides = [];
  try {
    const overridesFile = await readJson(paths.overridesPath);
    existingOverrides = Array.isArray(overridesFile.overrides) ? overridesFile.overrides : [];
  } catch (err) {
    // File doesn't exist yet, start fresh
  }
  
  const existingUnitIds = new Set(existingOverrides.map(o => o.unit_id));
  
  // Load book chunks for text analysis
  const book = await readJson(paths.sourceBookPath);
  const chunkMap = new Map();
  for (const chunk of book) {
    chunkMap.set(chunk.chunk_id, chunk);
  }
  
  // Build unit to chunks map
  const unitToChunks = new Map();
  for (const unit of units) {
    const chunkIds = unit.source?.chunk_ids || [];
    const chunks = chunkIds.map(cid => chunkMap.get(cid)).filter(Boolean);
    unitToChunks.set(unit.unit_id, chunks);
  }
  
  // Find Phase 1 candidates (planets + houses)
  const candidates = units.filter(u => 
    u.detection?.entities?.planets?.length > 0 && 
    u.detection?.entities?.houses?.length > 0
  );
  
  console.log(`Found ${candidates.length} Phase 1 candidates`);
  
  const newOverrides = [];
  let processed = 0;
  let skipped = 0;
  
  for (const unit of candidates) {
    // Skip if already curated
    if (existingUnitIds.has(unit.unit_id)) {
      continue;
    }
    
    const planets = unit.detection.entities.planets || [];
    const houses = unit.detection.entities.houses || [];
    const chunks = unitToChunks.get(unit.unit_id) || [];
    const text = chunks.map(c => c.text || '').join(' ');
    
    // Skip if contains fear language
    if (containsFearLanguage(text)) {
      skipped++;
      continue;
    }
    
    // Generate rules for each Planet × House combination
    for (const planet of planets) {
      for (const house of houses) {
        // Check if explicit placement (conservative check)
        const isExplicit = isExplicitPlacement(text, planet, house);
        
        // Generate override
        const override = {
          unit_id: unit.unit_id,
          knowledge_type: 'rule',
          canonical_meaning: generateNeutralDescription(planet, house),
          rule: {
            label: `${planet} in the ${house}${getOrdinalSuffix(house)} house`,
            condition_tree: {
              planet_in_house: {
                planet_in: [planet],
                house_in: [house],
                match_mode: 'any',
                min_planets: 1
              }
            },
            effect_json: {
              theme: getThemeFromHouse(house),
              area: `${planet.toLowerCase()}_house_${house}`,
              trend: getTrend(planet, house),
              intensity: 0.5, // Conservative default
              tone: 'informational',
              trigger: 'natal',
              scenario: 'placement_association',
              outcome_text: generateOutcomeText(planet, house),
              variant_meta: {
                tone: 'informational',
                confidence_level: isExplicit ? 'medium' : 'low',
                dominance: 'background',
                certainty_note: isExplicit 
                  ? 'This is an auto-curated rule from a classical text. Treated as a background indicator.'
                  : 'This is an auto-curated rule with inferred placement. Treated as a low-confidence background indicator.'
              },
              source: {
                book_id: bookId,
                unit_id: unit.unit_id
              }
            },
            base_weight: 1.0,
            is_active: true
          },
          flags: isExplicit ? ['engine_expressible', 'auto_curated'] : ['engine_expressible', 'auto_curated', 'inferred_placement']
        };
        
        newOverrides.push(override);
        processed++;
      }
    }
  }
  
  // Merge with existing overrides
  const allOverrides = [...existingOverrides, ...newOverrides];
  
  // Write updated overrides
  const overridesFile = {
    schema_version: 1,
    book_id: bookId,
    created_at: nowIso(),
    updated_at: nowIso(),
    notes: "Auto-curated Phase 1 rules. All canonical_meaning is English-only. Tone is neutral and informational. No fear-based language.",
    overrides: allOverrides
  };
  
  await writeJson(paths.overridesPath, overridesFile);
  
  console.log(`\n✅ Auto-curation complete:`);
  console.log(`   - Processed: ${processed} Planet × House combinations`);
  console.log(`   - Skipped (fear language): ${skipped}`);
  console.log(`   - Total overrides: ${allOverrides.length}`);
  console.log(`   - New overrides: ${newOverrides.length}`);
  console.log(`\n   File: ${paths.overridesPath}`);
}

const bookId = mustGetBookId(process.argv);
autoCuratePhase1(bookId).catch(err => {
  console.error('❌ Auto-curation failed:', err.message);
  process.exit(1);
});

