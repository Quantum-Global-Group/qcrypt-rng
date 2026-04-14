import Link from 'next/link';
import { ResearchHeader, Panel, PanelHeader, PanelBody, GhostButton } from '@/components/research/shared';

const EXPORT_FORMATS = [
  {
    format: 'JSON',
    ext: '.json',
    desc: 'Full structured session log with all metadata, timestamps, parameters, and outputs per operation.',
    use: 'Data analysis, audit trails, integration with external tooling.',
  },
  {
    format: 'NDJSON',
    ext: '.ndjson',
    desc: 'Newline-delimited JSON — one record per line. Streamable and suitable for large log files.',
    use: 'Log ingestion pipelines, BigQuery, Elasticsearch, Splunk.',
  },
];

const API_ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v2/generate/bytes',
    desc: 'Pull raw quantum-random bytes in hex, base64, or array format.',
  },
  {
    method: 'GET',
    path: '/api/v2/quantum/stats',
    desc: 'Real-time entropy pool stats: Shannon entropy, min-entropy, sample counts.',
  },
  {
    method: 'GET',
    path: '/api/v2/oracle/requests',
    desc: 'List all oracle fulfillment requests with status, chain, and timestamps.',
  },
  {
    method: 'POST',
    path: '/api/v2/generate/batch',
    desc: 'Batch-generate multiple quantum byte arrays in a single request.',
  },
];

const DATA_CAPTURED = [
  { type: 'qrng', label: 'QRNG operations', desc: 'Byte length, qubit depth, encoding, backend, entropy bits' },
  { type: 'entropy_test', label: 'Entropy tests', desc: 'Shannon entropy, min-entropy, chi-square p-value, NIST pass/fail' },
  { type: 'vrf_*', label: 'VRF operations', desc: 'Seed, prove, reveal and verify steps with request IDs' },
  { type: 'kem_*', label: 'KEM operations', desc: 'Kyber keygen, encapsulation, decapsulation with algorithm and key size' },
  { type: 'sig_*', label: 'Signature ops', desc: 'Sign and verify with scheme (Dilithium, Falcon, SLH-DSA)' },
  { type: 'oracle_*', label: 'Oracle requests', desc: 'On-chain requests with chain, gas limit, commitment hash' },
  { type: 'pqc_benchmark', label: 'PQC benchmarks', desc: 'Algorithm latency, key sizes, throughput measurements' },
];

export default function DatasetsPage() {
  return (
    <div className="page-enter min-w-0 w-full space-y-6">
      <ResearchHeader
        eyebrow="Research · Data"
        title="Datasets & Export"
        description="Export session logs from the experiment notebook or pull structured data from the API for offline analysis, auditing, and research publication."
      />

      {/* Export formats */}
      <Panel>
        <PanelHeader
          title="Session log export formats"
          right={
            <Link href="/research/notebook">
              <GhostButton>Open Experiment Log →</GhostButton>
            </Link>
          }
        />
        <PanelBody className="space-y-0 p-0">
          {EXPORT_FORMATS.map((f, i) => (
            <div
              key={f.format}
              className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-6 ${
                i < EXPORT_FORMATS.length - 1 ? 'border-b border-outline-variant/20' : ''
              }`}
            >
              <div className="flex shrink-0 items-center gap-2">
                <span className="chip chip-info font-mono">{f.format}</span>
                <span className="font-mono text-[10px] text-outline">{f.ext}</span>
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-[12px] text-on-surface">{f.desc}</p>
                <p className="font-mono text-[10px] text-outline">Use: {f.use}</p>
              </div>
            </div>
          ))}
        </PanelBody>
      </Panel>

      {/* What data is captured */}
      <Panel>
        <PanelHeader title="Captured operation types" />
        <PanelBody className="p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type key</th>
                <th>Operation</th>
                <th>Data captured</th>
              </tr>
            </thead>
            <tbody>
              {DATA_CAPTURED.map((d) => (
                <tr key={d.type}>
                  <td className="font-mono text-primary">{d.type}</td>
                  <td className="text-on-surface">{d.label}</td>
                  <td className="text-on-surface-variant">{d.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PanelBody>
      </Panel>

      {/* API endpoints */}
      <Panel>
        <PanelHeader
          title="API-level data access"
          right={
            <Link href="/docs/api">
              <GhostButton>API Reference →</GhostButton>
            </Link>
          }
        />
        <PanelBody className="space-y-0 p-0">
          {API_ENDPOINTS.map((ep, i) => (
            <div
              key={ep.path}
              className={`flex items-start gap-3 px-4 py-3 ${
                i < API_ENDPOINTS.length - 1 ? 'border-b border-outline-variant/20' : ''
              }`}
            >
              <span
                className={`chip shrink-0 ${
                  ep.method === 'GET' ? 'chip-verified' : 'chip-info'
                }`}
              >
                {ep.method}
              </span>
              <div className="min-w-0 space-y-0.5">
                <div className="font-mono text-[11px] text-on-surface">{ep.path}</div>
                <div className="text-[11px] text-on-surface-variant">{ep.desc}</div>
              </div>
            </div>
          ))}
        </PanelBody>
      </Panel>
    </div>
  );
}
