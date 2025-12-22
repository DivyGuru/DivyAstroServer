/**
 * PHASE 2: Nakshatra Refinement Scanner
 * 
 * Scans book for explicit Planet × House × Nakshatra rules.
 * 
 * CRITICAL CONSTRAINTS:
 * - Only extracts EXPLICITLY stated rules
 * - Must be clearly tied to planet+house+nakshatra
 * - NO inference, NO guessing
 * - Must reference existing Planet × House base rules
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

// Nakshatra mappings (Hindi to English canonical)
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
  'विशाखा': 'VISHHAKHA', // Note: VISHHAKHA is canonical per nakshatraStrengthModel.js
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

function findNakshatra(text) {
  for (const [hindi, english] of Object.entries(NAKSHATRA_MAP)) {
    if (text.includes(hindi)) {
      return english;
    }
  }
  return null;
}

function isExplicitRule(text, planet, house, nakshatra) {
  // Check for explicit patterns like:
  // "Planet in House in Nakshatra"
  // "House में Planet Nakshatra में"
  // etc.
  
  const planetHindi = Object.keys(PLANET_MAP).find(k => PLANET_MAP[k] === planet);
  const nakHindi = Object.keys(NAKSHATRA_MAP).find(k => NAKSHATRA_MAP[k] === nakshatra);
  const housePattern = HOUSE_PATTERNS.find(h => h.num === house);
  
  if (!planetHindi || !nakHindi || !housePattern) return false;
  
  // Pattern 1: "house में planet nakshatra में"
  const pattern1 = new RegExp(`${housePattern.patterns[0]}\\s*में\\s*${planetHindi}[^।]*${nakHindi}`, 'i');
  if (pattern1.test(text)) return true;
  
  // Pattern 2: "planet house में nakshatra में"
  const pattern2 = new RegExp(`${planetHindi}[^।]*${housePattern.patterns[0]}\\s*में[^।]*${nakHindi}`, 'i');
  if (pattern2.test(text)) return true;
  
  // Pattern 3: "planet nakshatra house में"
  const pattern3 = new RegExp(`${planetHindi}[^।]*${nakHindi}[^।]*${housePattern.patterns[0]}`, 'i');
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
  
  console.log(`🔍 Scanning ${bookId} for explicit Planet × House × Nakshatra rules...\n`);
  
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
    
    // Find planet, house, nakshatra in same chunk
    const planet = findPlanet(text);
    const house = findHouseNumber(text);
    const nakshatra = findNakshatra(text);
    
    if (planet && house && nakshatra) {
      const isExplicit = isExplicitRule(text, planet, house, nakshatra);
      const baseRuleId = getBaseRuleId(planet, house, rules.rules);
      
      if (isExplicit && baseRuleId) {
        candidates.push({
          chunk_id: chunk.chunk_id,
          page: chunk.page_number,
          unit_id: chunkToUnit.get(chunk.chunk_id) || null,
          planet,
          house,
          nakshatra,
          base_rule_id: baseRuleId,
        });
      } else if (planet && house && nakshatra) {
        // Has all three but not explicit pattern - flag for review
        flagged.push({
          chunk_id: chunk.chunk_id,
          page: chunk.page_number,
          unit_id: chunkToUnit.get(chunk.chunk_id) || null,
          planet,
          house,
          nakshatra,
          base_rule_id: baseRuleId,
          reason: baseRuleId ? 'pattern_not_explicit' : 'base_rule_not_found',
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
      explicit_candidates: candidates.length,
      flagged_for_review: flagged.length,
    },
    explicit_candidates: candidates,
    flagged_for_review: flagged,
  };
  
  const outputPath = path.join(paths.processedDir, 'nakshatra.scan.v1.json');
  await writeJson(outputPath, output);
  
  console.log(`✅ Scan complete:`);
  console.log(`   - Explicit candidates: ${candidates.length}`);
  console.log(`   - Flagged for review: ${flagged.length}`);
  console.log(`   - Output: ${outputPath}\n`);
  
  if (candidates.length > 0) {
    console.log('📋 Explicit candidates:');
    for (const c of candidates.slice(0, 5)) {
      console.log(`   - ${c.planet} in ${c.house} in ${c.nakshatra} (page ${c.page})`);
    }
    if (candidates.length > 5) {
      console.log(`   ... and ${candidates.length - 5} more`);
    }
  }
  
  if (flagged.length > 0) {
    console.log('\n⚠️  Flagged for review:');
    for (const f of flagged.slice(0, 3)) {
      console.log(`   - ${f.planet} + ${f.house} + ${f.nakshatra} (${f.reason})`);
    }
    if (flagged.length > 3) {
      console.log(`   ... and ${flagged.length - 3} more`);
    }
  }
  
  if (candidates.length === 0 && flagged.length === 0) {
    console.log('\n📝 No explicit Planet × House × Nakshatra rules found.');
    console.log('   This is expected if the book does not contain such explicit statements.');
  }
}

main().catch((err) => {
  console.error('❌ scanNakshatraRules failed:', err.message);
  process.exit(1);
});

