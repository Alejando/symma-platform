import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/render-with-intl';
import { LanguageSwitcher } from './language-switcher';

const mockRefresh = vi.fn();
const mockSetUserLocale = vi.fn().mockResolvedValue(undefined);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock('@/i18n/locale-actions', () => ({
  setUserLocale: (...args: unknown[]) => mockSetUserLocale(...args),
}));

describe('LanguageSwitcher', () => {
  it('offers every supported language with the current one selected', () => {
    renderWithIntl(<LanguageSwitcher />);

    const select = screen.getByLabelText('Idioma');
    expect(select).toHaveValue('es');
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
  });

  it('persists the chosen language and re-renders without a full page reload', async () => {
    renderWithIntl(<LanguageSwitcher />);

    fireEvent.change(screen.getByLabelText('Idioma'), { target: { value: 'en' } });

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(mockSetUserLocale).toHaveBeenCalledWith('en');
  });
});
