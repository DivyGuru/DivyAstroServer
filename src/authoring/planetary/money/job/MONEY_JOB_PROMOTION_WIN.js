export function getMONEY_JOB_PROMOTION_WINVariants() {
  const effectTheme = 'money';
  const area = 'money_job_income';
  const pointId = 'MONEY_JOB_PROMOTION_WIN';

  return [
    {
      code: 'GENERIC_BASE',
      label: 'Generic draft condition (baseline).',
      condition_tree: { generic_condition: { note: 'Author real promotion-win conditions here.' } },
      effect_json: { theme: effectTheme, area, trend: 'up', intensity: 0.7, tone: 'positive', trigger: 'natal', point_id: pointId },
    },
    {
      code: 'GENERIC_STRONG_WIN',
      label: 'Generic strong win variant.',
      condition_tree: { generic_condition: { note: 'Author real high-confidence promotion conditions here.' } },
      effect_json: { theme: effectTheme, area, trend: 'up', intensity: 0.85, tone: 'positive', trigger: 'natal', point_id: pointId },
    },
    {
      code: 'TRANSIT_GENERIC',
      label: 'Generic transit variant (short-term movement).',
      scopes: ['hourly', 'daily', 'weekly'],
      condition_tree: { generic_condition: { note: 'Replace with real transit conditions during authoring.' } },
      effect_json: { theme: effectTheme, area, trend: 'up', intensity: 0.6, tone: 'positive', trigger: 'transit', point_id: pointId },
    },
    {
      code: 'DASHA_GENERIC',
      label: 'Generic dasha variant (longer-term phase).',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: { generic_condition: { note: 'Replace with real dasha conditions during authoring.' } },
      effect_json: { theme: effectTheme, area, trend: 'up', intensity: 0.6, tone: 'positive', trigger: 'dasha', point_id: pointId },
    },
  ];
}


