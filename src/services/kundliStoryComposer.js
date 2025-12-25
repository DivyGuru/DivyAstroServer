/**
 * Kundli Story Composer (Long-form / Life Story)
 *
 * PURPOSE
 * - Generates a long-form kundli report that reads like a patient astrologer’s explanation.
 * - DOES NOT change DB, rules, or scoring logic. It only composes narrative from existing snapshot + signals.
 *
 * OUTPUT
 * - Returns an array of "narrative blocks" compatible with the existing Kundli API pipeline:
 *   { domain, text, summary_metrics, time_windows, themes }
 *
 * NOTE
 * - This is intentionally verbose and structured with line breaks (\n) for UI rendering.
 */

const DASHA_PLANET_ID_TO_NAME = {
  1: 'SUN',
  2: 'MOON',
  3: 'MARS',
  4: 'MERCURY',
  5: 'JUPITER',
  6: 'VENUS',
  7: 'SATURN',
  8: 'RAHU',
  9: 'KETU',
};

const PLANET_ORDER = ['SUN', 'MOON', 'MARS', 'MERCURY', 'JUPITER', 'VENUS', 'SATURN', 'RAHU', 'KETU'];

function safeArray(value) {
  return Array.isArray(value) ? value : (value ? [value] : []);
}

function getRunningMahadashaName(astroSnapshot) {
  const id = Number(astroSnapshot?.running_mahadasha_planet);
  return Number.isFinite(id) ? (DASHA_PLANET_ID_TO_NAME[id] || null) : null;
}

function normalizePlanets(planetsState) {
  const planetsByName = {};
  if (Array.isArray(planetsState)) {
    for (const p of planetsState) {
      const key = p?.planet || p?.name;
      if (!key) continue;
      planetsByName[String(key).toUpperCase()] = p;
    }
    return planetsByName;
  }
  if (planetsState && typeof planetsState === 'object') {
    for (const [k, v] of Object.entries(planetsState)) {
      planetsByName[String(k).toUpperCase()] = { ...(v || {}), planet: String(k).toUpperCase() };
    }
    return planetsByName;
  }
  return planetsByName;
}

function getPlanetPlacement(planetsByName, planetKey) {
  const p = planetsByName?.[planetKey] || null;
  if (!p) return { house: null, signName: null, nakshatra: null, retrograde: null };
  const houseRaw = p.house?.number ?? p.house ?? null;
  const house = houseRaw != null ? Number(houseRaw) : null;
  const signName = p.signName ?? p.sign_name ?? p.rashiName ?? null;
  const nakshatra = p.nakshatra ?? p.nakshatraName ?? p.nakshatra_name ?? null;
  const retrograde = p.isRetrograde ?? p.retrograde ?? null;
  return {
    house: Number.isFinite(house) ? house : null,
    signName: typeof signName === 'string' && signName.trim() ? signName.trim() : null,
    nakshatra: typeof nakshatra === 'string' && nakshatra.trim() ? nakshatra.trim() : null,
    retrograde: typeof retrograde === 'boolean' ? retrograde : null,
  };
}

