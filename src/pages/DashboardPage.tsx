import { motion } from 'framer-motion';
import { Wallet, TrendingUp, AlertCircle, Users, CheckCircle2, ArrowRight, Plus, FileText, Bell } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { ProgressRing } from '@/components/ProgressBar';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { computeChittiFinance, computeMemberFinance } from '@/lib/finance';
import { formatMoney, formatDate, getGreeting } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import type { useAppData } from '@/hooks/useAppData';
import { ChittiSelector } from '@/components/ChittiSelector';

interface Props {
  appData: ReturnType<typeof useAppData>;
  selectedChittiId: string | null;
  setSelectedChittiId: (id: string | null) => void;
}

export function DashboardPage({ appData, selectedChittiId, setSelectedChittiId }: Props) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const {
  chittis,
  members,
  payments,
  schedules,
  loading,
  error,
  refresh,
} = appData;

  const selectedChitti =
  chittis.find((c) => c.id === selectedChittiId) ?? null;

const finance = selectedChitti
  ? computeChittiFinance(
      members.filter(
        (m) => m.chitti_id === selectedChitti.id
      ),
      payments.filter(
        (p) => p.chitti_id === selectedChitti.id
      ),
      selectedChitti,
      schedules.filter(
        (s) => s.chitti_id === selectedChitti.id
      )
    )
  : chittis.reduce(
      (total, chitti) => {
        const chittiMembers = members.filter(
          (m) => m.chitti_id === chitti.id
        );

        const chittiPayments = payments.filter(
          (p) => p.chitti_id === chitti.id
        );

        const chittiSchedules = schedules.filter(
          (s) => s.chitti_id === chitti.id
        );

        const result = computeChittiFinance(
          chittiMembers,
          chittiPayments,
          chitti,
          chittiSchedules
        );

        total.totalExpected += result.totalExpected;
        total.totalCollected += result.totalCollected;
        total.remainingBalance += result.remainingBalance;
        total.totalMembers += result.totalMembers;
        total.upToDateCount += result.upToDateCount;
        total.pendingCount += result.pendingCount;
        total.completedCount += result.completedCount;

        return total;
      },
      {
        totalExpected: 0,
        totalCollected: 0,
        remainingBalance: 0,
        collectionPercentage: 0,
        totalMembers: 0,
        upToDateCount: 0,
        pendingCount: 0,
        completedCount: 0,
      }
    );

