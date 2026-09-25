import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Globe,
  MapPin,
  CheckCircle2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api.js';
import { BusinessProfile } from '../types/index.js';
import { Modal } from '../components/Modal.js';
import { animatePageIn } from '../animations/gsapTransitions.js';

export const ProfilesPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [services, setServices] = useState('');
  const [products, setProducts] = useState('');
  const [brandVoice, setBrandVoice] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [cta, setCta] = useState('');
  const [usps, setUsps] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfiles = async () => {
    try {
      const res = await api.get('/profiles');
      setProfiles(res.data.profiles);
    } catch (err) {
      console.error('Failed to load business profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    animatePageIn(containerRef.current);
    fetchProfiles();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setIndustry('');
    setDescription('');
    setWebsite('');
    setLocation('');
    setTargetAudience('');
    setServices('');
    setProducts('');
    setBrandVoice('');
    setContactInfo('');
    setCta('');
    setUsps('');
    setModalOpen(true);
  };

  const openEditModal = (p: BusinessProfile) => {
    setEditingId(p.id);
    setName(p.name);
    setIndustry(p.industry || '');
    setDescription(p.description || '');
    setWebsite(p.website || '');
    setLocation(p.location || '');
    setTargetAudience(p.target_audience || '');
    setServices(p.services || '');
    setProducts(p.products || '');
    setBrandVoice(p.brand_voice || '');
    setContactInfo(p.contact_info || '');
    setCta(p.cta || '');
    setUsps(p.usps || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const payload = {
      name: name.trim(),
      industry: industry.trim(),
      description: description.trim(),
      website: website.trim(),
      location: location.trim(),
      targetAudience: targetAudience.trim(),
      services: services.trim(),
      products: products.trim(),
      brandVoice: brandVoice.trim(),
      contactInfo: contactInfo.trim(),
      cta: cta.trim(),
      usps: usps.trim()
    };

    try {
      if (editingId) {
        await api.put(`/profiles/${editingId}`, payload);
      } else {
        await api.post('/profiles', payload);
      }
      setModalOpen(false);
      fetchProfiles();
    } catch (err: any) {
      alert(err.message || 'Failed to save business profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this business profile?')) return;
    try {
      await api.delete(`/profiles/${id}`);
      setProfiles(profiles.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete profile');
    }
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-400" />
            <span>Business Profiles</span>
          </h2>
          <p className="text-xs text-slate-400">
            Define company intelligence, brand voice, and USPs to auto-inject into every AI generation.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Business Profile</span>
        </button>
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">Loading business profiles...</div>
      ) : profiles.length === 0 ? (
        <div className="saas-card p-12 text-center space-y-3">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Business Profiles Created</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create profiles for your brands (e.g. Delta X, ABC Digital, XYZ Restaurant) so the AI automatically knows your target audience, services, and distinct brand voice.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
          >
            Create First Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {profiles.map((p) => (
            <div key={p.id} className="saas-card saas-card-hover p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-brand-400 font-medium">{p.industry || 'General Business'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#1e293b]"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-red-500/10"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {p.description || 'No description provided.'}
                </p>

                <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-[#1e293b]">
                  {p.website && (
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate text-cyan-400 font-mono text-[11px]">{p.website}</span>
                    </div>
                  )}
                  {p.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{p.location}</span>
                    </div>
                  )}
                </div>

                {p.brand_voice && (
                  <div className="p-2.5 rounded bg-[#090d16] border border-[#1e293b] text-xs">
                    <span className="text-[10px] uppercase font-mono text-purple-400 font-semibold block mb-0.5">Brand Voice</span>
                    <p className="text-slate-300 text-[11px] line-clamp-2">{p.brand_voice}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-slate-500">
                <span>Created {new Date(p.created_at).toLocaleDateString()}</span>
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Ready for AI injection</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Business Profile' : 'Create Business Profile'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-200">Business Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Delta X Digital"
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none focus:border-brand-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-200">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. SaaS, E-Commerce, Legal, Hospitality"
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-200">Business Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your company do and who do you serve?"
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-200">Website URL</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none focus:border-brand-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-200">Location / Service Region</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA & Global"
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-200">Target Audience</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. CMOs, SMB Owners, Developers"
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none focus:border-brand-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-200">Brand Voice</label>
              <input
                type="text"
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                placeholder="e.g. Authoritative, witty, data-driven, friendly"
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-200">Services</label>
              <input
                type="text"
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="e.g. AI Consulting, SEO Audits, Cloud Migration"
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none focus:border-brand-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-200">Products</label>
              <input
                type="text"
                value={products}
                onChange={(e) => setProducts(e.target.value)}
                placeholder="e.g. DXGen Enterprise API, Content Accelerator"
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-200">Unique Value Proposition (USPs)</label>
            <input
              type="text"
              value={usps}
              onChange={(e) => setUsps(e.target.value)}
              placeholder="e.g. 10x faster generation, proprietary multi-agent workflows"
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-200">Preferred Default CTA</label>
              <input
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="e.g. Book a free consultation call today"
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none focus:border-brand-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-200">Contact Details</label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="e.g. hello@deltax.ai / +1 (800) 555-0199"
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-white outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#1e293b] text-slate-300 font-semibold hover:bg-[#334155]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
