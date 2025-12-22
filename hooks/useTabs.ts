import { useState, useEffect, useRef, useCallback } from 'react';
import { Tab } from '../types';
import { STORAGE_KEYS, DEFAULT_TAB } from '../constants';

const getInitialTabs = (): Tab[] => {
  const savedTabs = localStorage.getItem(STORAGE_KEYS.TABS);
  if (savedTabs) {
    try {
      const parsed = JSON.parse(savedTabs);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((t: any) => ({
           ...t,
           history: [t.content],
           historyIndex: 0
        }));
      }
    } catch (e) {
      console.error("Failed to load tabs", e);
    }
  }
  return [DEFAULT_TAB];
};

export const useTabs = () => {
  // 1. Lazy Initialization of State (Synchronous)
  const [tabs, setTabs] = useState<Tab[]>(getInitialTabs);
  
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    const savedActive = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
    const initialTabs = getInitialTabs();
    
    if (savedActive && initialTabs.some(t => t.id === savedActive)) {
      return savedActive;
    }
    return initialTabs[0].id;
  });

  const [isSaved, setIsSaved] = useState(true);
  
  // History debounce ref
  const typingTimeoutRef = useRef<number | null>(null);

  // 2. Persist Active Tab Immediately
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTabId);
  }, [activeTabId]);

  // 3. Persist Content to Storage (Debounced)
  useEffect(() => {
    const saveTimer = setTimeout(() => {
        // Strip history before saving to save space/time
        const tabsToSave = tabs.map(({ history, historyIndex, ...rest }) => rest);
        localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify(tabsToSave));
        setIsSaved(true);
    }, 1000); // 1s debounce for heavy IO

    return () => clearTimeout(saveTimer);
  }, [tabs]);

  // Derived state
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
    setTabs(currentTabs => {
        // If closing the last tab, just reset it instead of removing
        if (currentTabs.length === 1) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            return currentTabs.map(t => ({
                ...t,
                title: 'Untitled',
                isCustomTitle: false,
                content: '',
                history: [''], 
                historyIndex: 0,
                lastModified: Date.now()
            }));
        }

        const newTabs = currentTabs.filter(t => t.id !== id);
        
        // If we are closing the active tab, switch to a neighbor
        if (id === activeTabId) {
             const index = currentTabs.findIndex(t => t.id === id);
             const nextTab = newTabs[Math.max(0, index - 1)];
             setActiveTabId(nextTab.id);
        }
        
        return newTabs;
    });
  }, [activeTabId]);

  const renameTab = useCallback((id: string, newTitle: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === id 
        ? { ...tab, title: newTitle.trim() || 'Untitled', isCustomTitle: true, lastModified: Date.now() }
        : tab
    ));
    setIsSaved(false); // Trigger save on rename
  }, []);

  const updateContent = useCallback((newContent: string) => {
    setIsSaved(false);

    // Clear pending debounce for history
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