export function getRELATIONSHIP_CONFLICT_PATCHUPVariants() {
  const effectTheme = 'relationship';
  const area = 'relationship_conflict_patchup';
  const pointId = 'RELATIONSHIP_CONFLICT_PATCHUP';

  const partnershipHouses = [7, 5, 1];
  const conflictHouses = [6, 7, 8, 12];
  const repairHouses = [4, 5, 7];

  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  return [
    // 1) High conflict pressure baseline
    {
      code: 'HIGH_CONFLICT_PRESSURE',
      label: 'High conflict pressure: malefics activated with elevated malefic score.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MARS', 'SATURN'], house_in: [7, 6], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.7 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.85,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'high_conflict',
        outcome_text:
          'This phase may test emotional understanding. You may benefit from slowing down discussions, avoiding blame, and focusing on one issue at a time with clear boundaries.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Multiple conflict indicators are simultaneously present; calm risk-management and boundaries are prioritized.',
        },
        point_id: pointId,
      },
    },

    // 2) Reactivity and arguments (Mars)
    {
      code: 'REACTIVITY_ARGUMENTS',
      label: 'Reactivity and arguments risk (Mars in 7/1/6).',
      condition_tree: {
        planet_in_house: { planet_in: ['MARS'], house_in: partnershipHouses, match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.75,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'reactivity',
        outcome_text:
          'Reactivity may rise. Taking pauses, keeping conversations factual, and returning to repair after cooling down can reduce escalation.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a heat-management signal rather than a definitive outcome.',
        },
        point_id: pointId,
      },
    },

    // 3) Cold distance after conflict (Saturn/Ketu 12th)
    {
      code: 'DISTANCE_AFTER_CONFLICT',
      label: 'Distance after conflict: emotional withdrawal or fatigue pattern.',
      condition_tree: {
        planet_in_house: { planet_in: ['SATURN', 'KETU'], house_in: [12], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'withdrawal_cycle',
        outcome_text:
          'After tension, distance may feel stronger. Gentle check-ins, emotional safety, and choosing calmer times for discussion can support reconnection.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as a distance-cycle pattern; small consistent check-ins help.',
        },
        point_id: pointId,
      },
    },

    // 4) Miscommunication loops (Mercury + malefics)
    {
      code: 'MISCOMMUNICATION_LOOPS',
      label: 'Miscommunication loops: clarity is the key lever.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: [7, 6], match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: malefics, house_in: conflictHouses, match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'miscommunication',
        outcome_text:
          'Misunderstandings may repeat. Summarizing decisions, confirming expectations, and avoiding assumptions can reduce unnecessary conflict.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals indicate clarity and communication hygiene are essential for repair.',
        },
        point_id: pointId,
      },
    },

    // 5) Third-party interference sensitivity (Rahu/Saturn 2/7)
    {
      code: 'THIRD_PARTY_PRESSURE',
      label: 'Third-party pressure/interference sensitivity.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['RAHU', 'SATURN'], house_in: [2, 7], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'third_party_pressure',
        outcome_text:
          'External opinions may add stress. Keeping private alignment strong and setting respectful boundaries can reduce avoidable conflict.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as an external-pressure signal; boundary-setting is emphasized.',
        },
        point_id: pointId,
      },
    },

    // 6) Reconnection potential (Venus/Mercury in repair houses)
    {
      code: 'RECONNECTION_POTENTIAL',
      label: 'Reconnection potential: repair becomes easier with calmer communication.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['VENUS', 'MERCURY'], house_in: repairHouses, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'reconnection',
        outcome_text:
          'Reconnection may be easier. Calm conversations, apology/repair when needed, and consistent follow-through can strengthen trust.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals suggest repair capacity; outcomes depend on practical communication and consistency.',
        },
        point_id: pointId,
      },
    },

    // 7) Short-term turbulence (transit malefics)
    {
      code: 'TRANSIT_TURBULENCE',
      label: 'Short-term turbulence: malefic transits activate conflict houses.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['MARS', 'SATURN', 'RAHU', 'KETU'],
          house_in: conflictHouses,
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.6,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'short_term_turbulence',
        outcome_text:
          'Short-term sensitivity may increase. It may help to pause high-stakes discussions, keep messages simple, and return to repair when emotions settle.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound and used as background guidance to reduce avoidable escalation.',
        },
        point_id: pointId,
      },
    },

    // 8) Short-term reconciliation window (transit Mercury/Venus)
    {
      code: 'TRANSIT_RECONCILIATION_WINDOW',
      label: 'Short-term reconciliation support via Mercury/Venus transits.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['MERCURY', 'VENUS'],
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
        scenario: 'reconciliation_window',
        outcome_text:
          'A calmer window may support reconnection. You can use it to clarify expectations, align priorities, and reduce misunderstandings gently.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound support; it helps best when used for clarity and repair.',
        },
        point_id: pointId,
      },
    },

    // 9) Dasha pressure (malefic dasha)
    {
      code: 'DASHA_PRESSURE_PHASE',
      label: 'Longer pressure phase increases friction; repair needs structure.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: [3, 7, 8, 9] } },
          { dasha_running: { level: 'antardasha', planet_in: [3, 7, 8, 9] } },
          { dasha_running: { level: 'pratyantardasha', planet_in: [3, 7, 8, 9] } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'long_term_pressure',
        outcome_text:
          'A longer strain phase may require patience and structure. Keeping boundaries clear and focusing on consistent repair can reduce repeated conflict loops.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This guides longer-term conflict management strategy; no absolute claims are made.',
        },
        point_id: pointId,
      },
    },

    // 10) Dasha repair support (benefic/trade dasha)
    {
      code: 'DASHA_REPAIR_SUPPORT',
      label: 'Repair support during benefic/trade dasha phases.',
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
        scenario: 'repair_support',
        outcome_text:
          'Repair and emotional reconnection may be easier over time. Honest communication, accountability, and small consistent improvements can strengthen the bond.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as gradual repair support; results depend on follow-through.',
        },
        point_id: pointId,
      },
    },

    // 11) Breakup-risk phase framing (strain cycle, not final)
    {
      code: 'STRAIN_CYCLE_HIGH',
      label: 'Strain cycle: higher risk of disconnection if repair is neglected.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: malefics, house_in: conflictHouses, match_mode: 'any', min_planets: 2 } },
          { overall_malefic_score: { min: 0.75 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.85,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'strain_cycle_high',
        outcome_text:
          'This phase may create stronger strain and distance cycles. Focusing on calm repair, reducing reactivity, and seeking clarity can protect the relationship from unnecessary damage.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Multiple high-pressure indicators are combined; risk-management framing is used without final claims.',
        },
        point_id: pointId,
      },
    },

    // 12) Patch-up support through structure (Saturn + benefic)
    {
      code: 'PATCHUP_WITH_STRUCTURE',
      label: 'Patch-up support via structure: clear agreements reduce repeat conflict.',
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
        scenario: 'patchup_structure',
        outcome_text:
          'Reconnection can improve through structure. Clear agreements, consistent boundaries, and predictable check-ins can help rebuild trust.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as a mitigation path: structure supports repair and reduces recurring friction.',
        },
        point_id: pointId,
      },
    },

    // 13) Mixed signals (support + strain coexist)
    {
      code: 'MIXED_PATCHUP_SIGNALS',
      label: 'Mixed signals: strain exists, but repair support is available.',
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.55 } },
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
        scenario: 'mixed_signals',
        outcome_text:
          'Support and strain may be present together. Choosing calmer conversations, clarifying expectations, and following through on agreements can improve outcomes.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as balanced guidance when both supportive and challenging indicators are present.',
        },
        point_id: pointId,
      },
    },

    // 14) Communication repair focus (Mercury + benefic)
    {
      code: 'COMMUNICATION_REPAIR_FOCUS',
      label: 'Communication repair focus: clarity reduces repeated conflict.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: [7, 11], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'communication_repair',
        outcome_text:
          'Clear communication may reduce repeated friction. Keeping discussions specific, confirming next steps, and avoiding assumptions can support repair.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'Signals emphasize communication hygiene as a practical repair lever.',
        },
        point_id: pointId,
      },
    },

    // 15) High-benefic baseline for reconnection
    {
      code: 'BENEFIC_RECONNECTION_BASELINE',
      label: 'Supportive environment for reconnection (broad baseline).',
      condition_tree: { overall_benefic_score: { min: 0.7 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.45,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'benefic_baseline',
        outcome_text:
          'Overall support may feel slightly stronger for repair. Small consistent gestures and calm communication can help rebuild closeness.',
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
      code: 'CONFLICT_PATCHUP_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for conflict/patch-up context.',
      condition_tree: { generic_condition: { note: 'Conflict/patch-up baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong signal stands out here. Calm communication, accountability, and consistent follow-through can help maintain connection and prevent avoidable conflict cycles.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger conflict/patch-up variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


