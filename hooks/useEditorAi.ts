import { useState, useCallback } from "react";
import { rewriteText } from "../services/geminiService";

interface UseEditorAiProps {
  editorRef: React.RefObject<HTMLTextAreaElement>;
  apiKey: string;
  onChange: (value: string) => void;
  onSelect: () => void;
  onError: (message: string) => void;
}

export const useEditorAi = ({
  editorRef,
  apiKey,
  onChange,
  onSelect,
  onError,
}: UseEditorAiProps) => {
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const handleQuickAiRewrite = useCallback(async () => {
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
            onSelect();
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
  }, [editorRef, apiKey, onChange, onSelect, onError]);

  return {
    isAiProcessing,
    handleQuickAiRewrite,
  };
};
