import React, { useState } from 'react';
import { Sparkles, X, Loader, Check, AlertCircle } from 'lucide-react';
import { AIState } from '../types';
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
  const hasKey = !!apiKey || (typeof process !== 'undefined' && !!process.env?.API_KEY);

  return (
    <div className="absolute top-12 right-4 w-80 sm:w-96 bg-slate-800 border border-slate-700 shadow-2xl rounded-lg flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center text-sky-400 font-semibold">
          <Sparkles size={16} className="mr-2" />
          <span>WesPad AI</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col space-y-4">
        
        {!hasKey && (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded p-3 mb-2 flex flex-col items-start gap-2">
            <div className="flex items-center text-yellow-500 text-xs font-medium">
              <AlertCircle size={14} className="mr-1.5" />
              API Key Missing
            </div>
            <p className="text-xs text-yellow-200/80">
              You need a Google Gemini API key to use these features.
            </p>
            <button 
              onClick={() => { onClose(); onOpenSettings(); }}
              className="text-xs bg-yellow-800 hover:bg-yellow-700 text-yellow-100 px-2 py-1 rounded transition-colors"
            >
              Open Settings
            </button>
          </div>
        )}

        {/* Context Indicator */}
        <div className="text-xs text-slate-400 mb-2">
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
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 text-xs py-2 px-3 rounded transition-colors text-left"
          >
            Rewrite Selection
          </button>
          <button
            disabled={!hasSelection || loading || !hasKey}
            onClick={handleSummarize}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 text-xs py-2 px-3 rounded transition-colors text-left"
          >
            Summarize Selection
          </button>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">Custom Prompt</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={prompt}
              disabled={!hasKey}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Write a poem about rust..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:border-sky-500 focus:outline-none disabled:opacity-50"
              onKeyDown={(e) => e.key === 'Enter' && hasKey && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt || loading || !hasKey}
              className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-1.5 rounded transition-colors"
            >
              <Sparkles size={16} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-4 text-sky-400">
            <Loader size={20} className="animate-spin mr-2" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-2 bg-red-900/30 border border-red-800 rounded text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Result Area */}
        {result && (
          <div className="mt-2">
            <div className="text-xs text-slate-400 mb-1">Result:</div>
            <div className="bg-slate-900 p-3 rounded border border-slate-700 text-sm text-slate-300 max-h-40 overflow-y-auto mb-3 whitespace-pre-wrap">
              {result}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => { if(hasSelection) onReplaceText(result); else onAppendText(result); onClose(); }}
                className="flex-1 bg-green-700 hover:bg-green-600 text-white text-xs py-2 rounded flex items-center justify-center transition-colors"
              >
                <Check size={14} className="mr-1" />
                {hasSelection ? 'Replace Selection' : 'Insert Text'}
              </button>
              <button
                onClick={() => { onAppendText(result); onClose(); }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded transition-colors"
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
