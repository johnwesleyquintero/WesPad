import { useCallback } from "react";
import { CursorPosition } from "../types";
import { getSelectionStats } from "../utils/textStats";

interface UseEditorSelectionProps {
  editorRef: React.RefObject<HTMLTextAreaElement>;
  onCursorChange: (pos: CursorPosition) => void;
  onSelectionStatsChange?: (stats: {
    wordCount: number;
    charCount: number;
    selectedText: string;
  }) => void;
}

export const useEditorSelection = ({
  editorRef,
  onCursorChange,
  onSelectionStatsChange,
}: UseEditorSelectionProps) => {
  const handleSelect = useCallback(() => {
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
          onSelectionStatsChange(getSelectionStats(selectedText));
        } else {
          onSelectionStatsChange({
            wordCount: 0,
            charCount: 0,
            selectedText: "",
          });
        }
      }
    }
  }, [editorRef, onCursorChange, onSelectionStatsChange]);

  return { handleSelect };
};
