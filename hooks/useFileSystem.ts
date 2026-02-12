import { useRef } from "react";
import { saveFile, openFilePicker, downloadFile } from "../utils/fileSystem";
import { Tab } from "../types";

interface UseFileSystemProps {
  activeTab: Tab;
  activeTabId: string;
  createTab: (
    title: string,
    content: string,
    handle?: FileSystemFileHandle,
  ) => void;
  renameTab: (id: string, newTitle: string) => void;
  setIsSaved: (saved: boolean) => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
  updateTabState?: (id: string, state: Partial<Tab>) => void;
}

export const useFileSystem = ({
  activeTab,
  activeTabId,
  createTab,
  renameTab,
  setIsSaved,
  addToast,
  updateTabState,
}: UseFileSystemProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadFile(activeTab.content, activeTab.title);
    setIsSaved(true);
    addToast("File Exported", "success");
  };

  const handleSave = async (forceNew: boolean = false) => {
    // If we have a handle and aren't forcing "Save As", use it.
    const handleToUse = forceNew ? undefined : activeTab.fileHandle;

    const result = await saveFile(
      activeTab.content,
      activeTab.title,
      handleToUse,
    );

    if (result.success) {
      setIsSaved(true);
      if (result.newFilename && result.newFilename !== activeTab.title) {
        renameTab(activeTabId, result.newFilename);
      }

      // Update the handle in memory so future saves are silent
      if (result.handle && updateTabState) {
        updateTabState(activeTabId, { fileHandle: result.handle });
      }

      addToast("File Saved", "success");
    } else {
      addToast("Save Failed", "error");
    }
  };

  const handleOpenFile = async () => {
    // Try Native File System API first
    const result = await openFilePicker();
    if (result) {
      createTab(result.name, result.content, result.handle);
    } else {
      // Fallback to hidden input
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      createTab(file.name, e.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset so same file can be selected again
  };

  return {
    handleExport,
    handleSave,
    handleOpenFile,
    handleFileInputChange,
    fileInputRef,
  };
};
