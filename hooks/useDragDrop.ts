import { useState } from 'react';
import { Tab } from '../types';

interface UseDragDropProps {
  createTab: (title: string, content: string) => void;
  updateContent: (content: string) => void;
  activeTab: Tab;
  editorRef: React.RefObject<HTMLTextAreaElement>;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const useDragDrop = ({
  createTab,
  updateContent,
  activeTab,
  editorRef,
  addToast
}: UseDragDropProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'file' | 'image' | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); 
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
      
      let isImage = false;
      if (e.dataTransfer.items) {
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          if (e.dataTransfer.items[i].type.startsWith('image/')) isImage = true;
        }
      }
      setDragType(isImage ? 'image' : 'file');
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Prevent flicker: Only hide if we are actually leaving the container,
      // not just entering a child element (like the textarea)
      if (e.currentTarget.contains(e.relatedTarget as Node)) {
          return;
      }
      
      setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault(); 
      e.stopPropagation();
      setIsDragging(false); 
      setDragType(null);
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const files = Array.from(e.dataTransfer.files);
          for (const file of files) {
               if (file.type.startsWith('image/')) {
                 const reader = new FileReader();
                 reader.onload = (event) => {
                   const base64 = event.target?.result as string;
                   const markdownImage = `\n![${file.name}](${base64})\n`;
                   
                   // Insert at cursor position if possible
                   if (editorRef.current) {
                      const { selectionStart, selectionEnd, value } = editorRef.current;
                      const newValue = value.substring(0, selectionStart) + markdownImage + value.substring(selectionEnd);
                      updateContent(newValue);
                   } else {
                      updateContent(activeTab.content + markdownImage);
                   }
                   addToast('Image Embedded', 'success');
                 };
                 reader.readAsDataURL(file);
               } else {
                  try {
                      const text = await file.text();
                      createTab(file.name, text);
                  } catch (err) {
                      addToast(`Failed to open ${file.name}`, 'error');
                  }
               }
          }
      }
  };

  return {
    isDragging,
    dragType,
    setIsDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};