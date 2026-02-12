export interface Tab {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  isCustomTitle?: boolean;
  history?: string[];
  historyIndex?: number;
  scrollTop?: number;
  selection?: { start: number; end: number };
  fileHandle?: FileSystemFileHandle;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export enum ViewMode {
  EDIT = "EDIT",
  PREVIEW = "PREVIEW",
  SPLIT = "SPLIT",
}

export interface AIState {
  isLoading: boolean;
  error: string | null;
  result: string | null;
  isOpen: boolean;
  activeMode: "rewrite" | "summarize" | "generate" | null;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}
