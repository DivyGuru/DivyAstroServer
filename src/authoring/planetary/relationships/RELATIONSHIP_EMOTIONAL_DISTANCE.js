export function getRELATIONSHIP_EMOTIONAL_DISTANCEVariants() {
  const effectTheme = 'relationship';
  const area = 'relationship_emotional_distance';
  const pointId = 'RELATIONSHIP_EMOTIONAL_DISTANCE';

  const distanceHouses = [12, 8, 6];
  const bondingHouses = [4, 5, 7];
  const partnershipHouses = [7, 1, 11];

  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  return [
    // 1) Emotional distance cycle baseline (Saturn/Ketu 12th)
    {
      code: 'DISTANCE_CYCLE_BASELINE',
      label: 'Emotional distance cycle: fatigue or reduced availability (12th emphasis).',
      condition_tree: {
        planet_in_house: { planet_in: ['SATURN', 'KETU'], house_in: [12], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.75,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'distance_cycle',
        outcome_text:
          'Emotional distance may feel more noticeable. Scheduling intentional check-ins and keeping communication clear can reduce misunderstandings during busy or draining phases.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Strong distance-style indicators are present; support is framed as practical reconnection steps.',
        },
        point_id: pointId,
      },
    },

    // 2) Withdrawal after conflict (8th + malefic)
    {
      code: 'WITHDRAWAL_AFTER_TENSION',
      label: 'Withdrawal after tension: emotional retreat pattern (8th/12th stress).',
      condition_tree: {
        planet_in_house: { planet_in: ['RAHU', 'KETU', 'SATURN'], house_in: [8, 12], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.7,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'withdrawal_after_tension',
        outcome_text:
          'After stress, emotional retreat may increase. Gentle check-ins, patience, and choosing calmer times for discussion can support reconnection.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as a distance-cycle pattern; the focus is on repair without blame.',
        },
        point_id: pointId,
      },
    },

    // 3) Workload / stress-driven distance (6th/10th Saturn)
    {
      code: 'STRESS_DRIVEN_DISTANCE',
      label: 'Stress-driven distance: workload pressure reduces emotional availability.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [6, 10], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'stress_distance',
        outcome_text:
          'Stress or workload may affect emotional bandwidth. Clear expectations, respectful boundaries, and predictable check-ins can reduce misunderstandings.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals suggest bandwidth and stress are key factors; structure can help.',
        },
        point_id: pointId,
      },
    },

    // 4) Miscommunication increases distance (Mercury + malefics)
    {
      code: 'MISCOMMUNICATION_DISTANCE',
      label: 'Miscommunication increases distance; clarity becomes essential.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: partnershipHouses, match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: malefics, house_in: distanceHouses, match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'miscommunication_distance',
        outcome_text:
          'Misunderstandings may create distance. Summarizing what you heard, confirming next steps, and avoiding assumptions can support reconnection.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize clarity as a practical lever to reduce distance.',
        },
        point_id: pointId,
      },
    },

    // 5) Repair through warmth and bonding routines (Venus/Jupiter in 4/5/7)
    {
      code: 'REPAIR_THROUGH_WARMTH',
      label: 'Repair through warmth: bonding routines improve closeness.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['VENUS', 'JUPITER'], house_in: bondingHouses, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'repair_warmth',
        outcome_text:
          'Closeness may be easier to rebuild. Small consistent gestures, emotional reassurance, and shared time can reduce distance gradually.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals support bonding routines; the framing remains gradual and non-absolute.',
        },
        point_id: pointId,
      },
    },

    // 6) Short-term distance spike (transit malefics 12/7)
    {
      code: 'TRANSIT_DISTANCE_SPIKE',
      label: 'Short-term distance spike: malefic transits activate distance houses.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'],
          house_in: [12, 7, 6],
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
        scenario: 'short_term_distance',
        outcome_text:
          'This may be a more sensitive short-term window. It can help to avoid reactive conversations and keep communication simple and respectful.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Time-bound caution is treated as background guidance to reduce avoidable tension.',
        },
        point_id: pointId,
      },
    },

    // 7) Short-term reconnection window (transit Venus/Mercury)
    {
      code: 'TRANSIT_RECONNECTION_WINDOW',
      label: 'Short-term reconnection support via Venus/Mercury transits.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['VENUS', 'MERCURY'],
          house_in: [7, 5, 11],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'reconnection_window',
        outcome_text:
          'A calmer window may support reconnection. Gentle conversations, appreciation, and clear next steps can reduce emotional distance.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound and best used for clarity and emotional repair.',
        },
        point_id: pointId,
      },
    },

    // 8) Dasha distance phase (malefic dasha)
    {
      code: 'DASHA_DISTANCE_PHASE',
      label: 'Longer distance phase: pressure patterns reduce emotional availability.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: [7, 8, 9] } }, // Saturn/Rahu/Ketu
          { dasha_running: { level: 'antardasha', planet_in: [7, 8, 9] } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.65,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'long_term_distance',
        outcome_text:
          'A longer sensitive phase may reduce emotional bandwidth. Patience, clear boundaries, and consistent low-friction communication can help maintain connection.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This guides long-term pacing and repair strategy without making absolute claims.',
        },
        point_id: pointId,
      },
    },

    // 9) Dasha repair support (benefic/trade dasha)
    {
      code: 'DASHA_RECONNECTION_SUPPORT',
      label: 'Longer reconnection support during benefic/trade dasha.',
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
        trend: 'mixed',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'reconnection_support',
        outcome_text:
          'Reconnection may become easier over time. Honest communication, consistency, and small acts of care can gradually strengthen closeness.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as gradual support; results depend on practical follow-through.',
        },
        point_id: pointId,
      },
    },

    // 10) Mixed indicators: closeness + distance together
    {
      code: 'MIXED_CLOSENESS_DISTANCE',
      label: 'Mixed indicators: closeness exists, but distance patterns also appear.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: bondingHouses, match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: malefics, house_in: distanceHouses, match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed_indicators',
        outcome_text:
          'Support and distance patterns may coexist. You can protect closeness by keeping communication calm, setting boundaries gently, and following through consistently.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'Both supportive and distance indicators appear together, so balanced guidance is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 11) Social disconnection vs reconnection via networks (11th)
    {
      code: 'NETWORK_RECONNECT_SUPPORT',
      label: 'Reconnection support via shared community and social stability (11th).',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['VENUS', 'MERCURY'], house_in: [11], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'network_support',
        outcome_text:
          'Shared community and supportive routines may help reduce distance. Simple plans, consistent communication, and shared goals can strengthen connection.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This treats networks/routines as supportive factors, not guarantees.',
        },
        point_id: pointId,
      },
    },

    // 12) High malefic: stronger distance pressure
    {
      code: 'HIGH_MALEFIC_DISTANCE_PRESSURE',
      label: 'High malefic pressure increases emotional distance risk.',
      condition_tree: {
        all: [
          { overall_malefic_score: { min: 0.75 } },
          { planet_in_house: { planet_in: malefics, house_in: [12, 7, 8], match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.8,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'high_pressure_distance',
        outcome_text:
          'Distance may feel stronger during higher-pressure conditions. Keeping conversations calm and focusing on predictable, respectful contact can protect the bond.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Strong pressure indicators are present; guidance focuses on stability and repair without fear language.',
        },
        point_id: pointId,
      },
    },

    // 13) Repair through structure (Saturn + benefic)
    {
      code: 'STRUCTURE_REDUCES_DISTANCE',
      label: 'Structure reduces distance: clear agreements and routines improve closeness.',
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
        scenario: 'structure_repair',
        outcome_text:
          'Closeness may improve through structure. Clear boundaries, predictable check-ins, and respectful follow-through can reduce distance over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as a mitigation path: structure improves connection gradually.',
        },
        point_id: pointId,
      },
    },

    // 14) Mixed: benefic + malefic both elevated (balanced)
    {
      code: 'MIXED_BENEFIC_MALEFIC',
      label: 'Mixed environment: both supportive and challenging signals are strong.',
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
          'Support and stress may both be present. Keeping communication simple, staying consistent, and avoiding reactive assumptions can reduce distance during sensitive periods.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as balanced guidance under mixed conditions.',
        },
        point_id: pointId,
      },
    },

    // 15) High-benefic baseline (background)
    {
      code: 'BENEFIC_CLOSENESS_BASELINE',
      label: 'Broad supportive baseline for closeness (high benefic environment).',
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
          'Overall support may feel stronger for closeness. Small consistent gestures and clear communication can help reduce distance gradually.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is a broad supportive baseline and does not imply certainty.',
        },
        point_id: pointId,
      },
    },

    // 16) Informational baseline
    {
      code: 'EMOTIONAL_DISTANCE_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for emotional distance context.',
      condition_tree: { generic_condition: { note: 'Emotional distance baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong distance signal stands out here. Consistent check-ins, respectful boundaries, and clear communication may be the most helpful focus.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger emotional-distance variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


