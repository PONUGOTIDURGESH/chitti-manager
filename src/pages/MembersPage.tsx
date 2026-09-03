import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  Plus,
   Pencil,
  Users,
  UserPlus,
  ChevronRight,
  Phone,
  WalletCards,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from 'lucide-react';

import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import {
  EmptyState,
  ErrorState,
  SkeletonCard,
} from '@/components/States';
import { Modal } from '@/components/Modal';

import {
  computeMemberFinance,
} from '@/lib/finance';

import { formatMoney } from '@/lib/format';
import { memberService } from '@/lib/services';

import { useRouter } from '@/hooks/useRouter';
import { useChitti } from '@/hooks/useChitti';
import { useIsMobile } from '@/hooks/useIsMobile';


import type { useAppData } from '@/hooks/useAppData';
import type {
  ChittiSchedule,
  Member,
} from '@/types';

// ======================================================
// TYPES
// ======================================================

type Filter =
  | 'all'
  | 'up_to_date'
  | 'pending'
  | 'overdue'
  | 'completed'
  | 'archived';

type Sort =
  | 'name_az'
  | 'name_za'
  | 'balance_high'
  | 'balance_low'
  | 'chitti_high'
  | 'chitti_low'
  | 'recent_paid'
  | 'oldest_pending'
  | 'most_remaining'
  | 'completed';

const filterLabels: Record<Filter, string> = {
  all: 'All',
  up_to_date: 'Up to date',
  pending: 'Pending',
  overdue: 'Overdue',
  completed: 'Completed',
  archived: 'Archived',
};

const sortLabels: Record<Sort, string> = {
  name_az: 'Name A → Z',
  name_za: 'Name Z → A',
  balance_high: 'Highest balance',
  balance_low: 'Lowest balance',
  chitti_high: 'Highest chitti amount',
  chitti_low: 'Lowest chitti amount',
  recent_paid: 'Most recently paid',
  oldest_pending: 'Oldest pending',
  most_remaining: 'Most installments remaining',
  completed: 'Completed members',
};

interface Props {
  appData: ReturnType<typeof useAppData>;
}

// ======================================================
// MEMBERS PAGE
// ======================================================

