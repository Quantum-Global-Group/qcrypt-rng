import { useEffect, useState } from 'react';
import {
  configureFulfillmentChain,
  createBlockchainWallet,
  createFulfillmentRequest,
  createVrfSeed,
  getFulfillmentChains,
  getFulfillmentStatus,
  getOracleNetworkInfo,
  listFulfillmentRequests,
  retryFulfillment,
  vrfProve,
  vrfReveal,
  vrfVerify,
} from '@/utils/api';
import type { ConfigureFulfillmentChainParams } from '@/utils/api';
import type { FulfillmentRequestItem, FulfillmentRequestStatus } from '@/types';
import { Badge, CopyButton, DataRows, InfoPopover, KVRow, MonoValue } from './ui';

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

  // On-chain fulfillment (collapsible, default closed)
  const [fulfillmentOpen, setFulfillmentOpen] = useState(false);
  const [fulfillmentConfigOpen, setFulfillmentConfigOpen] = useState(false);
  const [fulfillmentChain, setFulfillmentChain] = useState('ethereum');
  const [fulfillmentRpcUrl, setFulfillmentRpcUrl] = useState('');
  const [fulfillmentPrivateKey, setFulfillmentPrivateKey] = useState('');
  const [fulfillmentExplorerUrl, setFulfillmentExplorerUrl] = useState('');
  const [fulfillmentChainId, setFulfillmentChainId] = useState(1);
  const [fulfillmentCurrency, setFulfillmentCurrency] = useState('ETH');
  const [fulfillmentContract, setFulfillmentContract] = useState('');
  const [fulfillmentNumBytes, setFulfillmentNumBytes] = useState(32);
  const [fulfillmentNumQubits, setFulfillmentNumQubits] = useState(16);
  const [fulfillmentAsync, setFulfillmentAsync] = useState(true);
  const [fulfillmentRequestId, setFulfillmentRequestId] = useState('');
  const [fulfillmentStatusResult, setFulfillmentStatusResult] = useState<FulfillmentRequestStatus | null>(null);
  const [fulfillmentList, setFulfillmentList] = useState<FulfillmentRequestItem[]>([]);
  const [fulfillmentChains, setFulfillmentChains] = useState<unknown>(null);
  const [fulfillmentCreateResult, setFulfillmentCreateResult] = useState<{ request_id: string; fulfillment_status: string } | null>(null);

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

  // Fulfillment handlers
  const handleConfigureChain = async () => {
    setError(null);
    setLoadingAction('fulfill-config');
    try {
      const params: ConfigureFulfillmentChainParams = {
        chain: fulfillmentChain,
        rpc_url: fulfillmentRpcUrl,
        private_key: fulfillmentPrivateKey,
        explorer_url: fulfillmentExplorerUrl,
        chain_id: fulfillmentChainId,
        currency_symbol: fulfillmentCurrency,
      };
      await configureFulfillmentChain(params);
      setFulfillmentChains(await getFulfillmentChains());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chain configuration failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCreateFulfillmentRequest = async () => {
    if (!fulfillmentChain || !fulfillmentContract) return;
    setError(null);
    setFulfillmentCreateResult(null);
    setLoadingAction('fulfill-create');
    try {
      const response = await createFulfillmentRequest({
        chain: fulfillmentChain,
        contract_address: fulfillmentContract,
        num_bytes: fulfillmentNumBytes,
        num_qubits: fulfillmentNumQubits,
        async_fulfillment: fulfillmentAsync,
      });
      setFulfillmentCreateResult({ request_id: response.data.request_id, fulfillment_status: response.data.fulfillment_status });
      setFulfillmentRequestId(response.data.request_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create fulfillment request failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFulfillmentStatus = async () => {
    if (!fulfillmentRequestId.trim()) return;
    setError(null);
    setLoadingAction('fulfill-status');
    try {
      const response = await getFulfillmentStatus(fulfillmentRequestId.trim());
      setFulfillmentStatusResult(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status lookup failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleListFulfillmentRequests = async () => {
    setError(null);
    setLoadingAction('fulfill-list');
    try {
      const response = await listFulfillmentRequests();
      setFulfillmentList(response.data?.requests ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'List requests failed');
      setFulfillmentList([]);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRetryFulfillment = async (reqId: string) => {
    setError(null);
    setLoadingAction(`fulfill-retry-${reqId}`);
    try {
      await retryFulfillment(reqId);
      await handleListFulfillmentRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Retry failed');
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
          <span className="text-sm text-slate-400">Quantum oracle for:</span>
          {supportedChains.map((chain) => (
            <span key={chain} className="status-neutral text-xs">{chain}</span>
          ))}
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
              <span className="text-sm font-medium text-slate-300">Wallet Details</span>
              <CopyButton value={JSON.stringify(walletResult, null, 2)} label="Copy JSON" />
            </div>
            <DataRows data={walletResult} />
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
              <div className="space-y-2 pt-2 border-t border-slate-700/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Revealed Seed</span>
                  <CopyButton value={vrfSeed} label="Copy" />
                </div>
                <MonoValue value={vrfSeed} truncate={60} />
                <p className="text-xs text-slate-500">Anyone can now verify: commitment == keccak256(seed) and output == keccak256(seed || alpha).</p>
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
              <div className="space-y-2 pt-2 border-t border-slate-700/30">
                <div className="flex items-center gap-3">
                  <Badge label={verifyResult.valid ? 'Valid' : 'Invalid'} />
                  <span className="text-base text-slate-200">
                    {verifyResult.valid ? 'VRF proof is valid' : 'VRF proof verification failed'}
                  </span>
                </div>
                <KVRow label="Commitment check" value={verifyResult.commitment_valid ? 'Pass' : 'Fail'} />
                <KVRow label="Output check" value={verifyResult.output_valid ? 'Pass' : 'Fail'} />
              </div>
            )}
          </div>
        </div>

      {/* ── On-Chain Fulfillment ───────────────────────────────── */}
      <div className="border-t border-slate-700/40 pt-6">
        <button
          onClick={() => setFulfillmentOpen((o) => !o)}
          className="flex items-center gap-2 w-full text-left"
        >
          <span className="text-slate-500 text-xs shrink-0">{fulfillmentOpen ? '\u25BC' : '\u25B6'}</span>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">On-Chain Fulfillment <InfoPopover title="On-Chain Fulfillment" description="Submit quantum randomness requests to blockchain oracle contracts. Configure chain connection, create requests, and track commit-reveal fulfillment on Ethereum, Polygon, BSC, Avalanche, or Fantom." useCases={['Deploy oracle randomness to smart contracts', 'Track on-chain fulfillment status', 'Retry failed fulfillments']} /></h2>
        </button>
        {fulfillmentOpen && (
          <div className="space-y-6 pt-4">
            <p className="text-amber-400/90 text-sm font-medium">Demo only. Never use production keys. Private keys are sent to the API server.</p>

            {/* Configure Chain */}
            <div className="section space-y-3">
              <button onClick={() => setFulfillmentConfigOpen((o) => !o)} className="flex items-center gap-2 text-slate-300">
                <span className="text-xs">{fulfillmentConfigOpen ? '\u25BC' : '\u25B6'}</span>
                <h3 className="font-semibold">Configure Chain</h3>
              </button>
              {fulfillmentConfigOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Chain</label>
                    <select value={fulfillmentChain} onChange={(e) => setFulfillmentChain(e.target.value)} className="field">
                      <option value="ethereum">Ethereum</option>
                      <option value="polygon">Polygon</option>
                      <option value="bsc">BSC</option>
                      <option value="avalanche">Avalanche</option>
                      <option value="fantom">Fantom</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">RPC URL</label>
                    <input type="text" value={fulfillmentRpcUrl} onChange={(e) => setFulfillmentRpcUrl(e.target.value)} placeholder="https://..." className="field" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Private Key (masked)</label>
                    <input type="password" value={fulfillmentPrivateKey} onChange={(e) => setFulfillmentPrivateKey(e.target.value)} placeholder="0x..." className="field" />
                  </div>
                  <div>
                    <label className="label">Explorer URL</label>
                    <input type="text" value={fulfillmentExplorerUrl} onChange={(e) => setFulfillmentExplorerUrl(e.target.value)} placeholder="https://etherscan.io" className="field" />
                  </div>
                  <div>
                    <label className="label">Chain ID</label>
                    <input type="number" value={fulfillmentChainId} onChange={(e) => setFulfillmentChainId(Number(e.target.value))} className="field" />
                  </div>
                  <div>
                    <label className="label">Currency</label>
                    <input type="text" value={fulfillmentCurrency} onChange={(e) => setFulfillmentCurrency(e.target.value)} placeholder="ETH" className="field" />
                  </div>
                  <div className="md:col-span-2">
                    <button onClick={handleConfigureChain} disabled={!fulfillmentRpcUrl || !fulfillmentPrivateKey || loadingAction === 'fulfill-config'} className="btn-secondary">
                      {loadingAction === 'fulfill-config' ? 'Configuring...' : 'Configure Chain'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Create Request */}
            <div className="section space-y-3">
              <h3 className="font-semibold text-white">Create Request</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Chain</label>
                  <select value={fulfillmentChain} onChange={(e) => setFulfillmentChain(e.target.value)} className="field">
                    <option value="ethereum">Ethereum</option>
                    <option value="polygon">Polygon</option>
                    <option value="bsc">BSC</option>
                    <option value="avalanche">Avalanche</option>
                    <option value="fantom">Fantom</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Contract Address</label>
                  <input type="text" value={fulfillmentContract} onChange={(e) => setFulfillmentContract(e.target.value)} placeholder="0x..." className="field" />
                </div>
                <div>
                  <label className="label">Num Bytes</label>
                  <input type="number" value={fulfillmentNumBytes} onChange={(e) => setFulfillmentNumBytes(Number(e.target.value))} className="field" />
                </div>
                <div>
                  <label className="label">Num Qubits</label>
                  <input type="number" value={fulfillmentNumQubits} onChange={(e) => setFulfillmentNumQubits(Number(e.target.value))} className="field" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="fulfill-async" checked={fulfillmentAsync} onChange={(e) => setFulfillmentAsync(e.target.checked)} className="rounded" />
                  <label htmlFor="fulfill-async" className="text-sm text-slate-400">Async fulfillment</label>
                </div>
                <div>
                  <button onClick={handleCreateFulfillmentRequest} disabled={!fulfillmentContract || loadingAction === 'fulfill-create'} className="btn-primary">
                    {loadingAction === 'fulfill-create' ? 'Creating...' : 'Create Request'}
                  </button>
                </div>
              </div>
              {fulfillmentCreateResult && (
                <div className="space-y-1 pt-2">
                  <KVRow label="Request ID" value={fulfillmentCreateResult.request_id} mono />
                  <KVRow label="Status" value={fulfillmentCreateResult.fulfillment_status} />
                </div>
              )}
            </div>

            {/* Status Lookup */}
            <div className="section space-y-3">
              <h3 className="font-semibold text-white">Status Lookup</h3>
              <div className="flex gap-2 flex-wrap">
                <input type="text" value={fulfillmentRequestId} onChange={(e) => setFulfillmentRequestId(e.target.value)} placeholder="Request ID" className="field flex-1 min-w-[200px]" />
                <button onClick={handleFulfillmentStatus} disabled={!fulfillmentRequestId.trim() || loadingAction === 'fulfill-status'} className="btn-secondary">
                  {loadingAction === 'fulfill-status' ? 'Checking...' : 'Check Status'}
                </button>
              </div>
              {fulfillmentStatusResult && (
                <div className="space-y-2 pt-2">
                  <KVRow label="Status" value={fulfillmentStatusResult.status} />
                  {fulfillmentStatusResult.commitment_hash && <KVRow label="Commitment" value={fulfillmentStatusResult.commitment_hash} mono />}
                  {fulfillmentStatusResult.reveal_tx_hash && <KVRow label="Reveal TX" value={fulfillmentStatusResult.reveal_tx_hash} mono />}
                  {fulfillmentStatusResult.randomness && <MonoValue label="Randomness" value={fulfillmentStatusResult.randomness} truncate={60} />}
                  {fulfillmentStatusResult.explorer_url && (
                    <a href={fulfillmentStatusResult.explorer_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline text-sm">View on Explorer</a>
                  )}
                </div>
              )}
            </div>

            {/* List Requests */}
            <div className="section space-y-3">
              <h3 className="font-semibold text-white">All Requests</h3>
              <button onClick={handleListFulfillmentRequests} disabled={loadingAction === 'fulfill-list'} className="btn-secondary">
                {loadingAction === 'fulfill-list' ? 'Loading...' : 'List Requests'}
              </button>
              {fulfillmentList.length > 0 && (
                <div className="space-y-2">
                  {fulfillmentList.map((r) => (
                    <div key={r.request_id} className="flex items-center justify-between gap-3 p-2 rounded bg-slate-800/50">
                      <div>
                        <span className="text-slate-300 font-mono text-sm">{r.request_id}</span>
                        <span className="text-slate-500 text-xs ml-2">{r.chain}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge label={r.status} />
                        {r.status.toLowerCase() === 'failed' && (
                          <button onClick={() => handleRetryFulfillment(r.request_id)} disabled={loadingAction === `fulfill-retry-${r.request_id}`} className="btn-ghost text-xs">
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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
