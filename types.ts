export interface Tab {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  isCustomTitle?: boolean;
  history?: string[];
  historyIndex?: number;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export enum ViewMode {
  EDIT = 'EDIT',
  PREVIEW = 'PREVIEW',
  SPLIT = 'SPLIT'
}

export interface AIState {
  isLoading: boolean;
  error: string | null;
  result: string | null;
  isOpen: boolean;
  activeMode: 'rewrite' | 'summarize' | 'generate' | null;
}