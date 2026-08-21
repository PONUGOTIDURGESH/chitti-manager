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
  <div className="space-y-4 pb-6">

    {/* ================================================= */}
    {/* HEADER */}
    {/* ================================================= */}

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">
          Overview
        </p>

        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-white">
          {getGreeting()}
        </h1>

        <p className="mt-0.5 text-xs text-slate-500">
          Track collections, payments and member activity.
        </p>
      </div>

      <div className="w-full sm:w-auto">
        <ChittiSelector
          chittis={chittis}
          selectedId={selectedChittiId}
          onSelect={setSelectedChittiId}
        />
      </div>

    </div>


    {/* ================================================= */}
    {/* FINANCIAL SUMMARY */}
    {/* ================================================= */}

    <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-5">

      {/* TOTAL VALUE */}

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">

        <div className="flex items-start justify-between">

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Chitti value
            </p>

            <p className="mt-1 text-lg font-bold text-white">
              {formatMoney(finance.totalExpected)}
            </p>
          </div>

          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/10 text-brand-400">
            <Wallet className="h-4 w-4" />
          </div>

        </div>

      </div>


      {/* COLLECTED */}

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">

        <div className="flex items-start justify-between">

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Collected
            </p>

            <p className="mt-1 text-lg font-bold text-emerald-400">
              {formatMoney(finance.totalCollected)}
            </p>
          </div>

          <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="h-4 w-4" />
          </div>

        </div>

      </div>


      {/* BALANCE */}

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">

        <div className="flex items-start justify-between">

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              To collect
            </p>

            <p className="mt-1 text-lg font-bold text-amber-400">
              {formatMoney(finance.remainingBalance)}
            </p>
          </div>

          <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
            <AlertCircle className="h-4 w-4" />
          </div>

        </div>

      </div>


      {/* MEMBERS */}

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">

        <div className="flex items-start justify-between">

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Members
            </p>

            <p className="mt-1 text-lg font-bold text-white">
              {finance.totalMembers}
            </p>
          </div>

          <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10 text-blue-400">
            <Users className="h-4 w-4" />
          </div>

        </div>

      </div>


      {/* COMPLETED */}

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">

        <div className="flex items-start justify-between">

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Completed
            </p>

            <p className="mt-1 text-lg font-bold text-emerald-400">
              {finance.completedCount}
            </p>
          </div>

          <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>

        </div>

      </div>

    </div>


    {/* ================================================= */}
    {/* COLLECTION + ATTENTION */}
    {/* ================================================= */}

    <div className="grid gap-3 lg:grid-cols-[1.1fr_1.9fr]">

      {/* COLLECTION PROGRESS */}

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4"
      >

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-sm font-semibold text-white">
              Collection progress
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-500">
              Overall collection performance
            </p>
          </div>

          <span className="text-sm font-bold text-brand-400">
            {finance.collectionPercentage.toFixed(1)}%
          </span>

        </div>


        <div className="mt-4 flex items-center gap-4">

          <ProgressRing
            value={finance.totalCollected}
            max={finance.totalExpected || 1}
            size={92}
          />

          <div className="min-w-0 flex-1 space-y-2">

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Collected
              </span>

              <span className="font-semibold text-emerald-400">
                {formatMoney(finance.totalCollected)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Remaining
              </span>

              <span className="font-semibold text-amber-400">
                {formatMoney(finance.remainingBalance)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Members
              </span>

              <span className="font-semibold text-white">
                {finance.totalMembers}
              </span>
            </div>

          </div>

        </div>

      </motion.div>


      {/* MEMBER STATUS */}

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-sm font-semibold text-white">
              Member status
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-500">
              Current collection status
            </p>
          </div>

          <button
            onClick={() => navigate({ name: 'members' })}
            className="text-[11px] font-semibold text-brand-400 hover:text-brand-300"
          >
            View members →
          </button>

        </div>


        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">

          <div className="rounded-lg bg-slate-950/40 px-3 py-2.5">
            <p className="text-[10px] text-slate-500">
              Total
            </p>

            <p className="mt-1 text-lg font-bold text-white">
              {finance.totalMembers}
            </p>
          </div>


          <div className="rounded-lg bg-emerald-500/5 px-3 py-2.5">
            <p className="text-[10px] text-emerald-400">
              Up to date
            </p>

            <p className="mt-1 text-lg font-bold text-emerald-400">
              {finance.upToDateCount}
            </p>
          </div>


          <div className="rounded-lg bg-amber-500/5 px-3 py-2.5">
            <p className="text-[10px] text-amber-400">
              Pending
            </p>

            <p className="mt-1 text-lg font-bold text-amber-400">
              {finance.pendingCount}
            </p>
          </div>


          <div className="rounded-lg bg-brand-500/5 px-3 py-2.5">
            <p className="text-[10px] text-brand-400">
              Completed
            </p>

            <p className="mt-1 text-lg font-bold text-brand-400">
              {finance.completedCount}
            </p>
          </div>

        </div>


        {/* ATTENTION STRIP */}

        <div className="mt-3 flex flex-col gap-2 rounded-lg border border-amber-500/15 bg-amber-500/[0.04] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-2">

            <Bell className="h-3.5 w-3.5 text-amber-400" />

            <span className="text-[11px] text-slate-400">
              <strong className="text-slate-200">
                {pendingMembers.length}
              </strong>{' '}
              members need attention
            </span>

          </div>

          <button
            onClick={() => navigate({ name: 'members' })}
            className="text-left text-[11px] font-semibold text-amber-400 hover:text-amber-300 sm:text-right"
          >
            Review →
          </button>

        </div>

      </div>

    </div>


    {/* ================================================= */}
    {/* QUICK ACTIONS */}
    {/* ================================================= */}

    <div>

      <div className="mb-2 flex items-center justify-between">

        <h2 className="text-sm font-semibold text-white">
          Quick actions
        </h2>

      </div>


      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

        <button
          onClick={() => navigate({ name: 'payments' })}
          className="group flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3.5 py-3 text-left transition hover:border-brand-500/30 hover:bg-slate-900"
        >

          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-400">
            <Plus className="h-4 w-4" />
          </div>

          <div>
            <p className="text-xs font-semibold text-white">
              Add payment
            </p>

            <p className="text-[10px] text-slate-500">
              Record collection
            </p>
          </div>

        </button>


        <button
          onClick={() => navigate({ name: 'members' })}
          className="group flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3.5 py-3 text-left transition hover:border-blue-500/30 hover:bg-slate-900"
        >

          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-blue-400">
            <Users className="h-4 w-4" />
          </div>

          <div>
            <p className="text-xs font-semibold text-white">
              Add member
            </p>

            <p className="text-[10px] text-slate-500">
              Manage members
            </p>
          </div>

        </button>


        <button
          onClick={() => navigate({ name: 'members' })}
          className="group flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3.5 py-3 text-left transition hover:border-amber-500/30 hover:bg-slate-900"
        >

          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
            <AlertCircle className="h-4 w-4" />
          </div>

          <div>
            <p className="text-xs font-semibold text-white">
              Pending
            </p>

            <p className="text-[10px] text-slate-500">
              Review dues
            </p>
          </div>

        </button>


        <button
          onClick={() => navigate({ name: 'members' })}
          className="group flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3.5 py-3 text-left transition hover:border-emerald-500/30 hover:bg-slate-900"
        >

          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <FileText className="h-4 w-4" />
          </div>

          <div>
            <p className="text-xs font-semibold text-white">
              Statements
            </p>

            <p className="text-[10px] text-slate-500">
              Share statements
            </p>
          </div>

        </button>

      </div>

    </div>


    {/* ================================================= */}
    {/* RECENT + NEEDS ATTENTION */}
    {/* ================================================= */}

    <div className="grid gap-3 lg:grid-cols-2">


      {/* RECENT PAYMENTS */}

      <section>

        <div className="mb-2 flex items-center justify-between">

          <div>
            <h2 className="text-sm font-semibold text-white">
              Recent payments
            </h2>

            <p className="text-[10px] text-slate-500">
              Latest recorded collections
            </p>
          </div>

          <button
            onClick={() => navigate({ name: 'payments' })}
            className="text-[11px] font-semibold text-brand-400 hover:text-brand-300"
          >
            View all →
          </button>

        </div>


        {recentPayments.length === 0 ? (

          <div className="flex min-h-[96px] items-center justify-center rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 text-xs text-slate-500">
            No payments recorded yet.
          </div>

        ) : (

          <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/60">

            {recentPayments.map((p) => {

              const m = memberById(p.member_id);

              if (!m) return null;

              return (

                <button
                  key={p.id}
                  onClick={() =>
                    navigate({
                      name: 'member',
                      id: m.id,
                    })
                  }
                  className="flex w-full items-center gap-3 border-b border-slate-800/70 px-3.5 py-2.5 text-left last:border-b-0 hover:bg-slate-800/20"
                >

                  <Avatar
                    name={m.full_name}
                    size={32}
                  />

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-xs font-semibold text-slate-200">
                      {m.full_name}
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {formatDate(p.payment_date)}
                      {' · '}
                      {p.payment_mode}
                    </p>

                  </div>

                  <span className="text-xs font-bold text-emerald-400">
                    +{formatMoney(Number(p.amount))}
                  </span>

                </button>

              );
            })}

          </div>

        )}

      </section>


      {/* NEEDS ATTENTION */}

      <section>

        <div className="mb-2 flex items-center justify-between">

          <div>
            <h2 className="text-sm font-semibold text-white">
              Needs attention
            </h2>

            <p className="text-[10px] text-slate-500">
              Members with pending collections
            </p>
          </div>

          {pendingMembers.length > 0 && (

            <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-400">
              {pendingMembers.length}
            </span>

          )}

        </div>


        {pendingMembers.length === 0 ? (

          <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-slate-800/80 bg-slate-900/60">

            <CheckCircle2 className="h-6 w-6 text-emerald-400" />

            <p className="mt-2 text-xs font-medium text-slate-300">
              All payments are up to date.
            </p>

          </div>

        ) : (

          <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/60">

            {pendingMembers.slice(0, 5).map(
              ({ member: m, finance: f }) => (

                <button
                  key={m.id}
                  onClick={() =>
                    navigate({
                      name: 'member',
                      id: m.id,
                    })
                  }
                  className="flex w-full items-center gap-3 border-b border-slate-800/70 px-3.5 py-2.5 text-left last:border-b-0 hover:bg-slate-800/20"
                >

                  <Avatar
                    name={m.full_name}
                    size={32}
                  />

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-xs font-semibold text-slate-200">
                      {m.full_name}
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {formatMoney(
                        f.remainingBalance
                      )}{' '}
                      remaining
                    </p>

                  </div>

                  <StatusBadge
                    status={f.status}
                    size="sm"
                  />

                </button>

              )
            )}

          </div>

        )}

      </section>

    </div>

  </div>
);
}
