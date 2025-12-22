import React, { useState, useEffect, useRef } from 'react';
import { CursorPosition, ViewMode, Toast } from './types';
import { TabBar } from './components/TabBar';
import { Editor } from './components/Editor';
import { StatusBar } from './components/StatusBar';
import { MarkdownPreview } from './components/MarkdownPreview';
import { AIPanel } from './components/AIPanel';
import { SettingsModal } from './components/SettingsModal';
import { FindReplaceBar } from './components/FindReplaceBar';
import { CommandPalette } from './components/CommandPalette';
import { ToastContainer } from './components/Toast';
import { Sparkles, Minimize2, UploadCloud, Image as ImageIcon } from 'lucide-react';

// Hooks
import { useTabs } from './hooks/useTabs';
import { useTheme } from './hooks/useTheme';
import { useFileSystem } from './hooks/useFileSystem';
import { useScrollSync } from './hooks/useScrollSync';
import { useDragDrop } from './hooks/useDragDrop';
import { useFindReplace } from './hooks/useFindReplace';
import { useShortcuts } from './hooks/useShortcuts';

import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants';

const App: React.FC = () => {
  // --- Core State ---
  const { 
    tabs, activeTabId, activeTab, setActiveTabId, 
    createTab, closeTab, renameTab, updateContent, updateTabState,
    undo, redo, canUndo, canRedo, isSaved, setIsSaved
  } = useTabs();
  const { theme, setTheme } = useTheme();

  // --- UI State ---
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.EDIT);
  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, column: 1 });
  const [selectionStats, setSelectionStats] = useState({ wordCount: 0, charCount: 0 });
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Modal/Panel Visibility
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  
  // Settings
  const [apiKey, setApiKey] = useState('');
  const [editorSettings, setEditorSettings] = useState(DEFAULT_SETTINGS);

  // --- Refs ---
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // --- Effects (Settings & API Key) ---
  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    if (savedKey) setApiKey(savedKey);
    if (savedSettings) {
      try {
        setEditorSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (e) { console.error("Failed to load settings", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(editorSettings));
  }, [editorSettings]);

  // --- Toast Helpers ---
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToasts(prev => [...prev, { id: Date.now().toString(), message, type }]);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
    addToast('API Key Saved', 'success');
  };

  // --- Custom Hooks (Modular Logic) ---

  const { handleExport, handleSaveAs, handleOpenFile, handleFileInputChange, fileInputRef } = useFileSystem({
    activeTab,
    activeTabId,
    createTab,
    renameTab,
    setIsSaved,
    addToast
  });

  const { handleEditorScroll, handlePreviewScroll } = useScrollSync(
    viewMode,
    editorSettings.scrollSync,
    editorRef,
    previewRef
  );

  const { isDragging, dragType, setIsDragging, handleDragOver, handleDrop } = useDragDrop({
    createTab,
    updateContent,
    activeTab,
    editorRef,
    addToast
  });

  const { handleFindNext, handleReplace, handleReplaceAll } = useFindReplace({
    editorRef,
    activeTab,
    updateContent,
    addToast
  });

  useShortcuts({
      createTab: () => createTab('Untitled', ''),
      openFile: handleOpenFile,
      saveAs: handleSaveAs,
      toggleZenMode: () => { setIsZenMode(p => !p); addToast(isZenMode ? "Exited Zen Mode" : "Zen Mode Active", 'info'); },
      undo,
      redo,
      toggleAI: () => { setIsAIPanelOpen(p => !p); setIsFindOpen(false); setIsCommandPaletteOpen(false); },
      toggleFind: () => { setIsFindOpen(p => !p); setIsAIPanelOpen(false); setIsCommandPaletteOpen(false); },
      toggleCommandPalette: () => setIsCommandPaletteOpen(true),
      isZenMode
  });

  // --- Helpers ---
  const getSelectedText = (): string => {
    if (editorRef.current) {
      const { selectionStart, selectionEnd, value } = editorRef.current;
      if (selectionStart !== selectionEnd) return value.substring(selectionStart, selectionEnd);
    }
    return '';
  };

  const replaceSelection = (text: string) => {
     if (editorRef.current) {
      const { selectionStart, selectionEnd, value } = editorRef.current;
      const newValue = value.substring(0, selectionStart) + text + value.substring(selectionEnd);
      updateContent(newValue);
      setTimeout(() => {
          if(editorRef.current) {
              editorRef.current.selectionStart = editorRef.current.selectionEnd = selectionStart + text.length;
              editorRef.current.focus();
          }
      }, 0);
      addToast('Text Replaced', 'success');
    }
  };

  // Derived State
  const words = activeTab.content.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const readingTime = Math.ceil(wordCount / 225);

  return (
    <div 
      className="flex flex-col h-screen bg-background text-text font-sans overflow-hidden transition-colors duration-200 relative"
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
      <input type="file" ref={fileInputRef} onChange={handleFileInputChange} className="hidden" accept=".md,.txt,.json,.js,.ts,.tsx,.html,.css"/>
      
      {isDragging && (
          <div className="absolute inset-0 z-[100] bg-background/80 backdrop-blur-sm border-4 border-dashed border-text/20 flex flex-col items-center justify-center pointer-events-none transition-opacity">
              {dragType === 'image' ? <ImageIcon size={64} className="text-text mb-4 opacity-50" /> : <UploadCloud size={64} className="text-text mb-4 opacity-50" />}
              <div className="text-2xl font-bold text-text">{dragType === 'image' ? "Drop image to embed" : "Drop file to open"}</div>
          </div>
      )}

      {!isZenMode && (
        <div className="flex-none print:hidden">
          <TabBar 
            tabs={tabs} activeTabId={activeTabId} onTabClick={setActiveTabId} onTabClose={(id) => closeTab(id)} onNewTab={() => createTab('Untitled', '')}
            onRenameTab={renameTab} onOpenSettings={() => setIsSettingsOpen(true)} onExport={handleExport} onSave={handleSaveAs} onOpen={handleOpenFile}
            onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo}
          />
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        <SettingsModal 
          isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} apiKey={apiKey} onSaveApiKey={handleSaveApiKey}
          editorSettings={editorSettings} onSaveEditorSettings={setEditorSettings} theme={theme} onSetTheme={setTheme}
        />
        <CommandPalette 
           isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)}
           actions={{ onNewTab: () => createTab('Untitled', ''), onOpenFile: handleOpenFile, onSaveAs: handleSaveAs, onExport: handleExport, onSettings: () => setIsSettingsOpen(true), onAI: () => setIsAIPanelOpen(true), onFind: () => setIsFindOpen(true), onToggleZen: () => setIsZenMode(p => !p), setViewMode }}
        />
        <FindReplaceBar isOpen={isFindOpen} onClose={() => setIsFindOpen(false)} onFindNext={(q) => handleFindNext(q, false)} onFindPrev={(q) => handleFindNext(q, true)} onReplace={handleReplace} onReplaceAll={handleReplaceAll} />
        
        <AIPanel 
            isOpen={isAIPanelOpen} 
            onClose={() => setIsAIPanelOpen(false)} 
            selectedText={getSelectedText()} 
            contextText={activeTab.content.slice(-2000)} 
            onReplaceText={replaceSelection} 
            onAppendText={(t) => updateContent(activeTab.content + (activeTab.content.endsWith('\n')?'':'\n\n') + t)} 
            apiKey={apiKey} 
            onOpenSettings={() => setIsSettingsOpen(true)} 
        />

        {(viewMode === ViewMode.EDIT || viewMode === ViewMode.SPLIT) && !isZenMode && (
            <button onClick={() => setIsAIPanelOpen(!isAIPanelOpen)} className="absolute top-4 right-6 z-40 bg-surface/90 hover:bg-surface text-muted hover:text-text border border-border p-2 rounded-full shadow-lg backdrop-blur-sm transition-all print:hidden">
                <Sparkles size={18} />
            </button>
        )}
        {isZenMode && (
           <button onClick={() => { setIsZenMode(false); addToast("Exited Zen Mode", 'info'); }} className="absolute top-4 right-6 z-40 bg-surface/50 hover:bg-surface text-muted hover:text-text border border-border p-2 rounded-full shadow-lg backdrop-blur-sm transition-all animate-in fade-in print:hidden">
              <Minimize2 size={18} />
           </button>
        )}

        {(viewMode === ViewMode.EDIT || viewMode === ViewMode.SPLIT) && (
          <div className={`${viewMode === ViewMode.SPLIT ? 'w-1/2 border-r border-border' : 'w-full'} h-full bg-background`}>
            <Editor 
              key={activeTabId} content={activeTab.content} onChange={updateContent} onCursorChange={setCursor} onSelectionStatsChange={setSelectionStats}
              editorRef={editorRef} settings={editorSettings} initialScrollTop={activeTab.scrollTop} initialSelection={activeTab.selection}
              onSaveState={(state) => updateTabState(activeTabId, state)} isZenMode={isZenMode}
              onScroll={handleEditorScroll}
            />
          </div>
        )}
        {(viewMode === ViewMode.PREVIEW || viewMode === ViewMode.SPLIT) && (
          <div className={`${viewMode === ViewMode.SPLIT ? 'w-1/2' : 'w-full'} h-full bg-surface`}>
            <MarkdownPreview 
                ref={previewRef}
                content={activeTab.content} 
                fontFamily={editorSettings.fontFamily} 
                onScroll={handlePreviewScroll}
            />
          </div>
        )}
      </div>

      {!isZenMode && (
        <div className="flex-none print:hidden">
          <StatusBar cursor={cursor} characterCount={activeTab.content.length} wordCount={wordCount} selectionStats={selectionStats} viewMode={viewMode} setViewMode={setViewMode} isSaved={isSaved} readingTime={readingTime} />
        </div>
      )}
    </div>
  );
};

export default App;