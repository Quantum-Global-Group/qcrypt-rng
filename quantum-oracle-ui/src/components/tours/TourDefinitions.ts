/**
 * Predefined tours for common workflows
 */

import { TourStep } from '@/components/tours/GuidedTour';

export const tours = {
  dashboard: [
    {
      target: '[data-tour="entropy-panel"]',
      title: 'Live Entropy Monitor',
      description: 'This panel shows the real-time entropy being collected from quantum sources. Higher entropy means more secure random numbers.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="quick-links"]',
      title: 'Quick Actions',
      description: 'Access the most common features with one click. Generate random data, encrypt files, or create PQC keys.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="pqc-cards"]',
      title: 'Post-Quantum Algorithms',
      description: 'View the status and performance of different post-quantum cryptographic algorithms like Kyber and Dilithium.',
      placement: 'top',
    },
    {
      target: '[data-tour="mode-toggle"]',
      title: 'Switch Modes',
      description: 'Toggle between Simple Mode (guided wizards) and Developer Mode (full features) at any time.',
      placement: 'left',
    },
  ] as TourStep[],

  randomGeneration: [
    {
      target: '[data-tour="purpose-select"]',
      title: 'Choose Your Purpose',
      description: 'Select what you need: passwords, encryption keys, UUIDs, or raw random bytes.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="options-config"]',
      title: 'Customize Options',
      description: 'Adjust parameters like length, character sets, or byte size based on your needs.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="generate-btn"]',
      title: 'Generate',
      description: 'Click to generate cryptographically secure random data using quantum entropy sources.',
      placement: 'top',
    },
  ] as TourStep[],

  encryption: [
    {
      target: '[data-tour="operation-select"]',
      title: 'Encrypt or Decrypt',
      description: 'Choose whether you want to encrypt data (protect it) or decrypt existing encrypted data.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="input-area"]',
      title: 'Enter Your Data',
      description: 'Type or paste your text, or upload a file. For decryption, paste the encrypted data.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="password-input"]',
      title: 'Set a Password',
      description: 'Choose a strong password. This is the only way to decrypt your data later, so remember it!',
      placement: 'top',
    },
  ] as TourStep[],

  pqcSuite: [
    {
      target: '[data-tour="algorithm-select"]',
      title: 'Choose an Algorithm',
      description: 'Select from NIST-approved post-quantum algorithms: Kyber (key encapsulation), Dilithium (signatures), Falcon, and more.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="key-generation"]',
      title: 'Generate Keys',
      description: 'Create quantum-safe key pairs that are resistant to attacks from quantum computers.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="export-keys"]',
      title: 'Export & Use',
      description: 'Download your keys or copy them for use in your applications. Keep your private keys secure!',
      placement: 'top',
    },
  ] as TourStep[],
};

/**
 * Get tour steps by tour ID
 */
export function getTourSteps(tourId: keyof typeof tours): TourStep[] {
  return tours[tourId] || [];
}

/**
 * Check if a tour exists
 */
export function hasTour(tourId: string): boolean {
  return tourId in tours;
}
