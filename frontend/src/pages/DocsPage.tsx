import React, { useState, useEffect, useRef } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  Zap,
  Terminal,
  Play,
  Shield,
  Clock,
  Code2
} from 'lucide-react';
import { api } from '../services/api.js';
import { animatePageIn } from '../animations/gsapTransitions.js';

export const DocsPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLang, setSelectedLang] = useState<'curl' | 'js' | 'python' | 'php' | 'nodejs'>('curl');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  // Try-it-out tester
  const [testEndpoint, setTestEndpoint] = useState('/api/v1/generate');
  const [testApiKey, setTestApiKey] = useState('dxt_live_demo1234567890abcdef');
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    topic: "Best CRM for SaaS startups in 2026",
    contentType: "seo_blog_article",
    platform: "website",
    tone: "professional",
    length: "short"
  }, null, 2));
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    animatePageIn(containerRef.current);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleExecuteTest = async () => {
    setTesting(true);
    setTestResponse(null);
    try {
      let parsed;
      try {
        parsed = JSON.parse(testPayload);
      } catch {
        throw new Error('Invalid JSON in request payload.');
      }

      const res = await api.post(testEndpoint, parsed, {
        headers: {
          'Authorization': `Bearer ${testApiKey.trim()}`
        }
      });
      setTestResponse(JSON.stringify(res.data, null, 2));
    } catch (err: any) {
      setTestResponse(JSON.stringify({
        success: false,
        error: {
          message: err.message
        }
      }, null, 2));
    } finally {
      setTesting(false);
    }
  };

  const codeSnippets: Record<string, string> = {
    curl: `curl -X POST https://yourdomain.com/api/v1/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "topic": "Best skincare routine for oily skin",
    "contentType": "seo_blog_article",
    "platform": "website",
    "tone": "educational",
    "length": 1200,
    "language": "English",
    "keywords": ["oily skin", "skincare routine"]
  }'`,

    js: `const response = await fetch('https://yourdomain.com/api/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    topic: 'Best skincare routine for oily skin',
    contentType: 'seo_blog_article',
    platform: 'website',
    tone: 'educational',
    length: 1200,
    language: 'English',
    keywords: ['oily skin', 'skincare routine']
  })
});

const data = await response.json();
console.log(data.content.title, data.content.body);`,

    nodejs: `import axios from 'axios';

const { data } = await axios.post('https://yourdomain.com/api/v1/generate', {
  topic: 'Best skincare routine for oily skin',
  contentType: 'seo_blog_article',
  platform: 'website',
  tone: 'educational',
  length: 1200,
  keywords: ['oily skin', 'skincare routine']
}, {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

console.log(data.content);`,

    python: `import requests

url = "https://yourdomain.com/api/v1/generate"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "topic": "Best skincare routine for oily skin",
    "contentType": "seo_blog_article",
    "platform": "website",
    "tone": "educational",
    "length": 1200,
    "keywords": ["oily skin", "skincare routine"]
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print(data["content"]["title"])`,

    php: `<?php
$ch = curl_init('https://yourdomain.com/api/v1/generate');
$payload = json_encode([
    'topic' => 'Best skincare routine for oily skin',
    'contentType' => 'seo_blog_article',
    'platform' => 'website',
    'tone' => 'educational',
    'length' => 1200
]);

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ]
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`
  };

  return (
    <div ref={containerRef} className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#1e293b] pb-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 font-mono text-xs font-semibold border border-brand-500/20">v1.0.0</span>
          <span className="text-xs text-slate-500">Public REST API Specification</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">DXGen Developer API</h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Integrate AI content generation into your CMS, marketing bots, mobile apps, or internal tools. The same robust generation engine that powers the dashboard is available programmatically.
        </p>
      </div>

      {/* Authentication Section */}
      <div className="saas-card p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-400" />
          <h3 className="text-base font-semibold text-white">Authentication</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          All requests to the DXGen Public API require a Bearer token in the <code className="text-cyan-400 font-mono">Authorization</code> HTTP header.
        </p>
        <div className="bg-[#090d16] p-3 rounded-lg border border-[#1e293b] font-mono text-xs text-cyan-300 flex items-center justify-between">
          <span>Authorization: Bearer dxt_live_xxxxxxxxxxxxxxxxxxxxxxxxx</span>
          <button
            onClick={() => handleCopy('Authorization: Bearer dxt_live_xxxxxxxxxxxxxxxxxxxxxxxxx', 'auth')}
            className="text-slate-400 hover:text-white"
          >
            {copiedTab === 'auth' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Code Examples Tabs */}
      <div className="saas-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e293b] bg-[#090d16]/70">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white">Example Generation Request</span>
          </div>

          <div className="flex rounded-lg bg-[#0f172a] p-1 border border-[#1e293b] text-xs font-mono">
            {(['curl', 'js', 'nodejs', 'python', 'php'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-2.5 py-1 rounded capitalize transition-colors ${
                  selectedLang === lang ? 'bg-brand-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <pre className="p-5 font-mono text-xs text-slate-200 bg-[#090d16] overflow-x-auto leading-relaxed selection:bg-brand-500 selection:text-white">
            {codeSnippets[selectedLang]}
          </pre>
          <button
            onClick={() => handleCopy(codeSnippets[selectedLang], 'snippet')}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1e293b] hover:bg-[#334155] text-slate-300 text-xs font-medium transition-colors"
          >
            {copiedTab === 'snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedTab === 'snippet' ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Endpoints Reference Table */}
      <div className="saas-card p-6 space-y-4">
        <h3 className="text-base font-semibold text-white">Available Endpoints</h3>
        <div className="space-y-2 text-xs">
          {[
            { method: 'POST', path: '/api/v1/generate', desc: 'Universal AI content generator (blogs, social, landing pages)' },
            { method: 'POST', path: '/api/v1/generate/blog', desc: 'Dedicated SEO blog & article generation endpoint' },
            { method: 'POST', path: '/api/v1/generate/social', desc: 'Optimized social captions & hashtags generation' },
            { method: 'POST', path: '/api/v1/generate/business', desc: 'Google Business Profile & local announcements' },
            { method: 'GET', path: '/api/v1/content/:id', desc: 'Retrieve previously generated content asset by ID' },
            { method: 'GET', path: '/api/v1/usage', desc: 'Check your API request and token consumption statistics' },
            { method: 'GET', path: '/api/v1/models', desc: 'List active and available Gemini AI models' },
            { method: 'GET', path: '/api/v1/health', desc: 'System liveness, readiness, and Gemini connectivity probe' }
          ].map((ep) => (
            <div key={ep.path + ep.method} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[#090d16] border border-[#1e293b] gap-2">
              <div className="flex items-center gap-2.5">
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                  ep.method === 'POST' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {ep.method}
                </span>
                <span className="font-mono text-white text-xs">{ep.path}</span>
              </div>
              <span className="text-slate-400 text-[11px]">{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Try-It-Out Playground */}
      <div className="saas-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">Interactive API Console</h3>
          </div>
          <span className="text-xs text-slate-400">Test live requests right from your browser</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Target Endpoint</label>
            <select
              value={testEndpoint}
              onChange={(e) => setTestEndpoint(e.target.value)}
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white font-mono"
            >
              <option value="/api/v1/generate">POST /api/v1/generate</option>
              <option value="/api/v1/generate/blog">POST /api/v1/generate/blog</option>
              <option value="/api/v1/generate/social">POST /api/v1/generate/social</option>
              <option value="/api/v1/generate/business">POST /api/v1/generate/business</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">API Key</label>
            <input
              type="text"
              value={testApiKey}
              onChange={(e) => setTestApiKey(e.target.value)}
              placeholder="dxt_live_..."
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-cyan-300 font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="font-semibold text-slate-300">JSON Request Body</label>
          <textarea
            rows={6}
            value={testPayload}
            onChange={(e) => setTestPayload(e.target.value)}
            className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-3 font-mono text-slate-200 outline-none"
          />
        </div>

        <button
          onClick={handleExecuteTest}
          disabled={testing}
          className="px-5 py-2.5 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{testing ? 'Executing request...' : 'Send Live Request'}</span>
        </button>

        {testResponse && (
          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Response Payload</span>
            <pre className="p-4 rounded-lg bg-[#090d16] border border-[#1e293b] font-mono text-xs text-slate-200 overflow-x-auto max-h-[300px]">
              {testResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
