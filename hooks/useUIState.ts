import { useState, useCallback } from "react";

export const useUIState = () => {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  const toggleAI = useCallback(() => {
    setIsAIPanelOpen((p) => !p);
    setIsFindOpen(false);
    setIsCommandPaletteOpen(false);
  }, []);

  const toggleFind = useCallback(() => {
    setIsFindOpen((p) => !p);
    setIsAIPanelOpen(false);
    setIsCommandPaletteOpen(false);
  }, []);

  const toggleCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen((p) => !p);
  }, []);

  const toggleZenMode = useCallback(() => {
    setIsZenMode((p) => !p);
  }, []);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);
  const closeCommandPalette = useCallback(
    () => setIsCommandPaletteOpen(false),
    [],
  );
  const closeFind = useCallback(() => setIsFindOpen(false), []);
  const closeAI = useCallback(() => setIsAIPanelOpen(false), []);

  return {
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
    openSettings,
    closeSettings,
    closeCommandPalette,
    closeFind,
    closeAI,
  };
};
