export interface ApiResponse<T> {
  status: string;
  request_id?: string;
  data: T;
  metadata?: Record<string, unknown>;
}

export interface HealthResponse {
  status: string;
  version: string;
  backend: string;
  backend_status: string;
  checks: Record<string, boolean>;
}

export interface OracleRequestResponse {
  request_id: string;
  commitment?: string | null;
  estimated_completion_blocks: number;
  fee_required: number;
  status: string;
}

export interface OracleStatusResponse {
  request_id: string;
  status: string;
  block_number: number;
  fulfilled: boolean;
  randomness?: string | null;
  commitment?: string | null;
  timestamp: number;
  entropy_bits?: number;
}

export interface GenerateBytesData {
  bytes: string;
  format: string;
  length: number;
  entropy_bits: number;
}

export interface GeneratePqcKeypairData {
  public_key: string;
  private_key: string;
  algorithm: string;
  nist_level: number;
  encoding: string;
  key_sizes?: {
    public_key_bytes: number;
    private_key_bytes: number;
  };
}

export interface PqcSignatureData {
  signature: string;
  algorithm: string;
  encoding: string;
  signature_size_bytes: number;
}

export interface PqcVerifyData {
  valid: boolean;
  message: string;
  algorithm: string;
  verification_time: number;
}

export interface HybridKeypairData {
  dilithium_pk: string;
  ed25519_pk: string;
  algorithm: string;
  nist_level: number;
  key_sizes: Record<string, number>;
}

export interface HybridSignatureData {
  combined_signature: string;
  dilithium_signature: string;
  ed25519_signature: string;
  algorithm: string;
  dilithium_sig_bytes: number;
  ed25519_sig_bytes: number;
}

export interface HybridVerifyData {
  dilithium_valid: boolean;
  ed25519_valid: boolean;
  hybrid_valid: boolean;
  mode: string;
  liboqs_active?: boolean;
}

export interface HybridCsrData {
  csr_pem: string;
  dilithium_pk: string;
  ed25519_pk: string;
  algorithm: string;
  subject: Record<string, string>;
  nist_level: number;
  fips_standard: string;
  migration_note: string;
}

export interface HybridKemKeypairData {
  kyber_public_key: string;
  kyber_private_key: string;
  x25519_public_key: string;
  x25519_private_key: string;
  algorithm: string;
  encoding: string;
  key_sizes: Record<string, number>;
}

export interface HybridKemEncapsulationData {
  kyber_ciphertext: string;
  x25519_ciphertext: string;
  combined_secret: string;
  algorithm: string;
  encoding: string;
  key_sizes: Record<string, number>;
}

export interface HybridKemDecapsulationData {
  combined_secret: string;
  algorithm: string;
  encoding: string;
  key_sizes: Record<string, number>;
}

export interface BillingUsageData {
  tier: string;
  limits: {
    max_bytes: number;
    max_requests: number;
  };
  usage: {
    requests_used: number;
    bytes_used: number;
    reset_time: string | null;
  };
}

export interface VrfSeedData {
  request_id: string;
  commitment: string;
}

export interface VrfProveData {
  request_id: string;
  alpha: string;
  output: string;
  commitment: string;
}

export interface VrfRevealData {
  request_id: string;
  seed: string;
  commitment: string;
}

export interface VrfVerifyData {
  valid: boolean;
  commitment_valid: boolean;
  output_valid: boolean;
}

export interface AssessThreatData {
  assessment: {
    status: string;
    qubits_to_break: string | number;
    time_to_break: string;
    risk_level: string;
    recommendation: string;
  };
  algorithm: string;
}

export enum Algorithm {
  DILITHIUM2 = "DILITHIUM2",
  DILITHIUM3 = "DILITHIUM3",
  DILITHIUM5 = "DILITHIUM5",
  KYBER512 = "KYBER512",
  KYBER768 = "KYBER768",
  KYBER1024 = "KYBER1024",
  FALCON512 = "FALCON512",
  FALCON1024 = "FALCON1024",
  SPHINCS_SHA2_128F = "SPHINCS+-SHA2-128F",
  NTRU_HPS_2048_509 = "NTRU-HPS-2048-509",
  SABER = "SABER-SABER",
}

export type OutputFormat = "hex" | "base64" | "array" | "raw";
export type PqcEncoding = "base64" | "hex";
type FormValue = string | number | boolean;

export interface QCryptClientOptions {
  baseUrl?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

export class QCryptApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`QCrypt API ${status}: ${body}`);
    this.name = "QCryptApiError";
    this.status = status;
    this.body = body;
  }
}

