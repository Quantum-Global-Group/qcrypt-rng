import type {
  ApiResponse,
  AssessThreatResponse,
  BatchGenerateResultItem,
  BatchOracleRequestItem,
  EncryptResponse,
  FulfillmentChainConfig,
  FulfillmentRequestItem,
  FulfillmentRequestStatus,
  GenerateBytesResponse,
  GenerateKeyResponse,
  GeneratePasswordResponse,
  GeneratePqcResponse,
  GenerateUuidResponse,
  HardwareDevicesResponse,
  HashResponse,
  HealthResponse,
  HybridKemDecapsulateResponse,
  HybridKemEncapsulateResponse,
  HybridKemKeypairResponse,
  KemDecapsulateResponse,
  KemEncapsulateResponse,
  KemKeypairResponse,
  NetworkInfoResponse,
  OracleBenchmarkResponse,
  OracleRequestResponse,
  OracleStatusResponse,
  PqcSignResponse,
  PqcVerifyResponse,
  QuantumEntropyResponse,
  QuantumStatsResponse,
  SignResponse,
  VerifyResponse,
  VrfProveResponse,
  VrfRevealResponse,
  VrfSeedResponse,
  VrfVerifyResponse,
  BillingUsageResponse,
} from '@/types';

let cachedBaseUrl: string | null = null;
const ENV_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const FALLBACK_PORTS = [9878, 9879, 9880, 9881, 9882];

const timeoutFetch = async (url: string, init?: RequestInit, timeoutMs = 2500) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const resolveApiBaseUrl = async (): Promise<string> => {
  if (cachedBaseUrl) return cachedBaseUrl;
  if (ENV_BASE_URL) {
    cachedBaseUrl = ENV_BASE_URL;
    return cachedBaseUrl;
  }

  for (const port of FALLBACK_PORTS) {
    const root = `http://localhost:${port}`;
    try {
      const r = await timeoutFetch(`${root}/health`, undefined, 800);
      if (r.ok) {
        cachedBaseUrl = `${root}/api/v2`;
        return cachedBaseUrl;
      }
    } catch {
      // try next
    }
  }

  cachedBaseUrl = 'http://localhost:9878/api/v2';
  return cachedBaseUrl;
};

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const base = await resolveApiBaseUrl();
  const response = await timeoutFetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body || response.statusText}`);
  }
  return response.json() as Promise<T>;
};

const requestForm = async <T>(path: string, form: Record<string, string | number | boolean>): Promise<T> => {
  const base = await resolveApiBaseUrl();
  const params = new URLSearchParams();
  Object.entries(form).forEach(([k, v]) => params.set(k, String(v)));
  const response = await timeoutFetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body || response.statusText}`);
  }
  return response.json() as Promise<T>;
};

export const checkHealth = async (): Promise<HealthResponse> => {
  const base = await resolveApiBaseUrl();
  const root = base.replace('/api/v2', '');
  const response = await timeoutFetch(`${root}/health`);
  if (!response.ok) throw new Error(`Health check failed (${response.status})`);
  return response.json() as Promise<HealthResponse>;
};

// Oracle API
export const requestQuantumRandomness = (request: {
  num_bytes: number;
  num_qubits: number;
  callback_gas_limit: number;
  commitment_required?: boolean;
  target_chain?: string;
}): Promise<ApiResponse<OracleRequestResponse>> =>
  requestJson('/oracle/request', { method: 'POST', body: JSON.stringify(request) });

export const getOracleRequestStatus = (requestId: string): Promise<ApiResponse<OracleStatusResponse>> =>
  requestJson(`/oracle/status/${requestId}`);

export const getOracleNetworkInfo = (): Promise<ApiResponse<NetworkInfoResponse>> =>
  requestJson('/oracle/network-info');

export const runOracleBenchmark = (): Promise<ApiResponse<OracleBenchmarkResponse>> =>
  requestJson('/oracle/benchmark');

// Blockchain demo API
export const createBlockchainWallet = (walletType: 'both' | 'vulnerable' | 'quantum-safe'): Promise<ApiResponse<Record<string, unknown>>> =>
  requestForm('/blockchain/create-wallet', { wallet_type: walletType });

