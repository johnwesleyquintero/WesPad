import React, { useState, useRef, useEffect } from "react";
import { Tab } from "../types";
import {
  Plus,
  X,
  FileText,
  Settings,
  Download,
  Save,
  FolderOpen,
  Undo2,
  Redo2,
  MoreVertical,
} from "lucide-react";

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onTabClose: (id: string, e: React.MouseEvent) => void;
  onNewTab: () => void;
  onRenameTab: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  onExport: () => void;
  onSave: () => void;
  onOpen: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onNewTab,
  onRenameTab,
  onOpenSettings,
  onExport,
  onSave,
  onOpen,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Handle click outside menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDoubleClick = (e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation();
    setEditingId(tab.id);
    setEditValue(tab.title);
  };

  const handleSaveTitle = () => {
    if (editingId) {
      onRenameTab(editingId, editValue);
      setEditingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-row items-center bg-background border-b border-border h-10 overflow-x-auto select-none no-scrollbar transition-colors relative">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={`
            group flex items-center h-full px-3 min-w-[120px] max-w-[200px] 
            border-r border-border cursor-pointer transition-colors duration-100
            ${
              activeTabId === tab.id
                ? "bg-surface text-text border-t-2 border-t-text"
                : "bg-background text-muted hover:bg-surface hover:text-text border-t-2 border-t-transparent"
            }
          `}
        >
          <FileText size={14} className="mr-2 opacity-50 flex-shrink-0" />

          {editingId === tab.id ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="bg-background text-text text-xs font-medium focus:outline-none w-full px-1 border border-border rounded"
            />
          ) : (
            <span
              className="truncate text-xs font-medium flex-1"
              onDoubleClick={(e) => handleDoubleClick(e, tab)}
              title="Double-click to rename"
            >
              {tab.title || "Untitled"}
            </span>
          )}

          <button
            onClick={(e) => onTabClose(tab.id, e)}
            className={`
              ml-2 p-0.5 rounded-full hover:bg-muted/20 hover:text-text
              opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0
              ${activeTabId === tab.id ? "opacity-100" : ""}
            `}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <button
        onClick={onNewTab}
        className="h-full px-3 text-muted hover:text-text hover:bg-surface transition-colors flex items-center justify-center border-r border-border flex-shrink-0"
        title="New Tab (Ctrl+N)"
      >
        <Plus size={16} />
      </button>

      {/* Spacer to fill rest of bar */}
      <div className="flex-1 bg-background h-full"></div>

      {/* Desktop Actions */}
      <div className="hidden lg:flex items-center h-full">
        {/* Undo/Redo Group */}
        <div className="flex items-center border-l border-border h-full">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`h-full px-3 flex items-center justify-center transition-colors
              ${
                canUndo
                  ? "text-muted hover:text-text hover:bg-surface"
                  : "text-muted/30 cursor-not-allowed"
              }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`h-full px-3 flex items-center justify-center transition-colors border-r border-border
              ${
                canRedo
                  ? "text-muted hover:text-text hover:bg-surface"
                  : "text-muted/30 cursor-not-allowed"
              }`}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={16} />
          </button>
        </div>

        {/* File Actions */}
        <button
          onClick={onOpen}
          className="h-full px-3 text-muted hover:text-text hover:bg-surface transition-colors flex items-center justify-center"
          title="Open File (Ctrl+O)"
        >
          <FolderOpen size={16} />
        </button>

        <button
          onClick={onSave}
          className="h-full px-3 text-muted hover:text-text hover:bg-surface transition-colors flex items-center justify-center border-l border-border"
          title="Save As (Ctrl+S)"
        >
          <Save size={16} />
        </button>

        <button
          onClick={onExport}
          className="h-full px-3 text-muted hover:text-text hover:bg-surface transition-colors flex items-center justify-center border-l border-border"
          title="Export File"
        >
          <Download size={16} />
        </button>

        <button
          onClick={onOpenSettings}
          className="h-full px-3 text-muted hover:text-text hover:bg-surface transition-colors flex items-center justify-center border-l border-border"
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Mobile More Menu */}
      <div
        className="lg:hidden flex items-center h-full border-l border-border"
        ref={menuRef}
      >
        <button
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          className={`h-full px-3 flex items-center justify-center transition-colors hover:bg-surface ${isMoreMenuOpen ? "text-text bg-surface" : "text-muted"}`}
        >
          <MoreVertical size={18} />
        </button>

        {isMoreMenuOpen && (
          <div className="absolute top-full right-0 mt-0.5 w-48 bg-surface border border-border shadow-xl rounded-bl-lg z-[100] animate-in fade-in slide-in-from-top-1">
            <div className="py-1">
              <button
                onClick={() => {
                  onUndo();
                  setIsMoreMenuOpen(false);
                }}
                disabled={!canUndo}
                className="w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 hover:bg-background transition-colors disabled:opacity-30"
              >
                <Undo2 size={16} />
                <span>Undo</span>
              </button>
              <button
                onClick={() => {
                  onRedo();
                  setIsMoreMenuOpen(false);
                }}
                disabled={!canRedo}
                className="w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 hover:bg-background transition-colors disabled:opacity-30"
              >
                <Redo2 size={16} />
                <span>Redo</span>
              </button>
              <div className="border-t border-border my-1"></div>
              <button
                onClick={() => {
                  onOpen();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 hover:bg-background transition-colors"
              >
                <FolderOpen size={16} />
                <span>Open File</span>
              </button>
              <button
                onClick={() => {
                  onSave();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 hover:bg-background transition-colors"
              >
                <Save size={16} />
                <span>Save As</span>
              </button>
              <button
                onClick={() => {
                  onExport();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 hover:bg-background transition-colors"
              >
                <Download size={16} />
                <span>Export</span>
              </button>
              <div className="border-t border-border my-1"></div>
              <button
                onClick={() => {
                  onOpenSettings();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 hover:bg-background transition-colors"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
