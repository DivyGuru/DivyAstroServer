export function getFAMILY_RELATIONS_GENERALVariants() {
  const effectTheme = 'relationship';
  const area = 'family_relations_general';
  const pointId = 'FAMILY_RELATIONS_GENERAL';

  const familyHouses = [4, 2, 11];
  const comfortHouses = [4, 5];
  const stressHouses = [6, 8, 12];

  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  return [
    // 1) Strong family harmony baseline (benefics in 4/2/11)
    {
      code: 'NATAL_FAMILY_HARMONY',
      label: 'Family harmony: supportive indicators in 4th/2nd/11th.',
      condition_tree: {
        planet_in_house: {
          planet_in: [...benefics, ...trade],
          house_in: familyHouses,
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
        scenario: 'family_harmony',
        outcome_text:
          'Family relationships may feel more supportive. Consistent respect, clear communication, and practical reliability can strengthen harmony.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Multiple supportive family-harmony signals are present, so this is treated as a primary stabilizing indicator.',
        },
        point_id: pointId,
      },
    },

    // 2) Warmth and bonding at home (4th/5th benefics)
    {
      code: 'HOME_WARMTH_BONDING',
      label: 'Home warmth and bonding: supportive comfort routines reduce tension.',
      condition_tree: {
        planet_in_house: { planet_in: ['VENUS', 'JUPITER'], house_in: comfortHouses, match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'home_warmth',
        outcome_text:
          'Home warmth and bonding may be easier to create. Small consistent gestures and clear expectations can improve the family atmosphere.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize comfort and reassurance as practical levers for family harmony.',
        },
        point_id: pointId,
      },
    },

    // 3) Communication clarity supports family alignment (Mercury)
    {
      code: 'FAMILY_COMMUNICATION_CLARITY',
      label: 'Communication clarity supports family alignment and reduces misunderstandings.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: [2, 4, 11], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'communication_clarity',
        outcome_text:
          'Clear communication may reduce misunderstandings. Keeping messages respectful, specific, and consistent can strengthen alignment.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals suggest communication hygiene is an important stabilizer for family dynamics.',
        },
        point_id: pointId,
      },
    },

    // 4) Transit: short-term family harmony window
    {
      code: 'TRANSIT_FAMILY_HARMONY',
      label: 'Short-term harmony window via benefic transits to family houses.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['VENUS', 'JUPITER'],
          house_in: familyHouses,
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'short_term_harmony',
        outcome_text:
          'A short-term calming window may support smoother family interactions. It can help to clarify plans and reduce small misunderstandings.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound support, treated as background unless reinforced.',
        },
        point_id: pointId,
      },
    },

    // 5) Dasha: longer supportive family phase
    {
      code: 'DASHA_FAMILY_SUPPORT',
      label: 'Longer supportive family phase during benefic/trade dasha.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: [5, 6, 4] } },
          { dasha_running: { level: 'antardasha', planet_in: [5, 6, 4] } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'long_term_support',
        outcome_text:
          'A longer supportive phase may help family relationships feel steadier. Consistency, respectful boundaries, and calm communication can compound improvements.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as longer-term support and informs strategy more than short-term decisions.',
        },
        point_id: pointId,
      },
    },

    // 6) Family responsibilities feel heavy (Saturn)
    {
      code: 'FAMILY_RESPONSIBILITY_LOAD',
      label: 'Family responsibility load increases; structure and boundaries help.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [4, 2, 6], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'responsibility_load',
        outcome_text:
          'Family responsibilities may feel heavier. Clear boundaries, practical planning, and fair division of effort can reduce resentment and stress.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals indicate a “slow, heavy” pattern; structure is emphasized to reduce friction.',
        },
        point_id: pointId,
      },
    },

    // 7) Family conflict sensitivity (Mars in 4/2/6)
    {
      code: 'FAMILY_CONFLICT_SENSITIVITY',
      label: 'Family conflict sensitivity: reactivity increases.',
      condition_tree: {
        planet_in_house: { planet_in: ['MARS'], house_in: [4, 2, 6], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'reactivity_conflict',
        outcome_text:
          'Family tension may rise if conversations become reactive. Taking pauses, keeping discussions specific, and returning to repair can reduce escalation.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a heat-management signal to reduce avoidable conflict.',
        },
        point_id: pointId,
      },
    },

    // 8) Hidden misunderstandings / mixed signals (Rahu/Ketu)
    {
      code: 'FAMILY_AMBIGUITY',
      label: 'Family ambiguity: mixed signals create misunderstandings.',
      condition_tree: {
        planet_in_house: { planet_in: ['RAHU', 'KETU'], house_in: [4, 2, 8, 12], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'ambiguity',
        outcome_text:
          'Mixed signals may create misunderstandings. Clarifying expectations, confirming plans, and keeping communication transparent can reduce confusion.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as an information-clarity signal, not a judgment of intentions.',
        },
        point_id: pointId,
      },
    },

    // 9) Mixed indicators: support + stress coexist
    {
      code: 'MIXED_FAMILY_SIGNALS',
      label: 'Mixed family signals: support exists alongside stress.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: familyHouses, match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: malefics, house_in: stressHouses, match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed_signals',
        outcome_text:
          'Support and stress may coexist in family dynamics. You can protect harmony by setting boundaries respectfully and focusing on steady, practical cooperation.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'Both supportive and challenging indicators appear together, so balanced guidance is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 10) Transit: short-term family sensitivity
    {
      code: 'TRANSIT_FAMILY_SENSITIVITY',
      label: 'Short-term family sensitivity from malefic transits.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        all: [
          {
            transit_planet_in_house: {
              planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'],
              house_in: [4, 2, 6],
              match_mode: 'any',
              min_planets: 1,
            },
          },
          { overall_malefic_score: { min: 0.5 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.55,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'short_term_sensitivity',
        outcome_text:
          'This may be a more sensitive short-term window in family interactions. Slower responses and clearer boundaries can reduce misunderstandings.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound caution, treated as background guidance.',
        },
        point_id: pointId,
      },
    },

    // 11) Repair through structure (Saturn + benefic)
    {
      code: 'FAMILY_REPAIR_STRUCTURE',
      label: 'Family repair improves through structure and calm boundaries.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [4, 6], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
          { overall_malefic_score: { max: 0.75 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.55,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'repair_structure',
        outcome_text:
          'Family harmony can improve through structure. Clear roles, predictable routines, and respectful boundaries can reduce repeated friction.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as a mitigation path: structure reduces ambiguity and repeated stress.',
        },
        point_id: pointId,
      },
    },

    // 12) Supportive network/family circle (11th)
    {
      code: 'SUPPORTIVE_FAMILY_CIRCLE',
      label: 'Supportive circle: networks and community help family relationships.',
      condition_tree: {
        planet_in_house: { planet_in: ['JUPITER', 'VENUS', 'MERCURY'], house_in: [11], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'supportive_circle',
        outcome_text:
          'Support from community or extended family may help. Clear communication and practical cooperation can strengthen overall family stability.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is a supportive factor and is kept secondary to direct family communication.',
        },
        point_id: pointId,
      },
    },

    // 13) Long-term pressure phase (malefic dasha)
    {
      code: 'DASHA_FAMILY_PRESSURE',
      label: 'Longer pressure phase increases family stress; boundaries and patience help.',
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
        intensity: 0.6,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'long_term_pressure',
        outcome_text:
          'A longer sensitive phase may increase family stress. Patience, calm boundaries, and consistent communication can reduce avoidable conflict.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This guides longer-term strategy during pressure patterns without making absolute claims.',
        },
        point_id: pointId,
      },
    },

    // 14) High-benefic baseline (background)
    {
      code: 'HIGH_BENEFIC_FAMILY_BASELINE',
      label: 'Broad supportive baseline for family harmony (high benefic environment).',
      condition_tree: { overall_benefic_score: { min: 0.7 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.45,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'benefic_baseline',
        outcome_text:
          'Overall support may feel stronger for family harmony. Small consistent gestures and clear communication can help maintain a calmer atmosphere.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is a broad supportive baseline and does not imply certainty.',
        },
        point_id: pointId,
      },
    },

    // 15) High-malefic peak stress (dominant)
    {
      code: 'HIGH_MALEFIC_FAMILY_STRESS',
      label: 'High stress: elevated malefic score increases family sensitivity.',
      condition_tree: {
        all: [
          { overall_malefic_score: { min: 0.75 } },
          { planet_in_house: { planet_in: malefics, house_in: [4, 2, 6, 12], match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.8,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'peak_stress',
        outcome_text:
          'Family sensitivity may be higher. Slowing down conversations, setting respectful boundaries, and focusing on practical cooperation can reduce escalation.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Strong pressure indicators are present; guidance focuses on calm boundaries and de-escalation.',
        },
        point_id: pointId,
      },
    },

    // 16) Informational baseline
    {
      code: 'FAMILY_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for family relations context.',
      condition_tree: { generic_condition: { note: 'Family relations baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong family signal stands out here. Respectful communication, clear boundaries, and steady practical support can help keep relationships balanced.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger family-relations variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


