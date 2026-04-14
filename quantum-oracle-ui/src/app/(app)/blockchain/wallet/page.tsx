import { SmartWalletPage } from '@/components/blockchain/SmartWalletPage';
import { ResearchHeader } from '@/components/research/shared';

export default function BlockchainWalletPage() {
  return (
    <div className="w-full text-on-surface">
      <ResearchHeader
        title="Smart Wallet"
        description="Create classical (ECDSA) and quantum-safe (Dilithium) wallet profiles side by side, then run Shor's algorithm simulation to see exactly how many logical qubits it takes to break each key type."
      />
      <SmartWalletPage />
    </div>
  );
}
