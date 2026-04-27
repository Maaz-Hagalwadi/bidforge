interface FormFieldProps {
  label: string;
  id: string;
  icon: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, id, icon, error, children }: FormFieldProps) {
  return (
    <div className="space-y-xs">
      <label htmlFor={id} className="block text-slate-300 text-label-sm ml-xs">
        {label}
      </label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-slate-500 text-xl pointer-events-none">
          {icon}
        </span>
        {children}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
