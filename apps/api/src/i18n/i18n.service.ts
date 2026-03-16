import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class TranslationService {
  constructor(private readonly i18n: I18nService) {}

  translate(key: string, args?: Record<string, any>) {
    return this.i18n.translate(key, { args });
  }

  translateError(key: string, args?: Record<string, any>) {
    return this.i18n.translate(`errors.${key}`, { args });
  }

  translateEnum(enumName: string, value: string) {
    const translated = this.i18n.translate(`enums.${enumName}.${value}`);
    // nestjs-i18n returns the key if not found, we can just return it
    // But if we want to mimic the exact behavior of returning the value if not found:
    if (typeof translated === 'string' && translated === `enums.${enumName}.${value}`) {
      return value;
    }
    return translated as string;
  }
}
