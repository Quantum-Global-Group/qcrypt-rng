'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Code2, Route, Settings, Shield, Sparkles } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  match: (path: string) => boolean;
};

const ORACLE_SUB: { href: string; label: string; match: (path: string) => boolean }[] = [
  { href: '/', label: 'Overview', match: (p) => p === '/' },
  { href: '/oracle/request', label: 'Request randomness', match: (p) => p.startsWith('/oracle/request') },
];

const PQC_SUB: { href: string; label: string; match: (path: string) => boolean }[] = [
  { href: '/pqc', label: 'Workspace', match: (p) => p === '/pqc' || p === '/pqc/' },
  { href: '/pqc/keys', label: 'Key generation', match: (p) => p.startsWith('/pqc/keys') },
  { href: '/pqc/kem', label: 'Kyber KEM', match: (p) => p.startsWith('/pqc/kem') },
];

const NAV_FLOW: { title: string; hint: string; items: NavItem[] }[] = [
  {
    title: 'Generate',
    hint: 'Entropy and RNG',
    items: [
      {
        href: '/',
        label: 'Oracle',
        Icon: Sparkles,
        match: (p) => p === '/' || p.startsWith('/oracle'),
      },
    ],
  },
  {
    title: 'Protect',
    hint: 'Post-quantum crypto',
    items: [
      { href: '/pqc', label: 'PQC suite', Icon: Shield, match: (p) => p.startsWith('/pqc') },
    ],
  },
  {
    title: 'Deliver',
    hint: 'On-chain randomness',
    items: [
      {
        href: '/fulfillment',
        label: 'Fulfillment',
        Icon: Route,
        match: (p) => p.startsWith('/fulfillment'),
      },
    ],
  },
  {
    title: 'Learn',
    hint: 'Guides and API',
    items: [
      {
        href: '/docs',
        label: 'Documentation',
        Icon: BookOpen,
        match: (p) => p === '/docs' || p === '/docs/',
      },
    ],
  },
];

function SubLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-md py-1.5 pl-3 text-xs font-medium transition-colors ${
        active ? 'bg-surface text-primary' : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {label}
    </Link>
  );
}

function findOracleItem(): NavItem | undefined {
  return NAV_FLOW.flatMap((s) => s.items).find((i) => i.href === '/');
}

function findPqcItem(): NavItem | undefined {
  return NAV_FLOW.flatMap((s) => s.items).find((i) => i.href === '/pqc');
}

export function SideNav() {
  const pathname = usePathname();
  const oracleItem = findOracleItem();
  const pqcItem = findPqcItem();
  const oracleSection = oracleItem?.match(pathname) ?? false;
  const pqcSection = pqcItem?.match(pathname) ?? false;

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-64 min-w-64 max-w-64 flex-col overflow-x-hidden border-r border-outline-variant/10 bg-surface-container-low">
      <div className="shrink-0 border-b border-outline-variant/10 px-4 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.35)]" />
          <div className="min-w-0">
            <div className="font-headline text-sm font-semibold leading-snug tracking-tight text-on-surface">
              Quantum Oracle
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
              Quantum RNG, post-quantum crypto, and on-chain fulfillment.
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-[10px] uppercase tracking-wider text-outline">
              <span className="text-on-surface">NODE_01</span>
              <span className="text-outline-variant">·</span>
              <span className="text-secondary">Active</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 pt-1" aria-label="Primary">
        <div className="flex flex-col gap-6">
          {NAV_FLOW.map((block) => (
            <div key={block.title} className="min-w-0">
              <div className="px-2 pb-2">
                <div className="text-xs font-semibold text-on-surface">{block.title}</div>
                <div className="mt-0.5 text-[11px] text-on-surface-variant">{block.hint}</div>
              </div>
              {block.items.map((item) => {
                const active = item.match(pathname);
                const Icon = item.Icon;
                return (
                  <div key={item.href} className="min-w-0">
                    <Link
                      href={item.href}
                      className={`flex min-w-0 items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-surface text-primary'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      }`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-primary' : 'text-outline'}`}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <span className="min-w-0 truncate">{item.label}</span>
                    </Link>
                    {item.href === '/' && oracleSection && (
                      <div className="ml-2 mt-0.5 space-y-0.5 border-l border-outline-variant/30 py-1 pl-3">
                        {ORACLE_SUB.map((sub) => (
                          <SubLink key={sub.href} href={sub.href} label={sub.label} active={sub.match(pathname)} />
                        ))}
                      </div>
                    )}
                    {item.href === '/pqc' && pqcSection && (
                      <div className="ml-2 mt-0.5 space-y-0.5 border-l border-outline-variant/30 py-1 pl-3">
                        {PQC_SUB.map((sub) => (
                          <SubLink key={sub.href} href={sub.href} label={sub.label} active={sub.match(pathname)} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </nav>

      <div className="mt-auto shrink-0 border-t border-outline-variant/10 px-2 pb-4 pt-2">
        <Link
          href="/settings"
          className={`flex min-w-0 items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors ${
            pathname === '/settings'
              ? 'bg-surface text-primary'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <Settings
            className={`h-[18px] w-[18px] shrink-0 ${pathname === '/settings' ? 'text-primary' : 'text-outline'}`}
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="min-w-0 truncate">Settings</span>
        </Link>
        <Link
          href="/docs/api"
          className={`mt-0.5 flex min-w-0 items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors ${
            pathname.startsWith('/docs/api')
              ? 'bg-surface text-primary'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <Code2
            className={`h-[18px] w-[18px] shrink-0 ${pathname.startsWith('/docs/api') ? 'text-primary' : 'text-outline'}`}
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="min-w-0 truncate">API reference</span>
        </Link>
      </div>
    </aside>
  );
}
