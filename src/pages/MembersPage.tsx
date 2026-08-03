import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Users,
  UserPlus,
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

import { MembersDesktop } from '@/components/members/MembersDesktop';
import { MembersMobile } from '@/components/members/MembersMobile';

import type { useAppData } from '@/hooks/useAppData';
import type {
  ChittiSchedule,
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
  ]);

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
  <div className="space-y-6">


      {/* ============================================= */}
      {/* SEARCH */}
      {/* ============================================= */}
      <div className="sticky top-0 z-20 -mx-4 mb-2 bg-slate-950/95 px-4 py-3 backdrop-blur-lg lg:hidden"></div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            className="input pl-10"
            placeholder="Search name or phone"
            value={query}
            onChange={(e) =>
              setQuery(
                e.target.value
              )
            }
          />
        </div>

        <button
          onClick={() =>
            setShowFilter(true)
          }
          className="btn-secondary px-3"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* ============================================= */}
      {/* FILTER CHIPS */}
      {/* ============================================= */}

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(
          Object.keys(
            filterLabels
          ) as Filter[]
        ).map((f) => (
          <button
            key={f}
            onClick={() =>
              setFilter(f)
            }
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === f
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* ============================================= */}
      {/* ADD MEMBER */}
      {/* ============================================= */}

      <button
        className={`btn-primary ${
  isMobile
    ? 'fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full p-0 shadow-xl'
    : 'w-full'
}`}
        onClick={() =>
          setShowAdd(true)
        }
      >
        <UserPlus className="h-6 w-6" />

{!isMobile && 'Add member'}
      </button>

      {/* ============================================= */}
      {/* MEMBER LIST */}
      {/* ============================================= */}

      {filtered.length === 0 ? (
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
                onClick={() =>
                  setShowAdd(
                    true
                  )
                }
              >
                <Plus className="h-4 w-4" />

                Add member
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-2.5">
          <AnimatePresence>
            {filtered.map(
              ({
                member,
                finance,
                schedules,
              }) => {
                /*
                 * Display current/initial monthly amount.
                 *
                 * This is ONLY display information.
                 * Actual calculations use the complete
                 * schedule through computeMemberFinance.
                 */

                const firstSchedule =
                  schedules[0];

                const displayInstallment =
                  firstSchedule
                    ? Number(
                        firstSchedule.before_lifting_amount
                      )
                    : Number(
                        member.installment_amount
                      );

                return (
                  <motion.button
                    key={member.id}
                    layout
                    initial={{
                      opacity: 0,
                      y: 6,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    onClick={() =>
                      navigate({
                        name: 'member',
                        id: member.id,
                      })
                    }
                    className="card card-hover p-3.5 text-left"
                  >
                    <div className="flex items-center gap-3">

                      <Avatar
                        name={
                          member.full_name
                        }
                        photoUrl={
                          member.photo_url
                        }
                        size={44}
                      />

                      <div className="min-w-0 flex-1">

                        {/* NAME + STATUS */}

                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {
                              member.full_name
                            }
                          </p>

                          <StatusBadge
                            status={
                              finance.status
                            }
                            size="sm"
                          />
                        </div>

                        {/* INSTALLMENT + MOBILE */}

                        <p className="text-xs text-slate-500">
                          {formatMoney(
                            displayInstallment
                          )}
                          /mo ·{' '}
                          {member.mobile_number ||
                            '—'}
                        </p>

                        {/* PROGRESS */}

                        <div className="mt-2 flex items-center gap-2">
                          <ProgressBar
                            value={
                              finance.collectionPercentage
                            }
                            animated={
                              false
                            }
                            className="flex-1"
                          />

                          <span className="text-[11px] font-semibold text-slate-500">
                            {
                              finance.installmentsPaid
                            }
                            /
                            {
                              member.total_installments
                            }
                          </span>
                        </div>

                        {/* PAID + BALANCE */}

                        <div className="mt-1.5 flex justify-between text-[11px]">
                          <span className="text-success-600 dark:text-success-500">
                            Paid{' '}
                            {formatMoney(
                              finance.totalPaid
                            )}
                          </span>

                          <span className="text-slate-500">
                            Balance{' '}
                            {formatMoney(
                              finance.remainingBalance
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              }
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ============================================= */}
      {/* FILTER MODAL */}
      {/* ============================================= */}

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

  // ====================================================
  // AUTO VALUES
  // ====================================================

  /*
   * Chitti Value:
   *
   * We use Month 1 chit_value as the member's
   * base chitti amount.
   *
   * Example:
   * Month 1 = ₹3,05,000
   * Member total_chitti_amount = ₹3,05,000
   */

  const totalAmount =
    firstSchedule
      ? Number(
          firstSchedule.chit_value
        )
      : 0;

  /*
   * Member's stored installment_amount is used
   * as a fallback / initial value.
   *
   * Actual finance calculations later use
   * the complete monthly schedule.
   */

  const installmentAmount =
    firstSchedule
      ? Number(
          firstSchedule.before_lifting_amount
        )
      : 0;

  /*
   * Schedule row count = number of installments.
   */

  const totalInstallments =
    selectedSchedules.length;

  /*
   * First draw date becomes member start date.
   */

  const startDate =
    firstSchedule?.draw_date ??
    '';

  /*
   * Due day is derived from the first draw date.
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
        'Invalid start date in schedule'
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
      });

      // RESET
      setFullName('');

      setMobile('');

      setNotes('');

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

            <div className="mt-3">
              <label className="label">
                Start date
              </label>

              <input
                className="input cursor-not-allowed bg-slate-100 dark:bg-slate-900/50"
                type="date"
                value={
                  startDate
                }
                readOnly
              />
            </div>

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