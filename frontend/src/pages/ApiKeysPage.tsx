import React, { useState, useEffect, useRef } from 'react';
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  ShieldAlert,
  Trash2,
  Power,
  Zap,
  Info
} from 'lucide-react';
import { api } from '../services/api.js';
import { ApiKey } from '../types/index.js';
import { Modal } from '../components/Modal.js';
import { animatePageIn } from '../animations/gsapTransitions.js';

export const ApiKeysPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Key Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [environment, setEnvironment] = useState<'live' | 'test'>('live');
  const [rateLimitHour, setRateLimitHour] = useState('100');
  const [rateLimitDay, setRateLimitDay] = useState('1000');
  const [creating, setCreating] = useState(false);

  // Reveal Key Modal (Shown ONLY ONCE upon creation)
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await api.get('/api-keys');
      setKeys(res.data.keys);
    } catch (err) {
      console.error('Failed to load API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    animatePageIn(containerRef.current);
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      const res = await api.post('/api-keys', {
        name: newKeyName.trim(),
        environment,
        rateLimitHour: parseInt(rateLimitHour, 10) || 100,
        rateLimitDay: parseInt(rateLimitDay, 10) || 1000
      });

      setCreateModalOpen(false);
      setRevealedKey(res.data.apiKey.rawKey);
      setNewKeyName('');
      fetchKeys();
    } catch (err: any) {
      alert(err.message || 'Failed to generate API key');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (key: ApiKey) => {
    const newStatus = key.status === 'active' ? 'disabled' : 'active';
    try {
      await api.patch(`/api-keys/${key.id}`, { status: newStatus });
      setKeys(keys.map(k => k.id === key.id ? { ...k, status: newStatus } : k));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently revoke and delete this API key? This action is irreversible.')) return;
    try {
      await api.delete(`/api-keys/${id}`);
      setKeys(keys.filter(k => k.id !== id));
    } catch (err) {
      alert('Failed to delete key');
    }
  };

  const handleCopyRawKey = () => {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand-400" />
            <span>API Keys & Authentication</span>
          </h2>
          <p className="text-xs text-slate-400">
            Generate and manage API keys to integrate DXGen content generation directly into your products.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create New API Key</span>
        </button>
      </div>

      {/* Security Info Card */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">Production Security Best Practice</p>
          <p className="text-slate-400 leading-relaxed">
            Your secret API keys are hashed with SHA-256 before storage. Never expose API keys in frontend browser bundles or client apps. Always authenticate your requests through your secure backend proxy via the <code className="text-cyan-400 font-mono">Authorization: Bearer dxt_live_...</code> header.
          </p>
        </div>
      </div>

      {/* Keys Table */}
      <div className="saas-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <KeyRound className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">No active API keys found.</p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
            >
              Create your first API key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#090d16]/50 text-slate-400">
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Key Prefix</th>
                  <th className="py-3 px-4 font-medium">Env</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Rate Limits</th>
                  <th className="py-3 px-4 font-medium">Requests Used</th>
                  <th className="py-3 px-4 font-medium">Last Used</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-[#131e36]/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{k.name}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400">
                      {k.key_prefix}••••••••••••
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        k.environment === 'live' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {k.environment}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        k.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${k.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className="capitalize">{k.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {k.rate_limit_hour}/hr · {k.rate_limit_day}/day
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono font-medium">
                      {k.requests_used}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(k)}
                          className={`p-1.5 rounded hover:bg-[#1e293b] ${
                            k.status === 'active' ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'
                          }`}
                          title={k.status === 'active' ? 'Disable Key' : 'Enable Key'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(k.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-red-500/10"
                          title="Revoke and Delete"
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
        )}
      </div>

      {/* Create Key Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Generate New API Key"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200">Key Name</label>
            <input
              type="text"
              required
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production Web Backend, Zapier Integration"
              className="w-full bg-[#090d16] border border-[#1e293b] focus:border-brand-500 rounded-lg p-2.5 text-white outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200">Environment</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as 'live' | 'test')}
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none"
            >
              <option value="live">Live (Prefix: dxt_live_)</option>
              <option value="test">Test (Prefix: dxt_test_)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-200">Hourly Limit (req/hr)</label>
              <input
                type="number"
                min="1"
                max="5000"
                value={rateLimitHour}
                onChange={(e) => setRateLimitHour(e.target.value)}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-200">Daily Limit (req/day)</label>
              <input
                type="number"
                min="1"
                max="50000"
                value={rateLimitDay}
                onChange={(e) => setRateLimitDay(e.target.value)}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#1e293b] text-slate-300 font-semibold hover:bg-[#334155]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !newKeyName.trim()}
              className="px-4 py-2 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 disabled:opacity-50"
            >
              {creating ? 'Generating...' : 'Generate API Key'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reveal Key Modal (Shown ONLY ONCE) */}
      <Modal
        isOpen={!!revealedKey}
        onClose={() => setRevealedKey(null)}
        title="Your API Key is Ready"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-300">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
            <p>
              Please copy your API key and store it securely now. For your security, you will <strong>never</strong> be able to view it again.
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              readOnly
              value={revealedKey || ''}
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-3 pr-24 font-mono text-cyan-300 text-xs outline-none select-all"
            />
            <button
              onClick={handleCopyRawKey}
              className="absolute right-2 top-2 px-3 py-1 rounded bg-brand-500 text-white font-semibold flex items-center gap-1 hover:bg-brand-600"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setRevealedKey(null)}
              className="px-4 py-2 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600"
            >
              I have saved my key
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
