'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Lock,
  Key,
  ArrowRight,
} from 'lucide-react';

export default function SimpleModePage() {
  const [recentActions, setRecentActions] = useState<Array<{ action: string; timestamp: string }>>([]);

  useEffect(() => {
    const actions = localStorage.getItem('qcrypt_recent_actions');
    if (actions) {
      setRecentActions(JSON.parse(actions));
    }
  }, []);

  const tools = [
    {
      id: 'random',
      title: 'Generate Random Data',
      description: 'Create secure passwords, encryption keys, or random identifiers',
      icon: <Zap className="h-8 w-8" />,
      href: '/wizard/random',
      color: 'emerald',
    },
    {
      id: 'encrypt',
      title: 'Encrypt or Decrypt',
      description: 'Protect your files or unlock encrypted data',
      icon: <Lock className="h-8 w-8" />,
      href: '/wizard/encrypt',
      color: 'blue',
    },
    {
      id: 'keys',
      title: 'Create PQC Keys',
      description: 'Generate quantum-safe cryptographic keys',
      icon: <Key className="h-8 w-8" />,
      href: '/pqc/keys',
      color: 'purple',
    },
  ];

  return (
    <div className="min-w-0 py-8">
      {/* Welcome Section */}
      <div className="mb-8 rounded-xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="mb-2 text-2xl font-semibold text-on-surface">
          What would you like to do?
        </h2>
        <p className="text-on-surface-variant">
          Choose a tool below to get started. Each tool will guide you through the process step by step.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className="group rounded-xl border-2 border-outline-variant/10 bg-surface-container-low p-6 transition-all hover:border-primary hover:shadow-lg"
          >
            <div className={`mb-3 text-${tool.color}-400`}>{tool.icon}</div>
            <h3 className="mb-2 text-lg font-semibold text-on-surface">
              {tool.title}
            </h3>
            <p className="mb-3 text-sm text-on-surface-variant">{tool.description}</p>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      {recentActions.length > 0 && (
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6">
          <h3 className="mb-4 text-lg font-semibold text-on-surface">Recent Activity</h3>
          <div className="space-y-2">
            {recentActions.slice(0, 5).map((action, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg bg-surface-container px-4 py-3">
                <span className="text-sm text-on-surface">{action.action}</span>
                <span className="text-xs text-on-surface-variant">
                  {new Date(action.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 rounded-xl border border-outline-variant/10 bg-surface-container-low/50 p-6">
        <h3 className="mb-3 text-base font-semibold text-on-surface">Need Help?</h3>
        <ul className="space-y-2 text-sm text-on-surface-variant">
          <li>• Click any tool above to start a guided wizard</li>
          <li>• All operations happen locally in your browser</li>
          <li>• Your data is never sent to our servers</li>
          <li>• Use the mode toggle in the top right to switch to Developer Mode</li>
        </ul>
      </div>
    </div>
  );
}
