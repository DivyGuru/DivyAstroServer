export function getHEALTH_ENERGY_LEVELVariants() {
  const effectTheme = 'health';
  const area = 'health_wellbeing';
  const pointId = 'HEALTH_ENERGY_LEVEL';

  const energyHouses = [1, 10];
  const recoveryHouses = [4, 12];
  const drainHouses = [6, 12, 8];

  const benefics = ['JUPITER', 'VENUS', 'MOON'];
  const drivers = ['SUN', 'MERCURY'];
  const drainers = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  const SUPPORT_IDS = [2, 5, 6, 4, 1];
  const PRESSURE_IDS = [7, 3, 8, 9];

  return [
    // 1) High energy band (confirmed)
    {
      code: 'ENERGY_HIGH_CONFIRMED',
      label: 'Energy high: supportive alignment + nakshatra confirmation.',
      scopes: ['daily', 'weekly', 'monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...drivers], house_in: energyHouses, match_mode: 'any', min_planets: 2 } },
          { overall_benefic_score: { min: 0.65 } },
          {
            any: [
              { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
              { transit_planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: energyHouses, match_mode: 'any', min_planets: 1 } },
            ],
          },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['SUN', 'MOON', 'JUPITER', 'VENUS'], group: { context: 'health', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['SUN', 'MOON', 'JUPITER', 'VENUS'], group: { context: 'health', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.8,
        tone: 'positive',
        trigger: 'combined',
        scenario: 'energy_high',
        outcome_text:
          'Energy level may move into a medium-to-high band. Nakshatra support strengthens this energy. Prioritize a consistent routine, avoid over-exertion, and delay late nights to protect recovery.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Energy indicators + supportive alignment with nakshatra confirmation indicates higher energy band.',
        },
        point_id: pointId,
      },
    },

    // 2) Low-to-moderate energy (drain pattern)
    {
      code: 'ENERGY_LOW_TO_MODERATE_DRAIN',
      label: 'Energy low-to-moderate: drain pattern active.',
      scopes: ['daily', 'weekly', 'monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: drainers, house_in: drainHouses, match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'], group: { context: 'health', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'], group: { context: 'health', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.75,
        tone: 'challenging',
        trigger: 'combined',
        scenario: 'energy_low',
        outcome_text:
          'Energy level low-to-moderate band me reh sakta hai. Low energy ≠ illness. Prioritize rest + pacing, avoid overwork, delay overload tasks when possible.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Drain houses + high malefic score with sensitive/obstructive nakshatra refinement indicates lower energy band.',
        },
        point_id: pointId,
      },
    },

    // 3) Recovery boosts energy (rest houses)
    {
      code: 'ENERGY_RECOVERY_BOOST',
      label: 'Energy improves via recovery focus.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MOON', 'VENUS'], house_in: recoveryHouses, match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'recovery_boost',
        outcome_text:
          'Recovery focus se energy gradually improve ho sakti hai. Prioritize sleep + routine, avoid over-exertion, delay long intense days until baseline stabilizes.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Recovery houses activation supports energy restoration through routine.',
        },
        point_id: pointId,
      },
    },

    // 4) Daily over-exertion caution
    {
      code: 'DAILY_OVEREXERTION_CAUTION',
      label: 'Daily caution: avoid over-exertion.',
      scopes: ['daily'],
      condition_tree: {
        transit_planet_in_house: { planet_in: ['MARS'], house_in: [1, 6], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.45,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'overexertion',
        outcome_text:
          'Today, avoiding over-exertion may be best. Prioritize breaks + hydration, avoid pushing past fatigue, and delay heavy workload if possible.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Short transit suggests temporary exertion sensitivity.',
        },
        point_id: pointId,
      },
    },

    // 5) Weekly energy stabilization
    {
      code: 'WEEKLY_ENERGY_STABILIZE',
      label: 'Weekly stabilization: maintain steady routines.',
      scopes: ['weekly'],
      condition_tree: { overall_benefic_score: { min: 0.6 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.4,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'weekly_stabilize',
        outcome_text:
          'This week, keeping energy stable may work best. Prioritize routine + sleep, avoid chaotic schedules, and delay extra commitments if recovery is lagging.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Weekly posture guidance based on general supportive baseline.',
        },
        point_id: pointId,
      },
    },

    // 6) Dasha pressure lowers energy
    {
      code: 'DASHA_ENERGY_PRESSURE',
      label: 'Dasha pressure: energy dips; protect recovery.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        all: [
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: PRESSURE_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: PRESSURE_IDS } },
              { dasha_running: { level: 'pratyantardasha', planet_in: PRESSURE_IDS } },
            ],
          },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.6,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'dasha_pressure',
        outcome_text:
          'Dasha pressure ke kaaran energy dips ho sakta hai. Prioritize rest + pacing, avoid overwork cycles, delay overload weeks if possible.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Pressure dasha alignment elevates depletion sensitivity.',
        },
        point_id: pointId,
      },
    },

    // 7) Dasha support lifts energy
    {
      code: 'DASHA_ENERGY_SUPPORT',
      label: 'Supportive dasha: energy steadies and improves.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        all: [
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: SUPPORT_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
            ],
          },
          { overall_benefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'dasha_support',
        outcome_text:
          'Energy balance can be supportive. Prioritize a steady routine, avoid extremes, and delay overcommitment so recovery stays stable.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Supportive dasha alignment supports steadier energy band.',
        },
        point_id: pointId,
      },
    },

    // 8) Energy drain via workload
    {
      code: 'ENERGY_DRAIN_WORKLOAD',
      label: 'Energy drain via workload patterns.',
      scopes: ['weekly', 'monthly'],
      condition_tree: { planet_in_house: { planet_in: ['SUN', 'SATURN'], house_in: [10, 6], match_mode: 'any', min_planets: 1 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.55,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'workload_drain',
        outcome_text:
          'Workload ke kaaran energy drain ho sakta hai. DISHA: depletion—prioritize breaks + boundaries, avoid late-night cycles, delay extra load when possible.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: '10th/6th workload emphasis suggests pacing needs for energy protection.',
        },
        point_id: pointId,
      },
    },

    // 9) Sensitive nakshatra delays energy uplift
    {
      code: 'ENERGY_UPLIFT_DELAY_NAKSHATRA',
      label: 'Energy uplift delayed by sensitive/obstructive nakshatra.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.55 } },
          { planet_in_house: { planet_in: ['SUN', 'MOON'], house_in: energyHouses, match_mode: 'any', min_planets: 1 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['SUN', 'MOON'], group: { context: 'health', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['SUN', 'MOON'], group: { context: 'health', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.55,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'nakshatra_delay',
        outcome_text:
          'Support is present, but it may not be fully strong—nakshatra sensitivity suggests energy uplift can be phased. Prioritize pacing + routine, avoid extremes, and delay overload days.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'Positive signals exist but sensitive/obstructive nakshatra indicates pacing.',
        },
        point_id: pointId,
      },
    },

    // 10) Long-term energy resilience (life_theme)
    {
      code: 'LONG_TERM_ENERGY_RESILIENCE',
      label: 'Long-term energy resilience strengthens with consistency.',
      scopes: ['yearly', 'life_theme'],
      condition_tree: { overall_benefic_score: { min: 0.65 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.45,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'long_term_resilience',
        outcome_text:
          'Long-term energy resilience medium-to-strong band me aa sakti hai (consistency dependent). Prioritize stable routines, avoid boom-bust cycles, delay all-or-nothing schedules.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Long-term baseline guidance; non-medical and non-absolute.',
        },
        point_id: pointId,
      },
    },

    // 11) High benefic baseline
    {
      code: 'ENERGY_HIGH_BENEFIC_BASELINE',
      label: 'Broad supportive baseline for energy.',
      condition_tree: { overall_benefic_score: { min: 0.7 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.4,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'benefic_baseline',
        outcome_text:
          'Energy supportive band me reh sakti hai. Prioritize consistency, avoid over-exertion, delay extremes.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Broad supportive baseline; this is wellness-oriented and non-medical.',
        },
        point_id: pointId,
      },
    },

    // 12) High malefic baseline
    {
      code: 'ENERGY_HIGH_MALEFIC_BASELINE',
      label: 'Broad caution baseline for energy.',
      condition_tree: { overall_malefic_score: { min: 0.7 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.4,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'malefic_baseline',
        outcome_text:
          'Energy protection important rahega. Prioritize rest + pacing, avoid overload, delay heavy exertion when possible.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Broad malefic baseline; framed as strain sensitivity, not illness.',
        },
        point_id: pointId,
      },
    },

    // 13) Daily posture baseline
    {
      code: 'DAILY_ENERGY_POSTURE',
      label: 'Daily posture: maintain gentle consistency.',
      scopes: ['daily'],
      condition_tree: { generic_condition: { note: 'Daily energy posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'daily_posture',
        outcome_text:
          'Today, gentle consistency may be best. Prioritize breaks + sleep, avoid pushing through fatigue, and delay overload tasks if possible.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Daily posture guidance; non-contradictory to higher levels.',
        },
        point_id: pointId,
      },
    },

    // 14) Weekly posture baseline
    {
      code: 'WEEKLY_ENERGY_POSTURE',
      label: 'Weekly posture: protect recovery.',
      scopes: ['weekly'],
      condition_tree: { generic_condition: { note: 'Weekly energy posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'weekly_posture',
        outcome_text:
          'This week, prioritizing recovery may be wise. Avoid overcommitting, delay late nights, and prioritize routine.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Weekly posture guidance; complements monthly direction.',
        },
        point_id: pointId,
      },
    },

    // 15) Informational baseline
    {
      code: 'ENERGY_LEVEL_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for energy level.',
      condition_tree: { generic_condition: { note: 'Energy level baseline.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'baseline',
        outcome_text:
          'No single strong energy signal stands out. Prioritize pacing + routine, avoid extremes, and delay overload commitments until clarity improves.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Baseline used when stronger energy-level variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


