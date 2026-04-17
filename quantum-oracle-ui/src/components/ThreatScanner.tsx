import { useCallback, useMemo, useState } from 'react';
import {
  assessQuantumThreat,
  compareBlockchains,
  generatePQCKey,
  mineBlockchainBlock,
  runOracleBenchmark,
  simulateBlockchainAttack,
} from '@/utils/api';
import type { OracleBenchmarkResponse } from '@/types';
import { Badge, CopyButton, DataRows, DownloadButton, InfoPopover, KVRow, MonoValue } from './ui';

const ALGORITHMS = ['RSA-1024', 'RSA-2048', 'RSA-4096', 'ECDSA-256', 'ECDSA-384', 'KYBER-768'];

interface ThreatResult {
  algorithm: string;
  status: string;
  risk_level: string;
  time_to_break: string;
  recommendation: string;
  qubits_to_break: string | number;
}

const CollapsibleSection = ({
  title,
  defaultOpen = false,
  children,
  actions,
}: {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setOpen((p) => !p)} className="flex items-center gap-2 text-left flex-1 min-w-0">
          <span className="text-[rgb(var(--green))] font-mono text-xs shrink-0">{open ? '▼' : '▶'}</span>
          <h2 className="text-sm font-mono font-semibold uppercase tracking-[0.15em] text-[rgb(var(--green))] truncate">{title}</h2>
        </button>
        {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
      </div>
      {open && <div className="space-y-4 pt-4">{children}</div>}
    </div>
  );
};