export function MembersPage({
  appData,
}: Props) {
  const {
    members,
    payments,
    chittis,
    allSchedules,
    loading,
    error,
    refresh,
  } = appData;

  const { navigate } = useRouter();

  const {
    selectedChittiId,
  } = useChitti();
const isMobile = useIsMobile();
  const [query, setQuery] =
    useState('');

    const [statementFilter, setStatementFilter] =
  useState<'all' | 'sent' | 'unsent'>('all');

  const [filter, setFilter] =
    useState<Filter>('all');

  const [sort, setSort] =
    useState<Sort>('name_az');

  const [
    showFilter,
    setShowFilter,
  ] = useState(false);

  const [
    showAdd,
    setShowAdd,
  ] = useState(false);
  const [editingMember, setEditingMember] =
  useState<Member | null>(null);

  

  // ====================================================
  // ENRICH MEMBERS WITH SCHEDULE-AWARE FINANCE
  // ====================================================

  const enriched = useMemo(() => {
    return members.map((member) => {
      const chitti = chittis.find(
        (c) =>
          c.id ===
          member.chitti_id
      );

      const memberSchedules =
        allSchedules
          .filter(
            (schedule) =>
              schedule.chitti_id ===
              member.chitti_id
          )
          .sort(
            (a, b) =>
              a.month_number -
              b.month_number
          );

      /*
       * IMPORTANT:
       *
       * Finance now uses:
       *
       * - selected member
       * - payments
       * - chitti lifting settings
       * - monthly schedule
       *
       * This means before/after lifting calculations
       * are respected.
       */

      const finance =
        computeMemberFinance(
          member,
          payments,
          chitti,
          memberSchedules
        );

      const lastPayment =
        payments
          .filter(
            (payment) =>
              payment.member_id ===
                member.id &&
              !payment.reversed
          )
          .sort((a, b) =>
            (
              b.payment_date ||
              ''
            ).localeCompare(
              a.payment_date ||
                ''
            )
          )[0];

      return {
        member,
        finance,
        lastPayment,
        schedules:
          memberSchedules,
      };
    });
  }, [
    members,
    payments,
    chittis,
    allSchedules,
  ]);

  // ====================================================
  // FILTER + SORT
  // ====================================================

  const filtered = useMemo(() => {
    let list = enriched;

    // SEARCH
    if (query.trim()) {
      const q =
        query
          .trim()
          .toLowerCase();

      list = list.filter(
        (item) =>
          item.member.full_name
            .toLowerCase()
            .includes(q) ||
          (
            item.member
              .mobile_number ??
            ''
          ).includes(q)
      );
    }

    // STATEMENT FILTER
if (statementFilter === 'sent') {
  list = list.filter(
    (item) => item.member.statement_sent === true
  );
}

if (statementFilter === 'unsent') {
  list = list.filter(
    (item) => item.member.statement_sent !== true
  );
}

    // FILTER
    if (
      filter === 'archived'
    ) {
      list = list.filter(
        (item) =>
          item.member.archived
      );
    } else {
      list = list.filter(
        (item) =>
          !item.member.archived
      );

      if (
        filter ===
        'up_to_date'
      ) {
        list = list.filter(
          (item) =>
            [
              'UP_TO_DATE',
              'DUE_SOON',
            ].includes(
              item.finance.status
            )
        );
      } else if (
        filter === 'pending'
      ) {
        list = list.filter(
          (item) =>
            [
              'DUE',
              'OVERDUE',
              'PARTIALLY_PAID',
              'DUE_SOON',
            ].includes(
              item.finance.status
            )
        );
      } else if (
        filter === 'overdue'
      ) {
        list = list.filter(
          (item) =>
            item.finance.status ===
            'OVERDUE'
        );
      } else if (
        filter ===
        'completed'
      ) {
        list = list.filter(
          (item) =>
            item.finance.status ===
            'COMPLETED'
        );
      }
    }

    // SORT
    const sorted = [...list];

    switch (sort) {
      case 'name_az':
        sorted.sort(
          (a, b) =>
            a.member.full_name.localeCompare(
              b.member.full_name
            )
        );
        break;

      case 'name_za':
        sorted.sort(
          (a, b) =>
            b.member.full_name.localeCompare(
              a.member.full_name
            )
        );
        break;

      case 'balance_high':
        sorted.sort(
          (a, b) =>
            b.finance
              .remainingBalance -
            a.finance
              .remainingBalance
        );
        break;

      case 'balance_low':
        sorted.sort(
          (a, b) =>
            a.finance
              .remainingBalance -
            b.finance
              .remainingBalance
        );
        break;

      case 'chitti_high':
        sorted.sort(
          (a, b) =>
            b.finance
              .totalExpected -
            a.finance
              .totalExpected
        );
        break;

      case 'chitti_low':
        sorted.sort(
          (a, b) =>
            a.finance
              .totalExpected -
            b.finance
              .totalExpected
        );
        break;

      case 'recent_paid':
        sorted.sort(
          (a, b) =>
            (
              b.lastPayment
                ?.payment_date ??
              ''
            ).localeCompare(
              a.lastPayment
                ?.payment_date ??
                ''
            )
        );
        break;

      case 'oldest_pending':
        sorted.sort(
          (a, b) =>
            a.finance
              .installmentsRemaining -
            b.finance
              .installmentsRemaining
        );
        break;

      case 'most_remaining':
        sorted.sort(
          (a, b) =>
            b.finance
              .installmentsRemaining -
            a.finance
              .installmentsRemaining
        );
        break;

      case 'completed':
        sorted.sort(
          (a, b) =>
            Number(
              b.finance.status ===
                'COMPLETED'
            ) -
            Number(
              a.finance.status ===
                'COMPLETED'
            )
        );
        break;
    }

    return sorted;
  }, [
    enriched,
    query,
    filter,
    sort,
    statementFilter,
  ]);

    // ====================================================
  // DASHBOARD SUMMARY
  // ====================================================

  // ====================================================
// DASHBOARD SUMMARY
// ====================================================

const summary = useMemo(() => {
  const active = enriched.filter(
    ({ member }) => !member.archived
  );

  return {
    total: active.length,

    collected: active.reduce(
      (sum, item) =>
        sum + Number(item.finance.totalPaid || 0),
      0
    ),

    outstanding: active.reduce(
      (sum, item) =>
        sum + Number(item.finance.remainingBalance || 0),
      0
    ),

    pending: active.filter((item) =>
      [
        'DUE',
        'OVERDUE',
        'PARTIALLY_PAID',
        'DUE_SOON',
      ].includes(item.finance.status)
    ).length,

    overdue: active.filter(
      (item) =>
        item.finance.status === 'OVERDUE'
    ).length,

    completed: active.filter(
      (item) =>
        item.finance.status === 'COMPLETED'
    ).length,
  };
}, [enriched]);

// ====================================================
// LOADING / ERROR
// ====================================================

if (loading) {
  return (
    <div className="grid gap-3">
      {Array.from({
        length: 4,
      }).map((_, index) => (
        <SkeletonCard
          key={index}
        />
      ))}
    </div>
  );
}

if (error) {
  return (
    <ErrorState
      message={error}
      onRetry={refresh}
    />
  );
}

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="space-y-4 pb-6">

      {/* ================================================= */}
      {/* PAGE HEADER */}
      {/* ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">
            Chitti management
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Members
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Manage members, collections and payment status.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-500 active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          Add member
        </button>

      </div>


      {/* ================================================= */}
      {/* SUMMARY CARDS */}
      {/* ================================================= */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        {/* TOTAL MEMBERS */}

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-2.5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-medium text-slate-400">
                Total members
              </p>

              <p className="mt-1 text-xl font-bold text-white">
                {summary.total}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="h-5 w-5" />
            </div>

          </div>
        </div>


        {/* COLLECTED */}

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-2.5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-medium text-slate-400">
                Collected
              </p>

              <p className="mt-2 text-xl font-bold text-emerald-400 sm:text-2xl">
                {formatMoney(summary.collected)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <WalletCards className="h-5 w-5" />
            </div>

          </div>
        </div>


        {/* OUTSTANDING */}

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-2.5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-medium text-slate-400">
                Outstanding
              </p>

              <p className="mt-2 text-xl font-bold text-amber-400 sm:text-2xl">
                {formatMoney(summary.outstanding)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Clock3 className="h-5 w-5" />
            </div>

          </div>
        </div>


        {/* OVERDUE */}

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-2.5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-medium text-slate-400">
                Overdue
              </p>

              <p className="mt-2 text-2xl font-bold text-red-400">
                {summary.overdue}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <AlertCircle className="h-5 w-5" />
            </div>

          </div>
        </div>

      </div>


      {/* ================================================= */}
      {/* SEARCH + STATEMENT FILTER */}
      {/* ================================================= */}

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

          {/* SEARCH */}

          <div className="relative flex-1">

            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/10"
              placeholder="Search member by name or phone..."
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
            />

          </div>


          {/* STATEMENT FILTER */}

          <div className="flex rounded-xl border border-slate-700/80 bg-slate-950/50 p-1">

            {[
              {
                value: 'all',
                label: 'All',
              },
              {
                value: 'sent',
                label: 'Sent',
              },
              {
                value: 'unsent',
                label: 'Unsent',
              },
            ].map((item) => (

              <button
                key={item.value}
                onClick={() =>
                  setStatementFilter(
                    item.value as
                      | 'all'
                      | 'sent'
                      | 'unsent'
                  )
                }
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  statementFilter === item.value
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.label}
              </button>

            ))}

          </div>


          {/* FILTER BUTTON */}

          <button
            onClick={() => setShowFilter(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">
              Filter & sort
            </span>
          </button>

        </div>

      </div>


      {/* ================================================= */}
      {/* STATUS FILTERS */}
      {/* ================================================= */}

      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">

        {(
          Object.keys(filterLabels) as Filter[]
        ).map((f) => {

          const count = enriched.filter(
            ({ member, finance }) => {

              if (f === 'archived') {
                return member.archived;
              }

              if (member.archived) {
                return false;
              }

              if (f === 'all') {
                return true;
              }

              if (f === 'up_to_date') {
                return [
                  'UP_TO_DATE',
                  'DUE_SOON',
                ].includes(finance.status);
              }

              if (f === 'pending') {
                return [
                  'DUE',
                  'OVERDUE',
                  'PARTIALLY_PAID',
                  'DUE_SOON',
                ].includes(finance.status);
              }

              if (f === 'overdue') {
                return finance.status === 'OVERDUE';
              }

              if (f === 'completed') {
                return finance.status === 'COMPLETED';
              }

              return false;
            }
          ).length;

          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filter === f
                  ? 'border-brand-500/30 bg-brand-600 text-white shadow-sm'
                  : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              {filterLabels[f]}

              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  filter === f
                    ? 'bg-white/15 text-white'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

      </div>


      {/* ================================================= */}
      {/* LIST HEADER */}
      {/* ================================================= */}

      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-sm font-semibold text-white">
            Member accounts
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            {filtered.length} member
            {filtered.length !== 1 ? 's' : ''} shown
          </p>
        </div>

        <div className="hidden items-center gap-1 text-xs text-slate-500 sm:flex">
          {summary.completed} completed
        </div>

      </div>


      {/* ================================================= */}
{/* MEMBER LIST */}
{/* ================================================= */}

{filtered.length === 0 ? (

  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8">
    <EmptyState
      icon={Users}
      title={
        members.length === 0
          ? 'No members yet'
          : 'No members match'
      }
      description={
        members.length === 0
          ? 'Add your first chitti member to start tracking collections.'
          : 'Try a different search or filter.'
      }
      action={
        members.length === 0 ? (
          <button
            className="btn-primary"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-4 w-4" />
            Add member
          </button>
        ) : undefined
      }
    />
  </div>

) : (

  <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/60">

    {/* ================================================= */}
    {/* DESKTOP TABLE HEADER */}
    {/* ================================================= */}

    <div className="hidden border-b border-slate-800 bg-slate-950/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 lg:grid lg:grid-cols-[2.1fr_1.05fr_1.15fr_1.25fr_1.25fr_0.9fr_0.9fr_0.8fr] lg:items-center lg:gap-4">

      <div>Member</div>
      <div>Installment</div>
      <div>Progress</div>
      <div>Paid / Balance</div>
      <div>Last Payment</div>
      <div>Status</div>
      <div>Statement</div>
      <div className="text-right">Action</div>

    </div>


    {/* ================================================= */}
    {/* MEMBERS */}
    {/* ================================================= */}

    <AnimatePresence mode="popLayout">

      {filtered.map(
        ({
          member,
          finance,
          schedules,
          lastPayment,
        }) => {

          const firstSchedule = schedules[0];

          const displayInstallment =
            firstSchedule
              ? Number(
                  firstSchedule.before_lifting_amount
                )
              : Number(
                  member.installment_amount
                );

          const progress = Math.min(
            100,
            Math.max(
              0,
              Number(
                finance.collectionPercentage || 0
              )
            )
          );

          return (

            <motion.div
              key={member.id}
              layout
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="group border-b border-slate-800/70 last:border-b-0"
            >

              {/* ================================================= */}
              {/* DESKTOP ROW */}
              {/* ================================================= */}

              <div className="hidden lg:grid lg:grid-cols-[2.1fr_1.05fr_1.15fr_1.25fr_1.25fr_0.9fr_0.9fr_0.8fr] lg:items-center lg:gap-4 px-4 py-2.5 transition hover:bg-slate-800/20">

                {/* MEMBER */}

                <button
                  onClick={() =>
                    navigate({
                      name: 'member',
                      id: member.id,
                    })
                  }
                  className="flex min-w-0 items-center gap-3 text-left"
                >

                  <Avatar
                    name={member.full_name}
                    photoUrl={member.photo_url}
                    size={38}
                  />

                  <div className="min-w-0">

                    <div className="truncate text-[13px] font-semibold text-slate-100">
  {member.full_name}
</div>

                    <div className="mt-0.5 truncate text-[10px] text-slate-500">
                      {member.mobile_number || 'No phone number'}
                    </div>

                  </div>

                </button>


                {/* INSTALLMENT */}

                <div>

                  <div className="text-xs font-semibold text-slate-200">
                    {formatMoney(displayInstallment)}
                  </div>

                  <div className="mt-0.5 text-[10px] text-slate-500">
                    / month
                  </div>

                </div>


                {/* PROGRESS */}

                <div>

                  <div className="mb-1 flex items-center justify-between">

                    <span className="text-[11px] font-semibold text-slate-300">
                      {progress.toFixed(0)}%
                    </span>

                    <span className="text-[10px] text-slate-600">
                      {finance.installmentsPaid}/
                      {member.total_installments}
                    </span>

                  </div>

                  <ProgressBar
                    value={progress}
                    animated={false}
                    className="h-1.5"
                  />

                </div>


                {/* PAID / BALANCE */}

                <div className="space-y-0.5">

                  <div className="text-xs font-semibold text-emerald-400">
                    {formatMoney(
                      finance.totalPaid
                    )}
                  </div>

                  <div className="text-[11px] font-medium text-amber-400">
                    {formatMoney(
                      finance.remainingBalance
                    )}
                  </div>

                </div>


                {/* LAST PAYMENT */}

                <div>

                  <div className="truncate text-xs font-medium text-slate-300">
                    {lastPayment?.payment_date
                      ? lastPayment.payment_date
                      : 'No payment yet'}
                  </div>

                </div>


                {/* STATUS */}

                <div>
                  <StatusBadge
                    status={finance.status}
                    size="sm"
                  />
                </div>


                {/* STATEMENT */}

                <div>

                  {member.statement_sent ? (

                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400">
                      Sent
                    </span>

                  ) : (

                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-400">
                      Unsent
                    </span>

                  )}

                </div>


                {/* ACTION */}

<div className="flex justify-end gap-2">

  {/* EDIT MEMBER */}
  <button
    onClick={() => setEditingMember(member)}
    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
  >
    <Pencil className="h-3 w-3" />
    Edit
  </button>

  {/* STATEMENT */}
  <button
    onClick={async () => {
      await memberService.update(
        member.id,
        {
          statement_sent:
            !member.statement_sent,
        }
      );

      refresh();
    }}
    className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
  >
    {member.statement_sent
      ? 'Unsend'
      : 'Mark sent'}
  </button>
</div>
</div>


              {/* ================================================= */}
              {/* MOBILE / TABLET CARD */}
              {/* ================================================= */}

              <div className="p-3 lg:hidden">

                <div className="rounded-xl border border-slate-800/80 bg-slate-950/30">

                  {/* TOP */}

                  <button
                    onClick={() =>
                      navigate({
                        name: 'member',
                        id: member.id,
                      })
                    }
                    className="flex w-full items-center gap-3 p-3 text-left"
                  >

                    <Avatar
                      name={member.full_name}
                      photoUrl={member.photo_url}
                      size={40}
                    />

                    <div className="min-w-0 flex-1">

                      <div className="flex items-center gap-2">

                        <h3 className="truncate text-sm font-semibold text-white">
                          {member.full_name}
                        </h3>

                        <StatusBadge
                          status={finance.status}
                          size="sm"
                        />

                      </div>

                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {member.mobile_number || 'No phone number'}
                      </p>

                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />

                  </button>


                  {/* PROGRESS */}

                  <div className="px-3 pb-3">

                    <div className="mb-1.5 flex items-center justify-between">

                      <span className="text-[10px] font-medium text-slate-500">
                        Collection progress
                      </span>

                      <span className="text-[10px] font-semibold text-slate-300">
                        {finance.installmentsPaid}/
                        {member.total_installments}
                      </span>

                    </div>

                    <ProgressBar
                      value={progress}
                      animated={false}
                      className="h-1.5"
                    />

                  </div>


                  {/* FINANCIAL INFO */}

                  <div className="grid grid-cols-3 border-t border-slate-800/70">

                    <div className="p-2.5">

                      <p className="text-[9px] uppercase tracking-wide text-slate-600">
                        Installment
                      </p>

                      <p className="mt-1 text-[11px] font-semibold text-slate-300">
                        {formatMoney(
                          displayInstallment
                        )}
                      </p>

                    </div>


                    <div className="border-l border-slate-800/70 p-2.5">

                      <p className="text-[9px] uppercase tracking-wide text-slate-600">
                        Paid
                      </p>

                      <p className="mt-1 text-[11px] font-semibold text-emerald-400">
                        {formatMoney(
                          finance.totalPaid
                        )}
                      </p>

                    </div>


                    <div className="border-l border-slate-800/70 p-2.5">

                      <p className="text-[9px] uppercase tracking-wide text-slate-600">
                        Balance
                      </p>

                      <p className="mt-1 text-[11px] font-semibold text-amber-400">
                        {formatMoney(
                          finance.remainingBalance
                        )}
                      </p>

                    </div>

                  </div>


                  {/* ACTION */}

                  <div className="flex items-center justify-between border-t border-slate-800/70 px-3 py-2">

                  <button
  type="button"
  onClick={() => setEditingMember(member)}
  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
>
  <Pencil className="h-3 w-3" />
  Edit
</button>

                    {member.statement_sent ? (

                      <span className="text-[10px] font-semibold text-emerald-400">
                        Statement sent
                      </span>

                    ) : (

                      <span className="text-[10px] font-semibold text-amber-400">
                        Statement pending
                      </span>

                    )}

                    <button
                      onClick={async () => {

                        await memberService.update(
                          member.id,
                          {
                            statement_sent:
                              !member.statement_sent,
                          }
                        );

                        refresh();

                      }}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                    >
                      {member.statement_sent
                        ? 'Unsend'
                        : 'Mark sent'}
                    </button>

                  </div>

                </div>

              </div>

            </motion.div>

          );
        }
      )}

    </AnimatePresence>

  </div>

)}

      {isMobile && (
        <button
          onClick={() => setShowAdd(true)}
          aria-label="Add member"
          className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl shadow-brand-600/30 transition hover:bg-brand-500 active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <Modal
        open={showFilter}
        onClose={() =>
          setShowFilter(false)
        }
        title="Filter & sort"
        size="md"
      >
        <div className="space-y-4">

          <div>
            <p className="label">
              Sort by
            </p>

            <div className="grid grid-cols-2 gap-2">
              {(
                Object.keys(
                  sortLabels
                ) as Sort[]
              ).map((s) => (
                <button
                  key={s}
                  onClick={() =>
                    setSort(s)
                  }
                  className={`rounded-lg px-3 py-2 text-left text-xs font-medium ${
                    sort === s
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {
                    sortLabels[s]
                  }
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-primary w-full"
            onClick={() =>
              setShowFilter(
                false
              )
            }
          >
            Done
          </button>
        </div>
      </Modal>

      {/* ============================================= */}
      {/* ADD MEMBER MODAL */}
      {/* ============================================= */}


      <AddMemberModal
        open={showAdd}
        onClose={() =>
          setShowAdd(false)
        }
        chittiId={
          selectedChittiId
        }
        chittis={chittis}
        schedules={
          allSchedules
        }
        onSaved={() => {
          setShowAdd(false);

          refresh();
        }}
      />
      <EditMemberModal
  member={editingMember}
  onClose={() => setEditingMember(null)}
  onSaved={() => {
    setEditingMember(null);
    refresh();
  }}
/>
    </div>
  );
}

// ======================================================
// ADD MEMBER MODAL
// ======================================================

function AddMemberModal({
  open,
  onClose,
  chittiId,
  chittis,
  schedules,
  onSaved,
}: {
  open: boolean;

  onClose: () => void;

  chittiId: string | null;

  chittis: {
    id: string;
    name: string;
  }[];

  schedules: ChittiSchedule[];

  onSaved: () => void;
}) {

  
  // ====================================================
  // FORM STATE
  // ====================================================

  const [
    fullName,
    setFullName,
  ] = useState('');

  const [
    mobile,
    setMobile,
  ] = useState('');

  const [
  memberStartDate,
  setMemberStartDate,
] = useState('');

  const [
    chitti,
    setChitti,
  ] = useState(
    chittiId ??
      chittis[0]?.id ??
      ''
  );

  const [
    notes,
    setNotes,
  ] = useState('');

  const [
  units,
  setUnits,
] = useState<number | ''>('');


  const [
    busy,
    setBusy,
  ] = useState(false);

  const [
    err,
    setErr,
  ] = useState<
    string | null
  >(null);

  // ====================================================
  // SELECTED SCHEDULE
  // ====================================================

  const selectedSchedules =
    useMemo(() => {
      return schedules
        .filter(
          (schedule) =>
            schedule.chitti_id ===
            chitti
        )
        .sort(
          (a, b) =>
            a.month_number -
            b.month_number
        );
    }, [
      schedules,
      chitti,
    ]);

  const firstSchedule =
    selectedSchedules[0];


  const totalAmount =
  firstSchedule
    ? Number(firstSchedule.chit_value)
    : 0;

  

  const installmentAmount =
  firstSchedule
    ? Number(
        firstSchedule.before_lifting_amount
      ) 
    : 0;


  const totalInstallments =
    selectedSchedules.length;

  

  const startDate = memberStartDate;

  /*
   * Due day is derived from thMobile numbere first draw date.
   *
   * 2026-07-26 -> 26
   */

  const dueDay =
    startDate
      ? Number(
          startDate.split(
            '-'
          )[2]
        )
      : 1;

  // ====================================================
  // SUBMIT
  // ====================================================

  const submit = async () => {
    setErr(null);

    // NAME
    if (
      !fullName.trim()
    ) {
      setErr(
        'Name is required'
      );

      return;
    }

    // CHITTI
    if (!chitti) {
      setErr(
        'Please select a chitti'
      );

      return;
    }

    // SCHEDULE
    if (
      selectedSchedules.length ===
      0
    ) {
      setErr(
        'This chitti does not have a payment schedule. Please configure the chitti schedule first.'
      );

      return;
    }

    // TOTAL
    if (
      !Number.isFinite(
        totalAmount
      ) ||
      totalAmount <= 0
    ) {
      setErr(
        'Invalid chitti value in schedule'
      );

      return;
    }

    // INSTALLMENT
    if (
      !Number.isFinite(
        installmentAmount
      ) ||
      installmentAmount <= 0
    ) {
      setErr(
        'Invalid installment amount in schedule'
      );

      return;
    }

    // INSTALLMENTS
    if (
      totalInstallments <=
      0
    ) {
      setErr(
        'Invalid number of installments'
      );

      return;
    }

    // START DATE
    if (!startDate) {
  setErr(
    'Please select the member starting date'
  );

  return;
}

    // DUE DAY
    if (
      dueDay < 1 ||
      dueDay > 31
    ) {
      setErr(
        'Invalid due day in schedule'
      );

      return;
    }

    // ==================================================
    // CREATE MEMBER
    // ==================================================

    setBusy(true);

    try {
      await memberService.create({
        chitti_id:
          chitti,

        full_name:
          fullName.trim(),

        mobile_number:
          mobile.trim() ||
          null,

        total_chitti_amount:
          totalAmount,

        installment_amount:
          installmentAmount,

        total_installments:
          totalInstallments,

        due_day:
          dueDay,

        start_date:
          startDate,

        notes:
          notes.trim() ||
          null,

          units: units === '' ? 1 : units,
      });

      // RESET
      setFullName('');

      setMobile('');

      setMemberStartDate('')

      setNotes('');

      setUnits('');

      setErr(null);

      onSaved();
    } catch (e) {
      console.error(
        'Failed to add member:',
        e
      );

      setErr(
        e instanceof Error
          ? e.message
          : 'Failed to add member'
      );
    } finally {
      setBusy(false);
    }
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) {
          onClose();
        }
      }}
      title="Add member"
      size="lg"
      footer={
        <>
          <button
            className="btn-secondary flex-1"
            onClick={
              onClose
            }
            disabled={
              busy
            }
          >
            Cancel
          </button>

          <button
            className="btn-primary flex-1"
            disabled={
              busy
            }
            onClick={
              submit
            }
          >
            {busy
              ? 'Saving...'
              : 'Save member'}
          </button>
        </>
      }
    >
      <div className="space-y-4">

        {/* =========================================== */}
        {/* NAME */}
        {/* =========================================== */}

        <div>
          <label className="label">
            Full name
          </label>

          <input
            className="input"
            value={
              fullName
            }
            onChange={(e) =>
              setFullName(
                e.target.value
              )
            }
            placeholder="Ramesh Kumar"
            autoFocus
          />
        </div>

        {/* =========================================== */}
        {/* MOBILE + CHITTI */}
        {/* =========================================== */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

          <div>
  <label className="label">
    Member starting date
  </label>

  <input
    type="date"
    className="input"
    value={memberStartDate}
    onChange={(e) =>
      setMemberStartDate(e.target.value)
    }
  />
</div>

          <div>
            <label className="label">
              Mobile number
            </label>

            <input
              className="input"
              value={
                mobile
              }
              onChange={(e) =>
                setMobile(
                  e.target.value
                )
              }
              placeholder="9876543210"
              inputMode="tel"
            />
          </div>

          <div>
            <label className="label">
              Chitti
            </label>

            <select
              className="input"
              value={
                chitti
              }
              onChange={(e) => {
                setChitti(
                  e.target.value
                );

                setErr(
                  null
                );
              }}
            >
              <option value="">
                Select chitti
              </option>

              {chittis.map(
                (c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </option>
                )
              )}
            </select>
          </div>
          <div>

            
  <label className="label">
    Number of Chittis
  </label>

  <input
    type="number"
    onWheel={(e) => e.currentTarget.blur()}
    min={1}
    className="input"
    value={units}
    onChange={(e) =>
  setUnits(
    e.target.value === ''
      ? ''
      : Number(e.target.value)
  )
}
  />
</div>
        </div>

        {/* =========================================== */}
        {/* NO SCHEDULE WARNING */}
        {/* =========================================== */}

        {chitti &&
          selectedSchedules.length ===
            0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                No schedule configured
              </p>

              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                This is probably an older chitti created before the monthly schedule system. Add a schedule before adding new members.
              </p>
            </div>
          )}

        {/* =========================================== */}
        {/* AUTO CHITTI DETAILS */}
        {/* =========================================== */}

        {selectedSchedules.length >
          0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">

            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Chitti details
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Automatically loaded from the chitti schedule
                </p>
              </div>

              <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                Auto
              </span>
            </div>

            {/* ======================================= */}
            {/* TOTAL + INSTALLMENT */}
            {/* ======================================= */}

            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="label">
                  Total chitti amount
                </label>

                <div className="input flex items-center bg-slate-100 font-semibold text-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
                  {formatMoney(
                    totalAmount
                  )}
                </div>
              </div>

              <div>
                <label className="label">
                  Initial installment
                </label>

                <div className="input flex items-center bg-slate-100 font-semibold text-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
                  {formatMoney(
                    installmentAmount
                  )}
                </div>
              </div>
            </div>

            {/* ======================================= */}
            {/* INSTALLMENTS + DUE DAY */}
            {/* ======================================= */}

            <div className="mt-3 grid grid-cols-2 gap-3">

              <div>
                <label className="label">
                  Installments
                </label>

                <div className="input flex items-center bg-slate-100 font-semibold text-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
                  {
                    totalInstallments
                  }
                </div>
              </div>

              <div>
                <label className="label">
                  Due day
                </label>

                <div className="input flex items-center bg-slate-100 font-semibold text-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
                  {dueDay}
                </div>
              </div>
            </div>

            {/* ======================================= */}
            {/* START DATE */}
            {/* ======================================= */}

            <label className="label">
  Member starting date
</label>



            {/* ======================================= */}
            {/* PAYMENT RULE */}
            {/* ======================================= */}

            {firstSchedule && (
              <div className="mt-3 rounded-lg bg-white p-3 dark:bg-slate-900/50">

                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Payment schedule
                </p>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">

                  <div>
                    <p className="text-slate-500">
                      Before lifting
                    </p>

                    <p className="mt-0.5 font-bold text-slate-800 dark:text-slate-100">
                      {formatMoney(
                        Number(
                          firstSchedule.before_lifting_amount
                        )
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">
                      After lifting
                    </p>

                    <p className="mt-0.5 font-bold text-slate-800 dark:text-slate-100">
                      {formatMoney(
                        Number(
                          firstSchedule.after_lifting_amount
                        )
                      )}
                    </p>
                  </div>
                </div>

                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  Actual monthly dues are calculated from each month's schedule. If the member lifts the chitti, eligible later installments use the after-lifting amount.
                </p>
              </div>
            )}
          </div>
        )}

        {/* =========================================== */}
        {/* NOTES */}
        {/* =========================================== */}

        <div>
          <label className="label">
            Private notes
            (optional)
          </label>

          <textarea
            className="input"
            rows={3}
            value={notes}
            onChange={(e) =>
              setNotes(
                e.target.value
              )
            }
            placeholder="Usually pays around the due date"
          />
        </div>

        {/* =========================================== */}
        {/* ERROR */}
        {/* =========================================== */}

        {err && (
          <div className="rounded-lg bg-danger-500/10 p-3">
            <p className="text-sm font-medium text-danger-600">
              {err}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
function EditMemberModal({
  member,
  onClose,
  onSaved,
}: {
  member: Member | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setName(member.full_name);
      setErr(null);
    }
  }, [member]);

  const submit = async () => {
    if (!member) return;

    if (!name.trim()) {
      setErr('Name is required');
      return;
    }

    setBusy(true);
    setErr(null);

    try {
      await memberService.update(member.id, {
        full_name: name.trim(),
      });

      onSaved();
    } catch (e) {
      console.error('Failed to update member:', e);

      setErr(
        e instanceof Error
          ? e.message
          : 'Failed to update member'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!member}
      onClose={() => {
        if (!busy) {
          onClose();
        }
      }}
      title="Edit member"
      size="sm"
      footer={
        <>
          <button
            className="btn-secondary flex-1"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>

          <button
            className="btn-primary flex-1"
            onClick={submit}
            disabled={busy}
          >
            {busy ? 'Saving...' : 'Save changes'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">
            Member name
          </label>

          <input
            className="input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErr(null);
            }}
            autoFocus
          />
        </div>

        {err && (
          <div className="rounded-lg bg-danger-500/10 p-3">
            <p className="text-sm font-medium text-danger-600">
              {err}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}