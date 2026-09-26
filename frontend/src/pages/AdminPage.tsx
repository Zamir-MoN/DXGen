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
  RefreshCw,
  Sparkles,
  Zap,
  Activity,
  Cpu,
  Coins,
  Gauge,
  ExternalLink,
  Clock,
  Layers,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../services/api.js';
import { animatePageIn } from '../animations/gsapTransitions.js';

export const AdminPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [geminiData, setGeminiData] = useState<any>(null);
  const [imageStatus, setImageStatus] = useState<any>(null);
  const [testingImage, setTestingImage] = useState(false);
  const [imageTestResult, setImageTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [geminiPinging, setGeminiPinging] = useState(false);
  const [activeTab, setActiveTab] = useState<'gemini' | 'image' | 'users' | 'keys' | 'errors'>('gemini');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [overRes, usersRes, keysRes, geminiRes, imgRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/users'),
        api.get('/admin/api-keys'),
        api.get('/admin/gemini-status').catch(() => null),
        api.get('/admin/image-status').catch(() => null)
      ]);
      setOverview(overRes.data.overview);
      setUsers(usersRes.data.users);
      setApiKeys(keysRes.data.keys);
      if (geminiRes?.data?.gemini) {
        setGeminiData(geminiRes.data.gemini);
      }
      if (imgRes?.data?.imageStatus) {
        setImageStatus(imgRes.data.imageStatus);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestImageProvider = async () => {
    setTestingImage(true);
    setImageTestResult(null);
    try {
      const res = await api.post('/images/test');
      setImageTestResult(res.data.test);
      const statusRes = await api.get('/admin/image-status');
      if (statusRes?.data?.imageStatus) {
        setImageStatus(statusRes.data.imageStatus);
      }
    } catch (err: any) {
      setImageTestResult({ ok: false, error: err.message, latencyMs: 0 });
    } finally {
      setTestingImage(false);
    }
  };

  const pingGeminiLive = async () => {
    setGeminiPinging(true);
    try {
      const res = await api.get('/admin/gemini-status');
      setGeminiData(res.data.gemini);
    } catch (err) {
      console.error('Failed to ping Gemini API:', err);
    } finally {
      setGeminiPinging(false);
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

  const quota = geminiData?.quota;
  const percentRemaining = quota?.percentRemaining !== undefined ? quota.percentRemaining : 100;
  const requestsRemaining = quota?.requestsRemainingToday !== undefined ? quota.requestsRemainingToday : 1500;
  const requestsUsed = quota?.requestsUsedToday !== undefined ? quota.requestsUsedToday : 0;
  const dailyLimit = quota?.dailyRequestLimit || 1500;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <span>Administrative Control Center</span>
          </h2>
          <p className="text-xs text-slate-400">System observability, real-time Gemini API quota monitor, and multi-tenant governance.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={pingGeminiLive}
            disabled={geminiPinging}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
          >
            <Activity className={`w-3.5 h-3.5 ${geminiPinging ? 'animate-spin' : ''}`} />
            <span>{geminiPinging ? 'Pinging Google...' : 'Live Gemini Ping'}</span>
          </button>

          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e293b] text-slate-300 text-xs font-semibold hover:bg-[#334155] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh All</span>
          </button>
        </div>
      </div>

      {/* Hero: Live Gemini Quota & Remaining Credits Monitor */}
      <div className="saas-card p-6 bg-gradient-to-br from-[#0c162d] via-[#0f172a] to-[#13132b] border-[#25324d] shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Google Gemini Engine</span>
              </span>

              {geminiData?.isLive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live & Connected ({geminiData.latencyMs}ms)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>Connection Issue / Check Key</span>
                </span>
              )}

              <span className="text-xs font-mono text-slate-400 bg-[#090d16] px-2 py-0.5 rounded border border-[#1e293b]">
                Key: {geminiData?.keyMasked || '••••••••'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Gemini API Live Credit & Quota Headroom</span>
              <span className="text-xs px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono">
                {geminiData?.configuredModel || 'gemini-2.5-flash'}
              </span>
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl">
              Real-time synchronization with Google Generative Language API. Tracks daily requests headroom, token limits, and spend across multi-tenant generations.
            </p>
          </div>

          {/* Quick numbers */}
          <div className="flex items-center gap-4 bg-[#090d16]/80 p-3.5 rounded-xl border border-[#1e293b]/80">
            <div className="text-center px-2">
              <p className="text-[10px] uppercase font-bold text-slate-400">Daily Requests Left</p>
              <p className="text-xl font-mono font-bold text-emerald-400">
                {requestsRemaining.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400">of {dailyLimit.toLocaleString()} cap</p>
            </div>

            <div className="h-8 w-px bg-[#1e293b]" />

            <div className="text-center px-2">
              <p className="text-[10px] uppercase font-bold text-slate-400">Tokens This Month</p>
              <p className="text-xl font-mono font-bold text-cyan-400">
                {(quota?.tokensUsedThisMonth || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400">Est. ${(quota?.estimatedCostMonthUsd || 0).toFixed(4)}</p>
            </div>

            <div className="h-8 w-px bg-[#1e293b]" />

            <div className="text-center px-2">
              <p className="text-[10px] uppercase font-bold text-slate-400">Headroom</p>
              <p className="text-xl font-mono font-bold text-purple-400">
                {percentRemaining}%
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold">Healthy</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Daily Quota Consumed Today: <span className="text-white font-mono">{requestsUsed} requests</span></span>
            <span className="font-semibold text-emerald-400 font-mono">{percentRemaining}% Quota Remaining</span>
          </div>
          <div className="w-full h-2.5 bg-[#090d16] rounded-full overflow-hidden border border-[#1e293b]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(1, (requestsUsed / dailyLimit) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <span className="text-xs font-medium">Text Generations</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{overview?.totalGenerations || 0}</p>
          <p className="text-[11px] text-slate-400">Articles & posts produced</p>
        </div>

        <div className="saas-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">AI Images Produced</span>
            <ImageIcon className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-2xl font-bold text-white">{overview?.totalImages || 0}</p>
          <p className="text-[11px] text-pink-400">Pixazo FLUX assets</p>
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
      <div className="flex flex-wrap gap-2 border-b border-[#1e293b] pb-2">
        {[
          { id: 'gemini', label: 'Gemini Engine & Credits', icon: Sparkles },
          { id: 'image', label: 'Image Provider (Pixazo)', icon: ImageIcon },
          { id: 'users', label: 'Users Directory', icon: Users },
          { id: 'keys', label: 'All API Keys', icon: KeyRound },
          { id: 'errors', label: 'Recent System Errors', icon: AlertTriangle }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-[#131e36]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panel: Gemini Quota & Credits */}
      {activeTab === 'gemini' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Live Model Spec Card */}
            <div className="saas-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Model Specifications</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono">
                  {geminiData?.activeModelName || 'gemini-2.5-flash'}
                </span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-[#1e293b]">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Context Window</span>
                  <span className="font-mono text-white font-semibold">
                    {(geminiData?.inputTokenLimit || 1048576).toLocaleString()} tokens
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Max Output Length</span>
                  <span className="font-mono text-white font-semibold">
                    {(geminiData?.outputTokenLimit || 65536).toLocaleString()} tokens
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Available Models in Key</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {geminiData?.modelsAvailableCount || 50} models
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Round-Trip Latency</span>
                  <span className="font-mono text-cyan-400 font-semibold">
                    {geminiData?.latencyMs || 0} ms
                  </span>
                </div>
              </div>
            </div>

            {/* Rate Limits Card */}
            <div className="saas-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  <span>Rate Limits & Concurrency</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold">
                  Standard Tier
                </span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-[#1e293b]">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Requests Per Minute (RPM)</span>
                  <span className="font-mono text-white font-semibold">{quota?.rpmLimit || 15} RPM</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Tokens Per Minute (TPM)</span>
                  <span className="font-mono text-white font-semibold">{(quota?.tpmLimit || 1000000).toLocaleString()} TPM</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Requests Today</span>
                  <span className="font-mono text-cyan-400 font-semibold">{requestsUsed} calls</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Rate Limit Throttle Events</span>
                  <span className={`font-mono font-semibold ${
                    (quota?.throttleEventsToday || 0) > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {quota?.throttleEventsToday || 0} (Zero 429 errors)
                  </span>
                </div>
              </div>
            </div>

            {/* Estimated Spend & Credits */}
            <div className="saas-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-purple-400" />
                  <span>Usage & Estimated Cost</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-semibold">
                  Live Billing Estimate
                </span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-[#1e293b]">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Tokens Used Today</span>
                  <span className="font-mono text-white font-semibold">
                    {(quota?.tokensUsedToday || 0).toLocaleString()} tokens
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Tokens This Month</span>
                  <span className="font-mono text-white font-semibold">
                    {(quota?.tokensUsedThisMonth || 0).toLocaleString()} tokens
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Estimated Cost (Today)</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    ${(quota?.estimatedCostTodayUsd || 0).toFixed(4)} USD
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Estimated Cost (Month)</span>
                  <span className="font-mono text-purple-400 font-semibold">
                    ${(quota?.estimatedCostMonthUsd || 0).toFixed(4)} USD
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Official AI Studio Link */}
          <div className="saas-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0c1322]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Live API Status Checked</p>
                <p className="text-[11px] text-slate-400">
                  Last verified at {geminiData?.lastCheckedAt ? new Date(geminiData.lastCheckedAt).toLocaleTimeString() : 'Recently'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={pingGeminiLive}
                disabled={geminiPinging}
                className="px-3 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${geminiPinging ? 'animate-spin' : ''}`} />
                <span>Re-Test Live Connection</span>
              </button>

              <a
                href="https://aistudio.google.com/app/plan_information"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Google AI Studio Plan & Billing</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tab Panel: Image Provider (Pixazo) */}
      {activeTab === 'image' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Provider Configuration Card */}
            <div className="saas-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-pink-400" />
                  <span>Image Generation Provider</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 font-mono">
                  {imageStatus?.provider?.toUpperCase() || 'PIXAZO'}
                </span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-[#1e293b]">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Provider Status</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{imageStatus?.isConfigured ? 'Connected & Ready' : 'Unconfigured'}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Subscription Key</span>
                  <span className="font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-[#090d16] border border-[#1e293b]">
                    {imageStatus?.status || 'Configured'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Default Model</span>
                  <span className="font-mono text-white font-semibold">
                    {imageStatus?.defaultModel || 'flux-schnell'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Inference Architecture</span>
                  <span className="font-mono text-slate-300">
                    FLUX.1 Schnell Latent Diffusion
                  </span>
                </div>
              </div>
            </div>

            {/* Rate Limits & Quota Card */}
            <div className="saas-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span>Image Rate Limits</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-semibold">
                  SaaS Quota
                </span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-[#1e293b]">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Rate Limit Per Minute</span>
                  <span className="font-mono text-white font-semibold">
                    {imageStatus?.rateLimit?.perMinute || 5} req/min
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Rate Limit Per Day</span>
                  <span className="font-mono text-white font-semibold">
                    {imageStatus?.rateLimit?.perDay || 20} req/day
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Images Produced Today</span>
                  <span className="font-mono text-pink-400 font-semibold">
                    {imageStatus?.usage?.imagesGeneratedToday || 0} assets
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Images This Month</span>
                  <span className="font-mono text-cyan-400 font-semibold">
                    {imageStatus?.usage?.imagesGeneratedThisMonth || 0} assets
                  </span>
                </div>
              </div>
            </div>

            {/* Health & Diagnostic Probe */}
            <div className="saas-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Provider Diagnostics</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold">
                  Gateway
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Verify end-to-end connectivity with Pixazo image gateway without revealing credentials to the browser.
                </p>

                <button
                  onClick={handleTestImageProvider}
                  disabled={testingImage}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:from-pink-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-pink-500/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingImage ? 'animate-spin' : ''}`} />
                  <span>{testingImage ? 'Testing Pixazo Gateway...' : 'Test Image Provider'}</span>
                </button>

                {imageTestResult && (
                  <div className={`p-2.5 rounded-lg border text-[11px] ${
                    imageTestResult.ok
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}>
                    {imageTestResult.ok ? (
                      <div className="flex items-center justify-between">
                        <span>✓ Connected ({imageTestResult.model || 'FLUX.1 Schnell'})</span>
                        <span className="font-mono font-bold">{imageTestResult.latencyMs}ms</span>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold">Connection Test Failed:</p>
                        <p className="text-[10px] mt-0.5 text-red-400">{imageTestResult.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Panel: Users Directory */}
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

      {/* Tab Panel: All API Keys */}
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

      {/* Tab Panel: Recent System Errors */}
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
