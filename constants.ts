import { Tab } from './types';

export const STORAGE_KEYS = {
  TABS: 'wespad_tabs',
  ACTIVE_TAB: 'wespad_active_tab',
  API_KEY: 'wespad_api_key',
  SETTINGS: 'wespad_settings',
  THEME: 'wespad_theme',
};

export const DEFAULT_TAB: Tab = {
  id: 'tab-1',
  title: 'Welcome.md',
  content: `# Welcome to WesPad

A sovereign, local-first, AI-optional writing pad.

## New Features
- **Smart Typing**: Auto-lists and auto-closing brackets.
- **Drag & Drop**: Drop files here to open them. Drop images to embed them!
- **Zen Mode**: Press \`Alt+Z\` to focus.

Start typing...
`,
  lastModified: Date.now(),
  history: [],
  historyIndex: 0
};

export const DEFAULT_SETTINGS = {
  fontSize: 16,
  fontFamily: 'mono',
  wordWrap: true,
};

export const AUTO_CLOSE_PAIRS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  '`': '`',
};