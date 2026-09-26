import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Maximize2,
  Sliders,
  Layers,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.js';
import { ImageGeneration, ImageUsageStats } from '../types/index.js';
import { animatePageIn } from '../animations/gsapTransitions.js';

const STYLES = [
  'Realistic',
  'Commercial Photography',
  'Editorial',
  'Minimal',
  '3D Render',
  'Illustration',
  'Vector',
  'Luxury',
  'Technology',
  'Corporate',
  'Lifestyle',
  'Product Photography',
  'Cinematic',
  'Artistic'
];

const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9 Landscape', desc: 'Hero Blog / Website Banner' },
  { id: '1:1', label: '1:1 Square', desc: 'Social Post / Google Business' },
  { id: '4:5', label: '4:5 Portrait', desc: 'Instagram Feed / Mobile' },
  { id: '9:16', label: '9:16 Story', desc: 'Stories / Reels / TikTok' },
];

const PROMPT_SUGGESTIONS = [
  'Modern luxury workspace with neon accents and minimalist desk setup',
  'Futuristic electric vehicle charging in a high-tech smart city',
  'Artisan barista pouring espresso latte art in a sunlit industrial cafe',
  'Editorial portrait of a confident tech founder in a sleek glass office',
  'Cyberpunk aerial cityscape at dusk with vibrant neon architecture, textless'
];

