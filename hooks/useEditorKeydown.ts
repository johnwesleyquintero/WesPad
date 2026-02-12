import { useCallback } from "react";
import * as TextUtils from "../utils/textManipulation";

interface UseEditorKeydownProps {
  editorRef: React.RefObject<HTMLTextAreaElement>;
  applyMutation: (result: {
    newValue: string;
    newSelectionStart: number;
    newSelectionEnd: number;
  }) => void;
  handleFormat: (wrapper: string) => void;
  handleLink: () => void;
  onSelect: () => void;
}

export const useEditorKeydown = ({
  editorRef,
  applyMutation,
  handleFormat,
  handleLink,
  onSelect,
}: UseEditorKeydownProps) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
            onSelect();
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
    },
    [editorRef, applyMutation, handleFormat, handleLink, onSelect],
  );

  return { handleKeyDown };
};
