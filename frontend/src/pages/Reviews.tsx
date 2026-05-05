import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLIENT_SIDEBAR, FREELANCER_SIDEBAR, withActive } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';
import { reviewsApi } from '@/api/reviews';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import type { ReviewResponse } from '@/types/review';

const SIDEBAR_BG = '#0A192F';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className="material-symbols-outlined text-[16px] leading-none"
          style={{ fontVariationSettings: "'FILL' 1", color: s <= rating ? '#f59e0b' : '#e2e8f0' }}>
          star
        </span>
      ))}
    </div>
  );
}

function ReviewCard({ review, name }: { review: ReviewResponse; name: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-bold flex-shrink-0 select-none">
            {getInitials(name)}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{name}</p>
            <p className="text-xs text-slate-400">Reviewed</p>
          </div>
        </div>
        <StarRow rating={review.rating} />
      </div>
      <p className="text-xs font-semibold text-secondary mb-2 truncate">{review.jobTitle}</p>
      {review.comment ? (
        <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
      ) : (
        <p className="text-sm text-slate-400 italic">No comment left.</p>
      )}
      <p className="text-xs text-slate-400 mt-3">{formatDate(review.createdAt)}</p>
    </div>
  );
}

export default function Reviews() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const sidebarLinks = withActive(
    user?.role === 'FREELANCER' ? FREELANCER_SIDEBAR : CLIENT_SIDEBAR,
    pathname
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [given, setGiven] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    reviewsApi.getReviewsGiven(user.id)
      .then(g => setGiven(g))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const initials = user ? getInitials(user.name) : '?';

  const navRight = (
    <div className="flex items-center gap-1">
      <NotificationBell />
      <div className="relative" ref={profileRef}>
        <button onClick={() => setProfileOpen(o => !o)} aria-expanded={profileOpen} aria-label="Profile menu"
          className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} className="w-8 h-8 rounded-full object-cover border-2 border-white/20" alt={user.name} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-bold select-none">{initials}</div>
          )}
          <span className="material-symbols-outlined text-white/60 text-base leading-none">expand_more</span>
        </button>
        {profileOpen && user && <ProfileDropdown user={user} onUpdated={refreshUser} onLogout={handleLogout} />}
      </div>
    </div>
  );

  const sidebar = (
    <aside className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-200 ${sidebarOpen ? 'w-60' : 'w-16'}`}
      style={{ backgroundColor: SIDEBAR_BG }}>
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        {sidebarOpen && <span className="text-white font-bold text-sm tracking-wide">BidForge</span>}
        <button onClick={() => setSidebarOpen(o => !o)} className="text-white/60 hover:text-white transition-colors ml-auto">
          <span className="material-symbols-outlined text-xl">{sidebarOpen ? 'menu_open' : 'menu'}</span>
        </button>
      </div>
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {sidebarLinks.map(({ icon, label, active, path }) => (
          <button key={label} onClick={() => path && navigate(path)} title={!sidebarOpen ? label : undefined}
            className={['w-full flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150 font-medium',
              sidebarOpen ? 'px-3' : 'justify-center px-2',
              active ? 'bg-white/10 text-white font-bold border-l-4 border-secondary'
                : path ? 'text-white/60 hover:bg-white/10 hover:text-white'
                : 'text-white/30 cursor-default'].join(' ')}>
            <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
            {sidebarOpen && <span className="text-sm truncate">{label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="app" authRight={navRight} />

      <div className="flex flex-1 min-h-0">
        {sidebar}

        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col bg-surface">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <PageLoader message="Loading reviews…" />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full px-4 md:px-8 py-8">

              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>rate_review</span>
                  My Reviews
                </h1>
                <p className="text-sm text-slate-500 mt-1">Reviews you've written for others after completing contracts.</p>
              </div>

              {/* Stat */}
              <div className="grid grid-cols-1 gap-4 mb-6 max-w-xs">
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm text-center">
                  <p className="text-2xl font-bold text-slate-900">{given.length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Reviews Given</p>
                </div>
              </div>

              {/* Review list */}
              {given.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">rate_review</span>
                  <p className="text-base font-semibold text-slate-400">You haven't given any reviews yet</p>
                  <p className="text-sm text-slate-300 mt-1">After a contract completes, you can leave a review for the other party.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {given.map(r => (
                    <ReviewCard key={r.id} review={r} name={r.revieweeName} />
                  ))}
                </div>
              )}
            </div>
          )}
          <Footer />
        </main>
      </div>

      {/* Mobile bottom nav */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 flex flex-col" style={{ backgroundColor: SIDEBAR_BG }}>
          {[sidebarLinks.slice(0, 4), sidebarLinks.slice(4)].map((row, ri) => (
            <div key={ri} className={`flex items-stretch ${ri === 0 ? 'border-b border-white/10' : ''}`}>
              {row.map(({ icon, short, active, path }) => (
                <button key={short} onClick={() => path && navigate(path)}
                  className={['flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
                    active ? 'text-secondary' : path ? 'text-white/50 hover:text-white' : 'text-white/30 cursor-default'].join(' ')}>
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  <span className="text-[9px] font-semibold leading-none">{short}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}
