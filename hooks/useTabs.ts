import { useState, useEffect, useRef, useCallback } from 'react';
import { Tab } from '../types';
import { STORAGE_KEYS, DEFAULT_TAB } from '../constants';

export const useTabs = () => {
  const [tabs, setTabs] = useState<Tab[]>([DEFAULT_TAB]);
  const [activeTabId, setActiveTabId] = useState<string>(DEFAULT_TAB.id);
  const [isSaved, setIsSaved] = useState(true);
  
  // History debounce ref
  const typingTimeoutRef = useRef<number | null>(null);

  // 1. Hydrate from Storage on Mount
  useEffect(() => {
    const savedTabs = localStorage.getItem(STORAGE_KEYS.TABS);
    const savedActive = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
    
    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Re-initialize history for hydrated tabs to save space/memory
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
  }, []);

  // 2. Persist to Storage on Change
  useEffect(() => {
    // Strip history before saving to storage
    const tabsToSave = tabs.map(({ history, historyIndex, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify(tabsToSave));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTabId);
    
    // UI Feedback for saving
    const timer = setTimeout(() => setIsSaved(true), 1000);
    return () => clearTimeout(timer);
  }, [tabs, activeTabId]);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const canUndo = (activeTab.historyIndex || 0) > 0;
  const canRedo = (activeTab.historyIndex || 0) < (activeTab.history?.length || 0) - 1;

  // Actions
  
  const createTab = useCallback((title: string, content: string) => {
    const newTab: Tab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title,
        content,
        lastModified: Date.now(),
        isCustomTitle: true,
        history: [content],
        historyIndex: 0
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const closeTab = useCallback((id: string) => {
    if (tabs.length === 1) {
      // If only one tab, perform a hard reset instead of just clearing content
      // This fixes the bug where a custom title persists on an empty "new" tab
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      setTabs(prev => prev.map(t => ({
        ...t,
        title: 'Untitled',
        isCustomTitle: false,
        content: '',
        history: [''], 
        historyIndex: 0,
        lastModified: Date.now()
      })));
      return;
    }

    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (id === activeTabId) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  }, [tabs, activeTabId]);

  const renameTab = useCallback((id: string, newTitle: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === id 
        ? { ...tab, title: newTitle.trim() || 'Untitled', isCustomTitle: true, lastModified: Date.now() }
        : tab
    ));
  }, []);

  const updateContent = useCallback((newContent: string) => {
    setIsSaved(false);

    // Clear pending debounce
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }

    // Immediate UI Update
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        let newTitle = tab.title;
        // Auto-title logic
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

    // Debounced History Push
    typingTimeoutRef.current = window.setTimeout(() => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                const history = tab.history || [tab.content];
                const currentIndex = tab.historyIndex ?? 0;
                const currentHistoryItem = history[currentIndex];

                if (currentHistoryItem === newContent) return tab;

                const newHistory = history.slice(0, currentIndex + 1);
                newHistory.push(newContent);
                
                if (newHistory.length > 50) newHistory.shift();

                return {
                    ...tab,
                    history: newHistory,
                    historyIndex: newHistory.length - 1
                };
            }
            return tab;
        }));
    }, 700);
  }, [activeTabId]);

  const updateTabState = useCallback((id: string, state: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...state } : t));
  }, []);

  const undo = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setTabs(prev => prev.map(tab => {
        if (tab.id === activeTabId) {
            const index = tab.historyIndex ?? 0;
            const history = tab.history || [tab.content];
            if (index > 0) {
                return {
                    ...tab,
                    content: history[index - 1],
                    historyIndex: index - 1,
                    lastModified: Date.now()
                };
            }
        }
        return tab;
    }));
    setIsSaved(false);
  }, [activeTabId]);

  const redo = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setTabs(prev => prev.map(tab => {
        if (tab.id === activeTabId) {
            const index = tab.historyIndex ?? 0;
            const history = tab.history || [tab.content];
            if (index < history.length - 1) {
                return {
                    ...tab,
                    content: history[index + 1],
                    historyIndex: index + 1,
                    lastModified: Date.now()
                };
            }
        }
        return tab;
    }));
    setIsSaved(false);
  }, [activeTabId]);

  return {
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
    setIsSaved
  };
};