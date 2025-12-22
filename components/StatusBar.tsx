import React from 'react';
import { CursorPosition, ViewMode } from '../types';
import { Columns, Eye, PenTool } from 'lucide-react';

interface StatusBarProps {
  cursor: CursorPosition;
  characterCount: number;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isSaved: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  cursor, 
  characterCount, 
  viewMode, 
  setViewMode,
  isSaved 
}) => {
  return (
    <div className="h-7 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between px-3 text-[10px] sm:text-xs text-neutral-500 select-none">
      <div className="flex items-center space-x-4">
        <span className="w-24 font-mono">Ln {cursor.line}, Col {cursor.column}</span>
        <span className="w-24 font-mono">{characterCount} chars</span>
        <span className={isSaved ? 'text-neutral-500' : 'text-neutral-200'}>
          {isSaved ? 'Saved' : 'Unsaved'}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button 
          onClick={() => setViewMode(ViewMode.EDIT)}
          className={`p-1 rounded flex items-center space-x-1 hover:bg-neutral-800 ${viewMode === ViewMode.EDIT ? 'text-white' : ''}`}
          title="Edit Mode"
        >
          <PenTool size={12} />
          <span className="hidden sm:inline">Editor</span>
        </button>
        <button 
          onClick={() => setViewMode(ViewMode.SPLIT)}
          className={`p-1 rounded flex items-center space-x-1 hover:bg-neutral-800 ${viewMode === ViewMode.SPLIT ? 'text-white' : ''}`}
          title="Split View"
        >
          <Columns size={12} />
          <span className="hidden sm:inline">Split</span>
        </button>
        <button 
          onClick={() => setViewMode(ViewMode.PREVIEW)}
          className={`p-1 rounded flex items-center space-x-1 hover:bg-neutral-800 ${viewMode === ViewMode.PREVIEW ? 'text-white' : ''}`}
          title="Preview Mode"
        >
          <Eye size={12} />
          <span className="hidden sm:inline">Preview</span>
        </button>
      </div>
    </div>
  );
};