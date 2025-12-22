import React from 'react';
import { CursorPosition, ViewMode } from '../types';
import { Columns, Eye, PenTool } from 'lucide-react';

interface StatusBarProps {
  cursor: CursorPosition;
  characterCount: number;
  wordCount: number;
  selectionStats?: { wordCount: number; charCount: number };
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isSaved: boolean;
  readingTime: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  cursor, 
  characterCount, 
  wordCount,
  selectionStats,
  viewMode, 
  setViewMode,
  isSaved,
  readingTime
}) => {
  return (
    <div className="h-7 bg-background border-t border-border flex items-center justify-between px-3 text-[10px] sm:text-xs text-muted select-none transition-colors">
      <div className="flex items-center space-x-4">
        <span className="w-24 font-mono">Ln {cursor.line}, Col {cursor.column}</span>
        
        <div className="flex items-center space-x-3 border-l border-border pl-4">
            {selectionStats && selectionStats.charCount > 0 ? (
                <>
                    <span className="font-mono text-text">{selectionStats.wordCount} words selected</span>
                    <span className="font-mono">{selectionStats.charCount} chars</span>
                </>
            ) : (
                <>
                    <span className="font-mono">{wordCount} words</span>
                    <span className="font-mono">{characterCount} chars</span>
                    <span className="font-mono border-l border-border pl-3 ml-3 hidden sm:inline">~{readingTime} min read</span>
                </>
            )}
        </div>
        
        <span className={`border-l border-border pl-4 ${isSaved ? 'text-muted' : 'text-text'}`}>
          {isSaved ? 'Saved' : 'Unsaved'}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button 
          onClick={() => setViewMode(ViewMode.EDIT)}
          className={`p-1 rounded flex items-center space-x-1 hover:bg-surface hover:text-text ${viewMode === ViewMode.EDIT ? 'text-text' : ''}`}
          title="Edit Mode"
        >
          <PenTool size={12} />
          <span className="hidden sm:inline">Editor</span>
        </button>
        <button 
          onClick={() => setViewMode(ViewMode.SPLIT)}
          className={`p-1 rounded flex items-center space-x-1 hover:bg-surface hover:text-text ${viewMode === ViewMode.SPLIT ? 'text-text' : ''}`}
          title="Split View"
        >
          <Columns size={12} />
          <span className="hidden sm:inline">Split</span>
        </button>
        <button 
          onClick={() => setViewMode(ViewMode.PREVIEW)}
          className={`p-1 rounded flex items-center space-x-1 hover:bg-surface hover:text-text ${viewMode === ViewMode.PREVIEW ? 'text-text' : ''}`}
          title="Preview Mode"
        >
          <Eye size={12} />
          <span className="hidden sm:inline">Preview</span>
        </button>
      </div>
    </div>
  );
};