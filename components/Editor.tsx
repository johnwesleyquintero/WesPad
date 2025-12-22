import React, { useEffect, useLayoutEffect } from 'react';
import { CursorPosition } from '../types';

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
}

const AUTO_CLOSE_PAIRS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  '`': '`',
};

export const Editor: React.FC<EditorProps> = ({ 
  content, 
  onChange, 
  onCursorChange,
  onSelectionStatsChange,
  editorRef,
  settings,
  initialScrollTop,
  initialSelection,
  onSaveState
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

  const handleFormat = (wrapper: string) => {
    if (!editorRef.current) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const value = editorRef.current.value;
    
    const selectedText = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);
    
    // Check if selection itself is wrapped
    if (selectedText.startsWith(wrapper) && selectedText.endsWith(wrapper) && selectedText.length >= 2 * wrapper.length) {
        const newText = selectedText.substring(wrapper.length, selectedText.length - wrapper.length);
        const newValue = before + newText + after;
        onChange(newValue);
        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.focus();
                editorRef.current.setSelectionRange(start, start + newText.length);
            }
        }, 0);
        return;
    }

    // Check if surrounding text is wrapped
    if (before.endsWith(wrapper) && after.startsWith(wrapper)) {
        const newBefore = before.substring(0, before.length - wrapper.length);
        const newAfter = after.substring(wrapper.length);
        const newValue = newBefore + selectedText + newAfter;
        onChange(newValue);
        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.focus();
                editorRef.current.setSelectionRange(start - wrapper.length, end - wrapper.length);
            }
        }, 0);
        return;
    }

    // Apply wrapper
    const newValue = before + wrapper + selectedText + wrapper + after;
    onChange(newValue);
    setTimeout(() => {
        if (editorRef.current) {
            editorRef.current.focus();
            editorRef.current.setSelectionRange(start + wrapper.length, end + wrapper.length);
        }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = e.ctrlKey || e.metaKey;

    // 1. Tab Indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!editorRef.current) return;

      const start = editorRef.current.selectionStart;
      const end = editorRef.current.selectionEnd;
      const value = editorRef.current.value;

      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        if(editorRef.current) {
            editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2;
        }
      }, 0);
      return;
    }

    // 2. Skip over closing pair if typed (Overtype)
    if (!isMod && Object.values(AUTO_CLOSE_PAIRS).includes(e.key)) {
        if (!editorRef.current) return;
        const start = editorRef.current.selectionStart;
        const value = editorRef.current.value;
        // If the character to the right is the one we are typing, just move cursor
        if (value[start] === e.key) {
             e.preventDefault();
             editorRef.current.selectionStart = start + 1;
             editorRef.current.selectionEnd = start + 1;
             handleSelect();
             return;
        }
    }

    // 3. Auto-Close Pairs
    if (!isMod && AUTO_CLOSE_PAIRS[e.key]) {
        e.preventDefault();
        if (!editorRef.current) return;
        
        const start = editorRef.current.selectionStart;
        const end = editorRef.current.selectionEnd;
        const value = editorRef.current.value;
        const char = e.key;
        const closeChar = AUTO_CLOSE_PAIRS[char];

        // Wrap selection if text is selected
        if (start !== end) {
            const selected = value.substring(start, end);
            const newValue = value.substring(0, start) + char + selected + closeChar + value.substring(end);
            onChange(newValue);
            setTimeout(() => {
                if (editorRef.current) {
                   // Select the text inside the pair
                   editorRef.current.selectionStart = start + 1;
                   editorRef.current.selectionEnd = end + 1; 
                   handleSelect();
                }
            }, 0);
        } else {
            // Insert pair and place cursor in middle
            const newValue = value.substring(0, start) + char + closeChar + value.substring(end);
            onChange(newValue);
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 1;
                    handleSelect();
                }
            }, 0);
        }
        return;
    }

    // 4. Smart Lists (Enter)
    if (e.key === 'Enter') {
        if (!editorRef.current) return;
        const start = editorRef.current.selectionStart;
        const value = editorRef.current.value;
        
        // Find the current line text
        const lastNewLinePos = value.lastIndexOf('\n', start - 1);
        const currentLineStart = lastNewLinePos + 1;
        const currentLine = value.substring(currentLineStart, start);
        
        // Regex for unordered (- or *) or ordered (1.) lists
        // Matches "  - " or "1. " at start of line
        const match = currentLine.match(/^(\s*)([-*]|\d+\.)(\s+)/);
        
        if (match) {
            // Check if user is breaking out of list (empty list item)
            // match[0] is the whole prefix "  - "
            // If the line consists ONLY of the bullet/number and whitespace, clear it
            const lineContent = currentLine.substring(match[0].length).trim();
            
            if (lineContent === '') { 
                 e.preventDefault();
                 // Remove the current line content (the bullet)
                 const newValue = value.substring(0, currentLineStart) + '\n' + value.substring(start);
                 onChange(newValue);
                 // Cursor will be naturally at correct pos (start of new empty line)
                 // but we need to account for the deletion of the bullet chars
                 return;
            }

            e.preventDefault();
            let nextBullet = match[2];
            // Increment number if ordered list
            if (match[2].match(/\d+\./)) {
                const num = parseInt(match[2]);
                nextBullet = `${num + 1}.`;
            }
            
            const insertion = `\n${match[1]}${nextBullet}${match[3]}`;
            const newValue = value.substring(0, start) + insertion + value.substring(editorRef.current.selectionEnd);
            onChange(newValue);
            
            setTimeout(() => {
                if(editorRef.current) {
                    editorRef.current.selectionStart = editorRef.current.selectionEnd = start + insertion.length;
                    handleSelect(); // update cursor stats
                }
            }, 0);
            return;
        }
    }

    // 5. Smart Backspace (Optional: Delete pair if empty)
    if (e.key === 'Backspace') {
         if (!editorRef.current) return;
         const start = editorRef.current.selectionStart;
         const end = editorRef.current.selectionEnd;
         const value = editorRef.current.value;
         
         if (start === end && start > 0) {
             const charToDelete = value[start - 1];
             const nextChar = value[start];
             
             // If we are deleting an opening char, and the next char is the matching closing char
             if (AUTO_CLOSE_PAIRS[charToDelete] === nextChar) {
                 e.preventDefault();
                 const newValue = value.substring(0, start - 1) + value.substring(start + 1);
                 onChange(newValue);
                 setTimeout(() => {
                     if (editorRef.current) {
                         editorRef.current.selectionStart = editorRef.current.selectionEnd = start - 1;
                         handleSelect();
                     }
                 }, 0);
                 return;
             }
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
    <textarea
      ref={editorRef}
      className={`
        w-full h-full bg-background text-text p-4 pb-96 resize-none focus:outline-none selection:bg-muted/30
        transition-colors duration-200
        ${getFontFamily()}
        ${settings.wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'}
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
  );
};