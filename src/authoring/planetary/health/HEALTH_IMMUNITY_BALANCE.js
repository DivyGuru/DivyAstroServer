export function getHEALTH_IMMUNITY_BALANCEVariants() {
  const effectTheme = 'health';
  const area = 'health_wellbeing';
  const pointId = 'HEALTH_IMMUNITY_BALANCE';

  const resilienceHouses = [1, 4, 6];
  const drainHouses = [6, 12, 8];

  const supportive = ['JUPITER', 'MOON', 'VENUS'];
  const strain = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  const SUPPORT_IDS = [2, 5, 6, 4, 1];
  const PRESSURE_IDS = [7, 3, 8, 9];

  return [
    // 1) Resilience support yog (confirmed)
    {
      code: 'RESILIENCE_SUPPORT_YOG_CONFIRMED',
      label: 'Resilience support: stable routine response + nakshatra confirmation.',
      scopes: ['weekly', 'monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: supportive, house_in: resilienceHouses, match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.65 } },
          {
            any: [
              { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
              { transit_planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: resilienceHouses, match_mode: 'any', min_planets: 1 } },
            ],
          },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: supportive, group: { context: 'health', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: supportive, group: { context: 'health', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.75,
        tone: 'positive',
        trigger: 'combined',
        scenario: 'resilience_support',
        outcome_text:
          'Energy balance can be supportive, and a resilience-support yog is present. Nakshatra support strengthens this stability. Prioritize routine + rest, avoid extremes, and delay overload weeks.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Supportive resilience indicators + alignment with nakshatra confirmation indicates stronger balance.',
        },
        point_id: pointId,
      },
    },

    // 2) Resilience sensitive (strain + drain)
    {
      code: 'RESILIENCE_SENSITIVE_STRAIN',
      label: 'Resilience sensitivity: strain indicators active; protect energy.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: strain, house_in: drainHouses, match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.65 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'resilience_sensitive',
        outcome_text:
          'Resilience sensitivity badh sakti hai. High strain ≠ illness—sirf recovery ko protect karna zaroori hai. Prioritize rest + boundaries, avoid overwork, delay overload commitments.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Drain houses + elevated malefic score indicates lower resilience band.',
        },
        point_id: pointId,
      },
    },

    // 3) Lifestyle consistency improves balance
    {
      code: 'RESILIENCE_IMPROVES_WITH_CONSISTENCY',
      label: 'Resilience improves with consistent routine.',
      scopes: ['monthly', 'yearly'],
      condition_tree: { overall_benefic_score: { min: 0.6 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'consistency',
        outcome_text:
          'Balance gradual improve ho sakta hai (consistency dependent). Prioritize sleep + routine, avoid extremes, delay overload cycles.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Broad supportive posture; non-medical.' },
        point_id: pointId,
      },
    },

    // 4) Daily sensitivity caution
    {
      code: 'DAILY_RESILIENCE_SENSITIVITY',
      label: 'Daily sensitivity: keep day light.',
      scopes: ['daily'],
      condition_tree: {
        all: [
          { transit_planet_in_house: { planet_in: ['MARS', 'RAHU'], house_in: [6, 12, 1], match_mode: 'any', min_planets: 1 } },
          {
            any: [
              { transit_planet_in_nakshatra_group: { planet_in: ['MARS', 'RAHU'], group: { context: 'health', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { transit_planet_in_nakshatra_group: { planet_in: ['MARS', 'RAHU'], group: { context: 'health', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.45,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'daily_sensitivity',
        outcome_text:
          'Today, sensitivity may be higher. Prioritize rest + hydration, avoid overexertion, and delay overload tasks if possible.',
        variant_meta: { tone: 'cautionary', confidence_level: 'low', dominance: 'background', certainty_note: 'Short transit suggests temporary sensitivity.' },
        point_id: pointId,
      },
    },

    // 5) Weekly stabilization
    {
      code: 'WEEKLY_RESILIENCE_STABILIZE',
      label: 'Weekly stabilize: protect recovery rhythm.',
      scopes: ['weekly'],
      condition_tree: { generic_condition: { note: 'Weekly resilience stabilization posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'weekly_posture',
        outcome_text:
          'This week, protect the recovery rhythm. Prioritize sleep + breaks, avoid overload, and delay late nights.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Weekly posture guidance; non-contradictory.' },
        point_id: pointId,
      },
    },

    // 6) Dasha support improves balance
    {
      code: 'DASHA_RESILIENCE_SUPPORT',
      label: 'Supportive dasha: balance steadies.',
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
        intensity: 0.5,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'dasha_support',
        outcome_text:
          'Balance ko support mil sakta hai. Prioritize routine + rest, avoid extremes, delay overload commitments.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Supportive dasha alignment supports steadier balance.' },
        point_id: pointId,
      },
    },

    // 7) Dasha pressure increases sensitivity
    {
      code: 'DASHA_RESILIENCE_PRESSURE',
      label: 'Pressure dasha: sensitivity increases; protect routine.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        all: [
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: PRESSURE_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: PRESSURE_IDS } },
            ],
          },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.55,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'dasha_pressure',
        outcome_text:
          'Dasha pressure ke kaaran sensitivity badh sakti hai. Prioritize rest + boundaries, avoid overload, delay extra responsibilities.',
        variant_meta: { tone: 'cautionary', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Pressure dasha alignment indicates higher strain sensitivity.' },
        point_id: pointId,
      },
    },

    // 8) Sensitive nakshatra delays balance
    {
      code: 'BALANCE_DELAY_BY_NAKSHATRA',
      label: 'Nakshatra sensitivity delays stability.',
      scopes: ['monthly'],
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.55 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: supportive, group: { context: 'health', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: supportive, group: { context: 'health', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.5,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'nakshatra_delay',
        outcome_text:
          'Support is present, but it may not be fully strong—nakshatra sensitivity suggests stability can be phased. Prioritize routine, avoid extremes, and delay overload weeks.',
        variant_meta: { tone: 'cautionary', confidence_level: 'medium', dominance: 'background', certainty_note: 'Nakshatra sensitivity indicates pacing; non-medical.' },
        point_id: pointId,
      },
    },

    // 9) Long-term resilience direction
    {
      code: 'LONG_TERM_RESILIENCE_DIRECTION',
      label: 'Long-term resilience direction improves with consistency.',
      scopes: ['yearly', 'life_theme'],
      condition_tree: { overall_benefic_score: { min: 0.65 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.45,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'long_term',
        outcome_text:
          'Long-term resilience direction may be supportive. Prioritize consistency, avoid boom-bust routines, and delay all-or-nothing schedules.',
        variant_meta: { tone: 'opportunity', confidence_level: 'low', dominance: 'background', certainty_note: 'Long-term baseline guidance; non-absolute.' },
        point_id: pointId,
      },
    },

    // 10) Mixed environment posture
    {
      code: 'RESILIENCE_MIXED_ENVIRONMENT',
      label: 'Mixed environment: protect balance.',
      scopes: ['monthly'],
      condition_tree: { all: [{ overall_benefic_score: { min: 0.55 } }, { overall_malefic_score: { min: 0.55 } }] },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.5,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed',
        outcome_text:
          'Support aur strain dono active ho sakte hain. Prioritize pacing + rest, avoid overload, delay late nights.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Mixed signals; balance-first approach.' },
        point_id: pointId,
      },
    },

    // 11) High benefic baseline
    {
      code: 'IMMUNITY_HIGH_BENEFIC_BASELINE',
      label: 'Broad supportive baseline for balance.',
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
          'Balance supportive ho sakta hai. Prioritize routine, avoid extremes, delay overload commitments.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Broad supportive baseline; non-medical.' },
        point_id: pointId,
      },
    },

    // 12) High malefic baseline
    {
      code: 'IMMUNITY_HIGH_MALEFIC_BASELINE',
      label: 'Broad caution baseline for balance.',
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
          'Sensitivity high reh sakti hai. Prioritize rest + boundaries, avoid overload, delay extremes.',
        variant_meta: { tone: 'cautionary', confidence_level: 'low', dominance: 'background', certainty_note: 'Broad malefic baseline; calm caution.' },
        point_id: pointId,
      },
    },

    // 13) Daily posture
    {
      code: 'DAILY_BALANCE_POSTURE',
      label: 'Daily posture: keep routine stable.',
      scopes: ['daily'],
      condition_tree: { generic_condition: { note: 'Daily balance posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'daily_posture',
        outcome_text:
          'Today, keeping routine stable may work best. Prioritize rest + hydration, avoid over-exertion, and delay overload tasks if possible.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Daily posture guidance.' },
        point_id: pointId,
      },
    },

    // 14) Weekly posture
    {
      code: 'WEEKLY_BALANCE_POSTURE',
      label: 'Weekly posture: recovery-first.',
      scopes: ['weekly'],
      condition_tree: { generic_condition: { note: 'Weekly balance posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'weekly_posture',
        outcome_text:
          'This week, prioritizing recovery may be wise. Avoid overload, delay late nights, and prioritize consistency.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Weekly posture guidance.' },
        point_id: pointId,
      },
    },

    // 15) Informational baseline
    {
      code: 'IMMUNITY_BALANCE_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for immunity balance.',
      condition_tree: { generic_condition: { note: 'Immunity balance baseline.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'baseline',
        outcome_text:
          'No single strong balance signal stands out. Prioritize routine + rest, avoid extremes, and delay overload commitments until clarity improves.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Baseline used when stronger balance variants do not match.' },
        point_id: pointId,
      },
    },
  ];
}


