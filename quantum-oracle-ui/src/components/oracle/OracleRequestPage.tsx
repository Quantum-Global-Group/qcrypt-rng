'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getQuantumEntropy, requestQuantumRandomness } from '@/utils/api';
import type { OracleRequestResponse } from '@/types';

const BIT_OPTIONS = [128, 256, 512, 1024, 2048, 4096];

export function OracleRequestPage() {
  const [bits, setBits] = useState(512);
  const [numQubits, setNumQubits] = useState(16);
  const [callbackGas, setCallbackGas] = useState(200000);
  const [commitmentRequired, setCommitmentRequired] = useState(true);
  const [targetChain, setTargetChain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OracleRequestResponse | null>(null);
  const [poolHealth, setPoolHealth] = useState<string | null>(null);

  useEffect(() => {
    getQuantumEntropy()
      .then((r) => setPoolHealth(r.data.health_status ?? 'OPTIMAL'))
      .catch(() => setPoolHealth(null));
  }, []);

  const numBytes = Math.max(1, Math.floor(bits / 8));

  const onExecute = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await requestQuantumRandomness({
        num_bytes: numBytes,
        num_qubits: numQubits,
        callback_gas_limit: callbackGas,
        commitment_required: commitmentRequired,
        ...(targetChain.trim() ? { target_chain: targetChain.trim() } : {}),
      });
      setResult(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-surface text-on-surface">
      <main className="flex w-full flex-col items-center justify-start overflow-y-auto py-8">
        <div className="w-full space-y-6">
          <div className="mb-8 flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">Configure request</h2>
            <p className="text-sm text-on-surface-variant">
              Configure entropy parameters for oracle fulfillment. Maps to <code className="font-mono text-xs text-primary">POST /oracle/request</code>.
            </p>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 space-y-6 lg:col-span-8">
              <div className="space-y-8 rounded-lg bg-surface-container-low p-6">
                <div className="space-y-4">
                  <label className="block text-[11px] font-medium uppercase tracking-[0.05em] text-outline">
                    01. Quantity (Bit Length)
                  </label>
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                    {BIT_OPTIONS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBits(b)}
                        className={`rounded border px-3 py-2 font-mono text-xs transition-colors ${
                          bits === b
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  <p className="font-mono text-[10px] text-outline">
                    → num_bytes = {numBytes} (derived from bits)
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block text-[11px] font-medium uppercase tracking-[0.05em] text-outline">
                    02. Quantum parameters
                  </label>
                  <div className="grid max-w-md gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] uppercase text-outline">num_qubits</label>
                      <input
                        type="number"
                        min={1}
                        max={64}
                        value={numQubits}
                        onChange={(e) => setNumQubits(Number(e.target.value))}
                        className="w-full rounded border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 font-mono text-sm text-on-surface focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase text-outline">callback_gas_limit</label>
                      <input
                        type="number"
                        min={100000}
                        max={5000000}
                        value={callbackGas}
                        onChange={(e) => setCallbackGas(Number(e.target.value))}
                        className="w-full rounded border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 font-mono text-sm text-on-surface focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[11px] font-medium uppercase tracking-[0.05em] text-outline">
                    03. Target chain (optional)
                  </label>
                  <input
                    value={targetChain}
                    onChange={(e) => setTargetChain(e.target.value)}
                    placeholder="e.g. ethereum"
                    className="max-w-md rounded border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-4 border-t border-outline-variant/10 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-[0.05em] text-on-surface">
                        Commitment required
                      </label>
                      <p className="text-xs text-outline">Publish Keccak commitment with the request.</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={commitmentRequired}
                      onClick={() => setCommitmentRequired((v) => !v)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        commitmentRequired ? 'bg-secondary-container' : 'bg-surface-container-high'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-on-background transition ${
                          commitmentRequired ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-error">{error}</p>}

                <div className="flex items-center justify-end gap-4 pt-4">
                  <Link href="/dashboard" className="text-xs font-medium uppercase tracking-widest text-outline hover:text-on-surface">
                    Discard
                  </Link>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={onExecute}
                    className="flex items-center gap-3 rounded-sm bg-primary-container px-8 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary-container transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    {loading ? 'Working…' : 'Execute generation'}
                  </button>
                </div>

                {result && (
                  <div className="rounded border border-outline-variant/10 bg-surface-container-lowest p-4 font-mono text-xs text-on-surface-variant">
                    <p className="mb-2 text-secondary">request_id: {result.request_id}</p>
                    <p>status: {result.status}</p>
                    {result.commitment != null && <p className="mt-2 break-all">commitment: {String(result.commitment)}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-12 space-y-6 lg:col-span-4">
              <div className="space-y-6 rounded-lg border border-outline-variant/10 bg-surface-container p-5">
                <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                  <span className="material-symbols-outlined text-lg text-primary">analytics</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Resource estimate</h3>
                </div>
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-outline">Latency (typical)</span>
                    <span className="font-mono text-secondary">24.5ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Bytes requested</span>
                    <span className="font-mono text-on-surface">{numBytes}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-outline-variant/10 bg-surface-container p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-outline">Live telemetry</h3>
                  <span className="flex h-2 w-2 rounded-full bg-secondary" />
                </div>
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-outline">ENTROPY POOL</span>
                  <span className="text-secondary">{poolHealth ?? '…'}</span>
                </div>
                <div className="flex h-1 gap-0.5 overflow-hidden rounded-full bg-surface-container-lowest">
                  <div className="h-full w-1/4 bg-secondary" />
                  <div className="h-full w-1/4 bg-secondary" />
                  <div className="h-full w-1/6 bg-secondary" />
                  <div className="h-full w-1/3 bg-surface-variant" />
                </div>
              </div>

              <div className="flex h-40 items-center justify-center rounded-lg border border-outline-variant/10 bg-surface-container-lowest">
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-4xl text-outline/30">hub</span>
                  <span className="font-mono text-[8px] uppercase tracking-widest text-outline">Circuit visualization</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-outline-variant/10 pt-6">
            <div className="flex gap-8">
              <div>
                <span className="mb-1 block text-[9px] uppercase tracking-widest text-outline">Active oracles</span>
                <span className="font-mono text-[11px] text-on-surface">14 nodes</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-outline">
              <span className="material-symbols-outlined text-xs">lock_clock</span>
              <span className="font-mono text-[10px]">PQC-ENABLED SESSION</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
