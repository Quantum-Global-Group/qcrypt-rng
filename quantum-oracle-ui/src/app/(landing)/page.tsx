'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Key,
  Lock,
  FileKey,
  Sparkles,
  Code2,
  Zap,
  ArrowRight,
  Github,
  BookOpen,
} from 'lucide-react';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

type UserMode = 'simple' | 'developer' | null;

export default function LandingPage() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<UserMode>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('qcrypt_has_visited');
    const hasCompletedOnboarding = localStorage.getItem('qcrypt_onboarding_complete');
    const savedMode = localStorage.getItem('qcrypt_user_mode') as UserMode;
    
    if (!hasVisited) {
      setIsFirstVisit(true);
      setShowOnboarding(true);
      localStorage.setItem('qcrypt_has_visited', 'true');
    } else if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
    
    if (savedMode) {
      setSelectedMode(savedMode);
    }
  }, []);

  const handleModeSelect = (mode: UserMode) => {
    setSelectedMode(mode);
    localStorage.setItem('qcrypt_user_mode', mode!);
    
    if (mode === 'simple') {
      router.push('/simple');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSkipSelection = () => {
    router.push('/dashboard');
  };

  const handleOnboardingComplete = (mode: 'simple' | 'developer') => {
    setShowOnboarding(false);
    // Navigation is handled in the wizard itself
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
        
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          {/* Logo & Branding */}
          <div className="text-center">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="h-4 w-4 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]" />
              <h1 className="font-headline text-3xl font-bold tracking-tight text-white sm:text-4xl">
                QCrypt RNG
              </h1>
            </div>
            
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Quantum-enhanced cybersecurity platform providing cryptographically secure random number generation, 
              post-quantum cryptography, and blockchain oracle services.
            </p>
          </div>

          {/* Mode Selection Cards */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Simple Mode */}
            <button
              onClick={() => handleModeSelect('simple')}
              className={`group relative rounded-2xl border-2 p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                selectedMode === 'simple'
                  ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.3)]'
                  : 'border-slate-600 bg-slate-800/50 hover:border-emerald-400/50'
              }`}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                  <Sparkles className="h-6 w-6 text-emerald-400" />
                </div>
                <h2 className="font-headline text-2xl font-semibold text-white">Simple Mode</h2>
              </div>
              
              <p className="mb-6 text-slate-300">
                Perfect for non-technical users. Get secure random numbers, encrypt files, or protect your data 
                with guided wizards and plain language explanations.
              </p>
              
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <span>Step-by-step wizards</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <span>No technical knowledge required</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <span>One-click operations</span>
                </li>
              </ul>
              
              <div className="mt-6 font-medium text-emerald-400 group-hover:text-emerald-300">
                Get Started →
              </div>
            </button>

            {/* Developer Mode */}
            <button
              onClick={() => handleModeSelect('developer')}
              className={`group relative rounded-2xl border-2 p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                selectedMode === 'developer'
                  ? 'border-blue-400 bg-blue-500/10 shadow-[0_0_30px_rgba(96,165,250,0.3)]'
                  : 'border-slate-600 bg-slate-800/50 hover:border-blue-400/50'
              }`}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                  <Code2 className="h-6 w-6 text-blue-400" />
                </div>
                <h2 className="font-headline text-2xl font-semibold text-white">Developer Mode</h2>
              </div>
              
              <p className="mb-6 text-slate-300">
                Full access to all features including API endpoints, PQC algorithms, blockchain oracles, 
                and advanced configuration options.
              </p>
              
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 text-blue-400" />
                  <span>Complete API access</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 text-blue-400" />
                  <span>Post-quantum cryptography suite</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 text-blue-400" />
                  <span>Blockchain oracle services</span>
                </li>
              </ul>
              
              <div className="mt-6 font-medium text-blue-400 group-hover:text-blue-300">
                Enter Dashboard →
              </div>
            </button>
          </div>

          {/* Quick Action Links */}
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-400">
              Or jump directly to a specific tool:
            </p>
            
            <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-4">
              <Link
                href="/wizard/random"
                className="flex items-center gap-2 rounded-lg bg-slate-700/50 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <Zap className="h-4 w-4" />
                Generate Random Data
              </Link>
              
              <Link
                href="/wizard/encrypt"
                className="flex items-center gap-2 rounded-lg bg-slate-700/50 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <Lock className="h-4 w-4" />
                Encrypt Files
              </Link>
              
              <Link
                href="/pqc"
                className="flex items-center gap-2 rounded-lg bg-slate-700/50 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <Shield className="h-4 w-4" />
                PQC Suite
              </Link>
              
              <Link
                href="/pqc/keys"
                className="flex items-center gap-2 rounded-lg bg-slate-700/50 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <Key className="h-4 w-4" />
                Generate Keys
              </Link>
              
              <Link
                href="/docs"
                className="flex items-center gap-2 rounded-lg bg-slate-700/50 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <BookOpen className="h-4 w-4" />
                Documentation
              </Link>
            </div>
          </div>

          {/* Skip Button */}
          {isFirstVisit && (
            <div className="mt-12 text-center">
              <button
                onClick={handleSkipSelection}
                className="rounded-lg bg-slate-700 px-6 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-600 hover:text-white"
              >
                Skip to Dashboard
              </button>
            </div>
          )}

          {/* Footer Links */}
          <div className="mt-16 flex items-center justify-center gap-6 text-sm text-slate-400">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <Link href="/docs" className="transition-colors hover:text-white">
              API Docs
            </Link>
            <Link href="/docs/api" className="transition-colors hover:text-white">
              API Reference
            </Link>
          </div>
        </div>
      </div>

      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      )}
    </div>
  );
}
