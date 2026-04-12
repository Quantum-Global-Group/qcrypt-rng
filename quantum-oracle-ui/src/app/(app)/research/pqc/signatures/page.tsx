import { PqcKeyGenerationPage } from '@/components/pqc/PqcKeyGenerationPage';

export default function ResearchPqcSignaturesPage() {
  return (
    <div className="page-enter min-w-0 w-full">
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-outline mb-1.5">PQC · Signatures</p>
      <h1 className="text-2xl font-light text-on-surface tracking-tight mb-4">Key generation & signing</h1>
      <PqcKeyGenerationPage />
    </div>
  );
}
