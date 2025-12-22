/**
 * PHASE 4: Transit / Gochar Trigger Layer Scanner
 * 
 * Scans book for explicit Transit-related statements tied to Planet × House base rules.
 * 
 * CRITICAL CONSTRAINTS:
 * - Only extracts EXPLICITLY stated rules
 * - Must be clearly linked to a planet's results in a specific house
 * - Must be identified as Gochar / Transit
 * - Must reference existing Planet × House base rules
 * - Only major transits (Saturn, Jupiter, Rahu, Ketu)
 * - NO generic transit lore
 * - NO inference, NO guessing
 */

import { mustGetBookId, getPathsForBook, readJson, writeJson } from './_shared.js';
import path from 'path';

// Planet mappings (Hindi to English) - Only major transits in scope
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

// Major transit planets only (Saturn, Jupiter, Rahu, Ketu)
const MAJOR_TRANSIT_PLANETS = ['SATURN', 'JUPITER', 'RAHU', 'KETU'];

// Transit/Gochar terms
const TRANSIT_TERMS = [
  'गोचर',
  'गोचर में',
  'गोचर के',
  'गोचर से',
  'ट्रांजिट',
  'transit',
  'भ्रमण',
  'भ्रमण करता',
  'भ्रमण करने',
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

function hasTransitTerm(text) {
  for (const term of TRANSIT_TERMS) {
    if (text.includes(term)) {
      return true;
    }
  }
  return false;
}

function findTransitPlanet(text) {
  // Look for patterns like "Planet का गोचर" or "Planet गोचर में"
  for (const [hindi, english] of Object.entries(PLANET_MAP)) {
    // Only major transit planets
    if (!MAJOR_TRANSIT_PLANETS.includes(english)) continue;
    
    // Pattern: "Planet का गोचर" or "Planet गोचर में"
    const pattern1 = new RegExp(`${hindi}\\s*(का|की|के)\\s*गोचर`, 'i');
    const pattern2 = new RegExp(`${hindi}\\s*गोचर`, 'i');
    const pattern3 = new RegExp(`गोचर\\s*(का|की|के)\\s*${hindi}`, 'i');
    if (pattern1.test(text) || pattern2.test(text) || pattern3.test(text)) {
      return english;
    }
  }
  return null;
}

function isExplicitTransitRule(text, transitPlanet, house, basePlanet) {
  // Check for explicit patterns like:
  // "TransitPlanet का गोचर House में"
  // "House में TransitPlanet का गोचर"
  // "BasePlanet House में TransitPlanet गोचर"
  
  const transitPlanetHindi = Object.keys(PLANET_MAP).find(k => PLANET_MAP[k] === transitPlanet);
  const basePlanetHindi = basePlanet ? Object.keys(PLANET_MAP).find(k => PLANET_MAP[k] === basePlanet) : null;
  const housePattern = HOUSE_PATTERNS.find(h => h.num === house);
  
  if (!transitPlanetHindi || !housePattern) return false;
  
  // Pattern 1: "TransitPlanet का गोचर House में"
  const pattern1 = new RegExp(`${transitPlanetHindi}[^।]*गोचर[^।]*${housePattern.patterns[0]}`, 'i');
  if (pattern1.test(text)) return true;
  
  // Pattern 2: "House में TransitPlanet का गोचर"
  const pattern2 = new RegExp(`${housePattern.patterns[0]}[^।]*${transitPlanetHindi}[^।]*गोचर`, 'i');
  if (pattern2.test(text)) return true;
  
  // Pattern 3: "BasePlanet House में TransitPlanet गोचर" (if base planet context exists)
  if (basePlanetHindi) {
    const pattern3 = new RegExp(`${basePlanetHindi}[^।]*${housePattern.patterns[0]}[^।]*${transitPlanetHindi}[^।]*गोचर`, 'i');
    if (pattern3.test(text)) return true;
  }
  
  return false;
}

function getBaseRuleId(planet, house, rules) {
  // Find the base Planet × House rule
  for (const rule of rules) {
    const cond = rule.condition_tree?.planet_in_house;
    if (cond && 
        cond.planet_in?.includes(planet) && 
        cond.house_in?.includes(house)) {
      return rule.id;
    }
  }
  return null;
}

async function main() {
  const bookId = mustGetBookId(process.argv);
  
  console.log(`🔍 Scanning ${bookId} for explicit Transit × Planet × House rules...\n`);
  
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
  const candidates = [];
  const flagged = [];
  
  for (const chunk of book) {
    const text = chunk.text || '';
    if (!text) continue;
    
    // Check for transit/gochar mentions
    if (!hasTransitTerm(text)) continue;
    
    // Find transit planet (must be major transit)
    const transitPlanet = findTransitPlanet(text);
    if (!transitPlanet || !MAJOR_TRANSIT_PLANETS.includes(transitPlanet)) continue;
    
    // Find house and base planet in same chunk
    const house = findHouseNumber(text);
    const basePlanet = findPlanet(text);
    
    if (house && basePlanet) {
      const isExplicit = isExplicitTransitRule(text, transitPlanet, house, basePlanet);
      const baseRuleId = getBaseRuleId(basePlanet, house, rules.rules);
      
      if (isExplicit && baseRuleId) {
        candidates.push({
          chunk_id: chunk.chunk_id,
          page: chunk.page_number,
          unit_id: chunkToUnit.get(chunk.chunk_id) || null,
          transit_planet: transitPlanet,
          house,
          base_planet: basePlanet,
          base_rule_id: baseRuleId,
        });
      } else if (transitPlanet && house && basePlanet) {
        // Has all components but not explicit pattern - flag for review
        flagged.push({
          chunk_id: chunk.chunk_id,
          page: chunk.page_number,
          unit_id: chunkToUnit.get(chunk.chunk_id) || null,
          transit_planet: transitPlanet,
          house,
          base_planet: basePlanet,
          base_rule_id: baseRuleId,
          reason: baseRuleId ? 'pattern_not_explicit' : 'base_rule_not_found',
        });
      }
    } else if (transitPlanet && hasTransitTerm(text)) {
      // Has transit but missing house/base planet context - flag as generic
      flagged.push({
        chunk_id: chunk.chunk_id,
        page: chunk.page_number,
        unit_id: chunkToUnit.get(chunk.chunk_id) || null,
        transit_planet: transitPlanet,
        house: house || null,
        base_planet: basePlanet || null,
        base_rule_id: null,
        reason: 'generic_transit_no_planet_house_link',
      });
    }
  }
  
  // Output results
  const output = {
    schema_version: 1,
    book_id: bookId,
    scan_timestamp: new Date().toISOString(),
    summary: {
      explicit_candidates: candidates.length,
      flagged_for_review: flagged.length,
    },
    explicit_candidates: candidates,
    flagged_for_review: flagged,
  };
  
  const outputPath = path.join(paths.processedDir, 'transit.scan.v1.json');
  await writeJson(outputPath, output);
  
  console.log(`✅ Scan complete:`);
  console.log(`   - Explicit candidates: ${candidates.length}`);
  console.log(`   - Flagged for review: ${flagged.length}`);
  console.log(`   - Output: ${outputPath}\n`);
  
  if (candidates.length > 0) {
    console.log('📋 Explicit candidates:');
    for (const c of candidates.slice(0, 5)) {
      console.log(`   - ${c.transit_planet} transit in ${c.house} triggers ${c.base_planet} in ${c.house} (page ${c.page})`);
    }
    if (candidates.length > 5) {
      console.log(`   ... and ${candidates.length - 5} more`);
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
  
  if (candidates.length === 0 && flagged.length === 0) {
    console.log('\n📝 No explicit Transit × Planet × House rules found.');
    console.log('   This is expected if the book does not contain such explicit statements.');
  }
}

main().catch((err) => {
  console.error('❌ scanTransitRules failed:', err.message);
  process.exit(1);
});

