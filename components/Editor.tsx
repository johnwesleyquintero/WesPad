import React, { useEffect, useLayoutEffect, useRef } from "react";
import { CursorPosition } from "../types";
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

import { useEditorSelection } from "../hooks/useEditorSelection";
import { useEditorFormatting } from "../hooks/useEditorFormatting";
import { useEditorAi } from "../hooks/useEditorAi";
import { useEditorKeydown } from "../hooks/useEditorKeydown";

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
  const { handleSelect } = useEditorSelection({
    editorRef,
    onCursorChange,
    onSelectionStatsChange,
  });

  const { handleFormat, handleLink, handleBlockFormat, applyMutation } =
    useEditorFormatting({
      editorRef,
      onChange,
      onSelect: handleSelect,
    });

  const { isAiProcessing, handleQuickAiRewrite } = useEditorAi({
    editorRef,
    apiKey,
    onChange,
    onSelect: handleSelect,
    onError,
  });

  const { handleKeyDown } = useEditorKeydown({
    editorRef,
    applyMutation,
    handleFormat,
    handleLink,
    onSelect: handleSelect,
  });

  const onSaveStateRef = useRef(onSaveState);
  useEffect(() => {
    onSaveStateRef.current = onSaveState;
  }, [onSaveState]);

  // Restore state on mount
  useLayoutEffect(() => {
    if (editorRef.current) {
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
  }, [editorRef, initialSelection, initialScrollTop]);

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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    handleSelect();
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
