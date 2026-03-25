import Link from 'next/link';

export const metadata = {
  title: 'QCrypt RNG - Documentation',
  description: 'Quantum Oracle API documentation',
};

const nav = [
  { href: '#intro', label: 'Introduction', icon: 'terminal' as const },
  { href: '#auth', label: 'Authentication', icon: 'key' as const },
  { href: '#get-randomness', label: 'Get Randomness', icon: 'blur_on' as const },
  { href: '#post-pqc-signature', label: 'POST PQC Signature', icon: 'enhanced_encryption' as const },
  { href: '#fulfillment-hook', label: 'Fulfillment Hook', icon: 'published_with_changes' as const },
];

export default function DocsPage() {
  return (
    <div className="min-h-full bg-surface text-on-surface">
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-outline-variant/10 bg-background/95 px-6 backdrop-blur">
        <div className="flex items-center gap-8">
          <span className="font-mono text-sm font-bold tracking-tighter text-on-surface">QUANTUM_ORACLE_V1</span>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="px-2 py-1 text-sm text-outline transition-colors hover:bg-surface-container hover:text-on-surface">
              Oracle
            </Link>
            <Link href="/pqc" className="px-2 py-1 text-sm text-outline transition-colors hover:bg-surface-container hover:text-on-surface">
              PQC Suite
            </Link>
            <Link href="/fulfillment" className="px-2 py-1 text-sm text-outline transition-colors hover:bg-surface-container hover:text-on-surface">
              Fulfillment
            </Link>
            <span className="border-b-2 border-primary px-2 py-1 text-sm text-primary">Documentation</span>
          </nav>
        </div>
        <div className="hidden items-center gap-2 rounded bg-surface-container-low px-3 py-1.5 text-outline md:flex">
          <span className="material-symbols-outlined text-sm">search</span>
          <span className="text-xs">Search node…</span>
          <span className="rounded border border-outline-variant/20 bg-background px-1 text-[10px]">CMD K</span>
        </div>
      </header>

      <div className="flex">
        <aside className="docs-scrollbar sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 flex-col overflow-y-auto border-r border-outline-variant/10 bg-surface-container-low md:flex">
          <div className="flex flex-col gap-1 p-6">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.35)]" />
              <span className="text-[11px] font-medium uppercase tracking-[0.05em] text-on-surface">NODE_01</span>
            </div>
            <span className="pl-5 text-[10px] uppercase tracking-wider text-outline">Active Session</span>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-4">
            <div className="mb-6">
              <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.1em] text-outline">General</p>
              {nav.slice(0, 2).map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="mb-1 flex items-center gap-3 rounded px-4 py-2.5 text-xs text-outline transition-all hover:bg-surface-container hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </div>
            <div className="mb-6">
              <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.1em] text-outline">Endpoints</p>
              {nav.slice(2).map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`mb-1 flex items-center gap-3 border-l-2 px-4 py-2.5 text-xs transition-all ${
                    item.href === '#get-randomness'
                      ? 'border-primary bg-surface text-primary'
                      : 'border-transparent text-outline hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
          <div className="border-t border-outline-variant/10 bg-surface/50 p-4">
            <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-xs text-outline transition-all hover:text-on-surface">
              <span className="material-symbols-outlined text-lg">settings</span>
              Settings
            </Link>
          </div>
        </aside>

        <div className="mx-auto flex min-w-0 max-w-6xl flex-1 flex-col lg:flex-row">
          <div className="flex-1 border-r border-outline-variant/10 p-8 lg:p-12">
            <header className="mb-12">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">v1.4.0-STABLE</span>
                <span className="rounded bg-secondary/10 px-2 py-0.5 font-mono text-[10px] text-secondary">QUANTUM-READY</span>
              </div>
              <h1 className="font-headline mb-4 text-4xl font-bold tracking-tight text-on-surface">API Reference</h1>
              <p className="max-w-2xl leading-relaxed text-on-surface-variant">
                The Quantum Oracle API exposes entropy, PQC, protection, and oracle routes under{' '}
                <code className="font-mono text-sm text-primary">/api/v2</code>. Use the split{' '}
                <Link href="/docs/api" className="text-primary underline-offset-2 hover:underline">
                  terminal reference
                </Link>{' '}
                for a console-style layout.
              </p>
            </header>

            <section id="intro" className="mb-20 scroll-mt-28">
              <h2 className="mb-4 text-2xl font-semibold text-on-surface">Introduction</h2>
              <p className="text-on-surface-variant leading-relaxed">
                QCrypt RNG combines quantum-backed randomness with post-quantum tooling and blockchain-aware oracle flows.
                The dashboard surfaces Oracle, PQC Suite, Fulfillment, and monitoring under a single Zinc shell.
              </p>
            </section>

            <section id="auth" className="mb-20 scroll-mt-28">
              <h2 className="mb-4 text-2xl font-semibold text-on-surface">Authentication</h2>
              <p className="mb-6 text-on-surface-variant leading-relaxed">
                Point <code className="font-mono text-primary">NEXT_PUBLIC_API_BASE_URL</code> at your API root (e.g.{' '}
                <code className="font-mono text-sm">http://localhost:8000/api/v2</code>). The UI discovers healthy ports
                automatically when unset.
              </p>
            </section>

            <section id="get-randomness" className="mb-20 scroll-mt-28">
              <div className="mb-6 flex flex-wrap items-center gap-4">
                <span className="rounded bg-secondary-container px-2 py-1 text-[10px] font-bold text-on-secondary-container">
                  GET
                </span>
                <code className="font-mono text-sm text-primary">/quantum/entropy</code>
              </div>
              <h2 className="font-headline mb-4 text-2xl font-semibold text-on-surface">Get Randomness diagnostics</h2>
              <p className="mb-8 leading-relaxed text-on-surface-variant">
                Returns Shannon and min-entropy statistics for the entropy pool — used by the dashboard gauge and health
                indicators.
              </p>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-outline">Sample response keys</h3>
              <div className="space-y-4">
                <div className="rounded bg-surface-container-lowest p-4">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <code className="font-mono text-sm text-primary">shannon_entropy</code>
                    <span className="text-[10px] text-outline">number</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">Information density estimate for the pool.</p>
                </div>
                <div className="rounded bg-surface-container-lowest p-4">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <code className="font-mono text-sm text-primary">min_entropy</code>
                    <span className="text-[10px] text-outline">number</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">Conservative entropy bound — drives the gauge.</p>
                </div>
              </div>
            </section>

            <section id="post-pqc-signature" className="mb-20 scroll-mt-28">
              <div className="mb-6 flex flex-wrap items-center gap-4">
                <span className="rounded bg-primary-container px-2 py-1 text-[10px] font-bold text-on-primary-container">
                  POST
                </span>
                <code className="font-mono text-sm text-primary">/pqc/sign</code>
              </div>
              <h2 className="font-headline mb-4 text-2xl font-semibold text-on-surface">POST PQC Signature</h2>
              <p className="mb-8 leading-relaxed text-on-surface-variant">
                Sign messages with Dilithium, Falcon, or SPHINCS+ keys generated via <code className="font-mono text-primary">/pqc/generate</code>.
              </p>
              <div className="border-l-2 border-tertiary bg-surface-container p-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">shield_lock</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-tertiary">Security Notes</span>
                </div>
                <ul className="space-y-2 text-sm text-on-surface-variant">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-tertiary" />
                    Never send long-lived private keys through unsecured channels.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-tertiary" />
                    Hash large payloads client-side before signing when required by policy.
                  </li>
                </ul>
              </div>
            </section>

            <section id="fulfillment-hook" className="mb-20 scroll-mt-28">
              <div className="mb-6 flex flex-wrap items-center gap-4">
                <span className="rounded bg-primary-container px-2 py-1 text-[10px] font-bold text-on-primary-container">
                  POST
                </span>
                <code className="font-mono text-sm text-primary">/oracle/fulfillment/request</code>
              </div>
              <h2 className="font-headline mb-4 text-2xl font-semibold text-on-surface">Fulfillment hook</h2>
              <p className="leading-relaxed text-on-surface-variant">
                After configuring a chain via <code className="font-mono text-primary">/oracle/fulfillment/configure-chain</code>, create on-chain fulfillment requests from the{' '}
                <Link href="/fulfillment" className="text-primary hover:underline">
                  Fulfillment wizard
                </Link>
                .
              </p>
            </section>
          </div>

          <aside className="w-full space-y-8 p-8 lg:sticky lg:top-14 lg:h-fit lg:w-96 lg:self-start lg:p-8">
            <div className="overflow-hidden rounded border border-outline-variant/20 bg-surface-container-lowest shadow-2xl">
              <div className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-low px-4 py-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-error/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-tertiary/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-secondary/40" />
                </div>
                <span className="font-mono text-[10px] text-outline">DEBUG_CONSOLE_v1</span>
              </div>
              <div className="flex min-h-[200px] flex-col justify-between p-4 font-mono text-[11px]">
                <div>
                  <div className="mb-2 flex gap-2">
                    <span className="text-secondary">$</span>
                    <span className="text-on-surface">curl -X GET &quot;/api/v2/quantum/entropy&quot;</span>
                  </div>
                  <div className="leading-5 text-outline">
                    &gt; HTTP/1.1 200 OK
                    <br />
                    &gt; Content-Type: application/json
                    <br />
                    <br />
                    {'{'}
                    <br />
                    &nbsp;&nbsp;&quot;status&quot;: &quot;success&quot;,
                    <br />
                    &nbsp;&nbsp;&quot;data&quot;: &#123; &quot;shannon_entropy&quot;: … &#125;
                    <br />
                    {'}'}
                  </div>
                </div>
                <Link
                  href="/docs/api"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-primary-container py-2 text-[11px] font-bold uppercase tracking-widest text-on-primary-container transition-colors hover:brightness-110"
                >
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  Open terminal reference
                </Link>
              </div>
            </div>

            <nav className="hidden lg:block">
              <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-outline">On This Page</h4>
              <ul className="space-y-3 text-sm">
                {nav.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className="flex items-center gap-2 text-primary hover:text-on-surface">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="rounded bg-surface-container-low p-6">
              <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-outline">Infrastructure Status</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">Global Latency</span>
                  <span className="font-mono text-xs text-secondary">42ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">Pool health</span>
                  <span className="font-mono text-xs text-secondary">Nominal</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded bg-background">
                  <div className="h-full w-full bg-secondary" />
                </div>
                <p className="text-[10px] italic text-outline">Connect the Python API to enable live metrics.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
