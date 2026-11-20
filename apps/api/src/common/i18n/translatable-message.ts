export interface TranslatableMessage {
  key: string;
  args?: Record<string, unknown>;
}

export const TRANSLATION_KEY_PREFIX = 'errors.';

export function isTranslationKey(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(TRANSLATION_KEY_PREFIX);
}

export function isTranslatableMessage(
  value: unknown,
): value is TranslatableMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    isTranslationKey((value as TranslatableMessage).key)
  );
}
