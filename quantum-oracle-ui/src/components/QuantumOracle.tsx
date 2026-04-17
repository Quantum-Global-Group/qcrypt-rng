import { useEffect, useState } from 'react';
import { createBlockchainWallet, createVrfSeed, getOracleNetworkInfo, vrfProve, vrfReveal, vrfVerify } from '@/utils/api';
import { Badge, CopyButton, DataRows, InfoPopover, KVRow, MonoValue } from './ui';
import { ChainList } from './terminal/OnChainBadge';
import { RawView } from './terminal/RawView';

export const QuantumOracle = () => {
  const [walletType, setWalletType] = useState<'both' | 'vulnerable' | 'quantum-safe'>('both');
  const [walletResult, setWalletResult] = useState<Record<string, unknown> | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Supported chains
  const [supportedChains, setSupportedChains] = useState<string[]>([]);

  // VRF state
  const [vrfRequestId, setVrfRequestId] = useState<string | null>(null);
  const [vrfCommitment, setVrfCommitment] = useState<string | null>(null);
  const [vrfAlpha, setVrfAlpha] = useState('');
  const [vrfOutput, setVrfOutput] = useState<string | null>(null);
  const [vrfSeed, setVrfSeed] = useState<string | null>(null);
  const [vrfRevealed, setVrfRevealed] = useState(false);

  // VRF verify (standalone)
  const [verifyCommitment, setVerifyCommitment] = useState('');
  const [verifyAlpha, setVerifyAlpha] = useState('');
  const [verifyOutput, setVerifyOutput] = useState('');
  const [verifySeed, setVerifySeed] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; commitment_valid: boolean; output_valid: boolean } | null>(null);

  useEffect(() => {
    getOracleNetworkInfo()
      .then((res) => setSupportedChains(res.data.supported_chains ?? []))
      .catch(() => {});
  }, []);

  const handleCreateWallets = async () => {
    setError(null);
    setLoadingAction('wallets');
    try {
      const response = await createBlockchainWallet(walletType);
      setWalletResult(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create wallets');
    } finally {
      setLoadingAction(null);
    }
  };

  // VRF handlers
  const handleVrfSeed = async () => {
    setError(null);
    setVrfOutput(null);
    setVrfSeed(null);
    setVrfRevealed(false);
    setLoadingAction('vrf-seed');
    try {
      const response = await createVrfSeed();
      setVrfRequestId(response.data.request_id);
      setVrfCommitment(response.data.commitment);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'VRF seed creation failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleVrfProve = async () => {
    if (!vrfRequestId || !vrfAlpha) return;
    setError(null);
    setLoadingAction('vrf-prove');
    try {
      const response = await vrfProve(vrfRequestId, vrfAlpha);
      setVrfOutput(response.data.output);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'VRF prove failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleVrfReveal = async () => {
    if (!vrfRequestId) return;
    setError(null);
    setLoadingAction('vrf-reveal');
    try {
      const response = await vrfReveal(vrfRequestId);
      setVrfSeed(response.data.seed);
      setVrfRevealed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'VRF reveal failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleVrfVerify = async () => {
    setError(null);
    setVerifyResult(null);
    setLoadingAction('vrf-verify');
    try {
      const response = await vrfVerify({
        commitment: verifyCommitment,
        alpha: verifyAlpha,
        output: verifyOutput,
        seed: verifySeed,
      });
      setVerifyResult(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'VRF verification failed');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="error-banner">{error}</div>}

      {/* Supported Chains */}
      {supportedChains.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] uppercase tracking-[0.15em] text-[rgb(var(--fg-dim))]">
            oracle targets //
          </span>
          <ChainList chains={supportedChains} />
        </div>
      )}

      {/* Create Wallets */}
      <div className="section space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">Create Wallet Profiles <InfoPopover title="Create Wallet Profiles" description="Generate and compare classical (ECDSA) vs quantum-safe (DILITHIUM/KYBER) blockchain wallets to see the difference in key types and security properties." useCases={['Compare vulnerable and quantum-safe key sizes', 'Generate wallets for blockchain integration testing', 'Demonstrate post-quantum wallet migration']} /></h2>
        <p className="text-sm text-slate-400">
          Compare classical wallets with quantum-safe wallets that use post-quantum cryptography (DILITHIUM / KYBER). Quantum-safe keys protect long-term assets against future quantum attacks.
        </p>
        <div>
          <label className="label">Wallet Type</label>
          <select value={walletType} onChange={(e) => setWalletType(e.target.value as 'both' | 'vulnerable' | 'quantum-safe')} className="field">
            <option value="both">Both (vulnerable + quantum-safe)</option>
            <option value="vulnerable">Vulnerable only</option>
            <option value="quantum-safe">Quantum-safe only</option>
          </select>
        </div>
        <button onClick={handleCreateWallets} disabled={loadingAction === 'wallets'} className="w-full btn-primary">
          {loadingAction === 'wallets' ? 'Creating...' : 'Create Wallets'}
        </button>
        {walletResult && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.12em] text-[rgb(var(--fg-dim))]">
                wallet_details //
              </span>
              <CopyButton value={JSON.stringify(walletResult, null, 2)} label="copy json" />
            </div>
            <DataRows data={walletResult} />
            <RawView
              data={walletResult}
              endpoint="/oracle/blockchain/wallet"
              method="POST"
              body={{ wallet_type: walletType }}
              title="raw payload / curl"
            />
          </div>
        )}
      </div>

      {/* Quantum VRF */}
      <div className="border-t border-slate-700/40 pt-6">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">Quantum VRF <InfoPopover title="Quantum VRF" description="Verifiable random function backed by quantum-generated entropy. Uses a Keccak-256 commit-reveal scheme so randomness is provably fair and Ethereum-compatible." useCases={['Fair on-chain randomness for gaming and NFTs', 'Lottery and raffle systems', 'Validator selection in proof-of-stake']} /></h2>
        <p className="text-sm text-slate-400 mb-5">
          Verifiable random function backed by quantum-generated entropy. A quantum seed is committed (Keccak-256) before any output is produced, so randomness is both provably fair and tamper-proof.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generate Proof */}
          <div className="section space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">Generate VRF Proof <InfoPopover title="Generate VRF Proof" description="Three-step flow: create a quantum seed, compute a deterministic output for any input, then reveal the seed so third parties can verify the proof independently." useCases={['Create verifiable randomness for a specific round', 'Publish commitment before revealing result', 'Prove fairness to auditors']} /></h3>

            {/* Step 1: Create seed */}
            <button onClick={handleVrfSeed} disabled={loadingAction === 'vrf-seed'} className="w-full btn-primary">
              {loadingAction === 'vrf-seed' ? 'Creating Seed...' : 'Step 1: Create Quantum Seed'}
            </button>

            {vrfRequestId && (
              <div className="space-y-2 pt-2">
                <KVRow label="Request ID" value={vrfRequestId} mono />
                <MonoValue label="Commitment" value={vrfCommitment ?? ''} truncate={60} />
              </div>
            )}

            {/* Step 2: Prove */}
            {vrfRequestId && (
              <>
                <div>
                  <label className="label">Alpha (round ID / nonce)</label>
                  <input
                    type="text"
                    value={vrfAlpha}
                    onChange={(e) => setVrfAlpha(e.target.value)}
                    placeholder="e.g. round_42 or 0x1a2b..."
                    className="field"
                  />
                </div>
                <button
                  onClick={handleVrfProve}
                  disabled={!vrfAlpha || loadingAction === 'vrf-prove'}
                  className="w-full btn-primary"
                >
                  {loadingAction === 'vrf-prove' ? 'Computing...' : 'Step 2: Compute VRF Output'}
                </button>
              </>
            )}

            {vrfOutput && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">VRF Output</span>
                  <CopyButton value={vrfOutput} label="Copy" />
                </div>
                <MonoValue value={vrfOutput} truncate={60} />
                <KVRow label="Alpha" value={vrfAlpha} mono />
              </div>
            )}

            {/* Step 3: Reveal */}
            {vrfRequestId && vrfOutput && !vrfRevealed && (
              <button
                onClick={handleVrfReveal}
                disabled={loadingAction === 'vrf-reveal'}
                className="w-full btn-secondary"
              >
                {loadingAction === 'vrf-reveal' ? 'Revealing...' : 'Step 3: Reveal Seed'}
              </button>
            )}

            {vrfSeed && (
              <div className="space-y-2 pt-2 border-t border-[rgb(var(--border))]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.12em] text-[rgb(var(--fg-dim))]">
                    revealed_seed //
                  </span>
                  <CopyButton value={vrfSeed} label="copy" />
                </div>
                <MonoValue value={vrfSeed} truncate={60} />
                <p className="text-[11px] text-[rgb(var(--fg-dim))] font-mono">
                  verify: <span className="text-[rgb(var(--green))]">commitment == keccak256(seed)</span>{' '}
                  && <span className="text-[rgb(var(--green))]">output == keccak256(seed || alpha)</span>
                </p>
                <RawView
                  data={{ request_id: vrfRequestId, commitment: vrfCommitment, alpha: vrfAlpha, output: vrfOutput, seed: vrfSeed }}
                  endpoint="/oracle/vrf/reveal"
                  method="POST"
                  body={{ request_id: vrfRequestId }}
                  title="raw proof / curl"
                />
              </div>
            )}
          </div>

          {/* Verify Proof */}
          <div className="section space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">Verify VRF Proof <InfoPopover title="Verify VRF Proof" description="Independently verify a quantum VRF proof by checking that the commitment matches the seed hash and the output matches keccak256(seed || alpha)." useCases={['Audit randomness fairness', 'Third-party proof verification', 'On-chain verification simulation']} /></h3>
            <p className="text-xs text-slate-500">Paste values from a VRF proof (or use your own) to verify independently.</p>
            <div>
              <label className="label">Commitment</label>
              <input type="text" value={verifyCommitment} onChange={(e) => setVerifyCommitment(e.target.value)} placeholder="0x..." className="field" />
            </div>
            <div>
              <label className="label">Alpha</label>
              <input type="text" value={verifyAlpha} onChange={(e) => setVerifyAlpha(e.target.value)} placeholder="round_42" className="field" />
            </div>
            <div>
              <label className="label">Output</label>
              <input type="text" value={verifyOutput} onChange={(e) => setVerifyOutput(e.target.value)} placeholder="0x..." className="field" />
            </div>
            <div>
              <label className="label">Seed (hex)</label>
              <input type="text" value={verifySeed} onChange={(e) => setVerifySeed(e.target.value)} placeholder="abc123..." className="field" />
            </div>
            <button
              onClick={handleVrfVerify}
              disabled={!verifyCommitment || !verifyAlpha || !verifyOutput || !verifySeed || loadingAction === 'vrf-verify'}
              className="w-full btn-primary"
            >
              {loadingAction === 'vrf-verify' ? 'Verifying...' : 'Verify Proof'}
            </button>

            {verifyResult !== null && (
              <div className="space-y-2 pt-2 border-t border-[rgb(var(--border))]">
                <div className="flex items-center gap-3">
                  <Badge label={verifyResult.valid ? 'Valid' : 'Invalid'} />
                  <span className="text-sm text-[rgb(var(--fg))] font-mono">
                    {verifyResult.valid ? 'VRF proof valid ✓' : 'VRF proof invalid ✗'}
                  </span>
                </div>
                <KVRow label="Commitment check" value={verifyResult.commitment_valid ? 'Pass' : 'Fail'} />
                <KVRow label="Output check" value={verifyResult.output_valid ? 'Pass' : 'Fail'} />
                <RawView
                  data={verifyResult}
                  endpoint="/oracle/vrf/verify"
                  method="POST"
                  body={{ commitment: verifyCommitment, alpha: verifyAlpha, output: verifyOutput, seed: verifySeed }}
                  title="raw verdict / curl"
                />
              </div>
            )}
          </div>
        </div>

        {/* Education: Classical VRF vs Quantum-backed */}
        <div className="section space-y-3 mt-6">
          <h3 className="text-base font-semibold text-white">Classical VRF vs Quantum-Backed Randomness</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <span className="text-slate-300 font-medium block">Classical VRF (ECVRF / BLS)</span>
              <ul className="text-slate-400 space-y-1 list-disc list-inside">
                <li>Deterministic output from a private key</li>
                <li>Trust assumption: key holder is honest</li>
                <li>Vulnerable to quantum attacks (Shor)</li>
                <li>Proof tied to a long-lived secret key</li>
              </ul>
            </div>
            <div className="space-y-2">
              <span className="text-slate-300 font-medium block">Quantum-Backed VRF (QCrypt)</span>
              <ul className="text-slate-400 space-y-1 list-disc list-inside">
                <li>Seed from quantum hardware (true randomness)</li>
                <li>Keccak-256 commit-reveal (Ethereum-compatible)</li>
                <li>No long-lived secret: one-time quantum seed</li>
                <li>Verifiable by anyone once seed is revealed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
