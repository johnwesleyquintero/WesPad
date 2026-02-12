import React, { useState, useEffect, useRef, useCallback } from "react";
import { CursorPosition, ViewMode } from "./types";
import { TabBar } from "./components/TabBar";
import { Editor } from "./components/Editor";
import { StatusBar } from "./components/StatusBar";
import { MarkdownPreview } from "./components/MarkdownPreview";
import { AIPanel } from "./components/AIPanel";
import { SettingsModal } from "./components/SettingsModal";
import { FindReplaceBar } from "./components/FindReplaceBar";
import { CommandPalette } from "./components/CommandPalette";
import { ToastContainer } from "./components/Toast";
import {
  Sparkles,
  Minimize2,
  UploadCloud,
  Image as ImageIcon,
} from "lucide-react";

// Hooks
import { useTabs } from "./hooks/useTabs";
import { useTheme } from "./hooks/useTheme";
import { useFileSystem } from "./hooks/useFileSystem";
import { useScrollSync } from "./hooks/useScrollSync";
import { useDragDrop } from "./hooks/useDragDrop";
import { useFindReplace } from "./hooks/useFindReplace";
import { useShortcuts } from "./hooks/useShortcuts";
import { useToast } from "./hooks/useToast";
import { useSettings } from "./hooks/useSettings";
import { useUIState } from "./hooks/useUIState";

import { calculateReadingTime, calculateWordCount } from "./utils/textStats";

import { STORAGE_KEYS } from "./constants";

