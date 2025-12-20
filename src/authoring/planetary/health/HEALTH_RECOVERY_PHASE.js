export function getHEALTH_RECOVERY_PHASEVariants() {
  const effectTheme = 'health';
  const area = 'health_wellbeing';
  const pointId = 'HEALTH_RECOVERY_PHASE';

  const recoveryHouses = [4, 12, 1];
  const strainHouses = [6, 8, 12];

  const recoveryPlanets = ['MOON', 'VENUS', 'JUPITER'];
  const strainPlanets = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  const SUPPORT_IDS = [2, 5, 6, 4, 1];
  const PRESSURE_IDS = [7, 3, 8, 9];

  return [
    // 1) Strong recovery yog (confirmed)
    {
      code: 'RECOVERY_YOG_STRONG_CONFIRMED',
      label: 'Recovery yog strong: supportive alignment + nakshatra confirmation.',
      scopes: ['weekly', 'monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: recoveryPlanets, house_in: recoveryHouses, match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.65 } },
          {
            any: [
              { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
              { transit_planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: recoveryHouses, match_mode: 'any', min_planets: 1 } },
            ],
          },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: recoveryPlanets, group: { context: 'health', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: recoveryPlanets, group: { context: 'health', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.85,
        tone: 'positive',
        trigger: 'combined',
        scenario: 'recovery_strong',
        outcome_text:
          'A recovery/healing yog is strong. Nakshatra support strengthens this phase. DISHA: repair—prioritize sleep + a gentle routine, avoid overwork, and delay overload commitments.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Recovery indicators + supportive alignment with nakshatra confirmation indicates strong repair phase.',
        },
        point_id: pointId,
      },
    },

    // 2) Repair after strain (vipreet-style recovery pattern)
    {
      code: 'RECOVERY_AFTER_STRAIN_PATTERN',
      label: 'Recovery after strain: discipline helps reverse the trend.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        all: [
          { overall_malefic_score: { min: 0.55 } },
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: PRESSURE_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: PRESSURE_IDS } },
            ],
          },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'mixed',
        trigger: 'dasha',
        scenario: 'recovery_after_strain',
        outcome_text:
          'Recovery phase gradual ho sakta hai—pressure ke beech routine se trend better hota hai. Prioritize consistency + pacing, avoid extremes, delay overload cycles.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Mixed dasha environment; framed as recovery-through-discipline, not medical.',
        },
        point_id: pointId,
      },
    },

    // 3) Strain blocks recovery (sensitive)
    {
      code: 'RECOVERY_BLOCKED_BY_STRAIN',
      label: 'Recovery blocked by strain: reduce load to restore.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: strainPlanets, house_in: strainHouses, match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.65 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: strainPlanets, group: { context: 'health', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: strainPlanets, group: { context: 'health', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'recovery_blocked',
        outcome_text:
          'Recovery ko time lag sakta hai—strain sensitivity high hai. Nakshatra sensitivity is pacing ko highlight karti hai. Prioritize rest + boundaries, avoid over-exertion, delay overload days.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Strain indicators with sensitive/obstructive nakshatra suggests recovery needs pacing.',
        },
        point_id: pointId,
      },
    },

    // 4) Daily gentle mode
    {
      code: 'DAILY_GENTLE_MODE',
      label: 'Daily gentle mode: reduce stimulation and pace.',
      scopes: ['daily'],
      condition_tree: { generic_condition: { note: 'Daily recovery gentle mode posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'daily_gentle',
        outcome_text:
          'Today, gentle mode may work best. Prioritize rest + routine, avoid over-exertion, and delay heavy workload if possible.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Daily posture guidance for recovery focus.' },
        point_id: pointId,
      },
    },

    // 5) Weekly repair window (supportive transit)
    {
      code: 'WEEKLY_REPAIR_WINDOW',
      label: 'Weekly repair: supportive rest routine window.',
      scopes: ['weekly'],
      condition_tree: { transit_planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: [4, 12, 1], match_mode: 'any', min_planets: 1 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.45,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'weekly_repair',
        outcome_text:
          'This week, recovery can be better supported. Prioritize rest + consistency, avoid overload, and delay late nights.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Weekly transit indicates repair-friendly posture.' },
        point_id: pointId,
      },
    },

    // 6) Monthly repair focus
    {
      code: 'MONTHLY_REPAIR_FOCUS',
      label: 'Monthly focus: rebuild recovery capacity.',
      scopes: ['monthly'],
      condition_tree: { overall_benefic_score: { min: 0.6 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.4,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'monthly_repair',
        outcome_text:
          'Is mahine recovery capacity ko rebuild karna best rahega. Prioritize routine + sleep, avoid extremes, delay overload weeks.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Monthly posture guidance; non-medical.' },
        point_id: pointId,
      },
    },

    // 7) Dasha support: faster stabilization
    {
      code: 'DASHA_RECOVERY_SUPPORT',
      label: 'Supportive dasha: recovery stabilizes sooner.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        all: [
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: SUPPORT_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
              { dasha_running: { level: 'pratyantardasha', planet_in: SUPPORT_IDS } },
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
          'A stabilization yog for recovery is present. DISHA: repair—prioritize a steady routine, avoid extremes, and delay overload cycles.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Supportive dasha alignment supports steadier recovery.' },
        point_id: pointId,
      },
    },

    // 8) Dasha pressure: pacing needed
    {
      code: 'DASHA_RECOVERY_PRESSURE',
      label: 'Pressure dasha: recovery needs pacing.',
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
          'With dasha pressure, pacing is important for recovery. Prioritize rest + boundaries, avoid over-exertion, and delay overload weeks.',
        variant_meta: { tone: 'cautionary', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Pressure dasha alignment increases strain sensitivity; non-medical framing.' },
        point_id: pointId,
      },
    },

    // 9) Sensitive nakshatra slows recovery
    {
      code: 'RECOVERY_DELAY_BY_NAKSHATRA',
      label: 'Nakshatra sensitivity: recovery phased.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.55 } },
          { planet_in_house: { planet_in: ['MOON', 'VENUS'], house_in: recoveryHouses, match_mode: 'any', min_planets: 1 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['MOON', 'VENUS'], group: { context: 'health', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['MOON', 'VENUS'], group: { context: 'health', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
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
          'Support is present, but results can be phased—nakshatra sensitivity suggests pacing. Prioritize a gentle routine, avoid extremes, and delay overload days.',
        variant_meta: { tone: 'cautionary', confidence_level: 'medium', dominance: 'background', certainty_note: 'Positive recovery signals exist but nakshatra sensitivity indicates pacing.' },
        point_id: pointId,
      },
    },

    // 10) Yearly recovery posture
    {
      code: 'YEARLY_RECOVERY_POSTURE',
      label: 'Yearly posture: protect recovery capacity.',
      scopes: ['yearly'],
      condition_tree: { generic_condition: { note: 'Yearly recovery posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'yearly_posture',
        outcome_text:
          'Is varsh recovery capacity ko protect karna priority rahega. Prioritize routine + rest, avoid overwork cycles, delay overload phases.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Yearly posture guidance; non-medical.' },
        point_id: pointId,
      },
    },

    // 11) Mixed signals
    {
      code: 'RECOVERY_MIXED_SIGNALS',
      label: 'Mixed recovery signals: stepwise improvement.',
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
          'Recovery aur strain dono active ho sakte hain. Prioritize stepwise routine improvements, avoid extremes, delay overload weeks.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Mixed environment; stepwise recovery emphasized.' },
        point_id: pointId,
      },
    },

    // 12) High benefic baseline
    {
      code: 'RECOVERY_HIGH_BENEFIC_BASELINE',
      label: 'Broad supportive baseline for recovery.',
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
          'Recovery support favorable ho sakta hai. Prioritize consistency, avoid over-exertion, delay overload commitments.',
        variant_meta: { tone: 'opportunity', confidence_level: 'low', dominance: 'background', certainty_note: 'Broad supportive baseline; not a medical claim.' },
        point_id: pointId,
      },
    },

    // 13) High malefic baseline
    {
      code: 'RECOVERY_HIGH_MALEFIC_BASELINE',
      label: 'Broad caution baseline for recovery.',
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
          'Recovery pacing important rahegi. Prioritize rest + boundaries, avoid overload, delay major exertion.',
        variant_meta: { tone: 'cautionary', confidence_level: 'low', dominance: 'background', certainty_note: 'Broad malefic baseline; calm caution.' },
        point_id: pointId,
      },
    },

    // 14) Weekly posture
    {
      code: 'WEEKLY_RECOVERY_POSTURE',
      label: 'Weekly posture: recovery-first.',
      scopes: ['weekly'],
      condition_tree: { generic_condition: { note: 'Weekly recovery posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'weekly_posture',
        outcome_text:
          'This week, prioritizing recovery may be wise. Avoid overcommitment, delay overload tasks, and prioritize routine.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Weekly posture guidance.' },
        point_id: pointId,
      },
    },

    // 15) Informational baseline
    {
      code: 'RECOVERY_PHASE_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for recovery phase.',
      condition_tree: { generic_condition: { note: 'Recovery phase baseline.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'baseline',
        outcome_text:
          'No single strong recovery signal stands out. Prioritize routine + rest, avoid extremes, and delay overload weeks until clarity improves.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Baseline used when stronger recovery variants do not match.' },
        point_id: pointId,
      },
    },
  ];
}


