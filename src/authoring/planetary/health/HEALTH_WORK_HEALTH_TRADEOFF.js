export function getHEALTH_WORK_HEALTH_TRADEOFFVariants() {
  const effectTheme = 'health';
  const area = 'health_wellbeing';
  const pointId = 'HEALTH_WORK_HEALTH_TRADEOFF';

  const workHouses = [10, 6];
  const restHouses = [4, 12];
  const overloadHouses = [6, 12, 8];

  const workloadPlanets = ['SUN', 'SATURN', 'MARS'];
  const recoveryPlanets = ['MOON', 'VENUS', 'JUPITER'];

  const SUPPORT_IDS = [2, 5, 6, 4, 1];
  const PRESSURE_IDS = [7, 3, 8, 9];

  return [
    // 1) Work-health tradeoff high (confirmed)
    {
      code: 'WORK_HEALTH_TRADEOFF_HIGH_CONFIRMED',
      label: 'Work-health tradeoff: workload dominates; recovery must be protected.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: workloadPlanets, house_in: workHouses, match_mode: 'any', min_planets: 2 } },
          { planet_in_house: { planet_in: ['SATURN', 'MARS', 'RAHU'], house_in: overloadHouses, match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.65 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: workloadPlanets, group: { context: 'health', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: workloadPlanets, group: { context: 'health', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.8,
        tone: 'challenging',
        trigger: 'combined',
        scenario: 'tradeoff_high',
        outcome_text:
          'Work–health tradeoff may be stronger in this phase. Nakshatra sensitivity reinforces this strain. Prioritize boundaries + breaks, avoid overwork, and delay extra responsibilities where possible.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Workload indicators + elevated malefic score with sensitive/obstructive nakshatra refinement.',
        },
        point_id: pointId,
      },
    },

    // 2) Work supports structure without overload
    {
      code: 'WORK_STRUCTURE_WITH_BALANCE',
      label: 'Work structure supports routine when balanced.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [10, 6], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
          { overall_malefic_score: { max: 0.8 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'structure_balance',
        outcome_text:
          'Work structure can stabilize routine, but pacing is important. Prioritize timeboxing + breaks, avoid stretching days too long, and delay non-critical tasks.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Saturn gives structure; balance needed to avoid drain.' },
        point_id: pointId,
      },
    },

    // 3) Recovery supports work sustainability
    {
      code: 'RECOVERY_SUPPORTS_SUSTAINABILITY',
      label: 'Recovery support helps sustain workload.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: recoveryPlanets, house_in: restHouses, match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'recovery_support',
        outcome_text:
          'Recovery support se workload sustain karna easier ho sakta hai. Prioritize sleep + routine, avoid late nights, delay overload phases.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Rest houses activation supports sustainable work rhythm.' },
        point_id: pointId,
      },
    },

    // 4) Daily overload caution
    {
      code: 'DAILY_OVERLOAD_CAUTION',
      label: 'Daily overload caution: keep tasks limited.',
      scopes: ['daily'],
      condition_tree: { transit_planet_in_house: { planet_in: ['MARS', 'SATURN'], house_in: [6, 10], match_mode: 'any', min_planets: 1 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.45,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'daily_overload',
        outcome_text:
          'Today, avoiding overload may be best. Prioritize top-3 tasks, avoid multitasking, and delay non-urgent commitments if possible.',
        variant_meta: { tone: 'cautionary', confidence_level: 'low', dominance: 'background', certainty_note: 'Short transit suggests temporary overload sensitivity.' },
        point_id: pointId,
      },
    },

    // 5) Weekly balance push
    {
      code: 'WEEKLY_BALANCE_PUSH',
      label: 'Weekly balance: protect rest windows.',
      scopes: ['weekly'],
      condition_tree: { generic_condition: { note: 'Weekly work-health balance posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'weekly_posture',
        outcome_text:
          'This week, protecting rest windows may work best. Avoid overcommitment, delay overload tasks, and prioritize routine.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Weekly posture guidance.' },
        point_id: pointId,
      },
    },

    // 6) Dasha pressure increases tradeoff
    {
      code: 'DASHA_WORK_HEALTH_PRESSURE',
      label: 'Pressure dasha: tradeoff increases; protect recovery.',
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
        intensity: 0.6,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'dasha_pressure',
        outcome_text:
          'Dasha pressure ke saath work–health tradeoff badh sakta hai. Prioritize boundaries + rest, avoid overwork cycles, delay overload phases.',
        variant_meta: { tone: 'cautionary', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Pressure dasha alignment increases depletion sensitivity.' },
        point_id: pointId,
      },
    },

    // 7) Dasha support stabilizes tradeoff
    {
      code: 'DASHA_WORK_HEALTH_SUPPORT',
      label: 'Supportive dasha: balance easier with routine.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        all: [
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: SUPPORT_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
            ],
          },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'dasha_support',
        outcome_text:
          'A balance-stabilization yog is present (routine-dependent). Prioritize consistency, avoid extremes, and delay overload cycles.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'medium', dominance: 'background', certainty_note: 'Supportive dasha alignment helps stabilize tradeoff.' },
        point_id: pointId,
      },
    },

    // 8) Sensitive nakshatra increases overload sensitivity
    {
      code: 'OVERLOAD_SENSITIVITY_NAKSHATRA',
      label: 'Nakshatra sensitivity: overload threshold reduces.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { overall_malefic_score: { min: 0.55 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: workloadPlanets, group: { context: 'health', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: workloadPlanets, group: { context: 'health', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.55,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'nakshatra_sensitivity',
        outcome_text:
          'Nakshatra sensitivity ke kaaran overload threshold sensitive reh sakta hai. Prioritize pacing + breaks, avoid overwork, delay extra load if possible.',
        variant_meta: { tone: 'cautionary', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Nakshatra refinement indicates pacing needs.' },
        point_id: pointId,
      },
    },

    // 9) Mixed signals
    {
      code: 'WORK_HEALTH_MIXED_SIGNALS',
      label: 'Mixed: productivity and strain both active.',
      scopes: ['monthly'],
      condition_tree: { all: [{ overall_benefic_score: { min: 0.55 } }, { overall_malefic_score: { min: 0.55 } }] },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.55,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed',
        outcome_text:
          'Output aur strain dono active ho sakte hain. Prioritize balance + boundaries, avoid overcommitment, delay overload days.',
        variant_meta: { tone: 'informational', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Mixed environment; balance-first advice.' },
        point_id: pointId,
      },
    },

    // 10) Long-term sustainability posture
    {
      code: 'LONG_TERM_SUSTAINABILITY',
      label: 'Long-term: sustainable rhythm matters.',
      scopes: ['yearly', 'life_theme'],
      condition_tree: { generic_condition: { note: 'Long-term sustainability posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'long_term',
        outcome_text:
          'Agle 2–5 saal me 2 baar routine reset ki zarurat ho sakti hai (phases). Prioritize sustainable rhythm, avoid boom-bust cycles, delay chronic overload patterns.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Count-based phases framing; non-medical.' },
        point_id: pointId,
      },
    },

    // 11) High benefic baseline
    {
      code: 'WORK_HEALTH_HIGH_BENEFIC_BASELINE',
      label: 'Broad supportive baseline for work-health balance.',
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
          'Work–health balance manageable ho sakta hai. Prioritize routine, avoid extremes, delay overload commitments.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Broad supportive baseline; non-absolute.' },
        point_id: pointId,
      },
    },

    // 12) High malefic baseline
    {
      code: 'WORK_HEALTH_HIGH_MALEFIC_BASELINE',
      label: 'Broad caution baseline for work-health balance.',
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
          'Tradeoff sensitivity high reh sakti hai. Prioritize boundaries + rest, avoid overwork cycles, delay overload days.',
        variant_meta: { tone: 'cautionary', confidence_level: 'low', dominance: 'background', certainty_note: 'Broad malefic baseline; calm caution.' },
        point_id: pointId,
      },
    },

    // 13) Daily posture
    {
      code: 'DAILY_WORK_HEALTH_POSTURE',
      label: 'Daily posture: protect breaks.',
      scopes: ['daily'],
      condition_tree: { generic_condition: { note: 'Daily work-health posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'daily_posture',
        outcome_text:
          'Today, protect breaks. Avoid overcommitment, delay non-essential tasks, and prioritize routine.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Daily posture guidance.' },
        point_id: pointId,
      },
    },

    // 14) Monthly posture
    {
      code: 'MONTHLY_WORK_HEALTH_POSTURE',
      label: 'Monthly posture: simplify workload.',
      scopes: ['monthly'],
      condition_tree: { generic_condition: { note: 'Monthly work-health posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'monthly_posture',
        outcome_text:
          'Is mahine workload ko simplify karna best rahega. Prioritize boundaries, avoid overload, delay extra responsibilities where possible.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Monthly posture guidance.' },
        point_id: pointId,
      },
    },

    // 15) Informational baseline
    {
      code: 'WORK_HEALTH_TRADEOFF_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for work-health tradeoff.',
      condition_tree: { generic_condition: { note: 'Work-health tradeoff baseline.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'baseline',
        outcome_text:
          'No single strong tradeoff signal stands out. Prioritize routine + breaks, avoid overload, and delay extra commitments until clarity improves.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Baseline used when stronger tradeoff variants do not match.' },
        point_id: pointId,
      },
    },
  ];
}


