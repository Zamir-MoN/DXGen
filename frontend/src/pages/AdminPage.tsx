import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Users,
  KeyRound,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Power,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api.js';
import { animatePageIn } from '../animations/gsapTransitions.js';

export const AdminPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'keys' | 'errors'>('users');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [overRes, usersRes, keysRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/users'),
        api.get('/admin/api-keys')
      ]);
      setOverview(overRes.data.overview);
      setUsers(usersRes.data.users);
      setApiKeys(keysRes.data.keys);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    animatePageIn(containerRef.current);
    fetchAdminData();
  }, []);

  const handleToggleKey = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await api.patch(`/admin/api-keys/${id}`, { status: nextStatus });
      setApiKeys(apiKeys.map(k => k.id === id ? { ...k, status: nextStatus } : k));
    } catch (err) {
      alert('Failed to update key status');
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!window.confirm('Permanently delete this key as admin?')) return;
    try {
      await api.delete(`/admin/api-keys/${id}`);
      setApiKeys(apiKeys.filter(k => k.id !== id));
    } catch (err) {
      alert('Failed to delete key');
    }
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <span>Administrative Control Center</span>
          </h2>
          <p className="text-xs text-slate-400">System observability, multi-tenant governance, and global key controls.</p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e293b] text-slate-300 text-xs font-semibold hover:bg-[#334155] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Admin View</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="saas-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Registered Users</span>
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-bold text-white">{overview?.totalUsers || 0}</p>
          <p className="text-[11px] text-slate-400">Multi-tenant accounts</p>
        </div>

        <div className="saas-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Global API Keys</span>
            <KeyRound className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">{overview?.totalApiKeys || 0}</p>
          <p className="text-[11px] text-slate-400">Active and disabled keys</p>
        </div>

        <div className="saas-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Global Generations</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{overview?.totalGenerations || 0}</p>
          <p className="text-[11px] text-slate-400">Articles & posts produced</p>
        </div>

        <div className="saas-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total API Invocations</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{overview?.totalApiRequests || 0}</p>
          <p className="text-[11px] text-emerald-400">API gateway traffic</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1e293b] pb-2">
        {[
          { id: 'users', label: 'Users Directory' },
          { id: 'keys', label: 'All API Keys' },
          { id: 'errors', label: 'Recent System Errors' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-brand-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-[#131e36]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'users' && (
        <div className="saas-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#090d16]/50 text-slate-400">
                  <th className="py-3 px-4 font-medium">User</th>
                  <th className="py-3 px-4 font-medium">Role</th>
                  <th className="py-3 px-4 font-medium">API Keys</th>
                  <th className="py-3 px-4 font-medium">Generations</th>
                  <th className="py-3 px-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#131e36]/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{u.full_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'owner' ? 'bg-purple-500/20 text-purple-300' : 'bg-brand-500/20 text-brand-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{u.api_keys_count}</td>
                    <td className="py-3 px-4 font-mono">{u.generations_count}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'keys' && (
        <div className="saas-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#090d16]/50 text-slate-400">
                  <th className="py-3 px-4 font-medium">Owner</th>
                  <th className="py-3 px-4 font-medium">Key Name</th>
                  <th className="py-3 px-4 font-medium">Prefix</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Hourly / Daily</th>
                  <th className="py-3 px-4 font-medium">Requests</th>
                  <th className="py-3 px-4 font-medium text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-[#131e36]/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-white">{k.user_name || 'Admin'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{k.user_email}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{k.name}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400">{k.key_prefix}••••</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        k.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {k.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{k.rate_limit_hour} / {k.rate_limit_day}</td>
                    <td className="py-3 px-4 font-mono">{k.requests_used}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleKey(k.id, k.status)}
                          className="p-1.5 rounded hover:bg-[#1e293b] text-slate-300 hover:text-white"
                          title="Toggle Active/Disable"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400"
                          title="Delete Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'errors' && (
        <div className="saas-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-semibold">Recent API Failures & Throttled Invocations</span>
          </div>

          {(!overview?.recentErrors || overview.recentErrors.length === 0) ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recent error logs recorded.</p>
          ) : (
            <div className="space-y-2">
              {overview.recentErrors.map((err: any) => (
                <div key={err.id} className="p-3 rounded-lg bg-[#090d16] border border-red-500/20 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-red-400 font-bold">Status {err.status_code} · {err.endpoint}</span>
                    <span className="text-slate-500 text-[11px] font-mono">{err.request_id}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{err.error_message || 'Client or validation exception'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
