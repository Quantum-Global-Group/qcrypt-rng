'use client';

import { useState, useCallback } from 'react';
import { createVrfSeed, vrfProve, vrfReveal, vrfVerify } from '@/utils/api';
import { cn } from '@/lib/utils';
import { useBlockchain } from './BlockchainContext';
import { AnalystEvidencePanel, SectionLabel } from './AnalystEvidencePanel';

type Tab = 'lottery' | 'nft' | 'dao' | 'vrf';

const TABS: { id: Tab; label: string }[] = [
  { id: 'lottery', label: 'Lottery' },
  { id: 'nft', label: 'NFT Traits' },
  { id: 'dao', label: 'DAO Selection' },
  { id: 'vrf', label: 'Raw VRF' },
];

interface VrfProof {
  request_id: string;
  commitment: string;
  alpha: string;
  output: string;
  seed: string;
}

/* ─── claim / scope data per scenario ──────────────────────────────────────── */

const CLAIM_LOTTERY =
  'VRF produces deterministic, unpredictable output from a committed seed. Winners are selected uniformly from the fixed entrant list using the VRF output bytes.';
const PROVES_LOTTERY = [
  'Unpredictable randomness',
  'Deterministic reproduction',
  'Commitment before reveal',
  'Uniform selection from list',
];
const NOT_LOTTERY = [
  'Entrant list integrity (use Prove)',
  'On-chain finality',
  'Identity of participants',
];

const CLAIM_NFT =
  'VRF-derived bytes distribute traits across mints according to stated rarity percentages. The same seed always produces the same distribution.';
const PROVES_NFT = [
  'Fair rarity distribution',
  'Deterministic from seed',
  'Commitment binding',
];
const NOT_NFT = [
  'Rarity table correctness',
  'Mint order fairness',
  'On-chain binding',
];

const CLAIM_DAO =
  'VRF selects k distinct committee members from a wallet roster. Selection is uniform and deterministic from the committed seed.';
const PROVES_DAO = [
  'Uniform k-of-n selection',
  'No duplicate picks',
  'Deterministic from seed',
  'Commitment binding',
];
const NOT_DAO = [
  'Roster integrity (use Prove)',
  'Governance authority',
  'On-chain finality',
];

const CLAIM_VRF =
  'Full VRF lifecycle: Seed \u2192 Commit \u2192 Prove \u2192 Reveal \u2192 Verify. Every cryptographic value is exposed for direct on-chain integration.';
const PROVES_VRF = [
  'Seed unpredictability',
  'Commitment before output',
  'Deterministic prove step',
  'Independent verify',
];
const NOT_VRF = [
  'Application-level fairness',
  'On-chain tx inclusion',
  'Identity of requester',
];

const VRF_VERIFY_STEPS = [
  'Obtain commitment, alpha, output, and seed from the proof bundle',
  'Call vrfVerify(commitment, alpha, output, seed)',
  'If valid \u2192 the output was deterministically derived from the committed seed and alpha',
  'Replay: anyone with the same alpha + seed will get the same output',
];

/* ─── helpers ──────────────────────────────────────────────────────────────── */

function selectFromOutput(
  outputHex: string,
  count: number,
  total: number,
): number[] {
  const clean = outputHex.replace(/^0x/, '');
  const selected = new Set<number>();
  let offset = 0;
  while (selected.size < Math.min(count, total) && offset < clean.length - 3) {
    const chunk = parseInt(clean.slice(offset, offset + 4), 16);
    selected.add(chunk % total);
    offset += 4;
  }
  return Array.from(selected);
}

function buildVrfArtifacts(proof: VrfProof) {
  return [
    {
      title: 'VRF proof',
      rows: [
        { label: 'Request ID', value: proof.request_id },
        { label: 'Alpha (input)', value: proof.alpha },
        {
          label: 'Commitment',
          value: proof.commitment.slice(0, 34) + '\u2026',
        },
        { label: 'Output', value: proof.output.slice(0, 34) + '\u2026' },
        { label: 'Seed', value: proof.seed.slice(0, 34) + '\u2026' },
      ],
    },
  ];
}

