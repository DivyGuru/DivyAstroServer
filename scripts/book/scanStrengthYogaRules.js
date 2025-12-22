/**
 * PHASE 5: Strength & Yoga (Combination) Layer Scanner
 * 
 * Scans book for explicit Strength state and Yoga (combination) statements.
 * 
 * CRITICAL CONSTRAINTS:
 * - Only extracts EXPLICITLY stated rules
 * - Must be clearly linked to planetary results
 * - Must modify existing Planet × House effects (intensity/effectiveness)
 * - NO generic strength/yoga lore
 * - NO inference, NO guessing
 */

import { mustGetBookId, getPathsForBook, readJson, writeJson } from './_shared.js';
import path from 'path';

// Planet mappings (Hindi to English)
const PLANET_MAP = {
  'सूर्य': 'SUN',
  'चंद्र': 'MOON',
  'मंगल': 'MARS',
  'बुध': 'MERCURY',
  'बृहस्पति': 'JUPITER',
  'शुक्र': 'VENUS',
  'शनि': 'SATURN',
  'राहु': 'RAHU',
  'केतु': 'KETU',
};

// Strength state terms (Hindi)
const STRENGTH_TERMS = {
  exaltation: {
    hindi: ['उच्च', 'उच्चस्थ', 'उच्च का', 'उच्च में', 'उच्चस्थान'],
    english: 'EXALTED'
  },
  debilitation: {
    hindi: ['नीच', 'नीचस्थ', 'नीच का', 'नीच में', 'नीचस्थान'],
    english: 'DEBILITATED'
  },
  own_sign: {
    hindi: ['स्वराशि', 'स्व राशि', 'स्वभाव', 'अपनी राशि'],
    english: 'OWN_SIGN'
  },
  retrograde: {
    hindi: ['वक्री', 'वक्र', 'वक्रगति', 'वक्री गति'],
    english: 'RETROGRADE'
  },
  mooltrikona: {
    hindi: ['मूलत्रिकोण', 'मूल त्रिकोण'],
    english: 'MOOLTRIKONA'
  }
};

// Yoga terms (Hindi)
const YOGA_TERMS = [
  'योग',
  'योग बनता',
  'योग बनने',
  'योग होता',
  'योग होने',
  'संयोग',
  'संयोग बनता',
];

// Common yoga names (Hindi patterns)
const YOGA_PATTERNS = [
  { hindi: ['गज केसरी', 'गजकेशरी'], english: 'GAJA_KESARI' },
  { hindi: ['राज योग', 'राजयोग'], english: 'RAJA_YOGA' },
  { hindi: ['धन योग', 'धनयोग'], english: 'DHANA_YOGA' },
  { hindi: ['विद्या योग', 'विद्यायोग'], english: 'VIDYA_YOGA' },
  { hindi: ['चंद्र मंगल योग', 'चंद्रमंगल योग'], english: 'CHANDRA_MANGAL_YOGA' },
  { hindi: ['बुध अधित्य योग', 'बुधाधित्य योग'], english: 'BUDHADHITYA_YOGA' },
  { hindi: ['काल सर्प योग', 'कालसर्प योग'], english: 'KALA_SARPA_YOGA' },
  { hindi: ['मंगल दोष', 'मंगलदोष'], english: 'MANGAL_DOSHA' },
];

// House number patterns
const HOUSE_PATTERNS = [
  { num: 1, patterns: ['पहला घर', 'पहले घर', 'लग्न', 'प्रथम भाव'] },
  { num: 2, patterns: ['दूसरा घर', 'दूसरे घर', 'द्वितीय भाव'] },
  { num: 3, patterns: ['तीसरा घर', 'तीसरे घर', 'तृतीय भाव'] },
  { num: 4, patterns: ['चौथा घर', 'चौथे घर', 'चतुर्थ भाव'] },
  { num: 5, patterns: ['पांचवां घर', 'पांचवें घर', 'पंचम भाव'] },
  { num: 6, patterns: ['छठा घर', 'छठे घर', 'षष्ठ भाव'] },
  { num: 7, patterns: ['सातवां घर', 'सातवें घर', 'सप्तम भाव'] },
  { num: 8, patterns: ['आठवां घर', 'आठवें घर', 'अष्टम भाव'] },
  { num: 9, patterns: ['नौवां घर', 'नौवें घर', 'नवम भाव', 'नवां घर'] },
  { num: 10, patterns: ['दसवां घर', 'दसवें घर', 'दशम भाव'] },
  { num: 11, patterns: ['ग्यारहवां घर', 'ग्यारहवें घर', 'एकादश भाव'] },
  { num: 12, patterns: ['बारहवां घर', 'बारहवें घर', 'द्वादश भाव'] },
];

