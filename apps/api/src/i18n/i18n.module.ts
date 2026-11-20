import { Module } from '@nestjs/common';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { TranslationService } from './i18n.service';
import { DEFAULT_LANGUAGE } from '../common/i18n/request-language';

const sharedLocalesDirectory = path.dirname(
  path.dirname(require.resolve('@symma/i18n/src/locales/es/errors.json')),
);

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: DEFAULT_LANGUAGE,
      loaderOptions: { path: sharedLocalesDirectory, watch: false },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-custom-lang']),
      ],
    }),
  ],
  providers: [TranslationService],
  exports: [TranslationService],
})
export class AppI18nModule {}
