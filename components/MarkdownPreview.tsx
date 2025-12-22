import React, { forwardRef, useState, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
  fontFamily: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

const CodeBlock = ({ children, className, ...rest }: any) => {
  const [isCopied, setIsCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!match) {
    return (
      <code {...rest} className={className}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between bg-[#1e1e1e] px-4 py-2 border-b border-[#333]">
        <span className="text-xs text-muted font-mono lowercase">{match[1]}</span>
        <button
          onClick={handleCopy}
          className="text-muted hover:text-white transition-colors"
          title="Copy code"
        >
          {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
      </div>
      <SyntaxHighlighter
        {...rest}
        PreTag="div"
        children={codeString}
        language={match[1]}
        style={vscDarkPlus}
        customStyle={{ 
            background: '#1e1e1e', 
            margin: 0, 
            padding: '1.5rem',
            fontSize: '0.85em',
            border: 'none',
            borderRadius: 0
        }}
      />
    </div>
  );
};

export const MarkdownPreview = memo(forwardRef<HTMLDivElement, MarkdownPreviewProps>(({ content, fontFamily, onScroll }, ref) => {
  const getFontClass = () => {
    switch(fontFamily) {
      case 'sans': return 'font-sans';
      case 'serif': return 'font-serif';
      default: return 'font-mono';
    }
  };

  return (
    <div 
        ref={ref}
        onScroll={onScroll}
        className={`w-full h-full bg-surface overflow-y-auto p-8 prose prose-neutral dark:prose-invert prose-sm sm:prose-base max-w-none transition-colors ${getFontClass()}`}
    >
       {content.trim() ? (
         <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: CodeBlock
            }}
         >
            {content}
         </ReactMarkdown>
       ) : (
         <div className="text-muted italic">Nothing to preview. Write something...</div>
       )}
    </div>
  );
}), (prevProps, nextProps) => {
  // Custom comparison to avoid re-renders if content hasn't changed
  // This is crucial for performance when typing in the editor (Split View)
  return (
    prevProps.content === nextProps.content &&
    prevProps.fontFamily === nextProps.fontFamily
  );
});

MarkdownPreview.displayName = 'MarkdownPreview';