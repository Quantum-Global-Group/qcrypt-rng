'use client';

import { EncryptionWizard } from '@/components/wizards/EncryptionWizard';

export default function EncryptionWizardPage() {
  return (
    <div className="min-w-0 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-on-surface">Encrypt or Decrypt Data</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Protect your data or decrypt existing encrypted content
        </p>
      </div>
      
      <EncryptionWizard />
    </div>
  );
}