export const ImagesPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Form states
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('flux-schnell');
  const [style, setStyle] = useState('Commercial Photography');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [negativePrompt, setNegativePrompt] = useState('text, typography, words, letters, watermark, labels, headline, logos');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Action & State
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageGeneration | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Gallery & Usage
  const [history, setHistory] = useState<ImageGeneration[]>([]);
  const [usage, setUsage] = useState<ImageUsageStats | null>(null);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  const fetchHistoryAndUsage = async () => {
    setFetchingHistory(true);
    try {
      const [histRes, usageRes] = await Promise.all([
        api.get('/images?limit=24').catch(() => ({ data: { data: [] } })),
        api.get('/images/usage').catch(() => ({ data: { usage: null } }))
      ]);

      const images = histRes.data.data || [];
      setHistory(images);
      if (images.length > 0 && !selectedImage) {
        setSelectedImage(images[0]);
      }
      setUsage(usageRes.data.usage);
    } catch (err) {
      console.error('Failed to load image history:', err);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    animatePageIn(containerRef.current);
    fetchHistoryAndUsage();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please provide a prompt describing your desired image.');
      return;
    }

    setError(null);
    setLoading(true);
    setLoadingStage('Connecting to Pixazo AI...');

    const stages = [
      'Sending prompt to Pixazo FLUX engine...',
      'Synthesizing photorealistic composition...',
      'Refining textures and ambient lighting...',
      'Normalizing CDN asset delivery...'
    ];

    let stageIdx = 0;
    const interval = setInterval(() => {
      stageIdx = (stageIdx + 1) % stages.length;
      setLoadingStage(stages[stageIdx]);
    }, 3500);

    try {
      const res = await api.post('/images/generate', {
        prompt: prompt.trim(),
        model,
        style,
        aspectRatio,
        negativePrompt: negativePrompt.trim() || undefined
      }, { timeout: 120000 });

      clearInterval(interval);

      if (res.data?.success && res.data?.image) {
        const newImg: ImageGeneration = {
          id: res.data.image.id,
          provider: res.data.image.provider || 'pixazo',
          model: res.data.image.model || model,
          prompt: res.data.image.prompt || prompt,
          style: res.data.image.style || style,
          aspect_ratio: res.data.image.aspectRatio || aspectRatio,
          width: res.data.image.width || 1024,
          height: res.data.image.height || 1024,
          image_url: res.data.image.url,
          status: 'completed',
          generation_time_ms: res.data.usage?.generationTimeMs || 0,
          created_at: new Date().toISOString()
        };

        setSelectedImage(newImg);
        setHistory([newImg, ...history]);
        fetchHistoryAndUsage();
      }
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || 'Image generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownload = async (img: ImageGeneration) => {
    try {
      const response = await fetch(img.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dxgen-${img.model}-${img.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      // Direct window open fallback
      window.open(img.image_url, '_blank');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this image from your history?')) return;
    try {
      await api.delete(`/images/${id}`);
      setHistory(history.filter(i => i.id !== id));
      if (selectedImage?.id === id) {
        const remaining = history.filter(i => i.id !== id);
        setSelectedImage(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err: any) {
      alert('Failed to delete image: ' + err.message);
    }
  };

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Image Studio</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
              Pixazo Powered
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Produce publication-ready commercial imagery, editorial hero assets, and social visuals with sub-second FLUX Schnell generation.
          </p>
        </div>

        {/* Usage Stats Quick Badges */}
        {usage && (
          <div className="flex items-center gap-3 text-xs bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-1.5">
            <div>
              <span className="text-slate-500 block text-[10px]">Today</span>
              <span className="font-semibold text-white font-mono">{usage.imagesGeneratedToday}</span>
            </div>
            <div className="h-6 w-px bg-[#1e293b]" />
            <div>
              <span className="text-slate-500 block text-[10px]">This Month</span>
              <span className="font-semibold text-cyan-400 font-mono">{usage.imagesGeneratedThisMonth}</span>
            </div>
            <div className="h-6 w-px bg-[#1e293b]" />
            <div>
              <span className="text-slate-500 block text-[10px]">Avg Latency</span>
              <span className="font-semibold text-emerald-400 font-mono">{usage.averageGenerationTimeMs ? `${(usage.averageGenerationTimeMs / 1000).toFixed(1)}s` : '1.2s'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Studio Grid: Left Controls (5 cols), Right Preview (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Generator Form */}
        <div className="lg:col-span-5 saas-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <span className="text-xs uppercase font-mono tracking-wider text-brand-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Image Generator
            </span>
            <span className="text-[11px] text-slate-500 font-mono">FLUX.1 Schnell</span>
          </div>

          {/* Prompt Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">Visual Prompt</label>
              <span className="text-[10px] text-slate-500">{prompt.length}/1000</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate in detail..."
              rows={4}
              maxLength={1000}
              className="w-full bg-[#090d16] border border-[#1e293b] focus:border-brand-500 rounded-lg p-3 text-xs text-white placeholder-slate-500 outline-none transition-colors resize-none leading-relaxed"
            />

            {/* Prompt Ideas Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
              <span className="text-[10px] text-slate-500 flex-shrink-0">Try:</span>
              {PROMPT_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(item)}
                  className="flex-shrink-0 text-[11px] px-2 py-0.5 rounded bg-[#131e36] text-slate-300 hover:text-white hover:bg-brand-500/20 border border-[#1e293b] truncate max-w-[200px]"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">AI Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[#090d16] border border-[#1e293b] focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
            >
              <option value="flux-schnell">FLUX.1 Schnell (Sub-second diffusion - Recommended)</option>
              <option value="sdxl">SDXL Turbo (High-resolution Stable Diffusion XL)</option>
            </select>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">Aspect Ratio & Framing</label>
            <div className="grid grid-cols-2 gap-2">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.id}
                  type="button"
                  onClick={() => setAspectRatio(ar.id)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                    aspectRatio === ar.id
                      ? 'bg-brand-500/10 border-brand-500 text-white shadow-sm'
                      : 'bg-[#090d16] border-[#1e293b] text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <div className="font-semibold">{ar.label}</div>
                  <div className="text-[10px] text-slate-500 truncate">{ar.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Style Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">Visual Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 bg-[#090d16] border border-[#1e293b] rounded-lg">
              {STYLES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStyle(st)}
                  className={`text-center py-1.5 px-2 rounded text-[11px] font-medium transition-colors ${
                    style === st
                      ? 'bg-brand-500 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Accordion (Negative Prompt) */}
          <div className="border border-[#1e293b] rounded-lg bg-[#090d16]/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-2.5 text-xs text-slate-400 hover:text-slate-200"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Sliders className="w-3.5 h-3.5" />
                Advanced Controls & Negative Prompts
              </span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvanced && (
              <div className="p-3 border-t border-[#1e293b] space-y-2 bg-[#090d16]">
                <label className="text-[11px] text-slate-400">Negative Prompt (Items to exclude)</label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="e.g. text, typography, words, letters, blurry, distorted anatomy, logos, watermark"
                  rows={2}
                  className="w-full bg-[#0f172a] border border-[#1e293b] rounded p-2 text-xs text-white outline-none"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-600 via-indigo-500 to-cyan-500 text-white text-sm font-semibold hover:from-brand-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-xs animate-pulse">{loadingStage}</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Image</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Professional Image Preview Component */}
        <div className="lg:col-span-7 saas-card p-5 space-y-4 min-h-[580px] flex flex-col justify-between">
          <div>
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-4">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                Image Preview
              </span>

              {selectedImage && selectedImage.status === 'completed' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyUrl(selectedImage.image_url)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#1e293b] text-slate-300 text-xs font-medium hover:bg-[#334155] transition-colors"
                    title="Copy Image URL"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                  </button>

                  <button
                    onClick={() => handleDownload(selectedImage)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#1e293b] text-slate-300 text-xs font-medium hover:bg-[#334155] transition-colors"
                    title="Download PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => setModalOpen(true)}
                    className="p-1.5 rounded bg-[#1e293b] text-slate-300 hover:text-white hover:bg-[#334155] transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(selectedImage.id)}
                    className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Display Area */}
            {loading ? (
              <div className="h-[440px] flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-cyan-400">
                    <Sparkles className="w-10 h-10 animate-spin text-brand-400" />
                  </div>
                  <span className="absolute -inset-1 rounded-2xl border border-cyan-400/40 animate-ping pointer-events-none" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">{loadingStage}</p>
                  <p className="text-xs text-slate-500 font-mono">Pixazo FLUX Schnell is rendering high-resolution asset</p>
                </div>
              </div>
            ) : selectedImage ? (
              <div className="space-y-3">
                {/* Main Image Frame */}
                <div className="relative rounded-xl overflow-hidden bg-[#090d16] border border-[#1e293b] flex items-center justify-center max-h-[460px] group">
                  <img
                    src={selectedImage.image_url}
                    alt={selectedImage.prompt}
                    className="w-full h-full object-contain max-h-[460px] rounded-lg transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono text-white border border-white/10">
                      {selectedImage.width} × {selectedImage.height}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-brand-500/80 backdrop-blur-md text-[10px] font-medium text-white">
                      {selectedImage.style || 'Realistic'}
                    </span>
                  </div>
                </div>

                {/* Metadata info */}
                <div className="p-3 bg-[#090d16] border border-[#1e293b] rounded-lg space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold text-white truncate max-w-[80%]">{selectedImage.prompt}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {selectedImage.generation_time_ms ? `${(selectedImage.generation_time_ms / 1000).toFixed(1)}s` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span>Model: <strong className="text-slate-400 font-mono">{selectedImage.model}</strong></span>
                    <span>Provider: <strong className="text-slate-400 capitalize">{selectedImage.provider}</strong></span>
                    <span>Created: <strong className="text-slate-400">{new Date(selectedImage.created_at).toLocaleTimeString()}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[440px] flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#090d16] border border-[#1e293b] flex items-center justify-center text-slate-500">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div className="max-w-sm space-y-1">
                  <h3 className="text-sm font-semibold text-white">No image selected</h3>
                  <p className="text-xs text-slate-400">
                    Type a prompt on the left and click Generate, or select a previously created image from your gallery below.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompt Re-load */}
          {selectedImage && (
            <div className="flex items-center justify-between pt-2 border-t border-[#1e293b] text-xs">
              <button
                onClick={() => setPrompt(selectedImage.prompt)}
                className="text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Use this prompt</span>
              </button>

              <a
                href={selectedImage.image_url}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white flex items-center gap-1"
              >
                <span>Open high-res</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Image Gallery / History Section */}
      <div className="saas-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              Image Gallery & History
            </h2>
            <p className="text-[11px] text-slate-400">Recent assets created via dashboard and developer REST API</p>
          </div>
          <span className="text-xs font-mono text-slate-500">{history.length} assets</span>
        </div>

        {fetchingHistory && history.length === 0 ? (
          <div className="py-12 flex justify-center text-slate-500 text-xs">
            <span className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-2" />
            Loading gallery...
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No images generated yet. Create your first image using the generator above!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {history.map((img) => (
              <div
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className={`group relative rounded-lg overflow-hidden border cursor-pointer transition-all aspect-square bg-[#090d16] ${
                  selectedImage?.id === img.id
                    ? 'border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-[#1e293b] hover:border-slate-700'
                }`}
              >
                <img
                  src={img.image_url}
                  alt={img.prompt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-[10px]">
                  <p className="text-white font-medium line-clamp-2 leading-tight">{img.prompt}</p>
                  <div className="flex items-center justify-between mt-1 text-slate-400 font-mono text-[9px]">
                    <span>{img.aspect_ratio || '1:1'}</span>
                    <span>{img.style || 'Realistic'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {modalOpen && selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setModalOpen(false)}
              className="absolute -top-10 right-0 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage.image_url}
              alt={selectedImage.prompt}
              className="max-h-[80vh] w-auto rounded-lg shadow-2xl border border-white/10"
            />
            <div className="mt-3 text-center text-xs text-slate-300 max-w-xl">
              <p className="font-semibold text-white">{selectedImage.prompt}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {selectedImage.width}×{selectedImage.height} • {selectedImage.model} • {selectedImage.style}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
