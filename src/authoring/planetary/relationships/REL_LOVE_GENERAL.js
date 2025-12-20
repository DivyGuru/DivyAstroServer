export function getREL_LOVE_GENERALVariants() {
  const effectTheme = 'relationship';
  const area = 'rel_love';
  const pointId = 'REL_LOVE_GENERAL';

  return [
    {
      code: 'GENERIC_BASE',
      label: 'Generic draft condition (baseline).',
      condition_tree: { generic_condition: { note: 'Author real love-general conditions here.' } },
      effect_json: { theme: effectTheme, area, trend: 'mixed', intensity: 0.6, tone: 'mixed', trigger: 'natal', point_id: pointId },
    },
    {
      code: 'GENERIC_SUPPORT',
      label: 'Generic supportive variant.',
      condition_tree: { generic_condition: { note: 'Author real supportive love conditions here.' } },
      effect_json: { theme: effectTheme, area, trend: 'up', intensity: 0.7, tone: 'positive', trigger: 'natal', point_id: pointId },
    },
    {
      code: 'GENERIC_CHALLENGE',
      label: 'Generic challenging variant.',
      condition_tree: { generic_condition: { note: 'Author real challenging love conditions here.' } },
      effect_json: { theme: effectTheme, area, trend: 'down', intensity: 0.7, tone: 'challenging', trigger: 'natal', point_id: pointId },
    },
    {
      code: 'TRANSIT_GENERIC',
      label: 'Generic transit variant.',
      scopes: ['daily', 'weekly', 'monthly'],
      condition_tree: { generic_condition: { note: 'Replace with real transit conditions during authoring.' } },
      effect_json: { theme: effectTheme, area, trend: 'mixed', intensity: 0.5, tone: 'mixed', trigger: 'transit', point_id: pointId },
    },
    {
      code: 'DASHA_GENERIC',
      label: 'Generic dasha variant.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: { generic_condition: { note: 'Replace with real dasha conditions during authoring.' } },
      effect_json: { theme: effectTheme, area, trend: 'mixed', intensity: 0.5, tone: 'mixed', trigger: 'dasha', point_id: pointId },
    },
  ];
}


