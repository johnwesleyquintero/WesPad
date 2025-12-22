import React, { useState } from 'react';
import { Sparkles, X, Loader, Check, AlertCircle } from 'lucide-react';
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

export const AIPanel: React.FC<AIPanelProps> = ({ 
  isOpen, 
  onClose, 
  selectedText, 
  onReplaceText,
  onAppendText,
  apiKey,
  onOpenSettings
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRewrite = async () => {
    setLoading(true);
    setError(null);
    try {
      const text = await geminiService.rewriteText(selectedText || prompt, apiKey);
      setResult(text);
    } catch (e: any) {
      setError(e.message || "Failed to rewrite text.");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    setLoading(true);
    setError(null);
    try {
      const text = await geminiService.summarizeText(selectedText || prompt, apiKey);
      setResult(text);
    } catch (e: any) {
      setError(e.message || "Failed to summarize.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    try {
      const text = await geminiService.generateText(prompt, apiKey);
      setResult(text);
    } catch (e: any) {
      setError(e.message || "Failed to generate text.");
    } finally {
      setLoading(false);
    }
  };

  const hasSelection = selectedText.length > 0;
  // Type-safe check for process.env
  const hasEnvKey = typeof process !== 'undefined' && process.env && process.env.API_KEY;
  const hasKey = !!apiKey || !!hasEnvKey;

  return (
    <div className="absolute top-12 right-4 w-80 sm:w-96 bg-surface border border-border shadow-2xl rounded-lg flex flex-col z-50 overflow-hidden text-text transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-background border-b border-border">
        <div className="flex items-center text-text font-semibold">
          <Sparkles size={16} className="mr-2" />
          <span>WesPad AI</span>
        </div>
        <button onClick={onClose} className="text-muted hover:text-text transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col space-y-4">
        
        {!hasKey && (
          <div className="bg-background border border-border rounded p-3 mb-2 flex flex-col items-start gap-2">
            <div className="flex items-center text-text text-xs font-medium">
              <AlertCircle size={14} className="mr-1.5" />
              API Key Missing
            </div>
            <p className="text-xs text-muted">
              You need a Google Gemini API key to use these features.
            </p>
            <button 
              onClick={() => { onClose(); onOpenSettings(); }}
              className="text-xs bg-text text-background hover:opacity-80 px-2 py-1 rounded transition-colors"
            >
              Open Settings
            </button>
          </div>
        )}

        {/* Context Indicator */}
        <div className="text-xs text-muted mb-2 font-mono">
          {hasSelection 
            ? `Context: "${selectedText.substring(0, 30)}${selectedText.length > 30 ? '...' : ''}"`
            : "No text selected. Enter a prompt below."
          }
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={!hasSelection || loading || !hasKey}
            onClick={handleRewrite}
            className="bg-background hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed text-text text-xs py-2 px-3 rounded transition-colors text-left border border-border"
          >
            Rewrite Selection
          </button>
          <button
            disabled={!hasSelection || loading || !hasKey}
            onClick={handleSummarize}
            className="bg-background hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed text-text text-xs py-2 px-3 rounded transition-colors text-left border border-border"
          >
            Summarize Selection
          </button>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="text-xs text-muted block mb-1">Custom Prompt</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={prompt}
              disabled={!hasKey}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Write a poem about rust..."
              className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm text-text focus:border-text focus:outline-none disabled:opacity-50"
              onKeyDown={(e) => e.key === 'Enter' && hasKey && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt || loading || !hasKey}
              className="bg-text hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed text-background p-1.5 rounded transition-colors"
            >
              <Sparkles size={16} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-4 text-text">
            <Loader size={20} className="animate-spin mr-2" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-2 bg-background border border-red-900 rounded text-red-500 text-xs">
            {error}
          </div>
        )}

        {/* Result Area */}
        {result && (
          <div className="mt-2">
            <div className="text-xs text-muted mb-1">Result:</div>
            <div className="bg-background p-3 rounded border border-border text-sm text-text max-h-40 overflow-y-auto mb-3 whitespace-pre-wrap">
              {result}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => { if(hasSelection) onReplaceText(result); else onAppendText(result); onClose(); }}
                className="flex-1 bg-text hover:opacity-90 text-background text-xs py-2 rounded flex items-center justify-center transition-colors font-medium"
              >
                <Check size={14} className="mr-1" />
                {hasSelection ? 'Replace' : 'Insert'}
              </button>
              <button
                onClick={() => { onAppendText(result); onClose(); }}
                className="flex-1 bg-background hover:bg-surface text-text text-xs py-2 rounded transition-colors border border-border"
              >
                Append
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};