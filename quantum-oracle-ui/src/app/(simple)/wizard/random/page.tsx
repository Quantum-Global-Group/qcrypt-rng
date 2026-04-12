'use client';

import { RandomGenerationWizard } from '@/components/wizards/RandomGenerationWizard';

export default function RandomWizardPage() {
  return (
    <div className="min-w-0 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-on-surface">Generate Random Data</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Create secure passwords, encryption keys, UUIDs, or random bytes
        </p>
      </div>
      
      <RandomGenerationWizard />
    </div>
  );
}
