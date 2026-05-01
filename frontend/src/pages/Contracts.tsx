import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, FREELANCER_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';

const SIDEBAR_BG = '#0A192F';

// ── Mock data ─────────────────────────────────────────────────────────────────

interface Milestone {
  label: string;
  status: 'completed' | 'active' | 'pending';
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
}

const MILESTONES: Milestone[] = [
  { label: 'Discovery',      status: 'completed' },
  { label: 'Wireframes',     status: 'completed' },
  { label: 'Final UI Design', status: 'active'   },
  { label: 'Handover',       status: 'pending'   },
];

const SEED_FILES: UploadedFile[] = [
  { id: 'f1', name: 'Wireframe_V2_Final.pdf', size: '4.2 MB', uploadedAt: '2 hours ago' },
  { id: 'f2', name: 'UI_Assets_Pack.zip',    size: '18.7 MB', uploadedAt: '1 day ago'   },
];

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Contracts() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const sidebarLinks = withActive(
    user?.role === 'FREELANCER' ? FREELANCER_SIDEBAR : CLIENT_SIDEBAR,
    pathname
  );

  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [files, setFiles]               = useState<UploadedFile[]>(SEED_FILES);
  const [isDragOver, setIsDragOver]     = useState(false);
  const [toast, setToast]               = useState<string | null>(null);
  const [marked, setMarked]             = useState(false);

  const profileRef  = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  // ── File handling ───────────────────────────────────────────────────────────

  const addFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map(f => ({
      id: `f${Date.now()}-${f.name}`,
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      uploadedAt: 'Just now',
    }));
    setFiles(prev => [...newFiles, ...prev]);
    setToast(`${newFiles.length} file${newFiles.length > 1 ? 's' : ''} uploaded successfully`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  // ── Milestone helpers ───────────────────────────────────────────────────────

  const completedCount = MILESTONES.filter(m => m.status === 'completed').length;
  const progressPct = (completedCount / (MILESTONES.length - 1)) * 100;

  // ── Nav right ──────────────────────────────────────────────────────────────

  const navRight = (
    <div className="flex items-center gap-1">
      <button className="relative p-2 text-white/70 hover:text-white transition-colors" aria-label="Notifications">
        <span className="material-symbols-outlined">notifications</span>
      </button>
      <div className="relative" ref={profileRef}>
        <button onClick={() => setProfileOpen(o => !o)} aria-expanded={profileOpen} aria-label="Profile menu"
          className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} className="w-8 h-8 rounded-full object-cover border-2 border-white/20" alt={user?.name} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-bold select-none">{initials}</div>
          )}
          <span className="material-symbols-outlined text-white/60 text-base leading-none">expand_more</span>
        </button>
        {profileOpen && user && <ProfileDropdown user={user} onUpdated={refreshUser} onLogout={handleLogout} />}
      </div>
    </div>
  );

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      <Navbar variant="app" authRight={navRight} />

      <div className="flex flex-1 min-h-0">
        {/* BidForge sidebar */}
        <aside
          className={[user ? 'hidden lg:flex' : 'hidden', 'flex-col sticky top-16 h-[calc(100vh-4rem)] border-r border-white/10 transition-[width] duration-300 ease-in-out overflow-hidden flex-shrink-0', sidebarOpen ? 'w-64' : 'w-16'].join(' ')}
          style={{ backgroundColor: SIDEBAR_BG }}
        >
          <div className={`flex items-center h-14 border-b border-white/10 px-3 flex-shrink-0 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen && <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 select-none">Menu</span>}
            <button onClick={() => setSidebarOpen(o => !o)} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-xl">{sidebarOpen ? 'menu_open' : 'menu'}</span>
            </button>
          </div>
          <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
            {sidebarLinks.map(({ icon, label, active, path }) => (
              <button key={label} onClick={() => path && navigate(path)} title={!sidebarOpen ? label : undefined}
                className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150 font-medium', sidebarOpen ? 'px-3' : 'justify-center px-2', active ? 'bg-white/10 text-white font-bold border-l-4 border-secondary' : path ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
                {sidebarOpen && <span className="text-sm truncate">{label}</span>}
              </button>
            ))}
          </nav>
          <div className="p-3 space-y-2 border-t border-white/10 flex-shrink-0">
            {sidebarOpen && (
              <div className="bg-white/5 border border-white/10 text-white rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">PRO PLAN</p>
                <p className="text-xs font-semibold leading-relaxed mb-3 text-white/80">Unlimited active contracts and priority support.</p>
                <button className="w-full py-2 bg-secondary rounded-lg text-xs font-bold hover:brightness-110 transition-all">Upgrade Now</button>
              </div>
            )}
            <button onClick={handleLogout} title={!sidebarOpen ? 'Sign Out' : undefined}
              className={['w-full flex items-center gap-3 rounded-lg py-2.5 text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors', sidebarOpen ? 'px-3' : 'justify-center px-2'].join(' ')}>
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
              {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
          <div className="flex-1 p-6 pb-24 lg:pb-8 lg:p-8 max-w-[1280px] w-full mx-auto space-y-6">

            {/* Escrow banner */}
            <div className={`rounded-xl p-4 flex items-center justify-between shadow-sm border ${marked ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${marked ? 'bg-secondary' : 'bg-emerald-500'}`}>
                  <span className="material-symbols-outlined text-[22px]">{marked ? 'task_alt' : 'verified_user'}</span>
                </div>
                <div>
                  <h4 className={`text-base font-bold ${marked ? 'text-secondary' : 'text-emerald-900'}`}>
                    {marked ? 'Completion Submitted' : 'Funds Held in Escrow'}
                  </h4>
                  <p className={`text-sm ${marked ? 'text-secondary/70' : 'text-emerald-700'}`}>
                    {marked
                      ? 'The client has been notified to review your work and release payment.'
                      : 'Project payment of $4,500.00 is secured and will be released upon milestone approval.'}
                  </p>
                </div>
              </div>
              <span className={`hidden sm:inline-flex px-4 py-1.5 text-sm font-semibold rounded-lg border ${marked ? 'bg-white text-secondary border-secondary/20' : 'bg-white text-emerald-600 border-emerald-100'}`}>
                {marked ? 'Awaiting Review' : 'Status: Secured'}
              </span>
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* ── Left 8 cols ── */}
              <section className="lg:col-span-8 space-y-6">

                {/* Contract header card */}
                <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-[0px_4px_12px_rgba(10,25,47,0.05)]">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div className="min-w-0">
                      <span className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-bold rounded-full mb-3">
                        Active Contract #BF-9042
                      </span>
                      <h1 className="text-2xl font-bold text-on-surface leading-tight">
                        Mobile App UI Redesign: Fintech Dashboard
                      </h1>
                      <div className="flex flex-wrap gap-5 mt-4">
                        <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                          <span className="material-symbols-outlined text-secondary text-[18px]">payments</span>
                          Agreed Amount: <strong className="text-on-surface ml-0.5">$4,500.00</strong>
                        </div>
                        <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                          <span className="material-symbols-outlined text-secondary text-[18px]">calendar_today</span>
                          Deadline: <strong className="text-on-surface ml-0.5">Oct 24, 2025</strong>
                        </div>
                        <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                          <span className="material-symbols-outlined text-secondary text-[18px]">person</span>
                          Client: <strong className="text-on-surface ml-0.5">Stellar Labs</strong>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => navigate('/messages')}
                      className="flex items-center gap-2 text-secondary text-sm font-semibold hover:bg-secondary/5 px-4 py-2 rounded-lg transition-colors flex-shrink-0 border border-secondary/20">
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      Open Chat
                    </button>
                  </div>

                  {/* Milestone progress */}
                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-lg font-bold text-on-surface mb-6">Milestone Progress</h3>
                    <div className="relative">
                      {/* Track */}
                      <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100 rounded-full" />
                      <div
                        className="absolute top-5 left-0 h-[2px] bg-secondary rounded-full transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                      />
                      {/* Steps */}
                      <div className="relative flex justify-between">
                        {MILESTONES.map((m, i) => (
                          <div key={m.label} className="flex flex-col items-center">
                            {m.status === 'completed' ? (
                              <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center z-10 shadow-md shadow-secondary/30">
                                <span className="material-symbols-outlined text-[20px]">check</span>
                              </div>
                            ) : m.status === 'active' ? (
                              <div className="w-10 h-10 rounded-full bg-white border-2 border-secondary text-secondary flex items-center justify-center z-10 ring-4 ring-secondary/10">
                                <span className="text-sm font-bold">{i + 1}</span>
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center z-10">
                                <span className="text-sm font-bold">{i + 1}</span>
                              </div>
                            )}
                            <p className={`mt-3 text-sm font-bold text-center leading-tight ${m.status === 'pending' ? 'text-on-surface-variant' : m.status === 'active' ? 'text-secondary' : 'text-on-surface'}`}>
                              {m.label}
                            </p>
                            <p className={`text-xs mt-0.5 font-medium ${m.status === 'completed' ? 'text-emerald-600' : m.status === 'active' ? 'text-secondary' : 'text-slate-400'}`}>
                              {m.status === 'completed' ? 'Completed' : m.status === 'active' ? 'In Progress' : 'Pending'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* File delivery card */}
                <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-[0px_4px_12px_rgba(10,25,47,0.05)]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-on-surface">File Delivery</h3>
                    <span className="text-xs text-on-surface-variant">Accepted: .fig, .pdf, .zip (Max 500 MB)</span>
                  </div>

                  {/* Drop zone */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".fig,.pdf,.zip"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all group ${isDragOver ? 'border-secondary bg-secondary/5 scale-[1.01]' : 'border-slate-200 bg-slate-50/50 hover:bg-secondary/5 hover:border-secondary'}`}
                  >
                    <div className={`w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform ${isDragOver ? 'scale-110' : ''}`}>
                      <span className="material-symbols-outlined text-secondary text-4xl">cloud_upload</span>
                    </div>
                    <p className="text-lg font-bold text-on-surface mb-1">
                      {isDragOver ? 'Release to upload' : 'Drop files to upload'}
                    </p>
                    <p className="text-sm text-on-surface-variant">or click to browse your computer</p>
                  </div>

                  {/* Uploaded files */}
                  {files.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Recently Uploaded</h4>
                      {files.map(f => {
                        const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
                        const iconColor = ext === 'pdf' ? 'bg-orange-100 text-orange-600'
                          : ext === 'zip' ? 'bg-purple-100 text-purple-600'
                          : 'bg-blue-100 text-secondary';
                        const icon = ext === 'pdf' ? 'picture_as_pdf'
                          : ext === 'zip' ? 'folder_zip'
                          : 'description';
                        return (
                          <div key={f.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`p-2 rounded-lg flex-shrink-0 ${iconColor}`}>
                                <span className="material-symbols-outlined text-[22px]">{icon}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-on-surface truncate">{f.name}</p>
                                <p className="text-xs text-on-surface-variant">{f.size} · Uploaded {f.uploadedAt}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                              <button className="p-1.5 text-on-surface-variant hover:text-secondary rounded-lg hover:bg-secondary/5 transition-colors opacity-0 group-hover:opacity-100">
                                <span className="material-symbols-outlined text-[18px]">download</span>
                              </button>
                              <button onClick={() => removeFile(f.id)}
                                className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* ── Right 4 cols ── */}
              <section className="lg:col-span-4 space-y-6">

                {/* Actions card */}
                <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-[0px_4px_12px_rgba(10,25,47,0.05)]">
                  <h3 className="text-lg font-bold text-on-surface mb-5">Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setMarked(true)}
                      disabled={marked}
                      className="w-full bg-secondary text-white py-3.5 rounded-xl text-sm font-bold hover:brightness-110 shadow-lg shadow-secondary/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">{marked ? 'task_alt' : 'check_circle'}</span>
                      {marked ? 'Completion Submitted' : 'Mark as Complete'}
                    </button>
                    <button className="w-full bg-white border border-outline-variant text-on-surface py-3.5 rounded-xl text-sm font-bold hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">schedule</span>
                      Request Milestone Extension
                    </button>
                  </div>
                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary text-[20px] flex-shrink-0 mt-0.5">info</span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Marking as complete will notify the client to review the files and release the escrowed funds.
                    </p>
                  </div>
                </div>

                {/* Contract party card */}
                <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-[0px_4px_12px_rgba(10,25,47,0.05)]">
                  <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-5">Contract Party</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white text-base font-bold flex-shrink-0">AC</div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">Alex Chen</p>
                      <p className="text-xs text-on-surface-variant">Director at Stellar Labs</p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="bg-surface-container rounded-lg p-3">
                      <p className="text-xs text-on-surface-variant mb-1">Jobs Posted</p>
                      <p className="text-sm font-bold text-on-surface">24</p>
                    </div>
                    <div className="bg-surface-container rounded-lg p-3">
                      <p className="text-xs text-on-surface-variant mb-1">Rating</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-bold text-on-surface">4.9</p>
                        <span className="material-symbols-outlined text-yellow-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      </div>
                    </div>
                    <div className="bg-surface-container rounded-lg p-3">
                      <p className="text-xs text-on-surface-variant mb-1">Hire Rate</p>
                      <p className="text-sm font-bold text-on-surface">88%</p>
                    </div>
                    <div className="bg-surface-container rounded-lg p-3">
                      <p className="text-xs text-on-surface-variant mb-1">Total Spent</p>
                      <p className="text-sm font-bold text-on-surface">$200k+</p>
                    </div>
                  </div>
                </div>

                {/* Security badge card */}
                <div className="bg-primary-container rounded-xl p-6 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
                      <h4 className="text-base font-bold">BidForge Protection</h4>
                    </div>
                    <p className="text-sm text-on-primary-container leading-relaxed mb-4">
                      Your work is protected. We ensure payment security for every milestone through our verified escrow system.
                    </p>
                    <button className="px-4 py-2 bg-white text-primary-container text-xs font-bold rounded-lg hover:bg-surface-container-low transition-colors">
                      Learn More
                    </button>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                    <span className="material-symbols-outlined text-[120px]">lock</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <Footer />
        </main>
      </div>

      {/* Mobile bottom nav */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 flex items-stretch" style={{ backgroundColor: '#0A192F' }}>
          {sidebarLinks.map(({ icon, short, active, path }) => (
            <button key={short} onClick={() => path && navigate(path)}
              className={['flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors', active ? 'text-secondary' : path ? 'text-white/50 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
              <span className="text-[10px] font-semibold leading-none">{short}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-on-surface text-inverse-on-surface text-sm font-semibold rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          {toast}
        </div>
      )}
    </div>
  );
}