/** Shor attack simulation targets (matches `/blockchain/simulate-attack` Form `target`). */
export type ShorSimTarget =
  | 'RSA-2048'
  | 'RSA-4096'
  | 'ECDSA-256'
  | 'ECDSA-384'
  | 'DILITHIUM3'
  | 'KYBER768';

export const signBlockchainTransaction = (payload: {
  from_address: string;
  to_address: string;
  amount: number;
  signature_type: 'vulnerable' | 'quantum-safe' | 'both';
}): Promise<ApiResponse<Record<string, unknown>>> =>
  requestForm('/blockchain/sign-transaction', {
    from_address: payload.from_address,
    to_address: payload.to_address,
    amount: payload.amount,
    signature_type: payload.signature_type,
  });

export const simulateBlockchainAttack = (
  target: ShorSimTarget,
  showTimeline = true,
): Promise<ApiResponse<Record<string, unknown>>> =>
  requestForm('/blockchain/simulate-attack', { target, show_timeline: showTimeline });

export const compareBlockchains = (): Promise<Record<string, unknown>> =>
  requestJson('/blockchain/compare-blockchains');

export const mineBlockchainBlock = (
  blockchainType: 'both' | 'vulnerable' | 'quantum-safe',
  minerAddress: string,
): Promise<ApiResponse<Record<string, unknown>>> =>
  requestForm('/blockchain/mine-block', { blockchain_type: blockchainType, miner_address: minerAddress });

// Quantum RNG API
export const generateQuantumBytes = (request: {
  length: number;
  format: 'hex' | 'base64' | 'array' | 'raw';
  quantum_bits: number;
}): Promise<GenerateBytesResponse> =>
  requestJson('/generate/bytes', { method: 'POST', body: JSON.stringify(request) });

export const generateQuantumKey = (request: {
  algorithm: 'AES' | 'RSA' | 'ECDSA';
  key_size: number | string;
  format: 'hex' | 'base64' | 'pem';
}): Promise<GenerateKeyResponse> =>
  requestJson('/generate/key', { method: 'POST', body: JSON.stringify(request) });

export const generateQuantumUUID = (request: {
  version: 4;
  count: number;
  format: 'standard' | 'raw' | 'urn';
}): Promise<GenerateUuidResponse> =>
  requestJson('/generate/uuid', { method: 'POST', body: JSON.stringify(request) });

export const generateQuantumPassword = (request: {
  length: number;
  include_uppercase: boolean;
  include_lowercase: boolean;
  include_numbers: boolean;
  include_symbols: boolean;
  exclude_ambiguous: boolean;
}): Promise<GeneratePasswordResponse> =>
  requestJson('/generate/password', { method: 'POST', body: JSON.stringify(request) });

export const generateQuantumToken = (request: {
  length: number;
  url_safe: boolean;
  expires_in: number;
}): Promise<import('@/types').GenerateTokenResponse> =>
  requestJson('/generate/token', { method: 'POST', body: JSON.stringify(request) });

export const getQuantumStats = (): Promise<ApiResponse<QuantumStatsResponse>> => requestJson('/quantum/stats');

// Protect API
export const encryptData = (
  data: string,
  useQuantumKey = true,
  algorithm = 'AES-256-GCM',
  key?: string,
): Promise<EncryptResponse> => {
  const form: Record<string, string | number | boolean> = { data, use_quantum_key: useQuantumKey, algorithm };
  if (key) form.key = key;
  return requestForm('/protect/encrypt', form);
};

export const decryptData = (payload: {
  ciphertext: string;
  key: string;
  iv: string;
  tag: string;
  algorithm?: string;
}): Promise<ApiResponse<{ plaintext: string; verified: boolean }>> =>
  requestForm('/protect/decrypt', { ...payload, algorithm: payload.algorithm ?? 'AES-256-GCM' });

