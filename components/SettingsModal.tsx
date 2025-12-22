import React, { useState, useEffect } from 'react';
import { X, Save, Key, ExternalLink, Monitor, Moon, Sun } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  editorSettings: {
    fontSize: number;
    fontFamily: string;
    wordWrap: boolean;
  };
  onSaveEditorSettings: (settings: { fontSize: number; fontFamily: string; wordWrap: boolean }) => void;
  theme: 'light' | 'dark';
  onSetTheme: (theme: 'light' | 'dark') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  editorSettings,
  onSaveEditorSettings,
  theme,
  onSetTheme
}) => {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [localSettings, setLocalSettings] = useState(editorSettings);

  useEffect(() => {
    setKeyInput(apiKey);
    setLocalSettings(editorSettings);
  }, [apiKey, editorSettings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(keyInput);
    onSaveEditorSettings(localSettings);
    onClose();
  };

  const fonts = [
    { id: 'mono', name: 'Monospace', class: 'font-mono' },
    { id: 'sans', name: 'Sans Serif', class: 'font-sans' },
    { id: 'serif', name: 'Serif', class: 'font-serif' },
  ];

  const fontSizes = [
    { value: 12, label: 'Small' },
    { value: 14, label: 'Normal' },
    { value: 16, label: 'Large' },
    { value: 18, label: 'Extra' },
    { value: 20, label: 'Huge' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col text-text transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background flex-none">
          <h2 className="text-lg font-semibold flex items-center">
            <span className="mr-2">Settings</span>
          </h2>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          
          {/* Editor Appearance Section */}
          <div>
            <h3 className="text-sm font-semibold mb-4 flex items-center uppercase tracking-wider text-text">
              <Monitor size={14} className="mr-2" />
              Appearance
            </h3>
            
            <div className="space-y-4">
              {/* Theme Toggle */}
              <div>
                <label className="block text-xs text-muted mb-2">Theme</label>
                <div className="flex bg-background border border-border rounded p-1">
                   <button
                     onClick={() => onSetTheme('light')}
                     className={`flex-1 flex items-center justify-center py-1.5 rounded text-xs transition-colors ${
                       theme === 'light' 
                         ? 'bg-surface text-text shadow-sm border border-border' 
                         : 'text-muted hover:text-text'
                     }`}
                   >
                     <Sun size={14} className="mr-1.5" />
                     Light
                   </button>
                   <button
                     onClick={() => onSetTheme('dark')}
                     className={`flex-1 flex items-center justify-center py-1.5 rounded text-xs transition-colors ${
                       theme === 'dark' 
                         ? 'bg-surface text-text shadow-sm border border-border' 
                         : 'text-muted hover:text-text'
                     }`}
                   >
                     <Moon size={14} className="mr-1.5" />
                     Dark
                   </button>
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-xs text-muted mb-2">Font Family</label>
                <div className="grid grid-cols-3 gap-2">
                  {fonts.map(font => (
                    <button
                      key={font.id}
                      onClick={() => setLocalSettings({ ...localSettings, fontFamily: font.id })}
                      className={`px-3 py-2 rounded text-sm border transition-colors ${
                        localSettings.fontFamily === font.id
                          ? 'bg-text text-background border-text font-medium'
                          : 'bg-background border-border text-muted hover:border-text hover:text-text'
                      }`}
                    >
                      <span className={font.class}>{font.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-xs text-muted mb-2">Font Size</label>
                <div className="flex items-center space-x-2 bg-background border border-border rounded p-1">
                  {fontSizes.map(size => (
                    <button
                      key={size.value}
                      onClick={() => setLocalSettings({ ...localSettings, fontSize: size.value })}
                      className={`flex-1 py-1 rounded text-xs transition-colors ${
                        localSettings.fontSize === size.value
                          ? 'bg-surface text-text font-medium shadow-sm border border-border'
                          : 'text-muted hover:text-text'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Word Wrap */}
              <div className="flex items-center justify-between bg-background border border-border rounded px-3 py-3">
                <span className="text-sm text-text">Word Wrap</span>
                <button
                  onClick={() => setLocalSettings({ ...localSettings, wordWrap: !localSettings.wordWrap })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    localSettings.wordWrap ? 'bg-text' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-transform bg-background ${
                      localSettings.wordWrap ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-border my-4"></div>

          {/* API Key Section */}
          <div>
            <h3 className="text-sm font-semibold mb-4 flex items-center uppercase tracking-wider text-text">
              <Key size={14} className="mr-2" />
              AI Configuration
            </h3>
            
            <label className="block text-xs text-muted mb-2">Google Gemini API Key</label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-background border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-text transition-colors font-mono text-sm"
              autoComplete="off"
            />
            
            <div className="mt-2 flex justify-between items-center">
              <span className="text-[10px] text-muted">Stored locally in your browser.</span>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-muted hover:text-text inline-flex items-center transition-colors underline decoration-muted underline-offset-2"
              >
                Get API key <ExternalLink size={10} className="ml-1" />
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-background border-t border-border flex justify-end flex-none">
          <button
            onClick={handleSave}
            className="bg-text hover:opacity-90 text-background px-6 py-2 rounded-md text-sm font-bold flex items-center transition-opacity"
          >
            <Save size={16} className="mr-2" />
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};