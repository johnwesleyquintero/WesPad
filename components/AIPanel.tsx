import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Check, AlertCircle, Copy, RotateCcw, Quote, Trash2, Settings, Loader2, ArrowRight, Square, Bot, User } from 'lucide-react';
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

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
    <div className="absolute top-14 right-4 w-96 max-h-[80vh] h-[600px] bg-surface/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden text-text transition-all animate-in fade-in slide-in-from-top-4 ring-1 ring-black/5">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/50 flex-none">
        <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-1 rounded-lg shadow-sm">
                <Sparkles size={14} className="text-white" />
            </div>
            <div>
                <h3 className="text-sm font-bold leading-none">WesPad AI</h3>
                <p className="text-[10px] text-muted font-medium mt-0.5">Powered by Gemini</p>
            </div>
        </div>
        <div className="flex items-center space-x-1">
             <button onClick={clearChat} className="p-2 text-muted hover:text-text hover:bg-background rounded-full transition-colors" title="Clear Chat">
                <Trash2 size={14} />
             </button>
            <button onClick={onClose} className="p-2 text-muted hover:text-text hover:bg-background rounded-full transition-colors" title="Close">
              <X size={16} />
            </button>
        </div>
      </div>

      {/* Tone Selector */}
      <div className="px-4 py-3 bg-background/30 border-b border-border/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {(['Professional', 'Casual', 'Creative', 'Academic', 'Concise'] as ToneType[]).map(tone => (
            <button
                key={tone}
                onClick={() => setActiveTone(tone)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all flex-shrink-0 font-medium
                ${activeTone === tone 
                    ? 'bg-text text-background border-text shadow-sm' 
                    : 'bg-background border-border text-muted hover:border-text/50 hover:text-text'}`}
            >
                {tone}
            </button>
        ))}
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-background/50">
        
        {!hasKey && messages.length <= 1 && (
             <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center text-red-600 dark:text-red-400 text-sm font-semibold">
                  <AlertCircle size={16} className="mr-2" />
                  API Key Missing
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  To use AI features, you need to provide your own Google Gemini API key. It's free and stays local on your device.
                </p>
                <button 
                  onClick={onOpenSettings}
                  className="flex items-center justify-center text-xs bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all font-medium shadow-sm"
                >
                  <Settings size={12} className="mr-1.5" />
                  Configure Key
                </button>
              </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
             
             {/* Avatar */}
             <div className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm
                ${msg.role === 'user' ? 'bg-surface border border-border' : 'bg-gradient-to-br from-blue-500 to-purple-600'}
             `}>
                {msg.role === 'user' ? <User size={14} className="text-muted" /> : <Bot size={14} className="text-white" />}
             </div>

             <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                 <div className={`
                    rounded-2xl px-4 py-2.5 text-sm shadow-sm
                    ${msg.role === 'user' 
                        ? 'bg-text text-background rounded-tr-sm' 
                        : 'bg-surface text-text border border-border rounded-tl-sm'}
                    ${msg.isError ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''}
                 `}>
                    {msg.role === 'model' ? (
                         <div className="prose prose-neutral dark:prose-invert prose-xs max-w-none leading-relaxed break-words">
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
                                        customStyle={{ background: 'var(--background)', margin: '0.8em 0', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.85em' }}
                                      />
                                    ) : (
                                      <code {...rest} className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[0.9em]">
                                        {children}
                                      </code>
                                    );
                                  }
                                }}
                             >
                                {msg.text}
                             </ReactMarkdown>
                             {msg.isStreaming && (
                                 <span className="inline-block w-1.5 h-4 align-middle ml-1 bg-current opacity-50 animate-pulse"></span>
                             )}
                         </div>
                    ) : (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                    )}
                 </div>

                 {/* Actions */}
                 {msg.role === 'model' && !msg.isError && msg.id !== 'welcome' && !msg.isStreaming && (
                     <div className="flex items-center mt-1 space-x-2 ml-1 opacity-60 hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => navigator.clipboard.writeText(msg.text)}
                            className="text-xs flex items-center text-muted hover:text-text"
                            title="Copy"
                         >
                            <Copy size={10} className="mr-1" /> Copy
                         </button>
                         {selectedText && (
                            <button 
                                onClick={() => onReplaceText(msg.text)}
                                className="text-xs flex items-center text-muted hover:text-text"
                                title="Replace Selection"
                            >
                                <RotateCcw size={10} className="mr-1" /> Replace
                            </button>
                         )}
                         <button 
                            onClick={() => onAppendText(msg.text)}
                            className="text-xs flex items-center text-muted hover:text-text"
                            title="Insert at Cursor"
                         >
                            <Check size={10} className="mr-1" /> Insert
                         </button>
                     </div>
                 )}
             </div>
          </div>
        ))}
        
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center">
                    <Sparkles size={14} className="text-muted animate-pulse" />
                </div>
                <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-muted" />
                    <span className="text-xs text-muted">Thinking...</span>
                </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background/50 border-t border-border/50 flex-none">
        
        {/* Context Chip */}
        {selectedText ? (
            <div className="flex items-center justify-between bg-surface border border-border rounded-lg p-2 mb-2">
                 <div className="flex items-center text-muted text-xs truncate max-w-[200px]">
                    <Quote size={12} className="mr-2 flex-shrink-0" />
                    <span className="truncate italic">"{selectedText.substring(0, 40)}..."</span>
                </div>
                <div className="flex gap-1">
                     <button onClick={() => onSend(`Rewrite this text to be more ${activeTone.toLowerCase()}.`, selectedText)} className="text-[10px] px-2 py-1 bg-background rounded border border-border hover:border-text transition-colors">Rewrite</button>
                     <button onClick={() => onSend("Summarize this.", selectedText)} className="text-[10px] px-2 py-1 bg-background rounded border border-border hover:border-text transition-colors">Summarize</button>
                </div>
            </div>
        ) : contextText ? (
             <div className="flex justify-end mb-2">
                 <button 
                    onClick={() => onSend(`Continue writing based on this context. Keep it ${activeTone.toLowerCase()}.`, contextText)}
                    className="flex items-center text-[10px] text-muted hover:text-text transition-colors bg-surface px-2 py-1 rounded-full border border-border"
                >
                    <Sparkles size={10} className="mr-1" /> Continue writing
                </button>
             </div>
        ) : null}

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
            placeholder={!navigator.onLine ? "Offline" : selectedText ? `Ask to ${activeTone.toLowerCase()} rewrite...` : `Ask WesPad (${activeTone})...`}
            disabled={isLoading || !navigator.onLine}
            className="flex-1 bg-surface/50 border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-text focus:bg-background transition-all placeholder:text-muted/60"
          />
          
          <button
                onClick={() => isLoading ? stopGeneration() : onSend(inputValue, selectedText || contextText)}
                disabled={(!inputValue.trim() && !isLoading) || !navigator.onLine}
                className={`
                    absolute right-1.5 bottom-1.5 p-1.5 rounded-lg transition-all shadow-sm
                    ${isLoading 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-text hover:opacity-90 text-background disabled:opacity-0'}
                `}
            >
                {isLoading ? <Square size={14} fill="currentColor" /> : <Send size={14} />}
            </button>
        </div>
      </div>
    </div>
  );
};