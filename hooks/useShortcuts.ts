import { useEffect } from 'react';
import { ViewMode } from '../types';

interface ShortcutConfig {
  createTab: () => void;
  openFile: () => void;
  saveAs: () => void;
  toggleZenMode: () => void;
  undo: () => void;
  redo: () => void;
  toggleAI: () => void;
  toggleFind: () => void;
  toggleCommandPalette: () => void;
  isZenMode: boolean;
}

export const useShortcuts = ({
  createTab,
  openFile,
  saveAs,
  toggleZenMode,
  undo,
  redo,
  toggleAI,
  toggleFind,
  toggleCommandPalette,
  isZenMode
}: ShortcutConfig) => {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      
      // Global shortcuts
      if (isMod && e.shiftKey && e.key.toLowerCase() === 'p') { e.preventDefault(); toggleCommandPalette(); return; }
      if (isMod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((isMod && e.key.toLowerCase() === 'y') || (isMod && e.shiftKey && e.key.toLowerCase() === 'z')) { e.preventDefault(); redo(); return; }
      if (isMod && e.key === 'n') { e.preventDefault(); createTab(); return; }
      if (isMod && e.key === 'o') { e.preventDefault(); openFile(); return; }
      if (isMod && e.key === 's') { e.preventDefault(); saveAs(); return; }
      if (isMod && e.key === 'k') { e.preventDefault(); toggleAI(); return; }
      if (isMod && e.key === 'f') { e.preventDefault(); toggleFind(); return; }
      if (e.altKey && e.key.toLowerCase() === 'z') { e.preventDefault(); toggleZenMode(); return; }
      
      // Context specific
      if (e.key === 'Escape') {
          if (isZenMode) toggleZenMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createTab, openFile, saveAs, toggleZenMode, undo, redo, toggleAI, toggleFind, toggleCommandPalette, isZenMode]);
};