export const SESSION_COLORS = [
  '#0D9488',
  '#6366F1',
  '#F59E0B',
  '#8B5CF6',
  '#06B6D4',
  '#10B981',
  '#F97316',
  '#EC4899',
  '#3B82F6',
  '#EF4444',
  '#84CC16',
  '#14B8A6',
  '#A855F7',
  '#F43F5E',
  '#22C55E',
  '#EAB308',
  '#64748B',
  '#0EA5E9',
  '#D946EF',
  '#78716C',
] as const;

export function getSessionColor(index: number): string {
  return SESSION_COLORS[index % SESSION_COLORS.length];
}
