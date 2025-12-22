import { useState, useEffect, useRef, useCallback } from 'react';
import { Tab } from '../types';
import { STORAGE_KEYS, DEFAULT_TAB } from '../constants';

const getInitialTabs = (): Tab[] => {
  const savedTabs = localStorage.getItem(STORAGE_KEYS.TABS);
  if (savedTabs) {
    try {
      const parsed = JSON.parse(savedTabs);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((t: any) => {
          // Migration: Convert old string[] history to object history
          const rawHistory = Array.isArray(t.history) ? t.history : [t.content];
          const history = rawHistory.map((h: any) => 
            typeof h === 'string' 
              ? { content: h, selection: { start: 0, end: 0 } } 
              : h
          );

          return {
           ...t,
           history,
           historyIndex: t.historyIndex ?? (history.length - 1),
           selection: t.selection || { start: 0, end: 0 }
        };
      });
      }
    } catch (e) {
      console.error("Failed to load tabs", e);
    }
  }
  return [{ 
    ...DEFAULT_TAB, 
    history: [{ content: DEFAULT_TAB.content, selection: { start: 0, end: 0 } }] 
  }];
};

export const useTabs = () => {
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
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Save to local storage (omitting history content to save space if needed, but here we keep it)
    // For a real production app, you might want to limit history depth stored in localStorage
    localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify(tabs));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTabId);
    
    const timer = setTimeout(() => setIsSaved(true), 1000);
    return () => clearTimeout(timer);
  }, [tabs, activeTabId]);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const canUndo = (activeTab.historyIndex || 0) > 0;
  const canRedo = (activeTab.historyIndex || 0) < (activeTab.history?.length || 0) - 1;

  const createTab = useCallback((title: string, content: string) => {
    const newTab: Tab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title,
        content,
        lastModified: Date.now(),
        isCustomTitle: true,
        history: [{ content, selection: { start: 0, end: 0 } }],
        historyIndex: 0,
        selection: { start: 0, end: 0 }
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs(currentTabs => {
        if (currentTabs.length === 1) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            return currentTabs.map(t => ({
                ...t,
                title: 'Untitled',
                isCustomTitle: false,
                content: '',
                history: [{ content: '', selection: { start: 0, end: 0 } }], 
                historyIndex: 0,
                lastModified: Date.now(),
                selection: { start: 0, end: 0 }
            }));
        }

        const newTabs = currentTabs.filter(t => t.id !== id);
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
  }, []);

  const updateContent = useCallback((newContent: string, selection?: { start: number; end: number }) => {
    setIsSaved(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // 1. Immediate State Update (UI responsiveness)
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        let newTitle = tab.title;
        if (!tab.isCustomTitle) {
          const firstLine = newContent.split('\n')[0].trim();
          if (firstLine.startsWith('# ')) {
            newTitle = firstLine.substring(2).trim().substring(0, 20) || 'Untitled';
          } else if (newContent.trim() === '') {
              newTitle = 'Untitled';
          }
        }
        return { 
            ...tab, 
            content: newContent, 
            title: newTitle, 
            lastModified: Date.now(),
            selection: selection || tab.selection // Update selection if provided
        };
      }
      return tab;
    }));

    // 2. Debounced History Snapshot
    typingTimeoutRef.current = window.setTimeout(() => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                const history = tab.history || [{ content: tab.content, selection: { start: 0, end: 0 } }];
                const currentIndex = tab.historyIndex ?? 0;
                const currentHistoryItem = history[currentIndex];

                // Avoid duplicate history entries
                if (currentHistoryItem.content === newContent) return tab;

                const newHistory = history.slice(0, currentIndex + 1);
                
                // Push current state (including the selection we just updated in step 1)
                newHistory.push({ 
                    content: newContent, 
                    selection: tab.selection || { start: 0, end: 0 } 
                });
                
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
            const history = tab.history || [{ content: tab.content, selection: { start: 0, end: 0 } }];
            if (index > 0) {
                const prevItem = history[index - 1];
                return {
                    ...tab,
                    content: prevItem.content,
                    selection: prevItem.selection,
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
            const history = tab.history || [{ content: tab.content, selection: { start: 0, end: 0 } }];
            if (index < history.length - 1) {
                const nextItem = history[index + 1];
                return {
                    ...tab,
                    content: nextItem.content,
                    selection: nextItem.selection,
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