import React, { useEffect, useLayoutEffect, useState } from 'react';
import { CursorPosition } from '../types';
import * as TextUtils from '../utils/textManipulation';
import { Bold, Italic, Code, Heading1, Heading2, List, Quote, Sparkles, Loader2, Link as LinkIcon, Strikethrough, CheckSquare, Type } from 'lucide-react';
import { rewriteText } from '../services/geminiService';

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
  onScroll?: (e: React.UIEvent<HTMLTextAreaElement>) => void;
  apiKey: string;
  onError: (message: string) => void;
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
  isZenMode,
  onScroll,
  apiKey,
  onError
}) => {
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);

  // Restore state on mount
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
      
      // Cursor Position
      const textUpToCursor = value.substring(0, selectionStart);
      const line = textUpToCursor.split('\n').length;
      const column = selectionStart - textUpToCursor.lastIndexOf('\n');
      onCursorChange({ line, column });

      // Selection Stats
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

  const handleLink = () => {
    if (!editorRef.current) return;
    const state = {
        value: editorRef.current.value,
        selectionStart: editorRef.current.selectionStart,
        selectionEnd: editorRef.current.selectionEnd
    };
    const result = TextUtils.handleLink(state);
    applyMutation(result);
  };

  const handleBlockFormat = (prefix: string) => {
    if (!editorRef.current) return;
    const state = {
        value: editorRef.current.value,
        selectionStart: editorRef.current.selectionStart,
        selectionEnd: editorRef.current.selectionEnd
    };
    const result = TextUtils.toggleLinePrefix(state, prefix);
    applyMutation(result);
  };

  const handleQuickAiRewrite = async () => {
    if (!editorRef.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        onError("You are offline. AI features require an internet connection.");
        return;
    }

    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const text = editorRef.current.value.substring(start, end);

    if (!text.trim()) {
        onError("Please select some text to polish.");
        return;
    }

    setIsAiProcessing(true);
    try {
        const rewritten = await rewriteText(text, apiKey);
        if (rewritten) {
            const newValue = editorRef.current.value.substring(0, start) + rewritten + editorRef.current.value.substring(end);
            onChange(newValue);
            setTimeout(() => {
                if(editorRef.current) {
                    editorRef.current.focus();
                    const newEnd = start + rewritten.length;
                    editorRef.current.setSelectionRange(start, newEnd);
                    handleSelect();
                }
            }, 0);
        }
    } catch (error: any) {
        console.error("AI Rewrite failed", error);
        if (error.message && error.message.includes('API Key')) {
            onError("Missing API Key. Please configure it in Settings.");
        } else {
            onError("Quick Polish failed. Check your API key.");
        }
    } finally {
        setIsAiProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = e.ctrlKey || e.metaKey;
    if (!editorRef.current) return;

    const state = {
        value: editorRef.current.value,
        selectionStart: editorRef.current.selectionStart,
        selectionEnd: editorRef.current.selectionEnd
    };

    if (e.key === 'Tab') {
      const result = TextUtils.handleTabIndentation(state);
      e.preventDefault();
      applyMutation(result);
      return;
    }

    if (!isMod) {
        const overtypeResult = TextUtils.handleOvertype(state, e.key);
        if (overtypeResult) {
            e.preventDefault();
            if (editorRef.current) {
                editorRef.current.setSelectionRange(overtypeResult.newSelectionStart, overtypeResult.newSelectionEnd);
                handleSelect();
            }
            return;
        }
    }

    if (!isMod) {
        const autoCloseResult = TextUtils.handleAutoClose(state, e.key);
        if (autoCloseResult) {
            e.preventDefault();
            applyMutation(autoCloseResult);
            return;
        }
    }

    if (e.key === 'Enter') {
        const listResult = TextUtils.handleSmartList(state);
        if (listResult) {
            e.preventDefault();
            applyMutation(listResult);
            return;
        }
    }

    if (e.key === 'Backspace') {
         const bsResult = TextUtils.handleSmartBackspace(state);
         if (bsResult) {
             e.preventDefault();
             applyMutation(bsResult);
             return;
         }
    }

    if (isMod && e.key.toLowerCase() === 'b') { e.preventDefault(); handleFormat('**'); }
    if (isMod && e.key.toLowerCase() === 'i') { e.preventDefault(); handleFormat('*'); }
    if (isMod && e.key.toLowerCase() === 'l') { e.preventDefault(); handleLink(); }
  };

  const getFontFamily = () => {
    switch(settings.fontFamily) {
      case 'sans': return 'font-sans';
      case 'serif': return 'font-serif';
      default: return 'font-mono';
    }
  };

  return (
    <div className={`w-full h-full flex flex-col items-center bg-background relative group ${isZenMode ? 'pt-0' : ''}`}>
        
        {/* Floating Toolbar - Visible on hover or when not in Zen */}
        {!isZenMode && (
            <div className={`
                absolute top-6 left-1/2 -translate-x-1/2 z-20 
                bg-surface/90 backdrop-blur-md border border-border/50 shadow-lg rounded-full 
                py-1.5 px-3 transition-all duration-300 ease-in-out
                ${showToolbar ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
            `}>
                <div className="flex items-center space-x-1">
                    <ToolbarBtn onClick={() => handleBlockFormat('# ')} icon={<Heading1 size={15} />} title="Heading 1" />
                    <ToolbarBtn onClick={() => handleBlockFormat('## ')} icon={<Heading2 size={15} />} title="Heading 2" />
                    <div className="w-px h-4 bg-border/50 mx-1" />
                    <ToolbarBtn onClick={() => handleFormat('**')} icon={<Bold size={15} />} title="Bold (Ctrl+B)" />
                    <ToolbarBtn onClick={() => handleFormat('*')} icon={<Italic size={15} />} title="Italic (Ctrl+I)" />
                    <ToolbarBtn onClick={() => handleFormat('`')} icon={<Code size={15} />} title="Inline Code" />
                    <div className="w-px h-4 bg-border/50 mx-1" />
                    <ToolbarBtn onClick={handleLink} icon={<LinkIcon size={15} />} title="Link (Ctrl+L)" />
                    <ToolbarBtn onClick={() => handleBlockFormat('> ')} icon={<Quote size={15} />} title="Blockquote" />
                    <ToolbarBtn onClick={() => handleBlockFormat('- ')} icon={<List size={15} />} title="List" />
                    <ToolbarBtn onClick={() => handleBlockFormat('- [ ] ')} icon={<CheckSquare size={15} />} title="Task" />
                    <div className="w-px h-4 bg-border/50 mx-1" />
                    <button 
                        onClick={handleQuickAiRewrite}
                        disabled={isAiProcessing}
                        className={`
                            flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                            ${isAiProcessing 
                                ? 'bg-muted/20 text-muted cursor-wait' 
                                : 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 hover:from-purple-500/20 hover:to-blue-500/20'}
                        `}
                        title="AI Rewrite Selection"
                    >
                        {isAiProcessing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                        <span className="hidden sm:inline">Polish</span>
                    </button>
                </div>
            </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 w-full h-full relative overflow-hidden">
             <textarea
                ref={editorRef}
                onScroll={(e) => {
                    if (e.currentTarget.scrollTop > 50) setShowToolbar(false);
                    else setShowToolbar(true);
                    if (onScroll) onScroll(e);
                }}
                className={`
                    w-full h-full bg-background text-text resize-none focus:outline-none 
                    transition-all duration-300 leading-relaxed selection:bg-selection/30
                    ${getFontFamily()}
                    ${settings.wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'}
                    ${isZenMode ? 'pt-16 max-w-3xl mx-auto px-8' : 'pt-24 pb-96 px-8 sm:px-12 md:px-24 max-w-5xl mx-auto'}
                `}
                style={{ 
                    fontSize: `${settings.fontSize}px`,
                    lineHeight: '1.7' 
                }}
                value={content}
                onChange={handleChange}
                onSelect={handleSelect}
                onKeyDown={handleKeyDown}
                placeholder="Start writing..."
                spellCheck={false}
                autoFocus
            />
        </div>
    </div>
  );
};

const ToolbarBtn = ({ onClick, icon, title }: { onClick: () => void, icon: React.ReactNode, title: string }) => (
    <button 
        onClick={onClick}
        className="p-1.5 text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-all active:scale-95"
        title={title}
    >
        {icon}
    </button>
);