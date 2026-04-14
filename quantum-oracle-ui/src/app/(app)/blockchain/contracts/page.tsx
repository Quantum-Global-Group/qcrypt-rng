import { SmartContractsPage } from '@/components/blockchain/SmartContractsPage';
import { ResearchHeader } from '@/components/research/shared';

export default function BlockchainContractsPage() {
  return (
    <div className="w-full text-on-surface">
      <ResearchHeader
        title="Smart Contracts"
        description="Deployed Solidity contracts that form QCrypt's on-chain layer. Integrate quantum randomness or PQC keys into your applications by targeting these contracts directly."
      />
      <SmartContractsPage />
    </div>
  );
}
