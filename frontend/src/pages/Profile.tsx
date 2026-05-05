import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { userApi } from '@/api/user';
import { reviewsApi } from '@/api/reviews';
import type { UserProfile, PortfolioItem } from '@/types/user';
import type { ReviewResponse } from '@/types/review';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatMemberSince(dateStr?: string) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function parseSkills(skills?: string): string[] {
  if (!skills) return [];
  return skills.split(',').map(s => s.trim()).filter(Boolean);
}

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reviews, setReviews] = useState<ReviewResponse[]>([]);

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({ title: '', description: '', imageUrl: '', projectUrl: '', technologies: '' });
  const [portfolioSaving, setPortfolioSaving] = useState(false);
  const [portfolioErr, setPortfolioErr] = useState('');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const [form, setForm] = useState({
    name: '',
    title: '',
    bio: '',
    location: '',
    hourlyRate: '',
    skills: '',
    profileImageUrl: '',
  });

  const isOwnProfile = currentUser?.id === profile?.id;

  useEffect(() => {
    if (!id) { navigate('/'); return; }
    setLoading(true);
    userApi.getUserById(Number(id))
      .then(p => {
        setProfile(p);
        setForm({
          name: p.name ?? '',
          title: p.title ?? '',
          bio: p.bio ?? '',
          location: p.location ?? '',
          hourlyRate: p.hourlyRate != null ? String(p.hourlyRate) : '',
          skills: p.skills ?? '',
          profileImageUrl: p.profileImageUrl ?? '',
        });
        reviewsApi.getUserReviews(p.id).then(setReviews).catch(() => {});
        userApi.getPortfolio(p.id).then(setPortfolio).catch(() => {});
      })
      .catch(() => setError('Profile not found.'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSave = async () => {
    setSaving(true); setSaveErr('');
    try {
      await userApi.updateMe({
        name: form.name.trim() || undefined,
        title: form.title.trim() || undefined,
        bio: form.bio.trim() || undefined,
        location: form.location.trim() || undefined,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        skills: form.skills.trim() || undefined,
        profileImageUrl: form.profileImageUrl.trim() || undefined,
      });
      await refreshUser();
      const updated = await userApi.getUserById(Number(id));
      setProfile(updated);
      setEditing(false);
    } catch {
      setSaveErr('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPortfolio = async () => {
    if (!portfolioForm.title.trim()) return;
    setPortfolioSaving(true); setPortfolioErr('');
    try {
      const item = await userApi.addPortfolioItem({
        title: portfolioForm.title.trim(),
        description: portfolioForm.description.trim() || undefined,
        imageUrl: portfolioForm.imageUrl.trim() || undefined,
        projectUrl: portfolioForm.projectUrl.trim() || undefined,
        technologies: portfolioForm.technologies.trim() || undefined,
      });
      setPortfolio(p => [...p, item]);
      setPortfolioForm({ title: '', description: '', imageUrl: '', projectUrl: '', technologies: '' });
      setShowPortfolioForm(false);
    } catch {
      setPortfolioErr('Failed to add portfolio item.');
    } finally {
      setPortfolioSaving(false);
    }
  };

  const handleDeletePortfolio = async (itemId: number) => {
    try {
      await userApi.deletePortfolioItem(itemId);
      setPortfolio(p => p.filter(i => i.id !== itemId));
    } catch { /* ignore */ }
  };

  const cancelEdit = () => {
    if (!profile) return;
    setForm({
      name: profile.name ?? '',
      title: profile.title ?? '',
      bio: profile.bio ?? '',
      location: profile.location ?? '',
      hourlyRate: profile.hourlyRate != null ? String(profile.hourlyRate) : '',
      skills: profile.skills ?? '',
      profileImageUrl: profile.profileImageUrl ?? '',
    });
    setSaveErr('');
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f0f4f8' }}>
        <Navbar variant="app" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f0f4f8' }}>
        <Navbar variant="app" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300">person_off</span>
            <p className="mt-3 text-slate-500 text-lg">{error || 'Profile not found.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const skills = parseSkills(profile.skills);
  const displayName = editing ? form.name : profile.name;
  const displayBio = editing ? form.bio : (profile.bio ?? '');
  const displayLocation = editing ? form.location : (profile.location ?? '');
  const displayPhoto = editing ? form.profileImageUrl : (profile.profileImageUrl ?? '');

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f0f4f8' }}>
      <Navbar variant="app" />

      {/* Hero Banner */}
      <div
        className="w-full h-52 md:h-64 relative"
        style={{ background: 'linear-gradient(135deg, #0A192F 0%, #0d1c32 50%, #0059bb 100%)' }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #ffffff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #ffffff 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
        {isOwnProfile && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="absolute top-4 right-4 md:top-6 md:right-8 flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-xl border border-white/20 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Profile
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="w-full max-w-8xl mx-auto px-4 md:px-8 pb-16">

        {/* Profile Card — overlaps hero */}
        <div className="relative -mt-20 mb-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end gap-5">

              {/* Avatar */}
              <div className="flex-shrink-0">
                {displayPhoto ? (
                  <img
                    src={displayPhoto}
                    alt={displayName}
                    className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-white shadow-lg"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-secondary flex items-center justify-center text-white font-bold text-4xl border-4 border-white shadow-lg select-none">
                    {getInitials(profile.name)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{profile.name}</h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full"
                    style={{ backgroundColor: '#e8f0fe', color: '#0059bb' }}>
                    {profile.role.charAt(0) + profile.role.slice(1).toLowerCase()}
                  </span>
                </div>

                {profile.title && (
                  <p className="text-base md:text-lg text-slate-600 font-medium mb-2">{profile.title}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  {reviews.length > 0 && (() => {
                    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
                    return (
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        {avg.toFixed(1)}
                        <span className="text-slate-400 font-normal">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                      </span>
                    );
                  })()}
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px] text-slate-400">location_on</span>
                      {profile.location}
                    </span>
                  )}
                  {profile.hourlyRate != null && (
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <span className="material-symbols-outlined text-[18px] text-slate-400">payments</span>
                      ${profile.hourlyRate}/hr
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">calendar_month</span>
                    Member since {formatMemberSince(profile.createdAt)}
                  </span>
                </div>
              </div>

              {/* Action buttons (other's profile) */}
              {!isOwnProfile && (
                <div className="flex gap-3 flex-shrink-0">
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                    Message
                  </button>
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:brightness-110"
                    style={{ backgroundColor: '#0059bb' }}>
                    <span className="material-symbols-outlined text-[18px]">handshake</span>
                    Hire
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit form error */}
        {saveErr && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{saveErr}</div>
        )}

        {/* Edit Mode Form */}
        {editing && isOwnProfile && (
          <div className="bg-white rounded-2xl shadow border border-slate-100 p-6 md:p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
              <div className="flex gap-3">
                <button onClick={cancelEdit} className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-xl hover:brightness-110 disabled:opacity-60 transition-all"
                  style={{ backgroundColor: '#0059bb' }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors"
                  placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Professional Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors"
                  placeholder="e.g. Full Stack Developer" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Location</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors"
                  placeholder="e.g. New York, USA" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Hourly Rate (USD)</label>
                <input type="number" min={0} value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors"
                  placeholder="e.g. 50" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Profile Photo URL</label>
                <input value={form.profileImageUrl} onChange={e => setForm(f => ({ ...f, profileImageUrl: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors"
                  placeholder="https://example.com/photo.jpg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Skills (comma-separated)</label>
                <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors"
                  placeholder="React, TypeScript, Node.js, PostgreSQL" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">About / Bio</label>
                <textarea rows={4} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
                  placeholder="Tell clients about yourself, your experience, and what makes you stand out…" />
              </div>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left column */}
          <div className="md:col-span-4 flex flex-col gap-6">

            {/* About card */}
            <div className="bg-white rounded-2xl shadow border border-slate-100 p-6">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary">person</span>
                About
              </h2>
              {displayBio ? (
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{displayBio}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">No bio provided yet.</p>
              )}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                {displayLocation && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">location_on</span>
                    {displayLocation}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">calendar_month</span>
                  Joined {formatMemberSince(profile.createdAt)}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">mail</span>
                  {profile.email}
                </div>
              </div>
            </div>

            {/* Skills card */}
            <div className="bg-white rounded-2xl shadow border border-slate-100 p-6">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary">psychology</span>
                Skills & Expertise
              </h2>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <span key={skill}
                      className="px-3 py-1 text-xs font-semibold rounded-full border"
                      style={{ backgroundColor: '#e8f0fe', color: '#0059bb', borderColor: '#c5d9fb' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No skills listed yet.</p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-8 flex flex-col gap-6">

            {/* Portfolio */}
            <div className="bg-white rounded-2xl shadow border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-secondary">grid_view</span>
                  Portfolio
                </h2>
                {isOwnProfile && !showPortfolioForm && (
                  <button
                    onClick={() => setShowPortfolioForm(true)}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Item
                  </button>
                )}
              </div>

              {/* Add portfolio form */}
              {showPortfolioForm && isOwnProfile && (
                <div className="mb-5 p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div className="sm:col-span-2">
                      <input
                        value={portfolioForm.title}
                        onChange={e => setPortfolioForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                        placeholder="Project title *"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <textarea
                        rows={2}
                        value={portfolioForm.description}
                        onChange={e => setPortfolioForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary resize-none"
                        placeholder="Description"
                      />
                    </div>
                    <input
                      value={portfolioForm.imageUrl}
                      onChange={e => setPortfolioForm(f => ({ ...f, imageUrl: e.target.value }))}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                      placeholder="Image URL"
                    />
                    <input
                      value={portfolioForm.projectUrl}
                      onChange={e => setPortfolioForm(f => ({ ...f, projectUrl: e.target.value }))}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                      placeholder="Project URL"
                    />
                    <div className="sm:col-span-2">
                      <input
                        value={portfolioForm.technologies}
                        onChange={e => setPortfolioForm(f => ({ ...f, technologies: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                        placeholder="Technologies (e.g. React, Node.js)"
                      />
                    </div>
                  </div>
                  {portfolioErr && <p className="text-xs text-red-500 mb-2">{portfolioErr}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddPortfolio}
                      disabled={portfolioSaving || !portfolioForm.title.trim()}
                      className="px-4 py-1.5 text-xs font-semibold text-white rounded-xl disabled:opacity-60 hover:brightness-110 transition-all"
                      style={{ backgroundColor: '#0059bb' }}
                    >
                      {portfolioSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setShowPortfolioForm(false); setPortfolioErr(''); }}
                      className="px-4 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {portfolio.length === 0 && !showPortfolioForm ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-200 mb-3">folder_open</span>
                  <p className="text-sm font-semibold text-slate-400">No portfolio items yet</p>
                  {isOwnProfile && <p className="text-xs text-slate-300 mt-1">Add your first project above</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {portfolio.map(item => (
                    <div key={item.id} className="border border-slate-100 rounded-xl overflow-hidden group relative">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-36 object-cover"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800 leading-tight">{item.title}</p>
                          {isOwnProfile && (
                            <button
                              onClick={() => handleDeletePortfolio(item.id)}
                              className="flex-shrink-0 text-slate-300 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                        )}
                        {item.technologies && (
                          <p className="text-xs text-slate-400 mt-1.5">{item.technologies}</p>
                        )}
                        {item.projectUrl && (
                          <a
                            href={item.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold mt-2"
                            style={{ color: '#0059bb' }}
                          >
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            View Project
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl shadow border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-secondary">reviews</span>
                  Reviews
                </h2>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-200 mb-3">rate_review</span>
                  <p className="text-sm font-semibold text-slate-400">No reviews yet</p>
                  <p className="text-xs text-slate-300 mt-1">Reviews appear after completed contracts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="border border-slate-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{r.reviewerName}</p>
                          <p className="text-xs text-slate-400">{r.jobTitle}</p>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} className="material-symbols-outlined text-[16px] leading-none"
                              style={{ fontVariationSettings: "'FILL' 1", color: s <= r.rating ? '#f59e0b' : '#e2e8f0' }}>
                              star
                            </span>
                          ))}
                        </div>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