export const ThreatScanner = () => {
  const [selected, setSelected] = useState<string[]>(['RSA-2048', 'ECDSA-256']);
  const [results, setResults] = useState<ThreatResult[]>([]);
  const [replacementKeys, setReplacementKeys] = useState<Record<string, string>>({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [benchmarkResult, setBenchmarkResult] = useState<OracleBenchmarkResponse['benchmark'] | null>(null);
  const [attackTarget, setAttackTarget] = useState<'RSA-2048' | 'ECDSA-256' | 'DILITHIUM3' | 'KYBER768'>('RSA-2048');
  const [attackResult, setAttackResult] = useState<Record<string, unknown> | null>(null);
  const [comparisonResult, setComparisonResult] = useState<Record<string, unknown> | null>(null);
  const [minerAddress, setMinerAddress] = useState('miner_001');
  const [mineResult, setMineResult] = useState<Record<string, unknown> | null>(null);

  const toggle = (algo: string) => {
    setSelected((prev) => (prev.includes(algo) ? prev.filter((x) => x !== algo) : [...prev, algo]));
  };

  const onScan = async () => {
    setError(null);
    setLoadingAction('scan');
    try {
      const responses = await Promise.all(selected.map((algo) => assessQuantumThreat(algo)));
      setResults(
        responses.map((r) => ({
          algorithm: r.data.algorithm,
          status: r.data.assessment.status,
          risk_level: r.data.assessment.risk_level,
          time_to_break: r.data.assessment.time_to_break,
          recommendation: r.data.assessment.recommendation,
          qubits_to_break: r.data.assessment.qubits_to_break,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const generateReplacement = async (algorithm: string) => {
    setError(null);
    setLoadingAction(`gen-${algorithm}`);
    try {
      const replacement = algorithm.startsWith('KYBER') ? 'KYBER768' : 'DILITHIUM3';
      const response = await generatePQCKey(replacement, 'base64');
      setReplacementKeys((prev) => ({
        ...prev,
        [algorithm]: JSON.stringify(response.data, null, 2),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate replacement');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRunBenchmark = async () => {
    setError(null);
    setLoadingAction('benchmark');
    try {
      const response = await runOracleBenchmark();
      setBenchmarkResult(response.data.benchmark);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run benchmark');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSimulateAttack = async () => {
    setError(null);
    setLoadingAction('attack');
    try {
      const response = await simulateBlockchainAttack(attackTarget, true);
      setAttackResult(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to simulate attack');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCompareBlockchains = async () => {
    setError(null);
    setLoadingAction('compare');
    try {
      const response = await compareBlockchains();
      setComparisonResult(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to compare blockchains');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleMineBlock = async () => {
    setError(null);
    setLoadingAction('mine');
    try {
      const response = await mineBlockchainBlock('both', minerAddress);
      setMineResult(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mine block');
    } finally {
      setLoadingAction(null);
    }
  };

  const summary = useMemo(() => {
    if (!results.length) return null;
    const high = results.filter((x) => x.risk_level.toUpperCase().includes('HIGH') || x.risk_level.toUpperCase().includes('CRITICAL')).length;
    const secure = results.filter((x) => x.status.toUpperCase().includes('SECURE')).length;
    return { high, secure, total: results.length };
  }, [results]);

  const fullReportJson = useCallback(
    () => JSON.stringify({ summary, results, timestamp: new Date().toISOString() }, null, 2),
    [summary, results],
  );

  return (
    <div className="space-y-6">
      {error && <div className="error-banner">{error}</div>}

      {/* ── Threat Scanner (always open) ──────────────────────── */}
      <div className="section space-y-4">
        <h2 className="text-sm font-mono font-semibold uppercase tracking-[0.15em] text-[rgb(var(--green))] flex items-center gap-2">Threat Scanner <InfoPopover title="Threat Scanner" description="Assess the quantum vulnerability of cryptographic algorithms in your stack. Select algorithms to scan, see risk levels, and generate quantum-safe replacements." useCases={['Audit cryptographic algorithm security', 'Plan quantum migration strategy', 'Generate PQC replacement keys']} /></h2>
        <p className="text-sm text-slate-400">Select the algorithms in your stack to scan for quantum vulnerability.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {ALGORITHMS.map((algo) => {
            const active = selected.includes(algo);
            return (
              <button
                key={algo}
                onClick={() => toggle(algo)}
                className={`text-base py-2.5 px-3 rounded-md border transition-colors ${
                  active
                    ? 'border-slate-400 bg-[rgb(40,50,68)] text-white'
                    : 'border-slate-700/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                {algo}
              </button>
            );
          })}
        </div>
        <button onClick={onScan} disabled={!selected.length || loadingAction === 'scan'} className="w-full btn-primary">
          {loadingAction === 'scan' ? 'Scanning...' : 'Run Quantum Threat Scan'}
        </button>
      </div>

      {/* ── Summary ──────────────────────────────────────────── */}
      {summary && (
        <div className="section">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-2xl font-mono font-bold text-[rgb(var(--green))]">{summary.high}</div>
                <div className="text-sm text-slate-400">High / Critical</div>
              </div>
              <div className="w-px h-10 bg-slate-700/40" />
              <div>
                <div className="text-2xl font-mono font-bold text-[rgb(var(--green))]">{summary.secure}</div>
                <div className="text-sm text-slate-400">Quantum Safe</div>
              </div>
              <div className="w-px h-10 bg-slate-700/40" />
              <div>
                <div className="text-2xl font-mono font-bold text-[rgb(var(--green))]">{summary.total}</div>
                <div className="text-sm text-slate-400">Scanned</div>
              </div>
            </div>
            <div className="flex gap-2">
              <CopyButton value={fullReportJson()} label="Copy Report" />
              <DownloadButton filename={`threat_report_${Date.now()}.json`} content={fullReportJson()} label="Download Report" />
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-3">{summary.total} algorithms scanned. {summary.high} at risk.</p>
        </div>
      )}

      {/* ── Scan Results ─────────────────────────────────────── */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((row) => (
            <div key={row.algorithm} className="section space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold text-[rgb(var(--green))] uppercase tracking-wider">{row.algorithm}</span>
                  <Badge label={row.risk_level} />
                  <Badge label={row.status} />
                </div>
                <button
                  onClick={() => generateReplacement(row.algorithm)}
                  disabled={loadingAction === `gen-${row.algorithm}`}
                  className="btn-secondary"
                >
                  {loadingAction === `gen-${row.algorithm}` ? 'Generating...' : 'Replace Key'}
                </button>
              </div>

              <KVRow label="Time to Break" value={row.time_to_break} />
              <KVRow label="Qubits Required" value={String(row.qubits_to_break)} />
              <KVRow label="Recommendation" value={row.recommendation} />

              {replacementKeys[row.algorithm] && (
                <div className="space-y-2 pt-2 border-t border-slate-700/30">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-300">Quantum-Safe Replacement</span>
                    <div className="flex gap-2">
                      <CopyButton value={replacementKeys[row.algorithm]} label="Copy Key" />
                      <DownloadButton
                        filename={`replacement_key_${row.algorithm}_${Date.now()}.json`}
                        content={replacementKeys[row.algorithm]}
                        label="Download"
                      />
                    </div>
                  </div>
                  <MonoValue value={replacementKeys[row.algorithm]} truncate={200} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Oracle Benchmark (collapsible) ────────────────────── */}
      <CollapsibleSection
        title={<span className="flex items-center gap-2">Oracle Benchmark <InfoPopover title="Oracle Benchmark" description="Measure quantum randomness generation and Keccak-256 commitment performance. Tests throughput, latency, and entropy quality." useCases={['Performance baseline measurement', 'Hardware vs simulation comparison', 'SLA validation']} /></span>}
        actions={
          <button onClick={handleRunBenchmark} disabled={loadingAction === 'benchmark'} className="btn-secondary">
            {loadingAction === 'benchmark' ? 'Running...' : 'Run Benchmark'}
          </button>
        }
      >
        {!benchmarkResult && (
          <p className="text-sm text-slate-400">Run a benchmark to measure oracle generation performance.</p>
        )}
        {benchmarkResult && (
          <div className="space-y-2">
            <div className="flex justify-end gap-2">
              <CopyButton value={JSON.stringify(benchmarkResult, null, 2)} label="Copy JSON" />
              <DownloadButton filename={`benchmark_${Date.now()}.json`} content={JSON.stringify(benchmarkResult, null, 2)} label="Download" />
            </div>
            <KVRow label="Samples Generated" value={benchmarkResult.samples_generated} />
            <KVRow label="Average Time" value={`${benchmarkResult.avg_generation_time_ms.toFixed(2)} ms`} />
            <KVRow label="Throughput" value={`${benchmarkResult.throughput_samples_per_sec} samples/sec`} />
            <KVRow label="Total Time" value={`${benchmarkResult.total_time_ms.toFixed(2)} ms`} />
            <KVRow label="Entropy per Sample" value={`${benchmarkResult.average_entropy_bits_per_sample} bits`} />
          </div>
        )}
      </CollapsibleSection>

      {/* ── Simulate Quantum Attack (collapsible) ─────────────── */}
      <CollapsibleSection title={<span className="flex items-center gap-2">Simulate Quantum Attack <InfoPopover title="Simulate Quantum Attack" description="Simulate Shor's algorithm attack on classical and post-quantum algorithms. See qubits required, estimated time to break, and vulnerability assessment." useCases={['Demonstrate quantum threat to RSA/ECDSA', 'Show PQC algorithm resilience', 'Security awareness training']} /></span>}>
        <div>
          <label className="label">Target Algorithm</label>
          <select value={attackTarget} onChange={(e) => setAttackTarget(e.target.value as 'RSA-2048' | 'ECDSA-256' | 'DILITHIUM3' | 'KYBER768')} className="field">
            <option value="RSA-2048">RSA-2048</option>
            <option value="ECDSA-256">ECDSA-256</option>
            <option value="DILITHIUM3">DILITHIUM3</option>
            <option value="KYBER768">KYBER768</option>
          </select>
        </div>
        <button onClick={handleSimulateAttack} disabled={loadingAction === 'attack'} className="w-full btn-danger">
          {loadingAction === 'attack' ? 'Running...' : 'Run Attack Simulation'}
        </button>
        {attackResult && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-300">Attack Results</span>
              <div className="flex gap-2">
                <CopyButton value={JSON.stringify(attackResult, null, 2)} label="Copy JSON" />
                <DownloadButton filename={`attack_sim_${attackTarget}_${Date.now()}.json`} content={JSON.stringify(attackResult, null, 2)} label="Download" />
              </div>
            </div>
            <DataRows data={attackResult} />
          </div>
        )}
      </CollapsibleSection>

      {/* ── Compare Blockchains (collapsible) ─────────────────── */}
      <CollapsibleSection title={<span className="flex items-center gap-2">Compare Blockchains <InfoPopover title="Compare Blockchains" description="Side-by-side comparison of vulnerable (ECDSA) vs quantum-safe (DILITHIUM) blockchain implementations including security properties and attack resistance." useCases={['Evaluate migration urgency', 'Compare signature performance', 'Security assessment reporting']} /></span>}>
        <p className="text-sm text-slate-400">Side-by-side comparison of vulnerable vs quantum-safe blockchain implementations.</p>
        <button onClick={handleCompareBlockchains} disabled={loadingAction === 'compare'} className="w-full btn-primary">
          {loadingAction === 'compare' ? 'Comparing...' : 'Compare Blockchains'}
        </button>
        {comparisonResult && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-300">Comparison</span>
              <div className="flex gap-2">
                <CopyButton value={JSON.stringify(comparisonResult, null, 2)} label="Copy JSON" />
                <DownloadButton filename={`blockchain_comparison_${Date.now()}.json`} content={JSON.stringify(comparisonResult, null, 2)} label="Download" />
              </div>
            </div>
            <DataRows data={comparisonResult} />
          </div>
        )}
      </CollapsibleSection>

      {/* ── Mine Demonstration Block (collapsible) ────────────── */}
      <CollapsibleSection title={<span className="flex items-center gap-2">Mine Demonstration Block <InfoPopover title="Mine Demonstration Block" description="Mine a block on both vulnerable and quantum-safe demo blockchains to see the difference in mining with classical vs post-quantum signatures." useCases={['Blockchain operation demonstration', 'Compare mining with different signature types', 'Educational proof-of-work demo']} /></span>}>
        <div>
          <label className="label">Miner Address</label>
          <input value={minerAddress} onChange={(e) => setMinerAddress(e.target.value)} placeholder="miner_001" className="field" />
        </div>
        <button onClick={handleMineBlock} disabled={loadingAction === 'mine'} className="w-full btn-primary">
          {loadingAction === 'mine' ? 'Mining...' : 'Mine Block'}
        </button>
        {mineResult && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-300">Block Details</span>
              <div className="flex gap-2">
                <CopyButton value={JSON.stringify(mineResult, null, 2)} label="Copy JSON" />
                <DownloadButton filename={`mined_block_${Date.now()}.json`} content={JSON.stringify(mineResult, null, 2)} label="Download" />
              </div>
            </div>
            <DataRows data={mineResult} />
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
};
