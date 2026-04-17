'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type PaletteCommand = {
  id: string;
  label: string;
  group: string;
  hint?: string;
  shortcut?: string;
  run: () => void;
};

/**
 * Command palette — ⌘K / Ctrl+K to open.
 * Fuzzy-ish filter on label + group + hint.
 */
export const CommandPalette = ({
  commands,
  open,
  onOpenChange,
}: {
  commands: PaletteCommand[];
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) => {
  // Remount the inner view every time the palette is re-opened so fresh
  // state (empty query, active=0, input focused) comes for free — no
  // setState-in-effect warnings, and no stale filter between opens.
  if (!open) return null;
  return (
    <PaletteView key="palette" commands={commands} onOpenChange={onOpenChange} />
  );
};

const PaletteView = ({
  commands,
  onOpenChange,
}: {
  commands: PaletteCommand[];
  onOpenChange: (next: boolean) => void;
}) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input once on mount
  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(id);
  }, []);

  // ESC closes the palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpenChange]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      (c.label + ' ' + c.group + ' ' + (c.hint ?? '')).toLowerCase().includes(q),
    );
  }, [commands, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, PaletteCommand[]>();
    filtered.forEach((c) => {
      if (!map.has(c.group)) map.set(c.group, []);
      map.get(c.group)!.push(c);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const handleNavigate = useCallback(
    (dir: 1 | -1) => {
      if (filtered.length === 0) return;
      setActive((prev) => (prev + dir + filtered.length) % filtered.length);
    },
    [filtered.length],
  );

  const run = (cmd: PaletteCommand) => {
    cmd.run();
    onOpenChange(false);
  };

  return (
    <div
      className="overlay-backdrop flex items-start justify-center pt-28"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="w-full max-w-xl mx-4 section p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgb(var(--border))]">
          <span className="text-[rgb(var(--green))] font-semibold">$</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                handleNavigate(1);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                handleNavigate(-1);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                const cmd = filtered[active];
                if (cmd) run(cmd);
              }
            }}
            placeholder="type a command, or search…"
            className="flex-1 bg-transparent text-[rgb(var(--fg))] placeholder:text-[rgb(var(--fg-dim))] outline-none text-sm font-mono"
          />
          <span className="kbd">ESC</span>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {grouped.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-[rgb(var(--fg-dim))]">
              no matches. try a different command.
            </div>
          )}
          {grouped.map(([group, items]) => (
            <div key={group} className="px-2 pb-2">
              <div className="px-3 pt-2 pb-1 text-[10px] tracking-[0.15em] uppercase text-[rgb(var(--fg-dim))]">
                {group}
              </div>
              {items.map((cmd) => {
                const idx = filtered.indexOf(cmd);
                const isActive = idx === active;
                return (
                  <button
                    key={cmd.id}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => run(cmd)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 rounded-[2px] transition-colors ${
                      isActive
                        ? 'bg-[rgba(0,255,156,0.08)] text-[rgb(var(--green))]'
                        : 'text-[rgb(var(--fg))] hover:bg-[rgba(0,255,156,0.04)]'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <span className={isActive ? 'opacity-100' : 'opacity-50'}>›</span>
                      <span>{cmd.label}</span>
                      {cmd.hint && (
                        <span className="text-[rgb(var(--fg-dim))] text-xs">— {cmd.hint}</span>
                      )}
                    </span>
                    {cmd.shortcut && <span className="kbd">{cmd.shortcut}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-[rgb(var(--border))] text-[10px] text-[rgb(var(--fg-dim))] tracking-wider uppercase">
          <span>
            <span className="kbd">↑</span> <span className="kbd">↓</span> navigate
            <span className="mx-2">·</span>
            <span className="kbd">↵</span> select
          </span>
          <span>{filtered.length} result{filtered.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
};
