import React, { useEffect, useLayoutEffect } from 'react';
import { CursorPosition } from '../types';
import * as TextUtils from '../utils/textManipulation';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  onCursorChange: (pos: CursorPosition) => void;
  onSelectionStatsChange?: (stats: { wordCount: number; charCount: number }) => void;
  editorRef: React.RefObject<HTMLTextAreaElement>;
  settings: {
    fontSize: number;
    fontFamily: string;
    wordWrap: boolean;
  };
  initialScrollTop?: number;
  initialSelection?: { start: number; end: number };
  onSaveState: (state: { scrollTop: number; selection: { start: number; end: number } }) => void;
  isZenMode: boolean;
}

export const Editor: React.FC<EditorProps> = ({ 
  content, 
  onChange, 
  onCursorChange,
  onSelectionStatsChange,
  editorRef,
  settings,
  initialScrollTop,
  initialSelection,
  onSaveState,
  isZenMode
}) => {
  
  // Restore state on mount (which happens on tab switch due to key prop)
  useLayoutEffect(() => {
    if (editorRef.current) {
        if (typeof initialScrollTop === 'number') {
            editorRef.current.scrollTop = initialScrollTop;
        }
        if (initialSelection) {
            editorRef.current.setSelectionRange(initialSelection.start, initialSelection.end);
        }
    }
  }, []);

  // Save state on unmount
  useEffect(() => {
    return () => {
        if (editorRef.current) {
            onSaveState({
                scrollTop: editorRef.current.scrollTop,
                selection: {
                    start: editorRef.current.selectionStart,
                    end: editorRef.current.selectionEnd
                }
            });
        }
    };
  }, [onSaveState]);

  const handleSelect = () => {
    if (editorRef.current) {
      const { value, selectionStart, selectionEnd } = editorRef.current;
      
      // Cursor Position Logic
      const textUpToCursor = value.substring(0, selectionStart);
      const line = textUpToCursor.split('\n').length;
      const column = selectionStart - textUpToCursor.lastIndexOf('\n');
      onCursorChange({ line, column });

      // Selection Stats Logic
      if (onSelectionStatsChange) {
        if (selectionStart !== selectionEnd) {
            const selectedText = value.substring(selectionStart, selectionEnd);
            const words = selectedText.trim().split(/\s+/).filter(w => w.length > 0).length;
            onSelectionStatsChange({ wordCount: words, charCount: selectedText.length });
        } else {
            onSelectionStatsChange({ wordCount: 0, charCount: 0 });
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    handleSelect();
  };

  const applyMutation = (result: { newValue: string; newSelectionStart: number; newSelectionEnd: number }) => {
    onChange(result.newValue);
    setTimeout(() => {
        if (editorRef.current) {
            editorRef.current.focus();
            editorRef.current.setSelectionRange(result.newSelectionStart, result.newSelectionEnd);
            handleSelect();
        }
    }, 0);
  };

  const handleFormat = (wrapper: string) => {
    if (!editorRef.current) return;
    
    const state = {
        value: editorRef.current.value,
        selectionStart: editorRef.current.selectionStart,
        selectionEnd: editorRef.current.selectionEnd
    };

    const result = TextUtils.handleFormatWrapper(state, wrapper);
    applyMutation(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = e.ctrlKey || e.metaKey;
    if (!editorRef.current) return;

    const state = {
        value: editorRef.current.value,
        selectionStart: editorRef.current.selectionStart,
        selectionEnd: editorRef.current.selectionEnd
    };

    // 1. Tab Indentation
    if (e.key === 'Tab') {
      const result = TextUtils.handleTabIndentation(state);
      e.preventDefault();
      applyMutation(result);
      return;
    }

    // 2. Overtype closing pair
    if (!isMod) {
        const overtypeResult = TextUtils.handleOvertype(state, e.key);
        if (overtypeResult) {
            e.preventDefault();
            // Just move cursor, no value change
            if (editorRef.current) {
                editorRef.current.setSelectionRange(overtypeResult.newSelectionStart, overtypeResult.newSelectionEnd);
                handleSelect();
            }
            return;
        }
    }

    // 3. Auto-Close Pairs
    if (!isMod) {
        const autoCloseResult = TextUtils.handleAutoClose(state, e.key);
        if (autoCloseResult) {
            e.preventDefault();
            applyMutation(autoCloseResult);
            return;
        }
    }

    // 4. Smart Lists (Enter)
    if (e.key === 'Enter') {
        const listResult = TextUtils.handleSmartList(state);
        if (listResult) {
            e.preventDefault();
            applyMutation(listResult);
            return;
        }
    }

    // 5. Smart Backspace
    if (e.key === 'Backspace') {
         const bsResult = TextUtils.handleSmartBackspace(state);
         if (bsResult) {
             e.preventDefault();
             applyMutation(bsResult);
             return;
         }
    }

    // Bold: Ctrl+B
    if (isMod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleFormat('**');
    }

    // Italic: Ctrl+I
    if (isMod && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleFormat('*');
    }
  };

  const getFontFamily = () => {
    switch(settings.fontFamily) {
      case 'sans': return 'font-sans';
      case 'serif': return 'font-serif';
      default: return 'font-mono';
    }
  };

  return (
    <div className={`w-full h-full flex justify-center bg-background overflow-hidden ${isZenMode ? 'items-start pt-10' : ''}`}>
        <textarea
        ref={editorRef}
        className={`
            h-full bg-background text-text p-4 pb-96 resize-none focus:outline-none 
            transition-all duration-300
            ${getFontFamily()}
            ${settings.wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'}
            ${isZenMode ? 'max-w-3xl w-full border-none' : 'w-full'}
        `}
        style={{ fontSize: `${settings.fontSize}px` }}
        value={content}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        placeholder="Start writing..."
        spellCheck={false}
        autoFocus
        />
    </div>
  );
};