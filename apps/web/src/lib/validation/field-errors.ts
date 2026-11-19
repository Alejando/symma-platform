import type { ZodError } from 'zod';

/** Schema messages are keys of the `validation` catalog, resolved here in the user's language. */
export function toFieldErrors(error: ZodError, translate: (key: string) => string): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form');
    fieldErrors[field] ??= translate(issue.message);
  }
  return fieldErrors;
}
