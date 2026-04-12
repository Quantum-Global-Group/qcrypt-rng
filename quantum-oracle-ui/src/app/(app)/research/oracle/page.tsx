import { Suspense } from 'react';
import { OracleLabCombined } from '@/components/oracle/OracleLabCombined';

function OracleLabFallback() {
  return (
    <div className="page-enter min-w-0 w-full animate-pulse">
      <div className="mb-8 h-24 rounded-lg bg-surface-container-low" />
      <div className="h-12 rounded-lg bg-surface-container-low" />
    </div>
  );
}

export default function ResearchOracleLabPage() {
  return (
    <Suspense fallback={<OracleLabFallback />}>
      <OracleLabCombined />
    </Suspense>
  );
}
