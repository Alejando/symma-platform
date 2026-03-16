import esEnums from './locales/es/enums.json';

// Type mapping to ensure type safety
type EnumTranslations = typeof esEnums;
type EnumNames = keyof EnumTranslations;

export function translateEnum<T extends string>(
  enumName: EnumNames,
  value: T
): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enumMap = esEnums[enumName] as Record<string, string>;
  return enumMap?.[value] ?? value;
}
