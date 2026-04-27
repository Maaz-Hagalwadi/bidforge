import type { Role } from '@/types/auth';

interface RoleSelectorProps {
  value: Role;
  onChange: (role: Role) => void;
}

interface RoleOption {
  role: Role;
  icon: string;
  label: string;
  ariaLabel: string;
}

const OPTIONS: RoleOption[] = [
  { role: 'CLIENT', icon: 'person_search', label: "I'm a Client", ariaLabel: 'Register as a client' },
  { role: 'FREELANCER', icon: 'work', label: "I'm a Freelancer", ariaLabel: 'Register as a freelancer' },
];

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-md">
      {OPTIONS.map(({ role, icon, label, ariaLabel }) => {
        const selected = value === role;
        return (
          <button
            key={role}
            type="button"
            aria-label={ariaLabel}
            aria-pressed={selected}
            onClick={() => onChange(role)}
            className={[
              'flex flex-col items-center gap-2 p-lg rounded-xl border-2 transition-all duration-200 cursor-pointer w-full',
              selected
                ? 'border-secondary bg-secondary/10 text-white'
                : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700',
            ].join(' ')}
          >
            <span className="material-symbols-outlined text-3xl">{icon}</span>
            <span className="text-label-md">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
