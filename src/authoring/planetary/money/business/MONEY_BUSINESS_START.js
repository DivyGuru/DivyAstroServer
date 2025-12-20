export function getMONEY_BUSINESS_STARTVariants() {
  const effectTheme = 'money';
  const area = 'money_business';
  const pointId = 'MONEY_BUSINESS_START';

  const keyHouses = [2, 7, 10, 11];
  const startHouses = Array.from(new Set([...keyHouses, 1, 3, 5, 9])); // 1=self/initiative, 3=efforts/sales, 5=skills/creativity, 9=guidance/luck
  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  // Planet ids (common convention): Sun=1, Moon=2, Mars=3, Mercury=4, Jupiter=5, Venus=6, Saturn=7, Rahu=8, Ketu=9
  const DASHAA_START_SUPPORT_IDS = [5, 6, 4, 1]; // Jupiter/Venus/Mercury/Sun
  const DASHAA_START_CAUTION_IDS = [7, 3, 8, 9]; // Saturn/Mars/Rahu/Ketu

  return [
    // 1) Readiness to initiate (initiative + support)
    {
      code: 'START_READINESS',
      label: 'Readiness to initiate: initiative houses activated with benefic support.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SUN', 'MERCURY'], house_in: [1, 3, 10], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['SUN', 'MERCURY'], group: { context: 'business', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['SUN', 'MERCURY'], group: { context: 'business', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.7,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'start_readiness',
        outcome_text:
          'A business-start yog is present. Nakshatra support strengthens this initiation. Keep the launch plan simple, execute consistently, and focus on early feedback loops.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'Signals support initiative and follow-through; still best approached with clear planning.',
        },
        point_id: pointId,
      },
    },

    // 2) Seed capital / initial stability (2nd house)
    {
      code: 'START_SEED_CAPITAL',
      label: 'Seed capital and initial stability: wealth house support for starting.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        planet_in_house: { planet_in: ['JUPITER', 'VENUS', 'MERCURY'], house_in: [2], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.65,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'seed_capital_support',
        outcome_text:
          'Initial stability may be easier to arrange. Consider starting with a realistic budget and clear monthly targets.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This supports practical starting stability; it does not imply effortless results.',
        },
        point_id: pointId,
      },
    },

    // 3) First clients / network opening (11th)
    {
      code: 'START_FIRST_CLIENTS',
      label: 'First clients: early traction through networks and referrals.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        planet_in_house: { planet_in: ['MERCURY', 'VENUS', 'JUPITER'], house_in: [11], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.7,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'first_clients',
        outcome_text:
          'Early traction may come via networks and referrals. A clear offer and timely follow-up can increase conversion.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This highlights network-led traction as a useful channel for starting.',
        },
        point_id: pointId,
      },
    },

    // 4) Marketing/sales push (3rd + Mercury)
    {
      code: 'START_MARKETING_PUSH',
      label: 'Marketing push: communication and outreach supports launch momentum.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: [3], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.65,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'marketing_push',
        outcome_text:
          'Outreach and communication can support the launch. Keep messaging simple, test quickly, and track responses without overreacting.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This emphasizes communication as a lever, while still requiring consistent effort.',
        },
        point_id: pointId,
      },
    },

    // 5) Skill/offer clarity (5th)
    {
      code: 'START_SKILL_CLARITY',
      label: 'Offer/skill clarity: creative/intellectual houses support a clean launch.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        planet_in_house: { planet_in: ['MERCURY', 'JUPITER'], house_in: [5], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'skill_clarity',
        outcome_text:
          'Clarity on skills and offer can help you start cleanly. Consider defining a narrow initial scope and improving it with feedback.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This supports a focused starting approach: narrow scope, better execution.',
        },
        point_id: pointId,
      },
    },

    // 6) Partnership start (7th)
    {
      code: 'START_PARTNERSHIP_SUPPORT',
      label: 'Partnership start support: smoother agreements and cooperation.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        planet_in_house: { planet_in: ['VENUS', 'MERCURY', 'JUPITER'], house_in: [7], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'partnership_support',
        outcome_text:
          'If starting with a partner, smoother cooperation may be possible. Clear roles and written agreements can protect momentum.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Partnership support is treated as helpful but secondary to clear agreements and execution.',
        },
        point_id: pointId,
      },
    },

    // 7) Paperwork/discipline for setup (Saturn + 6/10)
    {
      code: 'START_PAPERWORK_DISCIPLINE',
      label: 'Setup paperwork and discipline: structure supports sustainable start.',
      scopes: ['monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [6, 10], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.5 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.55,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'paperwork_and_structure',
        outcome_text:
          'A structured setup may help. Consider prioritizing compliance, paperwork, and simple systems before scaling.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as a “setup discipline” variant that reduces future friction.',
        },
        point_id: pointId,
      },
    },

    // 8) Transit window for starting (short-term)
    {
      code: 'TRANSIT_START_WINDOW',
      label: 'Short-term start window: supportive transits activate business houses.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['JUPITER', 'VENUS', 'MERCURY'],
          house_in: keyHouses,
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'start_window',
        outcome_text:
          'A short-term start window may help. Use it for small launches, outreach, and building a steady routine rather than taking big risks.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound and treated lightly; stepwise action is preferred.',
        },
        point_id: pointId,
      },
    },

    // 9) Dasha support for starting (longer-term)
    {
      code: 'DASHA_START_SUPPORT',
      label: 'Longer-term start support during benefic/trade dasha phases.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: DASHAA_START_SUPPORT_IDS } },
          { dasha_running: { level: 'antardasha', planet_in: DASHAA_START_SUPPORT_IDS } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.7,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'supportive_start_phase',
        outcome_text:
          'A longer supportive phase may allow a more stable start. Consider building foundations and keeping decisions consistent.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as longer-term support, guiding planning and pacing.',
        },
        point_id: pointId,
      },
    },

    // 10) Cautious start: malefic pressure (avoid rushing)
    {
      code: 'CAUTIOUS_START_PRESSURE',
      label: 'Cautious start: pressure suggests avoiding rushed commitments and keeping buffers.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: malefics, house_in: [6, 8, 12, 7], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'cautious_start',
        outcome_text:
          'If starting now, consider starting smaller and keeping buffers. Avoid rushed commitments and keep spending decisions reversible.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Risk indicators are stronger here, so conservative start strategy is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 11) Dasha caution: adversity phases (delay start or start smaller)
    {
      code: 'DASHA_START_CAUTION',
      label: 'Dasha caution: adversity phases suggest delaying launch or starting smaller.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: DASHAA_START_CAUTION_IDS } },
          { dasha_running: { level: 'antardasha', planet_in: DASHAA_START_CAUTION_IDS } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.65,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'start_caution_phase',
        outcome_text:
          'A longer caution phase may suggest delaying a major launch or starting with a lighter version. Keep commitments modest and focus on learning.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is used as pacing guidance for longer phases; it does not forbid starting.',
        },
        point_id: pointId,
      },
    },

    // 12) Start small (mixed support + risk)
    {
      code: 'START_SMALL_MIXED',
      label: 'Mixed start: proceed, but start small and validate assumptions.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.55 } },
          { overall_malefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'start_small_mixed',
        outcome_text:
          'Support and risk may be present together. You can proceed with a small launch, validate quickly, and avoid large irreversible commitments.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Mixed indicators favor a “pilot-first” approach.',
        },
        point_id: pointId,
      },
    },

    // 13) Transit: delay/risk window (short-term)
    {
      code: 'TRANSIT_START_DELAY_CAUTION',
      label: 'Short-term caution: delay major launch decisions if pressure rises.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'],
          house_in: [6, 8, 12, 7, 2],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.55,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'start_delay_caution',
        outcome_text:
          'In the short term, you may benefit from extra checks and slower commitments. Consider using this time for setup and planning.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Time-bound caution is treated as background guidance to reduce avoidable mistakes.',
        },
        point_id: pointId,
      },
    },

    // 14) Partnership start risk (agreements need more clarity)
    {
      code: 'START_PARTNERSHIP_RISK',
      label: 'Partnership start risk: agreements need clarity before launch.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        planet_in_house: { planet_in: malefics, house_in: [7], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'partnership_start_risk',
        outcome_text:
          'If starting with a partner, consider clarifying roles, money flows, and exit terms before committing resources.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as an agreement-quality signal; documentation reduces risk.',
        },
        point_id: pointId,
      },
    },

    // 15) Overconfidence risk (rushing decisions)
    {
      code: 'START_OVERCONFIDENCE_RISK',
      label: 'Overconfidence risk: avoid rushing into large bets during launch.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        planet_in_house: { planet_in: ['MARS'], house_in: [2, 5, 10], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'overconfidence_risk',
        outcome_text:
          'Energy and urgency may be high, but consider pacing. A smaller pilot and clear budgeting can reduce avoidable errors.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is expressed as pacing guidance to keep launch decisions grounded.',
        },
        point_id: pointId,
      },
    },

    // 16) Informational baseline for start
    {
      code: 'START_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for starting context.',
      condition_tree: { generic_condition: { note: 'Start baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'This looks like a relatively neutral phase for starting. Small steps, quick feedback, and steady execution may work best.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used when stronger start variants are not present.',
        },
        point_id: pointId,
      },
    },
  ];
}


