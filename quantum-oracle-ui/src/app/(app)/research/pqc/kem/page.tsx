import { KyberKemFlowPage } from '@/components/pqc/KyberKemFlowPage';
import { ResearchHeader } from '@/components/research/shared';

export default function ResearchPqcKemPage() {
  return (
    <div className="page-enter min-w-0 w-full">
      <ResearchHeader
        eyebrow="Post-quantum cryptography · Key encapsulation"
        title="Kyber / ML-KEM"
        description="Generate a lattice keypair, encapsulate to produce ciphertext and shared secret, then decapsulate with the secret key. Use this bench to validate agreement and to compare ML-KEM parameter sets before integration."
      />
      <KyberKemFlowPage researchLayout />
    </div>
  );
}