function findHouseNumber(text) {
  for (const { num, patterns } of HOUSE_PATTERNS) {
    for (const pattern of patterns) {
      if (text.includes(pattern)) {
        return num;
      }
    }
  }
  return null;
}

function findPlanet(text) {
  for (const [hindi, english] of Object.entries(PLANET_MAP)) {
    if (text.includes(hindi)) {
      return english;
    }
  }
  return null;
}

function findStrengthState(text) {
  for (const [state, data] of Object.entries(STRENGTH_TERMS)) {
    for (const hindiTerm of data.hindi) {
      if (text.includes(hindiTerm)) {
        return data.english;
      }
    }
  }
  return null;
}

function hasYogaTerm(text) {
  for (const term of YOGA_TERMS) {
    if (text.includes(term)) {
      return true;
    }
  }
  return false;
}

function findYogaName(text) {
  for (const { hindi, english } of YOGA_PATTERNS) {
    for (const h of hindi) {
      if (text.includes(h)) {
        return english;
      }
    }
  }
  return null;
}

function findMultiplePlanets(text) {
  const found = [];
  for (const [hindi, english] of Object.entries(PLANET_MAP)) {
    if (text.includes(hindi)) {
      found.push(english);
    }
  }
  return found.length >= 2 ? found : null;
}

function isExplicitStrengthRule(text, planet, strengthState) {
  if (!planet || !strengthState) return false;
  
  const planetHindi = Object.keys(PLANET_MAP).find(k => PLANET_MAP[k] === planet);
  if (!planetHindi) return false;
  
  // Pattern: "Planet strengthState" or "strengthState Planet"
  const stateData = Object.values(STRENGTH_TERMS).find(d => d.english === strengthState);
  if (!stateData) return false;
  
  for (const hindiTerm of stateData.hindi) {
    // Pattern 1: "Planet strengthState"
    const pattern1 = new RegExp(`${planetHindi}[^।]*${hindiTerm}`, 'i');
    // Pattern 2: "strengthState Planet"
    const pattern2 = new RegExp(`${hindiTerm}[^।]*${planetHindi}`, 'i');
    if (pattern1.test(text) || pattern2.test(text)) {
      return true;
    }
  }
  
  return false;
}

function isExplicitYogaRule(text, yogaName, planets) {
  if (!yogaName || !planets || planets.length < 2) return false;
  
  const yogaData = YOGA_PATTERNS.find(y => y.english === yogaName);
  if (!yogaData) return false;
  
  // Check if yoga name and planets appear together
  let hasYogaName = false;
  for (const h of yogaData.hindi) {
    if (text.includes(h)) {
      hasYogaName = true;
      break;
    }
  }
  
  if (!hasYogaName) return false;
  
  // Check if multiple planets are mentioned
  const planetHindis = planets.map(p => 
    Object.keys(PLANET_MAP).find(k => PLANET_MAP[k] === p)
  ).filter(Boolean);
  
  if (planetHindis.length < 2) return false;
  
  // Check if at least 2 planets appear in text
  let planetCount = 0;
  for (const ph of planetHindis) {
    if (text.includes(ph)) {
      planetCount++;
    }
  }
  
  return planetCount >= 2;
}

function getBaseRuleIds(planet, house, rules) {
  // Find all base Planet × House rules for this planet
  const baseRuleIds = [];
  for (const rule of rules) {
    const cond = rule.condition_tree?.planet_in_house;
    if (cond && 
        cond.planet_in?.includes(planet) && 
        cond.house_in?.includes(house)) {
      baseRuleIds.push(rule.id);
    }
  }
  return baseRuleIds;
}

