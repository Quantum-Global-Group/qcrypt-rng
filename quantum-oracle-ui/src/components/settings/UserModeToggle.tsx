'use client';

import { Sparkles, Code2 } from 'lucide-react';
import { useUserMode, UserMode } from '@/contexts/UserModeContext';

export function UserModeToggle() {
  const { mode, setMode } = useUserMode();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400">Mode:</span>
      <div className="flex overflow-hidden rounded-lg border border-slate-600 bg-slate-800">
        <button
          onClick={() => setMode('simple')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${
            mode === 'simple'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
          title="Simple Mode: Guided wizards for non-technical users"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Simple
        </button>
        <button
          onClick={() => setMode('developer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${
            mode === 'developer'
              ? 'bg-blue-500/20 text-blue-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
          title="Developer Mode: Full API access and advanced features"
        >
          <Code2 className="h-3.5 w-3.5" />
          Dev
        </button>
      </div>
    </div>
  );
}
