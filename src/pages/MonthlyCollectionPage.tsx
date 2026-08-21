import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  CircleDollarSign,
  Filter,
  Search,
  AlertCircle,
  Clock3,
} from 'lucide-react';

import { Avatar } from '@/components/Avatar';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { formatMoney } from '@/lib/format';
import { paymentService } from '@/lib/services';

import type { useAppData } from '@/hooks/useAppData';
import type { Payment } from '@/types';

interface Props {
  appData: ReturnType<typeof useAppData>;
}

type Status = 'completed' | 'partial' | 'unpaid';

type Sort =
  | 'default'
  | 'amount_high'
  | 'amount_low';

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}

function getMonthLabel(date = new Date()) {
  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function getMonthDifference(
  startDate: string,
  currentDate: Date
) {
  const start = new Date(`${startDate}T00:00:00`);

  return (
    (currentDate.getFullYear() - start.getFullYear()) * 12 +
    (currentDate.getMonth() - start.getMonth())
  );
}

function getStatus(
  paid: number,
  expected: number
): Status {
  if (expected <= 0) return 'completed';

  if (paid >= expected) {
    return 'completed';
  }

  if (paid > 0) {
    return 'partial';
  }

  return 'unpaid';
}

export function MonthlyCollectionPage({
  appData,
}: Props) {
  const {
    members,
    payments,
    allSchedules,
    loading,
    error,
    refresh,
  } = appData;

  const [query, setQuery] = useState('');

  const [statusFilter, setStatusFilter] =
    useState<'all' | Status>('all');

  const [sort, setSort] =
    useState<Sort>('default');

  const [savingMemberId, setSavingMemberId] =
    useState<string | null>(null);

  const [amountInputs, setAmountInputs] =
    useState<Record<string, string>>({});

  const currentDate = new Date();

  const monthKey = getMonthKey(currentDate);

  const monthLabel = getMonthLabel(currentDate);

  // =========================================================
  // COLLECTION DATA
  // =========================================================

  const collection = useMemo(() => {
    return members
      .filter((member) => !member.archived)
      .map((member) => {
        const schedules = allSchedules
          .filter(
            (schedule) =>
              schedule.chitti_id === member.chitti_id
          )
          .sort(
            (a, b) =>
              a.month_number - b.month_number
          );

        // -----------------------------------------------
        // Find this member's current schedule month
        // based on their starting date.
        // -----------------------------------------------

        let currentMonthNumber = 1;

        if (member.start_date) {
          const difference =
            getMonthDifference(
              member.start_date,
              currentDate
            );

          currentMonthNumber =
            difference + 1;
        }

        const currentSchedule =
          schedules.find(
            (schedule) =>
              schedule.month_number ===
              currentMonthNumber
          );

        // -----------------------------------------------
        // If the member has not started yet, expected = 0
        // -----------------------------------------------

        const hasStarted =
          member.start_date
            ? new Date(
                `${member.start_date}T00:00:00`
              ) <= currentDate
            : false;

        // -----------------------------------------------
        // If schedule is complete, don't invent another
        // monthly installment.
        // -----------------------------------------------

        const scheduleFinished =
          schedules.length > 0 &&
          currentMonthNumber >
            schedules.length;

        let expectedAmount = 0;

        if (
          hasStarted &&
          !scheduleFinished &&
          currentSchedule
        ) {
          expectedAmount = member.is_lifted
            ? Number(
                currentSchedule.after_lifting_amount
              )
            : Number(
                currentSchedule.before_lifting_amount
              );
        }

        // -----------------------------------------------
        // Current month's payments
        // -----------------------------------------------

        const monthPayments =
          payments.filter((payment) => {
            if (payment.member_id !== member.id) {
              return false;
            }

            if (payment.reversed) {
              return false;
            }

            return (
              payment.payment_date?.slice(0, 7) ===
              monthKey
            );
          });

        const paidAmount =
          monthPayments.reduce(
            (total, payment) =>
              total + Number(payment.amount || 0),
            0
          );

        const status = getStatus(
          paidAmount,
          expectedAmount
        );

        return {
          member,
          schedules,
          currentSchedule,
          currentMonthNumber,
          expectedAmount,
          paidAmount,
          status,
          monthPayments,
          scheduleFinished,
          hasStarted,
        };
      });
  }, [
    members,
    payments,
    allSchedules,
    monthKey,
  ]);

  // =========================================================
  // TOTALS
  // =========================================================

  const totals = useMemo(() => {
    const expected = collection.reduce(
      (total, item) =>
        total + item.expectedAmount,
      0
    );

    const collected = collection.reduce(
      (total, item) =>
        total + item.paidAmount,
      0
    );

    return {
      expected,
      collected,
      pending: Math.max(
        expected - collected,
        0
      ),
    };
  }, [collection]);

  // =========================================================
  // FILTER + SORT
  // =========================================================

  const filtered = useMemo(() => {
    let list = [...collection];

    // SEARCH
    if (query.trim()) {
      const q =
        query.trim().toLowerCase();

      list = list.filter(
        (item) =>
          item.member.full_name
            .toLowerCase()
            .includes(q) ||
          (
            item.member.mobile_number ??
            ''
          ).includes(q)
      );
    }

    // STATUS
    if (statusFilter !== 'all') {
      list = list.filter(
        (item) =>
          item.status === statusFilter
      );
    }

    // SORT
    if (sort === 'amount_high') {
      list.sort(
        (a, b) =>
          b.expectedAmount -
          a.expectedAmount
      );
    }

    if (sort === 'amount_low') {
      list.sort(
        (a, b) =>
          a.expectedAmount -
          b.expectedAmount
      );
    }

    // DEFAULT:
    // incomplete members first,
    // completed members at bottom.
    if (sort === 'default') {
      const priority: Record<Status, number> = {
        unpaid: 0,
        partial: 1,
        completed: 2,
      };

      list.sort(
        (a, b) =>
          priority[a.status] -
          priority[b.status]
      );
    }

    return list;
  }, [
    collection,
    query,
    statusFilter,
    sort,
  ]);

  // =========================================================
  // SAVE MONTHLY AMOUNT
  // =========================================================

  const saveAmount = async (
    item: (typeof collection)[number]
  ) => {
    const raw =
      amountInputs[item.member.id] ??
      String(item.paidAmount);

    const amount = Number(
      raw.replace(/,/g, '')
    );

    if (!Number.isFinite(amount) || amount < 0) {
      alert('Enter a valid amount.');
      return;
    }

    if (!item.expectedAmount) {
      alert(
        'This member has no active installment for the current month.'
      );
      return;
    }

    setSavingMemberId(item.member.id);

    try {
      // -----------------------------------------------------
      // If this member already has a current-month payment,
      // update the latest active record.
      //
      // This prevents repeatedly creating duplicate records
      // when the user simply edits the monthly collection.
      // -----------------------------------------------------

      const existingPayment =
        [...item.monthPayments]
          .sort(
            (a, b) =>
              (b.created_at ?? '').localeCompare(
                a.created_at ?? ''
              )
          )[0];

      if (existingPayment) {
        await paymentService.update(
          existingPayment.id,
          {
            amount,
            payment_date:
              currentDate
                .toISOString()
                .slice(0, 10),
            installment_month:
              monthKey,
          }
        );
      } else {
        await paymentService.create({
          member_id:
            item.member.id,

          chitti_id:
            item.member.chitti_id,

          amount,

          payment_date:
            currentDate
              .toISOString()
              .slice(0, 10),

          installment_month:
            monthKey,

          payment_mode:
            'cash',
        });
      }

      setAmountInputs((previous) => ({
        ...previous,
        [item.member.id]:
          String(amount),
      }));

      refresh();
    } catch (e) {
      console.error(
        'Failed to save monthly collection:',
        e
      );

      alert(
        e instanceof Error
          ? e.message
          : 'Failed to save payment.'
      );
    } finally {
      setSavingMemberId(null);
    }
  };

  // =========================================================
  // LOADING / ERROR
  // =========================================================

  if (loading) {
    return (
      <div className="grid gap-3">
        {Array.from({
          length: 5,
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

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-4 pb-6">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex items-end justify-between">
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-400">
      Monthly Collection
    </p>

    <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-white">
      {monthLabel}
    </h1>

    <p className="mt-0.5 text-xs text-slate-500">
      Record this month's member collections.
    </p>
  </div>
</div>

      {/* ================================================= */}
      {/* TOTAL CARDS */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-brand-500" />

            <p className="text-xs font-semibold text-slate-500">
              Expected
            </p>
          </div>

          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {formatMoney(
              totals.expected
            )}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success-500" />

            <p className="text-xs font-semibold text-slate-500">
              Collected
            </p>
          </div>

          <p className="mt-1 text-lg font-bold text-success-600 dark:text-success-500">
            {formatMoney(
              totals.collected
            )}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-danger-500" />

            <p className="text-xs font-semibold text-slate-500">
              Pending
            </p>
          </div>

          <p className="mt-1 text-lg font-bold text-danger-600 dark:text-danger-500">
            {formatMoney(
              totals.pending
            )}
          </p>
        </div>
      </div>

      {/* ================================================= */}
      {/* SEARCH + SORT */}
      {/* ================================================= */}

      <div className="flex flex-col gap-2 sm:flex-row">

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            className="input h-10 pl-10 text-sm"
            placeholder="Search member by name or phone..."
            value={query}
            onChange={(e) =>
              setQuery(
                e.target.value
              )
            }
          />
        </div>

        <select
          className="input sm:w-64"
          value={sort}
          onChange={(e) =>
            setSort(
              e.target.value as Sort
            )
          }
        >
          <option value="default">
            Status — Pending first
          </option>

          <option value="amount_high">
            Installment — High to Low
          </option>

          <option value="amount_low">
            Installment — Low to High
          </option>
        </select>
      </div>

      {/* ================================================= */}
      {/* STATUS FILTER */}
      {/* ================================================= */}

      <div className="flex gap-2 overflow-x-auto no-scrollbar">

        {(
          [
            ['all', 'All'],
            ['unpaid', 'Not Paid'],
            ['partial', 'Partial'],
            ['completed', 'Completed'],
          ] as const
        ).map(
          ([value, label]) => (
            <button
              key={value}
              onClick={() =>
                setStatusFilter(
                  value
                )
              }
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                statusFilter === value
  ? 'border-brand-500/30 bg-brand-500 text-white'
  : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* ================================================= */}
      {/* MEMBER LIST */}
      {/* ================================================= */}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No members found"
          description="Try changing the search or collection filter."
        />
      ) : (
        <div className="space-y-2.5">

          {filtered.map(
            (item) => {

              const inputValue =
                amountInputs[
                  item.member.id
                ] ??
                String(
                  item.paidAmount
                );

              const remaining =
                Math.max(
                  item.expectedAmount -
                    item.paidAmount,
                  0
                );

              return (
                <div
  key={item.member.id}
  className="group rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-3 transition hover:border-slate-700 hover:bg-slate-900"
>
  {/* MEMBER + STATUS */}

  <div className="flex items-center gap-3">

    <Avatar
      name={item.member.full_name}
      photoUrl={item.member.photo_url}
      size={38}
    />

    <div className="min-w-0 flex-1">

      <div className="flex items-center gap-2">

        <p className="truncate text-sm font-semibold text-white">
          {item.member.full_name}
        </p>

        {item.status === 'completed' && (
          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 sm:inline-flex">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </span>
        )}

        {item.status === 'partial' && (
          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 sm:inline-flex">
            <AlertCircle className="h-3 w-3" />
            Partial
          </span>
        )}

        {item.status === 'unpaid' && (
          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400 sm:inline-flex">
            <AlertCircle className="h-3 w-3" />
            Not Paid
          </span>
        )}

      </div>

      <p className="mt-0.5 text-[10px] text-slate-500">
        Month {item.currentMonthNumber}
        {' · '}
        Expected {formatMoney(item.expectedAmount)}
      </p>

    </div>


    {/* STATUS MOBILE */}

    <div className="sm:hidden">

      {item.status === 'completed' && (
        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold text-emerald-400">
          Paid
        </span>
      )}

      {item.status === 'partial' && (
        <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-semibold text-amber-400">
          Partial
        </span>
      )}

      {item.status === 'unpaid' && (
        <span className="rounded-full bg-red-500/10 px-2 py-1 text-[9px] font-semibold text-red-400">
          Due
        </span>
      )}

    </div>

  </div>


  {/* COLLECTION ROW */}

  <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3">

    <div>

      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
        Paid this month
      </label>

      <input
        className="input h-9 w-full text-sm"
        type="number"
        onWheel={(e) => e.currentTarget.blur()}
        min="0"
        step="1"
        value={inputValue}
        onChange={(e) =>
          setAmountInputs((previous) => ({
            ...previous,
            [item.member.id]: e.target.value,
          }))
        }
        placeholder="0"
      />

    </div>


    <button
      className="btn-primary h-9 min-w-20 px-3 text-xs"
      disabled={
        savingMemberId === item.member.id
      }
      onClick={() =>
        saveAmount(item)
      }
    >
      {savingMemberId === item.member.id
        ? 'Saving...'
        : 'Save'}
    </button>

  </div>


  {/* FINANCIAL SUMMARY */}

  <div className="mt-2 flex items-center justify-between border-t border-slate-800/70 pt-2 text-[10px]">

    <span className="text-slate-500">
      Collected:{' '}
      <strong className="text-slate-300">
        {formatMoney(item.paidAmount)}
      </strong>
    </span>

    <span
      className={
        remaining > 0
          ? 'font-semibold text-red-400'
          : 'font-semibold text-emerald-400'
      }
    >
      {remaining > 0
        ? `${formatMoney(remaining)} pending`
        : 'Fully collected'}
    </span>

  </div>


  {/* SPECIAL CASES */}

  {!item.hasStarted && (
    <p className="mt-2 rounded-lg bg-slate-800/60 px-3 py-1.5 text-[10px] text-slate-400">
      Member has not started yet.
    </p>
  )}

  {item.scheduleFinished && (
    <p className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-[10px] font-medium text-emerald-400">
      Chitti schedule completed.
    </p>
  )}

</div>
              );
            }
          )}

        </div>
      )}

    </div>
  );
}