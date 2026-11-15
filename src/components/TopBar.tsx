import { Globe, Play, Square } from 'lucide-react';
import type { Locale, TabId } from '../types/ocean';

interface TopBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  demoActive: boolean;
  onToggleDemo: () => void;
  locale: Locale;
  onChangeLocale: (locale: Locale) => void;
}

const NAV_ITEMS: { id: TabId; label: string }[] = [
  { id: 'map', label: 'Ocean Map' },
  { id: 'trends', label: 'Trend Explorer' },
  { id: 'routes', label: 'Route Lab' },
  { id: 'slides', label: 'Presentation' },
  { id: 'feasibility', label: 'Feasibility & Data' },
];

export function TopBar({
  activeTab,
  onSelectTab,
  demoActive,
  onToggleDemo,
  locale,
  onChangeLocale,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#070B12]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-6 py-3.5">
        <button
          type="button"
          onClick={() => onSelectTab('map')}
          className="font-display text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          FishShift
        </button>

        <nav
          aria-label="Primary Navigation"
          className="flex items-center gap-6 overflow-x-auto no-scrollbar"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-cyan-300'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[15px] h-[2px] bg-cyan-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <div
            role="group"
            aria-label={locale === 'ja' ? '表示言語切替' : 'Language selector'}
            className="inline-flex items-center rounded-md border border-slate-800 bg-[#0D1524] p-0.5"
          >
            <Globe className="ml-1.5 mr-1 h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <button
              type="button"
              onClick={() => onChangeLocale('ja')}
              aria-pressed={locale === 'ja'}
              className={`rounded px-2 py-1 font-mono text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                locale === 'ja'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              JP
            </button>
            <button
              type="button"
              onClick={() => onChangeLocale('en')}
              aria-pressed={locale === 'en'}
              className={`rounded px-2 py-1 font-mono text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                locale === 'en'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleDemo}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              demoActive
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            }`}
          >
            {demoActive ? (
              <>
                <Square className="h-3.5 w-3.5" />
                <span>{locale === 'ja' ? 'デモ終了' : 'Stop Demo'}</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>{locale === 'ja' ? 'デモ再生' : 'Play Demo'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
