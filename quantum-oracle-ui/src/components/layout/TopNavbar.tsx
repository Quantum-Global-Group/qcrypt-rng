'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, Settings } from 'lucide-react';
import { checkHealth } from '@/utils/api';

/** Route → display title for the top navbar. */
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/oracle/request': 'Request Randomness',
  '/pqc': 'PQC Suite',
  '/pqc/keys': 'Key Generation',
  '/pqc/kem': 'Kyber KEM',
  '/fulfillment': 'Fulfillment',
  '/settings': 'Settings',
  '/docs': 'Documentation',
  '/docs/api': 'API Reference',
  '/research/qrng': 'QRNG Engine',
  '/research/entropy': 'Entropy Analysis',
  '/research/vrf': 'VRF & Commitment',
  '/research/notebook': 'Experiment Log',
  '/research/datasets': 'Datasets Export',
  '/research/refs': 'References',
  '/research/oracle': 'Oracle Lab',
  '/research/pqc/kem': 'ML-KEM',
  '/research/pqc/hybrid': 'Hybrid PQC',
  '/research/pqc/signatures': 'Signature Schemes',
  '/research/pqc/benchmarks': 'PQC Benchmarks',
};

/** Breadcrumb segment derived from section membership. */
function getBreadcrumb(pathname: string): { section: string; sectionHref: string } | null {
  if (pathname === '/dashboard') return null;
  if (pathname.startsWith('/oracle')) return { section: 'Generate', sectionHref: '/dashboard' };
  if (pathname.startsWith('/pqc') || pathname.startsWith('/research/pqc'))
    return { section: 'Protect', sectionHref: '/pqc' };
  if (pathname.startsWith('/fulfillment') || pathname.startsWith('/research/oracle'))
    return { section: 'Deliver', sectionHref: '/fulfillment' };
  if (
    pathname.startsWith('/research/qrng') ||
    pathname.startsWith('/research/entropy') ||
    pathname.startsWith('/research/vrf') ||
    pathname.startsWith('/research/notebook') ||
    pathname.startsWith('/research/datasets') ||
    pathname.startsWith('/research/refs')
  )
    return { section: 'Lab', sectionHref: '/research/qrng' };
  if (pathname.startsWith('/docs')) return { section: 'Learn', sectionHref: '/docs' };
  if (pathname === '/settings') return { section: 'Settings', sectionHref: '/settings' };
  return null;
}

export function TopNavbar() {
  const pathname = usePathname();
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    let a = true;
    checkHealth()
      .then(() => a && setApiOk(true))
      .catch(() => a && setApiOk(false));
    return () => { a = false; };
  }, []);

  const title =
    PAGE_TITLES[pathname] ??
    pathname
      .split('/')
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, ' ')
      ?.replace(/^\w/, (c) => c.toUpperCase()) ??
    'QCrypt';

  const crumb = getBreadcrumb(pathname);

  return (
    <header className="sticky top-0 z-50 flex h-12 w-full min-w-0 items-center justify-between border-b border-outline-variant/10 bg-surface-container-low/95 px-4 backdrop-blur-sm sm:px-6">
      {/* Left: branding + breadcrumb + title */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Logo mark */}
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2" aria-label="Home">
          <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,212,168,0.4)]" />
          <span className="hidden font-headline text-xs font-semibold tracking-tight text-on-surface sm:inline">
            QCrypt
          </span>
        </Link>

        <span className="hidden h-4 w-px bg-outline-variant/30 sm:block" aria-hidden />

        {/* Breadcrumb */}
        <nav className="flex min-w-0 items-center gap-1.5 font-mono text-[11px]" aria-label="Breadcrumb">
          {crumb && (
            <>
              <Link href={crumb.sectionHref} className="shrink-0 text-on-surface-variant transition-colors hover:text-primary">
                {crumb.section}
              </Link>
              <span className="text-outline/40">/</span>
            </>
          )}
          <span className="min-w-0 truncate text-on-surface font-medium">{title}</span>
        </nav>
      </div>

      {/* Right: status + actions */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 text-[10px] font-medium text-on-surface-variant sm:flex">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/20 bg-surface-container px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" aria-hidden />
            NODE_01
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/20 bg-surface-container px-2 py-0.5">
            <span className={`h-1.5 w-1.5 rounded-full ${apiOk ? 'bg-secondary' : apiOk === false ? 'bg-error' : 'bg-outline'}`} aria-hidden />
            {apiOk == null ? 'API …' : apiOk ? 'Connected' : 'Offline'}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <span className="inline-flex rounded-md p-1.5 text-outline" title="Live operations" aria-hidden>
            <Activity className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <Link
            href="/settings"
            className="inline-flex rounded-md p-1.5 text-outline transition-colors hover:bg-surface-container hover:text-on-surface"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </header>
  );
}
