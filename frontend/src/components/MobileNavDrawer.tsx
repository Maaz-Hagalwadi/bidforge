import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SidebarLink } from '@/constants/sidebar';

interface Props {
  open: boolean;
  onClose: () => void;
  links: (SidebarLink & { active: boolean })[];
  onLogout: () => void;
}

export function MobileNavDrawer({ open, onClose, links, onLogout }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#0A192F' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="text-white font-bold text-base tracking-wide">BidForge</span>
          <button onClick={onClose} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {links.map(({ icon, label, active, path }) => (
            <button
              key={label}
              onClick={() => { if (path) { navigate(path); onClose(); } }}
              className={[
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 font-medium text-sm',
                active
                  ? 'bg-white/10 text-white font-bold border-l-4 border-secondary pl-3'
                  : path
                  ? 'text-white/60 hover:bg-white/10 hover:text-white'
                  : 'text-white/30 cursor-default',
              ].join(' ')}
            >
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-colors font-medium text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
