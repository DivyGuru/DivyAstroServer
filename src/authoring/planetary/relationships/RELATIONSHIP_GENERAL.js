export function getRELATIONSHIP_GENERALVariants() {
  const effectTheme = 'relationship';
  const area = 'relationship_general';
  const pointId = 'RELATIONSHIP_GENERAL';

  const partnershipHouses = [7, 5, 1, 11];
  const bondingHouses = [5, 7, 4, 11];
  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  return [
    // 1) Strong relational support (natal)
    {
      code: 'NATAL_REL_SUPPORT',
      label: 'Overall relationship support: benefics/trade planets active in bonding houses (natal).',
      condition_tree: {
        planet_in_house: {
          planet_in: [...benefics, ...trade],
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
        scenario: 'supportive_connection',
        outcome_text:
          'Relationship energy may feel more supportive. You may benefit from steady communication, shared time, and small acts of reliability that build trust.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Multiple supportive relationship signals are present together, so this is treated as a primary supportive indicator.',
        },
        point_id: pointId,
      },
    },

    // 2) Warmth and affection emphasis (Venus/Jupiter)
    {
      code: 'NATAL_WARMTH_AFFECTION',
      label: 'Warmth and affection emphasized (Venus/Jupiter in 5/7/4/11).',
      condition_tree: {
        planet_in_house: {
          planet_in: ['VENUS', 'JUPITER'],
          house_in: bondingHouses,
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.65,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'warmth_affection',
        outcome_text:
          'Warmth and bonding may be easier to access. Keeping expectations realistic and expressing appreciation clearly can strengthen connection.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals point toward emotional warmth and bonding support; outcomes still depend on consistent behavior.',
        },
        point_id: pointId,
      },
    },

    // 3) Communication clarity supports connection (Mercury)
    {
      code: 'NATAL_COMMUNICATION_CLARITY',
      label: 'Communication clarity supports mutual understanding (Mercury in partnership houses).',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: partnershipHouses, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'communication_clarity',
        outcome_text:
          'Communication may be a practical lever for harmony. Clear requests, active listening, and summarizing decisions can reduce misunderstandings.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals suggest communication hygiene is especially useful right now.',
        },
        point_id: pointId,
      },
    },

    // 4) Transit: short-term bonding window
    {
      code: 'TRANSIT_BONDING_WINDOW',
      label: 'Short-term bonding support via benefic transits in bonding houses.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['VENUS', 'JUPITER'],
          house_in: bondingHouses,
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'short_term_bonding',
        outcome_text:
          'A short-term bonding window may be available. It can help to prioritize quality time, gentle conversations, and practical follow-through.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound support and is treated as background unless reinforced by stronger indicators.',
        },
        point_id: pointId,
      },
    },

    // 5) Dasha: longer supportive relationship phase
    {
      code: 'DASHA_SUPPORTIVE_PHASE',
      label: 'Longer supportive relationship phase during benefic/trade dasha.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: [5, 6, 4] } }, // Jupiter/Venus/Mercury
          { dasha_running: { level: 'antardasha', planet_in: [5, 6, 4] } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.65,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'long_term_support',
        outcome_text:
          'A longer-term supportive phase may be building. Consistent care, shared routines, and calm conflict resolution can compound stability over time.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as longer-term support and is used mainly to guide strategy and expectations.',
        },
        point_id: pointId,
      },
    },

    // 6) Strain from pressure + responsibility (Saturn)
    {
      code: 'NATAL_PRESSURE_RESPONSIBILITY',
      label: 'Relationship strain through pressure and responsibilities (Saturn emphasis).',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [7, 12, 6, 10], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'pressure_and_distance',
        outcome_text:
          'Connection may feel heavier due to responsibilities or stress. Keeping routines steady and discussing expectations calmly can reduce avoidable friction.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals indicate a “slow, heavy” pattern; structure and patience are emphasized.',
        },
        point_id: pointId,
      },
    },

    // 7) Reactivity and arguments risk (Mars)
    {
      code: 'NATAL_REACTIVITY_ARGUMENTS',
      label: 'Reactivity and arguments risk (Mars in 7/1/6).',
      condition_tree: {
        planet_in_house: { planet_in: ['MARS'], house_in: [7, 1, 6], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'reactivity_arguments',
        outcome_text:
          'Irritation or reactivity may rise. Slowing down conversations, taking breaks when needed, and returning to facts can protect the relationship from avoidable conflict.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a risk-control note: reduce heat before trying to resolve issues.',
        },
        point_id: pointId,
      },
    },

    // 8) Ambiguity and mixed signals (Rahu/Ketu)
    {
      code: 'NATAL_AMBIGUITY_MIXED_SIGNALS',
      label: 'Ambiguity and mixed signals (Rahu/Ketu influence in 7/12/8).',
      condition_tree: {
        planet_in_house: { planet_in: ['RAHU', 'KETU'], house_in: [7, 12, 8], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.7,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'ambiguity_mixed_signals',
        outcome_text:
          'Mixed signals or uncertainty may feel stronger. It can help to clarify assumptions, confirm plans in writing, and avoid vague commitments.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as an information-clarity signal rather than a definitive relationship outcome.',
        },
        point_id: pointId,
      },
    },

    // 9) Combined: support + risk coexist (balanced guidance)
    {
      code: 'MIXED_SUPPORT_AND_RISK',
      label: 'Support exists alongside strain; balanced guidance is needed.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: bondingHouses, match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: malefics, house_in: [7, 12, 6], match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.7,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed_support_risk',
        outcome_text:
          'Support and strain may coexist. You can move forward, but it may help to keep conversations calm, protect boundaries, and prioritize consistent follow-through.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'dominant',
          certainty_note: 'Both supportive and challenging indicators appear together, so a balanced approach is recommended.',
        },
        point_id: pointId,
      },
    },

    // 10) Transit: short-term sensitivity (malefic transit)
    {
      code: 'TRANSIT_SENSITIVITY',
      label: 'Short-term sensitivity: malefic transits activate partnership houses.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        all: [
          {
            transit_planet_in_house: {
              planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'],
              house_in: [7, 12, 6],
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
          'This may be a more sensitive window. Slower responses, clearer boundaries, and avoiding reactive decisions can reduce misunderstandings.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound caution, treated as background guidance to reduce avoidable friction.',
        },
        point_id: pointId,
      },
    },

    // 11) Repair via structure (Saturn + benefic support)
    {
      code: 'REPAIR_WITH_STRUCTURE',
      label: 'Repair improves with structure and steady routines.',
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
        intensity: 0.6,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'repair_structure',
        outcome_text:
          'Stability can improve through structure. Simple routines, clear agreements, and consistent follow-through can reduce repeated conflict patterns.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as a mitigation path: structure reduces ambiguity and friction.',
        },
        point_id: pointId,
      },
    },

    // 12) Emotional nourishment through home/comfort (4th + benefics)
    {
      code: 'NATAL_HOME_COMFORT',
      label: 'Emotional nourishment via home/comfort and supportive bonding routines.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['VENUS', 'JUPITER'], house_in: [4, 5], match_mode: 'any', min_planets: 1 } },
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
          'Comfort and closeness may be easier to create through simple shared routines. Prioritizing emotional safety and predictable support can strengthen bonding.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This supports a nurturing approach: small consistent actions build trust over time.',
        },
        point_id: pointId,
      },
    },

    // 13) Boundary setting needed (12th/6th malefic)
    {
      code: 'BOUNDARY_NEED',
      label: 'Boundary setting needed: stress/leakage patterns affect connection.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'RAHU', 'KETU'], house_in: [12, 6], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'boundary_need',
        outcome_text:
          'Boundaries may need attention. Protecting personal time, pacing sensitive conversations, and being clear about expectations can prevent slow build-up of resentment.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals emphasize sustainability: clear boundaries reduce recurring friction.',
        },
        point_id: pointId,
      },
    },

    // 14) Long-distance / limited time (12th emphasis)
    {
      code: 'DISTANCE_OR_TIME_LIMITS',
      label: 'Distance or limited shared time affects connection (12th emphasis).',
      condition_tree: {
        planet_in_house: { planet_in: ['SATURN', 'KETU'], house_in: [12], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'distance_time_limits',
        outcome_text:
          'Connection may feel more distant due to time constraints or emotional fatigue. Scheduling intentional check-ins and keeping messages clear can reduce misunderstandings.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as a distance-cycle pattern; small consistent check-ins help.',
        },
        point_id: pointId,
      },
    },

    // 15) High overall benefic environment (supportive baseline)
    {
      code: 'HIGH_BENEFIC_BASELINE',
      label: 'High overall benefic environment supports smoother relationship flow.',
      condition_tree: {
        overall_benefic_score: { min: 0.7 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'high_benefic_environment',
        outcome_text:
          'Overall support may feel stronger. You can use this to build healthy routines, clarify long-term intentions gently, and reinforce mutual trust.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is a broad supportive signal; it sets a positive baseline but does not guarantee outcomes.',
        },
        point_id: pointId,
      },
    },

    // 16) Informational baseline
    {
      code: 'RELATIONSHIP_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for relationship-general context.',
      condition_tree: { generic_condition: { note: 'Relationship-general baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong relationship signal stands out here. Consistent communication, emotional respect, and practical reliability may be the most helpful focus.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger relationship-general variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