export const encryptFile = async (
  file: File,
  algorithm = 'AES-256-GCM',
  key?: string,
): Promise<EncryptResponse> => {
  const base = await resolveApiBaseUrl();
  const fd = new FormData();
  fd.append('file', file);
  fd.append('algorithm', algorithm);
  if (key) fd.append('key', key);
  const response = await timeoutFetch(`${base}/protect/encrypt-file`, { method: 'POST', body: fd }, 30000);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body || response.statusText}`);
  }
  return response.json() as Promise<EncryptResponse>;
};

export const decryptFile = (payload: {
  ciphertext: string;
  key: string;
  iv: string;
  tag: string;
  algorithm?: string;
}): Promise<ApiResponse<{ content_base64: string; size: number; verified: boolean }>> =>
  requestForm('/protect/decrypt-file', { ...payload, algorithm: payload.algorithm ?? 'AES-256-GCM' });

export const signData = (data: string, algorithm = 'HMAC-SHA256'): Promise<SignResponse> =>
  requestForm('/protect/sign', { data, algorithm });

export const verifyDataSignature = (payload: {
  data: string;
  signature: string;
  public_key: string;
  algorithm: string;
}): Promise<VerifyResponse> =>
  requestForm('/protect/verify', payload);

export const hashData = (payload: {
  data: string;
  algorithm: 'SHA3-256' | 'SHA3-512' | 'PBKDF2-SHA256' | 'BLAKE2b-256';
  use_quantum_salt: boolean;
  iterations?: number;
}): Promise<HashResponse> =>
  requestForm('/protect/hash', payload);

// PQC / Threat API
const PQC_ENDPOINTS: Record<string, string> = {
  FALCON512: '/pqc/falcon/generate',
  FALCON1024: '/pqc/falcon/generate',
  'SPHINCS+-SHA2-128F': '/pqc/sphincs/generate',
  'SPHINCS+-SHA2-128f': '/pqc/sphincs/generate',
  'NTRU-HPS-2048-509': '/pqc/ntru/generate',
  'NTRU-HPS-2048-677': '/pqc/ntru/generate',
  'SABER-LIGHTSABER': '/pqc/saber/generate',
  'SABER-SABER': '/pqc/saber/generate',
  'SABER-FIRESABER': '/pqc/saber/generate',
};

export const generatePQCKey = (algorithm: string, encoding: 'base64' | 'hex'): Promise<GeneratePqcResponse> => {
  const path = PQC_ENDPOINTS[algorithm] ?? '/pqc/generate';
  return requestForm(path, { algorithm, encoding: encoding || 'base64' });
};

export const signPqc = (payload: {
  message: string;
  private_key: string;
  algorithm: string;
  encoding: 'base64' | 'hex';
}): Promise<PqcSignResponse> =>
  requestForm('/pqc/sign', payload);

export const verifyPqc = (payload: {
  message: string;
  signature: string;
  public_key: string;
  algorithm: string;
  encoding: 'base64' | 'hex';
}): Promise<PqcVerifyResponse> =>
  requestForm('/pqc/verify', payload);

export const getPqcAlgorithms = (): Promise<ApiResponse<Record<string, unknown>>> =>
  requestJson('/pqc/algorithms');

export const assessQuantumThreat = (algorithm: string): Promise<AssessThreatResponse> =>
  requestForm('/pqc/threat-assessment', { algorithm });

export const getPqcInfo = (): Promise<ApiResponse<Record<string, unknown>>> => requestJson('/pqc/info');

// Quantum entropy API
export const getQuantumEntropy = (): Promise<ApiResponse<QuantumEntropyResponse>> =>
  requestJson('/quantum/entropy');

export const reseedEntropyPool = (): Promise<ApiResponse<Record<string, unknown>>> =>
  requestJson('/quantum/reseed', { method: 'POST' });

// Batch generate API
export const batchGenerateQuantumBytes = (request: {
  requests: Array<{ length: number; quantum_bits?: number; format: 'hex' | 'base64' | 'array' }>;
  parallel?: boolean;
}): Promise<ApiResponse<BatchGenerateResultItem[]>> =>
  requestJson('/generate/batch', { method: 'POST', body: JSON.stringify(request) });

// Hardware API
export const getHardwareDevices = (): Promise<HardwareDevicesResponse> =>
  requestJson('/hardware/devices');

export const getHardwareBenchmark = (): Promise<ApiResponse<Record<string, unknown>>> =>
  requestJson('/hardware/benchmark');

// Quantum VRF API
export const createVrfSeed = (targetChain?: string): Promise<ApiResponse<VrfSeedResponse>> =>
  requestJson('/oracle/vrf/seed', {
    method: 'POST',
    body: JSON.stringify(targetChain ? { target_chain: targetChain } : {}),
  });

export const vrfProve = (requestId: string, alpha: string): Promise<ApiResponse<VrfProveResponse>> =>
  requestJson('/oracle/vrf/prove', {
    method: 'POST',
    body: JSON.stringify({ request_id: requestId, alpha }),
  });

export const vrfReveal = (requestId: string): Promise<ApiResponse<VrfRevealResponse>> =>
  requestJson('/oracle/vrf/reveal', {
    method: 'POST',
    body: JSON.stringify({ request_id: requestId }),
  });

export const vrfVerify = (payload: {
  commitment: string;
  alpha: string;
  output: string;
  seed: string;
}): Promise<ApiResponse<VrfVerifyResponse>> =>
  requestJson('/oracle/vrf/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// Batch oracle randomness API
export const requestBatchQuantumRandomness = (request: {
  count: number;
  num_bytes?: number;
  num_qubits?: number;
  commitment_required?: boolean;
  scheduled_delivery_block?: number | null;
  target_chain?: string;
}): Promise<ApiResponse<BatchOracleRequestItem[]>> =>
  requestJson('/oracle/requests/batch', { method: 'POST', body: JSON.stringify(request) });

// Kyber KEM API
export const kemGenerate = (
  algorithm: 'KYBER512' | 'KYBER768' | 'KYBER1024' = 'KYBER768',
  encoding: 'base64' | 'hex' = 'base64',
): Promise<ApiResponse<KemKeypairResponse>> =>
  requestForm('/pqc/kem/generate', { algorithm, encoding });

export const kemEncapsulate = (
  publicKey: string,
  algorithm: 'KYBER512' | 'KYBER768' | 'KYBER1024' = 'KYBER768',
  encoding: 'base64' | 'hex' = 'base64',
): Promise<ApiResponse<KemEncapsulateResponse>> =>
  requestForm('/pqc/kem/encapsulate', { public_key: publicKey, algorithm, encoding });

export const kemDecapsulate = (
  ciphertext: string,
  privateKey: string,
  algorithm: 'KYBER512' | 'KYBER768' | 'KYBER1024' = 'KYBER768',
  encoding: 'base64' | 'hex' = 'base64',
): Promise<ApiResponse<KemDecapsulateResponse>> =>
  requestForm('/pqc/kem/decapsulate', { ciphertext, private_key: privateKey, algorithm, encoding });

export const getKemInfo = (): Promise<ApiResponse<Record<string, unknown>>> => requestJson('/pqc/kem/info');

export const generateHybridKemKeypair = (
  encoding: 'base64' | 'hex' = 'base64',
): Promise<ApiResponse<HybridKemKeypairResponse>> =>
  requestForm('/pqc/hybrid/kem/generate', { encoding });

export const encapsulateHybridKem = (payload: {
  kyber_public_key: string;
  x25519_public_key: string;
  encoding?: 'base64' | 'hex';
}): Promise<ApiResponse<HybridKemEncapsulateResponse>> =>
  requestForm('/pqc/hybrid/kem/encapsulate', {
    ...payload,
    encoding: payload.encoding ?? 'base64',
  });

export const decapsulateHybridKem = (payload: {
  kyber_private_key: string;
  x25519_private_key: string;
  kyber_ciphertext: string;
  x25519_ciphertext: string;
  encoding?: 'base64' | 'hex';
}): Promise<ApiResponse<HybridKemDecapsulateResponse>> =>
  requestForm('/pqc/hybrid/kem/decapsulate', {
    ...payload,
    encoding: payload.encoding ?? 'base64',
  });

export const getBillingUsage = (apiKey: string): Promise<BillingUsageResponse> =>
  requestJson('/billing/usage', {
    headers: {
      'X-API-Key': apiKey,
    },
  });

// Oracle fulfillment API
export interface ConfigureFulfillmentChainParams {
  chain: string;
  rpc_url: string;
  private_key: string;
  explorer_url: string;
  chain_id: number;
  currency_symbol: string;
  gas_price_gwei?: number;
  confirmations_required?: number;
}

export const configureFulfillmentChain = (params: ConfigureFulfillmentChainParams): Promise<ApiResponse<FulfillmentChainConfig>> =>
  requestForm('/oracle/fulfillment/configure-chain', {
    chain: params.chain,
    rpc_url: params.rpc_url,
    private_key: params.private_key,
    explorer_url: params.explorer_url,
    chain_id: params.chain_id,
    currency_symbol: params.currency_symbol,
    ...(params.gas_price_gwei != null && { gas_price_gwei: params.gas_price_gwei }),
    confirmations_required: params.confirmations_required ?? 3,
  });

export const createFulfillmentRequest = (params: {
  chain: string;
  contract_address: string;
  num_bytes?: number;
  num_qubits?: number;
  async_fulfillment?: boolean;
}): Promise<ApiResponse<{ request_id: string; chain: string; fulfillment_status: string; status: FulfillmentRequestStatus }>> =>
  requestForm('/oracle/fulfillment/request', {
    chain: params.chain,
    contract_address: params.contract_address,
    num_bytes: params.num_bytes ?? 32,
    num_qubits: params.num_qubits ?? 16,
    async_fulfillment: params.async_fulfillment ?? true,
  });

export const getFulfillmentStatus = (requestId: string): Promise<ApiResponse<FulfillmentRequestStatus>> =>
  requestJson(`/oracle/fulfillment/status/${requestId}`);

export const listFulfillmentRequests = (): Promise<ApiResponse<{ requests: FulfillmentRequestItem[]; total_count: number }>> =>
  requestJson('/oracle/fulfillment/requests');

export const getFulfillmentChains = (): Promise<ApiResponse<{ chains: FulfillmentChainConfig[] } | { message: string }>> =>
  requestJson('/oracle/fulfillment/chains');

export const retryFulfillment = (requestId: string): Promise<ApiResponse<{ success: boolean; message?: string }>> =>
  requestJson(`/oracle/fulfillment/retry/${requestId}`, { method: 'POST' });

// ─── Simple Wizard Helpers ───────────────────────────────────────────────────

/** Generate random bytes (simple wrapper) */
export const generateBytes = async (numBytes: number = 32): Promise<string> => {
  const res = await generateQuantumBytes({ length: numBytes, format: 'hex', quantum_bits: 8 });
  return res.data?.bytes || '';
};

/** Generate encryption key (simple wrapper) */
export const generateKey = async (keySize: number = 32): Promise<string> => {
  const res = await generateQuantumKey({ algorithm: 'AES', key_size: keySize, format: 'hex' });
  const data = res.data as any;
  return (data?.key || data?.private_key || '') as string;
};

/** Generate UUID (simple wrapper) */
export const generateUUID = async (): Promise<string> => {
  const res = await generateQuantumUUID({ version: 4, count: 1, format: 'standard' });
  const data = res.data as any;
  return (data || data?.[0] || '') as string;
};

/** Generate password (simple wrapper) */
export const generatePassword = async (length: number = 16, includeSymbols: boolean = true): Promise<string> => {
  const res = await generateQuantumPassword({
    length,
    include_uppercase: true,
    include_lowercase: true,
    include_numbers: true,
    include_symbols: includeSymbols,
    exclude_ambiguous: true,
  });
  const data = res.data as any;
  return (data?.password || '') as string;
};

/** Encrypt text (simple wrapper using encryptData) */
export const encryptText = async (text: string, password?: string): Promise<any> => {
  return await encryptData(text, true, 'AES-256-GCM', password);
};

/** Decrypt text (simple wrapper) */
export const decryptText = async (encryptedResponse: any): Promise<any> => {
  // This requires the encrypted data structure from the API
  // For now, return as-is - implement based on actual API response
  return encryptedResponse;
};
