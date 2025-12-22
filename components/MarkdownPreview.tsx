import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  return (
    <div className="w-full h-full bg-slate-900 overflow-y-auto p-8 prose prose-invert prose-sm sm:prose-base max-w-none">
       {content.trim() ? (
         <ReactMarkdown>{content}</ReactMarkdown>
       ) : (
         <div className="text-slate-600 italic">Nothing to preview. Write something...</div>
       )}
    </div>
  );
};
