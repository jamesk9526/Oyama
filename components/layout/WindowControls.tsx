'use client';

import { useEffect, useState } from 'react';
import { Minus, Square, X } from 'lucide-react';

export function WindowControls() {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    setIsElectron(typeof window !== 'undefined' && (window as any).electronAPI !== undefined);
  }, []);

  if (!isElectron) {
    return null;
  }

  const handleMinimize = () => {
    (window as any).electronAPI?.minimizeWindow?.();
  };

  const handleMaximize = () => {
    (window as any).electronAPI?.maximizeWindow?.();
  };

  const handleClose = () => {
    (window as any).electronAPI?.closeWindow?.();
  };

  return (
    <div className="flex items-center gap-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
      <button
        onClick={handleMinimize}
        className="p-2 hover:bg-secondary transition-colors text-foreground/70 hover:text-foreground"
        title="Minimize"
      >
        <Minus className="w-4 h-4" />
      </button>
      <button
        onClick={handleMaximize}
        className="p-2 hover:bg-secondary transition-colors text-foreground/70 hover:text-foreground"
        title="Maximize"
      >
        <Square className="w-4 h-4" />
      </button>
      <button
        onClick={handleClose}
        className="p-2 hover:bg-destructive transition-colors text-foreground/70 hover:text-foreground"
        title="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
