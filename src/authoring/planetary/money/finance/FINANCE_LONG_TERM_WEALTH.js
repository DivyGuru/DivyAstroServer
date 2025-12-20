export function getFINANCE_LONG_TERM_WEALTHVariants() {
  const effectTheme = 'money';
  const area = 'money_finance_personal';
  const pointId = 'FINANCE_LONG_TERM_WEALTH';

  const stockHouses = [2, 4, 11];
  const inflowHouses = [2, 10, 11];
  const leakageHouses = [12, 6, 8];

  const benefics = ['JUPITER', 'VENUS', 'MOON'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'RAHU', 'KETU', 'MARS'];

  const SUPPORT_IDS = [2, 5, 6, 4, 1];
  const PRESSURE_IDS = [7, 3, 8, 9];

  return [
    // 1) Strong long-term wealth trajectory (confirmed)
    {
      code: 'LONG_TERM_WEALTH_STRONG_CONFIRMED',
      label: 'Long-term wealth: stock-building + supportive alignment + nakshatra confirmation.',
      scopes: ['yearly', 'life_theme'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: stockHouses, match_mode: 'any', min_planets: 2 } },
          { overall_benefic_score: { min: 0.65 } },
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: SUPPORT_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
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
        intensity: 0.8,
        tone: 'positive',
        trigger: 'combined',
        scenario: 'wealth_trajectory',
        outcome_text:
          'A wealth-support yog is present (Dhan yog), and the long-term wealth trajectory can be strong. Nakshatra support strengthens this direction. Money stock: medium-to-strong buildup—prioritize systematic investing + buffers, avoid over-leverage, and delay high-volatility concentration.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Stock-building indicators + supportive dasha alignment with nakshatra confirmation indicates strong long-term direction.',
        },
        point_id: pointId,
      },
    },

    // 2) Wealth builds slowly (Saturn discipline)
    {
      code: 'WEALTH_SLOW_DISCIPLINE',
      label: 'Wealth builds slowly: discipline-driven trajectory.',
      scopes: ['yearly', 'life_theme'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: ['SATURN'], house_in: [2, 4, 11], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'slow_build',
        outcome_text:
          'Wealth may build slowly but steadily. Prioritize discipline + automation, avoid frequent churn, and delay speculative over-allocation.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Saturn indicates slow-but-steady accumulation via structure.' },
        point_id: pointId,
      },
    },

    // 3) Wealth blocked by leakage/obligations
    {
      code: 'WEALTH_BLOCKED_BY_LEAKAGE',
      label: 'Wealth blocked: leakage/obligations reduce long-term build.',
      scopes: ['yearly', 'life_theme'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: malefics, house_in: leakageHouses, match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.65 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'leakage_block',
        outcome_text:
          'Long-term wealth build par pressure aa sakta hai (leakage/obligations). Prioritize expense caps + debt control, avoid over-leverage, delay high-risk exposure until net stabilizes.',
        variant_meta: { tone: 'cautionary', confidence_level: 'high', dominance: 'dominant', certainty_note: 'Sustained outflow indicators restrict long-term stock building.' },
        point_id: pointId,
      },
    },

    // 4) Inflow strong but stock conversion needed
    {
      code: 'INFLOW_STRONG_CONVERT_TO_STOCK',
      label: 'Inflow strong: convert to stock systematically.',
      scopes: ['yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: inflowHouses, match_mode: 'any', min_planets: 1 } },
          { planet_in_house: { planet_in: malefics, house_in: [12, 8], match_mode: 'any', min_planets: 1 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.65,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'convert_flow',
        outcome_text:
          'An income-flow yog is present, but converting flow into wealth stock needs discipline. Prioritize automation + buffers, avoid lifestyle creep, and delay speculative over-allocation.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Flow exists but outflow/volatility indicates conversion to stock is key.' },
        point_id: pointId,
      },
    },

    // 5) Multi-year redirection
    {
      code: 'MULTIYEAR_REDIRECTION',
      label: 'Multi-year redirection: restructure wealth plan.',
      scopes: ['life_theme'],
      condition_tree: { planet_in_house: { planet_in: ['RAHU', 'KETU'], house_in: [10, 11, 12], match_mode: 'any', min_planets: 1 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.6,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'redirection',
        outcome_text:
          'Direction: a redirection phase can show up in the wealth plan—source/strategy shift. Prioritize clarity + resilience, avoid parallel risky bets, and delay irreversible commitments until direction stabilizes.',
        variant_meta: { tone: 'informational', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Rahu/Ketu patterns suggest redirection and restructuring needs.' },
        point_id: pointId,
      },
    },

    // 6) Dasha support strengthens wealth
    {
      code: 'DASHA_WEALTH_SUPPORT',
      label: 'Supportive dasha: wealth direction strengthens.',
      scopes: ['yearly', 'life_theme'],
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
          'A wealth-support yog is present (long-term band). Prioritize systematic investing + buffers, avoid leverage, and delay high-volatility concentration.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Supportive dasha alignment supports long-term wealth posture.' },
        point_id: pointId,
      },
    },

    // 7) Dasha pressure slows wealth
    {
      code: 'DASHA_WEALTH_PRESSURE',
      label: 'Pressure dasha: slow wealth build; protect base.',
      scopes: ['yearly', 'life_theme'],
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
          'Wealth build may progress more slowly. Prioritize capital protection + liquidity, avoid leverage, and delay speculative over-allocation until pressure eases.',
        variant_meta: { tone: 'cautionary', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Malefic dasha alignment increases downside sensitivity for long-term build.' },
        point_id: pointId,
      },
    },

    // 8) Sensitive nakshatra slows activation
    {
      code: 'WEALTH_DELAY_BY_NAKSHATRA',
      label: 'Wealth yog forming but delayed by sensitive/obstructive nakshatra.',
      scopes: ['yearly'],
      condition_tree: {
        all: [
          { overall_benefic_score: { min: 0.55 } },
          { planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: stockHouses, match_mode: 'any', min_planets: 1 } },
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
        intensity: 0.55,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'delay',
        outcome_text:
          'Support is present, but results can be slower—nakshatra sensitivity suggests pacing. Prioritize patience + systematic investing, avoid leverage, and delay risky concentration.',
        variant_meta: { tone: 'cautionary', confidence_level: 'medium', dominance: 'background', certainty_note: 'Positive signals exist but nakshatra sensitivity suggests phased activation.' },
        point_id: pointId,
      },
    },

    // 9) Yearly asset allocation posture
    {
      code: 'YEARLY_ASSET_ALLOCATION_POSTURE',
      label: 'Yearly posture: diversify and reduce fragility.',
      scopes: ['yearly'],
      condition_tree: { generic_condition: { note: 'Yearly asset allocation posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'yearly_posture',
        outcome_text:
          'Is varsh diversification + buffer focus best rahega. Prioritize liquidity + long-term investing, avoid over-leverage, delay high-risk concentration.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Yearly posture guidance.' },
        point_id: pointId,
      },
    },

    // 10) Life theme: wealth phases 2-3
    {
      code: 'LIFETHEME_WEALTH_PHASES',
      label: 'Life theme: 2–3 major wealth phases over multi-year range.',
      scopes: ['life_theme'],
      condition_tree: { generic_condition: { note: 'Multi-year wealth phases narrative.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'phases',
        outcome_text:
          'Agle 2–5 saal me 2–3 baar wealth direction me notable phases activate ho sakte hain. Prioritize resilience + systematic planning, avoid over-extension, delay irreversible commitments until best windows appear.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Count-based phase framing; stays non-absolute.' },
        point_id: pointId,
      },
    },

    // 11) High benefic baseline
    {
      code: 'WEALTH_HIGH_BENEFIC_BASELINE',
      label: 'Broad supportive baseline for long-term wealth.',
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
          'Long-term support favorable hai. Prioritize systematic investing + buffers, avoid leverage, delay speculative over-allocation.',
        variant_meta: { tone: 'opportunity', confidence_level: 'low', dominance: 'background', certainty_note: 'Broad supportive baseline; not a guarantee.' },
        point_id: pointId,
      },
    },

    // 12) High malefic baseline
    {
      code: 'WEALTH_HIGH_MALEFIC_BASELINE',
      label: 'Broad caution baseline for long-term wealth.',
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
          'Long-term me risk-control aur buffers priority rahenge. Avoid leverage, delay speculative over-allocation, prioritize liquidity + resilience.',
        variant_meta: { tone: 'cautionary', confidence_level: 'low', dominance: 'background', certainty_note: 'Broad malefic baseline; used as background caution.' },
        point_id: pointId,
      },
    },

    // 13) Monthly posture
    {
      code: 'MONTHLY_WEALTH_POSTURE',
      label: 'Monthly posture: convert flow to stock.',
      scopes: ['monthly'],
      condition_tree: { generic_condition: { note: 'Monthly wealth posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'monthly_posture',
        outcome_text:
          'Is mahine flow ko stock me convert karna best rahega. Prioritize saving/investing automation, avoid impulse upgrades, delay speculative exposure.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Monthly posture guidance.' },
        point_id: pointId,
      },
    },

    // 14) Daily posture
    {
      code: 'DAILY_WEALTH_POSTURE',
      label: 'Daily posture: protect buffers.',
      scopes: ['daily'],
      condition_tree: { generic_condition: { note: 'Daily wealth posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'daily_posture',
        outcome_text:
          'Today, protect your buffers. Avoid impulse spending, delay high-risk decisions, and prioritize essentials.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Daily posture guidance.' },
        point_id: pointId,
      },
    },

    // 15) Informational baseline
    {
      code: 'LONG_TERM_WEALTH_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for long-term wealth.',
      condition_tree: { generic_condition: { note: 'Long-term wealth baseline.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'baseline',
        outcome_text:
          'No single strong long-term wealth signal stands out. Prioritize buffers + systematic planning, avoid over-leverage, and delay high-risk exposure until clarity improves.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Baseline used when stronger long-term wealth variants do not match.' },
        point_id: pointId,
      },
    },
  ];
}


