import { ProtectVault } from '@/components/blockchain/ProtectVault';
import { ResearchHeader } from '@/components/research/shared';

export default function BlockchainProtectPage() {
  return (
    <div className="w-full text-on-surface">
      <ResearchHeader
        eyebrow="Blockchain"
        title="Protect"
        description="Confidentiality and commitments you can audit. Encrypt & seal: AES with a QRNG-derived key, then a Dilithium signature on the ciphertext hash—plaintext is never included in the exported seal. Key escrow: register a SHA3-256 commitment to a public key for handoff, disclosure windows, or proving which key was registered when. The two tools below are independent; use both when a process needs sealed data and a published key fingerprint."
      />
      <ProtectVault />
    </div>
  );
}