async function main() {
  const bookId = mustGetBookId(process.argv);
  
  console.log(`🔍 Scanning ${bookId} for explicit Strength & Yoga rules...\n`);
  
  const paths = getPathsForBook(bookId);
  
  // Load data
  const book = await readJson(paths.sourceBookPath);
  const scan = await readJson(paths.scanPath);
  const rules = await readJson(paths.rulesPath);
  
  // Build chunk to unit map
  const chunkToUnit = new Map();
  for (const unit of scan.units) {
    for (const cid of (unit.source?.chunk_ids || [])) {
      chunkToUnit.set(cid, unit.unit_id);
    }
  }
  
  // Scan for explicit rules
  const strengthCandidates = [];
  const yogaCandidates = [];
  const flagged = [];
  
  for (const chunk of book) {
    const text = chunk.text || '';
    if (!text) continue;
    
    // Check for strength states
    const strengthState = findStrengthState(text);
    if (strengthState) {
      const planet = findPlanet(text);
      const house = findHouseNumber(text);
      
      if (planet && isExplicitStrengthRule(text, planet, strengthState)) {
        const baseRuleIds = house ? getBaseRuleIds(planet, house, rules.rules) : [];
        
        strengthCandidates.push({
          chunk_id: chunk.chunk_id,
          page: chunk.page_number,
          unit_id: chunkToUnit.get(chunk.chunk_id) || null,
          planet,
          strength_state: strengthState,
          house: house || null,
          base_rule_ids: baseRuleIds,
        });
      } else if (planet && strengthState) {
        // Has components but not explicit pattern
        flagged.push({
          chunk_id: chunk.chunk_id,
          page: chunk.page_number,
          unit_id: chunkToUnit.get(chunk.chunk_id) || null,
          type: 'strength',
          planet,
          strength_state: strengthState,
          house: house || null,
          reason: 'pattern_not_explicit',
        });
      }
    }
    
    // Check for yogas
    if (hasYogaTerm(text)) {
      const yogaName = findYogaName(text);
      const planets = findMultiplePlanets(text);
      
      if (yogaName && planets && isExplicitYogaRule(text, yogaName, planets)) {
        // Find base rules for all planets
        const allBaseRuleIds = [];
        for (const planet of planets) {
          const house = findHouseNumber(text);
          if (house) {
            allBaseRuleIds.push(...getBaseRuleIds(planet, house, rules.rules));
          }
        }
        
        yogaCandidates.push({
          chunk_id: chunk.chunk_id,
          page: chunk.page_number,
          unit_id: chunkToUnit.get(chunk.chunk_id) || null,
          yoga_name: yogaName,
          planets,
          base_rule_ids: allBaseRuleIds,
        });
      } else if (hasYogaTerm(text)) {
        // Has yoga term but missing components
        flagged.push({
          chunk_id: chunk.chunk_id,
          page: chunk.page_number,
          unit_id: chunkToUnit.get(chunk.chunk_id) || null,
          type: 'yoga',
          yoga_name: yogaName || null,
          planets: planets || null,
          reason: yogaName ? (planets ? 'pattern_not_explicit' : 'missing_planets') : 'generic_yoga_no_name',
        });
      }
    }
  }
  
  // Output results
  const output = {
    schema_version: 1,
    book_id: bookId,
    scan_timestamp: new Date().toISOString(),
    summary: {
      strength_candidates: strengthCandidates.length,
      yoga_candidates: yogaCandidates.length,
      flagged_for_review: flagged.length,
    },
    strength_candidates: strengthCandidates,
    yoga_candidates: yogaCandidates,
    flagged_for_review: flagged,
  };
  
  const outputPath = path.join(paths.processedDir, 'strength_yoga.scan.v1.json');
  await writeJson(outputPath, output);
  
  console.log(`✅ Scan complete:`);
  console.log(`   - Strength candidates: ${strengthCandidates.length}`);
  console.log(`   - Yoga candidates: ${yogaCandidates.length}`);
  console.log(`   - Flagged for review: ${flagged.length}`);
  console.log(`   - Output: ${outputPath}\n`);
  
  if (strengthCandidates.length > 0) {
    console.log('📋 Strength candidates:');
    for (const c of strengthCandidates.slice(0, 5)) {
      console.log(`   - ${c.planet} ${c.strength_state} (page ${c.page})`);
    }
    if (strengthCandidates.length > 5) {
      console.log(`   ... and ${strengthCandidates.length - 5} more`);
    }
  }
  
  if (yogaCandidates.length > 0) {
    console.log('📋 Yoga candidates:');
    for (const c of yogaCandidates.slice(0, 5)) {
      console.log(`   - ${c.yoga_name} (${c.planets.join(', ')}) (page ${c.page})`);
    }
    if (yogaCandidates.length > 5) {
      console.log(`   ... and ${yogaCandidates.length - 5} more`);
    }
  }
  
  if (flagged.length > 0) {
    console.log('\n⚠️  Flagged for review:');
    const reasons = {};
    for (const f of flagged) {
      reasons[f.reason] = (reasons[f.reason] || 0) + 1;
    }
    for (const [reason, count] of Object.entries(reasons)) {
      console.log(`   - ${reason}: ${count}`);
    }
  }
  
  if (strengthCandidates.length === 0 && yogaCandidates.length === 0 && flagged.length === 0) {
    console.log('\n📝 No explicit Strength or Yoga rules found.');
    console.log('   This is expected if the book does not contain such explicit statements.');
  }
}

main().catch((err) => {
  console.error('❌ scanStrengthYogaRules failed:', err.message);
  process.exit(1);
});

