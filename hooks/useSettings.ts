import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS, DEFAULT_SETTINGS } from "../constants";
import { ViewMode } from "../types";

export const useSettings = () => {
  const [apiKey, setApiKey] = useState("");
  const [editorSettings, setEditorSettings] = useState(DEFAULT_SETTINGS);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.EDIT);

  // Load settings on mount
  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const savedViewMode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);

    if (savedKey) setApiKey(savedKey);
    if (savedSettings) {
      try {
        setEditorSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(savedSettings),
        });
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
    if (
      savedViewMode &&
      Object.values(ViewMode).includes(savedViewMode as ViewMode)
    ) {
      setViewMode(savedViewMode as ViewMode);
    }
  }, []);

  // Persist editor settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(editorSettings));
  }, [editorSettings]);

  const handleSaveApiKey = useCallback((key: string) => {
    setApiKey(key);
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
  }, []);

  const handleChangeViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
  }, []);

  return {
    apiKey,
    editorSettings,
    setEditorSettings,
    handleSaveApiKey,
    viewMode,
    handleChangeViewMode,
  };
};
