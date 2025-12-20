export function getPROGENY_EMOTIONAL_BONDVariants() {
  const effectTheme = 'family';
  const area = 'family_children';
  const pointId = 'PROGENY_EMOTIONAL_BOND';

  const bondingHouses = [4, 5];
  const supportHouses = [4, 5, 11];
  const stressHouses = [6, 12, 8];

  const benefics = ['JUPITER', 'VENUS', 'MOON'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  return [
    // 1) Strong nurturing bond (dominant)
    {
      code: 'STRONG_NURTURING_BOND',
      label: 'Strong nurturing bond: emotional warmth supports bonding and caregiving routines.',
      condition_tree: {
        planet_in_house: {
          planet_in: ['MOON', 'VENUS', 'JUPITER'],
          house_in: bondingHouses,
          match_mode: 'any',
          min_planets: 2,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.75,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'strong_bond',
        outcome_text:
          'Emotional bonding and nurturing may feel naturally strong. Consistent presence, gentle communication, and stable routines can strengthen connection over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Multiple nurturing indicators align, so this is treated as a primary bonding-strength signal.',
        },
        point_id: pointId,
      },
    },

    // 2) Bonding through comfort and home stability (4th)
    {
      code: 'HOME_COMFORT_BOND',
      label: 'Home comfort supports bonding: predictable routines build trust.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MOON', 'VENUS'], house_in: [4], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'home_comfort',
        outcome_text:
          'Bonding may improve through comfort and stability at home. Predictable routines and calm reassurance can reduce stress and support closeness.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize emotional safety and home routines as bonding levers.',
        },
        point_id: pointId,
      },
    },

    // 3) Communication and guidance supports bonding (Mercury + benefic)
    {
      code: 'COMMUNICATION_SUPPORT_BOND',
      label: 'Communication supports bonding: clarity and consistency build trust.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: [4, 5, 11], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'communication_support',
        outcome_text:
          'Clear communication and consistency may strengthen bonding. Simple routines, predictable responses, and gentle guidance can build trust over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This treats clarity as a practical bonding lever without any absolute claims.',
        },
        point_id: pointId,
      },
    },

    // 4) Stress reduces emotional availability (Saturn 6/12)
    {
      code: 'STRESS_REDUCES_AVAILABILITY',
      label: 'Stress reduces emotional availability; boundaries and rest help.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [6, 12], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'stress_availability',
        outcome_text:
          'Stress may reduce emotional bandwidth. Simplifying routines, protecting rest, and asking for support can help you stay present and steady.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This frames bonding challenges as bandwidth and stress rather than fixed outcomes.',
        },
        point_id: pointId,
      },
    },

    // 5) Reactivity risk impacts bonding (Mars)
    {
      code: 'REACTIVITY_IMPACTS_BOND',
      label: 'Reactivity risk: calmer pacing protects bonding.',
      condition_tree: {
        planet_in_house: { planet_in: ['MARS'], house_in: [4, 5, 6], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.65,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'reactivity',
        outcome_text:
          'Reactivity may make bonding feel harder at times. Taking pauses, using calmer communication, and returning to repair can reduce avoidable stress.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is a risk-control note: reduce intensity before attempting correction.',
        },
        point_id: pointId,
      },
    },

    // 6) Uncertainty/mixed signals around bonding (Rahu/Ketu)
    {
      code: 'MIXED_SIGNALS_BONDING',
      label: 'Mixed signals: bonding feels uneven; consistency helps.',
      condition_tree: {
        planet_in_house: { planet_in: ['RAHU', 'KETU'], house_in: [5, 8, 12], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed_signals',
        outcome_text:
          'Bonding may feel uneven at times. Consistent routines, gentle reassurance, and clear communication can improve steadiness gradually.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is treated as a consistency/clarity signal rather than a definitive outcome.',
        },
        point_id: pointId,
      },
    },

    // 7) Short-term bonding support (transit benefics)
    {
      code: 'TRANSIT_BONDING_SUPPORT',
      label: 'Short-term bonding support via benefic transits to 4th/5th.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['MOON', 'VENUS', 'JUPITER'],
          house_in: supportHouses,
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.45,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'short_term_bonding',
        outcome_text:
          'A short-term supportive window may help bonding. Small consistent gestures and calm communication can strengthen closeness.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound and treated as background guidance.',
        },
        point_id: pointId,
      },
    },

    // 8) Short-term sensitivity (transit malefics)
    {
      code: 'TRANSIT_SENSITIVITY',
      label: 'Short-term sensitivity: malefic transits increase emotional strain.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'],
          house_in: [5, ...stressHouses],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.45,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'short_term_sensitivity',
        outcome_text:
          'This may be a more sensitive short-term window. Slower responses and clear boundaries can reduce avoidable stress.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Time-bound caution is treated as background guidance.',
        },
        point_id: pointId,
      },
    },

    // 9) Long-term supportive bonding phase (benefic/trade dasha)
    {
      code: 'DASHA_BOND_SUPPORT',
      label: 'Long-term bonding support during benefic/trade dasha phases.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: [2, 5, 6, 4] } },
          { dasha_running: { level: 'antardasha', planet_in: [2, 5, 6, 4] } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'long_term_support',
        outcome_text:
          'A longer supportive phase may help bonding feel steadier. Consistent routines and gentle communication can strengthen trust gradually.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as gradual long-term support without certainty.',
        },
        point_id: pointId,
      },
    },

    // 10) Long-term strain phase (malefic dasha)
    {
      code: 'DASHA_BOND_STRAIN',
      label: 'Long-term strain phase: patience and structure protect bonding.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: [7, 3, 8, 9] } },
          { dasha_running: { level: 'antardasha', planet_in: [7, 3, 8, 9] } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.55,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'long_term_strain',
        outcome_text:
          'A longer sensitive phase may reduce emotional bandwidth. Patience, clear boundaries, and consistent support routines can protect bonding over time.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This guides long-term pacing and sustainability without fear-based language.',
        },
        point_id: pointId,
      },
    },

    // 11) Mixed: support and stress coexist (dominant)
    {
      code: 'MIXED_SUPPORT_AND_STRESS',
      label: 'Mixed: bonding support exists, but stress requires pacing.',
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.6 } },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.55,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed_environment',
        outcome_text:
          'Support and stress may coexist. A paced approach, calm communication, and steady routines can help maintain closeness.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'Mixed indicators require balanced guidance focused on consistency and emotional safety.',
        },
        point_id: pointId,
      },
    },

    // 12) High pressure impacts bonding (dominant)
    {
      code: 'HIGH_PRESSURE_IMPACTS_BOND',
      label: 'High pressure impacts bonding: extra support and pacing help.',
      condition_tree: {
        all: [
          { overall_malefic_score: { min: 0.75 } },
          { planet_in_house: { planet_in: malefics, house_in: [5, ...stressHouses], match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.65,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'high_pressure',
        outcome_text:
          'Bonding may feel harder under high pressure. Reducing overload, keeping routines simple, and asking for support can help protect closeness.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Strong pressure indicators are present; guidance prioritizes pacing and emotional stability.',
        },
        point_id: pointId,
      },
    },

    // 13) High-benefic baseline (background)
    {
      code: 'HIGH_BENEFIC_BASELINE',
      label: 'Broad supportive baseline for bonding (high benefic environment).',
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
          'Overall support may feel stronger for closeness. Small consistent gestures and clear communication can strengthen trust gradually.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is a broad supportive baseline and does not imply certainty.',
        },
        point_id: pointId,
      },
    },

    // 14) Informational baseline
    {
      code: 'PROGENY_BOND_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for progeny emotional bond context.',
      condition_tree: { generic_condition: { note: 'Progeny emotional bond baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong bonding signal stands out here. Consistent routines, calm communication, and emotional safety can help maintain steady connection.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger bonding variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


