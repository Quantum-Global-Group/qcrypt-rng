import { useCallback, useMemo, useState } from 'react';
import {
  batchGenerateQuantumBytes,
  generateQuantumBytes,
  generateQuantumKey,
  generateQuantumPassword,
  generateQuantumToken,
  generateQuantumUUID,
  requestBatchQuantumRandomness,
  requestQuantumRandomness,
} from '@/utils/api';
import { CopyButton, DownloadButton, InfoPopover, KVRow, MonoValue } from './ui';
import { RawView } from './terminal/RawView';

interface ResultItem {
  id: string;
  title: string;
  primary: string;
  meta: [string, string][];
  raw: string;
  filename: string;
}

const BYTE_PRESETS = [16, 32, 64, 128, 256, 512] as const;

const RESULT_FILTERS = ['All', 'Bytes', 'Key', 'UUID', 'Password', 'Token', 'Oracle', 'Batch'] as const;
type ResultFilter = (typeof RESULT_FILTERS)[number];

const EXPIRY_OPTIONS = [
  { label: '1 hour', value: 3600 },
  { label: '8 hours', value: 28800 },
  { label: '24 hours', value: 86400 },
  { label: '7 days', value: 604800 },
  { label: '30 days', value: 2592000 },
  { label: 'Custom', value: -1 },
] as const;

function strengthMeter(bits: number): { label: string; pct: number; color: string } {
  if (bits >= 128) return { label: 'Very Strong', pct: 100, color: 'bg-green-500' };
  if (bits >= 96) return { label: 'Strong', pct: 75, color: 'bg-green-500' };
  if (bits >= 64) return { label: 'Moderate', pct: 50, color: 'bg-yellow-500' };
  return { label: 'Weak', pct: 25, color: 'bg-red-500' };
}

