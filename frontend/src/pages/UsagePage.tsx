import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  Clock,
  Zap,
  Layers,
  CheckCircle2,
  XCircle,
  Activity,
  Terminal,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api.js';
import { UsageMetrics, RequestLog } from '../types/index.js';
import { animatePageIn } from '../animations/gsapTransitions.js';

export const UsagePage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      const [metricsRes, logsRes] = await Promise.all([
        api.get('/usage'),
        api.get('/usage/logs?limit=50')
      ]);
      setMetrics(metricsRes.data.data);
      setLogs(logsRes.data.logs);
    } catch (err) {
      console.error('Failed to load usage data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    animatePageIn(containerRef.current);
    fetchUsageData();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            <span>Usage & Observability</span>
          </h2>
          <p className="text-xs text-slate-400">Monitor API telemetry, token consumption, latency, and live request streams.</p>
        </div>

        <button
          onClick={fetchUsageData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e293b] text-slate-300 text-xs font-semibold hover:bg-[#334155] border border-[#334155] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="saas-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Requests Today</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">{metrics?.requestsToday || 0}</p>
          <p className="text-[11px] text-slate-400">{metrics?.requestsThisMonth || 0} total this month</p>
        </div>

        <div className="saas-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Token Consumption</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{(metrics?.totalTokensThisMonth || 0).toLocaleString()}</p>
          <p className="text-[11px] text-purple-400">Input & Output tokens aggregated</p>
        </div>

        <div className="saas-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Average Latency</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{metrics?.averageLatencyMs || 0} ms</p>
          <p className="text-[11px] text-emerald-400">High throughput Gemini model</p>
        </div>

        <div className="saas-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Success / Error Split</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            <span className="text-emerald-400">{metrics?.successfulRequests || 0}</span>
            <span className="text-slate-500 text-lg mx-1.5">/</span>
            <span className="text-red-400">{metrics?.failedRequests || 0}</span>
          </p>
          <p className="text-[11px] text-slate-400">2xx vs 4xx/5xx responses</p>
        </div>
      </div>

      {/* Live Request Stream Table */}
      <div className="saas-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Live API Request Stream</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Last 50 requests</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">Streaming logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">No API request logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#090d16]/50 text-slate-400">
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">Method & Endpoint</th>
                  <th className="py-2.5 px-4 font-medium">Latency</th>
                  <th className="py-2.5 px-4 font-medium">Tokens</th>
                  <th className="py-2.5 px-4 font-medium">Request ID</th>
                  <th className="py-2.5 px-4 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {logs.map((log) => {
                  const isOk = log.status_code >= 200 && log.status_code < 400;
                  return (
                    <tr key={log.id} className="hover:bg-[#131e36]/70 transition-colors">
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                          isOk ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {isOk ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{log.status_code}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap font-sans text-white">
                        <span className="font-mono text-cyan-400 mr-2 text-[11px]">{log.method}</span>
                        <span>{log.endpoint}</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                        {log.response_time_ms}ms
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                        {(log.input_tokens + log.output_tokens) > 0 ? `${log.input_tokens + log.output_tokens} tok` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {log.request_id}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
