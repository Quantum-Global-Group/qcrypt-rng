'use client';

import { useState } from 'react';
import { Copy, Download, RefreshCw, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { generateBytes, generateKey, generatePassword, generateUUID } from '@/utils/api';
import { addToHistory } from '@/utils/userPreferences';

type WizardStep = {
  title: string;
  description: string;
};

const STEPS: WizardStep[] = [
  { title: 'Choose Purpose', description: 'What do you need random data for?' },
  { title: 'Configure Options', description: 'Customize your generation settings' },
  { title: 'Generate', description: 'Create your secure random data' },
  { title: 'Results', description: 'Copy or download your generated data' },
];

export function RandomGenerationWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [purpose, setPurpose] = useState<string>('');
  const [options, setOptions] = useState<any>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const purposes = [
    { id: 'encryption', label: 'Encryption Key', icon: '🔐', description: 'Generate a secure key for encryption' },
    { id: 'password', label: 'Password', icon: '🔑', description: 'Create a strong, random password' },
    { id: 'uuid', label: 'UUID/GUID', icon: '🆔', description: 'Generate unique identifiers' },
    { id: 'token', label: 'API Token', icon: '🎫', description: 'Create authentication tokens' },
    { id: 'bytes', label: 'Raw Bytes', icon: '📦', description: 'Generate raw random data' },
  ];

  const handlePurposeSelect = (selectedPurpose: string) => {
    setPurpose(selectedPurpose);
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      await handleGenerate();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let result: any;
      switch (purpose) {
        case 'password':
          result = await generatePassword(options.length || 16, options.includeSymbols ?? true);
          addToHistory(`Generated password (${options.length || 16} chars)`, { type: 'password' });
          break;
        case 'uuid':
          result = await generateUUID();
          addToHistory('Generated UUID', { type: 'uuid' });
          break;
        case 'encryption':
          result = await generateKey(options.keySize || 32);
          addToHistory(`Generated encryption key (${options.keySize || 32} bytes)`, { type: 'key' });
          break;
        default:
          result = await generateBytes(options.numBytes || 32);
          addToHistory(`Generated ${options.numBytes || 32} random bytes`, { type: 'bytes' });
      }
      setResult(result);
      setCurrentStep(3);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const textToCopy = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const textToDownload = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qcrypt-${purpose}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setPurpose('');
    setOptions({});
    setResult(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-on-surface">
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <span className="text-sm text-on-surface-variant">
            {STEPS[currentStep].title}
          </span>
        </div>
        <div className="flex gap-2">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full transition-all ${
                index <= currentStep ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-6">
        {/* Step 1: Choose Purpose */}
        {currentStep === 0 && (
          <div>
            <h2 className="mb-2 text-2xl font-semibold text-on-surface">{STEPS[0].title}</h2>
            <p className="mb-6 text-on-surface-variant">{STEPS[0].description}</p>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {purposes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePurposeSelect(p.id)}
                  className={`rounded-lg border-2 p-4 text-left transition-all hover:scale-105 ${
                    purpose === p.id
                      ? 'border-emerald-400 bg-emerald-500/10'
                      : 'border-slate-600 hover:border-emerald-400/50'
                  }`}
                >
                  <div className="mb-2 text-2xl">{p.icon}</div>
                  <h3 className="mb-1 font-medium text-on-surface">{p.label}</h3>
                  <p className="text-sm text-on-surface-variant">{p.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Configure Options */}
        {currentStep === 1 && (
          <div>
            <h2 className="mb-2 text-2xl font-semibold text-on-surface">{STEPS[1].title}</h2>
            <p className="mb-6 text-on-surface-variant">{STEPS[1].description}</p>
            
            <div className="space-y-4">
              {purpose === 'password' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-on-surface">
                    Password Length: {options.length || 16}
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="64"
                    value={options.length || 16}
                    onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="includeSymbols"
                      checked={options.includeSymbols ?? true}
                      onChange={(e) => setOptions({ ...options, includeSymbols: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="includeSymbols" className="text-sm text-on-surface-variant">
                      Include symbols (!@#$%^&*)
                    </label>
                  </div>
                </div>
              )}
              
              {(purpose === 'encryption' || purpose === 'bytes') && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-on-surface">
                    Size (bytes): {options.numBytes || (purpose === 'encryption' ? 32 : 32)}
                  </label>
                  <input
                    type="range"
                    min="16"
                    max="256"
                    step="16"
                    value={options.numBytes || (purpose === 'encryption' ? 32 : 32)}
                    onChange={(e) => setOptions({ ...options, numBytes: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Generate */}
        {currentStep === 2 && (
          <div className="text-center py-12">
            <h2 className="mb-2 text-2xl font-semibold text-on-surface">{STEPS[2].title}</h2>
            <p className="mb-8 text-on-surface-variant">{STEPS[2].description}</p>
            
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-3 text-lg font-medium text-white transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  Generate {purposes.find(p => p.id === purpose)?.label}
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === 3 && result && (
          <div>
            <h2 className="mb-2 text-2xl font-semibold text-on-surface">{STEPS[3].title}</h2>
            <p className="mb-6 text-on-surface-variant">{STEPS[3].description}</p>
            
            <div className="rounded-lg bg-surface-container p-4">
              <pre className="max-h-64 overflow-auto rounded bg-surface p-4 font-mono text-sm text-on-surface">
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary-dark"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded bg-surface-container px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded bg-surface-container px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
              >
                <RefreshCw className="h-4 w-4" />
                Generate Another
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {currentStep < 3 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              currentStep === 0
                ? 'cursor-not-allowed text-slate-600'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          
          <button
            onClick={handleNext}
            disabled={(currentStep === 0 && !purpose) || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {currentStep === 2 ? (
              <>
                Generate
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
