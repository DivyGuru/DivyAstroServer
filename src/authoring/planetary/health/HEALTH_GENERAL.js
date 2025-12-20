export function getHEALTH_GENERALVariants() {
  const effectTheme = 'health';
  const area = 'health_wellbeing';
  const pointId = 'HEALTH_GENERAL';

  const vitalityHouses = [1, 6, 10];
  const recoveryHouses = [4, 12];
  const drainHouses = [6, 8, 12];

  const benefics = ['JUPITER', 'VENUS', 'MOON'];
  const stabilizers = ['SATURN'];
  const agitators = ['MARS', 'RAHU', 'KETU'];

  const SUPPORT_IDS = [2, 5, 6, 4, 1]; // Moon/Jupiter/Venus/Mercury/Sun
  const PRESSURE_IDS = [7, 3, 8, 9]; // Saturn/Mars/Rahu/Ketu

  return [
    // 1) Strong vitality support (confirmed)
    {
      code: 'VITALITY_SUPPORT_STRONG_CONFIRMED',
      label: 'General vitality support: supportive alignment + nakshatra confirmation.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, 'SUN'], house_in: vitalityHouses, match_mode: 'any', min_planets: 2 } },
          { overall_benefic_score: { min: 0.65 } },
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: SUPPORT_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
              { transit_planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: vitalityHouses, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'vitality_support',
        outcome_text:
          'A vitality-support yog is present. Nakshatra support strengthens this signal. DISHA: energy inflow—prioritize rest + routine, avoid over-exertion, and delay overload days when possible.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Vitality indicators + supportive alignment ke saath nakshatra confirmation present hai.',
        },
        point_id: pointId,
      },
    },

    // 2) Recovery support present (weekly/monthly)
    {
      code: 'RECOVERY_SUPPORT_PHASE',
      label: 'Recovery support: rest/routine phases feel more effective.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MOON', 'VENUS', 'JUPITER'], house_in: recoveryHouses, match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['MOON', 'VENUS'], group: { context: 'health', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['MOON', 'VENUS'], group: { context: 'health', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.65,
        tone: 'positive',
        trigger: 'combined',
        scenario: 'recovery_support',
        outcome_text:
          'A recovery/healing yog is strong. DISHA: repair—prioritize sleep, hydration, and a gentle routine; avoid pushing through fatigue; delay major exertion if possible.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Recovery houses + supportive score with nakshatra confirmation indicates stronger repair phase.',
        },
        point_id: pointId,
      },
    },

    // 3) Strain sensitivity (drain houses + pressure)
    {
      code: 'STRAIN_SENSITIVITY_HIGH',
      label: 'Strain sensitivity: depletion risk rises; manage load calmly.',
      scopes: ['weekly', 'monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...agitators, ...stabilizers], house_in: drainHouses, match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.65 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['MARS', 'RAHU', 'KETU', 'SATURN'], group: { context: 'health', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['MARS', 'RAHU', 'KETU', 'SATURN'], group: { context: 'health', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'strain_high',
        outcome_text:
          'In this phase, a strain yog may be active. Nakshatra sensitivity reinforces this load. ENERGY vs STRAIN: high strain ≠ illness—prioritize rest + boundaries, avoid overwork, and delay overload commitments.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Drain houses + high malefic score with sensitive/obstructive nakshatra refinement indicates higher strain sensitivity.',
        },
        point_id: pointId,
      },
    },

    // 4) Daily energy mood sensitivity (short transit)
    {
      code: 'DAILY_ENERGY_REACTIVITY',
      label: 'Daily reactivity: avoid pushing; keep routine gentle.',
      scopes: ['hourly', 'daily'],
      condition_tree: {
        all: [
          { transit_planet_in_house: { planet_in: ['MARS', 'RAHU'], house_in: [1, 6, 12], match_mode: 'any', min_planets: 1 } },
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
        intensity: 0.5,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'daily_reactivity',
        outcome_text:
          'Today, energy reactivity/sensitivity may be higher. Prioritize a gentle routine + breaks, avoid over-exertion, and delay high-load tasks if possible—do not override the monthly direction.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Short transit + sensitive nakshatra suggests temporary reactivity.',
        },
        point_id: pointId,
      },
    },

    // 5) Weekly stabilization window (supportive transit)
    {
      code: 'WEEKLY_STABILIZATION',
      label: 'Weekly stabilization: recovery-friendly posture.',
      scopes: ['weekly'],
      condition_tree: {
        all: [
          { transit_planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: [1, 4, 12], match_mode: 'any', min_planets: 1 } },
          {
            any: [
              { transit_planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS'], group: { context: 'health', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { transit_planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS'], group: { context: 'health', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'weekly_stabilize',
        outcome_text:
          'This week may be more recovery-friendly. Prioritize rest + consistency, avoid overloading your schedule, and delay late nights when possible.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Weekly transit support with supportive/neutral nakshatra refinement.',
        },
        point_id: pointId,
      },
    },

    // 6) Dasha pressure: manage load
    {
      code: 'DASHA_PRESSURE_MANAGE_LOAD',
      label: 'Dasha pressure: manage strain and pacing.',
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
        intensity: 0.65,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'dasha_pressure',
        outcome_text:
          'Dasha pressure ke saath strain sensitivity badh sakti hai. DISHA: depletion—prioritize routine + rest, avoid overwork, delay overload phases when possible.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Pressure dasha alignment elevates strain risk; guidance stays non-medical and practical.',
        },
        point_id: pointId,
      },
    },

    // 7) Dasha support: steady balance
    {
      code: 'DASHA_SUPPORT_BALANCE',
      label: 'Supportive dasha: balance improves steadily.',
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
          'Energy balance can be supportive. DISHA: inflow—prioritize a consistent routine, avoid extremes, and delay overcommitment so recovery remains stable.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Supportive dasha alignment with benefic score indicates steadier balance.',
        },
        point_id: pointId,
      },
    },

    // 8) Lifestyle reset phase (redirection)
    {
      code: 'ROUTINE_REDIRECTION_PHASE',
      label: 'Routine redirection: reset priorities for balance.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['RAHU', 'KETU'], house_in: [6, 12, 10], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'routine_reset',
        outcome_text:
          'DISHA: energy redirection phase—routine change/recovery focus se balance better ho sakta hai. Prioritize sleep + boundaries, avoid chaotic schedules, delay overload weeks.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Rahu/Ketu activation suggests redirection/transition; framed as routine reset need.',
        },
        point_id: pointId,
      },
    },

    // 9) Long-term resilience supportive (life_theme)
    {
      code: 'LONG_TERM_RESILIENCE_SUPPORT',
      label: 'Long-term resilience: stable routines compound.',
      scopes: ['yearly', 'life_theme'],
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.65 } },
          { planet_in_house: { planet_in: ['JUPITER', 'VENUS', 'MOON'], house_in: [1, 4, 10], match_mode: 'any', min_planets: 1 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['MOON', 'JUPITER'], group: { context: 'health', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['MOON', 'JUPITER'], group: { context: 'health', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
            ],
          },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'combined',
        scenario: 'resilience',
        outcome_text:
          'Long-term vitality direction may be supportive. Nakshatra support strengthens resilience. Prioritize consistency, avoid overwork cycles, and delay “all-or-nothing” routines.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'Long-term supportive baseline with nakshatra refinement; kept non-absolute.',
        },
        point_id: pointId,
      },
    },

    // 10) Mixed signals: balance needed
    {
      code: 'MIXED_ENERGY_STRAIN',
      label: 'Mixed energy and strain: balance is key.',
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
          'Energy aur strain dono active ho sakte hain. ENERGY vs STRAIN: low energy ≠ illness. Prioritize pacing + breaks, avoid overcommitment, delay overload days.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Mixed environment: guidance focuses on balance and pacing.',
        },
        point_id: pointId,
      },
    },

    // 11) Sensitive nakshatra slows support activation
    {
      code: 'SUPPORT_DELAY_BY_NAKSHATRA',
      label: 'Support forming but delayed by sensitive/obstructive nakshatra.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.55 } },
          { planet_in_house: { planet_in: ['MOON', 'VENUS'], house_in: [1, 4, 12], match_mode: 'any', min_planets: 1 } },
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
        intensity: 0.6,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'delay',
        outcome_text:
          'Support is present, but it may not be fully strong—nakshatra sensitivity suggests a phased activation. Prioritize a gentle routine, avoid extremes, and delay overload weeks.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Positive support exists but sensitive/obstructive nakshatra indicates pacing/delay.',
        },
        point_id: pointId,
      },
    },

    // 12) Work-load tradeoff baseline
    {
      code: 'WORKLOAD_TRADEOFF_BASELINE',
      label: 'Work-load tradeoff: balance output vs recovery.',
      scopes: ['weekly', 'monthly'],
      condition_tree: { planet_in_house: { planet_in: ['SATURN', 'SUN'], house_in: [10, 6], match_mode: 'any', min_planets: 1 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.5,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'work_tradeoff',
        outcome_text:
          'Work-load aur recovery ka tradeoff visible hai. DISHA: energy drain points ko identify karein—prioritize breaks + routine, avoid late-night cycles, delay extra load when possible.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: '10th/6th emphasis indicates workload patterns affecting recovery balance.',
        },
        point_id: pointId,
      },
    },

    // 13) High benefic baseline
    {
      code: 'HEALTH_HIGH_BENEFIC_BASELINE',
      label: 'Broad supportive baseline for health balance.',
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
          'Overall balance supportive ho sakta hai. Prioritize consistency, avoid over-exertion, delay extremes.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Broad supportive baseline; not a medical claim.',
        },
        point_id: pointId,
      },
    },

    // 14) High malefic baseline
    {
      code: 'HEALTH_HIGH_MALEFIC_BASELINE',
      label: 'Broad caution baseline: protect energy and routine.',
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
          'Strain sensitivity high reh sakti hai. Prioritize rest + boundaries, avoid overload, delay major exertion.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Broad malefic baseline; kept non-fear-based.',
        },
        point_id: pointId,
      },
    },

    // 15) Informational baseline
    {
      code: 'HEALTH_GENERAL_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for health-general.',
      condition_tree: { generic_condition: { note: 'Health general baseline.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'baseline',
        outcome_text:
          'No single strong health signal stands out. Keep ENERGY vs STRAIN separate—prioritize routine + rest, avoid overwork, and delay overload commitments until clarity improves.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Baseline used when stronger health-general variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


