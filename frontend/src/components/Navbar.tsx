import React from 'react';
import { Menu, Zap } from 'lucide-react';

interface NavbarProps {
  onToggleMobile: () => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobile, title = 'Dashboard' }) => {
  return (
    <header className="h-16 bg-[#090d16]/80 backdrop-blur-md border-b border-[#1e293b] sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#131e36] lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-white tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Gemini Engine Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Gemini AI Engine Active</span>
        </div>

        {/* API v1 Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#131e36] border border-[#1e293b] text-xs font-mono text-cyan-400">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>v1.0 API</span>
        </div>
      </div>
    </header>
  );
};
