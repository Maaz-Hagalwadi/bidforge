import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from './AdminLayout';
import { adminApi, type AdminStats, type AdminUser, type AdminJob } from '@/api/admin';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function StatCard({ icon, label, value, sub, color, onClick }: {
  icon: string; label: string; value: string | number; sub?: string; color: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`tonal-card p-5 rounded-xl flex items-start gap-4 ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-secondary/30 transition-all' : ''}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <span className="material-symbols-outlined text-[22px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-on-surface leading-none">{value}</p>
        {sub && <p className="text-xs text-on-surface-variant mt-1">{sub}</p>}
      </div>
    </div>
  );
}

const JOB_STATUS_CLS: Record<string, string> = {
  DRAFT:     'bg-slate-500/10 text-slate-500',
  OPEN:      'bg-secondary/10 text-secondary',
  ASSIGNED:  'bg-green-500/10 text-green-600',
  COMPLETED: 'bg-blue-500/10 text-blue-600',
  CANCELLED: 'bg-red-500/10 text-red-500',
};

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [recentJobs, setRecentJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getStats(),
      adminApi.getUsers(0, 5),
      adminApi.getJobs(0, 5),
    ]).then(([s, u, j]) => {
      setStats(s);
      setRecentUsers(u.content);
      setRecentJobs(j.content);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="p-4 pb-8 lg:p-8 space-y-6 max-w-[1280px] w-full mx-auto">

        {/* Welcome banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Welcome back, {user?.name.split(' ')[0] ?? 'Admin'} 👋</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Here's what's happening on BidForge today.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin/users')}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
              Manage Users
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-secondary text-4xl">progress_activity</span>
          </div>
        ) : stats ? (
          <>
            {/* Primary stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              <StatCard icon="group"       label="Total Users"   value={stats.totalUsers.toLocaleString()}       sub={`${stats.bannedUsers} banned`}     color="bg-secondary"   onClick={() => navigate('/admin/users')} />
              <StatCard icon="person"      label="Clients"       value={stats.totalClients.toLocaleString()}                                             color="bg-blue-500"    onClick={() => navigate('/admin/users')} />
              <StatCard icon="engineering" label="Freelancers"   value={stats.totalFreelancers.toLocaleString()}                                         color="bg-indigo-500"  onClick={() => navigate('/admin/users')} />
              <StatCard icon="work"        label="Total Jobs"    value={stats.totalJobs.toLocaleString()}         sub={`${stats.openJobs} open`}          color="bg-violet-500"  onClick={() => navigate('/admin/jobs')} />
              <StatCard icon="handshake"   label="Contracts"     value={stats.totalContracts.toLocaleString()}    sub={`${stats.activeContracts} active`}  color="bg-emerald-500" />
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard icon="task_alt"        label="Completed Contracts"   value={stats.completedContracts.toLocaleString()} color="bg-teal-500"   />
              <StatCard icon="payments"        label="Platform Revenue"      value={`$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="Released payments" color="bg-amber-500" onClick={() => navigate('/admin/revenue')} />
              <StatCard icon="pending_actions" label="Pending Verifications" value={stats.pendingVerifications.toLocaleString()} color="bg-orange-400" onClick={() => navigate('/admin/users')} />
            </div>

            {/* Recent activity — 2 col */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Recent Users */}
              <div className="tonal-card rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
                  <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[18px]">group</span>
                    Recently Joined Users
                  </h3>
                  <button onClick={() => navigate('/admin/users')} className="text-xs text-secondary font-semibold hover:underline">View all →</button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {recentUsers.length === 0 ? (
                    <p className="text-sm text-on-surface-variant text-center py-8">No users yet</p>
                  ) : recentUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      {u.profileImageUrl ? (
                        <img src={u.profileImageUrl} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt={u.name} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-secondary text-xs flex-shrink-0 select-none">
                          {getInitials(u.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{u.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-on-surface-variant rounded text-xs font-semibold">
                          {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                        </span>
                        {u.banned && (
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-xs font-semibold">Banned</span>
                        )}
                        <span className="text-xs text-on-surface-variant">{timeAgo(u.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Jobs */}
              <div className="tonal-card rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
                  <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[18px]">work</span>
                    Recently Posted Jobs
                  </h3>
                  <button onClick={() => navigate('/admin/jobs')} className="text-xs text-secondary font-semibold hover:underline">View all →</button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {recentJobs.length === 0 ? (
                    <p className="text-sm text-on-surface-variant text-center py-8">No jobs yet</p>
                  ) : recentJobs.map(j => {
                    const stCls = JOB_STATUS_CLS[j.status] ?? 'bg-slate-500/10 text-slate-500';
                    const label = j.status.charAt(0) + j.status.slice(1).toLowerCase();
                    return (
                      <div key={j.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-violet-500 text-[16px]">work</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">{j.title}</p>
                          <p className="text-xs text-on-surface-variant">{j.category}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${stCls}`}>{label}</span>
                          <span className="text-xs text-on-surface-variant">{timeAgo(j.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: 'group',      title: 'User Management',  desc: 'View, search, ban or remove users from the platform.', path: '/admin/users',    btnLabel: 'Manage Users',  btnIcon: 'manage_accounts' },
                { icon: 'fact_check', title: 'Job Moderation',   desc: 'Monitor and moderate all jobs posted on the platform.', path: '/admin/jobs',    btnLabel: 'View All Jobs', btnIcon: 'format_list_bulleted' },
                { icon: 'gavel',      title: 'Disputes',          desc: 'Review and resolve open disputes between users.',       path: '/admin/disputes', btnLabel: 'View Disputes', btnIcon: 'gavel' },
              ].map(card => (
                <div key={card.title} className="tonal-card rounded-xl p-5">
                  <h3 className="text-base font-bold text-on-surface mb-1.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">{card.icon}</span>
                    {card.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant mb-4">{card.desc}</p>
                  <button onClick={() => navigate(card.path)}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all">
                    <span className="material-symbols-outlined text-[18px]">{card.btnIcon}</span>
                    {card.btnLabel}
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
