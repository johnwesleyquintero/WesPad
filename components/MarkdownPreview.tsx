import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
         <ReactMarkdown
            components={{
              code(props) {
                const {children, className, node, ...rest} = props;
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  // @ts-ignore
                  <SyntaxHighlighter
                    {...rest}
                    PreTag="div"
                    children={String(children).replace(/\n$/, '')}
                    language={match[1]}
                    style={vscDarkPlus}
                    customStyle={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.85em' }}
                  />
                ) : (
                  <code {...rest} className={className}>
                    {children}
                  </code>
                );
              }
            }}
         >
            {content}
         </ReactMarkdown>
       ) : (
         <div className="text-muted italic">Nothing to preview. Write something...</div>
       )}
    </div>
  );
};