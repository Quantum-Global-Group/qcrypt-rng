'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const RNG_TABS = [
  { href: '/research/qrng',    label: 'QRNG Engine' },
  { href: '/research/entropy', label: 'Entropy Analysis' },
  { href: '/research/vrf',     label: 'VRF / Commitment' },
];

const DATA_TABS = [
  { href: '/research/notebook',  label: 'Experiment Log' },
  { href: '/research/ibm-runtime', label: 'IBM Runtime' },
  { href: '/research/datasets',  label: 'Datasets' },
  { href: '/research/refs',      label: 'References' },
];

const PQC_TABS = [
  { href: '/research/pqc/kem',        label: 'ML-KEM' },
  { href: '/research/pqc/signatures', label: 'Signatures' },
  { href: '/research/pqc/hybrid',     label: 'Hybrid PQC' },
  { href: '/research/pqc/benchmarks', label: 'Benchmarks' },
];

const ORACLE_TABS = [
  { href: '/research/oracle',         label: 'Oracle Lab' },
  { href: '/research/oracle/proofs',  label: 'Proofs' },
  { href: '/research/oracle/request', label: 'Request' },
];

/** Full-path titles for /research/* routes. */
const PAGE_TITLE: Record<string, string> = {
  '/research':                    'Lab',
  '/research/qrng':               'QRNG Engine',
  '/research/entropy':            'Entropy Analysis',
  '/research/vrf':                'VRF & Commitment',
  '/research/notebook':           'Experiment Log',
  '/research/ibm-runtime':        'Quantum workflows',
  '/research/datasets':           'Datasets',
  '/research/refs':               'References',
  '/research/oracle':             'Oracle Lab',
  '/research/pqc/kem':            'ML-KEM',
  '/research/pqc/hybrid':         'Hybrid PQC',
  '/research/pqc/signatures':     'Signature Schemes',
  '/research/pqc/benchmarks':     'PQC Benchmarks',
};

function getSection(pathname: string): { label: string; href: string; tabs: typeof RNG_TABS } {
  if (pathname.startsWith('/research/pqc'))
    return { label: 'Cryptography', href: '/pqc', tabs: PQC_TABS };
  if (pathname.startsWith('/research/oracle'))
    return { label: 'Blockchain', href: '/fulfillment', tabs: ORACLE_TABS };
  if (
    pathname.startsWith('/research/notebook') ||
    pathname.startsWith('/research/ibm-runtime') ||
    pathname.startsWith('/research/datasets') ||
    pathname.startsWith('/research/refs')
  )
    return { label: 'Intelligence', href: '/research/notebook', tabs: DATA_TABS };
  return { label: 'Randomness', href: '/research/qrng', tabs: RNG_TABS };
}

export function LabZoneHeader() {
  const pathname = usePathname();
  if (!pathname.startsWith('/research')) return null;

  const title =
    PAGE_TITLE[pathname] ??
    pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') ??
    'Lab';

  const section = getSection(pathname);

  return (
    <div className="-mx-5 border-b border-outline-variant/10 bg-surface-container-low sm:-mx-6 lg:-mx-8 xl:-mx-10">
      {/* Breadcrumb row */}
      <div className="flex items-center gap-1.5 border-b border-outline-variant/10 px-5 py-2 sm:px-6 lg:px-8 xl:px-10">
        <nav className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[10px]" aria-label="Context">
          <Link href="/dashboard" className="text-on-surface-variant transition-colors hover:text-primary">
            Home
          </Link>
          <span className="text-outline/40">/</span>
          <Link href={section.href} className="text-on-surface-variant transition-colors hover:text-primary">
            {section.label}
          </Link>
          <span className="text-outline/40">/</span>
          <span className="font-medium text-on-surface">{title}</span>
        </nav>
      </div>

      {/* Tab strip */}
      <nav
        className="flex items-center gap-0.5 overflow-x-auto px-4 sm:px-5 lg:px-7 xl:px-9"
        aria-label="Lab section tabs"
      >
        {section.tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative whitespace-nowrap px-3 py-2.5 font-mono text-[11px] font-medium transition-colors ${
                active
                  ? 'text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
