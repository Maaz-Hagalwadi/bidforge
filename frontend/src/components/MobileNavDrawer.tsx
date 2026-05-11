import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import type { SidebarLink } from '@/constants/sidebar';

interface Props {
  open: boolean;
  onClose: () => void;
  links: (SidebarLink & { active: boolean })[];
  onLogout: () => void;
}

export function MobileNavDrawer({ open, onClose, links, onLogout }: Props) {
  const navigate = useNavigate();
  const { theme } = useTheme();

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
        style={{ backgroundColor: theme === 'dark' ? '#0A192F' : '#ffffff' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <span className="text-slate-900 dark:text-white font-bold text-base tracking-wide">BidForge</span>
          <button onClick={onClose} className="p-1.5 text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
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
                  ? 'bg-secondary/10 dark:bg-white/10 text-secondary dark:text-white font-bold border-l-4 border-secondary pl-3'
                  : path
                  ? 'text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                  : 'text-slate-300 dark:text-white/30 cursor-default',
              ].join(' ')}
            >
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-slate-200 dark:border-white/10">
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-500 dark:text-white/60 hover:bg-red-500/10 dark:hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400 transition-colors font-medium text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
