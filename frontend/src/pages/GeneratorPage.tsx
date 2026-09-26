import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Eye,
  Copy,
  Check,
  Download,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileCode,
  Globe,
  Share2,
  Briefcase,
  HelpCircle,
  Building,
  Hash,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api.js';
import { BusinessProfile } from '../types/index.js';
import { PromptPreviewModal } from '../components/PromptPreviewModal.js';
import { animatePageIn, animateContentIn } from '../animations/gsapTransitions.js';

export const GeneratorPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();

  // Generator Form States
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState(searchParams.get('type') || 'seo_blog_article');
  const [platform, setPlatform] = useState(searchParams.get('platform') || 'website');
  const [tone, setTone] = useState('professional');
  const [customTone, setCustomTone] = useState('');
  const [length, setLength] = useState('medium');
  const [customWordCount, setCustomWordCount] = useState('1500');
  const [language, setLanguage] = useState('English');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [audience, setAudience] = useState('');
  const [location, setLocation] = useState('');
  const [businessProfileId, setBusinessProfileId] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  // SEO Accordion Fields
  const [seoOpen, setSeoOpen] = useState(false);
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState('');
  const [searchIntent, setSearchIntent] = useState('Informational & Commercial');
  const [brandName, setBrandName] = useState('');
  const [competitorReference, setCompetitorReference] = useState('');

  // Meta & Profiles Loaded
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [platformsList, setPlatformsList] = useState<Array<{ id: string; name: string }>>([]);
  const [contentTypesList, setContentTypesList] = useState<Array<{ id: string; label: string; category: string }>>([]);

  // Generation & Status States
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Content-to-Image Generation States
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageStage, setImageStage] = useState('');
  const [featuredImage, setFeaturedImage] = useState<any | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [copiedImageUrl, setCopiedImageUrl] = useState(false);

  // Prompt Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewPromptText, setPreviewPromptText] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Content Editor view mode: 'preview' | 'markdown' | 'edit'
  const [viewMode, setViewMode] = useState<'preview' | 'markdown' | 'edit'>('preview');
  const [editableBody, setEditableBody] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    animatePageIn(containerRef.current);

    // Fetch metadata & profiles
    const fetchMetadata = async () => {
      try {
        const [profRes, platRes, typesRes] = await Promise.all([
          api.get('/profiles').catch(() => ({ data: { profiles: [] } })),
          api.get('/platforms'),
          api.get('/content-types')
        ]);
        setBusinessProfiles(profRes.data.profiles || []);
        if (profRes.data.profiles?.length > 0) {
          setBusinessProfileId(profRes.data.profiles[0].id);
        }
        setPlatformsList(platRes.data.platforms);
        setContentTypesList(typesRes.data.contentTypes);
      } catch (err) {
        console.error('Failed to load generator metadata:', err);
      }
    };

    fetchMetadata();
  }, []);

  const handleAddKeyword = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = keywordInput.trim();
      if (val && !keywords.includes(val)) {
        setKeywords([...keywords, val]);
        setKeywordInput('');
      }
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please provide a topic or headline to generate content.');
      return;
    }

    setError(null);
    setLoading(true);

    // Animated loading stages sequence
    const stages = [
      'Preparing prompt...',
      'Optimizing instructions...',
      'Generating content with Gemini AI...',
      'Formatting response...'
    ];

    let stageIdx = 0;
    setLoadingStage(stages[0]);
    const interval = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setLoadingStage(stages[stageIdx]);
      }
    }, 700);

    try {
      const payload = {
        topic: topic.trim(),
        contentType,
        platform,
        tone: tone === 'custom' ? (customTone || 'professional') : tone,
        customTone: tone === 'custom' ? customTone : undefined,
        length: length === 'custom' ? parseInt(customWordCount, 10) || 1000 : length,
        language,
        keywords,
        audience,
        location,
        businessId: businessProfileId || undefined,
        customInstructions,
        seo: seoOpen ? {
          primaryKeyword,
          secondaryKeywords: secondaryKeywords.split(',').map(s => s.trim()).filter(Boolean),
          searchIntent,
          brandName,
          competitorReference
        } : undefined
      };

      const res = await api.post('/generate', payload);
      setGeneratedResult(res.data);
      setEditableBody(res.data.content.body);
      setViewMode('preview');
      setFeaturedImage(null);
      setImageError(null);

      setTimeout(() => {
        animateContentIn(resultRef.current);
      }, 50);
    } catch (err: any) {
      setError(err.message || 'Generation failed. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleGenerateFeaturedImage = async () => {
    if (!generatedResult) return;
    setGeneratingImage(true);
    setImageError(null);
    setImageStage('Analyzing content...');

    const stages = [
      'Analyzing content...',
      'Creating image prompt...',
      'Generating image with Pixazo FLUX...',
      'Processing result...'
    ];
    let sIdx = 0;
    const interval = setInterval(() => {
      sIdx = (sIdx + 1) % stages.length;
      setImageStage(stages[sIdx]);
    }, 2800);

    try {
      const res = await api.post('/images/from-content', {
        contentId: generatedResult.contentId,
        title: generatedResult.content.title,
        topic: topic || generatedResult.content.title,
        platform,
        contentType,
        style: platform === 'website' ? 'Commercial Photography' : 'Realistic'
      });
      clearInterval(interval);
      if (res.data?.success && res.data?.image) {
        setFeaturedImage(res.data.image);
      }
    } catch (err: any) {
      clearInterval(interval);
      setImageError(err.message || 'Failed to generate featured image.');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handlePreviewPrompt = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic first to preview the generated prompt.');
      return;
    }

    setPreviewLoading(true);
    try {
      const payload = {
        topic: topic.trim(),
        contentType,
        platform,
        tone: tone === 'custom' ? (customTone || 'professional') : tone,
        customTone: tone === 'custom' ? customTone : undefined,
        length: length === 'custom' ? parseInt(customWordCount, 10) || 1000 : length,
        language,
        keywords,
        audience,
        location,
        businessId: businessProfileId || undefined,
        customInstructions,
        seo: seoOpen ? {
          primaryKeyword,
          secondaryKeywords: secondaryKeywords.split(',').map(s => s.trim()).filter(Boolean),
          searchIntent,
          brandName,
          competitorReference
        } : undefined
      };

      const res = await api.post('/generate/preview-prompt', payload);
      setPreviewPromptText(res.data.prompt);
      setPreviewModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to preview prompt');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCopyText = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownload = (format: 'md' | 'json' | 'txt') => {
    if (!generatedResult) return;
    let contentStr = '';
    let filename = `${(generatedResult.content.slug || 'content')}.${format}`;
    let mimeType = 'text/plain';

    if (format === 'json') {
      contentStr = JSON.stringify(generatedResult, null, 2);
      mimeType = 'application/json';
    } else if (format === 'md') {
      contentStr = `# ${generatedResult.content.title}\n\n${editableBody}`;
      if (generatedResult.content.cta) {
        contentStr += `\n\n---\n**Call To Action:** ${generatedResult.content.cta}`;
      }
      mimeType = 'text/markdown';
    } else {
      contentStr = `${generatedResult.content.title}\n\n${editableBody}`;
    }

    const blob = new Blob([contentStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <span>AI Content Studio</span>
          </h2>
          <p className="text-xs text-slate-400">
            Synthesize optimized prompts internally and generate publication-grade content with Gemini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviewPrompt}
            disabled={previewLoading || !topic.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e293b] text-slate-300 text-xs font-medium hover:bg-[#334155] border border-[#334155] disabled:opacity-40 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-brand-400" />
            <span>View Generated Prompt</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Grid: Form on Left, Result on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls (5 cols) */}
        <div className="lg:col-span-5 saas-card p-5 space-y-5">
          {/* Topic Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">
              Topic or Headline <span className="text-red-400">*</span>
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Best web development services for small businesses in 2026"
              rows={3}
              className="w-full bg-[#090d16] border border-[#1e293b] focus:border-brand-500 rounded-lg p-3 text-xs text-white placeholder-slate-500 outline-none transition-colors"
            />
            {/* Quick Inspiration Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 self-center">Try:</span>
              {[
                'AI Marketing Strategies',
                'Best CRM for B2B Startups',
                'Instagram Launch Hook'
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setTopic(chip)}
                  className="px-2 py-0.5 rounded bg-[#131e36] text-[10px] text-slate-400 hover:text-brand-300 hover:bg-brand-500/10 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Content Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full bg-[#090d16] border border-[#1e293b] focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none capitalize"
            >
              <optgroup label="Blog / Articles">
                <option value="seo_blog_article">SEO Blog Article</option>
                <option value="informational_blog">Informational Blog</option>
                <option value="how_to_article">How-To Article</option>
                <option value="listicle">Listicle</option>
                <option value="product_review">Product Review</option>
                <option value="comparison_article">Comparison Article</option>
                <option value="news_update_article">News / Update Article</option>
                <option value="educational_article">Educational Article</option>
              </optgroup>
              <optgroup label="Marketing Copy">
                <option value="promotional_content">Promotional Content</option>
                <option value="product_promotion">Product Promotion</option>
                <option value="service_promotion">Service Promotion</option>
                <option value="advertisement_copy">Advertisement Copy</option>
                <option value="sales_copy">Sales Copy</option>
                <option value="landing_page_copy">Landing Page Copy</option>
                <option value="offer_announcement">Offer Announcement</option>
                <option value="product_description">Product Description</option>
              </optgroup>
              <optgroup label="Social Media">
                <option value="instagram_caption">Instagram Caption</option>
                <option value="instagram_promotional_post">Instagram Promotional Post</option>
                <option value="facebook_post">Facebook Post</option>
                <option value="linkedin_post">LinkedIn Post</option>
                <option value="x_twitter_post">X / Twitter Post</option>
              </optgroup>
              <optgroup label="Business Updates">
                <option value="google_business_profile_post">Google Business Profile Post</option>
                <option value="business_announcement">Business Announcement</option>
                <option value="customer_update">Customer Update</option>
                <option value="service_introduction">Service Introduction</option>
                <option value="event_announcement">Event Announcement</option>
                <option value="local_business_promotion">Local Business Promotion</option>
              </optgroup>
              <optgroup label="Other Formats">
                <option value="email">Email</option>
                <option value="newsletter">Newsletter</option>
                <option value="website_content">Website Content</option>
                <option value="faq">FAQ</option>
                <option value="press_release">Press Release</option>
                <option value="custom_content">Custom Content</option>
              </optgroup>
            </select>
          </div>

          {/* Platform & Language Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-[#090d16] border border-[#1e293b] focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none capitalize"
              >
                <option value="website">Website / Blog</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">X / Twitter</option>
                <option value="google_business">Google Business Profile</option>
                <option value="email">Email</option>
                <option value="newsletter">Newsletter</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#090d16] border border-[#1e293b] focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Bengali">Bengali (বাংলা)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
              </select>
            </div>
          </div>

          {/* Tone & Length Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-[#090d16] border border-[#1e293b] focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
                <option value="conversational">Conversational</option>
                <option value="educational">Educational</option>
                <option value="persuasive">Persuasive</option>
                <option value="promotional">Promotional</option>
                <option value="premium">Premium</option>
                <option value="technical">Technical</option>
                <option value="minimal">Minimal</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="luxury">Luxury</option>
                <option value="local_business">Local Business</option>
                <option value="custom">Custom Tone</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">Length</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full bg-[#090d16] border border-[#1e293b] focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              >
                <option value="short">Short (300-500w)</option>
                <option value="medium">Medium (800-1200w)</option>
                <option value="long">Long (1500-2500w)</option>
                <option value="custom">Custom Word Count</option>
              </select>
            </div>
          </div>

          {/* Conditional Custom Inputs */}
          {tone === 'custom' && (
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Custom Tone Description</label>
              <input
                type="text"
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
                placeholder="e.g. Sarcastic yet informative tech visionary"
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          )}

          {length === 'custom' && (
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Target Word Count</label>
              <input
                type="number"
                value={customWordCount}
                onChange={(e) => setCustomWordCount(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          )}

          {/* Keywords Tag Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">Keywords (Type and press Enter)</label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-[#090d16] border border-[#1e293b] rounded-lg min-h-[42px] items-center">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[11px] border border-brand-500/30"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleAddKeyword}
                placeholder={keywords.length === 0 ? "Add keywords..." : ""}
                className="bg-transparent text-xs text-white placeholder-slate-500 outline-none flex-1 min-w-[100px]"
              />
            </div>
          </div>

          {/* Business Profile Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>Attached Business Profile</span>
              <span className="text-[10px] text-slate-500 font-normal">Auto-injects brand voice & USPs</span>
            </label>
            <select
              value={businessProfileId}
              onChange={(e) => setBusinessProfileId(e.target.value)}
              className="w-full bg-[#090d16] border border-[#1e293b] focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
            >
              <option value="">None (Generic voice)</option>
              {businessProfiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name} {p.industry ? `(${p.industry})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Advanced SEO Accordion */}
          <div className="border border-[#1e293b] rounded-lg overflow-hidden bg-[#090d16]/50">
            <button
              type="button"
              onClick={() => setSeoOpen(!seoOpen)}
              className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-300 hover:bg-[#131e36] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-brand-400" />
                <span>Advanced SEO & Strategy Parameters</span>
              </div>
              {seoOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {seoOpen && (
              <div className="p-3.5 border-t border-[#1e293b] space-y-3 bg-[#090d16]">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Primary Keyword</label>
                    <input
                      type="text"
                      value={primaryKeyword}
                      onChange={(e) => setPrimaryKeyword(e.target.value)}
                      placeholder="e.g. b2b lead generation"
                      className="w-full bg-[#0f172a] border border-[#1e293b] rounded p-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Search Intent</label>
                    <input
                      type="text"
                      value={searchIntent}
                      onChange={(e) => setSearchIntent(e.target.value)}
                      placeholder="e.g. Commercial Investigation"
                      className="w-full bg-[#0f172a] border border-[#1e293b] rounded p-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Target Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. United States, India, London"
                      className="w-full bg-[#0f172a] border border-[#1e293b] rounded p-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Target Audience</label>
                    <input
                      type="text"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="e.g. SaaS Founders, CMOs"
                      className="w-full bg-[#0f172a] border border-[#1e293b] rounded p-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Secondary Keywords (comma separated)</label>
                  <input
                    type="text"
                    value={secondaryKeywords}
                    onChange={(e) => setSecondaryKeywords(e.target.value)}
                    placeholder="e.g. outbound sales, email sequencing, high conversion"
                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded p-2 text-xs text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Brand Name</label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g. Delta X"
                      className="w-full bg-[#0f172a] border border-[#1e293b] rounded p-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Competitor / Benchmark</label>
                    <input
                      type="text"
                      value={competitorReference}
                      onChange={(e) => setCompetitorReference(e.target.value)}
                      placeholder="e.g. Traditional agencies"
                      className="w-full bg-[#0f172a] border border-[#1e293b] rounded p-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">Custom Instructions (Optional)</label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Include a comparison table and emphasize our 14-day free trial"
              rows={2}
              className="w-full bg-[#090d16] border border-[#1e293b] focus:border-brand-500 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* Generate Button with Stage Animations */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 text-white text-sm font-semibold hover:from-brand-500 hover:to-cyan-400 shadow-lg shadow-brand-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-xs animate-pulse">{loadingStage}</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Content</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Output & Professional Content Interface (7 cols) */}
        <div ref={resultRef} className="lg:col-span-7 saas-card p-5 space-y-4 min-h-[620px]">
          {!generatedResult && !loading && (
            <div className="h-[560px] flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-base font-semibold text-white">Ready for your prompt</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Configure your parameters on the left and click Generate Content. The system will build an optimized prompt internally and return formatted SEO-ready copy.
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="h-[560px] flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                  <Sparkles className="w-8 h-8 animate-pulse text-cyan-400" />
                </div>
                <span className="absolute -inset-1 rounded-2xl border border-cyan-400/40 animate-ping pointer-events-none" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">{loadingStage}</p>
                <p className="text-xs text-slate-500 font-mono">Gemini AI model is structuring publication-grade copy</p>
              </div>
            </div>
          )}

          {generatedResult && !loading && (
            <div className="space-y-4">
              {/* Output Header & View Mode Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg bg-[#090d16] p-1 border border-[#1e293b]">
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        viewMode === 'preview' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Rendered
                    </button>
                    <button
                      onClick={() => setViewMode('markdown')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        viewMode === 'markdown' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Markdown
                    </button>
                    <button
                      onClick={() => setViewMode('edit')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        viewMode === 'edit' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Editor
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                    {generatedResult.content.wordCount} words (~{generatedResult.content.readingTimeMinutes} min)
                  </span>
                </div>

                {/* Actions: Generate Image, Copy, Export, Regenerate */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateFeaturedImage}
                    disabled={generatingImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 via-indigo-500 to-cyan-500 text-white text-xs font-semibold hover:from-brand-500 hover:to-cyan-400 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all"
                    title="Generate AI Hero Image using Pixazo"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>
                      {generatingImage
                        ? 'Creating Image...'
                        : featuredImage
                        ? 'Regenerate Image'
                        : 'Generate Featured Image'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleCopyText(editableBody, 'all')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#1e293b] text-slate-300 text-xs font-medium hover:bg-[#334155] transition-colors"
                  >
                    {copiedSection === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'all' ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <div className="relative group">
                    <button className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#1e293b] text-slate-300 text-xs font-medium hover:bg-[#334155] transition-colors">
                      <Download className="w-3.5 h-3.5" />
                      <span>Export</span>
                    </button>
                    <div className="absolute right-0 mt-1 hidden group-hover:block z-20 w-32 bg-[#0f172a] border border-[#1e293b] rounded-lg shadow-xl py-1">
                      <button onClick={() => handleDownload('md')} className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-[#1e293b]">Markdown (.md)</button>
                      <button onClick={() => handleDownload('txt')} className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-[#1e293b]">Plain Text (.txt)</button>
                      <button onClick={() => handleDownload('json')} className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-[#1e293b]">JSON (.json)</button>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    title="Regenerate Content"
                    className="p-1.5 rounded bg-[#1e293b] text-slate-300 hover:text-white hover:bg-[#334155] transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Generating Featured Image State */}
              {generatingImage && (
                <div className="p-4 rounded-xl bg-[#090d16] border border-cyan-500/30 flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <ImageIcon className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{imageStage}</p>
                    <p className="text-[11px] text-slate-500 font-mono">Pixazo FLUX Schnell is crafting a matching visual for this content</p>
                  </div>
                </div>
              )}

              {/* Image Error Alert */}
              {imageError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
                  <span>{imageError}</span>
                  <button onClick={handleGenerateFeaturedImage} className="text-xs text-red-300 underline font-medium">Retry</button>
                </div>
              )}

              {/* Generated Featured Image Display Banner */}
              {featuredImage && (
                <div className="rounded-xl overflow-hidden bg-[#090d16] border border-[#1e293b] space-y-2 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Featured Hero Image (Pixazo FLUX)
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(featuredImage.url);
                          setCopiedImageUrl(true);
                          setTimeout(() => setCopiedImageUrl(false), 2000);
                        }}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-[#1e293b]"
                      >
                        {copiedImageUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedImageUrl ? 'Copied' : 'Copy URL'}</span>
                      </button>

                      <a
                        href={featuredImage.url}
                        download="featured-image.png"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-[#1e293b]"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>

                  <div className="relative rounded-lg overflow-hidden max-h-72 bg-black/40 flex items-center justify-center">
                    <img
                      src={featuredImage.url}
                      alt={featuredImage.prompt || 'Featured visual'}
                      className="w-full h-auto object-cover max-h-72 rounded-lg"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 italic truncate">
                    Prompt: {featuredImage.prompt}
                  </p>
                </div>
              )}

              {/* Title Banner */}
              <div className="p-3.5 rounded-lg bg-[#090d16] border border-[#1e293b] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">Title / Headline</span>
                  <button
                    onClick={() => handleCopyText(generatedResult.content.title, 'title')}
                    className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1"
                  >
                    {copiedSection === 'title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <h3 className="text-base font-bold text-white">{generatedResult.content.title}</h3>
              </div>

              {/* SEO Meta Box (if blog/website) */}
              {generatedResult.content.metaTitle && (
                <div className="p-3.5 rounded-lg bg-[#090d16]/70 border border-[#1e293b] space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[#1e293b] pb-1.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-semibold">SEO Meta & SERP Preview</span>
                    <button
                      onClick={() => handleCopyText(`Title: ${generatedResult.content.metaTitle}\nDesc: ${generatedResult.content.metaDescription}\nSlug: ${generatedResult.content.slug}`, 'meta')}
                      className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1"
                    >
                      {copiedSection === 'meta' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Meta</span>
                    </button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-cyan-400 font-medium truncate">{generatedResult.content.metaTitle}</p>
                    <p className="text-emerald-400 font-mono text-[11px]">https://yourdomain.com/{generatedResult.content.slug}</p>
                    <p className="text-slate-400 text-[11px]">{generatedResult.content.metaDescription}</p>
                  </div>
                </div>
              )}

              {/* Main Body Content */}
              <div className="border border-[#1e293b] rounded-lg overflow-hidden bg-[#090d16]">
                {viewMode === 'edit' ? (
                  <textarea
                    value={editableBody}
                    onChange={(e) => setEditableBody(e.target.value)}
                    className="w-full h-[380px] p-4 bg-transparent font-mono text-xs text-slate-200 outline-none resize-none leading-relaxed"
                  />
                ) : viewMode === 'markdown' ? (
                  <pre className="p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-y-auto max-h-[380px] leading-relaxed">
                    {editableBody}
                  </pre>
                ) : (
                  <div className="p-5 overflow-y-auto max-h-[380px] space-y-4 text-xs text-slate-300 leading-relaxed">
                    {editableBody.split('\n\n').map((paragraph, idx) => {
                      if (paragraph.startsWith('### ')) {
                        return <h4 key={idx} className="text-sm font-semibold text-white pt-2">{paragraph.replace('### ', '')}</h4>;
                      } else if (paragraph.startsWith('## ')) {
                        return <h3 key={idx} className="text-base font-bold text-white pt-3 border-b border-[#1e293b] pb-1">{paragraph.replace('## ', '')}</h3>;
                      } else if (paragraph.startsWith('# ')) {
                        return <h2 key={idx} className="text-lg font-extrabold text-white pt-2">{paragraph.replace('# ', '')}</h2>;
                      } else if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                        const items = paragraph.split('\n');
                        return (
                          <ul key={idx} className="list-disc pl-5 space-y-1">
                            {items.map((it, i) => (
                              <li key={i}>{it.replace(/^[-*]\s*/, '')}</li>
                            ))}
                          </ul>
                        );
                      } else {
                        return <p key={idx}>{paragraph}</p>;
                      }
                    })}
                  </div>
                )}
              </div>

              {/* Hashtags for Social Content */}
              {generatedResult.content.hashtags && generatedResult.content.hashtags.length > 0 && (
                <div className="p-3 rounded-lg bg-[#090d16] border border-[#1e293b] space-y-1.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">Recommended Hashtags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedResult.content.hashtags.map((tag: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 font-mono text-[11px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Call To Action Box */}
              {generatedResult.content.cta && (
                <div className="p-3.5 rounded-lg bg-gradient-to-r from-brand-600/10 to-cyan-500/10 border border-brand-500/30 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold">Call To Action (CTA)</span>
                    <p className="text-slate-200 font-medium">{generatedResult.content.cta}</p>
                  </div>
                  <button
                    onClick={() => handleCopyText(generatedResult.content.cta, 'cta')}
                    className="p-1.5 text-slate-400 hover:text-white"
                  >
                    {copiedSection === 'cta' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {/* Generation Telemetry Footer */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                <span>Model: {generatedResult.usage.model}</span>
                <span>Latency: {generatedResult.usage.generationTimeMs}ms</span>
                <span>Tokens: {generatedResult.usage.inputTokens} in / {generatedResult.usage.outputTokens} out</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prompt Preview Modal */}
      <PromptPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        prompt={previewPromptText}
      />
    </div>
  );
};
