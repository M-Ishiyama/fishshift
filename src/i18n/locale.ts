export type Locale = 'ja' | 'en';

export const LOCALES: Locale[] = ['ja', 'en'];

/** Endonyms: each language is labelled in itself, never in the other one. */
export const LOCALE_LABELS: Record<Locale, string> = {
  ja: '日本語',
  en: 'English',
};

const STORAGE_KEY = 'fishshift.locale';

function isLocale(value: unknown): value is Locale {
  return value === 'ja' || value === 'en';
}

export function readStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    // Private-mode browsers throw on storage access; fall back to detection.
    return null;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Non-fatal: the choice simply does not survive a reload.
  }
}

/**
 * Stored choice wins; otherwise the first ja/en match in the browser's
 * preference list. Falls back to English because the primary audience is the
 * international Space Apps judging panel.
 */
export function detectLocale(): Locale {
  const stored = readStoredLocale();
  if (stored) return stored;

  const tags = navigator.languages ?? [navigator.language];
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (lower.startsWith('ja')) return 'ja';
    if (lower.startsWith('en')) return 'en';
  }
  return 'en';
}
