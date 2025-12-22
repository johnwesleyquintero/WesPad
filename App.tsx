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

// Hooks & Utils
import { useTabs } from './hooks/useTabs';
import { useTheme } from './hooks/useTheme';
import { saveFile, openFilePicker, downloadFile } from './utils/fileSystem';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants';

const App: React.FC = () => {
  // --- Custom Hooks (State Management) ---
  const { 
    tabs, activeTabId, activeTab, setActiveTabId, 
    createTab, closeTab, renameTab, updateContent, updateTabState,
    undo, redo, canUndo, canRedo, isSaved, setIsSaved
  } = useTabs();

  const { theme, setTheme } = useTheme();

  // --- Local State ---
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.EDIT);
  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, column: 1 });
  const [selectionStats, setSelectionStats] = useState({ wordCount: 0, charCount: 0 });
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // UI Toggles
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  
  // Configuration
  const [apiKey, setApiKey] = useState('');
  const [editorSettings, setEditorSettings] = useState(DEFAULT_SETTINGS);
  
  // Drag & Drop
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'file' | 'image' | null>(null);

  // --- Refs ---
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Scroll Sync Locks
  const isSyncingLeft = useRef(false);
  const isSyncingRight = useRef(false);

  // --- Derived State ---
  const words = activeTab.content.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const readingTime = Math.ceil(wordCount / 225);

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

  // --- Helpers ---
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToasts(prev => [...prev, { id: Date.now().toString(), message, type }]);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
    addToast('API Key Saved', 'success');
  };

  // --- Scroll Sync Handlers ---
  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (!editorSettings.scrollSync || viewMode !== ViewMode.SPLIT) return;
    if (isSyncingRight.current) {
        isSyncingRight.current = false;
        return;
    }
    
    if (previewRef.current && editorRef.current) {
        isSyncingLeft.current = true;
        const editor = editorRef.current;
        const preview = previewRef.current;
        
        const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
        const targetScroll = percentage * (preview.scrollHeight - preview.clientHeight);
        
        preview.scrollTop = targetScroll;
    }
  };

  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!editorSettings.scrollSync || viewMode !== ViewMode.SPLIT) return;
    if (isSyncingLeft.current) {
        isSyncingLeft.current = false;
        return;
    }

    if (previewRef.current && editorRef.current) {
        isSyncingRight.current = true;
        const editor = editorRef.current;
        const preview = previewRef.current;

        const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
        const targetScroll = percentage * (editor.scrollHeight - editor.clientHeight);
        
        editor.scrollTop = targetScroll;
    }
  };

  // --- File Operations ---
  
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
    const result = await openFilePicker();
    if (result) {
        createTab(result.name, result.content);
    } else {
        // Fallback or cancelled
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
    e.target.value = '';
  };

  // --- Drag & Drop ---
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation();
      if (!isDragging) setIsDragging(true);
      
      let isImage = false;
      if (e.dataTransfer.items) {
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          if (e.dataTransfer.items[i].type.startsWith('image/')) isImage = true;
        }
      }
      setDragType(isImage ? 'image' : 'file');
  };

  const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation();
      setIsDragging(false); setDragType(null);
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const files = Array.from(e.dataTransfer.files);
          for (const file of files) {
               if (file.type.startsWith('image/')) {
                 const reader = new FileReader();
                 reader.onload = (event) => {
                   const base64 = event.target?.result as string;
                   const markdownImage = `\n![${file.name}](${base64})\n`;
                   if (editorRef.current) {
                      const { selectionStart, selectionEnd, value } = editorRef.current;
                      const newValue = value.substring(0, selectionStart) + markdownImage + value.substring(selectionEnd);
                      updateContent(newValue);
                   } else {
                      updateContent(activeTab.content + markdownImage);
                   }
                   addToast('Image Embedded', 'success');
                 };
                 reader.readAsDataURL(file);
               } else {
                  try {
                      const text = await file.text();
                      createTab(file.name, text);
                  } catch (err) {
                      addToast(`Failed to open ${file.name}`, 'error');
                  }
               }
          }
      }
  };

  // --- Find & Replace ---
  const handleFindNext = (query: string, reverse: boolean = false) => {
      if (!editorRef.current || !query) return;
      const textarea = editorRef.current;
      const text = textarea.value;
      const startPos = reverse ? textarea.selectionStart : textarea.selectionEnd;
      let nextIndex = reverse 
        ? text.substring(0, startPos).lastIndexOf(query) 
        : text.indexOf(query, startPos);
        
      // Wrap around
      if (nextIndex === -1) {
          nextIndex = reverse ? text.lastIndexOf(query) : text.indexOf(query);
      }

      if (nextIndex !== -1) {
          textarea.focus();
          textarea.setSelectionRange(nextIndex, nextIndex + query.length);
      } else {
          addToast('No matches found', 'info');
      }
  };

  const handleReplace = (find: string, replace: string) => {
      if (!editorRef.current || !find) return;
      const textarea = editorRef.current;
      const currentSelection = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);

      if (currentSelection === find) {
          const start = textarea.selectionStart;
          const newVal = textarea.value.substring(0, start) + replace + textarea.value.substring(textarea.selectionEnd);
          updateContent(newVal);
          setTimeout(() => {
              if (editorRef.current) {
                editorRef.current.setSelectionRange(start + replace.length, start + replace.length);
                handleFindNext(find); 
              }
          }, 0);
      } else {
          handleFindNext(find);
      }
  };

  const handleReplaceAll = (find: string, replace: string) => {
      if (!find) return;
      const escapedFind = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedFind, 'g');
      const count = (activeTab.content.match(regex) || []).length;
      
      if (count > 0) {
        updateContent(activeTab.content.replace(regex, replace));
        addToast(`Replaced ${count} occurrences`, 'success');
      } else {
        addToast('No occurrences found', 'info');
      }
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.shiftKey && e.key.toLowerCase() === 'p') { e.preventDefault(); setIsCommandPaletteOpen(true); return; }
      if (isMod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((isMod && e.key.toLowerCase() === 'y') || (isMod && e.shiftKey && e.key.toLowerCase() === 'z')) { e.preventDefault(); redo(); return; }
      if (isMod && e.key === 'n') { e.preventDefault(); createTab('Untitled', ''); }
      if (isMod && e.key === 'o') { e.preventDefault(); handleOpenFile(); }
      if (isMod && e.key === 's') { e.preventDefault(); handleSaveAs(); }
      if (isMod && e.key === 'k') { e.preventDefault(); setIsAIPanelOpen(prev => !prev); setIsFindOpen(false); setIsCommandPaletteOpen(false); }
      if (isMod && e.key === 'f') { e.preventDefault(); setIsFindOpen(prev => !prev); setIsAIPanelOpen(false); setIsCommandPaletteOpen(false); }
      if (e.altKey && e.key.toLowerCase() === 'z') { e.preventDefault(); setIsZenMode(prev => !prev); addToast(isZenMode ? "Exited Zen Mode" : "Zen Mode Active", 'info'); }
      if (e.key === 'Escape' && isZenMode) { setIsZenMode(false); addToast("Exited Zen Mode", 'info'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, isZenMode]);

  // --- AI Helpers ---
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
        <AIPanel isOpen={isAIPanelOpen} onClose={() => setIsAIPanelOpen(false)} selectedText={getSelectedText()} contextText={activeTab.content.slice(-2000)} onReplaceText={replaceSelection} onAppendText={(t) => updateContent(activeTab.content + (activeTab.content.endsWith('\n')?'':'\n\n') + t)} apiKey={apiKey} onOpenSettings={() => setIsSettingsOpen(true)} />

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