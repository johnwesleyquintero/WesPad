import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, Check, AlertCircle, Copy, RotateCcw, Quote, Trash2 } from 'lucide-react';
import { Chat } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import * as geminiService from '../services/geminiService';

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onReplaceText: (newText: string) => void;
  onAppendText: (newText: string) => void;
  apiKey: string;
  onOpenSettings: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export const AIPanel: React.FC<AIPanelProps> = ({ 
  isOpen, 
  onClose, 
  selectedText, 
  onReplaceText,
  onAppendText,
  apiKey,
  onOpenSettings
}) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', text: "Hi! I'm your writing assistant. Select text to rewrite/summarize, or just ask me anything." }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Chat Session
  useEffect(() => {
    if ((apiKey || (process.env.API_KEY)) && !chatSession) {
      try {
        const session = geminiService.createChatSession(apiKey, "You are a helpful, concise writing assistant embedded in a Markdown editor. Keep answers brief and relevant to writing tasks.");
        setChatSession(session);
      } catch (e) {
        console.error("Failed to init chat", e);
      }
    }
  }, [apiKey, chatSession]);

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

  const handleSendMessage = async (text: string, context?: string) => {
    if (!text.trim() || !chatSession) return;
    
    setIsLoading(true);
    
    // Construct the actual prompt sending to AI
    let fullPrompt = text;
    let displayText = text;

    if (context) {
        fullPrompt = `Context:\n"""\n${context}\n"""\n\nTask: ${text}`;
        // We don't change display text, we show context as a UI element in the message bubble if we wanted, 
        // but for now, just showing the user's command is cleaner. 
        // Or we can append a small note.
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: displayText };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    try {
        const result = await chatSession.sendMessage({ message: fullPrompt });
        const responseText = result.text;
        
        if (responseText) {
            setMessages(prev => [...prev, { 
                id: (Date.now() + 1).toString(), 
                role: 'model', 
                text: responseText 
            }]);
        }
    } catch (e: any) {
        setMessages(prev => [...prev, { 
            id: (Date.now() + 1).toString(), 
            role: 'model', 
            text: `Error: ${e.message || 'Something went wrong.'}`, 
            isError: true 
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([{ id: 'welcome', role: 'model', text: "Chat cleared. ready for new ideas!" }]);
    // Reset session to clear context window
    try {
        const session = geminiService.createChatSession(apiKey, "You are a helpful, concise writing assistant embedded in a Markdown editor. Keep answers brief and relevant to writing tasks.");
        setChatSession(session);
    } catch(e) { console.error(e) }
  };

  const hasKey = !!apiKey || (typeof process !== 'undefined' && !!process.env?.API_KEY);

  // If panel is closed, we hide it instead of unmounting to preserve chat state
  // Using a class to toggle visibility
  if (!isOpen) return null; // We'll stick to simple conditional rendering for now as per previous constraints, unless user specifically asked for persistence. The user asked for "Integrate a chat interface". Unmounting on close is default behavior for the modal-like panel. I'll keep it simple.

  return (
    <div className="absolute top-12 right-4 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-surface border border-border shadow-2xl rounded-xl flex flex-col z-50 overflow-hidden text-text transition-all animate-in fade-in slide-in-from-top-2">
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-background border-b border-border flex-none">
        <div className="flex items-center text-text font-semibold text-sm">
          <Sparkles size={16} className="mr-2 text-yellow-500" />
          <span>WesPad Assistant</span>
        </div>
        <div className="flex items-center space-x-1">
             <button onClick={handleClearChat} className="p-1.5 text-muted hover:text-text rounded transition-colors" title="Clear Chat">
                <Trash2 size={14} />
             </button>
            <button onClick={onClose} className="p-1.5 text-muted hover:text-text rounded transition-colors" title="Close">
              <X size={16} />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
        
        {!hasKey && (
             <div className="bg-surface border border-red-900/20 p-3 rounded-lg flex flex-col items-start gap-2">
                <div className="flex items-center text-red-500 text-xs font-medium">
                  <AlertCircle size={14} className="mr-1.5" />
                  API Key Missing
                </div>
                <p className="text-xs text-muted">
                  Please configure your Google Gemini API key in Settings to use the chat.
                </p>
                <button 
                  onClick={() => { onClose(); onOpenSettings(); }}
                  className="text-xs bg-text text-background hover:opacity-80 px-2 py-1 rounded transition-colors"
                >
                  Open Settings
                </button>
              </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
             <div className={`
                max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm
                ${msg.role === 'user' 
                    ? 'bg-text text-background rounded-br-none' 
                    : 'bg-surface text-text border border-border rounded-bl-none'}
                ${msg.isError ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''}
             `}>
                {msg.role === 'model' ? (
                     <div className="prose prose-neutral dark:prose-invert prose-xs max-w-none leading-relaxed">
                         <ReactMarkdown>{msg.text}</ReactMarkdown>
                     </div>
                ) : (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                )}
             </div>
             
             {/* AI Message Actions */}
             {msg.role === 'model' && !msg.isError && msg.id !== 'welcome' && (
                 <div className="flex items-center mt-1 space-x-1 ml-1">
                     <button 
                        onClick={() => navigator.clipboard.writeText(msg.text)}
                        className="p-1 text-muted hover:text-text rounded hover:bg-surface transition-colors"
                        title="Copy"
                     >
                        <Copy size={12} />
                     </button>
                     <div className="w-px h-3 bg-border mx-1"></div>
                     <button 
                        onClick={() => onReplaceText(msg.text)}
                        className="flex items-center px-1.5 py-0.5 text-[10px] text-muted hover:text-text rounded hover:bg-surface transition-colors"
                        title="Replace Selection"
                     >
                        <RotateCcw size={10} className="mr-1" /> Replace
                     </button>
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

        {isLoading && (
            <div className="flex items-start">
                <div className="bg-surface border border-border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                    <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-background border-t border-border flex-none">
        {/* Context Indicator */}
        {selectedText && (
            <div className="flex items-center justify-between bg-surface border border-border rounded-md p-1.5 mb-2 text-xs">
                <div className="flex items-center text-muted truncate max-w-[200px]">
                    <Quote size={12} className="mr-1.5 flex-shrink-0" />
                    <span className="truncate italic">"{selectedText.substring(0, 30)}..."</span>
                </div>
                <div className="flex space-x-1 flex-shrink-0">
                    <button 
                        onClick={() => handleSendMessage("Rewrite this text to be clearer and more professional.", selectedText)}
                        className="px-2 py-0.5 bg-background border border-border rounded hover:border-text transition-colors text-[10px]"
                    >
                        Rewrite
                    </button>
                    <button 
                        onClick={() => handleSendMessage("Summarize this text.", selectedText)}
                        className="px-2 py-0.5 bg-background border border-border rounded hover:border-text transition-colors text-[10px]"
                    >
                        Summarize
                    </button>
                </div>
            </div>
        )}

        <div className="flex items-end gap-2 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputValue, selectedText);
                }
            }}
            placeholder={selectedText ? "Ask about selection..." : "Ask WesPad AI..."}
            disabled={!hasKey || isLoading}
            className="flex-1 bg-surface border border-border rounded-lg pl-3 pr-10 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-text/50 disabled:opacity-50 transition-all placeholder:text-muted/70"
          />
          <button
            onClick={() => handleSendMessage(inputValue, selectedText)}
            disabled={!inputValue.trim() || !hasKey || isLoading}
            className="absolute right-1.5 bottom-1.5 p-1.5 bg-text text-background rounded-md hover:opacity-90 disabled:opacity-0 disabled:cursor-not-allowed transition-all"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};