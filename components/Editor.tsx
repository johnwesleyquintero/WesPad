import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import { CursorPosition } from "../types";
import * as TextUtils from "../utils/textManipulation";
import {
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  List,
  Quote,
  Sparkles,
  Loader2,
  Link as LinkIcon,
  Strikethrough,
  CheckSquare,
} from "lucide-react";
import { rewriteText } from "../services/geminiService";

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  onCursorChange: (pos: CursorPosition) => void;
  onSelectionStatsChange?: (stats: {
    wordCount: number;
    charCount: number;
    selectedText: string;
  }) => void;
  editorRef: React.RefObject<HTMLTextAreaElement>;
  settings: {
    fontSize: number;
    fontFamily: string;
    wordWrap: boolean;
  };
  initialScrollTop?: number;
  initialSelection?: { start: number; end: number };
  onSaveState: (state: {
    scrollTop: number;
    selection: { start: number; end: number };
  }) => void;
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
  onError,
}) => {
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const onSaveStateRef = useRef(onSaveState);
  useEffect(() => {
    onSaveStateRef.current = onSaveState;
  }, [onSaveState]);

  // Restore state on mount (which happens on tab switch due to key prop)
  useLayoutEffect(() => {
    if (editorRef.current) {
      // Order matters: Set selection first, then scroll.
      // If selection is set last, browser tries to scroll cursor into view, overriding scrollTop.
      if (initialSelection) {
        editorRef.current.setSelectionRange(
          initialSelection.start,
          initialSelection.end,
        );
      }
      if (typeof initialScrollTop === "number") {
        editorRef.current.scrollTop = initialScrollTop;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save state on unmount
  useEffect(() => {
    const currentEditor = editorRef.current;
    return () => {
      if (currentEditor) {
        onSaveStateRef.current({
          scrollTop: currentEditor.scrollTop,
          selection: {
            start: currentEditor.selectionStart,
            end: currentEditor.selectionEnd,
          },
        });
      }
    };
  }, [editorRef]);

  const handleBlur = () => {
    if (editorRef.current) {
      onSaveState({
        scrollTop: editorRef.current.scrollTop,
        selection: {
          start: editorRef.current.selectionStart,
          end: editorRef.current.selectionEnd,
        },
      });
    }
  };

  const handleSelect = () => {
    if (editorRef.current) {
      const { value, selectionStart, selectionEnd } = editorRef.current;

      // Cursor Position Logic
      const textUpToCursor = value.substring(0, selectionStart);
      const line = textUpToCursor.split("\n").length;
      const column = selectionStart - textUpToCursor.lastIndexOf("\n");
      onCursorChange({ line, column });

      // Selection Stats Logic
      if (onSelectionStatsChange) {
        if (selectionStart !== selectionEnd) {
          const selectedText = value.substring(selectionStart, selectionEnd);
          const words = selectedText
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 0).length;
          onSelectionStatsChange({
            wordCount: words,
            charCount: selectedText.length,
            selectedText: selectedText,
          });
        } else {
          onSelectionStatsChange({
            wordCount: 0,
            charCount: 0,
            selectedText: "",
          });
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    handleSelect();
  };

  const applyMutation = (result: {
    newValue: string;
    newSelectionStart: number;
    newSelectionEnd: number;
  }) => {
    onChange(result.newValue);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(
          result.newSelectionStart,
          result.newSelectionEnd,
        );
        handleSelect();
      }
    }, 0);
  };

  const handleFormat = (wrapper: string) => {
    if (!editorRef.current) return;

    const state = {
      value: editorRef.current.value,
      selectionStart: editorRef.current.selectionStart,
      selectionEnd: editorRef.current.selectionEnd,
    };

    const result = TextUtils.handleFormatWrapper(state, wrapper);
    applyMutation(result);
  };

  const handleLink = () => {
    if (!editorRef.current) return;
    const state = {
      value: editorRef.current.value,
      selectionStart: editorRef.current.selectionStart,
      selectionEnd: editorRef.current.selectionEnd,
    };
    const result = TextUtils.handleLink(state);
    applyMutation(result);
  };

  const handleBlockFormat = (prefix: string) => {
    if (!editorRef.current) return;
    const state = {
      value: editorRef.current.value,
      selectionStart: editorRef.current.selectionStart,
      selectionEnd: editorRef.current.selectionEnd,
    };
    const result = TextUtils.toggleLinePrefix(state, prefix);
    applyMutation(result);
  };

  const handleQuickAiRewrite = async () => {
    if (!editorRef.current) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
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
        const newValue =
          editorRef.current.value.substring(0, start) +
          rewritten +
          editorRef.current.value.substring(end);
        onChange(newValue);
        // Move selection to end of rewritten text
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus();
            const newEnd = start + rewritten.length;
            editorRef.current.setSelectionRange(start, newEnd);
            handleSelect();
          }
        }, 0);
      }
    } catch (error) {
      console.error("AI Rewrite failed", error);
      const err = error as { message?: string };
      if (err.message && err.message.includes("API Key")) {
        onError("Missing API Key. Please configure it in Settings.");
      } else {
        onError("Quick Polish failed. Please check your API key.");
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
      selectionEnd: editorRef.current.selectionEnd,
    };

    // 1. Tab Indentation
    if (e.key === "Tab") {
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
          editorRef.current.setSelectionRange(
            overtypeResult.newSelectionStart,
            overtypeResult.newSelectionEnd,
          );
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
    if (e.key === "Enter") {
      const listResult = TextUtils.handleSmartList(state);
      if (listResult) {
        e.preventDefault();
        applyMutation(listResult);
        return;
      }
    }

    // 5. Smart Backspace
    if (e.key === "Backspace") {
      const backspaceResult = TextUtils.handleSmartBackspace(state);
      if (backspaceResult) {
        e.preventDefault();
        applyMutation(backspaceResult);
        return;
      }
    }

    // Bold: Ctrl+B
    if (isMod && e.key.toLowerCase() === "b") {
      e.preventDefault();
      handleFormat("**");
    }

    // Italic: Ctrl+I
    if (isMod && e.key.toLowerCase() === "i") {
      e.preventDefault();
      handleFormat("*");
    }

    // Link: Ctrl+L
    if (isMod && e.key.toLowerCase() === "l") {
      e.preventDefault();
      handleLink();
    }
  };

  const getFontFamily = () => {
    switch (settings.fontFamily) {
      case "sans":
        return "font-sans";
      case "serif":
        return "font-serif";
      default:
        return "font-mono";
    }
  };

  return (
    <div
      className={`w-full h-full flex flex-col justify-start items-center bg-background overflow-hidden relative ${isZenMode ? "pt-0" : ""}`}
    >
      {/* Editor Toolbar - Only show if not in Zen Mode, or make it autohide? Keeping it persistent for now unless zen mode active. */}
      {!isZenMode && (
        <div className="w-full flex items-center justify-center border-b border-border bg-background/95 backdrop-blur-sm z-10 transition-all select-none">
          <div className="flex items-center space-x-1 py-1.5 px-2 overflow-x-auto no-scrollbar max-w-full">
            <ToolbarBtn
              onClick={() => handleBlockFormat("# ")}
              icon={<Heading1 size={14} />}
              title="Heading 1"
            />
            <ToolbarBtn
              onClick={() => handleBlockFormat("## ")}
              icon={<Heading2 size={14} />}
              title="Heading 2"
            />
            <div className="w-px h-4 bg-border mx-1" />
            <ToolbarBtn
              onClick={() => handleFormat("**")}
              icon={<Bold size={14} />}
              title="Bold (Ctrl+B)"
            />
            <ToolbarBtn
              onClick={() => handleFormat("*")}
              icon={<Italic size={14} />}
              title="Italic (Ctrl+I)"
            />
            <ToolbarBtn
              onClick={() => handleFormat("~~")}
              icon={<Strikethrough size={14} />}
              title="Strikethrough"
            />
            <ToolbarBtn
              onClick={() => handleFormat("`")}
              icon={<Code size={14} />}
              title="Inline Code"
            />
            <div className="w-px h-4 bg-border mx-1" />
            <ToolbarBtn
              onClick={handleLink}
              icon={<LinkIcon size={14} />}
              title="Link (Ctrl+L)"
            />
            <ToolbarBtn
              onClick={() => handleBlockFormat("> ")}
              icon={<Quote size={14} />}
              title="Blockquote"
            />
            <ToolbarBtn
              onClick={() => handleBlockFormat("- ")}
              icon={<List size={14} />}
              title="Bullet List"
            />
            <ToolbarBtn
              onClick={() => handleBlockFormat("- [ ] ")}
              icon={<CheckSquare size={14} />}
              title="Task List"
            />
            <div className="w-px h-4 bg-border mx-1" />
            <button
              onClick={handleQuickAiRewrite}
              disabled={isAiProcessing}
              className={`
                            flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all
                            ${
                              isAiProcessing
                                ? "bg-surface text-muted cursor-wait"
                                : "text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            }
                        `}
              title="AI Rewrite Selection"
            >
              {isAiProcessing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              <span>{isAiProcessing ? "Thinking..." : "Quick Polish"}</span>
            </button>
          </div>
        </div>
      )}

      <div
        className={`flex-1 w-full flex justify-center overflow-hidden ${isZenMode ? "items-start pt-10" : ""}`}
      >
        <textarea
          ref={editorRef}
          onScroll={onScroll}
          className={`
                    h-full bg-background text-text p-4 pb-96 resize-none focus:outline-none 
                    transition-all duration-300
                    ${getFontFamily()}
                    ${settings.wordWrap ? "whitespace-pre-wrap" : "whitespace-pre overflow-x-auto"}
                    ${isZenMode ? "max-w-3xl w-full border-none" : "w-full"}
                `}
          style={{ fontSize: `${settings.fontSize}px` }}
          value={content}
          onChange={handleChange}
          onSelect={handleSelect}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Start writing..."
          spellCheck={false}
          autoFocus
        />
      </div>
    </div>
  );
};

const ToolbarBtn = ({
  onClick,
  icon,
  title,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}) => (
  <button
    onClick={onClick}
    className="p-1.5 text-muted hover:text-text hover:bg-surface rounded transition-colors"
    title={title}
  >
    {icon}
  </button>
);