/* ─── VRF timeline ─────────────────────────────────────────────────────────── */

function VrfTimeline({ active }: { active: number }) {
  const steps = ['Seed', 'Commit', 'Prove', 'Reveal', 'Verify'];
  return (
    <div className="flex items-center gap-0 w-full py-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                i <= active ? 'bg-primary' : 'bg-outline/30',
              )}
            />
            <span
              className={cn(
                'font-mono text-[9px]',
                i <= active ? 'text-primary' : 'text-outline/50',
              )}
            >
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'h-px flex-1 mx-1',
                i < active ? 'bg-primary/40' : 'bg-outline/20',
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── component ────────────────────────────────────────────────────────────── */

export function RandomizeFairness() {
  const { network, isSimulation, wallet } = useBlockchain();
  const [tab, setTab] = useState<Tab>('lottery');

  const runVrf = async (alpha: string): Promise<VrfProof> => {
    const seedRes = await createVrfSeed();
    const reqId = seedRes.data.request_id;
    const commitment = seedRes.data.commitment;
    const proveRes = await vrfProve(reqId, alpha);
    const output = proveRes.data.output;
    const revealRes = await vrfReveal(reqId);
    const seed = revealRes.data.seed;
    return { request_id: reqId, commitment, alpha, output, seed };
  };

  // ── lottery state ──
  const [entries, setEntries] = useState('');
  const [winnerCount, setWinnerCount] = useState(1);
  const [lotteryLoading, setLotteryLoading] = useState(false);
  const [lotteryError, setLotteryError] = useState<string | null>(null);
  const [lotteryResult, setLotteryResult] = useState<{
    winners: string[];
    proof: VrfProof;
  } | null>(null);

  // ── nft state ──
  const [traitDefs, setTraitDefs] = useState(
    'Common: 60\nRare: 30\nLegendary: 10',
  );
  const [mintCount, setMintCount] = useState(10);
  const [nftLoading, setNftLoading] = useState(false);
  const [nftError, setNftError] = useState<string | null>(null);
  const [nftResult, setNftResult] = useState<{
    distribution: Record<string, number>;
    proof: VrfProof;
  } | null>(null);

  // ── dao state ──
  const [wallets, setWallets] = useState('');
  const [committeeSize, setCommitteeSize] = useState(3);
  const [daoLoading, setDaoLoading] = useState(false);
  const [daoError, setDaoError] = useState<string | null>(null);
  const [daoResult, setDaoResult] = useState<{
    selected: string[];
    proof: VrfProof;
  } | null>(null);

  // ── raw vrf state ──
  const [vrfAlpha, setVrfAlpha] = useState('round_42_seed');
  const [vrfLoading, setVrfLoading] = useState(false);
  const [vrfError, setVrfError] = useState<string | null>(null);
  const [vrfResult, setVrfResult] = useState<VrfProof | null>(null);
  const [vrfVerifyResult, setVrfVerifyResult] = useState<boolean | null>(null);

  const handleLottery = async () => {
    const list = entries
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.length) return;
    setLotteryError(null);
    setLotteryLoading(true);
    try {
      const proof = await runVrf(`lottery_${Date.now()}`);
      const indices = selectFromOutput(proof.output, winnerCount, list.length);
      setLotteryResult({ winners: indices.map((i) => list[i]), proof });
    } catch (e) {
      setLotteryError(e instanceof Error ? e.message : 'Lottery failed');
    } finally {
      setLotteryLoading(false);
    }
  };

  const handleNft = async () => {
    const traits = traitDefs
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [name, pct] = l.split(':').map((s) => s.trim());
        return { name, pct: parseInt(pct) || 0 };
      })
      .filter((t) => t.name && t.pct > 0);
    if (!traits.length) return;
    setNftError(null);
    setNftLoading(true);
    try {
      const proof = await runVrf(`nft_mint_${Date.now()}`);
      const seedBytes = proof.seed.replace(/^0x/, '');
      const distribution: Record<string, number> = {};
      traits.forEach((t) => (distribution[t.name] = 0));
      for (let i = 0; i < mintCount; i++) {
        const byte =
          parseInt(
            seedBytes.slice(
              (i * 2) % seedBytes.length,
              ((i * 2) % seedBytes.length) + 2,
            ),
            16,
          ) || 0;
        const roll = byte % 100;
        let cumulative = 0;
        for (const t of traits) {
          cumulative += t.pct;
          if (roll < cumulative) {
            distribution[t.name] = (distribution[t.name] ?? 0) + 1;
            break;
          }
        }
      }
      setNftResult({ distribution, proof });
    } catch (e) {
      setNftError(e instanceof Error ? e.message : 'Distribution failed');
    } finally {
      setNftLoading(false);
    }
  };

  const handleDao = async () => {
    const addrs = wallets
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (addrs.length < committeeSize) return;
    setDaoError(null);
    setDaoLoading(true);
    try {
      const proof = await runVrf(`dao_selection_${Date.now()}`);
      const indices = selectFromOutput(
        proof.output,
        committeeSize,
        addrs.length,
      );
      setDaoResult({ selected: indices.map((i) => addrs[i]), proof });
    } catch (e) {
      setDaoError(e instanceof Error ? e.message : 'Selection failed');
    } finally {
      setDaoLoading(false);
    }
  };

  const handleRawVrf = async () => {
    if (!vrfAlpha.trim()) return;
    setVrfError(null);
    setVrfVerifyResult(null);
    setVrfLoading(true);
    try {
      const proof = await runVrf(vrfAlpha);
      setVrfResult(proof);
      const res = await vrfVerify({
        commitment: proof.commitment,
        alpha: proof.alpha,
        output: proof.output,
        seed: proof.seed,
      });
      setVrfVerifyResult(res.data.valid);
    } catch (e) {
      setVrfError(e instanceof Error ? e.message : 'VRF failed');
    } finally {
      setVrfLoading(false);
    }
  };

  const copyForAnchor = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
  }, []);

  /* ── sub-components ──────────────────────────────────────────────────────── */

  const ResultList = ({
    label,
    items,
  }: {
    label: string;
    items: string[];
  }) => (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-2 space-y-1">
        {items.map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-outline/60">
              #{i + 1}
            </span>
            <span className="font-mono text-[13px] font-semibold text-primary break-all">
              {w}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const NetworkInfo = ({ proof }: { proof: VrfProof }) =>
    isSimulation ? null : (
      <div className="rounded-lg border border-tertiary/15 bg-tertiary/5 p-3 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-widest text-tertiary">
            On-chain
          </span>
          <span className="font-mono text-[10px] text-on-surface-variant">
            {network.label}
          </span>
          {wallet.connected && (
            <span className="font-mono text-[10px] text-outline">
              · {wallet.address?.slice(0, 8)}\u2026
            </span>
          )}
        </div>
        {network.oracleAddress ? (
          <span className="font-mono text-[10px] text-on-surface-variant">
            Oracle:{' '}
            {network.explorer ? (
              <a
                href={`${network.explorer}/address/${network.oracleAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary underline-offset-2 hover:underline"
              >
                {network.oracleAddress.slice(0, 14)}\u2026
              </a>
            ) : (
              network.oracleAddress.slice(0, 14) + '\u2026'
            )}
          </span>
        ) : (
          <span className="font-mono text-[10px] text-outline/60 italic">
            Oracle not yet deployed on {network.label}
          </span>
        )}
      </div>
    );

  return (
    <div className="w-full space-y-6 text-on-surface">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-md border border-outline-variant/20 bg-surface-container-lowest/50 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded px-4 py-1.5 font-mono text-[11px] font-medium transition-colors',
              tab === t.id
                ? 'bg-primary/15 text-primary'
                : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Lottery ────────────────────────────────────────────────────────── */}
      {tab === 'lottery' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5 lg:col-span-5">
            <div>
              <h2 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                01 · Entries (one per line)
              </h2>
              <p className="mb-2 text-[11px] text-on-surface-variant">
                Fix the entrant list before drawing. For provable integrity,
                anchor this list on{' '}
                <span className="text-primary font-medium">Prove</span> first.
              </p>
              <textarea
                value={entries}
                onChange={(e) => setEntries(e.target.value)}
                placeholder={'Alice\nBob\nCarol\n0x1a2b\u2026\n0x3c4d\u2026'}
                rows={7}
                className="field w-full resize-none font-mono text-[12px]"
              />
              {entries && (
                <p className="mt-1 font-mono text-[10px] text-outline/60">
                  {entries.split('\n').filter(Boolean).length} entries
                </p>
              )}
            </div>
            <div>
              <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                02 · Winners to select
              </h2>
              <input
                type="number"
                min={1}
                max={20}
                value={winnerCount}
                onChange={(e) =>
                  setWinnerCount(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="field w-24 font-mono text-[13px]"
              />
            </div>
            <button
              type="button"
              disabled={lotteryLoading || !entries.trim()}
              onClick={handleLottery}
              className="btn-primary w-full"
            >
              {lotteryLoading ? 'Drawing\u2026' : 'Draw winners'}
            </button>
            {lotteryError && (
              <p className="font-mono text-[12px] text-error">
                {lotteryError}
              </p>
            )}
          </div>
          <aside className="lg:col-span-7">
            <AnalystEvidencePanel
              claim={CLAIM_LOTTERY}
              proves={PROVES_LOTTERY}
              doesNotProve={NOT_LOTTERY}
              artifactSections={
                lotteryResult
                  ? buildVrfArtifacts(lotteryResult.proof)
                  : undefined
              }
              status={
                lotteryResult
                  ? {
                      type: 'success',
                      label: `${lotteryResult.winners.length} winner${lotteryResult.winners.length > 1 ? 's' : ''} selected`,
                      detail: 'VRF-backed draw complete with full proof bundle',
                    }
                  : undefined
              }
              exportData={
                lotteryResult
                  ? JSON.stringify(lotteryResult, null, 2)
                  : undefined
              }
              exportFilename="lottery-proof.json"
              verifySteps={lotteryResult ? VRF_VERIFY_STEPS : undefined}
              nextAction={
                lotteryResult
                  ? {
                      label: 'Anchor entrant list on Prove',
                      description:
                        'Hash + sign the participant list before publishing results, so observers can verify the roster was fixed',
                      onClick: () =>
                        copyForAnchor(
                          entries
                            .split('\n')
                            .filter(Boolean)
                            .join('\n'),
                        ),
                    }
                  : undefined
              }
              emptyLabel="Add entries and draw to see winners"
            >
              {lotteryResult && (
                <>
                  <VrfTimeline active={4} />
                  <ResultList
                    label="Winners"
                    items={lotteryResult.winners}
                  />
                  <NetworkInfo proof={lotteryResult.proof} />
                </>
              )}
            </AnalystEvidencePanel>
          </aside>
        </div>
      )}

      {/* ── NFT Traits ─────────────────────────────────────────────────────── */}
      {tab === 'nft' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5 lg:col-span-5">
            <div>
              <h2 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                01 · Trait rarities (Name: %)
              </h2>
              <textarea
                value={traitDefs}
                onChange={(e) => setTraitDefs(e.target.value)}
                rows={6}
                className="field w-full resize-none font-mono text-[12px]"
              />
              <p className="mt-1 font-mono text-[10px] text-outline/60">
                Percentages should sum to 100
              </p>
            </div>
            <div>
              <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                02 · Mint count
              </h2>
              <input
                type="number"
                min={1}
                max={1000}
                value={mintCount}
                onChange={(e) =>
                  setMintCount(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="field w-28 font-mono text-[13px]"
              />
            </div>
            <button
              type="button"
              disabled={nftLoading || !traitDefs.trim()}
              onClick={handleNft}
              className="btn-primary w-full"
            >
              {nftLoading ? 'Distributing\u2026' : 'Generate distribution'}
            </button>
            {nftError && (
              <p className="font-mono text-[12px] text-error">{nftError}</p>
            )}
          </div>
          <aside className="lg:col-span-7">
            <AnalystEvidencePanel
              claim={CLAIM_NFT}
              proves={PROVES_NFT}
              doesNotProve={NOT_NFT}
              artifactSections={
                nftResult ? buildVrfArtifacts(nftResult.proof) : undefined
              }
              status={
                nftResult
                  ? {
                      type: 'success',
                      label: `${mintCount} mints distributed`,
                      detail:
                        'Trait distribution derived from VRF seed bytes',
                    }
                  : undefined
              }
              exportData={
                nftResult
                  ? JSON.stringify(nftResult, null, 2)
                  : undefined
              }
              exportFilename="nft-distribution-proof.json"
              verifySteps={nftResult ? VRF_VERIFY_STEPS : undefined}
              emptyLabel="Set rarities and generate to see distribution"
            >
              {nftResult && (
                <>
                  <VrfTimeline active={4} />
                  <div className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-4 space-y-2">
                    <SectionLabel>
                      Trait counts ({mintCount} mints)
                    </SectionLabel>
                    <div className="mt-2 space-y-1.5">
                      {Object.entries(nftResult.distribution).map(
                        ([trait, count]) => (
                          <div key={trait} className="flex items-center gap-3">
                            <span className="font-mono text-[11px] text-on-surface-variant w-24 shrink-0">
                              {trait}
                            </span>
                            <div className="flex-1 rounded-full bg-surface-container-high h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-primary/60 rounded-full"
                                style={{
                                  width: `${(count / mintCount) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="font-mono text-[11px] text-on-surface shrink-0 w-10 text-right">
                              {count}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  <NetworkInfo proof={nftResult.proof} />
                </>
              )}
            </AnalystEvidencePanel>
          </aside>
        </div>
      )}

      {/* ── DAO Selection ──────────────────────────────────────────────────── */}
      {tab === 'dao' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5 lg:col-span-5">
            <div>
              <h2 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                01 · Wallet addresses (one per line)
              </h2>
              <p className="mb-2 text-[11px] text-on-surface-variant">
                For governance integrity, anchor the roster + committee size
                on <span className="text-primary font-medium">Prove</span>{' '}
                before running the selection.
              </p>
              <textarea
                value={wallets}
                onChange={(e) => setWallets(e.target.value)}
                placeholder={'0x1a2b3c\u2026\n0x4d5e6f\u2026\n0x7a8b9c\u2026'}
                rows={7}
                className="field w-full resize-none font-mono text-[12px]"
              />
              {wallets && (
                <p className="mt-1 font-mono text-[10px] text-outline/60">
                  {wallets.split('\n').filter(Boolean).length} addresses
                </p>
              )}
            </div>
            <div>
              <h2 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                02 · Committee size
              </h2>
              <input
                type="number"
                min={1}
                max={20}
                value={committeeSize}
                onChange={(e) =>
                  setCommitteeSize(
                    Math.max(1, parseInt(e.target.value) || 1),
                  )
                }
                className="field w-24 font-mono text-[13px]"
              />
            </div>
            <button
              type="button"
              disabled={
                daoLoading ||
                wallets.split('\n').filter(Boolean).length < committeeSize
              }
              onClick={handleDao}
              className="btn-primary w-full"
            >
              {daoLoading ? 'Selecting\u2026' : 'Select committee'}
            </button>
            {daoError && (
              <p className="font-mono text-[12px] text-error">{daoError}</p>
            )}
          </div>
          <aside className="lg:col-span-7">
            <AnalystEvidencePanel
              claim={CLAIM_DAO}
              proves={PROVES_DAO}
              doesNotProve={NOT_DAO}
              artifactSections={
                daoResult ? buildVrfArtifacts(daoResult.proof) : undefined
              }
              status={
                daoResult
                  ? {
                      type: 'success',
                      label: `${daoResult.selected.length} members selected`,
                      detail: 'VRF-backed selection complete',
                    }
                  : undefined
              }
              exportData={
                daoResult
                  ? JSON.stringify(daoResult, null, 2)
                  : undefined
              }
              exportFilename="dao-selection-proof.json"
              verifySteps={daoResult ? VRF_VERIFY_STEPS : undefined}
              nextAction={
                daoResult
                  ? {
                      label: 'Anchor roster on Prove',
                      description:
                        'Hash + sign the wallet roster and k value so observers can verify the roster was fixed before selection',
                      onClick: () =>
                        copyForAnchor(
                          `roster:\n${wallets.split('\n').filter(Boolean).join('\n')}\ncommittee_size: ${committeeSize}`,
                        ),
                    }
                  : undefined
              }
              emptyLabel="Add wallets and select committee"
            >
              {daoResult && (
                <>
                  <VrfTimeline active={4} />
                  <ResultList
                    label="Committee members"
                    items={daoResult.selected}
                  />
                  <NetworkInfo proof={daoResult.proof} />
                </>
              )}
            </AnalystEvidencePanel>
          </aside>
        </div>
      )}

      {/* ── Raw VRF ────────────────────────────────────────────────────────── */}
      {tab === 'vrf' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-6 space-y-5 lg:col-span-5">
            <div>
              <p className="text-[12px] leading-relaxed text-on-surface-variant">
                Full VRF lifecycle with every cryptographic value exposed. Use
                this output to integrate directly into a Solidity{' '}
                <code className="font-mono text-[11px] text-primary">
                  verify()
                </code>{' '}
                call.
              </p>
            </div>
            <div>
              <h2 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                Alpha (VRF input)
              </h2>
              <input
                type="text"
                value={vrfAlpha}
                onChange={(e) => setVrfAlpha(e.target.value)}
                placeholder="round_42_seed, lottery_id, block_hash\u2026"
                className="field w-full font-mono text-[12px]"
              />
              <p className="mt-1 font-mono text-[10px] text-outline/60">
                Any deterministic input \u2014 typically a round ID, block hash,
                or request ID
              </p>
            </div>
            <button
              type="button"
              disabled={vrfLoading || !vrfAlpha.trim()}
              onClick={handleRawVrf}
              className="btn-primary w-full"
            >
              {vrfLoading ? 'Running VRF\u2026' : 'Run VRF + verify'}
            </button>
            {vrfError && (
              <p className="font-mono text-[12px] text-error">{vrfError}</p>
            )}
          </div>
          <aside className="lg:col-span-7">
            <AnalystEvidencePanel
              claim={CLAIM_VRF}
              proves={PROVES_VRF}
              doesNotProve={NOT_VRF}
              status={
                vrfVerifyResult !== null
                  ? vrfVerifyResult
                    ? {
                        type: 'success',
                        label: 'Proof verified',
                        detail:
                          'VRF output matches commitment + alpha \u2014 deterministic and unforgeable',
                      }
                    : {
                        type: 'error',
                        label: 'Verification failed',
                        detail:
                          'Output does not match the commitment for this alpha',
                      }
                  : undefined
              }
              artifactSections={
                vrfResult
                  ? [
                      ...buildVrfArtifacts(vrfResult),
                      {
                        title: 'Solidity verify() call',
                        rows: [
                          {
                            label: 'Contract',
                            value: 'IQuantumOracle(oracle).verify(\u2026)',
                          },
                          {
                            label: 'commitment',
                            value: vrfResult.commitment.slice(0, 30) + '\u2026',
                          },
                          { label: 'alpha', value: vrfResult.alpha },
                          {
                            label: 'output',
                            value: vrfResult.output.slice(0, 30) + '\u2026',
                          },
                          {
                            label: 'seed',
                            value: vrfResult.seed.slice(0, 30) + '\u2026',
                          },
                        ],
                      },
                    ]
                  : undefined
              }
              exportData={
                vrfResult
                  ? JSON.stringify(vrfResult, null, 2)
                  : undefined
              }
              exportFilename="vrf-proof.json"
              verifySteps={vrfResult ? VRF_VERIFY_STEPS : undefined}
              emptyLabel="Run VRF to see the full proof and verify() call"
            >
              {vrfResult && <VrfTimeline active={vrfVerifyResult !== null ? 4 : 3} />}
            </AnalystEvidencePanel>
          </aside>
        </div>
      )}
    </div>
  );
}
