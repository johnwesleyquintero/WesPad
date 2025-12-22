import React from 'react';
import { Tab } from '../types';
import { Plus, X, FileText, Settings, Download } from 'lucide-react';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onTabClose: (id: string, e: React.MouseEvent) => void;
  onNewTab: () => void;
  onOpenSettings: () => void;
  onExport: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({ 
  tabs, 
  activeTabId, 
  onTabClick, 
  onTabClose, 
  onNewTab,
  onOpenSettings,
  onExport
}) => {
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
          <FileText size={14} className="mr-2 opacity-50" />
          <span className="truncate text-xs font-medium flex-1">
            {tab.title || 'Untitled'}
          </span>
          <button
            onClick={(e) => onTabClose(tab.id, e)}
            className={`
              ml-2 p-0.5 rounded-full hover:bg-neutral-700 hover:text-white
              opacity-0 group-hover:opacity-100 transition-opacity
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