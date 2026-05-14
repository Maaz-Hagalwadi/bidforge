import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { NotificationBell } from '@/components/NotificationBell';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { MobileNavDrawer } from '@/components/MobileNavDrawer';
import { CLIENT_SIDEBAR, FREELANCER_SIDEBAR, ADMIN_SIDEBAR, withActive } from '@/constants/sidebar';
import { Toast } from '@/components/Toast';
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

function getAuthInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

interface EditProfileModalProps {
  form: { name: string; title: string; bio: string; location: string; hourlyRate: string; skills: string; profileImageUrl: string; };
  saving: boolean;
  saveErr: string;
  onChange: (field: string, value: string) => void;
  onPhotoUploaded: (url: string) => void;
  onSave: () => void;
  onClose: () => void;
}

function EditProfileModal({ form, saving, saveErr, onChange, onPhotoUploaded, onSave, onClose }: EditProfileModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadErr('');
    try {
      const updated = await userApi.uploadProfileImage(file);
      onPhotoUploaded(updated.profileImageUrl ?? '');
    } catch {
      setUploadErr('Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [onPhotoUploaded]);

  return createPortal(
    <div onMouseDown={e => e.nativeEvent.stopImmediatePropagation()}>
      <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <h2 className="text-base font-bold text-slate-900">Edit Profile</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5">

            {/* Photo upload */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
              <div className="relative group flex-shrink-0 cursor-pointer" onClick={() => !uploading && fileRef.current?.click()}>
                {form.profileImageUrl ? (
                  <img src={form.profileImageUrl} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" alt="Avatar" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-xl select-none">
                    {(form.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
                {uploading ? (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="material-symbols-outlined text-white text-[20px]">camera_alt</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-0.5">Profile Photo</p>
                <p className="text-xs text-slate-500 mb-1.5">JPG, PNG or WebP · max 10 MB</p>
                <button onClick={() => !uploading && fileRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                  <span className="material-symbols-outlined text-[15px]">upload</span>
                  {uploading ? 'Uploading…' : 'Upload Photo'}
                </button>
                {uploadErr && <p className="text-xs text-red-500 mt-1">{uploadErr}</p>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input value={form.name} onChange={e => onChange('name', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors"
                  placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Professional Title</label>
                <input value={form.title} onChange={e => onChange('title', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors"
                  placeholder="e.g. Full Stack Developer" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Location</label>
                <input value={form.location} onChange={e => onChange('location', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors"
                  placeholder="e.g. New York, USA" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Hourly Rate (USD)</label>
                <input type="number" min={0} value={form.hourlyRate} onChange={e => onChange('hourlyRate', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors"
                  placeholder="e.g. 50" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Skills (comma-separated)</label>
                <input value={form.skills} onChange={e => onChange('skills', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors"
                  placeholder="React, TypeScript, Node.js, PostgreSQL" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">About / Bio</label>
                <textarea rows={4} value={form.bio} onChange={e => onChange('bio', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
                  placeholder="Tell clients about yourself…" />
              </div>
            </div>
            {saveErr && <p className="mt-3 text-xs text-red-500">{saveErr}</p>}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
            <button onClick={onSave} disabled={saving || uploading}
              className="flex-1 bg-secondary text-white text-sm font-semibold py-2.5 rounded-xl hover:brightness-110 disabled:opacity-60 transition-all">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const fromParam = new URLSearchParams(search).get('from');
  const fromAdmin = fromParam?.startsWith('admin') ?? false;
  const adminActivePath = fromParam === 'admin-jobs' ? '/admin/jobs' : '/admin/users';
  const { user: currentUser, logout, refreshUser } = useAuth();
  const { theme } = useTheme();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const sidebarLinks = withActive(
    isAdmin ? ADMIN_SIDEBAR
    : currentUser?.role === 'FREELANCER' ? FREELANCER_SIDEBAR
    : CLIENT_SIDEBAR,
    isAdmin ? adminActivePath : pathname
  );

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const navRight = currentUser ? (
    <div className="flex items-center gap-1">
      <NotificationBell />
      <div className="relative" ref={profileRef}>
        <button onClick={() => setProfileOpen(o => !o)} aria-expanded={profileOpen} aria-label="Profile menu"
          className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          {currentUser.profileImageUrl ? (
            <img src={currentUser.profileImageUrl} className="w-8 h-8 rounded-full object-cover border-2 border-slate-300 dark:border-white/20" alt={currentUser.name} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-slate-900 dark:text-white text-sm font-bold select-none">{getAuthInitials(currentUser.name)}</div>
          )}
          <span className="material-symbols-outlined text-slate-900 dark:text-white/60 text-base leading-none">expand_more</span>
        </button>
        {profileOpen && <ProfileDropdown user={currentUser} onUpdated={refreshUser} onLogout={handleLogout} />}
      </div>
    </div>
  ) : null;

  const navLeft = currentUser ? (
    <button onClick={() => setDrawerOpen(true)} className="p-1.5 text-slate-900 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors" aria-label="Open menu">
      <span className="material-symbols-outlined text-[22px]">menu</span>
    </button>
  ) : null;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reviews, setReviews] = useState<ReviewResponse[]>([]);

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({ title: '', description: '', imageUrl: '', projectUrl: '', technologies: '' });
  const [portfolioSaving, setPortfolioSaving] = useState(false);
  const [portfolioErr, setPortfolioErr] = useState('');

  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [editPortfolioForm, setEditPortfolioForm] = useState({ title: '', description: '', imageUrl: '', projectUrl: '', technologies: '' });
  const [editPortfolioSaving, setEditPortfolioSaving] = useState(false);
  const [editPortfolioErr, setEditPortfolioErr] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

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
      showToast('Profile updated successfully!', 'success');
    } catch {
      setSaveErr('Failed to save changes. Please try again.');
      showToast('Failed to save changes.', 'error');
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

  const startEditPortfolio = (item: PortfolioItem) => {
    setEditingPortfolioId(item.id);
    setEditPortfolioForm({
      title: item.title,
      description: item.description ?? '',
      imageUrl: item.imageUrl ?? '',
      projectUrl: item.projectUrl ?? '',
      technologies: item.technologies ?? '',
    });
    setEditPortfolioErr('');
  };

  const handleUpdatePortfolio = async () => {
    if (!editingPortfolioId || !editPortfolioForm.title.trim()) return;
    setEditPortfolioSaving(true); setEditPortfolioErr('');
    try {
      const updated = await userApi.updatePortfolioItem(editingPortfolioId, {
        title: editPortfolioForm.title.trim(),
        description: editPortfolioForm.description.trim() || undefined,
        imageUrl: editPortfolioForm.imageUrl.trim() || undefined,
        projectUrl: editPortfolioForm.projectUrl.trim() || undefined,
        technologies: editPortfolioForm.technologies.trim() || undefined,
      });
      setPortfolio(p => p.map(i => i.id === editingPortfolioId ? updated : i));
      setEditingPortfolioId(null);
    } catch {
      setEditPortfolioErr('Failed to update portfolio item.');
    } finally {
      setEditPortfolioSaving(false);
    }
  };

  const handleDeletePortfolio = async (itemId: string) => {
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

  const handleFormChange = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const sharedNav = (
    <>
      <Navbar variant="app" authRight={navRight} navLeft={navLeft} />
      {currentUser && <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} links={sidebarLinks} onLogout={handleLogout} />}
    </>
  );

  const sharedSidebar = currentUser ? (
    <aside
      className={['hidden lg:flex flex-col sticky top-16 h-[calc(100vh-4rem)] border-r border-slate-200 dark:border-white/10 transition-[width] duration-300 ease-in-out overflow-hidden flex-shrink-0', sidebarOpen ? 'w-64' : 'w-16'].join(' ')}
      style={{ backgroundColor: theme === 'dark' ? '#0A192F' : '#ffffff' }}
    >
      <div className={`flex items-center h-14 border-b border-slate-200 dark:border-white/10 px-3 flex-shrink-0 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
        {sidebarOpen && <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white/60 select-none">{isAdmin ? 'Admin Panel' : 'Menu'}</span>}
        <button onClick={() => setSidebarOpen(o => !o)} className="p-1.5 text-slate-900 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-xl">{sidebarOpen ? 'menu_open' : 'menu'}</span>
        </button>
      </div>
      <nav className="flex-1 min-h-0 py-2 px-2 space-y-0.5 overflow-y-auto">
        {sidebarLinks.map(({ icon, label, active, path }) => (
          <button key={label} onClick={() => path && navigate(path)} title={!sidebarOpen ? label : undefined}
            className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150 font-medium', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-slate-100 dark:bg-white/20 text-slate-900 dark:text-white font-bold border-l-4 border-secondary' : path ? 'text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white' : 'text-slate-300 dark:text-white/30 cursor-default'].join(' ')}>
            <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
            {sidebarOpen && <span className="text-sm truncate">{label}</span>}
          </button>
        ))}
      </nav>
      <div className="mt-auto p-3 border-t border-slate-200 dark:border-white/10 flex-shrink-0">
        <button onClick={handleLogout} title={!sidebarOpen ? 'Sign Out' : undefined}
          className={['w-full flex items-center gap-3 rounded-lg py-2.5 text-slate-900 dark:text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors', sidebarOpen ? 'px-3' : 'justify-center px-2'].join(' ')}>
          <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
          {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  ) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        {sharedNav}
        <div className="flex flex-1 min-h-0">
          {sharedSidebar}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        {sharedNav}
        <div className="flex flex-1 min-h-0">
          {sharedSidebar}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">person_off</span>
              <p className="mt-3 text-on-surface-variant text-lg">{error || 'Profile not found.'}</p>
            </div>
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
    <div className="min-h-screen flex flex-col bg-surface">
      {sharedNav}
      <div className="flex flex-1 min-h-0">
        {sharedSidebar}
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">

          {/* Admin viewing banner */}
          {isAdmin && (
            <div className="flex items-center gap-3 px-6 py-2.5 bg-secondary/10 border-b border-secondary/20">
              <span className="material-symbols-outlined text-secondary text-[18px]">admin_panel_settings</span>
              <span className="text-sm font-semibold text-secondary">Admin View</span>
              <span className="text-sm text-on-surface-variant">— viewing as admin</span>
              {fromAdmin && (
                <button onClick={() => window.close()}
                  className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline">
                  <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                  Close Tab
                </button>
              )}
            </div>
          )}

          {/* Hero Banner */}
          <div className="relative h-40 md:h-48 flex-shrink-0 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0A192F 0%, #0d2444 45%, #0059bb 100%)' }}>
            <div className="absolute inset-0"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            <div className="absolute bottom-0 left-0 right-0 h-16"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(10,25,47,0.18))' }} />
          </div>

          {/* Profile identity — overlaps hero */}
          <div className="max-w-[1280px] w-full mx-auto px-4 md:px-8">
            <div className="-mt-14 md:-mt-16 relative z-10 mb-6 p-5 md:p-6 bg-white rounded-2xl border border-outline-variant shadow-[0px_12px_30px_rgba(10,25,47,0.12)]">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">

                {/* Avatar */}
                {displayPhoto ? (
                  <img src={displayPhoto} alt={displayName}
                    className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-white dark:border-[#0A192F] shadow-xl flex-shrink-0"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-4xl border-4 border-white dark:border-[#0A192F] shadow-xl flex-shrink-0 select-none">
                    {getInitials(profile.name)}
                  </div>
                )}

                {/* Name / title / stats + action buttons */}
                <div className="flex-1 min-w-0 sm:pb-1 flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h1 className="text-2xl md:text-3xl font-bold text-on-surface">{profile.name}</h1>
                      <span className="px-2.5 py-0.5 bg-secondary/10 text-secondary border border-secondary/20 text-xs font-semibold rounded-full">
                        {profile.role.charAt(0) + profile.role.slice(1).toLowerCase()}
                      </span>
                    </div>
                    {profile.title && (
                      <p className="text-base text-on-surface-variant font-medium mb-2">{profile.title}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-on-surface-variant">
                      {reviews.length > 0 && (() => {
                        const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
                        return (
                          <span className="flex items-center gap-1 text-amber-500 font-semibold">
                            <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            {avg.toFixed(1)}
                            <span className="text-on-surface-variant font-normal ml-0.5">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                          </span>
                        );
                      })()}
                      {profile.hourlyRate != null && (
                        <span className="flex items-center gap-1 font-semibold text-secondary">
                          <span className="material-symbols-outlined text-[15px]">payments</span>
                          ${profile.hourlyRate}/hr
                        </span>
                      )}
                      {profile.location && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">location_on</span>
                          {profile.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                        Member since {formatMemberSince(profile.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    {isOwnProfile ? (
                      !editing && (
                        <button onClick={() => setEditing(true)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-secondary border border-secondary/30 rounded-xl hover:bg-secondary/5 transition-colors">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          Edit Profile
                        </button>
                      )
                    ) : (
                      <>
                        <button className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant text-on-surface text-sm font-semibold rounded-xl hover:bg-surface-container transition-colors">
                          <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                          Message
                        </button>
                        <button className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all">
                          <span className="material-symbols-outlined text-[16px]">handshake</span>
                          Hire
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Two-column content */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-6 pb-10">

              {/* Left column */}
              <div className="md:col-span-4 flex flex-col gap-5">

                {/* About */}
                <div className="tonal-card rounded-xl border border-outline-variant p-5">
                  <h2 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">person</span>
                    About
                  </h2>
                  {displayBio ? (
                    <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{displayBio}</p>
                  ) : (
                    <p className="text-sm text-on-surface-variant italic">No bio provided yet.</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-outline-variant space-y-2.5">
                    {displayLocation && (
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        {displayLocation}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                      Joined {formatMemberSince(profile.createdAt)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                      {profile.email}
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="tonal-card rounded-xl border border-outline-variant p-5">
                  <h2 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">psychology</span>
                    Skills & Expertise
                  </h2>
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skills.map(skill => (
                        <span key={skill} className="px-3 py-1 text-xs font-semibold rounded-full bg-secondary/10 text-secondary">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface-variant italic">No skills listed yet.</p>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="md:col-span-8 flex flex-col gap-5">

                {/* Portfolio */}
                <div className="tonal-card rounded-xl border border-outline-variant p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-secondary">grid_view</span>
                      Portfolio
                    </h2>
                    {isOwnProfile && !showPortfolioForm && (
                      <button onClick={() => setShowPortfolioForm(true)}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined text-[15px]">add</span>
                        Add Item
                      </button>
                    )}
                  </div>

                  {showPortfolioForm && isOwnProfile && (
                    <div className="mb-5 p-4 border border-outline-variant rounded-xl bg-surface-container">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div className="sm:col-span-2">
                          <input value={portfolioForm.title}
                            onChange={e => setPortfolioForm(f => ({ ...f, title: e.target.value }))}
                            className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:border-secondary"
                            placeholder="Project title *" />
                        </div>
                        <div className="sm:col-span-2">
                          <textarea rows={2} value={portfolioForm.description}
                            onChange={e => setPortfolioForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:border-secondary resize-none"
                            placeholder="Description" />
                        </div>
                        <input value={portfolioForm.imageUrl}
                          onChange={e => setPortfolioForm(f => ({ ...f, imageUrl: e.target.value }))}
                          className="border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:border-secondary"
                          placeholder="Image URL" />
                        <input value={portfolioForm.projectUrl}
                          onChange={e => setPortfolioForm(f => ({ ...f, projectUrl: e.target.value }))}
                          className="border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:border-secondary"
                          placeholder="Project URL" />
                        <div className="sm:col-span-2">
                          <input value={portfolioForm.technologies}
                            onChange={e => setPortfolioForm(f => ({ ...f, technologies: e.target.value }))}
                            className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:border-secondary"
                            placeholder="Technologies (e.g. React, Node.js)" />
                        </div>
                      </div>
                      {portfolioErr && <p className="text-xs text-red-500 mb-2">{portfolioErr}</p>}
                      <div className="flex gap-2">
                        <button onClick={handleAddPortfolio} disabled={portfolioSaving || !portfolioForm.title.trim()}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-secondary rounded-xl disabled:opacity-60 hover:brightness-110 transition-all">
                          {portfolioSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button onClick={() => { setShowPortfolioForm(false); setPortfolioErr(''); }}
                          className="px-4 py-1.5 text-xs font-semibold text-on-surface-variant border border-outline-variant rounded-xl hover:bg-surface-container transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {portfolio.length === 0 && !showPortfolioForm ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3">folder_open</span>
                      <p className="text-sm font-semibold text-on-surface-variant">No portfolio items yet</p>
                      {isOwnProfile && <p className="text-xs text-on-surface-variant/70 mt-1">Add your first project above</p>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {portfolio.map(item => (
                        <div key={item.id} className="border border-outline-variant rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-surface">
                          {editingPortfolioId === item.id ? (
                            <div className="p-4 space-y-3">
                              <p className="text-xs font-bold text-on-surface uppercase tracking-wider">Edit Item</p>
                              <input value={editPortfolioForm.title}
                                onChange={e => setEditPortfolioForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:border-secondary"
                                placeholder="Project title *" />
                              <textarea rows={2} value={editPortfolioForm.description}
                                onChange={e => setEditPortfolioForm(f => ({ ...f, description: e.target.value }))}
                                className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:border-secondary resize-none"
                                placeholder="Description" />
                              <input value={editPortfolioForm.imageUrl}
                                onChange={e => setEditPortfolioForm(f => ({ ...f, imageUrl: e.target.value }))}
                                className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:border-secondary"
                                placeholder="Image URL" />
                              <input value={editPortfolioForm.projectUrl}
                                onChange={e => setEditPortfolioForm(f => ({ ...f, projectUrl: e.target.value }))}
                                className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:border-secondary"
                                placeholder="Project URL" />
                              <input value={editPortfolioForm.technologies}
                                onChange={e => setEditPortfolioForm(f => ({ ...f, technologies: e.target.value }))}
                                className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:border-secondary"
                                placeholder="Technologies (e.g. React, Node.js)" />
                              {editPortfolioErr && <p className="text-xs text-red-500">{editPortfolioErr}</p>}
                              <div className="flex gap-2 pt-1">
                                <button onClick={handleUpdatePortfolio} disabled={editPortfolioSaving || !editPortfolioForm.title.trim()}
                                  className="px-4 py-1.5 text-xs font-semibold text-white bg-secondary rounded-xl disabled:opacity-60 hover:brightness-110 transition-all">
                                  {editPortfolioSaving ? 'Saving…' : 'Save'}
                                </button>
                                <button onClick={() => setEditingPortfolioId(null)}
                                  className="px-4 py-1.5 text-xs font-semibold text-on-surface-variant border border-outline-variant rounded-xl hover:bg-surface-container transition-colors">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.title}
                                  className="w-full h-36 object-cover"
                                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                              )}
                              <div className="p-3.5">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="text-sm font-semibold text-on-surface leading-tight">{item.title}</p>
                                  {isOwnProfile && (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <button onClick={() => startEditPortfolio(item)}
                                        className="text-on-surface-variant/50 hover:text-secondary transition-colors" title="Edit">
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                      </button>
                                      <button onClick={() => handleDeletePortfolio(item.id)}
                                        className="text-on-surface-variant/50 hover:text-red-400 transition-colors" title="Delete">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {item.description && <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{item.description}</p>}
                                {item.technologies && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {item.technologies.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                                      <span key={t} className="px-2 py-0.5 text-[11px] font-medium bg-secondary/10 text-secondary rounded-full">{t}</span>
                                    ))}
                                  </div>
                                )}
                                {item.projectUrl && (
                                  <a href={item.projectUrl} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-secondary mt-2 hover:underline">
                                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                    View Project
                                  </a>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reviews */}
                <div className="tonal-card rounded-xl border border-outline-variant p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-secondary">reviews</span>
                      Reviews
                    </h2>
                    {reviews.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                        </span>
                        <span className="text-xs text-on-surface-variant">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {reviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3">rate_review</span>
                      <p className="text-sm font-semibold text-on-surface-variant">No reviews yet</p>
                      <p className="text-xs text-on-surface-variant/70 mt-1">Reviews appear after completed contracts</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map(r => (
                        <div key={r.id} className="border border-outline-variant rounded-xl p-4 bg-surface">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="text-sm font-semibold text-on-surface">{r.reviewerName}</p>
                              <p className="text-xs text-on-surface-variant">{r.jobTitle}</p>
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {[1, 2, 3, 4, 5].map(s => (
                                <span key={s} className="material-symbols-outlined text-[15px] leading-none"
                                  style={{ fontVariationSettings: "'FILL' 1", color: s <= r.rating ? '#f59e0b' : '#e2e8f0' }}>
                                  star
                                </span>
                              ))}
                            </div>
                          </div>
                          {r.comment && <p className="text-sm text-on-surface-variant leading-relaxed">{r.comment}</p>}
                          <p className="text-xs text-on-surface-variant/60 mt-2">
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
        </main>
      </div>

      {editing && isOwnProfile && (
        <EditProfileModal
          form={form}
          saving={saving}
          saveErr={saveErr}
          onChange={handleFormChange}
          onPhotoUploaded={url => handleFormChange('profileImageUrl', url)}
          onSave={handleSave}
          onClose={cancelEdit}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
