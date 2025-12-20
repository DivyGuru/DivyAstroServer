export function getHEALTH_LIFESTYLE_IMPACTVariants() {
  const effectTheme = 'health';
  const area = 'health_wellbeing';
  const pointId = 'HEALTH_LIFESTYLE_IMPACT';

  const routineHouses = [6, 1, 4];
  const disruptionHouses = [12, 8, 6];

  const supportive = ['MOON', 'VENUS', 'JUPITER'];
  const disruptive = ['RAHU', 'KETU', 'MARS', 'SATURN'];

  const SUPPORT_IDS = [2, 5, 6, 4, 1];
  const PRESSURE_IDS = [7, 3, 8, 9];

  return [
    // 1) Lifestyle balance supports wellbeing (confirmed)
    {
      code: 'LIFESTYLE_BALANCE_SUPPORT_CONFIRMED',
      label: 'Lifestyle balance: supportive routine + nakshatra confirmation.',
      scopes: ['weekly', 'monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: supportive, house_in: routineHouses, match_mode: 'any', min_planets: 2 } },
          { overall_benefic_score: { min: 0.65 } },
          {
            any: [
              { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
              { transit_planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: routineHouses, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'lifestyle_support',
        outcome_text:
          'Lifestyle balance can be supportive, and a wellness-support yog is present. Nakshatra support strengthens this routine. Prioritize consistent sleep + routine, avoid extremes, and delay overload weeks.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Routine indicators + supportive alignment with nakshatra confirmation indicates stronger lifestyle support.',
        },
        point_id: pointId,
      },
    },

    // 2) Routine disruption increases strain
    {
      code: 'ROUTINE_DISRUPTION_STRAIN',
      label: 'Routine disruption: strain rises with inconsistency.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: disruptive, house_in: disruptionHouses, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'routine_disruption',
        outcome_text:
          'Routine disruption se strain badh sakta hai. Prioritize simple routine + boundaries, avoid late-night cycles, delay overload commitments until rhythm stabilizes.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Disruption houses + elevated malefic score indicates strain from inconsistency.',
        },
        point_id: pointId,
      },
    },

    // 3) Lifestyle redirection phase
    {
      code: 'LIFESTYLE_REDIRECTION_PHASE',
      label: 'Redirection: routine reset improves outcomes.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['RAHU', 'KETU'], house_in: [6, 12, 1], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'redirection',
        outcome_text:
          'DISHA: routine redirection phase—small resets se balance improve ho sakta hai. Prioritize sleep + boundaries, avoid chaotic schedules, delay overload weeks.',
        variant_meta: { tone: 'informational', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Rahu/Ketu patterns suggest routine reset needs.' },
        point_id: pointId,
      },
    },

    // 4) Daily lifestyle caution
    {
      code: 'DAILY_LIFESTYLE_CAUTION',
      label: 'Daily posture: keep routine gentle.',
      scopes: ['daily'],
      condition_tree: { generic_condition: { note: 'Daily lifestyle posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'daily_posture',
        outcome_text:
          'Today, keep routine gentle. Prioritize breaks + sleep, avoid overstimulation, and delay overload tasks if possible.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Daily posture guidance.' },
        point_id: pointId,
      },
    },

    // 5) Weekly routine stabilization
    {
      code: 'WEEKLY_ROUTINE_STABILIZE',
      label: 'Weekly posture: stabilize routine.',
      scopes: ['weekly'],
      condition_tree: { generic_condition: { note: 'Weekly routine stabilization posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'weekly_posture',
        outcome_text:
          'This week, routine stabilization may work best. Prioritize consistency, avoid late nights, and delay extra commitments until rhythm returns.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Weekly posture guidance.' },
        point_id: pointId,
      },
    },

    // 6) Dasha support strengthens lifestyle consistency
    {
      code: 'DASHA_LIFESTYLE_SUPPORT',
      label: 'Supportive dasha: lifestyle consistency becomes easier.',
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
        trend: 'up',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'dasha_support',
        outcome_text:
          'A routine-stabilization yog is present. Prioritize consistency, avoid extremes, and delay overload weeks.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Supportive dasha alignment supports routine formation.' },
        point_id: pointId,
      },
    },

    // 7) Dasha pressure disrupts routine
    {
      code: 'DASHA_LIFESTYLE_PRESSURE',
      label: 'Pressure dasha: routine disruption risk; protect basics.',
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
        intensity: 0.55,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'dasha_pressure',
        outcome_text:
          'Dasha pressure ke kaaran routine disrupt ho sakti hai. Prioritize basics (sleep + breaks), avoid overwork, delay extra load when possible.',
        variant_meta: { tone: 'cautionary', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Pressure dasha alignment indicates routine fragility.' },
        point_id: pointId,
      },
    },

    // 8) Sensitive nakshatra makes routine harder
    {
      code: 'ROUTINE_SENSITIVITY_NAKSHATRA',
      label: 'Nakshatra sensitivity: routine needs extra gentleness.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { overall_malefic_score: { min: 0.55 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: disruptive, group: { context: 'health', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: disruptive, group: { context: 'health', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
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
          'Nakshatra sensitivity ke kaaran routine maintain karna challenging ho sakta hai. Prioritize gentle consistency, avoid extremes, delay overload commitments.',
        variant_meta: { tone: 'cautionary', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Nakshatra refinement highlights sensitivity; non-medical.' },
        point_id: pointId,
      },
    },

    // 9) Mixed lifestyle signals
    {
      code: 'LIFESTYLE_MIXED_SIGNALS',
      label: 'Mixed lifestyle signals: stepwise improvements.',
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
          'Routine support aur disruption dono active ho sakte hain. Prioritize stepwise routine upgrades, avoid extremes, delay overload weeks.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Mixed environment; stepwise changes recommended.' },
        point_id: pointId,
      },
    },

    // 10) Long-term lifestyle resilience
    {
      code: 'LONG_TERM_LIFESTYLE_RESILIENCE',
      label: 'Long-term: routine consistency compounds wellness.',
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
          'Long-term me routine consistency se resilience improve ho sakti hai. Prioritize consistency, avoid boom-bust cycles, delay all-or-nothing routines.',
        variant_meta: { tone: 'opportunity', confidence_level: 'low', dominance: 'background', certainty_note: 'Long-term baseline guidance; non-absolute.' },
        point_id: pointId,
      },
    },

    // 11) High benefic baseline
    {
      code: 'LIFESTYLE_HIGH_BENEFIC_BASELINE',
      label: 'Broad supportive baseline for lifestyle.',
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
          'Lifestyle balance supportive ho sakta hai. Prioritize consistency, avoid extremes, delay overload commitments.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Broad supportive baseline; non-medical.' },
        point_id: pointId,
      },
    },

    // 12) High malefic baseline
    {
      code: 'LIFESTYLE_HIGH_MALEFIC_BASELINE',
      label: 'Broad caution baseline for lifestyle.',
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
          'Routine protection priority rahegi. Prioritize basics, avoid overload, delay late-night cycles.',
        variant_meta: { tone: 'cautionary', confidence_level: 'low', dominance: 'background', certainty_note: 'Broad malefic baseline; calm caution.' },
        point_id: pointId,
      },
    },

    // 13) Monthly posture
    {
      code: 'MONTHLY_LIFESTYLE_POSTURE',
      label: 'Monthly posture: simplify and stabilize.',
      scopes: ['monthly'],
      condition_tree: { generic_condition: { note: 'Monthly lifestyle posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'monthly_posture',
        outcome_text:
          'Is mahine routine ko simplify karke stabilize karna best rahega. Prioritize consistency, avoid extremes, delay overload weeks.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Monthly posture guidance.' },
        point_id: pointId,
      },
    },

    // 14) Yearly posture
    {
      code: 'YEARLY_LIFESTYLE_POSTURE',
      label: 'Yearly posture: protect basics.',
      scopes: ['yearly'],
      condition_tree: { generic_condition: { note: 'Yearly lifestyle posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'yearly_posture',
        outcome_text:
          'Is varsh basics ko protect karna priority rahega. Prioritize sleep + breaks, avoid overwork cycles, delay overload commitments.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Yearly posture guidance.' },
        point_id: pointId,
      },
    },

    // 15) Informational baseline
    {
      code: 'LIFESTYLE_IMPACT_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for lifestyle impact.',
      condition_tree: { generic_condition: { note: 'Lifestyle impact baseline.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'baseline',
        outcome_text:
          'No single strong lifestyle signal stands out. Prioritize routine + rest, avoid extremes, and delay overload commitments until clarity improves.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Baseline used when stronger lifestyle variants do not match.' },
        point_id: pointId,
      },
    },
  ];
}


