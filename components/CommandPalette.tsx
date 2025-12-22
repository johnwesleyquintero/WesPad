import React, { useState, useEffect, useRef } from 'react';
import { 
  FilePlus, FolderOpen, Save, Download, Settings, 
  Sparkles, Eye, Columns, PenTool, Search, Command 
} from 'lucide-react';
import { ViewMode } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: {
    onNewTab: () => void;
    onOpenFile: () => void;
    onSaveAs: () => void;
    onExport: () => void;
    onSettings: () => void;
    onAI: () => void;
    onFind: () => void;
    setViewMode: (mode: ViewMode) => void;
  }
}

interface CommandOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, actions }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandOption[] = [
    { id: 'new-tab', label: 'New Tab', icon: <FilePlus size={16} />, action: actions.onNewTab, shortcut: 'Ctrl+N' },
    { id: 'open-file', label: 'Open File', icon: <FolderOpen size={16} />, action: actions.onOpenFile, shortcut: 'Ctrl+O' },
    { id: 'save-as', label: 'Save As...', icon: <Save size={16} />, action: actions.onSaveAs, shortcut: 'Ctrl+S' },
    { id: 'export', label: 'Export to File', icon: <Download size={16} />, action: actions.onExport },
    { id: 'find', label: 'Find & Replace', icon: <Search size={16} />, action: actions.onFind, shortcut: 'Ctrl+F' },
    { id: 'ai', label: 'Open AI Tools', icon: <Sparkles size={16} />, action: actions.onAI, shortcut: 'Ctrl+K' },
    { id: 'view-edit', label: 'View: Editor Only', icon: <PenTool size={16} />, action: () => actions.setViewMode(ViewMode.EDIT) },
    { id: 'view-split', label: 'View: Split Screen', icon: <Columns size={16} />, action: () => actions.setViewMode(ViewMode.SPLIT) },
    { id: 'view-preview', label: 'View: Preview Only', icon: <Eye size={16} />, action: () => actions.setViewMode(ViewMode.PREVIEW) },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} />, action: actions.onSettings },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Small timeout to ensure DOM is rendered before focusing
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle scrolling when selection changes
  useEffect(() => {
    if (listRef.current && filteredCommands.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, filteredCommands]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm animate-in fade-in duration-100" onClick={onClose}>
      <div 
        className="w-[500px] max-w-[90vw] bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center p-3 border-b border-neutral-800">
          <Command size={18} className="text-neutral-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-white text-base placeholder-neutral-600 focus:outline-none"
            placeholder="Type a command..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
        </div>
        
        <div ref={listRef} className="max-h-[300px] overflow-y-auto py-1">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-3 text-neutral-500 text-sm text-center">No matching commands</div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                  index === selectedIndex 
                    ? 'bg-neutral-800 text-white' 
                    : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                }`}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center">
                  <span className={`mr-3 ${index === selectedIndex ? 'text-white' : 'text-neutral-500'}`}>
                    {cmd.icon}
                  </span>
                  <span className="text-sm font-medium">{cmd.label}</span>
                </div>
                {cmd.shortcut && (
                  <span className="text-xs text-neutral-600 font-mono bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                    {cmd.shortcut}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
        
        <div className="bg-neutral-950 border-t border-neutral-800 px-3 py-1.5 flex justify-between items-center text-[10px] text-neutral-600">
          <div className="flex gap-2">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
};