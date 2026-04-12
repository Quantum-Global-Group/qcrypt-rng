'use client';

import { useState, useCallback, useEffect } from 'react';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: string;
  page: string;
  data: Record<string, unknown>;
  durationMs?: number;
}

const LOG_KEY = '__qcrypt_exp_log';

function getLog(): LogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(sessionStorage.getItem(LOG_KEY) ?? '[]') as LogEntry[];
  } catch {
    return [];
  }
}

function persistLog(entries: LogEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(LOG_KEY, JSON.stringify(entries));
  } catch {
    /* ignore quota */
  }
}

export function useExperimentLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    setEntries(getLog());
  }, []);

  const add = useCallback((type: string, page: string, data: Record<string, unknown>, durationMs?: number) => {
    const entry: LogEntry = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      type,
      page,
      data,
      durationMs,
    };
    setEntries((prev) => {
      const next = [entry, ...prev].slice(0, 500);
      persistLog(next);
      return next;
    });
    return entry;
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
    persistLog([]);
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qcrypt-session-${Date.now()}.json`;
    a.click();
  }, [entries]);

  const exportNDJSON = useCallback(() => {
    const content = entries.map((e) => JSON.stringify(e)).join('\n');
    const blob = new Blob([content], { type: 'application/x-ndjson' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qcrypt-session-${Date.now()}.ndjson`;
    a.click();
  }, [entries]);

  return { entries, add, clear, exportJSON, exportNDJSON };
}
