'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { checkHealth } from '@/utils/api';

/* ─── nav data ──────────────────────────────────────────────────────────────── */

type NavItem = { label: string; desc: string; href: string; badge?: string };
type NavGroup = { title?: string; items: NavItem[] };

type Domain = {
  id: string;
  label: string;
  href: string;
  dot: string;
  activeText: string;
  bar: string;
  match: (p: string) => boolean;
  groups: NavGroup[];
};

const DOMAINS: Domain[] = [
  {
    id: 'cryptography',
    label: 'Cryptography',
    href: '/pqc',
    dot: 'bg-primary',
    activeText: 'text-primary',
    bar: 'bg-primary',
    match: (p) => p.startsWith('/pqc') || p.startsWith('/research/pqc'),
    groups: [
      {
        items: [
          { label: 'Encrypt & Sign',  desc: 'AES-GCM, HMAC, PQC signatures',      href: '/pqc' },
          { label: 'Key Generation',  desc: 'Dilithium · Falcon · SLH-DSA keys',  href: '/pqc/keys' },
          { label: 'Key Exchange',    desc: 'ML-KEM / Kyber encapsulation',        href: '/pqc/kem' },
          { label: 'Hybrid PQC',      desc: 'Classical + post-quantum schemes',    href: '/research/pqc/hybrid' },
          { label: 'Benchmarks',      desc: 'Algorithm latency & throughput',      href: '/research/pqc/benchmarks' },
        ],
      },
    ],
  },
  {
    id: 'randomness',
    label: 'Randomness',
    href: '/oracle/request',
    dot: 'bg-secondary',
    activeText: 'text-secondary',
    bar: 'bg-secondary',
    match: (p) =>
      p.startsWith('/oracle') ||
      p.startsWith('/research/qrng') ||
      p.startsWith('/research/entropy'),
    groups: [
      {
        items: [
          { label: 'Generate',         desc: 'Quantum bytes, keys & tokens',     href: '/oracle/request' },
          { label: 'QRNG Engine',      desc: 'Configure quantum RNG circuits',   href: '/research/qrng' },
          { label: 'Entropy Analysis', desc: 'NIST SP 800-90B test suite',       href: '/research/entropy' },
        ],
      },
    ],
  },
  {
    id: 'blockchain',
    label: 'Blockchain',
    href: '/blockchain/prove',
    dot: 'bg-tertiary',
    activeText: 'text-tertiary',
    bar: 'bg-tertiary',
    match: (p) =>
      p.startsWith('/blockchain') ||
      p.startsWith('/fulfillment') ||
      p.startsWith('/research/oracle'),
    groups: [
      {
        items: [
          { label: 'Prove',      desc: 'Document anchor · attestation · verify',         href: '/blockchain/prove' },
          { label: 'Protect',    desc: 'Encrypt & seal with PQC-signed proof bundle',     href: '/blockchain/protect' },
          { label: 'Randomize',  desc: 'Verifiable fairness · VRF proofs · on-chain',     href: '/blockchain/randomize' },
        ],
      },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    href: '/research/notebook',
    dot: 'bg-error',
    activeText: 'text-error',
    bar: 'bg-error',
    match: (p) =>
      p.startsWith('/research/notebook') ||
      p.startsWith('/research/ibm-runtime') ||
      p.startsWith('/research/datasets') ||
      p.startsWith('/research/refs'),
    groups: [
      {
        items: [
          { label: 'Experiment Log', desc: 'Session audit trail & citations', href: '/research/notebook' },
          { label: 'IBM Runtime',    desc: 'IBM Cloud API key · CRN · proven jobs', href: '/research/ibm-runtime' },
          { label: 'Datasets',       desc: 'Export JSON / NDJSON research data', href: '/research/datasets' },
          { label: 'References',     desc: 'NIST standards & academic papers',   href: '/research/refs' },
        ],
      },
    ],
  },
];

/* ─── dropdown panel ────────────────────────────────────────────────────────── */

function DropdownPanel({
  domain,
  pathname,
}: {
  domain: Domain;
  pathname: string;
}) {
  return (
    <div className="absolute left-0 top-full z-50 pt-px">
      <div className="min-w-[220px] overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-low shadow-xl shadow-black/40">
        {domain.groups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'border-t border-outline-variant/10' : ''}>
            {group.title && (
              <div className="px-3 pb-1 pt-2.5">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-outline">
                  {group.title}
                </span>
              </div>
            )}
            <div className="space-y-px p-1.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-start justify-between gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-surface-container ${
                      active ? 'bg-surface-container/70' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className={`font-mono text-[11px] font-semibold leading-tight ${active ? domain.activeText : 'text-on-surface'}`}>
                        {item.label}
                      </div>
                      <div className="mt-0.5 font-mono text-[9px] leading-snug text-outline">
                        {item.desc}
                      </div>
                    </div>
                    {item.badge && (
                      <span className="chip chip-simulated shrink-0 self-start">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── main component ────────────────────────────────────────────────────────── */

export function TopNavbar() {
  const pathname = usePathname();
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let a = true;
    checkHealth().then(() => a && setApiOk(true)).catch(() => a && setApiOk(false));
    return () => { a = false; };
  }, []);

  // Close dropdown on route change
  useEffect(() => { setOpen(null); }, [pathname]);

  return (
    <header
      className="sticky top-0 z-50 flex h-12 w-full min-w-0 items-center border-b border-outline-variant/10 bg-surface-container-low/95 px-5 backdrop-blur-sm sm:px-7"
      onMouseLeave={() => setOpen(null)}
    >
      {/* Brand */}
      <Link
        href="/dashboard"
        className="flex shrink-0 items-center gap-2.5 pr-6 border-r border-outline-variant/15 mr-1"
        onClick={() => setOpen(null)}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="font-headline text-[13px] font-semibold tracking-tight text-on-surface">
          QCrypt
        </span>
        <span className="font-mono text-[9px] text-outline/60">v2.0</span>
      </Link>

      {/* Domain nav — gap + Docs separator so labels never visually merge */}
      <nav
        className="flex h-full min-w-0 flex-1 items-center gap-x-1 sm:gap-x-3"
        aria-label="Main navigation"
      >
        {DOMAINS.map((domain) => {
          const active = domain.match(pathname);
          const isOpen = open === domain.id;
          return (
            <div
              key={domain.id}
              className="relative flex h-full shrink-0 items-center"
              onMouseEnter={() => setOpen(domain.id)}
            >
              <Link
                href={domain.href}
                className={`relative flex h-full items-center gap-2.5 px-3 sm:px-4 font-mono text-[11px] font-medium tracking-wide transition-colors ${
                  active ? domain.activeText : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="whitespace-nowrap">{domain.label}</span>
                <span
                  className={`h-[5px] w-[5px] shrink-0 rounded-full transition-colors ${
                    active ? domain.dot : 'bg-outline/25'
                  }`}
                  aria-hidden
                />
                {active && (
                  <span
                    className={`absolute bottom-0 left-2 right-2 sm:left-3 sm:right-3 h-[2px] rounded-full ${domain.bar}`}
                  />
                )}
              </Link>

              {isOpen && <DropdownPanel domain={domain} pathname={pathname} />}
            </div>
          );
        })}

        <Link
          href="/docs"
          onMouseEnter={() => setOpen(null)}
          className={`relative flex h-full shrink-0 items-center gap-2 border-l border-outline-variant/20 pl-4 sm:pl-5 ml-1 sm:ml-2 font-mono text-[11px] font-medium tracking-wide transition-colors ${
            pathname.startsWith('/docs')
              ? 'text-on-surface'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="whitespace-nowrap">Docs</span>
          {pathname.startsWith('/docs') && (
            <span className="absolute bottom-0 left-3 right-2 h-[2px] rounded-full bg-outline/60" />
          )}
        </Link>
      </nav>

      {/* Utilities */}
      <div className="flex shrink-0 items-center gap-3 pl-4">
        <div className="hidden items-center gap-1.5 font-mono text-[10px] text-on-surface-variant sm:flex">
          <span
            className={`h-[5px] w-[5px] shrink-0 rounded-full ${
              apiOk ? 'bg-primary' : apiOk === false ? 'bg-error' : 'bg-outline/50'
            }`}
          />
          {apiOk == null ? 'Connecting' : apiOk ? 'Online' : 'Offline'}
        </div>
        <Link
          href="/settings"
          className="inline-flex rounded-md p-1.5 text-outline transition-colors hover:bg-surface-container hover:text-on-surface"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>
    </header>
  );
}
