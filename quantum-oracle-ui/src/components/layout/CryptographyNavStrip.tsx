'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'Encrypt & Sign',  href: '/pqc',                      match: (p: string) => p === '/pqc' || p === '/pqc/' },
  { label: 'Key Generation',  href: '/pqc/keys',                  match: (p: string) => p.startsWith('/pqc/keys') },
  { label: 'Key Exchange',    href: '/pqc/kem',                   match: (p: string) => p.startsWith('/pqc/kem') || p.startsWith('/research/pqc/kem') },
  { label: 'Hybrid PQC',      href: '/research/pqc/hybrid',       match: (p: string) => p.startsWith('/research/pqc/hybrid') },
  { label: 'Benchmarks',      href: '/research/pqc/benchmarks',   match: (p: string) => p.startsWith('/research/pqc/benchmarks') },
];

function Tab({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`relative flex h-9 shrink-0 items-center whitespace-nowrap px-3 font-mono text-[10.5px] font-medium transition-colors ${
        active ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-primary" />
      )}
    </Link>
  );
}

export function CryptographyNavStrip() {
  const pathname = usePathname();

  return (
    <div className="sticky top-12 z-40 -mx-5 border-b border-outline-variant/10 bg-surface/95 backdrop-blur-sm sm:-mx-6 lg:-mx-8 xl:-mx-10">
      <div className="flex items-center overflow-x-auto px-5 sm:px-6 lg:px-8 xl:px-10">
        {TABS.map((t) => (
          <Tab key={t.href} label={t.label} href={t.href} active={t.match(pathname)} />
        ))}
      </div>
    </div>
  );
}
