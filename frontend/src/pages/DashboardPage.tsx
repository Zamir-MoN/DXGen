import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Clock,
  TrendingUp,
  FileText,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { api } from '../services/api.js';
import { UsageMetrics, GeneratedContent } from '../types/index.js';
import { animatePageIn, animateCardsIn } from '../animations/gsapTransitions.js';

export const DashboardPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [recentGenerations, setRecentGenerations] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    animatePageIn(containerRef.current);

    const fetchData = async () => {
      try {
        const [usageRes, contentRes] = await Promise.all([
          api.get('/usage'),
          api.get('/content?limit=5')
        ]);
        setMetrics(usageRes.data.data);
        setRecentGenerations(contentRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      animateCardsIn('.metric-card');
    }
  }, [loading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600/20 via-[#0f172a] to-purple-600/10 border border-[#1e293b] p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-xs font-semibold text-brand-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Multi-Channel Content Acceleration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Generate high-converting content with Gemini AI
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Create publication-ready blogs, landing pages, social posts, and local business updates tailored to your brand voice — or integrate via our developer REST API.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/generate"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Content</span>
            </Link>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e293b] text-slate-200 text-sm font-semibold hover:bg-[#334155] border border-[#334155] transition-colors"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Integrate REST API</span>
            </Link>
          </div>
        </div>

        {/* Ambient decorative graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-brand-500/10 to-transparent pointer-events-none hidden md:block" />
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Generations */}
        <div className="metric-card saas-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Generations</span>
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? '...' : metrics?.totalGenerations || 0}</p>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>High quality content assets</span>
          </div>
        </div>

        {/* Card 2: API Requests */}
        <div className="metric-card saas-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">API Requests</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? '...' : metrics?.requestsThisMonth || 0}</p>
          <p className="text-[11px] text-slate-400">{metrics?.requestsToday || 0} calls today</p>
        </div>

        {/* Card 3: Tokens Consumed */}
        <div className="metric-card saas-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Token Usage</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {loading ? '...' : (metrics?.totalTokensThisMonth || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">Tokens this month</p>
        </div>

        {/* Card 4: Avg Generation Time */}
        <div className="metric-card saas-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Avg Latency</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {loading ? '...' : `${(metrics?.averageLatencyMs || 650) / 1000}s`}
          </p>
          <p className="text-[11px] text-emerald-400">Sub-second generation</p>
        </div>

        {/* Card 5: Success Rate */}
        <div className="metric-card saas-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Reliability Rate</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {loading ? '...' : metrics && (metrics.successfulRequests + metrics.failedRequests > 0)
              ? `${Math.round((metrics.successfulRequests / (metrics.successfulRequests + metrics.failedRequests)) * 100)}%`
              : '99.8%'}
          </p>
          <p className="text-[11px] text-slate-400">Zero downtime target</p>
        </div>
      </div>

      {/* Recent Generations & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Generations Table */}
        <div className="lg:col-span-2 saas-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Recent Content Generations</h3>
              <p className="text-xs text-slate-400">Your latest articles, landing pages, and social copy</p>
            </div>
            <Link
              to="/history"
              className="text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading recent content...</div>
          ) : recentGenerations.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No content generated yet.</p>
              <Link
                to="/generate"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
              >
                Create your first generation
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e293b] text-slate-400">
                    <th className="pb-3 font-medium">Topic / Title</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Platform</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {recentGenerations.map((gen) => (
                    <tr key={gen.id} className="hover:bg-[#131e36]/60 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-white truncate max-w-xs">{gen.title || gen.topic}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-xs">{gen.topic}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 rounded bg-[#1e293b] text-slate-300 font-mono text-[11px]">
                          {gen.content_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="capitalize text-slate-400">{gen.platform}</span>
                      </td>
                      <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">
                        {new Date(gen.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleCopy(gen.body, gen.id)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded transition-colors inline-flex items-center gap-1"
                          title="Copy body"
                        >
                          {copiedId === gen.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Platform Breakdown & Developer Card */}
        <div className="space-y-6">
          {/* Quick API Key Card */}
          <div className="saas-card p-6 space-y-4 bg-gradient-to-br from-[#0f172a] to-[#131f38] border-[#1e293b]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">Developer API</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <h4 className="text-base font-semibold text-white">Integrate AI into your stack</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use your API key to generate SEO blogs, social media posts, and product copy directly from your CI/CD, CMS, or mobile apps.
            </p>
            <div className="bg-[#090d16] p-2.5 rounded border border-[#1e293b] font-mono text-[11px] text-slate-400 truncate">
              curl -X POST https://dxgen.ai/api/v1/generate
            </div>
            <div className="pt-1 flex gap-2">
              <Link
                to="/api-keys"
                className="flex-1 text-center py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
              >
                Manage API Keys
              </Link>
              <Link
                to="/docs"
                className="px-3 py-2 rounded-lg bg-[#1e293b] text-slate-300 text-xs font-semibold hover:bg-[#334155] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="saas-card p-6 space-y-3">
            <h4 className="text-sm font-semibold text-white">Quick Shortcuts</h4>
            <div className="space-y-2 text-xs">
              <Link to="/generate?type=seo_blog_article" className="flex items-center justify-between p-2 rounded hover:bg-[#131e36] text-slate-300 hover:text-white transition-colors">
                <span>Write SEO Long-Form Article</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
              <Link to="/generate?platform=instagram" className="flex items-center justify-between p-2 rounded hover:bg-[#131e36] text-slate-300 hover:text-white transition-colors">
                <span>Create Instagram Post & Hashtags</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
              <Link to="/profiles" className="flex items-center justify-between p-2 rounded hover:bg-[#131e36] text-slate-300 hover:text-white transition-colors">
                <span>Configure Business Brand Voice</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
