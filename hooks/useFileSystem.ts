import { useRef } from 'react';
import { saveFile, openFilePicker, downloadFile } from '../utils/fileSystem';
import { Tab } from '../types';

interface UseFileSystemProps {
  activeTab: Tab;
  activeTabId: string;
  createTab: (title: string, content: string) => void;
  renameTab: (id: string, newTitle: string) => void;
  setIsSaved: (saved: boolean) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const useFileSystem = ({
  activeTab,
  activeTabId,
  createTab,
  renameTab,
  setIsSaved,
  addToast
}: UseFileSystemProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadFile(activeTab.content, activeTab.title);
    setIsSaved(true);
    addToast('File Exported', 'success');
  };

  const handleSaveAs = async () => {
    const result = await saveFile(activeTab.content, activeTab.title);
    if (result.success) {
      setIsSaved(true);
      if (result.newFilename) renameTab(activeTabId, result.newFilename);
      addToast('File Saved', 'success');
    }
  };

  const handleOpenFile = async () => {
    // Try Native File System API first
    const result = await openFilePicker();
    if (result) {
        createTab(result.name, result.content);
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
    e.target.value = ''; // Reset so same file can be selected again
  };

  return {
    handleExport,
    handleSaveAs,
    handleOpenFile,
    handleFileInputChange,
    fileInputRef
  };
};