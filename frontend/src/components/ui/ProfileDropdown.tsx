import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { userApi } from '@/api/user';
import type { UserProfile } from '@/types/user';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function UpdateProfileModal({ user, onClose, onUpdated }: {
  user: UserProfile;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [photo, setPhoto] = useState(user.profileImageUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setErr('');
    try {
      const updated = await userApi.uploadProfileImage(file);
      setPhoto(updated.profileImageUrl ?? '');
      await onUpdated();
    } catch {
      setErr('Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true); setErr('');
    try {
      await userApi.updateMe({ name: name.trim() });
      await onUpdated();
      onClose();
    } catch {
      setErr('Update failed. Please try again.');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div onMouseDown={e => e.nativeEvent.stopImmediatePropagation()}>
      <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md bg-white dark:bg-[#0d1c32] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden pointer-events-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Update Profile</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">

            {/* Avatar upload */}
            <div className="flex items-center gap-4">
              <div className="relative group flex-shrink-0 cursor-pointer" onClick={() => !uploading && fileRef.current?.click()}>
                {photo ? (
                  <img src={photo} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600" alt="Avatar" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-xl select-none">
                    {getInitials(name || user.name)}
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
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{name || user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                <button
                  onClick={() => !uploading && fileRef.current?.click()}
                  disabled={uploading}
                  className="mt-1 text-xs font-semibold text-secondary hover:underline disabled:opacity-50 transition-opacity"
                >
                  {uploading ? 'Uploading…' : 'Change Photo'}
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Your full name"
              />
            </div>

            {err && <p className="text-xs text-red-500">{err}</p>}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <button
              disabled={saving || uploading || !name.trim()}
              onClick={handleSave}
              className="flex-1 bg-secondary text-white text-sm font-semibold py-2.5 rounded-xl hover:brightness-110 disabled:opacity-60 transition-all"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ProfileDropdown({ user, onUpdated, onLogout }: {
  user: UserProfile;
  onUpdated: () => Promise<void>;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const initials = getInitials(user.name);

  return (
    <>
      <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#0d1c32] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          {user.profileImageUrl ? (
            <img src={user.profileImageUrl} className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" alt={user.name} />
          ) : (
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-lg flex-shrink-0 select-none">{initials}</div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{user.email}</p>
            {user.phoneNumber && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.phoneNumber}</p>
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

        <div className="p-2">
          <Link
            to={`/profile/${user.id}`}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-slate-500 dark:text-slate-400">person</span>
            View Profile
          </Link>
          <button
            onClick={() => setEditOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
          >
            <span className="material-symbols-outlined text-[20px] text-slate-500 dark:text-slate-400">manage_accounts</span>
            Update Profile
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
          >
            <span className="material-symbols-outlined text-[20px] text-slate-500 dark:text-slate-400">settings</span>
            Settings
          </button>
          <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-left">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign Out
          </button>
        </div>
      </div>

      {editOpen && (
        <UpdateProfileModal
          user={user}
          onClose={() => setEditOpen(false)}
          onUpdated={onUpdated}
        />
      )}
    </>
  );
}
