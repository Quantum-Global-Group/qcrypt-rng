'use client';

import { useState, useRef } from 'react';
import { Upload, Download, Lock, Unlock, Copy, Check, ArrowRight, ArrowLeft, FileText } from 'lucide-react';
import { encryptText, decryptText } from '@/utils/api';
import { addToHistory } from '@/utils/userPreferences';

type WizardStep = {
  title: string;
  description: string;
};

const STEPS = [
  { title: 'Choose Operation', description: 'Encrypt or decrypt your data' },
  { title: 'Enter Data', description: 'Input your text or upload a file' },
  { title: 'Results', description: 'Copy or download the result' },
];

export function EncryptionWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [operation, setOperation] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNext = async () => {
    if (currentStep === 1) {
      await handleProcess();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProcess = async () => {
    if (!inputText) return;
    
    setLoading(true);
    try {
      let result: any;
      if (operation === 'encrypt') {
        result = await encryptText(inputText);
        addToHistory(`Encrypted text (${inputText.length} chars)`, { type: 'encrypt' });
      } else {
        // Decryption requires specific format - show message
        alert('Decryption requires the encrypted response object. For now, only encryption is supported in the wizard.');
        setLoading(false);
        return;
      }
      setResult(result);
      setCurrentStep(4);
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const textToCopy = result.data || result.result || result;
    await navigator.clipboard.writeText(textToCopy.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const textToDownload = result.data || result.result || result;
    const blob = new Blob([textToDownload.toString()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qcrypt-${operation}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setOperation('encrypt');
    setInputText('');
    setResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setInputText(event.target?.result as string);
    };
    reader.readAsText(file);
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
            {STEPS[currentStep]?.title || 'Complete'}
          </span>
        </div>
        <div className="flex gap-2">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full transition-all ${
                index <= currentStep ? 'bg-blue-400' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-6">
        {/* Step 1: Choose Operation */}
        {currentStep === 0 && (
          <div>
            <h2 className="mb-2 text-2xl font-semibold text-on-surface">{STEPS[0].title}</h2>
            <p className="mb-6 text-on-surface-variant">{STEPS[0].description}</p>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                onClick={() => setOperation('encrypt')}
                className={`rounded-lg border-2 p-6 text-left transition-all hover:scale-105 ${
                  operation === 'encrypt'
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-slate-600 hover:border-blue-400/50'
                }`}
              >
                <Lock className="mb-3 h-8 w-8 text-blue-400" />
                <h3 className="mb-1 text-lg font-medium text-on-surface">Encrypt</h3>
                <p className="text-sm text-on-surface-variant">
                  Protect your data with a password. Only someone with the password can decrypt it.
                </p>
              </button>
              
              <button
                onClick={() => setOperation('decrypt')}
                className={`rounded-lg border-2 p-6 text-left transition-all hover:scale-105 ${
                  operation === 'decrypt'
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-slate-600 hover:border-emerald-400/50'
                }`}
              >
                <Unlock className="mb-3 h-8 w-8 text-emerald-400" />
                <h3 className="mb-1 text-lg font-medium text-on-surface">Decrypt</h3>
                <p className="text-sm text-on-surface-variant">
                  Unlock encrypted data using the password it was encrypted with.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Enter Data - will directly process */}
        {currentStep === 1 && (
          <div>
            <h2 className="mb-2 text-2xl font-semibold text-on-surface">{STEPS[1].title}</h2>
            <p className="mb-6 text-on-surface-variant">{STEPS[1].description}</p>
            
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-on-surface">
                  {operation === 'encrypt' ? 'Text to encrypt' : 'Data to decrypt'}
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={operation === 'encrypt' ? 'Enter your secret message...' : 'Paste encrypted data...'}
                  className="min-h-[200px] w-full rounded-lg border border-outline-variant/10 bg-surface p-3 font-mono text-sm text-on-surface placeholder:text-on-surface-variant"
                  rows={8}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.json,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-surface-container px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </button>
                {inputText && (
                  <span className="text-sm text-on-surface-variant">
                    <FileText className="mr-1 inline h-4 w-4" />
                    {inputText.length} characters loaded
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {currentStep === 2 && result && (
          <div>
            <h2 className="mb-2 text-2xl font-semibold text-on-surface">{STEPS[2].title}</h2>
            <p className="mb-6 text-on-surface-variant">{STEPS[2].description}</p>
            
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
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {currentStep < 2 && (
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
            disabled={
              (currentStep === 0 && !operation) ||
              (currentStep === 1 && !inputText) ||
              loading
            }
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {currentStep === 1 ? (
              <>
                {operation === 'encrypt' ? 'Encrypt' : 'Decrypt'}
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
