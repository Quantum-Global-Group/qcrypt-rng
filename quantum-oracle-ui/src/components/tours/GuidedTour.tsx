'use client';

import { useState, useEffect, ReactNode } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export type TourStep = {
  target: string; // CSS selector for the element to highlight
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
};

type GuidedTourProps = {
  tourId: string;
  steps: TourStep[];
  onComplete?: () => void;
  enabled?: boolean;
  children?: ReactNode;
};

export function GuidedTour({ tourId, steps, onComplete, enabled = true, children }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    
    const hasCompleted = localStorage.getItem(`qcrypt_tour_complete_${tourId}`);
    if (!hasCompleted) {
      setIsVisible(true);
    } else {
      setIsComplete(true);
    }
  }, [tourId, enabled]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setIsComplete(true);
    localStorage.setItem(`qcrypt_tour_complete_${tourId}`, 'true');
    if (onComplete) {
      onComplete();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(`qcrypt_tour_skipped_${tourId}`, 'true');
  };

  if (!isVisible || isComplete || !enabled) {
    return <>{children}</>;
  }

  const step = steps[currentStep];

  return (
    <>
      {children}
      
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      
      {/* Tour Dialog */}
      <div className="fixed bottom-8 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-6 rounded-full transition-all ${
                  index <= currentStep ? 'bg-emerald-400' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
          <span className="ml-auto text-xs text-slate-400">
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Content */}
        <h3 className="mb-2 text-lg font-semibold text-white">{step.title}</h3>
        <p className="mb-6 text-sm text-slate-300">{step.description}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleClose}
            className="text-sm text-slate-400 transition-colors hover:text-white"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`rounded-lg p-2 transition-colors ${
                currentStep === 0
                  ? 'cursor-not-allowed text-slate-600'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-400"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="h-4 w-4" />
                  Done
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Hook to check if a tour has been completed
 */
export function useTourStatus(tourId: string) {
  const [isComplete, setIsComplete] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(`qcrypt_tour_complete_${tourId}`);
    const skipped = localStorage.getItem(`qcrypt_tour_skipped_${tourId}`);
    setIsComplete(completed === 'true');
    setIsSkipped(skipped === 'true');
  }, [tourId]);

  return { isComplete, isSkipped };
}

/**
 * Reset tour progress (useful for testing or re-showing tours)
 */
export function resetTour(tourId: string) {
  localStorage.removeItem(`qcrypt_tour_complete_${tourId}`);
  localStorage.removeItem(`qcrypt_tour_skipped_${tourId}`);
}
