import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
  fontFamily: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, fontFamily }) => {
  const getFontClass = () => {
    switch(fontFamily) {
      case 'sans': return 'font-sans';
      case 'serif': return 'font-serif';
      default: return 'font-mono';
    }
  };

  return (
    <div className={`w-full h-full bg-surface overflow-y-auto p-8 prose prose-neutral dark:prose-invert prose-sm sm:prose-base max-w-none transition-colors ${getFontClass()}`}>
       {content.trim() ? (
         <ReactMarkdown>{content}</ReactMarkdown>
       ) : (
         <div className="text-muted italic">Nothing to preview. Write something...</div>
       )}
    </div>
  );
};