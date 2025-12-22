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
    <div className="absolute top-12 right-4 w-80 sm:w-96 bg-neutral-900 border border-neutral-700 shadow-2xl rounded-lg flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-neutral-950 border-b border-neutral-800">
        <div className="flex items-center text-white font-semibold">
          <Sparkles size={16} className="mr-2" />
          <span>WesPad AI</span>
        </div>
        <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col space-y-4">
        
        {!hasKey && (
          <div className="bg-neutral-800 border border-neutral-700 rounded p-3 mb-2 flex flex-col items-start gap-2">
            <div className="flex items-center text-white text-xs font-medium">
              <AlertCircle size={14} className="mr-1.5" />
              API Key Missing
            </div>
            <p className="text-xs text-neutral-400">
              You need a Google Gemini API key to use these features.
            </p>
            <button 
              onClick={() => { onClose(); onOpenSettings(); }}
              className="text-xs bg-white text-black hover:bg-neutral-200 px-2 py-1 rounded transition-colors"
            >
              Open Settings
            </button>
          </div>
        )}

        {/* Context Indicator */}
        <div className="text-xs text-neutral-500 mb-2 font-mono">
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
            className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-200 text-xs py-2 px-3 rounded transition-colors text-left border border-neutral-700"
          >
            Rewrite Selection
          </button>
          <button
            disabled={!hasSelection || loading || !hasKey}
            onClick={handleSummarize}
            className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-200 text-xs py-2 px-3 rounded transition-colors text-left border border-neutral-700"
          >
            Summarize Selection
          </button>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="text-xs text-neutral-500 block mb-1">Custom Prompt</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={prompt}
              disabled={!hasKey}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Write a poem about rust..."
              className="flex-1 bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-sm text-white focus:border-white focus:outline-none disabled:opacity-50"
              onKeyDown={(e) => e.key === 'Enter' && hasKey && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt || loading || !hasKey}
              className="bg-white hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed text-black p-1.5 rounded transition-colors"
            >
              <Sparkles size={16} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-4 text-white">
            <Loader size={20} className="animate-spin mr-2" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-2 bg-neutral-800 border border-red-900 rounded text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Result Area */}
        {result && (
          <div className="mt-2">
            <div className="text-xs text-neutral-500 mb-1">Result:</div>
            <div className="bg-neutral-950 p-3 rounded border border-neutral-700 text-sm text-neutral-300 max-h-40 overflow-y-auto mb-3 whitespace-pre-wrap">
              {result}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => { if(hasSelection) onReplaceText(result); else onAppendText(result); onClose(); }}
                className="flex-1 bg-white hover:bg-neutral-200 text-black text-xs py-2 rounded flex items-center justify-center transition-colors font-medium"
              >
                <Check size={14} className="mr-1" />
                {hasSelection ? 'Replace' : 'Insert'}
              </button>
              <button
                onClick={() => { onAppendText(result); onClose(); }}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs py-2 rounded transition-colors border border-neutral-700"
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