import React, { useState, useEffect, useRef } from 'react';
import { Tab, CursorPosition, ViewMode } from './types';
import { TabBar } from './components/TabBar';
import { Editor } from './components/Editor';
import { StatusBar } from './components/StatusBar';
import { MarkdownPreview } from './components/MarkdownPreview';
import { AIPanel } from './components/AIPanel';
import { SettingsModal } from './components/SettingsModal';
import { FindReplaceBar } from './components/FindReplaceBar';
import { CommandPalette } from './components/CommandPalette';
import { Sparkles, Minimize2 } from 'lucide-react';

const STORAGE_KEY_TABS = 'wespad_tabs';
const STORAGE_KEY_ACTIVE = 'wespad_active_tab';
const STORAGE_KEY_API = 'wespad_api_key';
const STORAGE_KEY_SETTINGS = 'wespad_settings';
const STORAGE_KEY_THEME = 'wespad_theme';

// Default initial state
const DEFAULT_TAB: Tab = {
  id: 'tab-1',
  title: 'Welcome.md',
  content: `# Welcome to WesPad

A sovereign, local-first, AI-optional writing pad.

## New Features
- **Zen Mode**: Press \`Alt+Z\` to focus.
- **Reading Time**: See estimate in the footer.
- **Scroll Past End**: Type comfortably in the middle of the screen.

Start typing...
`,
  lastModified: Date.now(),
  history: [],
  historyIndex: 0
};

const DEFAULT_SETTINGS = {
  fontSize: 16,
  fontFamily: 'mono',
  wordWrap: true,
};

