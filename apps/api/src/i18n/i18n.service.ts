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
    if (
      typeof translated === 'string' &&
      translated === `enums.${enumName}.${value}`
    ) {
      return value;
    }
    return translated;
  }
}
