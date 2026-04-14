import { ProveAttestation } from '@/components/blockchain/ProveAttestation';
import { ResearchHeader } from '@/components/research/shared';

export default function BlockchainProvePage() {
  return (
    <div className="w-full text-on-surface">
      <ResearchHeader
        title="Prove"
        description="Hash any document or message, sign it with a quantum-safe key (Dilithium or Falcon), and produce a verifiable proof bundle. Document Anchor creates a tamper-evident record; Verify lets anyone confirm the proof end-to-end."
      />
      <ProveAttestation />
    </div>
  );
}
