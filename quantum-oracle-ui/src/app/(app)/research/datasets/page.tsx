import Link from 'next/link';
import { ResearchHeader, Panel, PanelHeader, PanelBody, GhostButton } from '@/components/research/shared';

export default function DatasetsPage() {
  return (
    <div className="page-enter min-w-0 w-full">
      <ResearchHeader
        eyebrow="Research · Data"
        title="Export / datasets"
        description="Export session logs from the experiment notebook, or pull structured JSON from the API for offline analysis."
      />
      <Panel>
        <PanelHeader title="Exports" />
        <PanelBody className="space-y-3">
          <p className="text-sm text-on-surface-variant max-w-prose">
            Use the <Link className="text-primary underline" href="/research/notebook">Experiment log</Link> to download
            JSON or NDJSON traces. For API-level exports, use the interactive docs.
          </p>
          <Link href="/docs/api">
            <GhostButton>Open API reference</GhostButton>
          </Link>
        </PanelBody>
      </Panel>
    </div>
  );
}
