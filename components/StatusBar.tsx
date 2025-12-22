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
    <div className="h-7 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-3 text-[10px] sm:text-xs text-slate-400 select-none">
      <div className="flex items-center space-x-4">
        <span className="w-24">Ln {cursor.line}, Col {cursor.column}</span>
        <span className="w-24">{characterCount} chars</span>
        <span className={isSaved ? 'text-slate-500' : 'text-yellow-500'}>
          {isSaved ? 'Saved' : 'Unsaved'}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button 
          onClick={() => setViewMode(ViewMode.EDIT)}
          className={`p-1 rounded flex items-center space-x-1 hover:bg-slate-800 ${viewMode === ViewMode.EDIT ? 'text-sky-400' : ''}`}
          title="Edit Mode"
        >
          <PenTool size={12} />
          <span className="hidden sm:inline">Editor</span>
        </button>
        <button 
          onClick={() => setViewMode(ViewMode.SPLIT)}
          className={`p-1 rounded flex items-center space-x-1 hover:bg-slate-800 ${viewMode === ViewMode.SPLIT ? 'text-sky-400' : ''}`}
          title="Split View"
        >
          <Columns size={12} />
          <span className="hidden sm:inline">Split</span>
        </button>
        <button 
          onClick={() => setViewMode(ViewMode.PREVIEW)}
          className={`p-1 rounded flex items-center space-x-1 hover:bg-slate-800 ${viewMode === ViewMode.PREVIEW ? 'text-sky-400' : ''}`}
          title="Preview Mode"
        >
          <Eye size={12} />
          <span className="hidden sm:inline">Preview</span>
        </button>
      </div>
    </div>
  );
};
