'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BlockchainProvider } from '@/components/blockchain/BlockchainContext';
import { NetworkBar } from '@/components/blockchain/NetworkBar';
import { cn } from '@/lib/utils';

const PILLAR_LINKS = [
  { href: '/blockchain/prove', label: 'Prove' },
  { href: '/blockchain/protect', label: 'Protect' },
  { href: '/blockchain/randomize', label: 'Randomize' },
];

export default function BlockchainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const segment = pathname.replace(/^\/blockchain\/?/, '').split('/')[0] || 'index';

  return (
    <BlockchainProvider>
      <NetworkBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-10 font-mono">
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[rgb(var(--fg-dim))]">
            <span className="text-[rgb(var(--green))]">›</span>
            <span>blockchain</span>
            <span className="text-[rgb(var(--fg-dim))]">{'//'}</span>
            <span className="text-[rgb(var(--fg))]">{segment}</span>
          </div>
          <span className="hidden sm:inline text-[rgb(var(--fg-dim))]">│</span>
          <div className="flex items-center gap-1 flex-wrap">
            {PILLAR_LINKS.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-[2px] border transition-colors',
                    active
                      ? 'border-[rgb(var(--green))] text-[rgb(var(--green))]'
                      : 'border-transparent text-[rgb(var(--fg-dim))] hover:text-[rgb(var(--fg))]',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/scenarios"
              className="px-2 py-0.5 text-[10px] uppercase tracking-wider text-[rgb(var(--fg-dim))] hover:text-[rgb(var(--green))] transition-colors"
            >
              scenarios →
            </Link>
          </div>
        </div>
        {children}
      </div>
    </BlockchainProvider>
  );
}
