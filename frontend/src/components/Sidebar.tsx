import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  History,
  KeyRound,
  BarChart3,
  Building2,
  FileCode2,
  ShieldCheck,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'owner' || user?.role === 'admin';

  // Admin sees full platform management suite.
  // Normal users ONLY access the AI Content Generation features (Generate & History).
  const navItems = isAdmin
    ? [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/generate', label: 'Generate Content', icon: Sparkles, badge: 'AI' },
        { to: '/history', label: 'Content History', icon: History },
        { to: '/api-keys', label: 'API Keys', icon: KeyRound },
        { to: '/usage', label: 'Usage & Analytics', icon: BarChart3 },
        { to: '/profiles', label: 'Business Profiles', icon: Building2 },
        { to: '/docs', label: 'Documentation', icon: FileCode2 },
        { to: '/admin', label: 'Admin Panel', icon: ShieldCheck, badge: 'Owner' },
      ]
    : [
        { to: '/generate', label: 'Generate Content', icon: Sparkles, badge: 'AI' },
        { to: '/history', label: 'Content History', icon: History },
      ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#090d16] border-r border-[#1e293b] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#1e293b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">DX<span className="text-brand-400">Gen</span></span>
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 font-semibold border border-brand-500/20">SaaS + API</span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#131e36]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    item.badge === 'AI' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-purple-500/20 text-purple-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-[#1e293b] bg-[#0c1322]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#0f172a] border border-[#1e293b]">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.fullName || user?.email?.split('@')[0] || 'User'}
                </p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  user?.role === 'owner'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : user?.role === 'admin'
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
                }`}>
                  {user?.role === 'owner' ? 'Owner' : user?.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@dxgen.ai'}</p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
