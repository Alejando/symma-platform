import { Test, TestingModule } from '@nestjs/testing';
import { TranslationService } from './i18n.service';
import { I18nService } from 'nestjs-i18n';

describe('TranslationService', () => {
  let service: TranslationService;
  let i18nService: jest.Mocked<I18nService>;

  beforeEach(async () => {
    const mockI18nService = {
      translate: jest.fn().mockReturnValue('translated text'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranslationService,
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<TranslationService>(TranslationService);
    i18nService = module.get(I18nService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call i18n.translate with the correct key and args', () => {
    const key = 'common.hello';
    const args = { name: 'World' };
    
    const result = service.translate(key, args);
    
    expect(i18nService.translate).toHaveBeenCalledWith(key, { args });
    expect(result).toBe('translated text');
  });

  it('should prepend errors. prefix for translateError', () => {
    const key = 'server.internalError';
    
    const result = service.translateError(key);
    
    expect(i18nService.translate).toHaveBeenCalledWith(`errors.${key}`, { args: undefined });
    expect(result).toBe('translated text');
  });

  it('should translate enum using prefix and return original value if missing', () => {
    // Mock the translation for missing key to return the key itself (default nestjs-i18n behavior)
    i18nService.translate.mockReturnValueOnce('enums.Role.UNKNOWN');
    const missingResult = service.translateEnum('Role', 'UNKNOWN');
    expect(i18nService.translate).toHaveBeenCalledWith('enums.Role.UNKNOWN');
    expect(missingResult).toBe('UNKNOWN');

    // Mock successful translation
    i18nService.translate.mockReturnValueOnce('Administrador');
    const successResult = service.translateEnum('Role', 'ADMIN');
    expect(i18nService.translate).toHaveBeenCalledWith('enums.Role.ADMIN');
    expect(successResult).toBe('Administrador');
  });
});
