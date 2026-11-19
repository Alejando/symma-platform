import { useTranslations } from 'next-intl';

interface EnumLabelProps {
  enumName: string;
  value: string;
  className?: string;
}

export function EnumLabel({ enumName, value, className }: EnumLabelProps) {
  const t = useTranslations('enums');
  const translationKey = `${enumName}.${value}`;
  const translatedValue = t.has(translationKey) ? t(translationKey) : value;

  return (
    <span className={className}>
      {translatedValue}
    </span>
  );
}
