export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;
export const DEFAULT_LANGUAGE = 'es';

export function languageFromAcceptLanguage(header: string | undefined): string {
  const requested = (header ?? '')
    .split(',')
    .map((part) => {
      const [tag, ...parameters] = part.trim().split(';');
      const quality = parameters
        .map((parameter) => /^q=([\d.]+)$/.exec(parameter.trim())?.[1])
        .find((value) => value !== undefined);
      return {
        language: tag.split('-')[0].toLowerCase(),
        quality: quality === undefined ? 1 : Number(quality),
      };
    })
    .filter(({ language, quality }) => language && quality > 0)
    .sort((a, b) => b.quality - a.quality);

  return (
    requested.find(({ language }) =>
      (SUPPORTED_LANGUAGES as readonly string[]).includes(language),
    )?.language ?? DEFAULT_LANGUAGE
  );
}
