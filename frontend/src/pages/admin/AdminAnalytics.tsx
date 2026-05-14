import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { adminApi, type AdminDispute, type AdminJob, type AdminPayment, type AdminStats, type AdminUser, type AnalyticsPoint } from '@/api/admin';
import { PageLoader } from '@/components/ui/PageLoader';

function formatMoney(value: number) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function MetricCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="tonal-card rounded-xl p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <span className="material-symbols-outlined text-white text-[22px]">{icon}</span>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">{label}</p>
        <p className="text-2xl font-bold text-on-surface leading-none">{value}</p>
        {sub && <p className="text-xs text-on-surface-variant mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function BarRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const width = `${Math.max(value ? 8 : 0, pct(value, total))}%`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-on-surface">{label}</p>
        <p className="text-xs font-bold text-on-surface-variant">{value}</p>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width }} />
      </div>
    </div>
  );
}

function Donut({ items }: { items: { label: string; value: number; color: string }[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let acc = 0;
  const stops = items.map(item => {
    const start = acc;
    const end = acc + pct(item.value, total);
    acc = end;
    return `${item.color} ${start}% ${end}%`;
  }).join(', ');

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div
        className="w-36 h-36 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: total ? `conic-gradient(${stops})` : '#e2e8f0' }}
      >
        <div className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
          <span className="text-2xl font-bold text-on-surface">{total}</span>
          <span className="text-[10px] font-bold uppercase text-on-surface-variant">Total</span>
        </div>
      </div>
      <div className="space-y-2 w-full">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-on-surface-variant">{item.label}</span>
            </div>
            <span className="text-sm font-bold text-on-surface">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, color, fmt }: {
  data: AnalyticsPoint[];
  color: string;
  fmt?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map(d => d.value ?? 0));
  const format = fmt ?? ((v: number) => v.toLocaleString());
  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const val = d.value ?? 0;
        const pct = Math.max(val ? 3 : 0, Math.round((val / max) * 100));
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-on-surface-variant w-20 flex-shrink-0 text-right truncate">{d.label}</span>
            <div className="flex-1 h-6 bg-slate-100 dark:bg-white/10 rounded-md overflow-hidden">
              <div
                className="h-full rounded-md flex items-center justify-end pr-2"
                style={{ width: `${pct}%`, backgroundColor: color }}
              >
                <span className="text-[10px] font-bold text-white leading-none whitespace-nowrap">{format(val)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HBarChart({ data, color, fmt }: {
  data: AnalyticsPoint[];
  color: string;
  fmt?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map(d => d.value ?? 0));
  const format = fmt ?? ((v: number) => v.toLocaleString());
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => {
        const val = d.value ?? 0;
        const pct = Math.max(val ? 4 : 0, Math.round((val / max) * 100));
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-on-surface-variant w-32 truncate flex-shrink-0 text-right">{d.label}</span>
            <div className="flex-1 h-6 bg-slate-100 dark:bg-white/10 rounded-md overflow-hidden">
              <div className="h-full rounded-md flex items-center justify-end pr-2"
                style={{ width: `${pct}%`, backgroundColor: color }}>
                <span className="text-[10px] font-bold text-white leading-none">{format(val)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const [revenue, setRevenue] = useState<AnalyticsPoint[]>([]);
  const [signups, setSignups] = useState<AnalyticsPoint[]>([]);
  const [bids, setBids] = useState<AnalyticsPoint[]>([]);
  const [disputeRes, setDisputeRes] = useState<AnalyticsPoint[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getStats(),
      adminApi.getUsers(0, 100),
      adminApi.getJobs(0, 100),
      adminApi.getDisputes(0, 100),
      adminApi.getPayments(0, 100),
    ]).then(([s, u, j, d, p]) => {
      setStats(s);
      setUsers(u.content);
      setJobs(j.content);
      setDisputes(d.content);
      setPayments(p.content);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([
      adminApi.getRevenueAnalytics(),
      adminApi.getUserAnalytics(),
      adminApi.getBidsAnalytics(),
      adminApi.getDisputesAnalytics(),
    ]).then(([r, u, b, d]) => {
      setRevenue(r);
      setSignups(u);
      setBids(b);
      setDisputeRes(d);
    }).finally(() => setChartsLoading(false));
  }, []);

  const clientCount = stats?.totalClients ?? users.filter(u => u.role === 'CLIENT').length;
  const freelancerCount = stats?.totalFreelancers ?? users.filter(u => u.role === 'FREELANCER').length;
  const userTotal = stats?.totalUsers ?? users.length;
  const releasedRevenue = stats?.totalRevenue ?? payments.filter(p => p.status === 'RELEASED').reduce((sum, p) => sum + p.amount, 0);
  const escrowedRevenue = payments.filter(p => p.status === 'ESCROWED').reduce((sum, p) => sum + p.amount, 0);
  const openJobs = stats?.openJobs ?? jobs.filter(j => j.status === 'OPEN').length;
  const activeContracts = stats?.activeContracts ?? 0;
  const completedContracts = stats?.completedContracts ?? 0;
  const disputeOpen = disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length;
  const disputeResolved = disputes.filter(d => d.status === 'RESOLVED' || d.status === 'CLOSED').length;

  const jobStatusCounts = ['OPEN', 'ASSIGNED', 'COMPLETED', 'DRAFT', 'CANCELLED'].map(status => ({
    status,
    value: jobs.filter(j => j.status === status).length,
  }));
  const maxJobStatus = Math.max(1, ...jobStatusCounts.map(j => j.value));

  return (
    <AdminLayout>
      <div className="p-4 pb-8 lg:p-8 space-y-6 max-w-[1280px] w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Analytics</h1>
            <p className="text-sm text-on-surface-variant mt-1">Platform health, revenue, job activity, and dispute workload.</p>
          </div>
          <button onClick={() => navigate('/admin/revenue')}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all self-start md:self-auto">
            <span className="material-symbols-outlined text-[18px]">payments</span>
            Revenue Details
          </button>
        </div>

        {loading ? (
          <PageLoader message="Loading analytics…" />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricCard icon="group" label="Users" value={userTotal.toLocaleString()} sub={`${clientCount} clients, ${freelancerCount} freelancers`} color="bg-secondary" />
              <MetricCard icon="work" label="Open Jobs" value={openJobs.toLocaleString()} sub={`${jobs.length} recently sampled`} color="bg-violet-500" />
              <MetricCard icon="payments" label="Released Revenue" value={formatMoney(releasedRevenue)} sub={`${formatMoney(escrowedRevenue)} in escrow sample`} color="bg-amber-500" />
              <MetricCard icon="gavel" label="Open Disputes" value={disputeOpen.toLocaleString()} sub={`${disputeResolved} resolved or closed`} color="bg-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="tonal-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-bold text-on-surface">User Mix</h2>
                  <span className="text-xs text-on-surface-variant">{userTotal.toLocaleString()} total users</span>
                </div>
                <Donut items={[
                  { label: 'Clients', value: clientCount, color: '#2563eb' },
                  { label: 'Freelancers', value: freelancerCount, color: '#7c3aed' },
                  { label: 'Other/Admin', value: Math.max(0, userTotal - clientCount - freelancerCount), color: '#64748b' },
                ]} />
              </section>

              <section className="tonal-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-bold text-on-surface">Job Pipeline</h2>
                  <span className="text-xs text-on-surface-variant">Latest job sample</span>
                </div>
                <div className="space-y-4">
                  {jobStatusCounts.map(item => (
                    <BarRow
                      key={item.status}
                      label={item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                      value={item.value}
                      total={maxJobStatus}
                      color={item.status === 'OPEN' ? 'bg-secondary' : item.status === 'ASSIGNED' ? 'bg-emerald-500' : item.status === 'COMPLETED' ? 'bg-blue-500' : item.status === 'CANCELLED' ? 'bg-red-500' : 'bg-slate-400'}
                    />
                  ))}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="tonal-card rounded-xl p-6 lg:col-span-2">
                <h2 className="text-sm font-bold text-on-surface mb-5">Marketplace Health</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Active Contracts', value: activeContracts, icon: 'handshake', cls: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Completed Contracts', value: completedContracts, icon: 'task_alt', cls: 'text-blue-600 bg-blue-50' },
                    { label: 'Pending Verifications', value: stats?.pendingVerifications ?? 0, icon: 'pending_actions', cls: 'text-amber-600 bg-amber-50' },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl border border-outline-variant p-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${item.cls}`}>
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      </div>
                      <p className="text-2xl font-bold text-on-surface">{item.value.toLocaleString()}</p>
                      <p className="text-xs font-semibold text-on-surface-variant mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="tonal-card rounded-xl p-6">
                <h2 className="text-sm font-bold text-on-surface mb-5">Payment Sample</h2>
                <div className="space-y-4">
                  <BarRow label="Released" value={payments.filter(p => p.status === 'RELEASED').length} total={Math.max(1, payments.length)} color="bg-emerald-500" />
                  <BarRow label="Escrowed" value={payments.filter(p => p.status === 'ESCROWED').length} total={Math.max(1, payments.length)} color="bg-amber-500" />
                </div>
              </section>
            </div>

            {/* ── Trend Analytics ── */}
            <div className="pt-2">
              <h2 className="text-lg font-bold text-on-surface mb-4">Trend Analytics</h2>
              {chartsLoading ? (
                <PageLoader message="Loading charts…" />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <section className="tonal-card rounded-xl p-6">
                    <h3 className="text-sm font-bold text-on-surface mb-1">Revenue per Month</h3>
                    <p className="text-xs text-on-surface-variant mb-5">Last 12 months</p>
                    {revenue.length === 0
                      ? <p className="text-sm text-on-surface-variant text-center py-8">No data</p>
                      : <BarChart data={revenue} color="#2563eb" fmt={v => `$${v.toLocaleString()}`} />}
                  </section>

                  <section className="tonal-card rounded-xl p-6">
                    <h3 className="text-sm font-bold text-on-surface mb-1">New User Signups</h3>
                    <p className="text-xs text-on-surface-variant mb-5">Per ISO week, last 12 weeks</p>
                    {signups.length === 0
                      ? <p className="text-sm text-on-surface-variant text-center py-8">No data</p>
                      : <BarChart data={signups} color="#7c3aed" />}
                  </section>

                  <section className="tonal-card rounded-xl p-6">
                    <h3 className="text-sm font-bold text-on-surface mb-1">Bids by Job Category</h3>
                    <p className="text-xs text-on-surface-variant mb-5">All-time totals</p>
                    {bids.length === 0
                      ? <p className="text-sm text-on-surface-variant text-center py-8">No data</p>
                      : <HBarChart data={bids} color="#10b981" />}
                  </section>

                  <section className="tonal-card rounded-xl p-6">
                    <h3 className="text-sm font-bold text-on-surface mb-1">Avg Dispute Resolution Time</h3>
                    <p className="text-xs text-on-surface-variant mb-5">Hours per month, last 12 months</p>
                    {disputeRes.length === 0
                      ? <p className="text-sm text-on-surface-variant text-center py-8">No data</p>
                      : <BarChart data={disputeRes} color="#f59e0b" fmt={v => `${v.toFixed(1)}h`} />}
                  </section>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
