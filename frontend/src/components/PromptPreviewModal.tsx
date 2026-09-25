import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { Modal } from './Modal.js';

interface PromptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
}

export const PromptPreviewModal: React.FC<PromptPreviewModalProps> = ({
  isOpen,
  onClose,
  prompt
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generated Internal AI Prompt" maxWidth="max-w-3xl">
      <div className="space-y-4">
        <p className="text-xs text-slate-400">
          This is the exact structured prompt synthesized internally by the DXGen PromptBuilder and delivered to Google Gemini.
        </p>

        <div className="relative">
          <pre className="bg-[#090d16] border border-[#1e293b] rounded-lg p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto max-h-[50vh] whitespace-pre-wrap selection:bg-brand-500 selection:text-white">
            {prompt}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors shadow-md"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#1e293b] text-slate-300 text-xs font-medium hover:bg-[#334155] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
