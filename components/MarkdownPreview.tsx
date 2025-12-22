import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  return (
    <div className="w-full h-full bg-surface overflow-y-auto p-8 prose prose-neutral dark:prose-invert prose-sm sm:prose-base max-w-none transition-colors">
       {content.trim() ? (
         <ReactMarkdown>{content}</ReactMarkdown>
       ) : (
         <div className="text-muted italic">Nothing to preview. Write something...</div>
       )}
    </div>
  );
};