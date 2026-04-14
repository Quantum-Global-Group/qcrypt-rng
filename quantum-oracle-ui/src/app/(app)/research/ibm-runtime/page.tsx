'use client';

import { useCallback, useState } from 'react';
import { ResearchHeader, Panel, PanelHeader, PanelBody, MonoOut } from '@/components/research/shared';
import { BlockchainShorWorkflow } from '@/components/research/BlockchainShorWorkflow';

const API_ROOT = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v2';

type SdkResponse = {
  sdk_installed?: boolean;
  qiskit_ibm_runtime_version?: string | null;
};

export default function IBMRuntimePage() {
  const [apiKey, setApiKey] = useState('');
  const [instance, setInstance] = useState('');
  const [backendName, setBackendName] = useState('');
  const [preferSim, setPreferSim] = useState(true);
  const [shots, setShots] = useState(1024);

  const [sdk, setSdk] = useState<SdkResponse | null>(null);
  const [connectOut, setConnectOut] = useState<string>('');
  const [runOut, setRunOut] = useState<string>('');
  const [loading, setLoading] = useState<'idle' | 'sdk' | 'connect' | 'run'>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadSdk = useCallback(async () => {
    setLoading('sdk');
    setError(null);
    try {
      const r = await fetch(`${API_ROOT}/ibm-runtime/sdk`, { method: 'GET' });
      const j = (await r.json()) as SdkResponse & { detail?: string };
      if (!r.ok) throw new Error(j.detail ?? r.statusText);
      setSdk(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'SDK check failed');
      setSdk(null);
    } finally {
      setLoading('idle');
    }
  }, []);

  const runConnect = useCallback(async () => {
    setLoading('connect');
    setError(null);
    setConnectOut('');
    try {
      const r = await fetch(`${API_ROOT}/ibm-runtime/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, instance }),
      });
      const text = await r.text();
      let formatted = text;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* keep raw */
      }
      if (!r.ok) throw new Error(formatted);
      setConnectOut(formatted);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connect failed');
    } finally {
      setLoading('idle');
    }
  }, [apiKey, instance]);

  const runWorkflow = useCallback(async () => {
    setLoading('run');
    setError(null);
    setRunOut('');
    try {
      const r = await fetch(`${API_ROOT}/ibm-runtime/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          instance,
          backend_name: backendName.trim() || null,
          prefer_simulator: preferSim,
          shots,
        }),
      });
      const text = await r.text();
      let formatted = text;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* keep raw */
      }
      if (!r.ok) throw new Error(formatted);
      setRunOut(formatted);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed');
    } finally {
      setLoading('idle');
    }
  }, [apiKey, instance, backendName, preferSim, shots]);

  return (
    <div className="page-enter min-w-0 w-full space-y-6">
      <ResearchHeader
        eyebrow="Research · Intelligence"
        title="Quantum workflows"
        description="Run jobs on IBM Quantum Runtime with your API key and instance CRN, then scroll to the Shor × blockchain lab to walk through wallet creation, signing, and attack simulation — each path can emit a verifiable digest."
      />

      <nav
        className="-mt-2 mb-6 flex flex-wrap items-center gap-2 border-b border-outline-variant/15 pb-4"
        aria-label="On this page"
      >
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-outline">Jump</span>
        <a
          href="#ibm-runtime"
          className="rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 font-mono text-[11px] font-medium text-primary hover:bg-primary/15"
        >
          IBM Runtime
        </a>
        <a
          href="#shor-blockchain"
          className="rounded-md border border-secondary/30 bg-secondary/10 px-3 py-1.5 font-mono text-[11px] font-medium text-secondary hover:bg-secondary/15"
        >
          Shor × blockchain
        </a>
      </nav>

      <section id="ibm-runtime" className="scroll-mt-28 space-y-6">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">IBM Quantum Runtime</h2>
      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 font-mono text-[12px] text-error">
          {error}
        </div>
      )}

      <Panel>
        <PanelHeader
          title="SDK status"
          right={
            <button
              type="button"
              onClick={() => void loadSdk()}
              disabled={loading !== 'idle'}
              className="chip chip-info font-mono text-[10px] hover:bg-primary/20 disabled:opacity-50"
            >
              {loading === 'sdk' ? 'Checking…' : 'Check backend'}
            </button>
          }
        />
        <PanelBody className="space-y-2">
          {sdk ? (
            <p className="text-[13px] text-on-surface-variant">
              <span className="font-mono text-primary">{sdk.sdk_installed ? 'Installed' : 'Not installed'}</span>
              {sdk.qiskit_ibm_runtime_version && (
                <span className="text-outline"> — qiskit-ibm-runtime {sdk.qiskit_ibm_runtime_version}</span>
              )}
            </p>
          ) : (
            <p className="text-[13px] text-on-surface-variant">
              Check whether the API has <code className="font-mono text-[11px]">qiskit-ibm-runtime</code> installed.
            </p>
          )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title="IBM Cloud credentials" />
        <PanelBody className="space-y-4">
          <p className="text-[12px] text-on-surface-variant leading-relaxed">
            Use the <strong className="font-medium text-on-surface">ibm_cloud</strong> channel: IAM API key plus your
            Quantum Platform service instance CRN. Credentials are sent to your QCrypt API only for each request and are
            not stored by this UI. Use HTTPS in production.
          </p>
          <label className="block space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-outline">API key</span>
            <input
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-md border border-outline-variant/25 bg-surface-container-high/40 px-3 py-2 font-mono text-[12px] text-on-surface placeholder:text-outline focus:border-primary/50 focus:outline-none"
              placeholder="IBM Cloud IAM API key"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-outline">Instance CRN</span>
            <input
              type="text"
              autoComplete="off"
              value={instance}
              onChange={(e) => setInstance(e.target.value)}
              className="w-full rounded-md border border-outline-variant/25 bg-surface-container-high/40 px-3 py-2 font-mono text-[11px] text-on-surface placeholder:text-outline focus:border-primary/50 focus:outline-none"
              placeholder="crn:v1:bluemix:public:quantum-computing:..."
            />
          </label>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          title="Test connection"
          right={
            <button
              type="button"
              onClick={() => void runConnect()}
              disabled={loading !== 'idle' || !apiKey || !instance}
              className="chip chip-info font-mono text-[10px] hover:bg-primary/20 disabled:opacity-50"
            >
              {loading === 'connect' ? 'Connecting…' : 'List backends'}
            </button>
          }
        />
        <PanelBody>
          <MonoOut value={connectOut || undefined} placeholder="POST /api/v2/ibm-runtime/connect response" minHeight="120px" copyable />
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          title="Run Bell-state workflow (Sampler)"
          right={
            <button
              type="button"
              onClick={() => void runWorkflow()}
              disabled={loading !== 'idle' || !apiKey || !instance}
              className="chip chip-info font-mono text-[10px] hover:bg-secondary/30 disabled:opacity-50"
            >
              {loading === 'run' ? 'Running…' : 'Run on IBM Runtime'}
            </button>
          }
        />
        <PanelBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-outline">Backend (optional)</span>
              <input
                type="text"
                value={backendName}
                onChange={(e) => setBackendName(e.target.value)}
                className="w-full rounded-md border border-outline-variant/25 bg-surface-container-high/40 px-3 py-2 font-mono text-[11px] text-on-surface focus:border-primary/50 focus:outline-none"
                placeholder="Leave empty for least busy"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-outline">Shots</span>
              <input
                type="number"
                min={1}
                max={10000}
                value={shots}
                onChange={(e) => setShots(Number(e.target.value) || 1024)}
                className="w-full rounded-md border border-outline-variant/25 bg-surface-container-high/40 px-3 py-2 font-mono text-[11px] text-on-surface focus:border-primary/50 focus:outline-none"
              />
            </label>
          </div>
          <label className="flex cursor-pointer items-center gap-2 font-mono text-[11px] text-on-surface-variant">
            <input
              type="checkbox"
              checked={preferSim}
              onChange={(e) => setPreferSim(e.target.checked)}
              className="rounded border-outline-variant/40"
            />
            Prefer simulator backends (recommended for first runs)
          </label>
          <MonoOut value={runOut || undefined} placeholder="POST /api/v2/ibm-runtime/run — job id, counts, proof.digest_hex" minHeight="200px" copyable />
        </PanelBody>
      </Panel>
      </section>

      <section id="shor-blockchain" className="scroll-mt-28 space-y-6 border-t border-outline-variant/15 pt-10">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
          Shor × blockchain workflow
        </h2>
        <BlockchainShorWorkflow />
      </section>
    </div>
  );
}
