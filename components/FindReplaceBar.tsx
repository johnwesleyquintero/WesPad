import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronUp, ChevronDown, Search } from 'lucide-react';

interface FindReplaceBarProps {
  isOpen: boolean;
  onClose: () => void;
  onFindNext: (query: string) => void;
  onFindPrev: (query: string) => void;
  onReplace: (find: string, replace: string) => void;
  onReplaceAll: (find: string, replace: string) => void;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  isOpen,
  onClose,
  onFindNext,
  onFindPrev,
  onReplace,
  onReplaceAll
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onFindPrev(findText);
      } else {
        onFindNext(findText);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="absolute top-4 right-16 z-40 w-80 bg-surface border border-border shadow-xl rounded-lg overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200 text-text">
      
      {/* Find Section */}
      <div className="flex items-center p-2 border-b border-border gap-2">
        <button 
            onClick={() => setIsReplaceMode(!isReplaceMode)}
            className={`p-1 rounded hover:bg-background transition-colors ${isReplaceMode ? 'text-text' : 'text-muted'}`}
            title="Toggle Replace"
        >
            <Search size={14} />
        </button>
        <input 
            ref={inputRef}
            type="text" 
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find"
            className="flex-1 bg-transparent border-none text-text text-sm focus:outline-none placeholder-muted"
        />
        <div className="flex items-center border-l border-border pl-1">
            <button onClick={() => onFindPrev(findText)} className="p-1 hover:bg-background rounded text-muted hover:text-text" title="Previous (Shift+Enter)">
                <ChevronUp size={16} />
            </button>
            <button onClick={() => onFindNext(findText)} className="p-1 hover:bg-background rounded text-muted hover:text-text" title="Next (Enter)">
                <ChevronDown size={16} />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-background rounded text-muted hover:text-text ml-1">
                <X size={16} />
            </button>
        </div>
      </div>

      {/* Replace Section */}
      {isReplaceMode && (
        <div className="flex items-center p-2 bg-background gap-2">
             <div className="w-6 flex justify-center">
                 <span className="text-muted text-xs">↳</span>
             </div>
             <input 
                type="text" 
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replace"
                className="flex-1 bg-transparent border-none text-text text-sm focus:outline-none placeholder-muted"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        onReplace(findText, replaceText);
                    }
                }}
            />
            <div className="flex items-center gap-1">
                <button 
                    onClick={() => onReplace(findText, replaceText)}
                    className="px-2 py-1 bg-surface hover:bg-background text-muted hover:text-text text-xs rounded border border-border"
                >
                    Replace
                </button>
                <button 
                    onClick={() => onReplaceAll(findText, replaceText)}
                    className="px-2 py-1 bg-surface hover:bg-background text-muted hover:text-text text-xs rounded border border-border"
                >
                    All
                </button>
            </div>
        </div>
      )}
    </div>
  );
};