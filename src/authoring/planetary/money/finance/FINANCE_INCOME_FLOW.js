export function getFINANCE_INCOME_FLOWVariants() {
  const effectTheme = 'money';
  const area = 'money_finance_personal';
  const pointId = 'FINANCE_INCOME_FLOW';

  const inflowHouses = [2, 10, 11];
  const workHouses = [10, 6];
  const channelHouses = [3, 11]; // outreach/network
  const volatilityHouses = [8, 12];

  const benefics = ['JUPITER', 'VENUS', 'MOON'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  const SUPPORT_IDS = [2, 5, 6, 4, 1];
  const PRESSURE_IDS = [7, 3, 8, 9];

  return [
    // 1) Strong income flow (confirmed)
    {
      code: 'INCOME_FLOW_STRONG_CONFIRMED',
      label: 'Strong income flow: inflow houses + dasha/transit + nakshatra confirmation.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SUN', 'MERCURY', 'JUPITER'], house_in: inflowHouses, match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.6 } },
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: SUPPORT_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
              { transit_planet_in_house: { planet_in: ['JUPITER'], house_in: [10, 11, 2], match_mode: 'any', min_planets: 1 } },
            ],
          },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['MERCURY', 'SUN', 'JUPITER'], group: { context: 'finance', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['MERCURY', 'SUN', 'JUPITER'], group: { context: 'finance', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'income_strong',
        outcome_text:
          'An income-growth yog is strong. Nakshatra support strengthens this phase. Direction: inflow—prioritize repeatable work + collections, avoid over-committing, and delay speculative exposure until buffers are stable.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Inflow houses + supportive dasha/transit alignment ke saath nakshatra confirmation present hai.',
        },
        point_id: pointId,
      },
    },

    // 2) Income via work discipline (Saturn + 10/6)
    {
      code: 'INCOME_VIA_DISCIPLINE',
      label: 'Income via discipline: slow but stable work-linked flow.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: workHouses, match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
          { overall_malefic_score: { max: 0.75 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.65,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'discipline_income',
        outcome_text:
          'Income may improve slowly but steadily. Direction: inflow via career/work—prioritize process + consistency, avoid rushed switches, and delay big upgrades until 2–3 months of stability is visible.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Saturn work-house emphasis indicates slow-but-stable earning pattern.',
        },
        point_id: pointId,
      },
    },

    // 3) Income via networks (11th)
    {
      code: 'INCOME_VIA_NETWORKS',
      label: 'Income flow supported via networks/referrals.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY', 'VENUS', 'JUPITER', 'SUN'], house_in: [11], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.65,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'networks_income',
        outcome_text:
          'Income flow may be network-driven. Direction: inflow via referrals/clients—prioritize follow-ups + retention, avoid scattered outreach, and delay low-quality opportunities.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: '11th-house activation indicates gains via networks and repeatable channels.',
        },
        point_id: pointId,
      },
    },

    // 4) Income volatility risk (8/12)
    {
      code: 'INCOME_VOLATILITY_RISK',
      label: 'Income volatility: shocks/uncertainty pattern.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['RAHU', 'KETU', 'SATURN'], house_in: volatilityHouses, match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.75,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'volatility',
        outcome_text:
          'Income volatility may increase. Direction: uneven inflow—prioritize liquidity + an emergency buffer, avoid fixed high commitments, and delay leverage until volatility reduces.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: '8th/12th volatility pattern + elevated malefic score suggests uneven inflow.',
        },
        point_id: pointId,
      },
    },

    // 5) Dasha supportive (multi-month)
    {
      code: 'DASHA_INCOME_SUPPORT',
      label: 'Dasha support: income improves steadily over months.',
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
        intensity: 0.6,
        tone: 'positive',
        trigger: 'dasha',
        scenario: 'dasha_support',
        outcome_text:
          'An income-growth yog is present, and this phase can support gradual improvement. Prioritize a stable pipeline, avoid over-expansion, and delay speculative moves.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Supportive dasha alignment with solid benefic score indicates steadier flow.',
        },
        point_id: pointId,
      },
    },

    // 6) Dasha pressure (income delays)
    {
      code: 'DASHA_INCOME_PRESSURE',
      label: 'Dasha pressure: delays in inflow; risk control needed.',
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
        intensity: 0.65,
        tone: 'challenging',
        trigger: 'dasha',
        scenario: 'dasha_pressure',
        outcome_text:
          'Income may face delays/pressure. Prioritize collections + cash discipline, avoid new liabilities, and delay big spending until flow normalizes.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Malefic dasha alignment indicates pacing/pressure on income flow.',
        },
        point_id: pointId,
      },
    },

    // 7) Weekly inflow push (transit)
    {
      code: 'WEEKLY_INFLOW_PUSH',
      label: 'Weekly inflow push: short-term uplift.',
      scopes: ['weekly'],
      condition_tree: {
        all: [
          { transit_planet_in_house: { planet_in: ['JUPITER', 'VENUS', 'MERCURY'], house_in: [10, 11, 2], match_mode: 'any', min_planets: 1 } },
          {
            any: [
              { transit_planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS'], group: { context: 'finance', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { transit_planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS'], group: { context: 'finance', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
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
        trigger: 'transit',
        scenario: 'weekly_uplift',
        outcome_text:
          'This week, inflow support may be present. Prioritize invoicing/follow-ups, avoid distraction spending, and delay risky commitments.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Short-term transit support with supportive/neutral nakshatra refinement.',
        },
        point_id: pointId,
      },
    },

    // 8) Daily risk sensitivity (transit + nakshatra)
    {
      code: 'DAILY_RISK_SENSITIVITY',
      label: 'Daily risk sensitivity: avoid impulsive decisions.',
      scopes: ['hourly', 'daily'],
      condition_tree: {
        all: [
          { transit_planet_in_house: { planet_in: ['MARS', 'RAHU'], house_in: [2, 8, 12], match_mode: 'any', min_planets: 1 } },
          {
            any: [
              { transit_planet_in_nakshatra_group: { planet_in: ['MARS', 'RAHU'], group: { context: 'finance', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { transit_planet_in_nakshatra_group: { planet_in: ['MARS', 'RAHU'], group: { context: 'finance', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'daily_risk',
        outcome_text:
          'Today, risk sensitivity may be higher. Prioritize essentials only, avoid impulsive buys/trades, and delay high-stakes decisions.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Short transit + sensitive/obstructive nakshatra indicates temporary risk mood.',
        },
        point_id: pointId,
      },
    },

    // 9) Income source redirection (Rahu/Ketu 10/12/11)
    {
      code: 'INCOME_SOURCE_REDIRECTION',
      label: 'Income source redirection: restructuring or channel shift.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['RAHU', 'KETU'], house_in: [10, 11, 12], match_mode: 'any', min_planets: 1 } },
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
          'Disha: income ka rukh redirection me ja sakta hai (source/channel change). Prioritize clarity + backup plan, avoid parallel high-risk moves, delay irreversible commitments.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Rahu/Ketu patterns suggest redirection; framed as transition management.',
        },
        point_id: pointId,
      },
    },

    // 10) Mixed signals (flow present, stress present)
    {
      code: 'INCOME_MIXED_SIGNALS',
      label: 'Mixed income signals: inflow exists but needs risk control.',
      scopes: ['monthly'],
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
        intensity: 0.55,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed_signals',
        outcome_text:
          'Income signals are present, but pressure is also active. Prioritize buffers + risk control, avoid over-confidence, and delay major upgrades until 2–3 cycles confirm stability.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Mixed benefic/malefic environment: guidance focuses on stability and buffers.',
        },
        point_id: pointId,
      },
    },

    // 11) Inflow via skills/learning (5th + Mercury/Jupiter)
    {
      code: 'INCOME_VIA_SKILL_UPGRADE',
      label: 'Income improves via skill upgrade and leverage of expertise.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['MERCURY', 'JUPITER'], house_in: [5, 10], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'skill_upgrade',
        outcome_text:
          'Income me improvement skill-upgrade se aa sakta hai. Prioritize learning + certification/portfolio, avoid scattered focus, delay big risks until skill leverage starts paying.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: 'Skill + career house signals suggest income uplift through expertise.',
        },
        point_id: pointId,
      },
    },

    // 12) Pressure from obligations (6th)
    {
      code: 'OBLIGATION_PRESSURE',
      label: 'Obligation pressure reduces net income.',
      scopes: ['monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'MARS', 'RAHU'], house_in: [6], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.65,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'obligation_pressure',
        outcome_text:
          'Net income obligations ke kaaran tighten ho sakta hai. Prioritize essential payments + renegotiation, avoid new liabilities, delay discretionary spending.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: '6th house pressure indicates obligations impacting net flow.',
        },
        point_id: pointId,
      },
    },

    // 13) High benefic baseline (background)
    {
      code: 'INCOME_HIGH_BENEFIC_BASELINE',
      label: 'Broad supportive baseline for income flow.',
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
          'Overall support favorable hai. Prioritize steady execution, avoid complacency, delay unnecessary risks.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Broad supportive baseline; does not imply certainty.',
        },
        point_id: pointId,
      },
    },

    // 14) High malefic baseline (background caution)
    {
      code: 'INCOME_HIGH_MALEFIC_BASELINE',
      label: 'Broad caution baseline: protect cash flow.',
      condition_tree: { overall_malefic_score: { min: 0.7 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.45,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'malefic_baseline',
        outcome_text:
          'Cash-flow ko protect karna important rahega. Prioritize liquidity, avoid high commitments, delay big purchases.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Broad malefic baseline; used as background caution.',
        },
        point_id: pointId,
      },
    },

    // 15) Informational baseline
    {
      code: 'INCOME_FLOW_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for income flow.',
      condition_tree: { generic_condition: { note: 'Finance income flow baseline.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'baseline',
        outcome_text:
          'No single strong income signal stands out. Prioritize tracking + consistency, avoid impulsive financial decisions, and delay high-risk exposure until clarity improves.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Baseline used when stronger income-flow variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


