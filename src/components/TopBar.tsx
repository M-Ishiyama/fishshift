import { Play, Square } from 'lucide-react';
import { useT } from '../i18n/I18nProvider';
import type { TabId } from '../types/ocean';
import { LanguageSwitcher } from './LanguageSwitcher';

interface TopBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  demoActive: boolean;
  onToggleDemo: () => void;
}

const NAV_ITEMS: { id: TabId; label: string }[] = [
  { id: 'map', label: 'Ocean Map' },
  { id: 'trends', label: 'Trend Explorer' },
  { id: 'routes', label: 'Route Lab' },
];

export function TopBar({ activeTab, onSelectTab, demoActive, onToggleDemo }: TopBarProps) {
  const t = useT();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#070B12]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
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

        <div className="flex shrink-0 items-center gap-3">
          <LanguageSwitcher />
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
                <span>{t('demo.stop')}</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>{t('demo.start')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
