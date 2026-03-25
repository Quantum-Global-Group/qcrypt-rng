'use client';

import { useCallback, useState } from 'react';
import {
  configureFulfillmentChain,
  createFulfillmentRequest,
  getFulfillmentStatus,
  retryFulfillment,
  type ConfigureFulfillmentChainParams,
} from '@/utils/api';

const CHAINS = ['ethereum', 'polygon', 'bsc', 'avalanche', 'fantom'];

type LogLine = { t: string; level: 'info' | 'ok' | 'warn' | 'action'; msg: string };

export function FulfillmentWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);

  const [chain, setChain] = useState('ethereum');
  const [rpcUrl, setRpcUrl] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('');
  const [chainId, setChainId] = useState(1);
  const [currency, setCurrency] = useState('ETH');
  const [contract, setContract] = useState('');
  const [numBytes, setNumBytes] = useState(32);
  const [numQubits, setNumQubits] = useState(16);
  const [asyncFulfillment, setAsyncFulfillment] = useState(true);
  const [relay, setRelay] = useState<'direct' | 'mempool'>('direct');
  const [fulfillmentStatus, setFulfillmentStatus] = useState<string | null>(null);

  const pushLog = useCallback((level: LogLine['level'], msg: string) => {
    const t = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-40), { t, level, msg }]);
  }, []);

  const handleConfigure = async () => {
    setError(null);
    setLoading('configure');
    try {
      const params: ConfigureFulfillmentChainParams = {
        chain,
        rpc_url: rpcUrl,
        private_key: privateKey,
        explorer_url: explorerUrl,
        chain_id: chainId,
        currency_symbol: currency,
      };
      await configureFulfillmentChain(params);
      pushLog('ok', `Chain configured: ${chain} (id ${chainId})`);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Configure failed');
      pushLog('warn', String(e));
    } finally {
      setLoading(null);
    }
  };

  const handleExecute = async () => {
    setError(null);
    setLoading('execute');
    try {
      const res = await createFulfillmentRequest({
        chain,
        contract_address: contract,
        num_bytes: numBytes,
        num_qubits: numQubits,
        async_fulfillment: asyncFulfillment,
      });
      const id = res.data.request_id;
      setRequestId(id);
      pushLog('ok', `Request created: ${id}`);
      pushLog('info', `Relay mode: ${relay} (UI only)`);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
      pushLog('warn', String(e));
    } finally {
      setLoading(null);
    }
  };

  const handlePollStatus = async () => {
    if (!requestId) return;
    setLoading('poll');
    try {
      const res = await getFulfillmentStatus(requestId);
      const st = res.data?.status ?? res.data?.fulfillment_status ?? 'unknown';
      setFulfillmentStatus(st);
      pushLog(st === 'fulfilled' ? 'ok' : 'info', `Status: ${st}`);
    } catch (e) {
      pushLog('warn', `Poll failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(null);
    }
  };

  const handleRetry = async () => {
    if (!requestId) return;
    setLoading('retry');
    try {
      await retryFulfillment(requestId);
      pushLog('action', `Retry submitted for ${requestId}`);
    } catch (e) {
      pushLog('warn', `Retry failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-0px)] flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <div className="technical-grid absolute inset-0 p-8 font-mono text-[10px] leading-relaxed">
          <p>DEBUG [14:22:01] INBOUND_HEX_PACKET: 0x4a2f88... [VERIFIED]</p>
          <p>INFO [14:22:04] QUANTUM_RELAY_INITIATED: SECTOR_7G</p>
          <p>TRACE [14:22:05] HASH_CONSENSUS_SYNC: 99.82%</p>
        </div>
      </div>

      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant/10 bg-background px-6">
        <div className="flex items-center gap-8">
          <span className="text-xl font-black tracking-widest text-on-surface">ORACLE_TERMINAL</span>
          <nav className="hidden items-center gap-6 md:flex">
            <span className="text-sm font-medium text-outline">Mainnet</span>
            <span className="text-sm font-bold text-primary">Testnet</span>
            <a href="/docs/api" className="text-sm font-medium text-outline hover:text-on-surface">
              Docs
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-2 text-outline">
          <span className="material-symbols-outlined p-2 text-[20px]">notifications</span>
          <span className="material-symbols-outlined p-2 text-[20px]">settings</span>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col gap-0 overflow-hidden lg:flex-row">
        <div className="w-full shrink-0 p-6 lg:w-96 lg:overflow-y-auto">
          <div className="flex flex-col gap-6 rounded-xl border border-outline-variant/10 bg-surface-container-highest/80 p-6 shadow-2xl backdrop-blur-xl">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-on-surface">
                <span className="material-symbols-outlined text-primary">tune</span>
                Config Wizard
              </h2>
              <div className="mt-3 h-px w-full bg-outline-variant/20" />
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Target Chain</label>
                <select
                  className="rounded border border-transparent bg-surface-container-lowest px-3 py-3 font-mono text-xs text-on-surface transition-all hover:border-outline-variant/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={chain}
                  onChange={(e) => setChain(e.target.value)}
                >
                  {CHAINS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-outline">RPC URL</label>
                <input
                  className="rounded border border-transparent bg-surface-container-lowest px-3 py-3 font-mono text-xs text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://..."
                  value={rpcUrl}
                  onChange={(e) => setRpcUrl(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Private key (local)</label>
                <input
                  type="password"
                  className="rounded border border-transparent bg-surface-container-lowest px-3 py-3 font-mono text-xs text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Chain ID</label>
                  <input
                    type="number"
                    className="rounded border border-transparent bg-surface-container-lowest px-3 py-3 font-mono text-xs"
                    value={chainId}
                    onChange={(e) => setChainId(Number(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Currency</label>
                  <input
                    className="rounded border border-transparent bg-surface-container-lowest px-3 py-3 font-mono text-xs"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Explorer URL</label>
                <input
                  className="rounded border border-transparent bg-surface-container-lowest px-3 py-3 font-mono text-xs"
                  placeholder="https://etherscan.io"
                  value={explorerUrl}
                  onChange={(e) => setExplorerUrl(e.target.value)}
                />
              </div>

              {step >= 2 && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Contract address</label>
                    <input
                      className="rounded border border-transparent bg-surface-container-lowest px-3 py-3 font-mono text-xs"
                      placeholder="0x..."
                      value={contract}
                      onChange={(e) => setContract(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Num bytes</label>
                      <input
                        type="number"
                        className="rounded bg-surface-container-lowest px-3 py-3 font-mono text-xs"
                        value={numBytes}
                        onChange={(e) => setNumBytes(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Qubits</label>
                      <input
                        type="number"
                        className="rounded bg-surface-container-lowest px-3 py-3 font-mono text-xs"
                        value={numQubits}
                        onChange={(e) => setNumQubits(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <input
                      type="checkbox"
                      checked={asyncFulfillment}
                      onChange={(e) => setAsyncFulfillment(e.target.checked)}
                    />
                    Async fulfillment
                  </label>
                </>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Protocol relay</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRelay('direct')}
                    className={`flex-1 rounded py-2 text-[10px] font-bold uppercase ${
                      relay === 'direct'
                        ? 'border border-primary bg-surface-container-high text-primary'
                        : 'bg-surface-container-low text-outline hover:text-on-surface'
                    }`}
                  >
                    Direct
                  </button>
                  <button
                    type="button"
                    onClick={() => setRelay('mempool')}
                    className={`flex-1 rounded py-2 text-[10px] font-bold uppercase ${
                      relay === 'mempool'
                        ? 'border border-primary bg-surface-container-high text-primary'
                        : 'bg-surface-container-low text-outline hover:text-on-surface'
                    }`}
                  >
                    Mempool
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-error">{error}</p>}

            {step === 1 && (
              <button
                type="button"
                disabled={loading != null}
                onClick={handleConfigure}
                className="mt-2 w-full rounded bg-primary py-4 text-sm font-black uppercase tracking-[0.2em] text-on-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              >
                {loading === 'configure' ? 'Configuring…' : 'Save chain configuration'}
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                disabled={loading != null || !contract}
                onClick={handleExecute}
                className="mt-2 w-full rounded bg-primary py-4 text-sm font-black uppercase tracking-[0.2em] text-on-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              >
                {loading === 'execute' ? 'Submitting…' : 'Execute fulfillment'}
              </button>
            )}

            {step === 3 && requestId && (
              <div className="space-y-3">
                <p className="font-mono text-xs text-secondary">
                  Request ID: <span className="text-primary">{requestId}</span>
                </p>
                {fulfillmentStatus && (
                  <p className="font-mono text-xs">
                    Status:{' '}
                    <span className={fulfillmentStatus === 'fulfilled' ? 'text-secondary' : 'text-tertiary'}>
                      {fulfillmentStatus}
                    </span>
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={loading != null}
                    onClick={handlePollStatus}
                    className="flex-1 rounded border border-outline-variant/20 bg-surface-container-high py-2.5 text-[10px] font-bold uppercase tracking-widest text-on-surface transition-all hover:bg-surface-container disabled:opacity-50"
                  >
                    {loading === 'poll' ? 'Polling...' : 'Check status'}
                  </button>
                  <button
                    type="button"
                    disabled={loading != null}
                    onClick={handleRetry}
                    className="flex-1 rounded border border-outline-variant/20 bg-surface-container-high py-2.5 text-[10px] font-bold uppercase tracking-widest text-on-surface transition-all hover:bg-surface-container disabled:opacity-50"
                  >
                    {loading === 'retry' ? 'Retrying...' : 'Retry'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3 rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-outline">Network Load</span>
              <span className="font-mono text-xs text-secondary">STABLE</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-surface-container-lowest">
              <div className="h-full w-2/3 bg-secondary" />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-outline">
              <span>REQ: 4.2k/s</span>
              <span>LAT: 12ms</span>
            </div>
          </div>
        </div>

        <div className="flex min-h-[320px] flex-1 flex-col gap-6 overflow-hidden p-6 lg:min-h-0">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-on-surface">Fulfillment — On-Chain Request Wizard (V3)</h1>
            <p className="font-mono text-xs text-outline">TERMINAL_INSTANCE: PID_9921 // Configure chain, then submit contract request.</p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/5 bg-surface-container-lowest">
            <div className="flex items-center justify-between border-b border-white/5 bg-surface-container-low p-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Live Execution Stream</span>
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-error/40" />
                <div className="h-2 w-2 rounded-full bg-tertiary/40" />
                <div className="h-2 w-2 rounded-full bg-secondary/40" />
              </div>
            </div>
            <div className="no-scrollbar flex-1 space-y-1.5 overflow-y-auto p-4 font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-outline">Awaiting actions…</p>
              ) : (
                logs.map((l, i) => (
                  <div key={`${l.t}-${i}`} className="flex gap-4">
                    <span className="text-outline/40">{l.t}</span>
                    <span
                      className={
                        l.level === 'ok'
                          ? 'font-bold text-secondary'
                          : l.level === 'warn'
                            ? 'text-error'
                            : l.level === 'action'
                              ? 'text-primary'
                              : 'text-outline'
                      }
                    >
                      [{l.level.toUpperCase()}]
                    </span>
                    <span className="text-on-surface">{l.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 flex h-8 shrink-0 items-center justify-between border-t border-white/5 bg-surface-container-lowest px-6 text-[9px] font-mono uppercase tracking-widest text-outline/60">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
            <span>System Online</span>
          </div>
          <span>Shard: 0xA19B2</span>
        </div>
        <span className="font-bold text-primary">Secure Session Verified</span>
      </footer>
    </div>
  );
}
