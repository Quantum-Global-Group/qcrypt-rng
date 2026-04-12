'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ResearchHeader } from '@/components/research/shared';
import { OracleRequestPage } from '@/components/oracle/OracleRequestPage';
import { OracleProofInspector } from '@/components/oracle/OracleProofInspector';
import { cn } from '@/lib/utils';

type OracleTab = 'request' | 'proofs';

function tabFromSearchParams(sp: URLSearchParams | null): OracleTab {
  const t = sp?.get('tab');
  return t === 'proofs' ? 'proofs' : 'request';
}

export function OracleLabCombined() {
  const searchParams = useSearchParams();
  const tab = tabFromSearchParams(searchParams);

  return (
    <div className="page-enter min-w-0 w-full">
      <ResearchHeader
        eyebrow={tab === 'proofs' ? 'Oracle · Proofs' : 'Oracle · Lab'}
        title={tab === 'proofs' ? 'Proof inspector' : 'Oracle lab'}
        description={
          tab === 'proofs'
            ? 'Look up an oracle request by ID, or verify a VRF proof from commitment, alpha, output, and seed.'
            : 'Request quantum randomness for research and fulfillment workflows, or switch to the proof inspector to verify outputs.'
        }
      />

      <div
        className="mb-8 flex flex-wrap gap-1 rounded-lg border border-outline-variant/20 bg-surface-container-low p-1"
        role="tablist"
        aria-label="Oracle lab sections"
      >
        <Link
          href="/research/oracle"
          role="tab"
          aria-selected={tab === 'request'}
          className={cn(
            'min-w-[8rem] flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors',
            tab === 'request'
              ? 'bg-surface text-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          )}
        >
          Request
        </Link>
        <Link
          href="/research/oracle?tab=proofs"
          role="tab"
          aria-selected={tab === 'proofs'}
          className={cn(
            'min-w-[8rem] flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors',
            tab === 'proofs'
              ? 'bg-surface text-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          )}
        >
          Proof inspector
        </Link>
      </div>

      <div role="tabpanel" hidden={tab !== 'request'} className={tab === 'request' ? '' : 'hidden'}>
        <OracleRequestPage />
      </div>

      <div role="tabpanel" hidden={tab !== 'proofs'} className={tab === 'proofs' ? '' : 'hidden'}>
        <OracleProofInspector />
      </div>
    </div>
  );
}
