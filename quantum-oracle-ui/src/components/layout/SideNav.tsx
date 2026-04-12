'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BookMarked,
  BookOpen,
  ChevronDown,
  Code2,
  Database,
  GitBranch,
  Route,
  ScrollText,
  Settings,
  Shield,
  Sparkles,
  Zap,
  Lock,
  Key,
} from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useUserMode } from '@/contexts/UserModeContext';

/* ─── types ─────────────────────────────────────────────────────────────────── */

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  match: (path: string) => boolean;
};

type SubLink = { href: string; label: string; match: (path: string) => boolean };

/* ─── sub-navigation arrays ─────────────────────────────────────────────────── */

/** Generate → Home subs */
const HOME_SUB: SubLink[] = [
  { href: '/dashboard', label: 'Overview', match: (p) => p === '/dashboard' },
  { href: '/oracle/request', label: 'Request randomness', match: (p) => p.startsWith('/oracle/request') },
];

/** Protect → PQC guided subs */
const PQC_GUIDED_SUB: SubLink[] = [
  { href: '/pqc', label: 'Workspace', match: (p) => p === '/pqc' || p === '/pqc/' },
  { href: '/pqc/keys', label: 'Key generation', match: (p) => p.startsWith('/pqc/keys') },
  { href: '/pqc/kem', label: 'Kyber KEM', match: (p) => p.startsWith('/pqc/kem') },
];

/** Protect → PQC research subs */
const PQC_LAB_SUB: SubLink[] = [
  { href: '/research/pqc/kem', label: 'ML-KEM', match: (p) => p.startsWith('/research/pqc/kem') },
  { href: '/research/pqc/signatures', label: 'Signature schemes', match: (p) => p.startsWith('/research/pqc/signatures') },
  { href: '/research/pqc/hybrid', label: 'Hybrid PQC', match: (p) => p.startsWith('/research/pqc/hybrid') },
  { href: '/research/pqc/benchmarks', label: 'PQC benchmarks', match: (p) => p.startsWith('/research/pqc/benchmarks') },
];

/** Deliver → Oracle lab sub */
const ORACLE_LAB_SUB: SubLink[] = [
  { href: '/research/oracle', label: 'Oracle lab', match: (p) => p.startsWith('/research/oracle') },
];

/* ─── match helpers ─────────────────────────────────────────────────────────── */

function matchHomeNav(path: string): boolean {
  return path === '/dashboard' || path === '/oracle' || path.startsWith('/oracle/');
}

function matchPqcSuite(path: string): boolean {
  return path.startsWith('/pqc') || path.startsWith('/research/pqc');
}

function matchDeliverSection(path: string): boolean {
  return path.startsWith('/fulfillment') || path.startsWith('/research/oracle');
}

/* ─── lab items (RNG/VRF + data only — no PQC or oracle) ───────────────────── */

const LAB_ITEMS: NavItem[] = [
  { href: '/research/qrng', label: 'QRNG Engine', Icon: Zap, match: (p) => p.startsWith('/research/qrng') },
  { href: '/research/entropy', label: 'Entropy analysis', Icon: BarChart3, match: (p) => p.startsWith('/research/entropy') },
  { href: '/research/vrf', label: 'VRF / commitment', Icon: GitBranch, match: (p) => p.startsWith('/research/vrf') },
  { href: '/research/notebook', label: 'Experiment log', Icon: ScrollText, match: (p) => p.startsWith('/research/notebook') },
  { href: '/research/datasets', label: 'Datasets export', Icon: Database, match: (p) => p.startsWith('/research/datasets') },
  { href: '/research/refs', label: 'References', Icon: BookMarked, match: (p) => p.startsWith('/research/refs') },
];

const LAB_GROUPS: { id: string; title: string; items: NavItem[] }[] = [
  { id: 'rng', title: 'RNG & VRF', items: LAB_ITEMS.slice(0, 3) },
  { id: 'data', title: 'Lab · Data', items: LAB_ITEMS.slice(3, 6) },
];

/* ─── top-level sections ────────────────────────────────────────────────────── */

const NAV_FLOW: { title: string; hint: string; items: NavItem[] }[] = [
  {
    title: 'Generate',
    hint: 'Entropy and RNG',
    items: [{ href: '/dashboard', label: 'Home', Icon: Sparkles, match: matchHomeNav }],
  },
  {
    title: 'Protect',
    hint: 'Post-quantum crypto',
    items: [{ href: '/pqc', label: 'PQC suite', Icon: Shield, match: matchPqcSuite }],
  },
  {
    title: 'Deliver',
    hint: 'On-chain randomness',
    items: [{ href: '/fulfillment', label: 'Fulfillment', Icon: Route, match: matchDeliverSection }],
  },
  {
    title: 'Lab',
    hint: 'Benchmarks & experiments',
    items: LAB_ITEMS,
  },
  {
    title: 'Learn',
    hint: 'Guides and API',
    items: [{ href: '/docs', label: 'Documentation', Icon: BookOpen, match: (p) => p.startsWith('/docs') }],
  },
];

/* ─── sub-components ────────────────────────────────────────────────────────── */

function SubLinkItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`block w-full rounded-md py-1.5 pl-3 text-xs font-medium transition-colors ${
        active ? 'bg-surface text-primary' : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {label}
    </Link>
  );
}

function LabNavLinks({ pathname }: { pathname: string }) {
  return (
    <div className="min-w-0 space-y-3">
      {LAB_GROUPS.map((group) => (
        <div key={group.id} className="min-w-0">
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-outline">{group.title}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.match(pathname);
              const Icon = item.Icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-surface text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <Icon
                    className={`h-[17px] w-[17px] shrink-0 ${active ? 'text-primary' : 'text-outline'}`}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <span className="min-w-0 leading-snug">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function LabSectionHeader() {
  return (
    <div className="px-2 pb-2">
      <div className="text-xs font-semibold text-on-surface">Lab</div>
      <div className="mt-0.5 text-[11px] text-on-surface-variant">Benchmarks & experiments</div>
    </div>
  );
}

/* ─── main export ───────────────────────────────────────────────────────────── */

export function SideNav() {
  const pathname = usePathname();

  const homeSection = matchHomeNav(pathname);
  const pqcSection = matchPqcSuite(pathname);
  const deliverSection = matchDeliverSection(pathname);
  const labActive = useMemo(() => LAB_ITEMS.some((i) => i.match(pathname)), [pathname]);

  const isLg = useMediaQuery('(min-width: 1024px)');
  const [mobileLabOpen, setMobileLabOpen] = useState(labActive);
  useEffect(() => { setMobileLabOpen(labActive); }, [labActive]);

  return (
    <aside className="flex h-full max-h-full w-full min-w-0 flex-col overflow-x-hidden overflow-y-hidden border-r border-outline-variant/10 bg-surface-container-low">
      {/* Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 pt-3" aria-label="Primary">
        <div className="flex flex-col gap-4">
          {NAV_FLOW.map((block) => {
            /* Lab section: special rendering with groups + collapsible on mobile */
            if (block.title === 'Lab') {
              return (
                <div key="lab" className="min-w-0">
                  {isLg ? (
                    <>
                      <LabSectionHeader />
                      <LabNavLinks pathname={pathname} />
                    </>
                  ) : (
                    <details
                      open={mobileLabOpen}
                      onToggle={(e) => setMobileLabOpen((e.target as HTMLDetailsElement).open)}
                      className="group min-w-0"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md px-2 py-2 text-left [&::-webkit-details-marker]:hidden">
                        <div>
                          <div className="text-xs font-semibold text-on-surface">Lab</div>
                          <div className="mt-0.5 text-[11px] text-on-surface-variant">Benchmarks & experiments</div>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 text-outline transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="mt-2 border-t border-outline-variant/10 pt-2">
                        <LabNavLinks pathname={pathname} />
                      </div>
                    </details>
                  )}
                </div>
              );
            }

            /* Standard sections: Generate / Protect / Deliver / Learn */
            return (
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
                        className={`flex min-w-0 items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
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
                        <span className="min-w-0 leading-snug">{item.label}</span>
                      </Link>

                      {/* Generate → Home subs */}
                      {item.href === '/dashboard' && homeSection && (
                        <div className="ml-2 mt-0.5 space-y-0.5 border-l border-outline-variant/30 py-1 pl-3">
                          {HOME_SUB.map((sub) => (
                            <SubLinkItem key={sub.href} href={sub.href} label={sub.label} active={sub.match(pathname)} />
                          ))}
                        </div>
                      )}

                      {/* Protect → PQC guided + lab subs */}
                      {item.href === '/pqc' && pqcSection && (
                        <div className="ml-2 mt-0.5 space-y-2 border-l border-outline-variant/30 py-1 pl-3">
                          <div>
                            <p className="mb-1 pl-0 text-[10px] font-semibold uppercase tracking-wider text-outline">Guided</p>
                            <div className="space-y-0.5">
                              {PQC_GUIDED_SUB.map((sub) => (
                                <SubLinkItem key={sub.href} href={sub.href} label={sub.label} active={sub.match(pathname)} />
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="mb-1 pl-0 text-[10px] font-semibold uppercase tracking-wider text-outline">Research</p>
                            <div className="space-y-0.5">
                              {PQC_LAB_SUB.map((sub) => (
                                <SubLinkItem key={sub.href} href={sub.href} label={sub.label} active={sub.match(pathname)} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Deliver → Oracle lab sub */}
                      {item.href === '/fulfillment' && deliverSection && (
                        <div className="ml-2 mt-0.5 space-y-0.5 border-l border-outline-variant/30 py-1 pl-3">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-outline">Oracle</p>
                          <div className="space-y-0.5">
                            {ORACLE_LAB_SUB.map((sub) => (
                              <SubLinkItem key={sub.href} href={sub.href} label={sub.label} active={sub.match(pathname)} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer links */}
      <div className="relative z-20 mt-auto shrink-0 border-t border-outline-variant/10 bg-surface-container-low/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-sm">
        <Link
          href="/settings"
          className={`flex min-w-0 items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
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
          className={`mt-0.5 flex min-w-0 items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
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
