import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-fade-in max-w-sm"
      style={{
        backgroundColor: type === 'success' ? '#f0fdf4' : '#fef2f2',
        borderColor: type === 'success' ? '#bbf7d0' : '#fecaca',
      }}
    >
      <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
        {type === 'success' ? 'check_circle' : 'error'}
      </span>
      <p className={`text-sm font-semibold flex-1 ${type === 'success' ? 'text-green-800' : 'text-red-700'}`}>
        {message}
      </p>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}