const App: React.FC = () => {
  // --- State ---
  const [tabs, setTabs] = useState<Tab[]>([DEFAULT_TAB]);
  const [activeTabId, setActiveTabId] = useState<string>(DEFAULT_TAB.id);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.EDIT);
  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, column: 1 });
  const [isSaved, setIsSaved] = useState(true); 
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [editorSettings, setEditorSettings] = useState(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // --- Refs ---
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // --- Derived State ---
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  
  // Calculate Word Count & Reading Time
  const words = activeTab.content.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  // Avg reading speed ~225 wpm
  const readingTime = Math.ceil(wordCount / 225);

  const canUndo = (activeTab.historyIndex || 0) > 0;
  const canRedo = (activeTab.historyIndex || 0) < (activeTab.history?.length || 0) - 1;

  // --- Persistence Effects ---
  
  // Load on mount
  useEffect(() => {
    const savedTabs = localStorage.getItem(STORAGE_KEY_TABS);
    const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
    const savedKey = localStorage.getItem(STORAGE_KEY_API);
    const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) as 'light' | 'dark';
    
    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Hydrate tabs with empty history on load to prevent storage bloat
          const hydratedTabs = parsed.map((t: any) => ({
             ...t,
             history: [t.content],
             historyIndex: 0
          }));
          setTabs(hydratedTabs);
        }
      } catch (e) {
        console.error("Failed to load tabs", e);
      }
    }
    
    if (savedActive) {
      setActiveTabId(savedActive);
    }

    if (savedKey) {
      setApiKey(savedKey);
    }

    if (savedSettings) {
      try {
        setEditorSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }

    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY_THEME, theme);

    // Sync meta theme-color for PWA/Mobile interface
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#ffffff');
    }
  }, [theme]);

  // Save tabs on change (Exclude history from storage)
  useEffect(() => {
    // Strip history before saving to local storage
    const tabsToSave = tabs.map(({ history, historyIndex, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(tabsToSave));
    localStorage.setItem(STORAGE_KEY_ACTIVE, activeTabId);
    
    const timer = setTimeout(() => setIsSaved(true), 1000);
    return () => clearTimeout(timer);
  }, [tabs, activeTabId]);

  // Save settings on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(editorSettings));
  }, [editorSettings]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(STORAGE_KEY_API, key);
  };

  // --- Handlers ---

  const handleRenameTab = (id: string, newTitle: string) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === id) {
        return { 
          ...tab, 
          title: newTitle.trim() || 'Untitled', 
          isCustomTitle: true, // Mark as custom to prevent auto-overwrite
          lastModified: Date.now() 
        };
      }
      return tab;
    }));
  };

  // Handles Undo logic
  const handleUndo = () => {
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
    }

    setTabs(prev => prev.map(tab => {
        if (tab.id === activeTabId) {
            const index = tab.historyIndex ?? 0;
            const history = tab.history || [tab.content];
            if (index > 0) {
                const newIndex = index - 1;
                return {
                    ...tab,
                    content: history[newIndex],
                    historyIndex: newIndex,
                    lastModified: Date.now()
                };
            }
        }
        return tab;
    }));
    setIsSaved(false);
  };

  // Handles Redo logic
  const handleRedo = () => {
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
    }

    setTabs(prev => prev.map(tab => {
        if (tab.id === activeTabId) {
            const index = tab.historyIndex ?? 0;
            const history = tab.history || [tab.content];
            if (index < history.length - 1) {
                const newIndex = index + 1;
                return {
                    ...tab,
                    content: history[newIndex],
                    historyIndex: newIndex,
                    lastModified: Date.now()
                };
            }
        }
        return tab;
    }));
    setIsSaved(false);
  };

  const handleUpdateContent = (newContent: string) => {
    setIsSaved(false);

    // 1. Clear any pending history commit
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }

    // 2. Immediate State Update (UI Responsiveness)
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        let newTitle = tab.title;
        
        // Only auto-update title if user hasn't explicitly renamed it
        if (!tab.isCustomTitle) {
          const firstLine = newContent.split('\n')[0].trim();
          if (firstLine.startsWith('# ')) {
            newTitle = firstLine.substring(2).trim().substring(0, 20) || 'Untitled';
          } else if (newContent.trim() === '') {
              newTitle = 'Untitled';
          }
        }
        
        return { ...tab, content: newContent, title: newTitle, lastModified: Date.now() };
      }
      return tab;
    }));

    // 3. Debounced History Commit
    typingTimeoutRef.current = window.setTimeout(() => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                const history = tab.history || [tab.content]; // Current active content is already updated in step 2, but 'tab' here is from 'prev' state which might be slightly stale if batching, but functionally mostly correct for debounce.
                // Actually we should rely on the `newContent` passed to the handler closure
                
                const currentIndex = tab.historyIndex ?? 0;
                const currentHistoryItem = history[currentIndex];

                // Don't push if identical (avoids duplicates)
                if (currentHistoryItem === newContent) return tab;

                const newHistory = history.slice(0, currentIndex + 1);
                newHistory.push(newContent);
                
                // Limit history size to 50
                if (newHistory.length > 50) {
                    newHistory.shift();
                }

                return {
                    ...tab,
                    history: newHistory,
                    historyIndex: newHistory.length - 1
                };
            }
            return tab;
        }));
    }, 700);
  };

  const handleNewTab = () => {
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      title: 'Untitled',
      content: '',
      lastModified: Date.now(),
      history: [''],
      historyIndex: 0
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setViewMode(ViewMode.EDIT); 
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (tabs.length === 1) {
      handleUpdateContent('');
      // Reset history for the single remaining tab
      setTabs(prev => prev.map(t => ({...t, history: [''], historyIndex: 0})));
      return;
    }

    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    
    if (id === activeTabId) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const handleExport = () => {
    // Basic download method (Fallback)
    const blob = new Blob([activeTab.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Determine extension
    let filename = activeTab.title;
    // Basic heuristics for extension
    if (!filename.includes('.')) {
      filename += '.md';
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsSaved(true);
  };

  const handleSaveAs = async () => {
    // Check for Native File System Access API support
    // @ts-ignore - TS might not know about showSaveFilePicker yet in this config
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const options = {
          suggestedName: activeTab.title.endsWith('.md') ? activeTab.title : `${activeTab.title}.md`,
          types: [
            {
              description: 'Markdown File',
              accept: { 'text/markdown': ['.md', '.txt'] },
            },
          ],
        };
        // @ts-ignore
        const fileHandle = await window.showSaveFilePicker(options);
        const writable = await fileHandle.createWritable();
        await writable.write(activeTab.content);
        await writable.close();
        
        setIsSaved(true);
        if (fileHandle.name) {
             handleRenameTab(activeTabId, fileHandle.name);
        }

      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Save As failed:', err);
          handleExport();
        }
      }
    } else {
      handleExport();
    }
  };

  const handleOpenFile = async () => {
    // Check for Native File System Access API support
    // @ts-ignore
    if (typeof window.showOpenFilePicker === 'function') {
        try {
            // @ts-ignore
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Text Files',
                    accept: {
                        'text/*': ['.md', '.txt', '.json', '.js', '.ts', '.tsx', '.html', '.css']
                    }
                }],
                multiple: false
            });
            const file = await fileHandle.getFile();
            const text = await file.text();
            
            const newTab: Tab = {
                id: `tab-${Date.now()}`,
                title: file.name,
                content: text,
                lastModified: Date.now(),
                isCustomTitle: true,
                history: [text],
                historyIndex: 0
            };
            setTabs(prev => [...prev, newTab]);
            setActiveTabId(newTab.id);
            setViewMode(ViewMode.EDIT);
            
        } catch (err: any) {
             if (err.name !== 'AbortError') {
                console.error('Open file failed:', err);
                fileInputRef.current?.click();
             }
        }
    } else {
        fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        
        const newTab: Tab = {
            id: `tab-${Date.now()}`,
            title: file.name,
            content: text,
            lastModified: Date.now(),
            isCustomTitle: true,
            history: [text],
            historyIndex: 0
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
        setViewMode(ViewMode.EDIT);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- Find & Replace Logic ---
  
  const handleFindNext = (query: string, reverse: boolean = false) => {
      if (!editorRef.current || !query) return;
      
      const textarea = editorRef.current;
      const text = textarea.value;
      const startPos = reverse ? textarea.selectionStart : textarea.selectionEnd;
      let nextIndex = -1;

      if (reverse) {
          const textBefore = text.substring(0, startPos);
          nextIndex = textBefore.lastIndexOf(query);
          if (nextIndex === -1) {
              nextIndex = text.lastIndexOf(query);
          }
      } else {
          nextIndex = text.indexOf(query, startPos);
          if (nextIndex === -1) {
              nextIndex = text.indexOf(query);
          }
      }

      if (nextIndex !== -1) {
          textarea.focus();
          textarea.setSelectionRange(nextIndex, nextIndex + query.length);
      }
  };

  const handleReplace = (find: string, replace: string) => {
      if (!editorRef.current || !find) return;
      
      const textarea = editorRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentSelection = textarea.value.substring(start, end);

      if (currentSelection === find) {
          const newVal = textarea.value.substring(0, start) + replace + textarea.value.substring(end);
          handleUpdateContent(newVal);
          
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
      const newVal = activeTab.content.replace(regex, replace);
      
      if (newVal !== activeTab.content) {
        handleUpdateContent(newVal);
      }
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+P for Command Palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setIsCommandPaletteOpen(true);
          return;
      }

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || 
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }
      
      // Ctrl+N for New Tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewTab();
      }
      // Ctrl+O for Open
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
      // Ctrl+S for Save As
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveAs();
      }
      // Ctrl+K for AI
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
         e.preventDefault();
         setIsAIPanelOpen(prev => !prev);
         setIsFindOpen(false);
         setIsCommandPaletteOpen(false);
      }
      // Ctrl+F for Find
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
          e.preventDefault();
          setIsFindOpen(prev => !prev);
          setIsAIPanelOpen(false);
          setIsCommandPaletteOpen(false);
      }
      // Alt+Z for Zen Mode
      if (e.altKey && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          setIsZenMode(prev => !prev);
      }
      // Escape closes Zen Mode if active
      if (e.key === 'Escape' && isZenMode) {
          setIsZenMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, isZenMode]);


  // --- AI Interactions ---

  const getSelectedText = (): string => {
    if (editorRef.current) {
      const { selectionStart, selectionEnd, value } = editorRef.current;
      if (selectionStart !== selectionEnd) {
        return value.substring(selectionStart, selectionEnd);
      }
    }
    return '';
  };

  const replaceSelection = (text: string) => {
     if (editorRef.current) {
      const { selectionStart, selectionEnd, value } = editorRef.current;
      const newValue = value.substring(0, selectionStart) + text + value.substring(selectionEnd);
      handleUpdateContent(newValue);
      setTimeout(() => {
          if(editorRef.current) {
              editorRef.current.selectionStart = editorRef.current.selectionEnd = selectionStart + text.length;
              editorRef.current.focus();
          }
      }, 0);
    }
  };

  const appendText = (text: string) => {
      const spacer = activeTab.content.endsWith('\n') ? '' : '\n\n';
      const newValue = activeTab.content + spacer + text;
      handleUpdateContent(newValue);
  };


  return (
    <div className="flex flex-col h-screen bg-background text-text font-sans overflow-hidden transition-colors duration-200">
      {/* Hidden File Input for Fallback Open */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        className="hidden" 
        accept=".md,.txt,.json,.js,.ts,.tsx,.html,.css"
      />

      {/* 1. Header Area: Tab Bar (Hidden in Zen Mode) */}
      {!isZenMode && (
        <div className="flex-none print:hidden">
          <TabBar 
            tabs={tabs}
            activeTabId={activeTabId}
            onTabClick={setActiveTabId}
            onTabClose={handleCloseTab}
            onNewTab={handleNewTab}
            onRenameTab={handleRenameTab}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onExport={handleExport}
            onSave={handleSaveAs}
            onOpen={handleOpenFile}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>
      )}

      {/* 2. Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
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
               onSaveAs: handleSaveAs,
               onExport: handleExport,
               onSettings: () => setIsSettingsOpen(true),
               onAI: () => setIsAIPanelOpen(true),
               onFind: () => setIsFindOpen(true),
               onToggleZen: () => setIsZenMode(prev => !prev),
               setViewMode: setViewMode
           }}
        />

        {/* Find & Replace Bar */}
        <FindReplaceBar 
            isOpen={isFindOpen}
            onClose={() => setIsFindOpen(false)}
            onFindNext={(q) => handleFindNext(q, false)}
            onFindPrev={(q) => handleFindNext(q, true)}
            onReplace={handleReplace}
            onReplaceAll={handleReplaceAll}
        />

        {/* AI Floating Panel */}
        <AIPanel 
            isOpen={isAIPanelOpen} 
            onClose={() => setIsAIPanelOpen(false)}
            selectedText={getSelectedText()}
            onReplaceText={replaceSelection}
            onAppendText={appendText}
            apiKey={apiKey}
            onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* AI Trigger Button (Floating) - Only visible in EDIT mode (and NOT Zen Mode) */}
        {(viewMode === ViewMode.EDIT || viewMode === ViewMode.SPLIT) && !isZenMode && (
            <button 
                onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
                className="absolute top-4 right-6 z-40 bg-surface/90 hover:bg-surface text-muted hover:text-text border border-border p-2 rounded-full shadow-lg backdrop-blur-sm transition-all print:hidden"
                title="Open AI Tools (Ctrl+K)"
            >
                <Sparkles size={18} />
            </button>
        )}

        {/* Zen Mode Exit Button (Only visible in Zen Mode) */}
        {isZenMode && (
           <button 
              onClick={() => setIsZenMode(false)}
              className="absolute top-4 right-6 z-40 bg-surface/50 hover:bg-surface text-muted hover:text-text border border-border p-2 rounded-full shadow-lg backdrop-blur-sm transition-all animate-in fade-in print:hidden"
              title="Exit Zen Mode (Esc)"
           >
              <Minimize2 size={18} />
           </button>
        )}

        {/* Editor Pane */}
        {(viewMode === ViewMode.EDIT || viewMode === ViewMode.SPLIT) && (
          <div className={`${viewMode === ViewMode.SPLIT ? 'w-1/2 border-r border-border' : 'w-full'} h-full bg-background`}>
            <Editor 
              content={activeTab.content}
              onChange={handleUpdateContent}
              onCursorChange={setCursor}
              editorRef={editorRef}
              settings={editorSettings}
            />
          </div>
        )}

        {/* Preview Pane */}
        {(viewMode === ViewMode.PREVIEW || viewMode === ViewMode.SPLIT) && (
          <div className={`${viewMode === ViewMode.SPLIT ? 'w-1/2' : 'w-full'} h-full bg-surface`}>
            <MarkdownPreview content={activeTab.content} />
          </div>
        )}
      </div>

      {/* 3. Footer: Status Bar (Hidden in Zen Mode) */}
      {!isZenMode && (
        <div className="flex-none print:hidden">
          <StatusBar 
            cursor={cursor}
            characterCount={activeTab.content.length}
            wordCount={wordCount}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isSaved={isSaved}
            readingTime={readingTime}
          />
        </div>
      )}
    </div>
  );
};

export default App;