import React, { useState, useRef, useEffect } from 'react';
import { Tab } from '../types';
import { Plus, X, FileText, Settings, Download, Save, FolderOpen } from 'lucide-react';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onTabClose: (id: string, e: React.MouseEvent) => void;
  onNewTab: () => void;
  onRenameTab: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  onExport: () => void;
  onSave: () => void;
  onOpen: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({ 
  tabs, 
  activeTabId, 
  onTabClick, 
  onTabClose, 
  onNewTab,
  onRenameTab,
  onOpenSettings,
  onExport,
  onSave,
  onOpen
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDoubleClick = (e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation();
    setEditingId(tab.id);
    setEditValue(tab.title);
  };

  const handleSaveTitle = () => {
    if (editingId) {
      onRenameTab(editingId, editValue);
      setEditingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-row items-center bg-neutral-950 border-b border-neutral-800 h-10 overflow-x-auto select-none no-scrollbar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={`
            group flex items-center h-full px-3 min-w-[120px] max-w-[200px] 
            border-r border-neutral-800 cursor-pointer transition-colors duration-100
            ${activeTabId === tab.id 
              ? 'bg-neutral-900 text-neutral-100 border-t-2 border-t-white' 
              : 'bg-neutral-950 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300 border-t-2 border-t-transparent'}
          `}
        >
          <FileText size={14} className="mr-2 opacity-50 flex-shrink-0" />
          
          {editingId === tab.id ? (
             <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-800 text-white text-xs font-medium focus:outline-none w-full px-1 border border-neutral-600 rounded"
             />
          ) : (
             <span 
               className="truncate text-xs font-medium flex-1"
               onDoubleClick={(e) => handleDoubleClick(e, tab)}
               title="Double-click to rename"
             >
               {tab.title || 'Untitled'}
             </span>
          )}

          <button
            onClick={(e) => onTabClose(tab.id, e)}
            className={`
              ml-2 p-0.5 rounded-full hover:bg-neutral-700 hover:text-white
              opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0
              ${activeTabId === tab.id ? 'opacity-100' : ''}
            `}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <button
        onClick={onNewTab}
        className="h-full px-3 text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors flex items-center justify-center border-r border-neutral-800"
        title="New Tab (Ctrl+N)"
      >
        <Plus size={16} />
      </button>
      
      {/* Spacer to fill rest of bar */}
      <div className="flex-1 bg-neutral-950 h-full"></div>
      
      {/* Open Button */}
      <button 
        onClick={onOpen}
        className="h-full px-3 text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors flex items-center justify-center border-l border-neutral-800"
        title="Open File (Ctrl+O)"
      >
        <FolderOpen size={16} />
      </button>

      {/* Save Button */}
      <button 
        onClick={onSave}
        className="h-full px-3 text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors flex items-center justify-center border-l border-neutral-800"
        title="Save As (Ctrl+S)"
      >
        <Save size={16} />
      </button>

      {/* Export Button */}
      <button 
        onClick={onExport}
        className="h-full px-3 text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors flex items-center justify-center border-l border-neutral-800"
        title="Export File"
      >
        <Download size={16} />
      </button>

      {/* Settings Button */}
      <button 
        onClick={onOpenSettings}
        className="h-full px-3 text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors flex items-center justify-center border-l border-neutral-800"
        title="Settings"
      >
        <Settings size={16} />
      </button>
    </div>
  );
};