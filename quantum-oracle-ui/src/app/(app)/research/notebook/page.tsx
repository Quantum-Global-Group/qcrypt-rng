'use client';

import React, { useMemo, useState } from 'react';
import {
  ResearchHeader,
  Panel,
  PanelHeader,
  PanelBody,
  Chip,
  GhostButton,
  SectionDivider,
} from '@/components/research/shared';
import { useExperimentLog } from '@/hooks/useExperimentLog';

const TYPE_COLORS: Record<string, string> = {
  qrng: 'text-primary',
  entropy_test: 'text-secondary',
  vrf_seed: 'text-primary',
  vrf_prove: 'text-primary',
  vrf_reveal: 'text-primary',
  vrf_verify: 'text-primary',
  kem_keygen: 'text-tertiary',
  kem_encap: 'text-tertiary',
  sig_sign: 'text-secondary',
  sig_verify: 'text-secondary',
  oracle_request: 'text-tertiary',
  pqc_benchmark: 'text-outline',
  hybrid_keygen: 'text-primary',
  hybrid_sign: 'text-primary',
  hybrid_verify: 'text-primary',
  hybrid_kem_keygen: 'text-tertiary',
  hybrid_kem_encap: 'text-tertiary',
  hybrid_kem_decap: 'text-tertiary',
  csr_gen: 'text-secondary',
  hqc_keygen: 'text-tertiary',
};

export default function NotebookPage() {
  const { entries, clear, exportJSON, exportNDJSON } = useExperimentLog();
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!filter) return entries;
    const q = filter.toLowerCase();
    return entries.filter(
      (e) =>
        e.type.toLowerCase().includes(q) ||
        e.page.toLowerCase().includes(q) ||
        JSON.stringify(e.data).toLowerCase().includes(q),
    );
  }, [entries, filter]);

  const typeGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    entries.forEach((e) => {
      groups[e.type] = (groups[e.type] ?? 0) + 1;
    });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  return (
    <div className="page-enter min-w-0">
      <ResearchHeader
        eyebrow="Research · Log"
        title="Experiment Log"
        description="Session record of research operations. Export as JSON or NDJSON for analysis or supplementary data."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] xl:gap-8 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <Panel>
            <PanelHeader
              title="Session log"
              right={
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <Chip variant="dim">{entries.length} entries</Chip>
                  <GhostButton onClick={exportJSON}>Export JSON</GhostButton>
                  <GhostButton onClick={exportNDJSON}>Export NDJSON</GhostButton>
                  <GhostButton onClick={clear} disabled={entries.length === 0}>
                    Clear
                  </GhostButton>
                </div>
              }
            />
            <PanelBody className="p-0">
              <div className="px-3 py-2 border-b border-outline-variant/40">
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter by type, page, or data…"
                  className="w-full bg-transparent border-none outline-none font-mono text-[10px] text-on-surface-variant placeholder:text-outline/50"
                />
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="py-10 text-center font-mono text-[10px] text-outline/60">
                    {entries.length === 0
                      ? 'No operations yet — run any research tool to start logging.'
                      : 'No entries match filter.'}
                  </div>
                ) : (
                  filtered.map((e) => (
                    <div
                      key={e.id}
                      className="flex gap-3 px-3 py-2 border-b border-outline-variant/30 hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="font-mono text-[9px] text-outline/60 shrink-0 mt-0.5 tabular-nums">
                        {e.timestamp.slice(11, 23)}
                      </span>
                      <span
                        className={`font-mono text-[9px] font-semibold uppercase shrink-0 ${TYPE_COLORS[e.type] ?? 'text-outline'}`}
                      >
                        {e.type}
                      </span>
                      <span className="font-mono text-[9px] text-on-surface-variant/70 truncate">
                        {JSON.stringify(e.data).slice(0, 100)}
                      </span>
                      {e.durationMs != null && (
                        <span className="font-mono text-[9px] text-outline/50 shrink-0 ml-auto">
                          {e.durationMs.toFixed(1)}ms
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </PanelBody>
          </Panel>
        </div>

        <div className="flex flex-col gap-4 min-w-0 xl:max-w-none">
          <Panel>
            <PanelHeader title="Operation counts" />
            <PanelBody className="py-2">
              {typeGroups.length === 0 ? (
                <p className="font-mono text-[9px] text-outline/60">no data</p>
              ) : (
                typeGroups.map(([type, count]) => (
                  <div key={type} className="flex justify-between py-1">
                    <span className={`font-mono text-[9px] ${TYPE_COLORS[type] ?? 'text-outline'}`}>{type}</span>
                    <span className="font-mono text-[9px] text-on-surface-variant">{count}</span>
                  </div>
                ))
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Citation format" />
            <PanelBody>
              <p className="font-mono text-[9px] text-outline/70 leading-relaxed">
                When citing results generated by this platform in a paper:
              </p>
              <SectionDivider />
              <div className="font-mono text-[9px] text-on-surface-variant leading-relaxed">
                QCrypt Research Platform v0.1. Post-quantum cryptography and quantum randomness research infrastructure.
                Session log exported {new Date().toISOString().slice(0, 10)}.
              </div>
              <SectionDivider />
              <GhostButton
                onClick={() =>
                  navigator.clipboard?.writeText(
                    'QCrypt Research Platform v0.1 — qcrypt-rng (quantum RNG, PQC, oracle).',
                  )
                }
              >
                Copy Citation
              </GhostButton>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
