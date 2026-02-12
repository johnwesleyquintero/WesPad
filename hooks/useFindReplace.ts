import { Tab } from "../types";

interface UseFindReplaceProps {
  editorRef: React.RefObject<HTMLTextAreaElement>;
  activeTab: Tab;
  updateContent: (content: string) => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
}

export const useFindReplace = ({
  editorRef,
  activeTab,
  updateContent,
  addToast,
}: UseFindReplaceProps) => {
  const handleFindNext = (query: string, reverse: boolean = false) => {
    if (!editorRef.current || !query) return;
    const textarea = editorRef.current;
    const text = textarea.value;
    const startPos = reverse ? textarea.selectionStart : textarea.selectionEnd;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    let nextIndex = reverse
      ? lowerText.substring(0, startPos).lastIndexOf(lowerQuery)
      : lowerText.indexOf(lowerQuery, startPos);

    // Wrap around
    if (nextIndex === -1) {
      nextIndex = reverse
        ? lowerText.lastIndexOf(lowerQuery)
        : lowerText.indexOf(lowerQuery);
    }

    if (nextIndex !== -1) {
      textarea.focus();
      textarea.setSelectionRange(nextIndex, nextIndex + query.length);
    } else {
      addToast("No matches found", "info");
    }
  };

  const handleReplace = (find: string, replace: string) => {
    if (!editorRef.current || !find) return;
    const textarea = editorRef.current;
    const currentSelection = textarea.value.substring(
      textarea.selectionStart,
      textarea.selectionEnd,
    );

    if (currentSelection.toLowerCase() === find.toLowerCase()) {
      const start = textarea.selectionStart;
      const newVal =
        textarea.value.substring(0, start) +
        replace +
        textarea.value.substring(textarea.selectionEnd);
      updateContent(newVal);
      // Wait for render to update selection position
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.setSelectionRange(
            start + replace.length,
            start + replace.length,
          );
          handleFindNext(find);
        }
      }, 0);
    } else {
      handleFindNext(find);
    }
  };

  const handleReplaceAll = (find: string, replace: string) => {
    if (!find) return;
    const escapedFind = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedFind, "gi");
    const count = (activeTab.content.match(regex) || []).length;

    if (count > 0) {
      updateContent(activeTab.content.replace(regex, replace));
      addToast(`Replaced ${count} occurrences`, "success");
    } else {
      addToast("No occurrences found", "info");
    }
  };

  return {
    handleFindNext,
    handleReplace,
    handleReplaceAll,
  };
};
