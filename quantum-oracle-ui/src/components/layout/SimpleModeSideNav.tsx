'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Sparkles,
  Lock,
  Key,
  Shield,
  Settings,
  Home,
  Zap,
  Code2,
} from 'lucide-react';
import { useUserMode } from '@/contexts/UserModeContext';

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  match: (path: string) => boolean;
};

const SIMPLE_NAV: NavItem[] = [
  { href: '/simple', label: 'Home', Icon: Home, match: (p) => p === '/simple' },
  { href: '/wizard/random', label: 'Generate Random Data', Icon: Zap, match: (p) => p.startsWith('/wizard/random') },
  { href: '/wizard/encrypt', label: 'Encrypt/Decrypt', Icon: Lock, match: (p) => p.startsWith('/wizard/encrypt') },
  { href: '/pqc/keys', label: 'Create PQC Keys', Icon: Key, match: (p) => p.startsWith('/pqc/keys') },
  { href: '/settings', label: 'Settings', Icon: Settings, match: (p) => p === '/settings' },
];

export function SimpleModeSideNav() {
  const pathname = usePathname();
  const { setMode } = useUserMode();

  const handleSwitchToDeveloper = () => {
    setMode('developer');
    window.location.href = '/dashboard';
  };

  return (
    <aside className="flex h-full max-h-full w-full min-w-0 flex-col overflow-x-hidden overflow-y-hidden border-r border-outline-variant/10 bg-surface-container-low">
      {/* Logo */}
      <div className="border-b border-outline-variant/10 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
          <span className="font-headline text-sm font-semibold text-on-surface">QCrypt</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            Simple Mode
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Simple navigation">
        <div className="space-y-1">
          {SIMPLE_NAV.map((item) => {
            const active = item.match(pathname);
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    active ? 'text-emerald-400' : 'text-outline'
                  }`}
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="min-w-0 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Help Text */}
        <div className="mt-6 rounded-lg border border-outline-variant/10 bg-surface-container p-3">
          <p className="text-xs font-medium text-on-surface">💡 Quick Tip</p>
          <p className="mt-1 text-[11px] text-on-surface-variant">
            Each tool guides you through a step-by-step wizard. Switch to Developer Mode anytime for advanced features.
          </p>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-outline-variant/10 px-3 py-3">
        <button
          onClick={handleSwitchToDeveloper}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <Code2 className="h-5 w-5" />
          <span className="min-w-0 truncate">Switch to Developer Mode</span>
        </button>
      </div>
    </aside>
  );
}
