import { describe, it, expect } from 'vitest';
import esCommon from './locales/es/common.json';
import esEnums from './locales/es/enums.json';
import esErrors from './locales/es/errors.json';
import esValidation from './locales/es/validation.json';
import enCommon from './locales/en/common.json';
import enEnums from './locales/en/enums.json';
import enErrors from './locales/en/errors.json';
import enValidation from './locales/en/validation.json';

type Catalog = { [key: string]: string | Catalog };

const namespaces: Record<string, { es: Catalog; en: Catalog }> = {
  common: { es: esCommon, en: enCommon },
  enums: { es: esEnums, en: enEnums },
  errors: { es: esErrors, en: enErrors },
  validation: { es: esValidation, en: enValidation },
};

function flatten(catalog: Catalog, prefix = ''): Map<string, string> {
  const entries = new Map<string, string>();
  for (const [key, value] of Object.entries(catalog)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      entries.set(path, value);
    } else {
      flatten(value, path).forEach((nested, nestedPath) => entries.set(nestedPath, nested));
    }
  }
  return entries;
}

function placeholdersOf(message: string): string[] {
  return [...message.matchAll(/\{\s*(\w+)/g)].map((match) => match[1] ?? '').sort();
}

describe.each(Object.entries(namespaces))('%s catalog', (_namespace, { es, en }) => {
  const spanish = flatten(es);
  const english = flatten(en);

  it('has exactly the same keys in Spanish and English', () => {
    expect([...english.keys()].sort()).toEqual([...spanish.keys()].sort());
  });

  it('has no empty translations', () => {
    const emptyKeys = [...spanish, ...english].filter(([, value]) => value.trim() === '').map(([key]) => key);
    expect(emptyKeys).toEqual([]);
  });

  it('uses the same placeholders in both languages', () => {
    const mismatches = [...spanish]
      .filter(([key, value]) => english.has(key) && placeholdersOf(value).join() !== placeholdersOf(english.get(key)!).join())
      .map(([key]) => key);
    expect(mismatches).toEqual([]);
  });
});