const App: React.FC = () => {
  // --- Core State ---
  const {
    tabs,
    activeTabId,
    activeTab,
    setActiveTabId,
    createTab,
    closeTab,
    renameTab,
    updateContent,
    updateTabState,
    undo,
    redo,
    canUndo,
    canRedo,
    isSaved,
    setIsSaved,
  } = useTabs();
  const { theme, setTheme } = useTheme();

  // --- New Modular State ---
  const { toasts, addToast, removeToast } = useToast();
  const {
    apiKey,
    editorSettings,
    setEditorSettings,
    handleSaveApiKey: saveApiKey,
    viewMode,
    handleChangeViewMode,
  } = useSettings();
  const {
    isAIPanelOpen,
    setIsAIPanelOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isFindOpen,
    setIsFindOpen,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isZenMode,
    setIsZenMode,
    toggleAI,
    toggleFind,
    toggleCommandPalette,
    toggleZenMode,
  } = useUIState();

  useEffect(() => {
    if (isZenMode) {
      addToast("Zen Mode Active", "info");
    } else {
      // Avoid toast on initial load
      const isInitial = !localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
      if (!isInitial) addToast("Exited Zen Mode", "info");
    }
  }, [isZenMode, addToast]);

  // --- Remaining UI State ---
  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, column: 1 });
  const [selectionStats, setSelectionStats] = useState({
    wordCount: 0,
    charCount: 0,
    selectedText: "",
  });

  // --- Refs ---
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleSaveApiKey = (key: string) => {
    saveApiKey(key);
    addToast("API Key Saved", "success");
  };

  // --- Custom Hooks (Modular Logic) ---

  const {
    handleExport,
    handleSave,
    handleOpenFile,
    handleFileInputChange,
    fileInputRef,
  } = useFileSystem({
    activeTab,
    activeTabId,
    createTab,
    renameTab,
    setIsSaved,
    addToast,
    updateTabState, // Pass this to allow updating file handles
  });

  const { handleEditorScroll, handlePreviewScroll } = useScrollSync(
    viewMode,
    editorSettings.scrollSync,
    editorRef,
    previewRef,
  );

  const { isDragging, dragType, handleDragOver, handleDragLeave, handleDrop } =
    useDragDrop({
      createTab,
      updateContent,
      activeTab,
      editorRef,
      addToast,
    });

  const { handleFindNext, handleReplace, handleReplaceAll } = useFindReplace({
    editorRef,
    activeTab,
    updateContent,
    addToast,
  });

  const handleCreateNewTab = useCallback(
    () => createTab("Untitled", ""),
    [createTab],
  );

  useShortcuts({
    createTab: handleCreateNewTab,
    openFile: handleOpenFile,
    saveAs: () => handleSave(false), // Still inline but handleSave is stable-ish
    toggleZenMode,
    undo,
    redo,
    toggleAI,
    toggleFind,
    toggleCommandPalette,
    isZenMode,
  });

  const replaceSelection = useCallback(
    (text: string) => {
      if (editorRef.current) {
        const { selectionStart, selectionEnd, value } = editorRef.current;
        const newValue =
          value.substring(0, selectionStart) +
          text +
          value.substring(selectionEnd);
        updateContent(newValue);
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.selectionStart = editorRef.current.selectionEnd =
              selectionStart + text.length;
            editorRef.current.focus();
          }
        }, 0);
        addToast("Text Replaced", "success");
      }
    },
    [updateContent, addToast],
  );

  const handleEditorSaveState = useCallback(
    (state: {
      scrollTop: number;
      selection: { start: number; end: number };
    }) => {
      updateTabState(activeTabId, state);
    },
    [activeTabId, updateTabState],
  );

  const handleCursorChange = useCallback((pos: CursorPosition) => {
    setCursor(pos);
  }, []);

  const handleSelectionStatsChange = useCallback(
    (stats: { wordCount: number; charCount: number; selectedText: string }) => {
      setSelectionStats(stats);
    },
    [],
  );

  const handleEditorError = useCallback(
    (msg: string) => {
      addToast(msg, "error");
    },
    [addToast],
  );

  // Derived State
  const wordCount = calculateWordCount(activeTab.content);
  const readingTime = calculateReadingTime(wordCount);

  const handleCloseTab = useCallback((id: string) => closeTab(id), [closeTab]);
  const handleNewTab = useCallback(
    () => createTab("Untitled", ""),
    [createTab],
  );

  return (
    <div
      className="flex flex-col h-full bg-background text-text font-sans overflow-hidden transition-colors duration-200 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept=".md,.txt,.json,.js,.ts,.tsx,.html,.css"
      />

      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-background/80 backdrop-blur-sm border-4 border-dashed border-text/20 flex flex-col items-center justify-center pointer-events-none transition-opacity">
          {dragType === "image" ? (
            <ImageIcon size={64} className="text-text mb-4 opacity-50" />
          ) : (
            <UploadCloud size={64} className="text-text mb-4 opacity-50" />
          )}
          <div className="text-2xl font-bold text-text">
            {dragType === "image" ? "Drop image to embed" : "Drop file to open"}
          </div>
        </div>
      )}

      {!isZenMode && (
        <div className="flex-none print:hidden">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabClick={setActiveTabId}
            onTabClose={handleCloseTab}
            onNewTab={handleNewTab}
            onRenameTab={renameTab}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onExport={handleExport}
            onSave={() => handleSave(true)}
            onOpen={handleOpenFile}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          apiKey={apiKey}
          onSaveApiKey={handleSaveApiKey}
          editorSettings={editorSettings}
          onSaveEditorSettings={setEditorSettings}
          theme={theme}
          onSetTheme={setTheme}
        />
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          actions={{
            onNewTab: handleNewTab,
            onOpenFile: handleOpenFile,
            onSaveAs: () => handleSave(true),
            onExport: handleExport,
            onSettings: () => setIsSettingsOpen(true),
            onAI: () => setIsAIPanelOpen(true),
            onFind: () => setIsFindOpen(true),
            onToggleZen: () => setIsZenMode((p) => !p),
            setViewMode: handleChangeViewMode,
          }}
        />
        <FindReplaceBar
          isOpen={isFindOpen}
          onClose={() => setIsFindOpen(false)}
          onFindNext={(q) => handleFindNext(q, false)}
          onFindPrev={(q) => handleFindNext(q, true)}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
        />

        <AIPanel
          isOpen={isAIPanelOpen}
          onClose={() => setIsAIPanelOpen(false)}
          selectedText={selectionStats.selectedText}
          contextText={activeTab.content.slice(-2000)}
          onReplaceText={replaceSelection}
          onAppendText={replaceSelection}
          apiKey={apiKey}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {(viewMode === ViewMode.EDIT || viewMode === ViewMode.SPLIT) &&
          !isZenMode && (
            <button
              onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
              className="absolute top-4 right-6 z-40 bg-surface/90 hover:bg-surface text-muted hover:text-text border border-border p-2 rounded-full shadow-lg backdrop-blur-sm transition-all print:hidden"
            >
              <Sparkles size={18} />
            </button>
          )}
        {isZenMode && (
          <button
            onClick={() => {
              setIsZenMode(false);
              addToast("Exited Zen Mode", "info");
            }}
            className="absolute top-4 right-6 z-40 bg-surface/50 hover:bg-surface text-muted hover:text-text border border-border p-2 rounded-full shadow-lg backdrop-blur-sm transition-all animate-in fade-in print:hidden"
          >
            <Minimize2 size={18} />
          </button>
        )}

        {(viewMode === ViewMode.EDIT || viewMode === ViewMode.SPLIT) && (
          <div
            className={`${viewMode === ViewMode.SPLIT ? "h-1/2 md:h-full md:w-1/2 border-b md:border-b-0 md:border-r border-border" : "h-full w-full"} bg-background`}
          >
            <Editor
              key={activeTabId}
              content={activeTab.content}
              onChange={updateContent}
              onCursorChange={handleCursorChange}
              onSelectionStatsChange={handleSelectionStatsChange}
              editorRef={editorRef}
              settings={editorSettings}
              initialScrollTop={activeTab.scrollTop}
              initialSelection={activeTab.selection}
              onSaveState={handleEditorSaveState}
              isZenMode={isZenMode}
              onScroll={handleEditorScroll}
              apiKey={apiKey}
              onError={handleEditorError}
            />
          </div>
        )}
        {(viewMode === ViewMode.PREVIEW || viewMode === ViewMode.SPLIT) && (
          <div
            className={`${viewMode === ViewMode.SPLIT ? "h-1/2 md:h-full md:w-1/2" : "h-full w-full"} bg-surface`}
          >
            <MarkdownPreview
              ref={previewRef}
              content={activeTab.content}
              fontFamily={editorSettings.fontFamily}
              onScroll={handlePreviewScroll}
            />
          </div>
        )}
      </div>

      <div className="flex-none print:hidden">
        <StatusBar
          cursor={cursor}
          characterCount={activeTab.content.length}
          wordCount={wordCount}
          selectionStats={selectionStats}
          viewMode={viewMode}
          setViewMode={handleChangeViewMode}
          isSaved={isSaved}
          readingTime={readingTime}
        />
      </div>
    </div>
  );
};

export default App;
