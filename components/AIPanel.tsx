import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Check, AlertCircle, Copy, RotateCcw, Quote, Trash2, Settings, Loader2, ArrowRight, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAI } from '../hooks/useAI';

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  contextText: string; 
  onReplaceText: (newText: string) => void;
  onAppendText: (newText: string) => void;
  apiKey: string;
  onOpenSettings: () => void;
}

type ToneType = 'Professional' | 'Casual' | 'Creative' | 'Academic' | 'Concise';

export const AIPanel: React.FC<AIPanelProps> = ({ 
  isOpen, 
  onClose, 
  selectedText, 
  contextText,
  onReplaceText,
  onAppendText,
  apiKey,
  onOpenSettings
}) => {
  const { messages, isLoading, sendMessage, clearChat, stopGeneration, hasKey } = useAI(apiKey);
  const [inputValue, setInputValue] = useState('');
  const [activeTone, setActiveTone] = useState<ToneType>('Professional');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isOpen]);

  const onSend = (text: string, context?: string) => {
      sendMessage(text, context, activeTone);
      setInputValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-12 right-4 w-80 sm:w-96 h-[550px] max-h-[85vh] bg-surface border border-border shadow-2xl rounded-xl flex flex-col z-50 overflow-hidden text-text transition-all animate-in fade-in slide-in-from-top-2">
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-background border-b border-border flex-none">
        <div className="flex items-center text-text font-semibold text-sm">
          <Sparkles size={16} className="mr-2 text-yellow-500" />
          <span>WesPad Assistant</span>
        </div>
        <div className="flex items-center space-x-1">
             <button onClick={clearChat} className="p-1.5 text-muted hover:text-text rounded transition-colors" title="Clear Chat">
                <Trash2 size={14} />
             </button>
            <button onClick={onClose} className="p-1.5 text-muted hover:text-text rounded transition-colors" title="Close">
              <X size={16} />
            </button>
        </div>
      </div>

      {/* Tone Selector */}
      <div className="px-3 py-2 bg-background border-b border-border flex items-center space-x-2 overflow-x-auto no-scrollbar">
        {(['Professional', 'Casual', 'Creative', 'Academic', 'Concise'] as ToneType[]).map(tone => (
            <button
                key={tone}
                onClick={() => setActiveTone(tone)}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors flex-shrink-0
                ${activeTone === tone 
                    ? 'bg-text text-background border-text font-medium' 
                    : 'bg-surface text-muted border-border hover:border-text hover:text-text'}`}
            >
                {tone}
            </button>
        ))}
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
        
        {!hasKey && messages.length <= 1 && (
             <div className="bg-surface border border-red-900/20 p-4 rounded-lg flex flex-col items-start gap-3">
                <div className="flex items-center text-red-500 text-sm font-medium">
                  <AlertCircle size={16} className="mr-2" />
                  Setup Required
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  WesPad uses your own Google Gemini API key. Data stays local in your browser.
                </p>
                <button 
                  onClick={() => { onOpenSettings(); }}
                  className="flex items-center text-xs bg-text text-background hover:opacity-90 px-3 py-1.5 rounded transition-all font-medium"
                >
                  <Settings size={12} className="mr-1.5" />
                  Configure API Key
                </button>
              </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
             <div className={`
                max-w-[90%] rounded-2xl px-3 py-2 text-sm shadow-sm relative
                ${msg.role === 'user' 
                    ? 'bg-text text-background rounded-br-none' 
                    : 'bg-surface text-text border border-border rounded-bl-none'}
                ${msg.isError ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''}
             `}>
                {msg.role === 'model' ? (
                     <div className="prose prose-neutral dark:prose-invert prose-xs max-w-none leading-relaxed">
                         <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
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
                                    customStyle={{ background: 'var(--background)', margin: '0.5em 0', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.85em' }}
                                  />
                                ) : (
                                  <code {...rest} className={className}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                         >
                            {msg.text}
                         </ReactMarkdown>
                         {msg.isStreaming && (
                             <span className="inline-block w-2 h-4 align-middle ml-1 bg-muted animate-pulse"></span>
                         )}
                     </div>
                ) : (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                )}
                
                {/* Action Button for Auth Errors */}
                {msg.isAuthError && (
                    <button 
                        onClick={onOpenSettings}
                        className="mt-3 flex items-center text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 px-2 py-1.5 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors w-full justify-center font-medium"
                    >
                        <Settings size={12} className="mr-1.5" />
                        Open Settings
                    </button>
                )}
             </div>
             
             {/* AI Message Actions */}
             {msg.role === 'model' && !msg.isError && msg.id !== 'welcome' && !msg.isStreaming && (
                 <div className="flex items-center mt-1 space-x-1 ml-1">
                     <button 
                        onClick={() => navigator.clipboard.writeText(msg.text)}
                        className="p-1 text-muted hover:text-text rounded hover:bg-surface transition-colors"
                        title="Copy"
                     >
                        <Copy size={12} />
                     </button>
                     <div className="w-px h-3 bg-border mx-1"></div>
                     {selectedText && (
                        <button 
                            onClick={() => onReplaceText(msg.text)}
                            className="flex items-center px-1.5 py-0.5 text-[10px] text-muted hover:text-text rounded hover:bg-surface transition-colors"
                            title="Replace Selection"
                        >
                            <RotateCcw size={10} className="mr-1" /> Replace
                        </button>
                     )}
                     <button 
                        onClick={() => onAppendText(msg.text)}
                        className="flex items-center px-1.5 py-0.5 text-[10px] text-muted hover:text-text rounded hover:bg-surface transition-colors"
                        title="Insert at Cursor"
                     >
                        <Check size={10} className="mr-1" /> Insert
                     </button>
                 </div>
             )}
          </div>
        ))}
        
        {/* Loading Indicator (Initial Request) */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
             <div className="flex items-start">
                <div className="bg-surface border border-border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                    <Loader2 size={16} className="animate-spin text-muted" />
                </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-background border-t border-border flex-none">
        {/* Context Indicator */}
        <div className="flex items-center justify-between bg-surface border border-border rounded-md p-1.5 mb-2 text-xs">
            {selectedText ? (
                <div className="flex items-center text-muted truncate max-w-[150px] sm:max-w-[180px]">
                    <Quote size={12} className="mr-1.5 flex-shrink-0" />
                    <span className="truncate italic">"{selectedText.substring(0, 30)}..."</span>
                </div>
            ) : (
                <div className="flex items-center text-muted">
                    <Sparkles size={12} className="mr-1.5 flex-shrink-0" />
                    <span>Using recent context</span>
                </div>
            )}
            
            <div className="flex space-x-1 flex-shrink-0">
                {selectedText && (
                    <>
                    <button 
                        onClick={() => onSend(`Rewrite this text to be more ${activeTone.toLowerCase()}.`, selectedText)}
                        className="px-2 py-0.5 bg-background border border-border rounded hover:border-text transition-colors text-[10px]"
                    >
                        Rewrite
                    </button>
                    <button 
                        onClick={() => onSend("Summarize this text.", selectedText)}
                        className="px-2 py-0.5 bg-background border border-border rounded hover:border-text transition-colors text-[10px]"
                    >
                        Summarize
                    </button>
                    </>
                )}
                 <button 
                    onClick={() => onSend(`Continue writing based on this context. Keep it ${activeTone.toLowerCase()}.`, selectedText || contextText)}
                    className="flex items-center px-2 py-0.5 bg-background border border-border rounded hover:border-text transition-colors text-[10px]"
                    title="Generate continuation"
                >
                    Continue <ArrowRight size={10} className="ml-1" />
                </button>
            </div>
        </div>

        <div className="flex items-end gap-2 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSend(inputValue, selectedText || contextText);
                }
            }}
            placeholder={typeof navigator !== 'undefined' && !navigator.onLine ? "Offline" : selectedText ? `Ask to ${activeTone.toLowerCase()} rewrite...` : `Ask WesPad (${activeTone})...`}
            disabled={isLoading || (typeof navigator !== 'undefined' && !navigator.onLine)}
            className="flex-1 bg-surface border border-border rounded-lg pl-3 pr-10 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-text/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all placeholder:text-muted/70"
          />
          
          {isLoading ? (
            <button
                onClick={stopGeneration}
                className="absolute right-1.5 bottom-1.5 p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all animate-in zoom-in duration-200"
                title="Stop Generation"
            >
                <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
                onClick={() => onSend(inputValue, selectedText || contextText)}
                disabled={!inputValue.trim() || (typeof navigator !== 'undefined' && !navigator.onLine)}
                className="absolute right-1.5 bottom-1.5 p-1.5 bg-text text-background rounded-md hover:opacity-90 disabled:opacity-0 disabled:cursor-not-allowed transition-all"
            >
                <Send size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};