'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  BookMarked,
  BookOpen,
  Code2,
  Database,
  GitBranch,
  Route,
  ScrollText,
  Settings,
  Shield,
  Sparkles,
  Zap,
  Link2,
  Key,
  Cpu,
} from 'lucide-react';

/* ─── types ─────────────────────────────────────────────────────────────────── */

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  match: (path: string) => boolean;
};

type DomainSection = {
  id: string;
  title: string;
  dotColor: string;
  accentBar: string;
  accentIcon: string;
  items: NavItem[];
};

/* ─── domain nav structure ──────────────────────────────────────────────────── */

const DOMAINS: DomainSection[] = [
  {
    id: 'cryptography',
    title: 'Cryptography',
    dotColor: 'bg-primary',
    accentBar: 'bg-primary',
    accentIcon: 'text-primary',
    items: [
      { href: '/pqc', label: 'PQC Suite', Icon: Shield, match: (p) => p.startsWith('/pqc') || p.startsWith('/research/pqc') },
    ],
  },
  {
    id: 'randomness',
    title: 'Randomness',
    dotColor: 'bg-secondary',
    accentBar: 'bg-secondary',
    accentIcon: 'text-secondary',
    items: [
      { href: '/dashboard', label: 'Dashboard', Icon: Sparkles, match: (p) => p === '/dashboard' },
      { href: '/oracle/request', label: 'Generate', Icon: Zap, match: (p) => p.startsWith('/oracle') },
      { href: '/research/qrng', label: 'QRNG Engine', Icon: Key, match: (p) => p.startsWith('/research/qrng') },
      { href: '/research/entropy', label: 'Entropy Analysis', Icon: BarChart3, match: (p) => p.startsWith('/research/entropy') },
    ],
  },
  {
    id: 'blockchain',
    title: 'Blockchain',
    dotColor: 'bg-tertiary',
    accentBar: 'bg-tertiary',
    accentIcon: 'text-tertiary',
    items: [
      { href: '/fulfillment', label: 'Fulfillment', Icon: Route, match: (p) => p.startsWith('/fulfillment') },
      { href: '/research/vrf', label: 'VRF & Commitment', Icon: GitBranch, match: (p) => p.startsWith('/research/vrf') },
      { href: '/research/oracle', label: 'Oracle Lab', Icon: Link2, match: (p) => p.startsWith('/research/oracle') },
    ],
  },
  {
    id: 'intelligence',
    title: 'Intelligence',
    dotColor: 'bg-error',
    accentBar: 'bg-error',
    accentIcon: 'text-error',
    items: [
      { href: '/research/pqc/benchmarks', label: 'Benchmarks', Icon: Activity, match: (p) => p.startsWith('/research/pqc') },
      { href: '/research/notebook', label: 'Experiment Log', Icon: ScrollText, match: (p) => p.startsWith('/research/notebook') },
      { href: '/research/ibm-runtime', label: 'IBM Runtime', Icon: Cpu, match: (p) => p.startsWith('/research/ibm-runtime') },
      { href: '/research/datasets', label: 'Datasets', Icon: Database, match: (p) => p.startsWith('/research/datasets') },
      { href: '/research/refs', label: 'References', Icon: BookMarked, match: (p) => p.startsWith('/research/refs') },
    ],
  },
];

/* ─── sub-components ────────────────────────────────────────────────────────── */

function DomainHeader({ title, dotColor }: { title: string; dotColor: string }) {
  return (
    <div className="flex items-center gap-2 px-3 pb-1 pt-4 first:pt-2">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-outline">
        {title}
      </span>
      <span className="h-px flex-1 bg-outline-variant/15" />
    </div>
  );
}

function NavLink({
  href,
  label,
  Icon,
  active,
  accentBar,
  accentIcon,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  accentBar: string;
  accentIcon: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex min-w-0 items-center gap-2.5 rounded-md px-3 py-[7px] text-[12.5px] font-medium transition-colors ${
        active
          ? 'bg-surface-container text-on-surface'
          : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
      }`}
    >
      {active && (
        <span className={`absolute left-0 top-1/2 h-[18px] w-[2px] -translate-y-1/2 rounded-full ${accentBar}`} />
      )}
      <Icon
        className={`h-[15px] w-[15px] shrink-0 transition-colors ${
          active ? accentIcon : 'text-outline group-hover:text-on-surface-variant'
        }`}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="min-w-0 truncate leading-snug">{label}</span>
    </Link>
  );
}

/* ─── main export ───────────────────────────────────────────────────────────── */

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full max-h-full w-full min-w-0 flex-col overflow-hidden border-r border-outline-variant/10 bg-surface-container-low">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-outline-variant/10 px-4 py-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="font-headline text-[13px] font-semibold tracking-tight text-on-surface">QCrypt</span>
        <span className="ml-auto font-mono text-[9px] text-outline">v2.0</span>
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1.5 pb-4" aria-label="Primary">
        {DOMAINS.map((domain) => (
          <div key={domain.id}>
            <DomainHeader title={domain.title} dotColor={domain.dotColor} />
            <div className="space-y-0.5">
              {domain.items.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  Icon={item.Icon}
                  active={item.match(pathname)}
                  accentBar={domain.accentBar}
                  accentIcon={domain.accentIcon}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-outline-variant/10 bg-surface-container-low/95 px-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-sm">
        <NavLink href="/docs" label="Documentation" Icon={BookOpen} active={pathname.startsWith('/docs') && !pathname.startsWith('/docs/api')} accentBar="bg-outline" accentIcon="text-on-surface-variant" />
        <NavLink href="/docs/api" label="API Reference" Icon={Code2} active={pathname.startsWith('/docs/api')} accentBar="bg-outline" accentIcon="text-on-surface-variant" />
        <NavLink href="/settings" label="Settings" Icon={Settings} active={pathname === '/settings'} accentBar="bg-outline" accentIcon="text-on-surface-variant" />
      </div>
    </aside>
  );
}
