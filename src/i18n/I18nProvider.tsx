import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Dict, DictKey, Translator } from './dictionary';
import { en } from './locales/en';
import { ja } from './locales/ja';
import { detectLocale, storeLocale } from './locale';
import type { Locale } from './locale';

const DICTS: Record<Locale, Dict> = { ja, en };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translator;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    storeLocale(next);
  }, []);

  const t = useMemo<Translator>(() => {
    const dict = DICTS[locale];
    return ((key: DictKey, params?: unknown) => {
      const entry = dict[key];
      return typeof entry === 'function'
        ? (entry as (p: unknown) => string)(params)
        : entry;
    }) as Translator;
  }, [locale]);

  // index.html ships the static Japanese head tags; mirror the active locale
  // onto the live document so the lang attribute and share metadata agree.
  useEffect(() => {
    const dict = DICTS[locale];
    document.documentElement.lang = locale;
    document.title = dict['app.documentTitle'];

    const description = dict['app.metaDescription'];
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]']) {
      document.querySelector(selector)?.setAttribute('content', description);
    }
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

export function useT(): Translator {
  return useI18n().t;
}
