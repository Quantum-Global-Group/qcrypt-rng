import { RandomizeFairness } from '@/components/blockchain/RandomizeFairness';
import { ResearchHeader } from '@/components/research/shared';

export default function BlockchainRandomizePage() {
  return (
    <div className="w-full text-on-surface">
      <ResearchHeader
        title="Randomize"
        description="Provably fair randomness with a full VRF proof for every outcome. Lottery draws, NFT trait distributions, and DAO committee selections all produce the same verifiable proof bundle — commitment, output, seed, and the exact Solidity verify() call."
      />
      <RandomizeFairness />
    </div>
  );
}
