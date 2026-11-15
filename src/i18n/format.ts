import { useMemo } from 'react';
import type { Translator } from './dictionary';
import { useI18n } from './I18nProvider';
import type { Locale } from './locale';

const LOCALE_TAG: Record<Locale, string> = { ja: 'ja-JP', en: 'en-US' };

export interface Formatters {
  /** Fixed-decimal number, grouped per the active locale. */
  number: (value: number, digits?: number) => string;
  /** Same as `number`, with an explicit sign so gains read as gains. */
  signed: (value: number, digits?: number) => string;
  integer: (value: number) => string;
  /** Takes a 0..1 ratio, not an already-multiplied percentage. */
  percent: (ratio: number, digits?: number) => string;
  monthShort: (month: number) => string;
  yearMonth: (year: number, month: number) => string;
  year: (year: number) => string;
  yearRange: (from: number, to: number) => string;
  /**
   * Grouped yen amount without a currency symbol. The symbol/label is a
   * dictionary entry, because Intl's JPY style renders a fullwidth yen sign
   * under ja-JP and implies an FX awareness this prototype does not have.
   */
  jpy: (amount: number) => string;
}

export function createFormatters(locale: Locale, t: Translator): Formatters {
  const tag = LOCALE_TAG[locale];
  const monthFmt = new Intl.DateTimeFormat(tag, { month: locale === 'ja' ? 'numeric' : 'short' });
  const groupFmt = new Intl.NumberFormat(tag);

  const number = (value: number, digits = 1) =>
    new Intl.NumberFormat(tag, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);

  const monthShort = (month: number) => {
    const label = monthFmt.format(new Date(Date.UTC(2000, month - 1, 1)));
    return locale === 'ja' ? `${label}月` : label;
  };

  return {
    number,
    signed: (value, digits = 1) => `${value >= 0 ? '+' : ''}${number(value, digits)}`,
    integer: (value) => groupFmt.format(value),
    percent: (ratio, digits = 1) =>
      new Intl.NumberFormat(tag, {
        style: 'percent',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(ratio),
    monthShort,
    yearMonth: (year, month) =>
      t('format.yearMonth', { year: String(year), month: monthShort(month) }),
    year: (year) => t('format.year', { year: String(year) }),
    yearRange: (from, to) =>
      t('format.yearRange', {
        from: String(from),
        to: String(to),
        span: String(to - from + 1),
      }),
    jpy: (amount) => groupFmt.format(amount),
  };
}

/** Intl constructors are not cheap and these run inside render loops. */
export function useFormat(): Formatters {
  const { locale, t } = useI18n();
  return useMemo(() => createFormatters(locale, t), [locale, t]);
}
