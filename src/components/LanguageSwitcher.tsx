import { Languages } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { LOCALES, LOCALE_LABELS } from '../i18n/locale';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('switcher.ariaLabel')}
      className="flex items-center gap-1 rounded-md border border-slate-800 bg-[#070B12] p-0.5"
    >
      <Languages className="ml-1.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
      {LOCALES.map((id) => (
        <button
          key={id}
          type="button"
          lang={id}
          onClick={() => setLocale(id)}
          aria-pressed={locale === id}
          className={`rounded px-2 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            locale === id ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {LOCALE_LABELS[id]}
        </button>
      ))}
    </div>
  );
}
