import { Module } from '@nestjs/common';
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
import * as fs from 'fs';
import * as path from 'path';
import { TranslationService } from './i18n.service';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: (() => {
          const compiledPath = path.join(__dirname, 'locales');
          if (fs.existsSync(compiledPath)) {
            return compiledPath;
          }
          return path.join(process.cwd(), 'src/i18n/locales');
        })(),
        watch: true,
      },
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
