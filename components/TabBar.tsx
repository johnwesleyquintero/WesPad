import React, { useState, useRef, useEffect } from 'react';
import { Tab } from '../types';
import { Plus, X, FileText, Settings, Download, Save, FolderOpen, Undo2, Redo2 } from 'lucide-react';

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
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
  onOpen,
  onUndo,
  onRedo,
  canUndo,
  canRedo
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
    <div className="flex flex-row items-center bg-background border-b border-border h-11 overflow-x-auto select-none no-scrollbar">
      {/* Tabs Area */}
      <div className="flex items-end h-full px-2 space-x-1">
        {tabs.map((tab) => (
            <div
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={`
                group relative flex items-center h-9 px-3 min-w-[140px] max-w-[220px] 
                cursor-pointer transition-all duration-200 rounded-t-lg border-t border-x
                ${activeTabId === tab.id 
                ? 'bg-background border-border text-text shadow-sm -mb-px pb-1 z-10' 
                : 'bg-surface/50 border-transparent text-muted hover:bg-surface hover:text-text mb-1'}
            `}
            >
            <FileText size={13} className={`mr-2 flex-shrink-0 ${activeTabId === tab.id ? 'text-text' : 'text-muted'}`} />
            
            {editingId === tab.id ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-text text-xs font-medium focus:outline-none w-full border-b border-text/20"
                />
            ) : (
                <span 
                className="truncate text-xs font-medium flex-1 pb-px"
                onDoubleClick={(e) => handleDoubleClick(e, tab)}
                title="Double-click to rename"
                >
                {tab.title || 'Untitled'}
                </span>
            )}

            <button
                onClick={(e) => onTabClose(tab.id, e)}
                className={`
                ml-2 p-0.5 rounded-full hover:bg-muted/20 text-muted hover:text-red-500
                opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0
                ${activeTabId === tab.id ? 'opacity-100' : ''}
                `}
            >
                <X size={11} />
            </button>
            
            {/* Active Indicator Line */}
            {activeTabId === tab.id && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-text rounded-t-full"></div>
            )}
            </div>
        ))}
        <button
            onClick={onNewTab}
            className="h-8 w-8 mb-1 rounded-md text-muted hover:text-text hover:bg-surface transition-colors flex items-center justify-center"
            title="New Tab (Ctrl+N)"
        >
            <Plus size={16} />
        </button>
      </div>
      
      {/* Spacer */}
      <div className="flex-1 h-full border-b border-border"></div>
      
      {/* Controls */}
      <div className="flex items-center h-full border-b border-border px-2 space-x-1">
        <div className="flex items-center space-x-1 pr-2 border-r border-border h-6 my-auto">
            <IconButton onClick={onUndo} disabled={!canUndo} icon={<Undo2 size={15} />} title="Undo" />
            <IconButton onClick={onRedo} disabled={!canRedo} icon={<Redo2 size={15} />} title="Redo" />
        </div>

        <IconButton onClick={onOpen} icon={<FolderOpen size={15} />} title="Open (Ctrl+O)" />
        <IconButton onClick={onSave} icon={<Save size={15} />} title="Save (Ctrl+S)" />
        <IconButton onClick={onExport} icon={<Download size={15} />} title="Export" />
        <IconButton onClick={onOpenSettings} icon={<Settings size={15} />} title="Settings" />
      </div>
    </div>
  );
};

const IconButton = ({ onClick, disabled, icon, title }: any) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`
            p-1.5 rounded-md transition-all
            ${disabled 
                ? 'text-muted/20 cursor-not-allowed' 
                : 'text-muted hover:text-text hover:bg-surface'}
        `}
        title={title}
    >
        {icon}
    </button>
);