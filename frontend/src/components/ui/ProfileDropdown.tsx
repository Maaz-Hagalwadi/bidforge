import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '@/api/user';
import type { UserProfile } from '@/types/user';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function ProfileDropdown({ user, onUpdated, onLogout }: {
  user: UserProfile;
  onUpdated: () => Promise<void>;
  onLogout: () => void;
}) {
  const [mode, setMode] = useState<'view' | 'name' | 'photo'>('view');
  const [name, setName] = useState(user.name);
  const [photo, setPhoto] = useState(user.profileImageUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { setName(user.name); setPhoto(user.profileImageUrl ?? ''); }, [user.name, user.profileImageUrl]);

  const save = useCallback(async (payload: { name?: string; profileImageUrl?: string }) => {
    setSaving(true); setErr('');
    try { await userApi.updateMe(payload); await onUpdated(); setMode('view'); }
    catch { setErr('Update failed. Please try again.'); }
    finally { setSaving(false); }
  }, [onUpdated]);

  const initials = getInitials(user.name);

  return (
    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        {user.profileImageUrl ? (
          <img src={user.profileImageUrl} className="w-12 h-12 rounded-full object-cover border border-slate-200 flex-shrink-0" alt={user.name} />
        ) : (
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-lg flex-shrink-0 select-none">{initials}</div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{user.name}</p>
          <p className="text-sm text-slate-500 truncate">{user.email}</p>
          {user.phoneNumber && (
            <p className="text-xs text-slate-400 truncate mt-0.5">{user.phoneNumber}</p>
          )}
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="inline-block px-2 py-0.5 bg-secondary/10 text-secondary text-xs font-semibold rounded-full">
              {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </span>
            {user.rating != null && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
                <span className="material-symbols-outlined text-[11px]">star</span>
                {user.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {mode === 'view' && (
        <div className="p-2">
          <Link to={`/profile/${user.id}`} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px] text-slate-400">person</span> View Profile
          </Link>
          <button onClick={() => setMode('name')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left">
            <span className="material-symbols-outlined text-[20px] text-slate-400">edit</span> Edit Name
          </button>
          <button onClick={() => setMode('photo')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left">
            <span className="material-symbols-outlined text-[20px] text-slate-400">add_a_photo</span> Change Profile Photo
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors text-left">
            <span className="material-symbols-outlined text-[20px]">logout</span> Sign Out
          </button>
        </div>
      )}

      {mode === 'name' && (
        <div className="p-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save({ name: name.trim() })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary transition-colors" placeholder="Your full name" />
          {err && <p className="text-xs text-red-500 mt-1.5">{err}</p>}
          <div className="flex gap-2 mt-3">
            <button disabled={saving || !name.trim()} onClick={() => save({ name: name.trim() })} className="flex-1 bg-secondary text-white text-sm font-semibold py-2 rounded-lg hover:brightness-110 disabled:opacity-60 transition-all">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => { setMode('view'); setName(user.name); setErr(''); }} className="flex-1 border border-slate-200 text-slate-700 text-sm font-semibold py-2 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {mode === 'photo' && (
        <div className="p-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Photo URL</label>
          {photo && <img src={photo} className="w-14 h-14 rounded-full object-cover border border-slate-200 mb-3" alt="Preview" onError={e => (e.currentTarget.style.display = 'none')} />}
          <input autoFocus value={photo} onChange={e => setPhoto(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary transition-colors" placeholder="https://example.com/photo.jpg" />
          {err && <p className="text-xs text-red-500 mt-1.5">{err}</p>}
          <div className="flex gap-2 mt-3">
            <button disabled={saving} onClick={() => save({ profileImageUrl: photo.trim() || undefined })} className="flex-1 bg-secondary text-white text-sm font-semibold py-2 rounded-lg hover:brightness-110 disabled:opacity-60 transition-all">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => { setMode('view'); setPhoto(user.profileImageUrl ?? ''); setErr(''); }} className="flex-1 border border-slate-200 text-slate-700 text-sm font-semibold py-2 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
