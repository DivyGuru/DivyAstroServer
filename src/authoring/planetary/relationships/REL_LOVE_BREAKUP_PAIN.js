export function getREL_LOVE_BREAKUP_PAINVariants() {
  const effectTheme = 'relationship';
  const area = 'rel_love';
  const pointId = 'REL_LOVE_BREAKUP_PAIN';

  return [
    {
      code: 'GENERIC_BASE',
      label: 'Generic draft condition (baseline).',
      condition_tree: { generic_condition: { note: 'Author real breakup-pain conditions here.' } },
      effect_json: { theme: effectTheme, area, trend: 'down', intensity: 0.75, tone: 'challenging', trigger: 'natal', point_id: pointId },
    },
    {
      code: 'GENERIC_MIXED',
      label: 'Generic mixed-signal variant.',
      condition_tree: { generic_condition: { note: 'Author real mixed breakup/healing conditions here.' } },
      effect_json: { theme: effectTheme, area, trend: 'mixed', intensity: 0.65, tone: 'mixed', trigger: 'natal', point_id: pointId },
    },
    {
      code: 'TRANSIT_GENERIC',
      label: 'Generic transit variant.',
      scopes: ['daily', 'weekly', 'monthly'],
      condition_tree: { generic_condition: { note: 'Replace with real transit conditions during authoring.' } },
      effect_json: { theme: effectTheme, area, trend: 'down', intensity: 0.6, tone: 'challenging', trigger: 'transit', point_id: pointId },
    },
    {
      code: 'DASHA_GENERIC',
      label: 'Generic dasha variant.',
      scopes: ['monthly', 'yearly', 'life_theme'],
      condition_tree: { generic_condition: { note: 'Replace with real dasha conditions during authoring.' } },
      effect_json: { theme: effectTheme, area, trend: 'down', intensity: 0.6, tone: 'challenging', trigger: 'dasha', point_id: pointId },
    },
  ];
}


