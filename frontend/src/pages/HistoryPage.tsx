import React, { useState, useEffect, useRef } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  Copy,
  Check,
  Eye,
  Download,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api.js';
import { GeneratedContent } from '../types/index.js';
import { Modal } from '../components/Modal.js';
import { animatePageIn } from '../animations/gsapTransitions.js';

export const HistoryPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal
  const [activeItem, setActiveItem] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '15');
      if (search) params.append('search', search);
      if (selectedType) params.append('type', selectedType);
      if (selectedPlatform) params.append('platform', selectedPlatform);

      const res = await api.get(`/content?${params.toString()}`);
      setItems(res.data.data);
      setTotalPages(res.data.pagination.totalPages || 1);
    } catch (err) {
      console.error('Failed to load content history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    animatePageIn(containerRef.current);
    fetchHistory();
  }, [page, selectedType, selectedPlatform]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this generated content?')) return;
    try {
      await api.delete(`/content/${id}`);
      setItems(items.filter(item => item.id !== id));
      if (activeItem?.id === id) setActiveItem(null);
    } catch (err) {
      alert('Failed to delete content');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-brand-400" />
            <span>Content History</span>
          </h2>
          <p className="text-xs text-slate-400">Search, view, copy, or export your saved AI generated content.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by topic or title..."
            className="w-full pl-9 pr-4 py-2 bg-[#0f172a] border border-[#1e293b] rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-brand-500"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
          className="bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white outline-none capitalize"
        >
          <option value="">All Content Types</option>
          <option value="seo_blog_article">SEO Blog Article</option>
          <option value="instagram_caption">Instagram Caption</option>
          <option value="promotional_content">Promotional Copy</option>
          <option value="landing_page_copy">Landing Page Copy</option>
          <option value="google_business_profile_post">Google Business Profile</option>
          <option value="email">Email</option>
        </select>

        <select
          value={selectedPlatform}
          onChange={(e) => { setSelectedPlatform(e.target.value); setPage(1); }}
          className="bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white outline-none capitalize"
        >
          <option value="">All Platforms</option>
          <option value="website">Website / Blog</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="linkedin">LinkedIn</option>
          <option value="twitter">X / Twitter</option>
          <option value="google_business">Google Business</option>
          <option value="email">Email</option>
        </select>
      </form>

      {/* Content Table */}
      <div className="saas-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">Loading history...</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <History className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">No content records found matching filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#090d16]/50 text-slate-400">
                  <th className="py-3 px-4 font-medium">Topic / Title</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Platform</th>
                  <th className="py-3 px-4 font-medium">Model</th>
                  <th className="py-3 px-4 font-medium">Created</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setActiveItem(item)}
                    className="hover:bg-[#131e36]/70 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 max-w-sm">
                      <p className="font-semibold text-white truncate">{item.title || item.topic}</p>
                      <p className="text-[11px] text-slate-500 truncate">{item.topic}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[#131e36] text-slate-300 font-mono text-[11px]">
                        {item.content_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-400 whitespace-nowrap">{item.platform}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">{item.model}</td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveItem(item)}
                          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#1e293b]"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopy(item.body)}
                          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#1e293b]"
                          title="Copy Body"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-red-500/10"
                          title="Delete"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e293b] text-xs text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 rounded bg-[#1e293b] disabled:opacity-40 hover:bg-[#334155] text-white"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded bg-[#1e293b] disabled:opacity-40 hover:bg-[#334155] text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Item Inspection Modal */}
      {activeItem && (
        <Modal
          isOpen={!!activeItem}
          onClose={() => setActiveItem(null)}
          title={activeItem.title || activeItem.topic}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-[#090d16] border border-[#1e293b] text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-500">Topic:</span>
                <p className="font-semibold text-white">{activeItem.topic}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono text-[11px]">
                  {activeItem.content_type}
                </span>
                <span className="capitalize text-slate-400">{activeItem.platform}</span>
              </div>
            </div>

            {/* SEO Meta if exists */}
            {activeItem.meta_title && (
              <div className="p-3 rounded-lg bg-[#090d16] border border-[#1e293b] text-xs space-y-1">
                <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold">SEO Metadata</span>
                <p className="text-cyan-300 font-medium">{activeItem.meta_title}</p>
                <p className="text-slate-400">{activeItem.meta_description}</p>
                {activeItem.slug && <p className="text-emerald-400 font-mono text-[11px]">Slug: /{activeItem.slug}</p>}
              </div>
            )}

            {/* Body */}
            <div className="p-4 rounded-lg bg-[#090d16] border border-[#1e293b] max-h-[350px] overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {activeItem.body}
            </div>

            {activeItem.cta && (
              <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/30 text-xs">
                <span className="text-[10px] uppercase text-brand-400 font-bold">Call To Action</span>
                <p className="text-slate-200 mt-0.5">{activeItem.cta}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => handleDelete(activeItem.id)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(activeItem.body)}
                  className="px-4 py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Content'}</span>
                </button>
                <button
                  onClick={() => setActiveItem(null)}
                  className="px-4 py-2 rounded-lg bg-[#1e293b] text-slate-300 text-xs font-semibold hover:bg-[#334155] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
