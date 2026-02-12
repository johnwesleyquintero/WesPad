import { useCallback } from "react";
import * as TextUtils from "../utils/textManipulation";

interface UseEditorFormattingProps {
  editorRef: React.RefObject<HTMLTextAreaElement>;
  onChange: (value: string) => void;
  onSelect: () => void;
}

export const useEditorFormatting = ({
  editorRef,
  onChange,
  onSelect,
}: UseEditorFormattingProps) => {
  const applyMutation = useCallback(
    (result: {
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
          onSelect();
        }
      }, 0);
    },
    [onChange, editorRef, onSelect],
  );

  const handleFormat = useCallback(
    (wrapper: string) => {
      if (!editorRef.current) return;

      const state = {
        value: editorRef.current.value,
        selectionStart: editorRef.current.selectionStart,
        selectionEnd: editorRef.current.selectionEnd,
      };

      const result = TextUtils.handleFormatWrapper(state, wrapper);
      applyMutation(result);
    },
    [editorRef, applyMutation],
  );

  const handleLink = useCallback(() => {
    if (!editorRef.current) return;
    const state = {
      value: editorRef.current.value,
      selectionStart: editorRef.current.selectionStart,
      selectionEnd: editorRef.current.selectionEnd,
    };
    const result = TextUtils.handleLink(state);
    applyMutation(result);
  }, [editorRef, applyMutation]);

  const handleBlockFormat = useCallback(
    (prefix: string) => {
      if (!editorRef.current) return;
      const state = {
        value: editorRef.current.value,
        selectionStart: editorRef.current.selectionStart,
        selectionEnd: editorRef.current.selectionEnd,
      };
      const result = TextUtils.toggleLinePrefix(state, prefix);
      applyMutation(result);
    },
    [editorRef, applyMutation],
  );

  return {
    handleFormat,
    handleLink,
    handleBlockFormat,
    applyMutation,
  };
};