if (!selectedChitti && finance.totalExpected > 0) {
  finance.collectionPercentage = Math.min(
    100,
    Math.round(
      (finance.totalCollected / finance.totalExpected) *
        100 *
        100
    ) / 100
  );
}

  const pendingMembers = members
    .filter((m) => !m.archived)
    .map((m) => {
  const chitti = chittis.find(
    (c) => c.id === m.chitti_id
  );

  const chittiSchedules = schedules.filter(
    (s) => s.chitti_id === m.chitti_id
  );

  return {
    member: m,
    finance: computeMemberFinance(
      m,
      payments,
      chitti,
      chittiSchedules
    ),
  };
})
    .filter((x) => ['OVERDUE', 'DUE', 'PARTIALLY_PAID', 'DUE_SOON'].includes(x.finance.status))
    .sort((a, b) => a.finance.remainingBalance - b.finance.remainingBalance)
    .reverse();

  const recentPayments = [...payments]
    .filter((p) => !p.reversed)
    .sort((a, b) => (b.payment_date + b.created_at).localeCompare(a.payment_date + a.created_at))
    .slice(0, 5);

  const memberById = (id: string) => members.find((m) => m.id === id);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  if (chittis.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Welcome to Chitti Manager"
        description="Create your first chitti to start tracking collections and member payments."
        action={
          <button className="btn-primary" onClick={() => navigate({ name: 'chittis' })}>
            <Plus className="h-4 w-4" /> Create chitti
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{getGreeting()},</p>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {user?.email?.split('@')[0] ?? 'Admin'}
          </h1>
        </div>
      </div>

      {/* Chitti selector */}
      <ChittiSelector
        chittis={chittis}
        selectedId={selectedChittiId}
        onSelect={setSelectedChittiId}
      />

      {/* Financial cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total chitti value" value={finance.totalExpected} icon={Wallet} tone="brand" />
        <StatCard label="Total collected" value={finance.totalCollected} icon={TrendingUp} tone="success" />
        <StatCard label="Balance to collect" value={finance.remainingBalance} icon={AlertCircle} tone="warning" />
        <StatCard label="Members" value={finance.totalMembers} icon={Users} sub={`${finance.completedCount} completed`} />
      </div>

      {/* Progress + member stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-col items-center justify-center p-5">
          <ProgressRing value={finance.totalCollected} max={finance.totalExpected} size={140} />
          <p className="mt-3 text-sm font-medium text-slate-500">Overall collection</p>
        </motion.div>

        <div className="card flex flex-col justify-center gap-3 p-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500">Total members</p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{finance.totalMembers}</p>
            </div>
            <div className="rounded-xl bg-success-500/10 p-3">
              <p className="text-xs text-success-600 dark:text-success-500">Up to date</p>
              <p className="mt-1 text-lg font-bold text-success-600 dark:text-success-500">{finance.upToDateCount}</p>
            </div>
            <div className="rounded-xl bg-warning-500/10 p-3">
              <p className="text-xs text-warning-600 dark:text-warning-500">Pending</p>
              <p className="mt-1 text-lg font-bold text-warning-600 dark:text-warning-500">{finance.pendingCount}</p>
            </div>
            <div className="rounded-xl bg-brand-500/10 p-3">
              <p className="text-xs text-brand-600 dark:text-brand-400">Completed</p>
              <p className="mt-1 text-lg font-bold text-brand-600 dark:text-brand-400">{finance.completedCount}</p>
            </div>
          </div>

          {/* Today's attention */}
          <div className="mt-2 rounded-xl border border-warning-500/20 bg-warning-500/5 p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-warning-600" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Today's attention</h3>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
              <span><strong>{pendingMembers.length}</strong> pending</span>
              <span><strong>{formatMoney(pendingMembers.reduce((a, x) => a + x.finance.remainingBalance, 0))}</strong> expected</span>
              <span><strong>{pendingMembers.filter((x) => x.finance.status === 'OVERDUE').length}</strong> overdue</span>
            </div>
            <button
              onClick={() => navigate({ name: 'members' })}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-warning-600 hover:underline"
            >
              View pending <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button onClick={() => navigate({ name: 'payments' })} className="card card-hover flex flex-col items-center gap-2 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/10 text-brand-600"><Plus className="h-5 w-5" /></div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Add payment</span>
        </button>
        <button onClick={() => navigate({ name: 'members' })} className="card card-hover flex flex-col items-center gap-2 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-500/10 text-accent-600"><Users className="h-5 w-5" /></div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Add member</span>
        </button>
        <button onClick={() => navigate({ name: 'members' })} className="card card-hover flex flex-col items-center gap-2 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-warning-500/10 text-warning-600"><AlertCircle className="h-5 w-5" /></div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">View pending</span>
        </button>
        <button onClick={() => navigate({ name: 'members' })} className="card card-hover flex flex-col items-center gap-2 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-success-500/10 text-success-600"><FileText className="h-5 w-5" /></div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Share statement</span>
        </button>
      </div>

      {/* Recent payments */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent payments</h2>
          <button onClick={() => navigate({ name: 'payments' })} className="text-sm font-semibold text-brand-600 hover:underline">
            View all
          </button>
        </div>
        {recentPayments.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-500">No payments recorded yet.</div>
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {recentPayments.map((p) => {
              const m = memberById(p.member_id);
              if (!m) return null;
              return (
                <button
                  key={p.id}
                  onClick={() => navigate({ name: 'member', id: m.id })}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <Avatar name={m.full_name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{m.full_name}</p>
                    <p className="text-xs text-slate-500">{formatDate(p.payment_date)} · {p.payment_mode}</p>
                  </div>
                  <span className="text-sm font-bold text-success-600 dark:text-success-500">+{formatMoney(Number(p.amount))}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Pending members */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Needs attention</h2>
          {pendingMembers.length > 0 && (
            <span className="chip bg-warning-500/10 text-warning-600">{pendingMembers.length}</span>
          )}
        </div>
        {pendingMembers.length === 0 ? (
          <div className="card flex flex-col items-center p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-success-500" />
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">All payments are up to date.</p>
          </div>
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {pendingMembers.slice(0, 5).map(({ member: m, finance: f }) => (
              <button
                key={m.id}
                onClick={() => navigate({ name: 'member', id: m.id })}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <Avatar name={m.full_name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{m.full_name}</p>
                  <p className="text-xs text-slate-500">{formatMoney(f.remainingBalance)} remaining</p>
                </div>
                <StatusBadge status={f.status} size="sm" />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
