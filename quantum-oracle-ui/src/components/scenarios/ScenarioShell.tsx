'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SCENARIOS } from './scenarioData';

const NAV = [
  { href: '/scenarios', label: 'hub', exact: true },
  ...SCENARIOS.map((s) => ({ href: `/scenarios/${s.slug}`, label: s.slug, exact: false })),
];

export function ScenarioShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';

  return (
    <div className="min-h-screen text-[rgb(var(--fg))] relative pb-10">
      <header className="border-b border-[rgb(var(--border))] relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 font-mono">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[rgb(var(--green))] select-none">$</span>
                <Link
                  href="/"
                  className="text-base sm:text-lg font-semibold text-[rgb(230,255,238)] hover:text-[rgb(var(--green))] transition-colors"
                >
                  qcrypt-rng
                </Link>
                <span className="text-[rgb(var(--fg-dim))] text-xs sm:text-sm">/ scenarios</span>
                <span className="text-[rgb(var(--green))] caret ml-0.5" aria-hidden />
              </div>
              <div className="mt-1 text-[10px] tracking-[0.15em] uppercase text-[rgb(var(--fg-dim))]">
                prove · protect · randomize · composed workflows
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/docs" className="btn-ghost hidden sm:inline-flex">
                docs
              </Link>
              <Link href="/" className="btn-ghost">
                ← dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b border-[rgb(var(--border))] bg-[rgb(var(--bg-sunken))]/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-1 flex-wrap font-mono text-[11px] uppercase tracking-wider">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-2.5 py-1 rounded-[2px] border transition-colors',
                  active
                    ? 'border-[rgb(var(--green))] text-[rgb(var(--green))] bg-[rgba(0,255,156,0.06)]'
                    : 'border-transparent text-[rgb(var(--fg-dim))] hover:text-[rgb(var(--fg))] hover:border-[rgb(var(--border))]',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 relative z-10 space-y-6">
        <div className="space-y-1">
          {subtitle && (
            <div className="text-[10px] uppercase tracking-[0.2em] text-[rgb(var(--fg-dim))]">
              {subtitle}
            </div>
          )}
          <h1 className="text-lg sm:text-xl font-mono font-semibold text-[rgb(230,255,238)]">
            {title}
          </h1>
        </div>
        {children}
      </main>

      <footer className="border-t border-[rgb(var(--border))] mt-12 py-5 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between text-[11px] uppercase tracking-wider text-[rgb(var(--fg-dim))] font-mono">
          <span>qcrypt-rng // scenario guides · M3</span>
          <Link href="/blockchain/randomize" className="hover:text-[rgb(var(--green))] transition-colors">
            blockchain pillars ›
          </Link>
        </div>
      </footer>
    </div>
  );
}