export const QuantumRNG = () => {
  // Random Bytes
  const [bytesCount, setBytesCount] = useState(32);
  const [bytesQubits, setBytesQubits] = useState(8);
  const [bytesFormat, setBytesFormat] = useState<'hex' | 'base64' | 'array'>('hex');

  // Crypto Keys
  const [keyAlgorithm, setKeyAlgorithm] = useState<'AES' | 'RSA' | 'ECDSA'>('AES');
  const [keySize, setKeySize] = useState(256);
  const [keyFormat, setKeyFormat] = useState<'hex' | 'base64' | 'pem'>('base64');

  // UUID
  const [uuidCount, setUuidCount] = useState(1);
  const [uuidFormat, setUuidFormat] = useState<'standard' | 'raw' | 'urn'>('standard');

  // Password
  const [passwordLength, setPasswordLength] = useState(20);
  const [pwUpper, setPwUpper] = useState(true);
  const [pwLower, setPwLower] = useState(true);
  const [pwNumbers, setPwNumbers] = useState(true);
  const [pwSymbols, setPwSymbols] = useState(true);
  const [pwExcludeAmbiguous, setPwExcludeAmbiguous] = useState(false);
  const [pwStrength, setPwStrength] = useState<{ label: string; pct: number; color: string } | null>(null);

  // Session Token
  const [tokenLength, setTokenLength] = useState(32);
  const [tokenUrlSafe, setTokenUrlSafe] = useState(true);
  const [tokenExpiryPreset, setTokenExpiryPreset] = useState(3600);
  const [tokenExpiryCustom, setTokenExpiryCustom] = useState(3600);

  // Oracle
  const [oracleBytes, setOracleBytes] = useState(32);
  const [oracleQubits, setOracleQubits] = useState(8);
  const [oracleGas, setOracleGas] = useState(200000);
  const [oracleChain, setOracleChain] = useState('');

  // Batch bytes
  const [batchCount, setBatchCount] = useState(5);
  const [batchSize, setBatchSize] = useState(32);
  const [batchQubits, setBatchQubits] = useState(8);
  const [batchFormat, setBatchFormat] = useState<'hex' | 'base64' | 'array'>('hex');
  const [batchParallel, setBatchParallel] = useState(true);

  // Batch oracle
  const [batchOracleCount, setBatchOracleCount] = useState(5);
  const [batchOracleBytes, setBatchOracleBytes] = useState(32);
  const [batchOracleQubits, setBatchOracleQubits] = useState(8);
  const [batchOracleBlock, setBatchOracleBlock] = useState('');
  const [batchOracleChain, setBatchOracleChain] = useState('');

  // Shared
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [resultFilter, setResultFilter] = useState<ResultFilter>('All');
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const addResult = (title: string, primary: string, meta: [string, string][], filename: string, raw: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setResults((prev) => [{ id, title, primary, meta, filename, raw }, ...prev]);
    setExpandedResults((prev) => new Set(prev).add(id));
  };

  const toggleExpanded = useCallback((id: string) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const filteredResults = useMemo(() => {
    if (resultFilter === 'All') return results;
    return results.filter((r) => r.title.toLowerCase().includes(resultFilter.toLowerCase()));
  }, [results, resultFilter]);

  const copyAllResults = useCallback(async () => {
    const payload = filteredResults.map((r) => r.raw);
    await navigator.clipboard.writeText(`[\n${payload.join(',\n')}\n]`);
  }, [filteredResults]);

  // --- Handlers ---

  const handleGenerateBytes = async () => {
    setError(null);
    setLoadingAction('bytes');
    try {
      const response = await generateQuantumBytes({ length: bytesCount, quantum_bits: bytesQubits, format: bytesFormat });
      const d = response.data;
      addResult(
        `Random Bytes (${d.length}B)`,
        d.bytes,
        [['Format', d.format], ['Length', `${d.length} bytes`], ['Entropy', `${d.entropy_bits} bits`]],
        `quantum_bytes_${Date.now()}.json`,
        JSON.stringify(response, null, 2),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate bytes');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGenerateKey = async () => {
    setError(null);
    setLoadingAction('key');
    try {
      const keySizeValue = keyAlgorithm === 'ECDSA' ? 'P-256' : keySize;
      const response = await generateQuantumKey({ algorithm: keyAlgorithm, key_size: keySizeValue, format: keyFormat });
      const d = response.data as Record<string, unknown>;
      const keyVal = String(d.key ?? d.public_key ?? d.private_key ?? '');
      const meta: [string, string][] = Object.entries(d)
        .filter(([k]) => !['key', 'public_key', 'private_key'].includes(k))
        .map(([k, v]) => [k.replace(/_/g, ' '), String(v)]);
      if (d.public_key && d.private_key) {
        meta.push(['Has Private Key', 'Yes']);
      }
      addResult(
        `${keyAlgorithm} Key`,
        keyVal,
        meta,
        `quantum_key_${keyAlgorithm.toLowerCase()}_${Date.now()}.json`,
        JSON.stringify(response, null, 2),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate key');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGenerateUUID = async () => {
    setError(null);
    setLoadingAction('uuid');
    try {
      const response = await generateQuantumUUID({ version: 4, count: uuidCount, format: uuidFormat });
      const d = response.data;
      const uuids = Array.isArray(d) ? d : [d];
      addResult(
        `UUID${uuids.length > 1 ? ` x${uuids.length}` : ''}`,
        uuids.join('\n'),
        [['Count', String(uuids.length)], ['Format', uuidFormat]],
        `quantum_uuid_${Date.now()}.json`,
        JSON.stringify(response, null, 2),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate UUID');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGeneratePassword = async () => {
    setError(null);
    setPwStrength(null);
    setLoadingAction('password');
    try {
      const response = await generateQuantumPassword({
        length: passwordLength,
        include_uppercase: pwUpper,
        include_lowercase: pwLower,
        include_numbers: pwNumbers,
        include_symbols: pwSymbols,
        exclude_ambiguous: pwExcludeAmbiguous,
      });
      const d = response.data;
      setPwStrength(strengthMeter(d.entropy_bits));
      addResult(
        'Password',
        d.password,
        [['Length', String(d.length)], ['Strength', d.strength], ['Entropy', `${d.entropy_bits} bits`]],
        `quantum_password_${Date.now()}.json`,
        JSON.stringify(response, null, 2),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate password');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGenerateToken = async () => {
    setError(null);
    setLoadingAction('token');
    try {
      const expiresIn = tokenExpiryPreset === -1 ? tokenExpiryCustom : tokenExpiryPreset;
      const response = await generateQuantumToken({ length: tokenLength, url_safe: tokenUrlSafe, expires_in: expiresIn });
      const d = response.data;
      addResult(
        'Token',
        d.token,
        [
          ['Type', d.token_type],
          ['Expires In', d.expires_in != null ? `${d.expires_in}s` : 'Never'],
          ['Expires At', d.expires_at ?? '-'],
        ],
        `quantum_token_${Date.now()}.json`,
        JSON.stringify(response, null, 2),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate token');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleBatchGenerate = async () => {
    setError(null);
    setLoadingAction('batch');
    try {
      const requests = Array.from({ length: batchCount }, () => ({
        length: batchSize,
        quantum_bits: batchQubits,
        format: batchFormat as 'hex' | 'base64' | 'array',
      }));
      const response = await batchGenerateQuantumBytes({ requests, parallel: batchParallel });
      const items = response.data;
      const successful = items.filter((i) => i.status === 'success');
      successful.forEach((item, idx) => {
        addResult(
          `Batch #${idx + 1} (${item.length ?? batchSize}B)`,
          item.bytes ?? '',
          [['Format', item.format ?? batchFormat], ['Length', `${item.length ?? batchSize} bytes`]],
          `batch_${idx}_${Date.now()}.json`,
          JSON.stringify(item, null, 2),
        );
      });
      const failed = items.filter((i) => i.status === 'error').length;
      if (failed > 0) setError(`${failed} of ${batchCount} batch items failed`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Batch generation failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleBatchOracleRequest = async () => {
    setError(null);
    setLoadingAction('batch-oracle');
    try {
      const response = await requestBatchQuantumRandomness({
        count: batchOracleCount,
        num_bytes: batchOracleBytes,
        num_qubits: batchOracleQubits,
        commitment_required: true,
        scheduled_delivery_block: batchOracleBlock ? Number(batchOracleBlock) : null,
        target_chain: batchOracleChain || undefined,
      });
      response.data.forEach((item, idx) => {
        const meta: [string, string][] = [
          ['Request ID', item.request_id],
          ['Status', item.status],
        ];
        if (item.commitment) meta.push(['Commitment', item.commitment]);
        if (item.fee_required != null) meta.push(['Fee (wei)', String(item.fee_required)]);
        addResult(
          `Batch Oracle #${idx + 1}`,
          item.request_id,
          meta,
          `batch_oracle_${idx}_${Date.now()}.json`,
          JSON.stringify(item, null, 2),
        );
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Batch oracle request failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRequestRandomness = async () => {
    setError(null);
    setLoadingAction('oracle');
    try {
      const response = await requestQuantumRandomness({
        num_bytes: oracleBytes,
        num_qubits: oracleQubits,
        callback_gas_limit: oracleGas,
        commitment_required: true,
        ...(oracleChain ? { target_chain: oracleChain } : {}),
      });
      const req = response.data;
      const meta: [string, string][] = [
        ['Request ID', req.request_id],
        ['Status', req.status],
        ['Fee (wei)', String(req.fee_required ?? '')],
      ];
      if (req.commitment) meta.push(['Commitment', req.commitment]);
      meta.push(['Est. Blocks', String(req.estimated_completion_blocks)]);
      addResult(
        'Request Randomness',
        req.request_id,
        meta,
        `oracle_request_${Date.now()}.json`,
        JSON.stringify(response, null, 2),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoadingAction(null);
    }
  };

  // --- Render ---

  return (
    <div className="space-y-6">
      {error && <div className="error-banner">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Request Randomness ──────────────────────────────── */}
        <div className="section space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">Request Randomness <InfoPopover title="Request Randomness" description="Request quantum randomness from the oracle for smart contracts. A Keccak-256 commitment is generated before reveal so randomness cannot be predicted or manipulated." useCases={['On-chain random number requests', 'Smart contract randomness', 'Commit-reveal for fairness']} /></h2>
          <p className="text-sm text-slate-400">Request quantum randomness from the oracle for smart contracts. A commitment is generated before reveal so randomness cannot be predicted or manipulated.</p>
          <div>
            <label className="label">Bytes to Generate</label>
            <input type="number" min={1} max={1024} value={oracleBytes} onChange={(e) => setOracleBytes(Number(e.target.value))} className="field" />
          </div>
          <div>
            <label className="label">Qubits to Use</label>
            <select value={oracleQubits} onChange={(e) => setOracleQubits(Number(e.target.value))} className="field">
              <option value={8}>8 Qubits</option>
              <option value={12}>12 Qubits</option>
              <option value={16}>16 Qubits</option>
            </select>
          </div>
          <div>
            <label className="label">Callback Gas Limit</label>
            <input type="number" min={100000} max={500000} value={oracleGas} onChange={(e) => setOracleGas(Number(e.target.value))} className="field" />
          </div>
          <div>
            <label className="label">Target Chain (optional)</label>
            <select value={oracleChain} onChange={(e) => setOracleChain(e.target.value)} className="field">
              <option value="">Any / Default</option>
              <option value="Ethereum">Ethereum</option>
              <option value="Polygon">Polygon</option>
              <option value="Binance Smart Chain">Binance Smart Chain</option>
              <option value="Avalanche">Avalanche</option>
              <option value="Fantom">Fantom</option>
            </select>
          </div>
          <button onClick={handleRequestRandomness} disabled={loadingAction === 'oracle'} className="w-full btn-primary">
            {loadingAction === 'oracle' ? 'Submitting...' : 'Submit Randomness Request'}
          </button>
        </div>

        {/* ── Random Bytes (upgraded: presets + warning) ──────── */}
        <div className="section space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">Random Bytes <InfoPopover title="Random Bytes" description="Generate raw quantum random bytes using configurable qubit counts. Output in hexadecimal, Base64, or array format with entropy analysis." useCases={['Cryptographic nonces', 'Seed material for key generation', 'Scientific simulations']} /></h2>
          <div>
            <label className="label">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              {BYTE_PRESETS.map((n) => (
                <button key={n} onClick={() => setBytesCount(n)} className={bytesCount === n ? 'btn-primary text-xs px-3 py-1' : 'btn-secondary text-xs px-3 py-1'}>
                  {n}B
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Bytes to Generate</label>
            <input type="number" min={1} max={1024} value={bytesCount} onChange={(e) => setBytesCount(Number(e.target.value))} className="field" />
            {bytesCount > 512 && <p className="text-xs text-orange-400 mt-1">Large output may take longer.</p>}
          </div>
          <div>
            <label className="label">Qubits</label>
            <select value={bytesQubits} onChange={(e) => setBytesQubits(Number(e.target.value))} className="field">
              <option value={8}>8 Qubits</option>
              <option value={12}>12 Qubits</option>
              <option value={16}>16 Qubits</option>
            </select>
          </div>
          <div>
            <label className="label">Format</label>
            <select value={bytesFormat} onChange={(e) => setBytesFormat(e.target.value as 'hex' | 'base64' | 'array')} className="field">
              <option value="hex">Hexadecimal</option>
              <option value="base64">Base64</option>
              <option value="array">Array</option>
            </select>
          </div>
          <button onClick={handleGenerateBytes} disabled={loadingAction === 'bytes'} className="w-full btn-primary">
            {loadingAction === 'bytes' ? 'Generating...' : 'Generate Quantum Bytes'}
          </button>
        </div>

        {/* ── Cryptographic Keys (upgraded: format + download) ── */}
        <div className="section space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">Cryptographic Keys <InfoPopover title="Cryptographic Keys" description="Generate AES, RSA, or ECDSA keys with quantum-enhanced entropy. Choose key size and output format (Base64, Hex, or PEM)." useCases={['AES encryption keys', 'RSA key pair generation', 'ECDSA signing keys']} /></h2>
          <div>
            <label className="label">Algorithm</label>
            <select value={keyAlgorithm} onChange={(e) => setKeyAlgorithm(e.target.value as 'AES' | 'RSA' | 'ECDSA')} className="field">
              <option value="AES">AES</option>
              <option value="RSA">RSA</option>
              <option value="ECDSA">ECDSA</option>
            </select>
          </div>
          {keyAlgorithm !== 'ECDSA' && (
            <div>
              <label className="label">Key Size</label>
              <select value={keySize} onChange={(e) => setKeySize(Number(e.target.value))} className="field">
                {keyAlgorithm === 'AES' ? (
                  <>
                    <option value={128}>128 bit</option>
                    <option value={192}>192 bit</option>
                    <option value={256}>256 bit</option>
                  </>
                ) : (
                  <>
                    <option value={2048}>2048 bit</option>
                    <option value={3072}>3072 bit</option>
                    <option value={4096}>4096 bit</option>
                  </>
                )}
              </select>
            </div>
          )}
          <div>
            <label className="label">Output Format</label>
            <select value={keyFormat} onChange={(e) => setKeyFormat(e.target.value as 'hex' | 'base64' | 'pem')} className="field">
              <option value="base64">Base64</option>
              <option value="hex">Hex</option>
              <option value="pem">PEM</option>
            </select>
          </div>
          <button onClick={handleGenerateKey} disabled={loadingAction === 'key'} className="w-full btn-primary">
            {loadingAction === 'key' ? 'Generating...' : 'Generate Key'}
          </button>
        </div>

        {/* ── Quantum UUID ────────────────────────────────────── */}
        <div className="section space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">Quantum UUID <InfoPopover title="Quantum UUID" description="RFC4122-compliant version 4 UUIDs generated with quantum randomness instead of pseudo-random sources. Generate up to 50 at once." useCases={['Database primary keys', 'Distributed system identifiers', 'Session identifiers']} /></h2>
          <div>
            <label className="label">Count</label>
            <input type="number" min={1} max={50} value={uuidCount} onChange={(e) => setUuidCount(Number(e.target.value))} className="field" />
          </div>
          <div>
            <label className="label">Format</label>
            <select value={uuidFormat} onChange={(e) => setUuidFormat(e.target.value as 'standard' | 'raw' | 'urn')} className="field">
              <option value="standard">Standard</option>
              <option value="raw">Raw</option>
              <option value="urn">URN</option>
            </select>
          </div>
          <button onClick={handleGenerateUUID} disabled={loadingAction === 'uuid'} className="w-full btn-primary">
            {loadingAction === 'uuid' ? 'Generating...' : `Generate ${uuidCount > 1 ? `${uuidCount} UUIDs` : 'UUID'}`}
          </button>
        </div>

        {/* ── Secure Password (upgraded: toggles + strength) ─── */}
        <div className="section space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">Secure Password <InfoPopover title="Secure Password" description="Generate quantum-random passwords with configurable character sets, length, and ambiguous character exclusion. Includes a strength meter based on entropy." useCases={['User account passwords', 'Service credentials', 'Master passwords']} /></h2>
          <div>
            <label className="label">Length</label>
            <input type="number" min={8} max={64} value={passwordLength} onChange={(e) => setPasswordLength(Number(e.target.value))} className="field" />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={pwUpper} onChange={(e) => setPwUpper(e.target.checked)} className="rounded border-slate-600" />
              Uppercase (A-Z)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={pwLower} onChange={(e) => setPwLower(e.target.checked)} className="rounded border-slate-600" />
              Lowercase (a-z)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={pwNumbers} onChange={(e) => setPwNumbers(e.target.checked)} className="rounded border-slate-600" />
              Numbers (0-9)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={pwSymbols} onChange={(e) => setPwSymbols(e.target.checked)} className="rounded border-slate-600" />
              Symbols (!@#...)
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={pwExcludeAmbiguous} onChange={(e) => setPwExcludeAmbiguous(e.target.checked)} className="rounded border-slate-600" />
            Exclude ambiguous (0, O, l, I)
          </label>
          <button
            onClick={handleGeneratePassword}
            disabled={(!pwUpper && !pwLower && !pwNumbers && !pwSymbols) || loadingAction === 'password'}
            className="w-full btn-primary"
          >
            {loadingAction === 'password' ? 'Generating...' : 'Generate Password'}
          </button>
          {pwStrength && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Strength</span>
                <span className="text-slate-200">{pwStrength.label}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-700">
                <div className={`h-2 rounded-full ${pwStrength.color} transition-all`} style={{ width: `${pwStrength.pct}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Session Token (new) ─────────────────────────────── */}
        <div className="section space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">Session Token <InfoPopover title="Session Token" description="Generate quantum-random bearer tokens for API authentication and session management. Supports URL-safe encoding and configurable expiry from 1 hour to 30 days." useCases={['API authentication tokens', 'Session management', 'OAuth bearer tokens']} /></h2>
          <p className="text-sm text-slate-400">Generate quantum-random bearer tokens for API authentication and session management.</p>
          <div>
            <label className="label">Length (bytes)</label>
            <input type="number" min={16} max={128} value={tokenLength} onChange={(e) => setTokenLength(Number(e.target.value))} className="field" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={tokenUrlSafe} onChange={(e) => setTokenUrlSafe(e.target.checked)} className="rounded border-slate-600" />
            URL-safe encoding
          </label>
          <div>
            <label className="label">Expiry</label>
            <select
              value={tokenExpiryPreset}
              onChange={(e) => setTokenExpiryPreset(Number(e.target.value))}
              className="field"
            >
              {EXPIRY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {tokenExpiryPreset === -1 && (
            <div>
              <label className="label">Custom Expiry (seconds)</label>
              <input type="number" min={60} max={31536000} value={tokenExpiryCustom} onChange={(e) => setTokenExpiryCustom(Number(e.target.value))} className="field" />
            </div>
          )}
          <button onClick={handleGenerateToken} disabled={loadingAction === 'token'} className="w-full btn-primary">
            {loadingAction === 'token' ? 'Generating...' : 'Generate Token'}
          </button>
        </div>

        {/* ── Batch Random Bytes ──────────────────────────────── */}
        <div className="section space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">Batch Random Bytes <InfoPopover title="Batch Random Bytes" description="Generate multiple quantum random samples in a single API call with optional parallel processing for high-volume and low-latency use cases." useCases={['High-volume random generation', 'Parallel cryptographic operations', 'Bulk nonce creation']} /></h2>
          <p className="text-sm text-slate-400">Generate multiple quantum random samples in a single request for high-volume use cases.</p>
          <div>
            <label className="label">Number of Samples</label>
            <input type="number" min={1} max={20} value={batchCount} onChange={(e) => setBatchCount(Number(e.target.value))} className="field" />
          </div>
          <div>
            <label className="label">Bytes per Sample</label>
            <input type="number" min={1} max={1024} value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} className="field" />
          </div>
          <div>
            <label className="label">Qubits</label>
            <select value={batchQubits} onChange={(e) => setBatchQubits(Number(e.target.value))} className="field">
              <option value={8}>8 Qubits</option>
              <option value={12}>12 Qubits</option>
              <option value={16}>16 Qubits</option>
            </select>
          </div>
          <div>
            <label className="label">Format</label>
            <select value={batchFormat} onChange={(e) => setBatchFormat(e.target.value as 'hex' | 'base64' | 'array')} className="field">
              <option value="hex">Hexadecimal</option>
              <option value="base64">Base64</option>
              <option value="array">Array</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={batchParallel} onChange={(e) => setBatchParallel(e.target.checked)} className="rounded border-slate-600" />
            Parallel processing
          </label>
          <button onClick={handleBatchGenerate} disabled={loadingAction === 'batch'} className="w-full btn-primary">
            {loadingAction === 'batch' ? 'Generating...' : `Generate ${batchCount} Samples`}
          </button>
        </div>

        {/* ── Batch Oracle Requests ───────────────────────────── */}
        <div className="section space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">Batch Oracle Requests <InfoPopover title="Batch Oracle Requests" description="Request multiple oracle commitments in one call with optional scheduled delivery block and target chain. Each request gets its own commitment for independent verification." useCases={['Fair NFT mints', 'Lottery and raffle systems', 'Gaming random events']} /></h2>
          <p className="text-sm text-slate-400">Request multiple oracle commitments in one call. Ideal for fair mints, lotteries, and gaming applications.</p>
          <div>
            <label className="label">Number of Requests</label>
            <input type="number" min={1} max={50} value={batchOracleCount} onChange={(e) => setBatchOracleCount(Number(e.target.value))} className="field" />
          </div>
          <div>
            <label className="label">Bytes per Request</label>
            <input type="number" min={1} max={1024} value={batchOracleBytes} onChange={(e) => setBatchOracleBytes(Number(e.target.value))} className="field" />
          </div>
          <div>
            <label className="label">Qubits</label>
            <select value={batchOracleQubits} onChange={(e) => setBatchOracleQubits(Number(e.target.value))} className="field">
              <option value={8}>8 Qubits</option>
              <option value={12}>12 Qubits</option>
              <option value={16}>16 Qubits</option>
            </select>
          </div>
          <div>
            <label className="label">Scheduled Delivery Block (optional)</label>
            <input type="number" min={0} value={batchOracleBlock} onChange={(e) => setBatchOracleBlock(e.target.value)} placeholder="e.g. 18500000" className="field" />
          </div>
          <div>
            <label className="label">Target Chain (optional)</label>
            <input type="text" value={batchOracleChain} onChange={(e) => setBatchOracleChain(e.target.value)} placeholder="e.g. Ethereum" className="field" />
          </div>
          <button onClick={handleBatchOracleRequest} disabled={loadingAction === 'batch-oracle'} className="w-full btn-primary">
            {loadingAction === 'batch-oracle' ? 'Requesting...' : `Request ${batchOracleCount} Commitments`}
          </button>
        </div>
      </div>

      {/* ── Results (upgraded: filter, copy-all, collapsible) ── */}
      {results.length > 0 && (
        <div className="space-y-4">
          {/* Header + actions */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base font-bold text-white">Results ({filteredResults.length}{filteredResults.length !== results.length ? ` of ${results.length}` : ''})</h3>
            <div className="flex gap-2">
              <button onClick={copyAllResults} className="btn-ghost">Copy All</button>
              <button onClick={() => setResults([])} className="btn-ghost">Clear All</button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap gap-1.5">
            {RESULT_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setResultFilter(f)}
                className={`text-[11px] px-3 py-1 rounded-[3px] font-mono uppercase tracking-[0.08em] transition-colors border ${
                  resultFilter === f
                    ? 'bg-[rgba(0,255,156,0.08)] text-[rgb(var(--green))] border-[rgb(var(--green))]'
                    : 'text-[rgb(var(--fg-dim))] border-[rgb(var(--border))] hover:text-[rgb(var(--green))] hover:border-[rgb(var(--green))]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Result cards */}
          {filteredResults.map((r) => {
            const isOpen = expandedResults.has(r.id);
            const hasMultiLine = r.primary.includes('\n');
            return (
              <div key={r.id} className="section">
                {/* Collapsed header -- always visible */}
                <div className="flex items-center justify-between gap-3">
                  <button onClick={() => toggleExpanded(r.id)} className="flex items-center gap-2 text-left flex-1 min-w-0">
                    <span className="text-slate-500 text-xs shrink-0">{isOpen ? '\u25BC' : '\u25B6'}</span>
                    <span className="text-base font-medium text-white truncate">{r.title}</span>
                  </button>
                  <div className="flex gap-2 shrink-0">
                    <CopyButton value={r.primary} />
                    <DownloadButton filename={r.filename} content={r.raw} />
                  </div>
                </div>

                {/* Expanded body */}
                {isOpen && (
                  <div className="space-y-3 pt-3">
                    {hasMultiLine ? (
                      <div className="space-y-1">
                        {r.primary.split('\n').map((line, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <code className="flex-1 text-sm font-mono text-slate-200 break-all select-all">{line}</code>
                            <CopyButton value={line} label="Copy" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <MonoValue value={r.primary} truncate={200} />
                    )}
                    {r.meta.length > 0 && (
                      <div className="pt-2">
                        {r.meta.map(([k, v]) =>
                          k === 'Commitment' && v.length > 20 ? (
                            <div key={k} className="flex items-baseline justify-between gap-4 py-2 border-b border-[rgb(var(--border))]/60 last:border-0">
                              <span className="text-[11px] uppercase tracking-[0.1em] text-[rgb(var(--fg-dim))] shrink-0">{k}</span>
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-mono text-[rgb(var(--green))]">{v.slice(0, 16)}...</code>
                                <CopyButton value={v} label="copy" />
                              </div>
                            </div>
                          ) : (
                            <KVRow key={k} label={k} value={v} />
                          ),
                        )}
                      </div>
                    )}
                    <RawView
                      data={(() => { try { return JSON.parse(r.raw); } catch { return r.raw; } })()}
                      title="raw payload"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
