'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Sparkles,
  Shield,
  Key,
  Lock,
  Zap,
  Code2,
} from 'lucide-react';

type OnboardingStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
  features?: string[];
};

const STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to QCrypt RNG',
    description: 'Your quantum-enhanced cybersecurity platform for secure random generation and data protection.',
    icon: <Sparkles className="h-12 w-12 text-emerald-400" />,
  },
  {
    title: 'What can you do here?',
    description: 'Generate cryptographically secure random numbers, encrypt files, create post-quantum keys, and more.',
    icon: <Shield className="h-12 w-12 text-blue-400" />,
    features: [
      'Secure random generation',
      'File encryption & decryption',
      'Post-quantum cryptography',
      'Blockchain oracle',
    ],
  },
  {
    title: 'Choose your experience',
    description: 'Select the mode that best fits your needs. You can always change this later in settings.',
    icon: <Code2 className="h-12 w-12 text-purple-400" />,
    features: [
      'Simple Mode: Guided wizards for everyone',
      'Developer Mode: Full API & advanced features',
    ],
  },
];

type OnboardingWizardProps = {
  onComplete?: (mode: 'simple' | 'developer') => void;
};

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMode, setSelectedMode] = useState<'simple' | 'developer' | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('qcrypt_onboarding_complete');
    if (hasCompletedOnboarding) {
      setIsComplete(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('qcrypt_onboarding_complete', 'true');
    router.push('/dashboard');
  };

  const handleModeSelect = (mode: 'simple' | 'developer') => {
    setSelectedMode(mode);
    localStorage.setItem('qcrypt_user_mode', mode);
  };

  const handleComplete = () => {
    if (!selectedMode) return;
    
    localStorage.setItem('qcrypt_onboarding_complete', 'true');
    localStorage.setItem('qcrypt_user_mode', selectedMode);
    
    if (onComplete) {
      onComplete(selectedMode);
    }
    
    if (selectedMode === 'simple') {
      router.push('/simple');
    } else {
      router.push('/dashboard');
    }
  };

  if (isComplete) {
    return null;
  }

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          aria-label="Skip onboarding"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Progress Bar */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                index <= currentStep ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="text-center">
          <div className="mb-6 flex justify-center">{step.icon}</div>
          
          <h2 className="mb-3 font-headline text-3xl font-bold text-white">
            {step.title}
          </h2>
          
          <p className="mx-auto mb-6 max-w-lg text-slate-300">
            {step.description}
          </p>

          {step.features && (
            <ul className="mx-auto mb-8 max-w-md space-y-2 text-left">
              {step.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-slate-300">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Mode Selection (Last Step) */}
          {isLastStep && (
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                onClick={() => handleModeSelect('simple')}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  selectedMode === 'simple'
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-slate-600 hover:border-emerald-400/50'
                }`}
              >
                <Sparkles className="mb-2 h-6 w-6 text-emerald-400" />
                <h3 className="mb-1 font-semibold text-white">Simple Mode</h3>
                <p className="text-xs text-slate-400">Guided wizards, no jargon</p>
              </button>

              <button
                onClick={() => handleModeSelect('developer')}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  selectedMode === 'developer'
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-slate-600 hover:border-blue-400/50'
                }`}
              >
                <Code2 className="mb-2 h-6 w-6 text-blue-400" />
                <h3 className="mb-1 font-semibold text-white">Developer Mode</h3>
                <p className="text-xs text-slate-400">Full API access & features</p>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              currentStep === 0
                ? 'cursor-not-allowed text-slate-600'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSkip}
              className="rounded-lg px-4 py-2 text-sm text-slate-400 transition-colors hover:text-white"
            >
              Skip
            </button>

            {isLastStep ? (
              <button
                onClick={handleComplete}
                disabled={!selectedMode}
                className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium transition-all ${
                  selectedMode
                    ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                    : 'cursor-not-allowed bg-slate-600 text-slate-400'
                }`}
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-400"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
