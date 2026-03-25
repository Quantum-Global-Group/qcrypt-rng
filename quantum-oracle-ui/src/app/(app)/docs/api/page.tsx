'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';

const SAMPLE_JSON = `{
  "header": {
    "node_id": "NODE_4482",
    "region": "US-EAST-ALPHA",
    "latency": "14ms"
  },
  "data": {
    "current_entropy": 0.882410,
    "state": "ACTIVE",
    "last_sync": "2024-05-11T12:00:00Z"
  },
  "meta": {
    "request_id": "req_882914002"
  }
}`;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v2';
const CURL = `curl -X GET "${API_BASE}/quantum/entropy"`;

export default function ApiReferencePage() {
  const [copied, setCopied] = useState(false);

  const copyCurl = useCallback(async () => {
    await navigator.clipboard.writeText(CURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col overflow-hidden bg-background text-on-surface">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-outline-variant/10 bg-background px-6">
        <div className="flex items-center gap-8">
          <span className="text-xl font-black tracking-widest text-on-surface">ORACLE_TERMINAL</span>
          <nav className="hidden items-center gap-6 md:flex">
            <span className="text-sm font-medium text-outline">Mainnet</span>
            <span className="text-sm font-medium text-outline">Testnet</span>
            <span className="text-sm font-bold text-primary">Docs</span>
          </nav>
        </div>
        <div className="relative hidden lg:block">
          <input
            className="w-64 rounded border border-outline-variant/20 bg-surface-container-lowest px-4 py-1.5 text-xs text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
            placeholder="Search documentation..."
            type="search"
            readOnly
            aria-label="Search (visual only)"
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-outline-variant/10 bg-surface-container-low lg:flex">
          <div className="p-6">
            <div className="mb-8 flex flex-col gap-1">
              <span className="text-lg font-bold tracking-tighter text-on-surface">QUANTUM_CORE</span>
              <span className="font-mono text-[10px] text-outline">v4.0.2-STABLE</span>
            </div>
            <nav className="space-y-1">
              <Link href="/docs" className="flex items-center gap-3 rounded px-3 py-2 text-sm tracking-tight text-outline transition-colors hover:bg-surface-container hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">database</span>
                Oracle Requests
              </Link>
              <Link href="/fulfillment" className="flex items-center gap-3 rounded px-3 py-2 text-sm tracking-tight text-outline transition-colors hover:bg-surface-container hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">magic_button</span>
                Fulfillment Wizard
              </Link>
              <span className="flex items-center gap-3 border-r-2 border-primary bg-surface-container px-3 py-2 text-sm font-medium tracking-tight text-primary">
                <span className="material-symbols-outlined text-[20px]">menu_book</span>
                Documentation
              </span>
            </nav>
            <button
              type="button"
              className="mt-10 w-full rounded bg-primary-container py-2.5 text-sm font-semibold text-on-primary-container transition-all hover:brightness-110"
            >
              Generate API Key
            </button>
          </div>
        </aside>

        <section className="docs-scrollbar w-full overflow-y-auto bg-surface px-8 py-10 lg:w-1/2">
          <header className="mb-12">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary">Core Reference</span>
              <div className="h-px w-12 bg-outline-variant/30" />
            </div>
            <h1 className="mb-4 text-4xl font-black tracking-tight text-on-surface">API Reference (V3)</h1>
            <p className="max-w-xl leading-relaxed text-on-surface-variant">
              Interact with the Quantum Core through the RESTful interface served under{' '}
              <code className="font-mono text-sm text-primary">/api/v2</code>. Responses are JSON; health is at{' '}
              <code className="font-mono text-sm text-primary">/health</code>.
            </p>
          </header>

          <article className="mb-16 space-y-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <span className="h-6 w-1.5 rounded-full bg-primary" />
              Authentication
            </h2>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              When enabled, include credentials per your deployment policy. For local development, the UI auto-discovers
              the backend on ports 8000–8004.
            </p>
            <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-4">
              <div className="mb-2 flex items-center gap-2 font-mono text-[11px] text-outline">
                <span className="material-symbols-outlined text-sm">lock</span>
                SECURE_HEADER
              </div>
              <p className="font-mono text-sm text-on-surface">
                Authorization: Bearer <span className="text-primary">YOUR_QUANTUM_KEY</span>
              </p>
            </div>
          </article>

          <article className="mb-16 space-y-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <span className="h-6 w-1.5 rounded-full bg-tertiary" />
              Get entropy
            </h2>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              <code className="text-primary">GET /quantum/entropy</code> — Shannon and min-entropy diagnostics for the
              active pool.
            </p>
            <div>
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-outline">Response (excerpt)</h3>
              <div className="rounded border border-outline-variant/10 bg-surface-container-lowest p-6 font-mono text-[13px] leading-relaxed text-on-surface-variant">
                <pre className="whitespace-pre-wrap text-secondary">{SAMPLE_JSON}</pre>
              </div>
            </div>
          </article>

          <footer className="mt-20 flex items-center justify-between border-t border-outline-variant/10 pt-10">
            <div className="font-mono text-[10px] uppercase tracking-widest text-outline">QCrypt RNG</div>
            <Link href="/docs" className="text-xs text-primary hover:underline">
              Full documentation
            </Link>
          </footer>
        </section>

        <section className="flex w-full flex-col border-t border-outline-variant/10 bg-surface-container-lowest lg:w-1/2 lg:border-l lg:border-t-0">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-outline-variant/20 bg-surface-container px-4">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-error/40" />
                <div className="h-2.5 w-2.5 rounded-full bg-tertiary/40" />
                <div className="h-2.5 w-2.5 rounded-full bg-secondary/40" />
              </div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                Live_Terminal_Console
              </span>
            </div>
            <span className="rounded bg-secondary/10 px-2 py-0.5 font-mono text-[10px] text-secondary">CONNECTED</span>
          </div>

          <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-6 font-mono text-[13px] leading-relaxed">
            <div className="text-outline">
              <span className="text-secondary">system@quantum_core:</span>
              <span className="text-primary">~</span>$ curl -X GET &quot;/api/v2/quantum/entropy&quot;
            </div>
            <div className="rounded border border-outline-variant/10 bg-surface-container/30 p-4 text-on-surface-variant">
              <div className="mb-4 flex justify-between border-b border-outline-variant/5 pb-2">
                <span className="text-[11px] uppercase text-outline">Response</span>
                <span className="text-[11px] text-secondary">200 OK</span>
              </div>
              <pre className="text-primary">{SAMPLE_JSON}</pre>
            </div>
          </div>

          <div className="border-t border-outline-variant/20 bg-surface-container-low p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded bg-surface-container-high px-2 py-1 font-mono text-[10px] text-outline">GET</div>
                <input
                  readOnly
                  className="flex-1 border-none bg-transparent font-mono text-sm text-on-surface focus:ring-0"
                  value={CURL}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyCurl}
                  className="flex flex-1 items-center justify-center gap-2 rounded border border-outline-variant/20 bg-surface-container-high py-2 font-mono text-xs text-on-surface transition-colors hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  {copied ? 'Copied' : 'Copy Curl'}
                </button>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-2 rounded bg-primary py-2 font-mono text-xs font-bold text-on-primary transition-all hover:brightness-110"
                >
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  Execute
                </button>
              </div>
            </div>
          </div>

          <div className="flex h-14 shrink-0 items-center gap-8 overflow-x-auto border-t border-outline-variant/20 bg-surface-container-lowest px-6 font-mono text-[9px] uppercase tracking-widest text-outline">
            <div className="flex flex-col">
              <span className="text-outline">CPU_LOAD</span>
              <span className="text-xs text-secondary">2.4%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-outline">MEM_AVAIL</span>
              <span className="text-xs text-primary">16.2 GB</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
              <span className="text-[10px] uppercase text-outline">System Ready</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
