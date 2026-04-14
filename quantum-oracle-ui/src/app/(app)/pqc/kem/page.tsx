import { KyberKemFlowPage } from '@/components/pqc/KyberKemFlowPage';
import { ResearchHeader } from '@/components/research/shared';

export default function PqcKemRoute() {
  return (
    <div className="page-enter min-w-0 w-full">
      <ResearchHeader
        title="Key Exchange (ML-KEM)"
        description="Three-step Kyber key encapsulation: generate a lattice keypair, encapsulate to produce ciphertext and a shared secret, then decapsulate with the private key to verify agreement. Implements FIPS 203 (ML-KEM) with quantum-sourced entropy."
      />
      <KyberKemFlowPage researchLayout />
    </div>
  );
}
