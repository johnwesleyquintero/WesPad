import React, { useState, useEffect, useRef } from 'react';
import { Tab, CursorPosition, ViewMode } from './types';
import { TabBar } from './components/TabBar';
import { Editor } from './components/Editor';
import { StatusBar } from './components/StatusBar';
import { MarkdownPreview } from './components/MarkdownPreview';
import { AIPanel } from './components/AIPanel';
import { SettingsModal } from './components/SettingsModal';
import { Sparkles } from 'lucide-react';

const STORAGE_KEY_TABS = 'wespad_tabs';
const STORAGE_KEY_ACTIVE = 'wespad_active_tab';
const STORAGE_KEY_API = 'wespad_api_key';
const STORAGE_KEY_SETTINGS = 'wespad_settings';

// Default initial state
const DEFAULT_TAB: Tab = {
  id: 'tab-1',
  title: 'Welcome.md',
  content: `# Welcome to WesPad

A sovereign, local-first, AI-optional writing pad.

## Features
- **Local-first**: Data lives in your browser.
- **Markdown**: First-class citizen.
- **AI-Ready**: Integrate Gemini for rewriting and summarizing.
- **No bloat**: Just writing.

Start typing...
`,
  lastModified: Date.now(),
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
  const [apiKey, setApiKey] = useState('');
  const [editorSettings, setEditorSettings] = useState(DEFAULT_SETTINGS);

  // --- Refs ---
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // --- Derived State ---
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // --- Persistence Effects ---
  
  // Load on mount
  useEffect(() => {
    const savedTabs = localStorage.getItem(STORAGE_KEY_TABS);
    const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
    const savedKey = localStorage.getItem(STORAGE_KEY_API);
    const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    
    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTabs(parsed);
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
  }, []);

  // Save tabs on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(tabs));
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

  const handleUpdateContent = (newContent: string) => {
    setIsSaved(false);
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
  };

  const handleNewTab = () => {
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      title: 'Untitled',
      content: '',
      lastModified: Date.now()
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setViewMode(ViewMode.EDIT); 
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (tabs.length === 1) {
      handleUpdateContent('');
      return;
    }

    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    
    if (id === activeTabId) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const handleExport = () => {
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
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N for New Tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewTab();
      }
      // Ctrl+S (Visual save / could trigger export?)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setIsSaved(true);
      }
      // Ctrl+K for AI
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
         e.preventDefault();
         setIsAIPanelOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs]);


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
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-200 font-sans overflow-hidden">
      {/* 1. Header Area: Tab Bar */}
      <div className="flex-none">
        <TabBar 
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={setActiveTabId}
          onTabClose={handleCloseTab}
          onNewTab={handleNewTab}
          onRenameTab={handleRenameTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onExport={handleExport}
        />
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          apiKey={apiKey}
          onSaveApiKey={handleSaveApiKey}
          editorSettings={editorSettings}
          onSaveEditorSettings={setEditorSettings}
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

        {/* AI Trigger Button (Floating) - Only visible in EDIT mode */}
        {(viewMode === ViewMode.EDIT || viewMode === ViewMode.SPLIT) && (
            <button 
                onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
                className="absolute top-4 right-6 z-40 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 p-2 rounded-full shadow-lg backdrop-blur-sm transition-all"
                title="Open AI Tools (Ctrl+K)"
            >
                <Sparkles size={18} />
            </button>
        )}

        {/* Editor Pane */}
        {(viewMode === ViewMode.EDIT || viewMode === ViewMode.SPLIT) && (
          <div className={`${viewMode === ViewMode.SPLIT ? 'w-1/2 border-r border-neutral-800' : 'w-full'} h-full bg-neutral-950`}>
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
          <div className={`${viewMode === ViewMode.SPLIT ? 'w-1/2' : 'w-full'} h-full bg-neutral-900`}>
            <MarkdownPreview content={activeTab.content} />
          </div>
        )}
      </div>

      {/* 3. Footer: Status Bar */}
      <div className="flex-none">
        <StatusBar 
          cursor={cursor}
          characterCount={activeTab.content.length}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isSaved={isSaved}
        />
      </div>
    </div>
  );
};

export default App;