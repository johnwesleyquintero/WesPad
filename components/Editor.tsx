import React from 'react';
import { CursorPosition } from '../types';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  onCursorChange: (pos: CursorPosition) => void;
  editorRef: React.RefObject<HTMLTextAreaElement>;
  settings: {
    fontSize: number;
    fontFamily: string;
    wordWrap: boolean;
  };
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
  editorRef,
  settings
}) => {
  
  const handleSelect = () => {
    if (editorRef.current) {
      const { value, selectionStart } = editorRef.current;
      const textUpToCursor = value.substring(0, selectionStart);
      const line = textUpToCursor.split('\n').length;
      const column = selectionStart - textUpToCursor.lastIndexOf('\n');
      onCursorChange({ line, column });
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

    // 2. Auto-Close Pairs
    if (!isMod && AUTO_CLOSE_PAIRS[e.key]) {
        e.preventDefault();
        if (!editorRef.current) return;
        
        const start = editorRef.current.selectionStart;
        const end = editorRef.current.selectionEnd;
        const value = editorRef.current.value;
        const char = e.key;
        const closeChar = AUTO_CLOSE_PAIRS[char];

        // Wrap selection if exists
        if (start !== end) {
            const selected = value.substring(start, end);
            const newValue = value.substring(0, start) + char + selected + closeChar + value.substring(end);
            onChange(newValue);
            setTimeout(() => {
                if (editorRef.current) {
                   editorRef.current.selectionStart = start + 1;
                   editorRef.current.selectionEnd = end + 1; 
                }
            }, 0);
        } else {
            // Insert pair
            const newValue = value.substring(0, start) + char + closeChar + value.substring(end);
            onChange(newValue);
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 1;
                }
            }, 0);
        }
        return;
    }

    // 3. Skip over closing pair if typed
    if (!isMod && Object.values(AUTO_CLOSE_PAIRS).includes(e.key)) {
        if (!editorRef.current) return;
        const start = editorRef.current.selectionStart;
        const value = editorRef.current.value;
        if (value[start] === e.key) {
             e.preventDefault();
             editorRef.current.selectionStart = start + 1;
             editorRef.current.selectionEnd = start + 1;
             return;
        }
    }

    // 4. Smart Lists (Enter)
    if (e.key === 'Enter') {
        if (!editorRef.current) return;
        const start = editorRef.current.selectionStart;
        const value = editorRef.current.value;
        
        const lines = value.substring(0, start).split('\n');
        const currentLine = lines[lines.length - 1];
        
        // Regex for unordered (- or *) or ordered (1.)
        const match = currentLine.match(/^(\s*)([-*]|\d+\.)(\s+)/);
        
        if (match) {
            // Check if user is breaking out of list (empty list item)
            // match[0] is the whole prefix "  - "
            if (currentLine.trim() === match[2]) { 
                 e.preventDefault();
                 // Remove the current line content (the bullet)
                 const lineStartPos = value.lastIndexOf('\n', start - 1) + 1;
                 const newValue = value.substring(0, lineStartPos) + '\n' + value.substring(start);
                 onChange(newValue);
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