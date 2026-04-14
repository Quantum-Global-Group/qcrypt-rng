import { PqcKeyGenerationPage } from '@/components/pqc/PqcKeyGenerationPage';
import { ResearchHeader } from '@/components/research/shared';

export default function PqcKeysRoute() {
  return (
    <div className="min-w-0 w-full">
      <ResearchHeader
        title="Key Generation"
        description="Generate export-ready post-quantum keypairs for signing and non-KEM use cases. Covers Dilithium (ML-DSA), Falcon (FN-DSA), SPHINCS+ (SLH-DSA), NTRU, and SABER — all seeded from quantum-sourced entropy. For Kyber key encapsulation, use the Key Exchange tab."
      />
      <PqcKeyGenerationPage hideHeader />
    </div>
  );
}
