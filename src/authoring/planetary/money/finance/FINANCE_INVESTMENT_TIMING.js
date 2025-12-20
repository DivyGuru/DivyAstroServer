export function getFINANCE_INVESTMENT_TIMINGVariants() {
  const effectTheme = 'money';
  const area = 'money_finance_personal';
  const pointId = 'FINANCE_INVESTMENT_TIMING';

  const growthHouses = [2, 11, 5, 9];
  const riskHouses = [8, 12, 6];

  const benefics = ['JUPITER', 'VENUS'];
  const trade = ['MERCURY'];
  const malefics = ['SATURN', 'MARS', 'RAHU', 'KETU'];

  const SUPPORT_IDS = [5, 6, 4, 1, 2];
  const PRESSURE_IDS = [7, 3, 8, 9];

  return [
    // 1) Investment timing supportive (confirmed)
    {
      code: 'INVESTMENT_SUPPORT_WINDOW_CONFIRMED',
      label: 'Supportive investment window: growth houses + dasha/transit + nakshatra confirmation.',
      scopes: ['monthly', 'yearly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: [...benefics, ...trade], house_in: growthHouses, match_mode: 'any', min_planets: 2 } },
          { overall_benefic_score: { min: 0.65 } },
          {
            any: [
              { dasha_running: { level: 'mahadasha', planet_in: SUPPORT_IDS } },
              { dasha_running: { level: 'antardasha', planet_in: SUPPORT_IDS } },
              { transit_planet_in_house: { planet_in: ['JUPITER', 'VENUS'], house_in: [2, 11, 5], match_mode: 'any', min_planets: 1 } },
            ],
          },
          {
            any: [
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MERCURY'], group: { context: 'finance', kind: 'supportive' }, match_mode: 'any', min_planets: 1 } },
              { planet_in_nakshatra_group: { planet_in: ['JUPITER', 'VENUS', 'MERCURY'], group: { context: 'finance', kind: 'neutral' }, match_mode: 'any', min_planets: 1 } },
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
        scenario: 'support_window',
        outcome_text:
          'A supportive investment-timing yog is present. Nakshatra support strengthens this phase. Asset direction: long-term investing is in a favorable band—prioritize a diversified + systematic approach, avoid over-speculation, and delay leverage.',
        variant_meta: {
          tone: 'opportunity',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Growth houses + supportive alignment with nakshatra confirmation indicates stronger investment window.',
        },
        point_id: pointId,
      },
    },

    // 2) Speculation caution (5/8/12 mix)
    {
      code: 'SPECULATION_CAUTION',
      label: 'Speculation caution: risk houses activated.',
      scopes: ['daily', 'weekly', 'monthly'],
      condition_tree: {
        all: [
          { planet_in_house: { planet_in: malefics, house_in: riskHouses, match_mode: 'any', min_planets: 1 } },
          { overall_malefic_score: { min: 0.6 } },
        ],
      },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'down',
        intensity: 0.7,
        tone: 'challenging',
        trigger: 'natal',
        scenario: 'speculation_caution',
        outcome_text:
          'Speculation needs extra caution in this phase. Asset direction: prefer liquidity + lower-risk band—prioritize capital protection, avoid high-volatility bets, and delay aggressive entries.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'high',
          dominance: 'dominant',
          certainty_note: 'Risk houses + elevated malefic score indicates higher volatility sensitivity.',
        },
        point_id: pointId,
      },
    },

    // 3) SIP/long-term good, short-term churn avoid
    {
      code: 'SIP_OVER_CHURN',
      label: 'Prefer systematic investing over frequent churn.',
      scopes: ['monthly', 'yearly'],
      condition_tree: { overall_benefic_score: { min: 0.6 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'up',
        intensity: 0.55,
        tone: 'positive',
        trigger: 'natal',
        scenario: 'sip_preference',
        outcome_text:
          'Long-term investing band supportive ho sakta hai. Prioritize systematic investing (SIP/automation), avoid frequent churn, delay speculative over-allocation.',
        variant_meta: {
          tone: 'stabilizing',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Broad benefic support suggests stable approach works better than chasing quick wins.',
        },
        point_id: pointId,
      },
    },

    // 4) Daily risk mood caution (transit + nakshatra)
    {
      code: 'DAILY_RISK_MOOD_CAUTION',
      label: 'Daily risk mood: avoid impulsive trades.',
      scopes: ['hourly', 'daily'],
      condition_tree: {
        all: [
          { transit_planet_in_house: { planet_in: ['MARS', 'RAHU'], house_in: [8, 12, 2], match_mode: 'any', min_planets: 1 } },
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
        scenario: 'daily_risk_mood',
        outcome_text:
          'Today, risk mood can be sensitive. Prioritize “wait & verify”, avoid impulsive trades, and delay new positions—follow the monthly plan.',
        variant_meta: {
          tone: 'cautionary',
          confidence_level: 'low',
          dominance: 'background',
          certainty_note: 'Short transit + sensitive nakshatra indicates temporary risk sensitivity.',
        },
        point_id: pointId,
      },
    },

    // 5) Weekly allocation review window
    {
      code: 'WEEKLY_REBALANCE_WINDOW',
      label: 'Weekly review: rebalance and reduce excess exposure.',
      scopes: ['weekly'],
      condition_tree: { generic_condition: { note: 'Weekly rebalancing posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'weekly_review',
        outcome_text:
          'This week, a portfolio review/rebalance can be helpful. Prioritize risk control, avoid chasing momentum, and delay big new allocations without a clear thesis.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Weekly posture guidance; non-contradictory to monthly direction.' },
        point_id: pointId,
      },
    },

    // 6) Dasha support for investing
    {
      code: 'DASHA_INVEST_SUPPORT',
      label: 'Supportive dasha: investing discipline pays.',
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
          'A supportive investing yog is present (discipline-dependent). Prioritize the long-term investing band, avoid overtrading, and delay leverage.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Supportive dasha alignment supports stable investing approach.' },
        point_id: pointId,
      },
    },

    // 7) Dasha pressure: avoid risk
    {
      code: 'DASHA_INVEST_PRESSURE',
      label: 'Pressure dasha: avoid risky entries.',
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
          'Risk management is important in this phase. Asset direction: capital-protection band—prioritize liquidity, avoid speculative entries, and delay leverage-based investing.',
        variant_meta: { tone: 'cautionary', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Malefic dasha alignment increases downside sensitivity.' },
        point_id: pointId,
      },
    },

    // 8) Long-term investing vs fixed assets
    {
      code: 'ASSET_CLASS_DIFFERENTIATION',
      label: 'Asset class differentiation: not all classes equally favorable.',
      scopes: ['yearly'],
      condition_tree: { overall_benefic_score: { min: 0.55 } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.45,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'asset_class',
        outcome_text:
          'A positive yog does not mean all asset classes are equally favorable. Asset direction: cash/liquidity + long-term diversified investing is in a favorable band; keep speculative exposure limited; evaluate fixed assets with timing and stability.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Narrative control variant for asset-class differentiation.' },
        point_id: pointId,
      },
    },

    // 9) Mixed signals: invest but with caution
    {
      code: 'INVEST_MIXED_SIGNALS',
      label: 'Mixed signals: invest slowly, keep buffers.',
      scopes: ['monthly'],
      condition_tree: { all: [{ overall_benefic_score: { min: 0.55 } }, { overall_malefic_score: { min: 0.55 } }] },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.5,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'mixed',
        outcome_text:
          'Yog kamzor hai ya mixed ho sakta hai. Prioritize stepwise investing, avoid large one-shot bets, delay leverage until stability improves.',
        variant_meta: { tone: 'informational', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Mixed benefic/malefic environment: stepwise approach recommended.' },
        point_id: pointId,
      },
    },

    // 10) Sensitive nakshatra delays entries
    {
      code: 'ENTRY_DELAY_BY_NAKSHATRA',
      label: 'Entry delay: sensitive/obstructive nakshatra indicates pacing.',
      scopes: ['monthly'],
      condition_tree: {
        all: [
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
        intensity: 0.55,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'nakshatra_delay',
        outcome_text:
          'This yog can activate more cleanly when timing becomes supportive—nakshatra sensitivity suggests pacing entries. Prioritize a watchlist + rules, avoid impulsive entries, and delay large allocations.',
        variant_meta: { tone: 'cautionary', confidence_level: 'medium', dominance: 'supporting', certainty_note: 'Nakshatra sensitivity indicates pacing; no standalone window generation.' },
        point_id: pointId,
      },
    },

    // 11) High benefic baseline
    {
      code: 'INVEST_HIGH_BENEFIC_BASELINE',
      label: 'Broad supportive baseline for investing.',
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
          'Investing posture supportive ho sakta hai. Prioritize long-term diversified approach, avoid overtrading, delay leverage.',
        variant_meta: { tone: 'opportunity', confidence_level: 'low', dominance: 'background', certainty_note: 'Broad supportive baseline; not a guarantee.' },
        point_id: pointId,
      },
    },

    // 12) High malefic baseline
    {
      code: 'INVEST_HIGH_MALEFIC_BASELINE',
      label: 'Broad caution baseline for investing.',
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
          'Risk management is important. Prioritize capital protection + liquidity, avoid speculative exposure, and delay leverage-based investing.',
        variant_meta: { tone: 'cautionary', confidence_level: 'low', dominance: 'background', certainty_note: 'Broad malefic baseline; used as background caution.' },
        point_id: pointId,
      },
    },

    // 13) Daily posture
    {
      code: 'INVEST_DAILY_POSTURE',
      label: 'Daily investing posture: avoid reactive decisions.',
      scopes: ['daily'],
      condition_tree: { generic_condition: { note: 'Daily investing posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'daily_posture',
        outcome_text:
          'Today, avoid reactive decisions. Prioritize plan-based execution, avoid FOMO, and delay new positions if uncertain.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Daily posture guidance.' },
        point_id: pointId,
      },
    },

    // 14) Yearly posture
    {
      code: 'INVEST_YEARLY_POSTURE',
      label: 'Yearly investing posture: build long-term base.',
      scopes: ['yearly'],
      condition_tree: { generic_condition: { note: 'Yearly investing posture.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'yearly_posture',
        outcome_text:
          'Is varsh long-term base build karna best rahega. Prioritize diversified investing + buffers, avoid over-leverage, delay speculative over-allocation.',
        variant_meta: { tone: 'stabilizing', confidence_level: 'low', dominance: 'background', certainty_note: 'Yearly posture guidance.' },
        point_id: pointId,
      },
    },

    // 15) Informational baseline
    {
      code: 'INVESTMENT_TIMING_INFORMATIONAL_BASELINE',
      label: 'Baseline informational variant for investment timing.',
      condition_tree: { generic_condition: { note: 'Investment timing baseline.' } },
      effect_json: {
        theme: effectTheme,
        area,
        trend: 'mixed',
        intensity: 0.35,
        tone: 'mixed',
        trigger: 'natal',
        scenario: 'baseline',
        outcome_text:
          'No single strong investment-timing signal stands out. Prioritize planning + risk control, avoid impulsive bets, and delay leverage until clarity improves.',
        variant_meta: { tone: 'informational', confidence_level: 'low', dominance: 'background', certainty_note: 'Baseline used when stronger investment-timing variants do not match.' },
        point_id: pointId,
      },
    },
  ];
}


