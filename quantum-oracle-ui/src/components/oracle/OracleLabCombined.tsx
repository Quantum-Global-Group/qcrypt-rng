'use client';

import { ResearchHeader } from '@/components/research/shared';
import { OracleProofInspector } from '@/components/oracle/OracleProofInspector';

export function OracleLabCombined() {
  return (
    <div className="page-enter min-w-0 w-full">
      <ResearchHeader
        eyebrow="Oracle · Proofs"
        title="Proof inspector"
        description="Look up an oracle request by ID, or verify a VRF proof from commitment, alpha, output, and seed."
      />
      <OracleProofInspector />
    </div>
  );
}
