import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser?.role === 'owner' || loggedUser?.role === 'admin') {
        navigate('/');
      } else {
        navigate('/generate');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemo = () => {
    setEmail('admin');
    setPassword('dxgen2026');
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      <div className="w-full max-w-md saas-card p-8 space-y-6 bg-gradient-to-b from-[#0f172a] to-[#0b1120] border-[#1e293b]">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 items-center justify-center shadow-lg shadow-cyan-500/20 mb-2">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sign in to DXGen</h1>
          <p className="text-xs text-slate-400">Enterprise AI Content Generation & Developer API Platform</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Demo Fast Login Pill */}
        <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <p className="font-semibold text-brand-300">Admin Account</p>
            <p className="text-[11px] text-slate-400">admin / dxgen2026</p>
          </div>
          <button
            type="button"
            onClick={handleUseDemo}
            className="px-2.5 py-1 rounded bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-semibold transition-colors"
          >
            Auto Fill
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Email or Username</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin or you@company.com"
                className="w-full pl-9 pr-3 py-2.5 bg-[#090d16] border border-[#1e293b] focus:border-brand-500 rounded-lg text-white outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-[#090d16] border border-[#1e293b] focus:border-brand-500 rounded-lg text-white outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          <span>Don't have an account? </span>
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
