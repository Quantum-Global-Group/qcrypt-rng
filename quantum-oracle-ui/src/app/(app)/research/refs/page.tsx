import { ResearchHeader, Panel, PanelHeader, PanelBody } from '@/components/research/shared';

const REFS = [
  { name: 'NIST FIPS 203 (ML-KEM)', note: 'Module-lattice key encapsulation' },
  { name: 'NIST FIPS 204 (ML-DSA)', note: 'Module-lattice signatures' },
  { name: 'NIST FIPS 205 (SLH-DSA)', note: 'Stateless hash-based signatures' },
  { name: 'NIST SP 800-90B', note: 'Entropy assessment' },
];

export default function RefsPage() {
  return (
    <div className="page-enter min-w-0 w-full">
      <ResearchHeader
        eyebrow="Research · Bibliography"
        title="References"
        description="Primary standards and guidelines relevant to the algorithms exposed in this platform."
      />
      <Panel>
        <PanelHeader title="Standards" />
        <PanelBody>
          <ul className="space-y-2">
            {REFS.map((r) => (
              <li key={r.name} className="font-mono text-[11px] text-on-surface-variant">
                <span className="text-on-surface">{r.name}</span> — {r.note}
              </li>
            ))}
          </ul>
        </PanelBody>
      </Panel>
    </div>
  );
}