export class QCryptClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: QCryptClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "http://localhost:8000").replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async health(): Promise<HealthResponse> {
    return this.requestJson<HealthResponse>("/health");
  }

  async generateBytes(params: {
    length: number;
    quantumBits?: number;
    format?: OutputFormat;
  }): Promise<ApiResponse<GenerateBytesData>> {
    return this.requestJson<ApiResponse<GenerateBytesData>>("/api/v2/generate/bytes", {
      method: "POST",
      body: JSON.stringify({
        length: params.length,
        quantum_bits: params.quantumBits ?? 8,
        format: params.format ?? "hex",
      }),
    });
  }

  async generatePqcKeypair(
    algorithm: string = Algorithm.DILITHIUM3,
    encoding: PqcEncoding = "base64",
  ): Promise<ApiResponse<GeneratePqcKeypairData>> {
    return this.requestForm<ApiResponse<GeneratePqcKeypairData>>("/api/v2/pqc/generate", {
      algorithm,
      encoding,
    });
  }

  async signPqc(params: {
    message: string;
    privateKey: string;
    algorithm: string;
    encoding?: PqcEncoding;
  }): Promise<ApiResponse<PqcSignatureData>> {
    return this.requestForm<ApiResponse<PqcSignatureData>>("/api/v2/pqc/sign", {
      message: params.message,
      private_key: params.privateKey,
      algorithm: params.algorithm,
      encoding: params.encoding ?? "base64",
    });
  }

  async verifyPqcSignature(params: {
    message: string;
    signature: string;
    publicKey: string;
    algorithm: string;
    encoding?: PqcEncoding;
  }): Promise<ApiResponse<PqcVerifyData>> {
    return this.requestForm<ApiResponse<PqcVerifyData>>("/api/v2/pqc/verify", {
      message: params.message,
      signature: params.signature,
      public_key: params.publicKey,
      algorithm: params.algorithm,
      encoding: params.encoding ?? "base64",
    });
  }

  async assessQuantumThreat(algorithm: string): Promise<ApiResponse<AssessThreatData>> {
    return this.requestForm<ApiResponse<AssessThreatData>>("/api/v2/pqc/threat-assessment", {
      algorithm,
    });
  }

  async requestOracleRandomness(params: {
    numBytes: number;
    numQubits: number;
    callbackGasLimit: number;
    commitmentRequired?: boolean;
    targetChain?: string;
  }): Promise<ApiResponse<OracleRequestResponse>> {
    return this.requestJson<ApiResponse<OracleRequestResponse>>("/api/v2/oracle/request", {
      method: "POST",
      body: JSON.stringify({
        num_bytes: params.numBytes,
        num_qubits: params.numQubits,
        callback_gas_limit: params.callbackGasLimit,
        commitment_required: params.commitmentRequired,
        target_chain: params.targetChain,
      }),
    });
  }

  async getOracleRequestStatus(requestId: string): Promise<ApiResponse<OracleStatusResponse>> {
    return this.requestJson<ApiResponse<OracleStatusResponse>>(`/api/v2/oracle/status/${requestId}`);
  }

  async generateHybridKeypair(): Promise<ApiResponse<HybridKeypairData>> {
    return this.requestJson<ApiResponse<HybridKeypairData>>("/api/v2/pqc/hybrid/generate", {
      method: "POST",
    });
  }

  async signHybrid(params: {
    message: string;
    dilithiumSecretKey: string;
    ed25519SecretKey: string;
  }): Promise<ApiResponse<HybridSignatureData>> {
    return this.requestForm<ApiResponse<HybridSignatureData>>("/api/v2/pqc/hybrid/sign", {
      message: params.message,
      dilithium_sk: params.dilithiumSecretKey,
      ed25519_sk: params.ed25519SecretKey,
    });
  }

  async verifyHybridSignature(params: {
    message: string;
    signature: string;
    dilithiumPublicKey: string;
    ed25519PublicKey: string;
    requireBoth?: boolean;
  }): Promise<ApiResponse<HybridVerifyData>> {
    return this.requestForm<ApiResponse<HybridVerifyData>>("/api/v2/pqc/hybrid/verify", {
      message: params.message,
      signature: params.signature,
      dilithium_pk: params.dilithiumPublicKey,
      ed25519_pk: params.ed25519PublicKey,
      require_both: params.requireBoth ?? true,
    });
  }

  async generateHybridCsr(params: {
    dilithiumPublicKey: string;
    dilithiumSecretKey: string;
    ed25519PublicKey: string;
    ed25519SecretKey: string;
    commonName?: string;
    organization?: string;
    country?: string;
    state?: string;
  }): Promise<ApiResponse<HybridCsrData>> {
    return this.requestForm<ApiResponse<HybridCsrData>>("/api/v2/pqc/hybrid/csr", {
      dilithium_pk: params.dilithiumPublicKey,
      dilithium_sk: params.dilithiumSecretKey,
      ed25519_pk: params.ed25519PublicKey,
      ed25519_sk: params.ed25519SecretKey,
      common_name: params.commonName ?? "example.com",
      organization: params.organization ?? "",
      country: params.country ?? "",
      state: params.state ?? "",
    });
  }

  async generateHybridKemKeypair(
    encoding: PqcEncoding = "base64",
  ): Promise<ApiResponse<HybridKemKeypairData>> {
    return this.requestForm<ApiResponse<HybridKemKeypairData>>("/api/v2/pqc/hybrid/kem/generate", {
      encoding,
    });
  }

  async encapsulateHybridKem(params: {
    kyberPublicKey: string;
    x25519PublicKey: string;
    encoding?: PqcEncoding;
  }): Promise<ApiResponse<HybridKemEncapsulationData>> {
    return this.requestForm<ApiResponse<HybridKemEncapsulationData>>("/api/v2/pqc/hybrid/kem/encapsulate", {
      kyber_public_key: params.kyberPublicKey,
      x25519_public_key: params.x25519PublicKey,
      encoding: params.encoding ?? "base64",
    });
  }

  async decapsulateHybridKem(params: {
    kyberPrivateKey: string;
    x25519PrivateKey: string;
    kyberCiphertext: string;
    x25519Ciphertext: string;
    encoding?: PqcEncoding;
  }): Promise<ApiResponse<HybridKemDecapsulationData>> {
    return this.requestForm<ApiResponse<HybridKemDecapsulationData>>("/api/v2/pqc/hybrid/kem/decapsulate", {
      kyber_private_key: params.kyberPrivateKey,
      x25519_private_key: params.x25519PrivateKey,
      kyber_ciphertext: params.kyberCiphertext,
      x25519_ciphertext: params.x25519Ciphertext,
      encoding: params.encoding ?? "base64",
    });
  }

  async getBillingUsage(): Promise<BillingUsageData> {
    return this.requestJson<BillingUsageData>("/api/v2/billing/usage");
  }

  async createVrfSeed(targetChain?: string): Promise<ApiResponse<VrfSeedData>> {
    return this.requestJson<ApiResponse<VrfSeedData>>("/api/v2/oracle/vrf/seed", {
      method: "POST",
      body: JSON.stringify(targetChain ? { target_chain: targetChain } : {}),
    });
  }

  async proveVrf(requestId: string, alpha: string): Promise<ApiResponse<VrfProveData>> {
    return this.requestJson<ApiResponse<VrfProveData>>("/api/v2/oracle/vrf/prove", {
      method: "POST",
      body: JSON.stringify({ request_id: requestId, alpha }),
    });
  }

  async revealVrf(requestId: string): Promise<ApiResponse<VrfRevealData>> {
    return this.requestJson<ApiResponse<VrfRevealData>>("/api/v2/oracle/vrf/reveal", {
      method: "POST",
      body: JSON.stringify({ request_id: requestId }),
    });
  }

  async verifyVrfProof(params: {
    commitment: string;
    alpha: string;
    output: string;
    seed: string;
  }): Promise<ApiResponse<VrfVerifyData>> {
    return this.requestJson<ApiResponse<VrfVerifyData>>("/api/v2/oracle/vrf/verify", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  private async requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = this.buildHeaders(init.headers, true);
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });
    if (!response.ok) {
      throw new QCryptApiError(response.status, await response.text());
    }
    return response.json() as Promise<T>;
  }

  private async requestForm<T>(path: string, form: Record<string, FormValue>): Promise<T> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(form)) {
      params.set(key, String(value));
    }

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.buildHeaders({ "Content-Type": "application/x-www-form-urlencoded" }, false),
      body: params.toString(),
    });

    if (!response.ok) {
      throw new QCryptApiError(response.status, await response.text());
    }
    return response.json() as Promise<T>;
  }

  private buildHeaders(headers: HeadersInit | undefined, defaultJson: boolean): Headers {
    const merged = new Headers(headers);
    if (defaultJson && !merged.has("Content-Type")) {
      merged.set("Content-Type", "application/json");
    }
    if (this.apiKey && !merged.has("X-API-Key")) {
      merged.set("X-API-Key", this.apiKey);
    }
    return merged;
  }
}
