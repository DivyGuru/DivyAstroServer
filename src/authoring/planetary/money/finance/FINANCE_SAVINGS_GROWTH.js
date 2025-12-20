export function getFINANCE_SAVINGS_GROWTHVariants() {
  const effectTheme = 'money';
  const area = 'money_finance_personal';
  const pointId = 'FINANCE_SAVINGS_GROWTH';

  const stockHouses = [2, 4, 11];
  const inflowHouses = [2, 10, 11];
  const leakageHouses = [12, 6, 8];

  const benefics = ['JUPITER', 'VENUS', 'MOON'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'RAHU', 'KETU', 'MARS'];

  const SUPPORT_IDS = [2, 5, 6, 4, 1];
  const PRESSURE_IDS = [7, 3, 8, 9];

  return [
    // 1) Strong savings buildup (confirmed)
    {
      code: 'SAVINGS_BUILDUP_STRONG_CONFIRMED',
      label: 'Savings buildup: stock houses + supportive alignment + nakshatra confirmation.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: stockHouses, match_mode: 'any', min_planets: 2 } },
          { overall_benefic_score: { min: 0.65 } },
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: SUPPORT_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
              { transit_planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: stockHouses, match_mode: 'any', min_planets: 1 } },
            ],
          },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MOON', 'MERCURY'], group: { context: 'finance', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MOON', 'MERCURY'], group: { context: 'finance', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'savings_strong',
        outcome_text:
          'A gains-and-savings yog is present. Nakshatra support strengthens this phase. Money stock: gradual-to-strong buildup—prioritize automation + buffers, avoid lifestyle creep, and delay speculative over-allocation.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Stock houses + supportive alignment with nakshatra confirmation indicates strong savings buildup.',
        },
        point_id: pointId,
      },
    },

    // 2) Savings via discipline (Saturn + 2/4)
    {
      code: 'SAVINGS_VIA_DISCIPLINE',
      label: 'Savings via discipline: slow but steady accumulation.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [2, 4], match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
          { overall_malefic_score: { max: 0.8 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.65,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'discipline_savings',
        outcome_text:
          'Savings may build slowly but steadily. Money stock: stability-first—prioritize consistent saving, avoid impulsive upgrades, and delay high-risk bets until buffer targets are met.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Saturn in stock houses indicates structured, disciplined savings growth.',
        },
        point_id: pointId,
      },
    },

    // 3) Savings blocked by leakage (12/6)
    {
      code: 'SAVINGS_BLOCKED_BY_LEAKAGE',
      label: 'Savings blocked: leakage/obligations reduce stock growth.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN', 'RAHU', 'KETU'], house_in: [12, 6, 2], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.65 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.75,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'leakage_blocks_savings',
        outcome_text:
          'Savings may face pressure (leakage/obligations). Keep money flow vs stock separate—prioritize expense caps + debt control, avoid new liabilities, and delay non-essential spending.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Leakage/outflow activation with high malefic score restricts savings buildup.',
        },
        point_id: pointId,
      },
    },

    // 4) Monthly savings window (transit)
    {
      code: 'MONTHLY_SAVINGS_WINDOW',
      label: 'Monthly savings window: supportive transits favor stock-building.',
      scopes: ['monthly'],
      condition_tree: {
        all: [
          { transit_planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: stockHouses, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'monthly_window',
        outcome_text:
          'This month may be supportive for savings buildup. Prioritize SIP/automation + buffer, avoid impulse buys, and delay speculative exposure.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Monthly transit support + supportive/neutral nakshatra refinement.',
        },
        point_id: pointId,
      },
    },

    // 5) Yearly wealth habit formation
    {
      code: 'YEARLY_HABIT_FORMATION',
      label: 'Yearly theme: wealth habits strengthen stock.',
      scopes: ['yearly'],
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.6 } },
          { planet_in_house: { planet_in: ['SATURN'], house_in: [2, 6], match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.5,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'habit_year',
        outcome_text:
          'Is varsh wealth habits se stock improve ho sakta hai. Prioritize budgeting + automation, avoid frequent churn, delay high-risk bets until base is strong.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Yearly habit-building posture; supports stock via discipline.',
        },
        point_id: pointId,
      },
    },

    // 6) Dasha supportive savings
    {
      code: 'DASHA_SAVINGS_SUPPORT',
      label: 'Supportive dasha: savings growth improves over time.',
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
          'A savings-growth yog is present. Direction: stock-building—prioritize systematic saving/investing, avoid over-spending, and delay speculative allocation until base targets are met.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Supportive dasha alignment supports gradual stock accumulation.',
        },
        point_id: pointId,
      },
    },

    // 7) Dasha pressure reduces savings
    {
      code: 'DASHA_SAVINGS_PRESSURE',
      label: 'Pressure dasha: savings growth slows; protect buffers.',
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
          'Savings progress may be slower. Prioritize buffers + debt control, avoid leverage, and delay risky investments until pressure eases.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Malefic dasha alignment indicates slower savings growth and higher outflow pressure.',
        },
        point_id: pointId,
      },
    },

    // 8) Stock vs flow mismatch (high flow, low stock)
    {
      code: 'FLOW_HIGH_STOCK_LOW',
      label: 'High flow, low stock: savings leakage needs fixing.',
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SUN', 'MERCURY'], house_in: inflowHouses, match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: malefics, house_in: leakageHouses, match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mismatch',
        outcome_text:
          'Flow strong ho sakta hai, lekin stock build nahi ho raha. Prioritize leakage audit + automation, avoid lifestyle creep, delay speculative exposure.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Inflow and leakage indicators coexist; guidance emphasizes conversion of flow to stock.',
        },
        point_id: pointId,
      },
    },

    // 9) Sensitive nakshatra slows savings activation
    {
      code: 'SAVINGS_DELAY_BY_NAKSHATRA',
      label: 'Savings yog forming but delayed by sensitive/obstructive nakshatra.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: stockHouses, match_mode: 'any', min_planets: 1 } },
          { overall_benefic_score: { min: 0.55 } },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS'], group: { context: 'finance', kind: 'sensitive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS'], group: { context: 'finance', kind: 'obstructive' }, match_mode: 'any', min_planets: 1 } },
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
          'Yog kamzor hai ya phased ho sakta hai—Nakshatra sensitivity se savings activation delay ho sakta hai. Prioritize discipline, avoid risky moves, delay aggressive investing until stability confirms.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'supporting',
          certainty_note: 'Positive stock signals exist but nakshatra sensitivity suggests pacing/delay.',
        },
        point_id: pointId,
      },
    },

    // 10) Sudden outflow blocks savings (8/12)
    {
      code: 'SUDDEN_OUTFLOW_BLOCKS_SAVINGS',
      label: 'Sudden outflow blocks savings: keep buffers higher.',
      scopes: ['monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['RAHU', 'KETU'], house_in: [8, 12], match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.55 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.6,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'sudden_outflow',
        outcome_text:
          'Sudden outflow ka risk savings ko interrupt kar sakta hai. Prioritize higher buffer, avoid over-committing, delay high-risk bets until volatility reduces.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'medium',
          dominance: 'background',
          certainty_note: '8th/12th activation suggests sudden outflow risk; buffer-first approach.',
        },
        point_id: pointId,
      },
    },

    // 11) Weekly savings push
    {
      code: 'WEEKLY_SAVINGS_PUSH',
      label: 'Weekly savings push: small wins compound.',
      scopes: ['weekly'],
      condition_tree: {
        transit_planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: stockHouses, match_mode: 'any', min_planets: 1 },
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.45,
        tone: 'positive',
        trigger: 'transit',
        scenario: 'weekly_push',
        outcome_text:
          'This week can support a savings push. Prioritize automation/top-up, avoid impulse spending, and delay speculative trades.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Weekly transit support indicates small but useful savings momentum.',
        },
        point_id: pointId,
      },
    },

    // 12) Daily discipline reminder
    {
      code: 'DAILY_SAVINGS_DISCIPLINE',
      label: 'Daily discipline: protect stock.',
      scopes: ['daily'],
      condition_tree: { generic_condition: { note: 'Daily savings discipline posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'daily_posture',
        outcome_text:
          'Today, maintain discipline: prioritize essential spending + savings, avoid impulse buys, and delay high-risk decisions.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Daily posture guidance; complements monthly/yearly direction.',
        },
        point_id: pointId,
      },
    },

    // 13) High benefic baseline (background)
    {
      code: 'SAVINGS_HIGH_BENEFIC_BASELINE',
      label: 'Broad supportive baseline for savings growth.',
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
          'Overall support favorable hai—savings gradual-to-strong buildup dikha sakti hai. Prioritize consistency, avoid over-risking, delay speculative over-allocation.',
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
      code: 'SAVINGS_HIGH_MALEFIC_BASELINE',
      label: 'Broad caution baseline: protect savings.',
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
          'Savings ko protect karna priority rahega. Prioritize buffers, avoid new liabilities, delay risky exposure.',
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
      code: 'SAVINGS_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for savings growth.',
      condition_tree: { generic_condition: { note: 'Savings growth baseline.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'baseline',
        outcome_text:
          'No single strong savings signal stands out. Keep flow vs stock separate—prioritize automation + buffers, avoid impulse buys, and delay speculative exposure until clarity improves.',
        variant_meta: {
          tone: 'informational',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Baseline used when stronger savings-growth variants do not match.',
        },
        point_id: pointId,
      },
    },
  ];
}


