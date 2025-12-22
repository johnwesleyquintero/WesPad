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
    <div className="absolute top-4 right-16 z-40 w-80 bg-neutral-900 border border-neutral-700 shadow-xl rounded-lg overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
      
      {/* Find Section */}
      <div className="flex items-center p-2 border-b border-neutral-800 gap-2">
        <button 
            onClick={() => setIsReplaceMode(!isReplaceMode)}
            className={`p-1 rounded hover:bg-neutral-800 transition-colors ${isReplaceMode ? 'text-white' : 'text-neutral-500'}`}
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
            className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none placeholder-neutral-600"
        />
        <div className="flex items-center border-l border-neutral-800 pl-1">
            <button onClick={() => onFindPrev(findText)} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white" title="Previous (Shift+Enter)">
                <ChevronUp size={16} />
            </button>
            <button onClick={() => onFindNext(findText)} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white" title="Next (Enter)">
                <ChevronDown size={16} />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white ml-1">
                <X size={16} />
            </button>
        </div>
      </div>

      {/* Replace Section */}
      {isReplaceMode && (
        <div className="flex items-center p-2 bg-neutral-950 gap-2">
             <div className="w-6 flex justify-center">
                 <span className="text-neutral-600 text-xs">↳</span>
             </div>
             <input 
                type="text" 
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replace"
                className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none placeholder-neutral-600"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        onReplace(findText, replaceText);
                    }
                }}
            />
            <div className="flex items-center gap-1">
                <button 
                    onClick={() => onReplace(findText, replaceText)}
                    className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded border border-neutral-700"
                >
                    Replace
                </button>
                <button 
                    onClick={() => onReplaceAll(findText, replaceText)}
                    className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded border border-neutral-700"
                >
                    All
                </button>
            </div>
        </div>
      )}
    </div>
  );
};
