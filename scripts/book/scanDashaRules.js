/**
 * PHASE 3: Dasha / Time Activation Layer Scanner
 * 
 * Scans book for explicit Dasha-related statements tied to Planet × House base rules.
 * 
 * CRITICAL CONSTRAINTS:
 * - Only extracts EXPLICITLY stated rules
 * - Must be clearly linked to a planet's results in a specific house
 * - Must be temporal (Mahadasha / Antardasha)
 * - Must reference existing Planet × House base rules
 * - NO generic dasha meanings
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

function findDashaLevel(text) {
  // Check for explicit mahadasha/antardasha mentions
  if (text.includes('महादशा') || text.includes('महा दशा')) {
    return 'mahadasha';
  }
  if (text.includes('अंतरदशा') || text.includes('अन्तरदशा') || text.includes('अंतर दशा')) {
    return 'antardasha';
  }
  // Generic "दशा" - only if context is clear
  if (text.includes('दशा में') || text.includes('दशा के')) {
    return 'dasha'; // Needs further context
  }
  return null;
}

function findDashaPlanet(text, dashaLevel) {
  // Look for patterns like "X की दशा" or "X दशा में"
  for (const [hindi, english] of Object.entries(PLANET_MAP)) {
    // Pattern: "Planet की दशा" or "Planet दशा"
    const pattern1 = new RegExp(`${hindi}\\s*(की|का)\\s*दशा`, 'i');
    const pattern2 = new RegExp(`${hindi}\\s*दशा`, 'i');
    if (pattern1.test(text) || pattern2.test(text)) {
      return english;
    }
  }
  return null;
}

function isExplicitDashaRule(text, planet, house, dashaPlanet, dashaLevel) {
  // Check for explicit patterns like:
  // "Planet in House during DashaPlanet dasha"
  // "DashaPlanet दशा में Planet House में"
  // etc.
  
  const planetHindi = Object.keys(PLANET_MAP).find(k => PLANET_MAP[k] === planet);
  const dashaPlanetHindi = Object.keys(PLANET_MAP).find(k => PLANET_MAP[k] === dashaPlanet);
  const housePattern = HOUSE_PATTERNS.find(h => h.num === house);
  
  if (!planetHindi || !dashaPlanetHindi || !housePattern || !dashaLevel) return false;
  
  // Pattern 1: "DashaPlanet दशा में Planet House में"
  const pattern1 = new RegExp(`${dashaPlanetHindi}[^।]*दशा[^।]*${planetHindi}[^।]*${housePattern.patterns[0]}`, 'i');
  if (pattern1.test(text)) return true;
  
  // Pattern 2: "Planet House में DashaPlanet दशा में"
  const pattern2 = new RegExp(`${planetHindi}[^।]*${housePattern.patterns[0]}[^।]*${dashaPlanetHindi}[^।]*दशा`, 'i');
  if (pattern2.test(text)) return true;
  
  // Pattern 3: "DashaPlanet की दशा में Planet House"
  const pattern3 = new RegExp(`${dashaPlanetHindi}[^।]*की[^।]*दशा[^।]*${planetHindi}[^।]*${housePattern.patterns[0]}`, 'i');
  if (pattern3.test(text)) return true;
  
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
  
  console.log(`🔍 Scanning ${bookId} for explicit Dasha × Planet × House rules...\n`);
  
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
    
    // Check for dasha mentions
    const dashaLevel = findDashaLevel(text);
    if (!dashaLevel) continue;
    
    // Find planet and house in same chunk
    const planet = findPlanet(text);
    const house = findHouseNumber(text);
    const dashaPlanet = findDashaPlanet(text, dashaLevel);
    
    if (planet && house && dashaPlanet && (dashaLevel === 'mahadasha' || dashaLevel === 'antardasha')) {
      const isExplicit = isExplicitDashaRule(text, planet, house, dashaPlanet, dashaLevel);
      const baseRuleId = getBaseRuleId(planet, house, rules.rules);
      
      if (isExplicit && baseRuleId) {
        candidates.push({
          chunk_id: chunk.chunk_id,
          page: chunk.page_number,
          unit_id: chunkToUnit.get(chunk.chunk_id) || null,
          planet,
          house,
          dasha_planet: dashaPlanet,
          dasha_level: dashaLevel,
          base_rule_id: baseRuleId,
        });
      } else if (planet && house && dashaPlanet) {
        // Has all components but not explicit pattern - flag for review
        flagged.push({
          chunk_id: chunk.chunk_id,
          page: chunk.page_number,
          unit_id: chunkToUnit.get(chunk.chunk_id) || null,
          planet,
          house,
          dasha_planet: dashaPlanet,
          dasha_level: dashaLevel,
          base_rule_id: baseRuleId,
          reason: baseRuleId ? 'pattern_not_explicit' : 'base_rule_not_found',
        });
      }
    } else if (dashaLevel && (dashaLevel === 'mahadasha' || dashaLevel === 'antardasha')) {
      // Has dasha but missing planet/house context - flag as generic
      flagged.push({
        chunk_id: chunk.chunk_id,
        page: chunk.page_number,
        unit_id: chunkToUnit.get(chunk.chunk_id) || null,
        planet: planet || null,
        house: house || null,
        dasha_planet: dashaPlanet || null,
        dasha_level: dashaLevel,
        base_rule_id: null,
        reason: 'generic_dasha_no_planet_house_link',
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
  
  const outputPath = path.join(paths.processedDir, 'dasha.scan.v1.json');
  await writeJson(outputPath, output);
  
  console.log(`✅ Scan complete:`);
  console.log(`   - Explicit candidates: ${candidates.length}`);
  console.log(`   - Flagged for review: ${flagged.length}`);
  console.log(`   - Output: ${outputPath}\n`);
  
  if (candidates.length > 0) {
    console.log('📋 Explicit candidates:');
    for (const c of candidates.slice(0, 5)) {
      console.log(`   - ${c.dasha_planet} ${c.dasha_level} activates ${c.planet} in ${c.house} (page ${c.page})`);
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
    console.log('\n📝 No explicit Dasha × Planet × House rules found.');
    console.log('   This is expected if the book does not contain such explicit statements.');
  }
}

main().catch((err) => {
  console.error('❌ scanDashaRules failed:', err.message);
  process.exit(1);
});

