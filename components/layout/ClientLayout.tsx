'use client';

import { useState, useEffect } from 'react';
import { CommandPalette } from '@/components/CommandPalette';
import { useAgentsStore } from '@/lib/stores/agents';
import { useTemplatesStore } from '@/lib/stores/templates';
import { useCrewsStore } from '@/lib/stores/crews';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { fetchAgents } = useAgentsStore();
  const { fetchTemplates } = useTemplatesStore();
  const { fetchCrews } = useCrewsStore();

  // Fetch data for command palette on mount
  useEffect(() => {
    fetchAgents();
    fetchTemplates();
    fetchCrews();
  }, [fetchAgents, fetchTemplates, fetchCrews]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {children}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
}
