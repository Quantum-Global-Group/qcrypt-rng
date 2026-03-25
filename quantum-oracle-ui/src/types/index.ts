export interface ApiResponse<T> {
  status: 'success' | 'error' | string;
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

export interface OracleBenchmarkResponse {
  benchmark: {
    samples_generated: number;
    total_time_ms: number;
    generation_only_time_ms: number;
    commitment_only_time_ms: number;
    avg_generation_time_ms: number;
    avg_commitment_time_ms: number;
    throughput_samples_per_sec: number;
    average_entropy_bits_per_sample: number;
  };
  performance_notes?: Record<string, string>;
}

export interface NetworkInfoResponse {
  network: {
    name: string;
    status: string;
    nodes_count: number;
    active_requests: number;
    uptime_hours: number;
  };
  quantum_hardware: {
    available_devices: string[];
    statuses: Record<string, unknown>;
    active_device: string | null;
  };
  performance: {
    total_randomness_generated: number;
    average_generation_time_ms: number;
    entropy_quality: {
      shannon_entropy: number;
      min_entropy: number;
      health_status: string;
    };
  };
  features: Record<string, boolean>;
  supported_chains: string[];
}

export interface QuantumStatsResponse {
  total_bytes_generated: number;
  total_generations: number;
  average_generation_time_ms: number;
  entropy_pool_size: number;
  backend: string;
  backend_status: string;
  uptime_seconds: number;
  api_version: string;
}

export type GenerateBytesResponse = ApiResponse<{
  bytes: string;
  format: string;
  length: number;
  entropy_bits: number;
}>;

export type GenerateKeyResponse = ApiResponse<Record<string, unknown>>;

export type GenerateUuidResponse = ApiResponse<string | string[]>;

export type GeneratePasswordResponse = ApiResponse<{
  password: string;
  length: number;
  strength: string;
  entropy_bits: number;
}>;

export type EncryptResponse = ApiResponse<{
  ciphertext: string;
  iv: string;
  tag: string;
  key: string;
  algorithm: string;
  quantum_enhanced: boolean;
  original_filename?: string;
  original_size?: number;
}>;

export type SignResponse = ApiResponse<{
  signature: string;
  public_key: string;
  algorithm: string;
  data_hash: string;
  quantum_enhanced: boolean;
}>;

export type VerifyResponse = ApiResponse<{
  valid: boolean;
  algorithm: string;
  data_integrity: string;
}>;

export type HashResponse = ApiResponse<{
  hash: string;
  salt: string;
  algorithm: string;
  iterations?: number | null;
  quantum_salt: boolean;
  entropy_bits: number;
}>;

export type GeneratePqcResponse = ApiResponse<{
  public_key: string;
  private_key: string;
  algorithm: string;
  nist_level: number;
  nist_security_level: number;
  encoding: string;
  key_sizes: {
    public_key_bytes: number;
    private_key_bytes: number;
  };
}>;

export type AssessThreatResponse = ApiResponse<{
  assessment: {
    status: string;
    qubits_to_break: string | number;
    time_to_break: string;
    risk_level: string;
    recommendation: string;
  };
  algorithm: string;
}>;

export type PqcSignResponse = ApiResponse<{
  signature: string;
  message: string;
  algorithm: string;
  encoding: string;
  signature_size_bytes: number;
}>;

export type PqcVerifyResponse = ApiResponse<{
  valid: boolean;
  message: string;
  algorithm: string;
  verification_time: number;
}>;

export interface QuantumEntropyResponse {
  shannon_entropy: number;
  min_entropy: number;
  chi_square_p_value: number;
  autocorrelation: number;
  bit_balance: number;
  health_status: string;
  pool_size: number;
  passed_tests: number | Record<string, boolean>;
}

export interface BatchGenerateResultItem {
  index: number;
  status: 'success' | 'error';
  bytes?: string;
  format?: string;
  length?: number;
  error?: string;
}

export interface HardwareDeviceStatus {
  device_id: string;
  device_type: string;
  connected: boolean;
  calibrated: boolean;
  last_calibration?: string | null;
  generation_count: number;
  error_rate: number;
}

export interface HardwareDevicesResponse {
  status: string;
  devices: HardwareDeviceStatus[];
  active_device: string | null;
  total_devices: number;
}

// VRF types
export interface VrfSeedResponse {
  request_id: string;
  commitment: string;
}

export interface VrfProveResponse {
  request_id: string;
  alpha: string;
  output: string;
  commitment: string;
}

export interface VrfRevealResponse {
  request_id: string;
  seed: string;
  commitment: string;
}

export interface VrfVerifyResponse {
  valid: boolean;
  commitment_valid: boolean;
  output_valid: boolean;
}

export type GenerateTokenResponse = ApiResponse<{
  token: string;
  token_type: string;
  expires_in: number | null;
  expires_at: string | null;
}>;

// Batch oracle types
export interface BatchOracleRequestItem {
  request_id: string;
  commitment?: string | null;
  estimated_completion_blocks?: number;
  fee_required?: number;
  status: string;
}

// Kyber KEM types
export interface KemKeypairResponse {
  public_key: string;
  private_key: string;
  algorithm: string;
  nist_level: number;
  encoding: string;
  key_sizes?: { public_key_bytes: number; private_key_bytes: number };
}

export interface KemEncapsulateResponse {
  ciphertext: string;
  shared_secret: string;
  algorithm: string;
  encoding: string;
  sizes?: { ciphertext_bytes: number; shared_secret_bytes: number };
}

export interface KemDecapsulateResponse {
  shared_secret: string;
  algorithm: string;
  encoding: string;
}

// Oracle fulfillment types
export interface FulfillmentChainConfig {
  chain: string;
  configured: boolean;
  rpc_url: string;
  chain_id: number;
  explorer_url: string;
}

export interface FulfillmentRequestStatus {
  request_id: string;
  chain: string;
  status: string;
  /** Some API responses use this field instead of `status`. */
  fulfillment_status?: string;
  commitment_hash?: string | null;
  reveal_tx_hash?: string | null;
  randomness?: string | null;
  explorer_url?: string;
  error?: string | null;
  created_at?: string;
}

export interface FulfillmentRequestItem {
  request_id: string;
  chain: string;
  status: string;
  contract_address?: string;
  created_at?: string;
}