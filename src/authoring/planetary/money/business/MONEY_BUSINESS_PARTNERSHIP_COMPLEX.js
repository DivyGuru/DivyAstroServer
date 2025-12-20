export function getMONEY_BUSINESS_PARTNERSHIP_COMPLEXVariants() {
  const effectTheme = 'money';
  const area = 'money_business';
  const pointId = 'MONEY_BUSINESS_PARTNERSHIP_COMPLEX';

  // Partnership-centric houses: 7 (partners/contracts), 2 (cash/values), 11 (networks/gains),
  // plus 6/8/12 for conflict/shocks/leakage patterns.
  const partnershipHouses = [7, 2, 11, 10];
  const riskHouses = [6, 8, 12, 7];

  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  // Planet ids (common convention): Sun=1, Moon=2, Mars=3, Mercury=4, Jupiter=5, Venus=6, Saturn=7, Rahu=8, Ketu=9
  const DASHAA_SUPPORT_IDS = [5, 6, 4];
  const DASHAA_RISK_IDS = [7, 3, 8, 9];

  return [
    // 1) Benefic partnership harmony (agreements flow)
    {
      code: 'PARTNERSHIP_HARMONY',
      label: 'Partnership harmony: agreements and cooperation feel smoother.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: [7, 11, 10], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['VENUS', 'JUPITER', 'MERCURY'], group: { context: 'business', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['VENUS', 'JUPITER', 'MERCURY'], group: { context: 'business', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
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
        trigger: 'natal',
        scenario: 'partnership_harmony',
        outcome_text:
          'A business partnership yog is present. Nakshatra support strengthens this signal. Keep goals clear, keep agreements simple, and track commitments carefully.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Supportive cooperation signals are present; still best reinforced with clear agreements.',
        },
        point_id: pointId,
      },
    },

    // 2) Malefic dominance in partnership house (trust/ego conflicts)
    {
      code: 'PARTNERSHIP_CONFLICT_RISK',
      label: 'Partnership conflict risk: trust/ego clashes, misalignment, or argumentative dynamics.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MARS', 'SATURN'], house_in: [7], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.55 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['SATURN', 'MARS'], group: { context: 'business', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['SATURN', 'MARS'], group: { context: 'business', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
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
        trigger: 'natal',
        scenario: 'conflict_and_ego',
        outcome_text:
          'Partnership needs extra caution. Nakshatra sensitivity can increase misunderstandings—keep terms clear, keep commitments paced, and keep documentation strong.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Conflict-style indicators are stronger here, so risk-management and calm structure are prioritized.',
        },
        point_id: pointId,
      },
    },

    // 3) Hidden terms / confusion (Rahu/Ketu on 7/8/12)
    {
      code: 'HIDDEN_TERMS_CONFUSION',
      label: 'Hidden terms/confusion: unclear agreements, mixed signals, or information gaps.',
      condition_tree: {
        planet_in_house: { planet_in: ['RAHU', 'KETU'], house_in: [7, 8, 12], match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.8,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'hidden_terms',
        outcome_text:
          'Ambiguity may create misunderstandings. It may help to confirm assumptions in writing and avoid vague commitments.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as an information-clarity signal rather than a definite conflict outcome.',
        },
        point_id: pointId,
      },
    },

    // 4) Cash-flow vs profit illusion (2/12 leakage + mixed)
    {
      code: 'CASHFLOW_LEAKAGE',
      label: 'Cash-flow leakage: profits may look fine on paper but liquidity can feel tight.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'RAHU', 'KETU'], house_in: [12, 2], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.75,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'cashflow_leakage',
        outcome_text:
          'Profit and cash flow may not move together. Consider tracking liquidity, clarifying payouts, and tightening expense approvals.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as a practical finance/clarity risk in partnerships.',
        },
        point_id: pointId,
      },
    },

    // 5) Role/communication friction (Mercury + malefic pressure)
    {
      code: 'COMMUNICATION_FRICTION',
      label: 'Communication friction: misunderstandings and unclear responsibilities increase.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY'], house_in: partnershipHouses, match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: malefics, house_in: riskHouses, match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.7,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'communication_friction',
        outcome_text:
          'Miscommunication risk may rise. You can reduce it with clear roles, meeting notes, and explicit next steps.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals indicate role/communication clarity is a key lever for stability.',
        },
        point_id: pointId,
      },
    },

    // 6) Wrong partnership risk (7th afflicted + 6th conflict)
    {
      code: 'WRONG_PARTNER_RISK',
      label: 'Wrong partner risk: agreements need strict due diligence and clear boundaries.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: malefics, house_in: [7], match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: ['SATURN', 'MARS'], house_in: [6], match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.8,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'wrong_partner',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Signals suggest higher agreement-risk; use clarity, documentation, and stepwise commitments.',
        },
        outcome_text:
          'Due diligence may matter more than speed. Consider stepwise commitments, clear documentation, and decision checkpoints.',
        point_id: pointId,
      },
    },

    // 7) Transit: short-term partnership turbulence
    {
      code: 'TRANSIT_PARTNERSHIP_TURBULENCE',
      label: 'Short-term turbulence: malefic transits activate partnership and contract themes.',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['SATURN', 'MARS', 'RAHU', 'KETU'],
          house_in: [7, 2, 8, 12],
          match_mode: 'any',
          min_planets: 1,
        },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.65,
        tone: 'challenging',
        trigger: 'transit',
        scenario: 'short_term_turbulence',
        outcome_text:
          'Short-term turbulence may appear. It may help to pause high-stakes decisions and focus on clarity and risk-control.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound and used as background guidance to reduce avoidable friction.',
        },
        point_id: pointId,
      },
    },

    // 8) Transit: supportive negotiation window
    {
      code: 'TRANSIT_NEGOTIATION_SUPPORT',
      label: 'Short-term negotiation support: calmer discussions and clearer agreements.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['MERCURY', 'VENUS', 'JUPITER'],
          house_in: [7, 11, 10],
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
        scenario: 'negotiation_support',
        outcome_text:
          'A calmer negotiation window may be available. Use it to align expectations, define deliverables, and confirm terms in writing.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is a short-term support signal; it helps best when used for clarity and agreements.',
        },
        point_id: pointId,
      },
    },

    // 9) Dasha adversity (partnership complexity increases)
    {
      code: 'DASHA_PARTNERSHIP_RISK',
      label: 'Dasha adversity: partnership dynamics feel more complex and risk-prone.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: DASHAA_RISK_IDS } },
          { dasha_running: { level: 'antardasha', planet_in: DASHAA_RISK_IDS } },
          { dasha_running: { level: 'pratyantardasha', planet_in: DASHAA_RISK_IDS } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.75,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'dasha_adversity',
        outcome_text:
          'A longer partnership-pressure phase may be active. Consider strengthening governance: roles, approvals, and clear escalation paths.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This guides long-term posture: reduce ambiguity and keep decisions disciplined.',
        },
        point_id: pointId,
      },
    },

    // 10) Dasha support (repair + better agreements)
    {
      code: 'DASHA_REPAIR_SUPPORT',
      label: 'Dasha support: repair, restructuring, and clearer agreements become easier.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: {
        any: [
          { dasha_running: { level: 'mahadasha', planet_in: DASHAA_SUPPORT_IDS } },
          { dasha_running: { level: 'antardasha', planet_in: DASHAA_SUPPORT_IDS } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'repair_support',
        outcome_text:
          'Repair and restructuring may be easier over time. Consider revisiting terms, improving communication, and simplifying decision-making.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is framed as a gradual repair signal; results depend on practical follow-through.',
        },
        point_id: pointId,
      },
    },

    // 11) Solo success vs partnership risk (choose simplicity)
    {
      code: 'SOLO_OVER_PARTNERSHIP',
      label: 'Solo over partnership: simplifying decision-making reduces complexity and risk.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SUN'], house_in: [1, 10], match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: malefics, house_in: [7], match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'solo_choice',
        outcome_text:
          'If partnership feels complex, simplifying decision-making may help. Consider reducing dependency and keeping responsibilities clearly owned.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is treated as a simplification strategy when partnership signals are stressed.',
        },
        point_id: pointId,
      },
    },

    // 12) Legal/dispute risk (conflict escalation)
    {
      code: 'LEGAL_DISPUTE_RISK',
      label: 'Dispute risk: keep documentation clean and escalation paths clear.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'MARS'], house_in: [6, 7], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.65 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.8,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'dispute_risk',
        outcome_text:
          'Dispute risk may be higher. It can help to keep agreements explicit, maintain records, and avoid informal commitments.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Pressure indicators are stronger, so documentation and calm governance are prioritized.',
        },
        point_id: pointId,
      },
    },

    // 13) Trust rebuild via structure (stabilizing)
    {
      code: 'TRUST_REBUILD_STRUCTURE',
      label: 'Trust rebuild: structure and clarity reduce friction over time.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [10, 6], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.55,
        tone: 'cautious',
        trigger: 'natal',
        scenario: 'trust_rebuild_structure',
        outcome_text:
          'Stability can improve with structure. Consider aligning on KPIs, decision rights, and a simple cadence for updates and reviews.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'This is framed as a mitigation path—structure reduces ambiguity and friction.',
        },
        point_id: pointId,
      },
    },

    // 14) Exit/contingency planning recommended (risk-aware)
    {
      code: 'CONTINGENCY_EXIT_PLANNING',
      label: 'Contingency planning helps when partnership uncertainty is elevated.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['RAHU', 'KETU'], house_in: [7, 8], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.7,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'contingency_planning',
        outcome_text:
          'Uncertainty may be higher than usual. Consider defining contingencies: roles, handoffs, and an exit plan that is respectful and clear.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'This is used as a clarity/safety planning note when uncertainty signals are present.',
        },
        point_id: pointId,
      },
    },

    // 15) Transit: mediation and renegotiation window (short-term)
    {
      code: 'TRANSIT_MEDIATION_WINDOW',
      label: 'Short-term support for mediation and renegotiation.',
      scopes: ['daily', 'weekly'],
      condition_tree: {
        transit_planet_in_house: {
          planet_in: ['MERCURY', 'VENUS'],
          house_in: [7, 10, 11],
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
        scenario: 'mediation_window',
        outcome_text:
          'A short-term window may support calmer discussions. You can use it to clarify terms, align priorities, and reduce misunderstandings.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'This is time-bound and best used for clarity and agreement hygiene.',
        },
        point_id: pointId,
      },
    },

    // 16) Informational baseline for partnership complexity
    {
      code: 'PARTNERSHIP_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for partnership complexity.',
      condition_tree: { generic_condition: { note: 'Partnership baseline (background).' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'informational_baseline',
        outcome_text:
          'No single strong partnership signal stands out here. Keeping roles, expectations, and documentation reasonably clear may be sufficient.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Used as a baseline when stronger partnership-complex variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