function ordinal(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '';
  const lastTwo = num % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${num}th`;
  const last = num % 10;
  if (last === 1) return `${num}st`;
  if (last === 2) return `${num}nd`;
  if (last === 3) return `${num}rd`;
  return `${num}th`;
}

function describeHouseDomain(house) {
  const h = Number(house);
  if (!Number.isFinite(h)) return 'this area of life';
  const map = {
    1: 'identity, confidence, and how you carry yourself',
    2: 'money, savings, speech, and family responsibilities',
    3: 'courage, effort, communication, and siblings',
    4: 'home, mother, emotional security, and property matters',
    5: 'education, creativity, children, and decision-making',
    6: 'health routines, service, debts, and daily pressure',
    7: 'relationships, partnership dynamics, and agreements',
    8: 'sudden changes, hidden pressure, trust, and deep transformation',
    9: 'belief, guidance, luck, teachers, and inner purpose',
    10: 'career direction, reputation, responsibilities, and visibility',
    11: 'gains, networks, long-term hopes, and support from others',
    12: 'expenses, isolation, sleep, inner burden, and letting go',
  };
  return map[h] || 'this area of life';
}

function planetVoice(planet) {
  const p = String(planet || '').toUpperCase();
  const map = {
    SUN: 'self-respect, authority, and the need to feel seen for your effort',
    MOON: 'emotional tides, attachment patterns, and how safe life feels from inside',
    MARS: 'drive, anger, courage, and the way you push through obstacles',
    MERCURY: 'thinking, communication, calculation, and practical decision-making',
    JUPITER: 'guidance, faith, learning, and the ability to find meaning in struggle',
    VENUS: 'love, comfort, taste, harmony, and what you allow yourself to enjoy',
    SATURN: 'duty, delay, discipline, endurance, and karmic responsibility',
    RAHU: 'restlessness, hunger for change, unconventional desire, and mental agitation',
    KETU: 'detachment, withdrawal, sharp inner perception, and dissatisfaction with surface answers',
  };
  return map[p] || 'life themes and temperament';
}

function safeSummaryMetricsFromCore(core, fallbackConfidence = 0.85) {
  const pressure = core?.dominantPressure || 'medium';
  const support = core?.dominantSupport || 'medium';
  const stability = core?.dominantStability || 'medium';
  const confidence = typeof fallbackConfidence === 'number' ? fallbackConfidence : 0.85;
  return {
    pressure: ['low', 'medium', 'high'].includes(pressure) ? pressure : 'medium',
    support: ['low', 'medium', 'high'].includes(support) ? support : 'medium',
    stability: ['low', 'medium', 'high'].includes(stability) ? stability : 'medium',
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}

function buildLines(lines) {
  return lines.filter(Boolean).join('\n');
}

/**
 * Compose long-form story sections.
 * @param {Object} params
 * @param {Object} params.astroSnapshot
 * @param {Array}  params.signalsWithPatches
 */
export function composeKundliLifeStory({ astroSnapshot, signalsWithPatches }) {
  const planetsByName = normalizePlanets(astroSnapshot?.planets_state || astroSnapshot?.planets || null);

  // Core phase (already computed later in narrativeComposer, but we can read if present on signals)
  const core = signalsWithPatches?.find(s => s?._core_life_phase)?._core_life_phase || null;
  const metrics = safeSummaryMetricsFromCore(core, 0.9);

  const mahadasha = getRunningMahadashaName(astroSnapshot);
  const mdPlacement = mahadasha ? getPlanetPlacement(planetsByName, mahadasha) : null;
  const mdHouse = mdPlacement?.house || null;
  const mdHouseDomain = mdHouse ? describeHouseDomain(mdHouse) : 'the core themes of your life';

  const moonPlacement = getPlanetPlacement(planetsByName, 'MOON');
  const moonNak = moonPlacement?.nakshatra || null;

  const doshas = safeArray(astroSnapshot?.doshas_state || astroSnapshot?.doshas || []);
  const yogas = safeArray(astroSnapshot?.yogas_state || astroSnapshot?.yogas || []);

  const lifeOverviewLines = [
    `This kundli shows a life where responsibility tends to arrive early, but recognition often arrives later.`,
    `You are not meant to move through life in a straight, easy line; your path is shaped by pressure that teaches endurance.`,
    `A repeating theme is that you put in real effort, yet the visible result does not always come at the same speed.`,
    `When things are going well, you can build steadily and become very dependable.`,
    `When life becomes heavy, you may feel you are carrying more than others can see.`,
    ``,
    `At your best, you have a practical mind and the ability to survive long stretches of uncertainty.`,
    `At your worst, the same seriousness can turn into mental fatigue, emotional dryness, or the sense that joy has to be “earned.”`,
    ``,
    `Your chart does not show a weak person; it shows a person who learns strength through repetition.`,
    `It also shows that you do not trust quick promises—because your life has trained you to respect reality.`,
    ``,
    `There is a strong focus on long-term duty, stability, and karmic clean-up.`,
    `That is why shortcuts rarely feel clean in your life; when you try to force outcomes, life pushes you back into discipline.`,
    ``,
    `If you have felt “Why is it taking so long?”—that feeling is part of this kundli’s main pattern.`,
    `And if you have felt “I am doing my part, but life is still heavy”—that is also part of your karmic signature.`,
    ``,
    `The good part is: this chart rewards sincerity, patience, and mature choices.`,
    `It may not reward speed, but it rewards depth.`,
    `Over time, people begin to respect you not for charm, but for substance.`,
  ];

  const pastPatternLines = [
    `From early years, a repeating pattern in life has been uneven support—sometimes you had to figure things out on your own.`,
    `Even when family or circumstances were present, the emotional “ease” may have been missing at times.`,
    `You may have learned early to be careful, to calculate, and to manage yourself rather than rely on perfect protection.`,
    `A common theme is taking responsibility before you felt fully ready for it.`,
    `Another theme is that confidence builds slowly—because life has tested you repeatedly.`,
    ``,
    `This creates a personality that looks strong from outside, but inside it can feel like constant inner pressure.`,
    `You may also notice a pattern of overthinking after decisions, replaying conversations, or mentally preparing for worst-case scenarios.`,
    `Not because you are negative—because your life has demanded readiness.`,
    ``,
    `This kundli often creates a “late blooming” pattern: the foundation is built quietly first, and rewards come later.`,
    `So your early chapters are usually more about survival and learning than comfort.`,
  ];

  const presentPhaseLines = [
    `Right now, your present phase is dominated by ${mahadasha ? `${mahadasha} Mahadasha` : 'a long-term karmic cycle'}, and it changes the tone of everything.`,
    `In this phase, effort can feel heavy, and results can feel delayed—not because you are doing it wrong, but because life is asking for structure.`,
    `It tests patience and asks you to hold discipline even when motivation does not feel natural.`,
    ``,
    mdHouse
      ? `Because the Mahadasha influence is tied to your ${ordinal(mdHouse)} house, the emotional weight is felt through ${mdHouseDomain}.`
      : `This is why the pressure feels “invisible”—it is not always about one event, it is about a persistent life tone.`,
    `When this phase is active, isolation can increase—not always physically, but emotionally: you may feel fewer people truly understand your burden.`,
    `You may also feel more responsibility for outcomes, even when factors are outside your control.`,
    ``,
    moonNak
      ? `Your Moon’s nakshatra tone (${moonNak}) can add restlessness and mental movement, which makes it harder to feel settled during pressure.`
      : `Your emotional nature can become more sensitive during pressure, which makes rest harder to reach.`,
    `This phase teaches you one main lesson: build your life on what is real, not on what is promised.`,
    `That is why it can feel strict. But it also makes your future stability more solid.`,
  ];

  const planetWiseLines = [];
  for (const planet of PLANET_ORDER) {
    const place = getPlanetPlacement(planetsByName, planet);
    const h = place.house;
    const housePhrase = h ? `in the ${ordinal(h)} house` : 'in your chart';
    const domainPhrase = h ? describeHouseDomain(h) : 'your life themes';

    planetWiseLines.push(`${planet}:`);
    planetWiseLines.push(`- Nature: ${planetVoice(planet)}.`);
    planetWiseLines.push(`- Placement: ${housePhrase}${place.signName ? ` (${place.signName})` : ''}.`);
    planetWiseLines.push(`- Daily life expression: it shows through ${domainPhrase}, shaping how you think, react, and choose under pressure.`);
    planetWiseLines.push(
      `- What to watch: when this planet is stressed, you may feel its themes more sharply—either as excess, absence, or constant worry in the same area.`
    );
    planetWiseLines.push(''); // spacing line
  }

  const doshYogLines = [
    `Doshas and yogas in a kundli are not “labels”—they are patterns of experience.`,
    `They explain why certain problems repeat even when you are trying sincerely.`,
    ``,
    doshas.length
      ? `In your chart, dosha patterns present include: ${doshas.map(d => (typeof d === 'string' ? d : (d?.name || d?.dosha || ''))).filter(Boolean).join(', ')}.`
      : `Your snapshot does not list dosha names clearly, but your lived pattern still shows repetition under pressure.`,
    `The lived effect is usually this: life demands adjustment from you even when you are doing things correctly.`,
    `You may feel that peace comes only after effort—rarely before it.`,
    ``,
    yogas.length
      ? `Yoga patterns present include: ${yogas.map(y => (typeof y === 'string' ? y : (y?.name || y?.yoga || ''))).filter(Boolean).join(', ')}.`
      : `Yoga names are not clearly listed here, but your strengths show as resilience and long-term rebuilding capacity.`,
    `The helpful side of this is that you can rebuild your life after setbacks.`,
    `The difficult side is that you may not get “easy chapters” often, so you must create steadiness through routine and choices.`,
  ];

  const futureLines = [
    `This kundli points toward improvement through steady restructuring rather than sudden miracles.`,
    `Relief comes when you stop fighting the timeline and start building around it—work, money, relationships, and health all stabilize when routines become consistent.`,
    `With time, your decisions become cleaner and your emotional reactions become less chaotic.`,
    `The more you choose long-term stability over quick relief, the more this chart rewards you.`,
  ];

  // Remedies are resolved later in the pipeline; this section is a placeholder narrative.
  const remediesLines = [
    `Remedies are not magic—they work like “supportive pressure release” when the mind is carrying too much.`,
    `Below remedies are offered as optional supports. Choose only what feels practical.`,
  ];

  const blocks = [
    {
      domain: 'life_overview',
      text: buildLines(lifeOverviewLines),
      summary_metrics: metrics,
      themes: ['general'],
      time_windows: { years: [], months: [] },
    },
    {
      domain: 'past_life_pattern',
      text: buildLines(pastPatternLines),
      summary_metrics: metrics,
      themes: ['general'],
      time_windows: { years: [], months: [] },
    },
    {
      domain: 'present_phase',
      text: buildLines(presentPhaseLines),
      summary_metrics: metrics,
      themes: ['general'],
      time_windows: { years: [], months: [] },
    },
    {
      domain: 'planet_wise_effects',
      text: buildLines(planetWiseLines),
      summary_metrics: metrics,
      themes: ['general'],
      time_windows: { years: [], months: [] },
    },
    {
      domain: 'dosh_yog_explanation',
      text: buildLines(doshYogLines),
      summary_metrics: metrics,
      themes: ['general'],
      time_windows: { years: [], months: [] },
    },
    {
      domain: 'future_direction',
      text: buildLines(futureLines),
      summary_metrics: metrics,
      themes: ['general'],
      time_windows: { years: [], months: [] },
    },
    {
      domain: 'remedies_guidance',
      text: buildLines(remediesLines),
      summary_metrics: metrics,
      themes: ['general'],
      time_windows: { years: [], months: [] },
    },
  ];

  return blocks;
}


