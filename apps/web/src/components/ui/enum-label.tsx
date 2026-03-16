import { useTranslations } from 'next-intl';

interface EnumLabelProps {
  enumName: string;
  value: string;
  className?: string;
}

export function EnumLabel({ enumName, value, className }: EnumLabelProps) {
  const t = useTranslations('enums');
  
  // Try to translate, fallback to the original value if it's the key itself
  // next-intl returns the key if not found when configured with getMessageFallback,
  // or we can use has() to check, but since we configured the fallback, we can just use t()
  
  // We can't guarantee `value` is a valid key at runtime if it comes from an API,
  // so we check if the translation exists to avoid next-intl warnings in dev,
  // or we just call it.
  
  // If the translation matches the path we requested, it means it fell back.
  // Actually, next-intl's `t` will return `enumName.value` if not found with our fallback.
  // So a better approach is to use `t.has` or just use `value` as default.
  
  const translationKey = `${enumName}.${value}`;
  
  // Try to get translation, or fallback to original value
  const translatedValue = t.has(translationKey) ? t(translationKey) : value;

  return (
    <span className={className}>
      {translatedValue}
    </span>
  );
}
