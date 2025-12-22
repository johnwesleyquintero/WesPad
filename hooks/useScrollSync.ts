import { useRef } from 'react';
import { ViewMode } from '../types';

export const useScrollSync = (
  viewMode: ViewMode, 
  isEnabled: boolean,
  editorRef: React.RefObject<HTMLTextAreaElement>,
  previewRef: React.RefObject<HTMLDivElement>
) => {
  const isSyncingLeft = useRef(false);
  const isSyncingRight = useRef(false);

  const handleEditorScroll = () => {
    if (!isEnabled || viewMode !== ViewMode.SPLIT) return;
    
    if (isSyncingRight.current) {
        isSyncingRight.current = false;
        return;
    }
    
    if (previewRef.current && editorRef.current) {
        isSyncingLeft.current = true;
        const editor = editorRef.current;
        const preview = previewRef.current;
        
        const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
        const targetScroll = percentage * (preview.scrollHeight - preview.clientHeight);
        
        preview.scrollTop = targetScroll;
    }
  };

  const handlePreviewScroll = () => {
    if (!isEnabled || viewMode !== ViewMode.SPLIT) return;
    
    if (isSyncingLeft.current) {
        isSyncingLeft.current = false;
        return;
    }

    if (previewRef.current && editorRef.current) {
        isSyncingRight.current = true;
        const editor = editorRef.current;
        const preview = previewRef.current;

        const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
        const targetScroll = percentage * (editor.scrollHeight - editor.clientHeight);
        
        editor.scrollTop = targetScroll;
    }
  };

  return { handleEditorScroll, handlePreviewScroll };
};