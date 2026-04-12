'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Full-path titles for /research/* routes. */
const PAGE_TITLE: Record<string, string> = {
  '/research': 'Lab',
  '/research/qrng': 'QRNG Engine',
  '/research/entropy': 'Entropy analysis',
  '/research/vrf': 'VRF & commitment',
  '/research/notebook': 'Experiment log',
  '/research/datasets': 'Datasets export',
  '/research/refs': 'References',
  '/research/oracle': 'Oracle lab',
  '/research/pqc/kem': 'ML-KEM',
  '/research/pqc/hybrid': 'Hybrid PQC',
  '/research/pqc/signatures': 'Signature schemes',
  '/research/pqc/benchmarks': 'PQC benchmarks',
};

/** Section parent for the middle breadcrumb segment. */
function getSection(pathname: string): { label: string; href: string } {
  if (pathname.startsWith('/research/pqc')) return { label: 'PQC suite', href: '/pqc' };
  if (pathname.startsWith('/research/oracle')) return { label: 'Deliver', href: '/fulfillment' };
  if (pathname.startsWith('/research/notebook') || pathname.startsWith('/research/datasets') || pathname.startsWith('/research/refs'))
    return { label: 'Lab · Data', href: '/research/notebook' };
  return { label: 'Lab', href: '/research/qrng' };
}

/**
 * Breadcrumb bar for /research/* routes.
 * Ties research pages into the platform navigation hierarchy.
 */
export function LabZoneHeader() {
  const pathname = usePathname();
  if (!pathname.startsWith('/research')) return null;

  const title =
    PAGE_TITLE[pathname] ??
    (pathname
      .split('/')
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, ' ') ?? 'Lab');

  const section = getSection(pathname);

  return (
    <div className="-mx-5 border-b border-outline-variant/10 bg-surface-container-low px-5 py-2.5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
      <nav className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[11px]" aria-label="Context">
        <Link href="/dashboard" className="text-on-surface-variant transition-colors hover:text-primary">
          Home
        </Link>
        <span className="text-outline/40">/</span>
        <Link href={section.href} className="text-on-surface-variant transition-colors hover:text-primary">
          {section.label}
        </Link>
        <span className="text-outline/40">/</span>
        <span className="text-on-surface">{title}</span>
      </nav>
    </div>
  );
}
