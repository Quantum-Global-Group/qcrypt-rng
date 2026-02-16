import { useEffect, useState } from 'react';
import { checkHealth, getHardwareDevices, getOracleNetworkInfo, getOracleRequestStatus, getQuantumEntropy, getQuantumStats, reseedEntropyPool } from '@/utils/api';
import type { HardwareDevicesResponse, HealthResponse, NetworkInfoResponse, OracleStatusResponse, QuantumEntropyResponse, QuantumStatsResponse } from '@/types';
import { Badge, CopyButton, DownloadButton, InfoPopover, KVRow, MonoValue } from './ui';

const fmtUptime = (seconds: number | undefined) => {
  if (seconds == null) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const Collapsible = ({
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
          <span className="text-slate-500 text-xs shrink-0">{open ? '\u25BC' : '\u25B6'}</span>
          <h3 className="text-lg font-bold text-white truncate">{title}</h3>
        </button>
        {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
      </div>
      {open && <div className="space-y-4 pt-4">{children}</div>}
    </div>
  );
};

export const NetworkStatus = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [network, setNetwork] = useState<NetworkInfoResponse | null>(null);
  const [stats, setStats] = useState<QuantumStatsResponse | null>(null);
  const [entropy, setEntropy] = useState<QuantumEntropyResponse | null>(null);
  const [hardware, setHardware] = useState<HardwareDevicesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [reseeding, setReseeding] = useState(false);

  const [requestIdInput, setRequestIdInput] = useState('');
  const [statusResult, setStatusResult] = useState<OracleStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const refresh = async () => {
    setError(null);
    try {
      const [healthRes, networkRes, statsRes, entropyRes, hwRes] = await Promise.allSettled([
        checkHealth(),
        getOracleNetworkInfo(),
        getQuantumStats(),
        getQuantumEntropy(),
        getHardwareDevices(),
      ]);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
      if (networkRes.status === 'fulfilled') setNetwork(networkRes.value.data);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (entropyRes.status === 'fulfilled') setEntropy(entropyRes.value.data);
      if (hwRes.status === 'fulfilled') setHardware(hwRes.value);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load network status');
    } finally {
      setLoading(false);
    }
  };

  const handleReseed = async () => {
    setReseeding(true);
    try {
      await reseedEntropyPool();
      await refresh();
    } catch {
      // ignore
    } finally {
      setReseeding(false);
    }
  };

  const checkRequestStatus = async () => {
    if (!requestIdInput.trim()) return;
    setStatusError(null);
    setStatusResult(null);
    setStatusLoading(true);
    try {
      const response = await getOracleRequestStatus(requestIdInput.trim());
      setStatusResult(response.data);
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : 'Failed to check status');
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, []);

  const statusSnapshot = () =>
    JSON.stringify({ health, network, stats, entropy, hardware, timestamp: new Date().toISOString() }, null, 2);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 py-8">
        <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
        <span className="text-base">Loading network status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="error-banner">{error}</div>}

      {/* Platform Health (always open) */}
      <div className="section space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">Platform Health <InfoPopover title="Platform Health" description="Real-time health status of the API and quantum backend with auto-refresh every 15 seconds. Shows generation count and average latency." useCases={['Monitor system uptime', 'Track generation performance', 'Verify backend connectivity']} /></h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-slate-500">Auto-refresh 15s</span>
            </div>
            {lastRefresh && (
              <span className="text-xs text-slate-500">
                {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button onClick={refresh} className="btn-secondary">Refresh</button>
            <CopyButton value={statusSnapshot()} label="Copy Status" />
            <DownloadButton filename={`platform_status_${Date.now()}.json`} content={statusSnapshot()} label="Download" />
          </div>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${health?.status === 'healthy' ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className="text-base text-white">{health?.status ?? '-'}</span>
            <span className="text-sm text-slate-400">API</span>
          </div>
          <div className="w-px h-6 bg-slate-700/40" />
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${stats?.backend_status === 'active' ? 'bg-green-500' : 'bg-yellow-400'}`} />
            <span className="text-base text-white">{stats?.backend_status ?? '-'}</span>
            <span className="text-sm text-slate-400">Backend</span>
          </div>
          <div className="w-px h-6 bg-slate-700/40" />
          <div>
            <span className="text-base text-white font-semibold">{stats?.total_generations ?? 0}</span>
            <span className="text-sm text-slate-400 ml-2">Generations</span>
          </div>
          <div className="w-px h-6 bg-slate-700/40" />
          <div>
            <span className="text-base text-white font-semibold">{stats?.average_generation_time_ms?.toFixed?.(2) ?? 0}ms</span>
            <span className="text-sm text-slate-400 ml-2">Avg Time</span>
          </div>
        </div>
      </div>

      {/* Oracle Network + Entropy Quality (always open) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="section space-y-2">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">Oracle Network <InfoPopover title="Oracle Network" description="Oracle node count, active randomness requests, and network uptime metrics for the quantum randomness oracle infrastructure." useCases={['Monitor oracle availability', 'Track active requests', 'Verify network health']} /></h3>
          <KVRow label="Name" value={network?.network.name ?? '-'} />
          <KVRow label="Status" value={<Badge label={network?.network.status ?? '-'} />} />
          <KVRow label="Nodes" value={network?.network.nodes_count ?? '-'} />
          <KVRow label="Active Requests" value={network?.network.active_requests ?? '-'} />
          <KVRow label="Uptime" value={`${network?.network.uptime_hours ?? '-'} hours`} />
          <KVRow label="Backend Uptime" value={fmtUptime(stats?.uptime_seconds)} />
          <KVRow label="API Version" value={stats?.api_version ?? '-'} />
        </div>

        <div className="section space-y-2">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">Entropy Quality <InfoPopover title="Entropy Quality" description="Shannon and min entropy measurements from the quantum random source. Higher values indicate better randomness quality. Health status summarizes overall entropy pool condition." useCases={['Verify randomness quality', 'Monitor entropy pool health', 'Compliance auditing']} /></h3>
          <KVRow label="Shannon Entropy" value={network?.performance.entropy_quality.shannon_entropy.toFixed?.(4) ?? '-'} mono />
          <KVRow label="Min Entropy" value={network?.performance.entropy_quality.min_entropy.toFixed?.(4) ?? '-'} mono />
          <KVRow label="Health" value={<Badge label={network?.performance.entropy_quality.health_status ?? '-'} />} />
          <KVRow label="Total Bytes Generated" value={stats?.total_bytes_generated ?? '-'} />
          <KVRow label="Entropy Pool Size" value={stats?.entropy_pool_size ?? '-'} />
          <KVRow label="Total Randomness" value={network?.performance.total_randomness_generated ?? '-'} />
        </div>
      </div>

      {/* Entropy and Quantum Source (collapsible, default open) */}
      {(entropy || stats) && (
        <Collapsible
          title={<span className="flex items-center gap-2">Entropy and Quantum Source <InfoPopover title="Entropy and Quantum Source" description="Detailed entropy pool statistics including chi-square tests, autocorrelation, and bit balance. Shows backend type (simulation vs hardware) and allows reseeding." useCases={['Deep entropy analysis', 'Reseed entropy pool', 'Verify quantum source type']} /></span>}
          defaultOpen
          actions={
            <div className="flex gap-2">
              {entropy && <CopyButton value={JSON.stringify(entropy, null, 2)} label="Copy Entropy" />}
              <button onClick={handleReseed} disabled={reseeding} className="btn-secondary text-sm">
                {reseeding ? 'Reseeding...' : 'Reseed Pool'}
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-slate-400 block">Backend</span>
              <span className="text-base text-white font-semibold">{stats?.backend ?? '-'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Status</span>
              <Badge label={stats?.backend_status ?? '-'} />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Pool Size</span>
              <span className="text-base text-white font-semibold">{entropy?.pool_size ?? stats?.entropy_pool_size ?? '-'}</span>
            </div>
          </div>
          {entropy && (
            <div className="space-y-2 border-t border-slate-700/30 pt-3">
              <KVRow label="Shannon Entropy" value={entropy.shannon_entropy.toFixed(4)} mono />
              <KVRow label="Min Entropy" value={entropy.min_entropy.toFixed(4)} mono />
              <KVRow label="Chi-Square p-value" value={entropy.chi_square_p_value.toFixed(4)} mono />
              <KVRow label="Autocorrelation" value={entropy.autocorrelation.toFixed(4)} mono />
              <KVRow label="Bit Balance" value={entropy.bit_balance.toFixed(4)} mono />
              <KVRow label="Health" value={<Badge label={entropy.health_status} />} />
              <KVRow label="Tests Passed" value={typeof entropy.passed_tests === 'object' ? Object.values(entropy.passed_tests).filter(Boolean).length + '/' + Object.keys(entropy.passed_tests).length : String(entropy.passed_tests)} />
            </div>
          )}
        </Collapsible>
      )}

      {/* Quantum Hardware (collapsible, default collapsed) */}
      <Collapsible title={<span className="flex items-center gap-2">Quantum Hardware <InfoPopover title="Quantum Hardware" description="Connected quantum devices (photonic, superconducting) and their generation statistics. Shows simulation mode when no hardware is connected." useCases={['Monitor hardware connections', 'Track device performance', 'Verify active quantum source']} /></span>}>
        {hardware && hardware.total_devices > 0 ? (
          <>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-xs text-slate-400 block">Devices</span>
                <span className="text-base text-white font-semibold">{hardware.total_devices}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Active Device</span>
                <span className="text-base text-white font-semibold">{hardware.active_device ?? 'None'}</span>
              </div>
            </div>
            <div className="space-y-2 border-t border-slate-700/30 pt-3">
              {hardware.devices.map((d) => (
                <div key={d.device_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${d.connected ? 'bg-green-500' : 'bg-slate-500'}`} />
                    <span className="text-sm text-white">{d.device_id}</span>
                    <span className="text-xs text-slate-400">({d.device_type})</span>
                  </div>
                  <span className="text-xs text-slate-400">{d.generation_count} gen</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">
            No quantum hardware devices connected. The platform currently uses quantum simulation. Real quantum devices (photonic, superconducting) can be connected when available.
          </p>
        )}
        {network?.quantum_hardware && (
          <div className="space-y-2 border-t border-slate-700/30 pt-3">
            <KVRow label="Available Types" value={network.quantum_hardware.available_devices.join(', ') || 'None'} />
            <KVRow label="Active Device" value={network.quantum_hardware.active_device ?? 'None (simulation)'} />
          </div>
        )}
      </Collapsible>

      {/* Supported Chains (collapsible, default collapsed) */}
      {(network?.supported_chains ?? []).length > 0 && (
        <Collapsible title={<span className="flex items-center gap-2">Supported Chains <InfoPopover title="Supported Chains" description="Blockchain networks compatible with the quantum randomness oracle. Each chain can receive quantum-generated randomness via the oracle protocol." useCases={['Check chain compatibility', 'Plan multi-chain deployment', 'Verify oracle coverage']} /></span>}>
          <div className="flex flex-wrap gap-2">
            {network!.supported_chains.map((chain) => (
              <span key={chain} className="status-neutral">{chain}</span>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Feature Flags (collapsible, default collapsed) */}
      {network?.features && Object.keys(network.features).length > 0 && (
        <Collapsible title={<span className="flex items-center gap-2">Features <InfoPopover title="Features" description="Platform feature flags showing which capabilities are currently enabled on the oracle network." useCases={['Check available features', 'Verify platform capabilities']} /></span>}>
          {Object.entries(network.features).map(([key, enabled]) => (
            <KVRow
              key={key}
              label={key.replace(/_/g, ' ')}
              value={<Badge label={enabled ? 'Enabled' : 'Disabled'} />}
            />
          ))}
        </Collapsible>
      )}

      {/* Oracle Request Status (always open) */}
      <div className="section space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">Oracle Request Status <InfoPopover title="Oracle Request Status" description="Look up the fulfillment status of a quantum randomness request by ID. Shows commitment, randomness value (when fulfilled), block number, and entropy bits." useCases={['Track request fulfillment', 'Verify delivered randomness', 'Debug oracle requests']} /></h2>
        <p className="text-sm text-slate-400">Check the status of a quantum randomness request by ID. The oracle uses a commit-reveal scheme so randomness is verifiable and cannot be manipulated before delivery.</p>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Request ID</label>
            <input
              type="text"
              value={requestIdInput}
              onChange={(e) => setRequestIdInput(e.target.value)}
              placeholder="oracle_req_..."
              className="field w-full"
            />
          </div>
          <button onClick={checkRequestStatus} disabled={!requestIdInput.trim() || statusLoading} className="btn-primary">
            {statusLoading ? 'Checking...' : 'Check Status'}
          </button>
        </div>
        {statusError && (
          <p className="text-sm text-red-400">{statusError}</p>
        )}
        {statusResult && (
          <div className="space-y-2 pt-2 border-t border-slate-700/30">
            <div className="flex justify-end gap-2">
              <CopyButton value={JSON.stringify(statusResult, null, 2)} label="Copy" />
              <DownloadButton filename={`oracle_status_${requestIdInput}_${Date.now()}.json`} content={JSON.stringify(statusResult, null, 2)} label="Download" />
            </div>
            <KVRow label="Status" value={<Badge label={statusResult.status} />} />
            <KVRow label="Fulfilled" value={statusResult.fulfilled ? 'Yes' : 'No'} />
            <KVRow label="Block Number" value={statusResult.block_number} />
            {statusResult.entropy_bits != null && (
              <KVRow label="Entropy" value={`${statusResult.entropy_bits} bits`} />
            )}
            {statusResult.commitment && (
              <div className="flex items-baseline justify-between gap-4 py-2 border-b border-slate-700/25">
                <span className="text-sm text-slate-400 shrink-0">Commitment</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-slate-200">{statusResult.commitment.slice(0, 16)}...</code>
                  <CopyButton value={statusResult.commitment} label="Copy" />
                </div>
              </div>
            )}
            {statusResult.randomness && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Randomness</span>
                  <DownloadButton filename={`randomness_${requestIdInput}_${Date.now()}.txt`} content={statusResult.randomness} label="Download" />
                </div>
                <MonoValue value={statusResult.randomness} truncate={120} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
