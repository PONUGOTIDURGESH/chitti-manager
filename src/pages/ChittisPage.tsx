import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Layers,
  Trash2,
  CalendarDays,
  Settings2,
} from 'lucide-react';

import { useRouter } from '@/hooks/useRouter';
import { ChittiSelector } from '@/components/ChittiSelector';

import {
  Modal,
  ConfirmDialog,
} from '@/components/Modal';

import {
  EmptyState,
  ErrorState,
  SkeletonCard,
} from '@/components/States';

import {
  chittiService,
  scheduleService,
} from '@/lib/services';

import { computeChittiFinance } from '@/lib/finance';

import {
  formatMoney,
  formatDate,
  todayISO,
} from '@/lib/format';

import type {
  Chitti,
  ChittiStatus,
  ChittiScheduleInput,
} from '@/types';

import type { useAppData } from '@/hooks/useAppData';

// ======================================================
// TYPES
// ======================================================

interface Props {
  appData: ReturnType<typeof useAppData>;
  selectedChittiId: string | null;
  setSelectedChittiId: (
    id: string | null
  ) => void;
}

interface ScheduleRow {
  month_number: number;
  draw_date: string;
  chit_value: string;
  lift_amount: string;
  before_lifting_amount: string;
  after_lifting_amount: string;
}

// ======================================================
// DATE HELPERS
// ======================================================

function addMonths(
  dateString: string,
  months: number
): string {
  if (!dateString) return '';

  const [year, month, day] = dateString
    .split('-')
    .map(Number);

  const target = new Date(
    year,
    month - 1 + months,
    1
  );

  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate();

  const safeDay = Math.min(
    day,
    lastDay
  );

  const date = new Date(
    target.getFullYear(),
    target.getMonth(),
    safeDay
  );

  const yyyy = date.getFullYear();

  const mm = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const dd = String(
    date.getDate()
  ).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

function generateSchedule(
  numberOfMonths: number,
  startDate: string
): ScheduleRow[] {
  return Array.from(
    { length: numberOfMonths },
    (_, index) => ({
      month_number: index + 1,
      draw_date: addMonths(
        startDate,
        index
      ),
      chit_value: '',
      lift_amount: '',
      before_lifting_amount: '',
      after_lifting_amount: '',
    })
  );
}

// ======================================================
// PAGE
// ======================================================

export function ChittisPage({
  appData,
  selectedChittiId,
  setSelectedChittiId,
}: Props) {
  const { navigate } = useRouter();

  const {
    chittis,
    members,
    payments,
    allSchedules,
    loading,
    error,
    refresh,
  } = appData;

  // ====================================================
  // GENERAL STATE
  // ====================================================

  const [showForm, setShowForm] =
    useState(false);

  const [
    confirmDelete,
    setConfirmDelete,
  ] = useState<Chitti | null>(
    null
  );

  const [busy, setBusy] =
    useState(false);

  const [
    formError,
    setFormError,
  ] = useState<string | null>(
    null
  );

  // ====================================================
  // NEW CHITTI STATE
  // ====================================================

  const [name, setName] =
    useState('');

  const [
    description,
    setDescription,
  ] = useState('');

 const [startDate, setStartDate] = useState(todayISO());

  const [status, setStatus] =
    useState<ChittiStatus>(
      'active'
    );

  const [
    liftingPaymentEnabled,
    setLiftingPaymentEnabled,
  ] = useState(false);

  const [
    numberOfMonths,
    setNumberOfMonths,
  ] = useState(30);

const [
  monthsInput,
  setMonthsInput,
] = useState("30");

  const [
    scheduleRows,
    setScheduleRows,
  ] = useState<ScheduleRow[]>(
    () =>
      generateSchedule(
        30,
        todayISO()
      )
  );

  // ====================================================
  // NEW CHITTI QUICK FILL
  // ====================================================

  const [
    bulkChitValue,
    setBulkChitValue,
  ] = useState('');

  const [
    bulkBeforeLifting,
    setBulkBeforeLifting,
  ] = useState('');

  const [
    bulkAfterLifting,
    setBulkAfterLifting,
  ] = useState('');

  const [
    bulkLiftAmount,
    setBulkLiftAmount,
  ] = useState('');

  // ====================================================
  // EDIT SCHEDULE STATE
  // ====================================================

  const [
    showScheduleEditor,
    setShowScheduleEditor,
  ] = useState(false);

  const [
    editingChitti,
    setEditingChitti,
  ] = useState<Chitti | null>(
    null
  );

  const [
    editLiftingPaymentEnabled,
    setEditLiftingPaymentEnabled,
  ] = useState(false);

  const [
    editNumberOfMonths,
    setEditNumberOfMonths,
  ] = useState(30);

  const [
    editStartDate,
    setEditStartDate,
  ] = useState(todayISO());

  const [
    editScheduleRows,
    setEditScheduleRows,
  ] = useState<ScheduleRow[]>(
    []
  );

  const [
    editScheduleError,
    setEditScheduleError,
  ] = useState<string | null>(
    null
  );

  const [
    editBulkChitValue,
    setEditBulkChitValue,
  ] = useState('');

  const [
    editBulkBefore,
    setEditBulkBefore,
  ] = useState('');

  const [
    editBulkAfter,
    setEditBulkAfter,
  ] = useState('');

  const [
    editBulkLiftAmount,
    setEditBulkLiftAmount,
  ] = useState('');

  // ====================================================
  // RESET NEW CHITTI FORM
  // ====================================================

  const resetForm = () => {
    const date = todayISO();

    setName('');
    setDescription('');
    setStatus('active');

    setLiftingPaymentEnabled(
      false
    );

    setNumberOfMonths(30);

  setMonthsInput("30");

    setScheduleRows(
      generateSchedule(
        30,
        date
      )
    );

    setBulkChitValue('');
    setBulkBeforeLifting('');
    setBulkAfterLifting('');
    setBulkLiftAmount('');

    setFormError(null);
  };

  // ====================================================
  // NEW CHITTI: MONTH COUNT
  // ====================================================

  const changeNumberOfMonths = (
  value: number
) => {
  const safeValue = Math.min(
  Math.max(value, 1),
  120
);


    setNumberOfMonths(
      safeValue
    );

    setMonthsInput(String(safeValue));

    setScheduleRows(
      (currentRows) =>
        Array.from(
          {
            length:
              safeValue,
          },
          (_, index) => {
            const existing =
              currentRows[
                index
              ];

            if (existing) {
              return {
                ...existing,
                month_number:
                  index + 1,
              };
            }

            return {
              month_number:
                index + 1,

              draw_date: '',
                

              chit_value:
                '',

              lift_amount:
                '',

              before_lifting_amount:
                '',

              after_lifting_amount:
                '',
            };
          }
        )
    );
  };

  // ====================================================
  // NEW CHITTI: START DATE
  // ====================================================

  

  // ====================================================
  // NEW CHITTI: UPDATE ROW
  // ====================================================

  const updateScheduleRow = (
    index: number,
    field: keyof ScheduleRow,
    value: string
  ) => {
    setScheduleRows(
      (rows) =>
        rows.map(
          (
            row,
            rowIndex
          ) =>
            rowIndex ===
            index
              ? {
                  ...row,
                  [field]:
                    value,
                }
              : row
        )
    );
  };

  // ====================================================
  // NEW CHITTI: QUICK FILL
  // ====================================================

  const applyBulkValue = (
    field:
      | 'chit_value'
      | 'lift_amount'
      | 'before_lifting_amount'
      | 'after_lifting_amount',
    value: string
  ) => {
    if (!value.trim()) {
      return;
    }

    const numericValue =
      Number(value);

    if (
      !Number.isFinite(
        numericValue
      ) ||
      numericValue < 0
    ) {
      setFormError(
        'Please enter a valid amount'
      );

      return;
    }

    setScheduleRows(
      (rows) =>
        rows.map(
          (row) => ({
            ...row,
            [field]:
              value,
          })
        )
    );

    setFormError(null);
  };

  // ====================================================
  // CREATE CHITTI
  // ====================================================

  const create = async () => {

  if (busy) return;

  if (monthsInput === "") {
    setFormError("Number of months is required");
    return;
  }

    

    if (
      numberOfMonths < 1
    ) {
      setFormError(
        'Number of months must be at least 1'
      );

      return;
    }

    const invalidRow =
      scheduleRows.find(
        (row) => {
          if (
            !row.draw_date ||
            !row.chit_value ||
            !row.lift_amount ||
            !row.before_lifting_amount
          ) {
            return true;
          }

          if (
            liftingPaymentEnabled &&
            !row.after_lifting_amount
          ) {
            return true;
          }

          const chitValue =
            Number(
              row.chit_value
            );

          const liftAmount =
            Number(
              row.lift_amount
            );

          const before =
            Number(
              row.before_lifting_amount
            );

          const after =
            liftingPaymentEnabled
              ? Number(
                  row.after_lifting_amount
                )
              : before;

          return (
  !Number.isFinite(chitValue) ||
  chitValue < 0 ||
  !Number.isFinite(liftAmount) ||
  liftAmount < 0 ||
  !Number.isFinite(before) ||
  before < 0 ||
  !Number.isFinite(after) ||
  after < 0 ||
  (liftingPaymentEnabled && after <= before)
);
        }
      );

    if (invalidRow) {
 setFormError(
    `Month ${invalidRow.month_number}: After Lifting amount must be greater than Before Lifting amount`
  );

  return;
}

    setBusy(true);
    setFormError(null);

    let createdChitti:
      | Chitti
      | null = null;

    try {
      createdChitti =
        await chittiService.create(
          {
            name:
              name.trim(),

            description:
              description.trim() ||
              null,

            start_date:
              startDate,

            status,

            lifting_payment_enabled:
              liftingPaymentEnabled,

              

            number_of_months:
      numberOfMonths,
          }
        );

      const scheduleData:
        ChittiScheduleInput[] =
        scheduleRows.map(
          (row) => {
            const liftAmount =
              Number(
                row.lift_amount
              );

            const before =
              Number(
                row.before_lifting_amount
              );

            return {
              chitti_id:
                createdChitti!.id,

              month_number:
                row.month_number,

              draw_date:
                row.draw_date,

              chit_value:
                Number(
                  row.chit_value
                ),

              lift_amount:
                Number(
                  row.lift_amount
                ),

              before_lifting_amount:
                before,

              after_lifting_amount:
                liftingPaymentEnabled
                  ? Number(
                      row.after_lifting_amount
                    )
                  : before,
            };
          }
        );

        console.log(
  'CREATE SCHEDULE DATA:',
  scheduleData.length,
  scheduleData
);

await scheduleService.createBulk(
  scheduleData
);

      resetForm();

      setShowForm(
        false
      );

      setSelectedChittiId(
        createdChitti.id
      );

      await refresh();
    } catch (e) {
      console.error(e);

      if (
        createdChitti
      ) {
        try {
          await chittiService.remove(
            createdChitti.id
          );
        } catch (
          cleanupError
        ) {
          console.error(
            'Failed to clean incomplete chitti:',
            cleanupError
          );
        }
      }

      setFormError(
        e instanceof Error
          ? e.message
          : 'Failed to create chitti'
      );
    } finally {
      setBusy(false);
    }
  };

  // ====================================================
  // OPEN SCHEDULE EDITOR
  // ====================================================

  const openScheduleEditor = (
    chitti: Chitti
  ) => {
    const existing =
      allSchedules
        .filter(
          (schedule) =>
            schedule.chitti_id ===
            chitti.id
        )
        .sort(
          (a, b) =>
            a.month_number -
            b.month_number
        );

    setEditingChitti(
      chitti
    );

    setEditLiftingPaymentEnabled(
      Boolean(
        chitti.lifting_payment_enabled
      )
    );

    setEditScheduleError(
      null
    );

    setEditBulkChitValue(
      ''
    );

    setEditBulkBefore(
      ''
    );

    setEditBulkAfter(
      ''
    );

    setEditBulkLiftAmount(
      ''
    );

    
      if (existing.length > 0) {
  const numberOfMonths =
  chitti.number_of_months ??
  Math.max(
    ...existing.map(
      (schedule) =>
        schedule.month_number
    )
  );

  const startDate =
    existing[0]?.draw_date ||
    chitti.start_date ||
    todayISO();

  setEditNumberOfMonths(
    numberOfMonths
  );

  setEditStartDate(
    startDate
  );

  const generatedRows =
    generateSchedule(
      numberOfMonths,
      startDate
    );

  setEditScheduleRows(
    generatedRows.map(
      (generatedRow) => {
        const existingRow =
          existing.find(
            (schedule) =>
              schedule.month_number ===
              generatedRow.month_number
          );

        if (!existingRow) {
          return generatedRow;
        }

        return {
          month_number:
            existingRow.month_number,

          draw_date:
            existingRow.draw_date,

          chit_value:
            String(
              existingRow.chit_value
            ),

          lift_amount:
            String(
              existingRow.lift_amount ?? 0
            ),

          before_lifting_amount:
            String(
              existingRow.before_lifting_amount
            ),

          after_lifting_amount:
            String(
              existingRow.after_lifting_amount
            ),
        };
      }
    )
  );
} else {
  const date =
    chitti.start_date ||
    todayISO();

  const months =
    chitti.number_of_months ?? 30;

  setEditNumberOfMonths(
    months
  );

  setEditStartDate(
    date
  );

  setEditScheduleRows(
    generateSchedule(
      months,
      date
    )
  );
}

    setShowScheduleEditor(
      true
    );
  };

  // ====================================================
  // EDIT: MONTH COUNT
  // ====================================================

  const changeEditNumberOfMonths =
    (
      value: number
    ) => {
      const safeValue =
        Math.min(
          Math.max(
            value,
            1
          ),
          120
        );

      setEditNumberOfMonths(
        safeValue
      );

      setEditScheduleRows(
        (currentRows) =>
          Array.from(
            {
              length:
                safeValue,
            },
            (_, index) => {
              const existing =
                currentRows[
                  index
                ];

              if (
                existing
              ) {
                return {
                  ...existing,

                  month_number:
                    index +
                    1,
                };
              }

              return {
                month_number:
                  index + 1,

                draw_date:
                  addMonths(
                    editStartDate,
                    index
                  ),

                chit_value:
                  '',

                lift_amount:
                  '',

                before_lifting_amount:
                  '',

                after_lifting_amount:
                  '',
              };
            }
          )
      );
    };

  // ====================================================
  // EDIT: START DATE
  // ====================================================

  const changeEditStartDate =
    (
      value: string
    ) => {
      setEditStartDate(
        value
      );

      setEditScheduleRows(
        (rows) =>
          rows.map(
            (
              row,
              index
            ) => ({
              ...row,

              draw_date:
                addMonths(
                  value,
                  index
                ),
            })
          )
      );
    };

  // ====================================================
  // EDIT: UPDATE ROW
  // ====================================================

  const updateEditScheduleRow =
    (
      index: number,
      field: keyof ScheduleRow,
      value: string
    ) => {
      setEditScheduleRows(
        (rows) =>
          rows.map(
            (
              row,
              rowIndex
            ) =>
              rowIndex ===
              index
                ? {
                    ...row,

                    [field]:
                      value,
                  }
                : row
          )
      );
    };

  // ====================================================
  // EDIT: QUICK FILL
  // ====================================================

  const applyEditBulkValue =
    (
      field:
        | 'chit_value'
        | 'lift_amount'
        | 'before_lifting_amount'
        | 'after_lifting_amount',

      value: string
    ) => {
      if (
        !value.trim()
      ) {
        return;
      }

      const numericValue =
        Number(value);

      if (
        !Number.isFinite(
          numericValue
        ) ||
        numericValue < 0
      ) {
        setEditScheduleError(
          'Please enter a valid amount'
        );

        return;
      }

      setEditScheduleRows(
        (rows) =>
          rows.map(
            (row) => ({
              ...row,

              [field]:
                value,
            })
          )
      );

      setEditScheduleError(
        null
      );
    };

  // ====================================================
  // SAVE EDITED SCHEDULE
  // ====================================================

  const saveEditedSchedule =
  async () => {

    if (busy) return;

    if (!editingChitti) {
      return;
    }

      if (
        editNumberOfMonths <
        1
      ) {
        setEditScheduleError(
          'Number of months must be at least 1'
        );

        return;
      }

      if (
        !editStartDate
      ) {
        setEditScheduleError(
          'Start date is required'
        );

        return;
      }

      const invalidRow =
        editScheduleRows.find(
          (row) => {
            if (
              !row.draw_date ||
              !row.chit_value ||
              !row.lift_amount ||
              !row.before_lifting_amount
            ) {
              return true;
            }

            if (
              editLiftingPaymentEnabled &&
              !row.after_lifting_amount
            ) {
              return true;
            }

            const chitValue =
              Number(
                row.chit_value
              );

            const liftAmount = Number(
  row.lift_amount
);

const before = Number(
  row.before_lifting_amount
);

const after =
  editLiftingPaymentEnabled
    ? Number(
        row.after_lifting_amount
      )
    : before;

            return (
  !Number.isFinite(chitValue) ||
  chitValue < 0 ||
  !Number.isFinite(liftAmount) ||
  liftAmount < 0 ||
  !Number.isFinite(before) ||
  before < 0 ||
  !Number.isFinite(after) ||
  after < 0 ||
  (editLiftingPaymentEnabled && after <= before)
);
          }
        );

      if (
        invalidRow
      ) {
        setEditScheduleError(
          `Please complete all required fields correctly for Month ${invalidRow.month_number}`
        );

        return;
      }

      setBusy(true);

      setEditScheduleError(
        null
      );

      try {
        await chittiService.update(
  editingChitti.id,
  {
    start_date:
      editStartDate,

    lifting_payment_enabled:
      editLiftingPaymentEnabled,

    number_of_months:
      editNumberOfMonths,
  }
);

        const rows:
          ChittiScheduleInput[] =
          editScheduleRows.map(
            (row) => {
              const before =
                Number(
                  row.before_lifting_amount
                );

              return {
                chitti_id:
                  editingChitti.id,

                month_number:
                  row.month_number,

                draw_date:
                  row.draw_date,

                chit_value:
                  Number(
                    row.chit_value
                  ),

                lift_amount:
                  Number(
                    row.lift_amount
                  ),

                before_lifting_amount:
                  before,

                after_lifting_amount:
                  editLiftingPaymentEnabled
                    ? Number(
                        row.after_lifting_amount
                      )
                    : before,
              };
            }
          );

          console.log(
  'EDIT SCHEDULE DATA:',
  rows.length,
  rows
);

await scheduleService.upsertBulk(
  rows
);
        const oldRows =
          allSchedules.filter(
            (schedule) =>
              schedule.chitti_id ===
                editingChitti.id &&
              schedule.month_number >
                editNumberOfMonths
          );

        for (
          const oldRow of
          oldRows
        ) {
          await scheduleService.remove(
            oldRow.id
          );
        }

        await refresh();

        setShowScheduleEditor(
          false
        );

        setEditingChitti(
          null
        );

        setEditScheduleRows(
          []
        );

        setEditScheduleError(
          null
        );
      } catch (e) {
        console.error(
          'Schedule save error:',
          e
        );

        setEditScheduleError(
          e instanceof Error
            ? e.message
            : 'Failed to save schedule'
        );
      } finally {
        setBusy(false);
      }
    };

  // ====================================================
  // DELETE
  // ====================================================

  const remove = async (
  chitti: Chitti
) => {

  if (busy) return;

  setBusy(true);

    try {
      await chittiService.remove(
        chitti.id
      );

      if (
        selectedChittiId ===
        chitti.id
      ) {
        setSelectedChittiId(
          null
        );
      }

      await refresh();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : 'Failed to delete chitti'
      );
    } finally {
      setBusy(false);
    }
  };

  // ====================================================
  // LOADING / ERROR
  // ====================================================

  if (loading) {
    return (
      <div className="grid gap-3">
        <SkeletonCard />
        <SkeletonCard />
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
    <div className="space-y-3.5">
      <ChittiSelector
        chittis={chittis}
        selectedId={
          selectedChittiId
        }
        onSelect={
          setSelectedChittiId
        }
      />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            All chittis
          </h2>

          <p className="text-xs text-slate-500">
            Manage chittis and monthly schedules.
          </p>
        </div>

        <button
  className="btn-primary"
  disabled={busy}
  onClick={() => {
    
    if (busy) return;

    resetForm();
    setShowForm(true);
  }}
>
          <Plus className="h-4 w-4" />
          New chitti
        </button>
      </div>

      {chittis.length ===
      0 ? (
        <EmptyState
          icon={Layers}
          title="No chittis yet"
          description="Create your first chitti to get started."
          action={
            <button
  className="btn-primary"
  disabled={busy}
  onClick={() => {
    if (busy) return;

    resetForm();
    setShowForm(true);
  }}
>
              <Plus className="h-4 w-4" />
              New chitti
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
          {chittis.map(
            (
              chitti,
              index
            ) => {
              const chittiSchedules =
                allSchedules
                  .filter(
                    (
                      schedule
                    ) =>
                      schedule.chitti_id ===
                      chitti.id
                  )
                  .sort(
                    (a, b) =>
                      a.month_number -
                      b.month_number
                  );

              const chittiMembers = members.filter(
  (member) => member.chitti_id === chitti.id
);

const finance = computeChittiFinance(
  chittiMembers,
  payments,
  chitti,
  chittiSchedules
);

              const firstSchedule =
                chittiSchedules[0];

              const chittiValue =
                firstSchedule
                  ? Number(
                      firstSchedule.chit_value
                    )
                  : 0;

              return (
                <motion.div
  key={chitti.id}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.04 }}
  className="group overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900"
>
  {/* HEADER */}

  <div className="flex items-center justify-between gap-3 px-4 py-3">

    <div className="flex min-w-0 items-center gap-3">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-sm font-bold text-brand-400">
        {chitti.name
          .split(' ')
          .map((word) => word[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()}
      </div>

      <div className="min-w-0">

        <div className="flex items-center gap-2">

          <h3 className="truncate text-sm font-bold text-slate-100">
            {chitti.name}
          </h3>

          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              chitti.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-400'
                : chitti.status === 'completed'
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'bg-slate-500/10 text-slate-400'
            }`}
          >
            {chitti.status}
          </span>

        </div>

        <p className="mt-0.5 text-[11px] text-slate-500">
          Started {formatDate(chitti.start_date)}
        </p>

      </div>

    </div>

    <button
      type="button"
      className="rounded-lg p-1.5 text-slate-500 opacity-70 transition hover:bg-danger-500/10 hover:text-danger-400 group-hover:opacity-100"
      onClick={() => setConfirmDelete(chitti)}
      title="Delete chitti"
    >
      <Trash2 className="h-4 w-4" />
    </button>

  </div>


  {/* DESCRIPTION */}

  {chitti.description && (
    <div className="border-t border-slate-800/70 px-4 py-2">

      <p className="truncate text-[11px] text-slate-500">
        {chitti.description}
      </p>

    </div>
  )}


  {/* STATS */}

  <div className="grid grid-cols-3 border-y border-slate-800/70">

    <div className="px-4 py-3">

      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        Chit Value
      </p>

      <p className="mt-1 text-sm font-bold text-slate-100">
        {chittiValue > 0
          ? formatMoney(chittiValue)
          : 'Not set'}
      </p>

    </div>


    <div className="border-l border-slate-800/70 px-4 py-3">

      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        Members
      </p>

      <p className="mt-1 text-sm font-bold text-slate-100">
        {finance.totalMembers}
      </p>

    </div>


    <div className="border-l border-slate-800/70 px-4 py-3">

      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        Schedule
      </p>

      <p className="mt-1 text-sm font-bold text-slate-100">
        {chittiSchedules.length > 0
          ? `${chittiSchedules.length} months`
          : 'Not set'}
      </p>

    </div>

  </div>


  {/* FINANCIAL SUMMARY */}

  <div className="flex items-center justify-between gap-4 px-4 py-3">

    <div>

      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        Collected
      </p>

      <p className="mt-0.5 text-sm font-bold text-emerald-400">
        {formatMoney(finance.totalCollected)}
      </p>

    </div>


    <div className="h-8 w-px bg-slate-800" />


    <div className="text-right">

      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        Balance
      </p>

      <p className="mt-0.5 text-sm font-bold text-amber-400">
        {formatMoney(finance.remainingBalance)}
      </p>

    </div>

  </div>


  {/* ACTIONS */}

  <div className="flex gap-2 border-t border-slate-800/70 bg-slate-950/20 px-4 py-3">

    <button
      className="btn-secondary flex-1 text-xs"
      onClick={() => {

        setSelectedChittiId(chitti.id);

        navigate({
          name: 'members',
        });

      }}
    >
      View Members
    </button>


    <button
      className="btn-secondary flex-1 text-xs"
      onClick={() =>
        openScheduleEditor(chitti)
      }
    >

      <Settings2 className="h-3.5 w-3.5" />

      {chittiSchedules.length > 0
        ? 'Edit Schedule'
        : 'Configure Schedule'}

    </button>

  </div>


  {/* WARNING */}

  {chittiSchedules.length === 0 && (

    <div className="border-t border-amber-500/10 bg-amber-500/5 px-4 py-2">

      <p className="text-[10px] font-medium text-amber-400">
        Schedule not configured. Configure it before adding members.
      </p>

    </div>

  )}

</motion.div>
              );
            }
          )}
        </div>
      )}

      {/* ================================================= */}
      {/* NEW CHITTI MODAL */}
      {/* ================================================= */}

      <Modal
  open={showForm}
  
  onClose={() => {
    if (busy) return;

    setShowForm(false);
    resetForm();
  }}
  title="New Chitti"
 size="xl"
      footer={
  <>
    <button
      className="btn-secondary flex-1"
      disabled={busy}
      onClick={() => {
        if (busy) return;

        setShowForm(false);
        resetForm();
      }}
    >
      Cancel
    </button>

    <button
      className="btn-primary h-10 flex-1 flex items-center justify-center gap-2 text-sm"
      disabled={busy}
      onClick={create}
    >
      {busy && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}

      {busy ? "Creating..." : "Create Chitti"}
    </button>
  </>
}
>
        <div className="space-y-4 pb-6">
          <div className="grid gap-2.5">
            <div>
              <label className="label">
                Chitti name
              </label>

              <input
                className="input"
                value={name}
                onChange={(
                  e
                ) =>
                  setName(
                    e.target
                      .value
                  )
                }
                placeholder="e.g. 3 lakh chitti"
              />
            </div>

            <div>
              <label className="label">
                Description
              </label>

              <textarea
  className="input min-h-[64px]"
                value={
                  description
                }
                onChange={(
                  e
                ) =>
                  setDescription(
                    e.target
                      .value
                  )
                }
                placeholder="Optional"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
          

              <div>
                <label className="label">
                  Number of months
                </label>

                <input
                  type="number"
                  onWheel={(e) => e.currentTarget.blur()}
                  min={1}
                  max={120}
                  className="input"
                  value={monthsInput}
                  onChange={(e) => {
  setMonthsInput(e.target.value);
}}
 onBlur={() => {
  if (monthsInput === "") return;

  const value = Number(monthsInput);

  if (value >= 1 && value <= 120) {
    changeNumberOfMonths(value);
  }
}}

                />
              </div>

              <div>
                <label className="label">
                  Status
                </label>

                <select
                  className="input"
                  value={
                    status
                  }
                  onChange={(
                    e
                  ) =>
                    setStatus(
                      e.target
                        .value as ChittiStatus
                    )
                  }
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="completed">
                    Completed
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 px-3.5 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Different payment after lifting
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Enable if members pay a different monthly amount after lifting the chitti.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={
                  liftingPaymentEnabled
                }
                onClick={() =>
                  setLiftingPaymentEnabled(
                    (
                      current
                    ) =>
                      !current
                  )
                }
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  liftingPaymentEnabled
                    ? 'bg-brand-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    liftingPaymentEnabled
                      ? 'left-[22px]'
: 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="border-t border-slate-800/70 pt-3">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-400" />

              <div>
                <h3 className="text-sm font-semibold text-white">
                  Monthly Schedule
                </h3>

                <p className="text-xs text-slate-500">
                  {
                    numberOfMonths
                  }{' '}
                  month
                  {numberOfMonths !==
                  1
                    ? 's'
                    : ''}
                </p>
              </div>
            </div>

            <div className="mb-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <div className="mb-2">
                <h4 className="text-xs font-semibold text-white">
                  Quick Fill
                </h4>

                <p className="mt-0.5 text-[10px] text-slate-500">
                  Enter an amount once and apply it to all months.
                </p>
              </div>

              <div
                className={`grid grid-cols-1 gap-3 ${
                  liftingPaymentEnabled
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
                    : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                }`}
              >
                <div>
                  <label className="label">
                    Chit Value
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      onWheel={(e) => e.currentTarget.blur()}
                      min="0"
                      className="input"
                      value={
                        bulkChitValue
                      }
                      onChange={(
                        e
                      ) =>
                        setBulkChitValue(
                          e.target
                            .value
                        )
                      }
                      placeholder="Amount"
                    />

                    <button
                      type="button"
                      className="btn-secondary shrink-0"
                      onClick={() =>
                        applyBulkValue(
                          'chit_value',
                          bulkChitValue
                        )
                      }
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">
                    Lift Amount
                  </label>
                  <div className="flex gap-2">
                    <input type="number"
                    onWheel={(e) => e.currentTarget.blur()}
                     min="0" className="input" value={bulkLiftAmount}
                      onChange={(e) => setBulkLiftAmount(e.target.value)} placeholder="Amount" />
                    <button type="button" className="btn-secondary shrink-0"
                      onClick={() => applyBulkValue('lift_amount', bulkLiftAmount)}>
                      Apply
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">
                    {liftingPaymentEnabled
                      ? 'Before Lifting'
                      : 'Monthly Amount'}
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      onWheel={(e) => e.currentTarget.blur()}
                      min="0"
                      className="input"
                      value={
                        bulkBeforeLifting
                      }
                      onChange={(
                        e
                      ) =>
                        setBulkBeforeLifting(
                          e.target
                            .value
                        )
                      }
                      placeholder="Amount"
                    />

                    <button
                      type="button"
                      className="btn-secondary shrink-0"
                      onClick={() =>
                        applyBulkValue(
                          'before_lifting_amount',
                          bulkBeforeLifting
                        )
                      }
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {liftingPaymentEnabled && (
                  <div>
                    <label className="label">
                      After Lifting
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        onWheel={(e) => e.currentTarget.blur()}
                        min="0"
                        className="input"
                        value={
                          bulkAfterLifting
                        }
                        onChange={(
                          e
                        ) =>
                          setBulkAfterLifting(
                            e.target
                              .value
                          )
                        }
                        placeholder="Amount"
                      />

                      <button
                        type="button"
                        className="btn-secondary shrink-0"
                        onClick={() =>
                          applyBulkValue(
                            'after_lifting_amount',
                            bulkAfterLifting
                          )
                        }
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="max-h-[42vh] overflow-x-auto overflow-y-auto rounded-xl border border-slate-800/80">
              <table className="w-full min-w-[780px] text-xs">
                <thead className="sticky top-0 z-10 bg-slate-950">
                  <tr>
                    <th className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Month
                    </th>

                    <th className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Draw Date
                    </th>

                    <th className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Chit Value
                    </th>

                    <th className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Lift Amount
                    </th>

                    <th className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {liftingPaymentEnabled
                        ? 'Before Lifting'
                        : 'Monthly Amount'}
                    </th>

                    {liftingPaymentEnabled && (
                      <th className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        After Lifting
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {scheduleRows.map(
                    (
                      row,
                      index
                    ) => (
                      <tr
                        key={
                          row.month_number
                        }
                        className="border-t border-slate-200 dark:border-slate-700"
                      >
                        <td className="p-2 font-semibold">
                          {
                            row.month_number
                          }
                        </td>

                        <td className="p-2">
                          <input
                            type="date"
                            className="input h-8 min-w-[140px] text-xs"
                            value={
                              row.draw_date
                            }
                            onChange={(
                              e
                            ) =>
                              updateScheduleRow(
                                index,
                                'draw_date',
                                e.target
                                  .value
                              )
                            }
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            onWheel={(e) => e.currentTarget.blur()}
                            min="0"
                            className="input h-8 min-w-[115px] text-xs lg:min-w-[125px]"
                            value={
                              row.chit_value
                            }
                            onChange={(
                              e
                            ) =>
                              updateScheduleRow(
                                index,
                                'chit_value',
                                e.target
                                  .value
                              )
                            }
                          />
                        </td>

                        <td className="p-2 align-top">
                          <input type="number"
                          onWheel={(e) => e.currentTarget.blur()}
                           min="0" className="input h-8 min-w-[115px] text-xs lg:min-w-[125px]"
                            value={row.lift_amount}
                            onChange={(e) => updateScheduleRow(index, 'lift_amount', e.target.value)}
                          />
                        </td>

                        <td className="p-2 align-top">
                          <input
                            type="number"
                            onWheel={(e) => e.currentTarget.blur()}
                            min="0"
                            className="input h-8 min-w-[115px] text-xs lg:min-w-[125px]"
                            value={
                              row.before_lifting_amount
                            }
                            onChange={(
                              e
                            ) =>
                              updateScheduleRow(
                                index,
                                'before_lifting_amount',
                                e.target
                                  .value
                              )
                            }
                          />
                        </td>

                        {liftingPaymentEnabled && (
                          <td className="p-2">
                            <input
                              type="number"
                              onWheel={(e) => e.currentTarget.blur()}
                              min="0"
                              className="input h-8 min-w-[115px] text-xs lg:min-w-[125px]"
                              value={
                                row.after_lifting_amount
                              }
                              onChange={(
                                e
                              ) =>
                                updateScheduleRow(
                                  index,
                                  'after_lifting_amount',
                                  e.target
                                    .value
                                )
                              }
                            />
                          </td>
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {formError && (
            <div className="rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-2">
              <p className="text-xs font-medium text-red-400">
                {
                  formError
                }
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* ================================================= */}
      {/* EDIT / CONFIGURE SCHEDULE MODAL */}
      {/* ================================================= */}

      <Modal
  open={showScheduleEditor}
  onClose={() => {
    if (busy) return;

    setShowScheduleEditor(false);
    setEditingChitti(null);
    setEditScheduleRows([]);
    setEditScheduleError(null);
  }}
  title={
    editingChitti
      ? `${
          allSchedules.some(
            (schedule) =>
              schedule.chitti_id === editingChitti.id
          )
            ? 'Edit'
            : 'Configure'
        } Schedule — ${editingChitti.name}`
      : 'Chitti Schedule'
  }
  size="full"
footer={
  <>
    <button
      className="btn-secondary flex-1"
      disabled={busy}
      onClick={() => {
        if (busy) return;

        setShowScheduleEditor(false);
        setEditingChitti(null);
        setEditScheduleRows([]);
        setEditScheduleError(null);
      }}
    >
      Cancel
    </button>

    <button
      className="btn-primary h-10 flex-1 flex items-center justify-center gap-2 text-sm"
      disabled={busy}
      onClick={saveEditedSchedule}
    >
      {busy && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}

      {busy ? "Saving..." : "Save Schedule"}
    </button>
  </>
}
>
        <div className="space-y-6 pb-8">
          {editingChitti && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
              <p className="font-bold text-slate-900 dark:text-white">
                {
                  editingChitti.name
                }
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Started{' '}
                {formatDate(
                  editStartDate
                )}
              </p>

              <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Different payment after lifting
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Turn this on to set a separate amount after a member lifts the chitti.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={
                    editLiftingPaymentEnabled
                  }
                  onClick={() =>
                    setEditLiftingPaymentEnabled(
                      (
                        current
                      ) =>
                        !current
                    )
                  }
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                    editLiftingPaymentEnabled
                      ? 'bg-brand-500'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      editLiftingPaymentEnabled
                        ? 'left-6'
                        : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">
                Start date
              </label>

              <input
                type="date"
                className="input"
                value={
                  editStartDate
                }
                onChange={(
                  e
                ) =>
                  changeEditStartDate(
                    e.target
                      .value
                  )
                }
              />
            </div>

            <div>
              <label className="label">
                Number of months
              </label>

              <input
                type="number"
                onWheel={(e) => e.currentTarget.blur()}
                min={1}
                max={120}
                className="input"
                value={
                  editNumberOfMonths
                }
                onChange={(
                  e
                ) =>
                  changeEditNumberOfMonths(
                    Number(
                      e.target
                        .value
                    ) ||
                      1
                  )
                }
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-white">
                Quick Fill
              </h4>

              <p className="mt-0.5 text-xs text-slate-500">
                Apply an amount to all {
                  editNumberOfMonths
                } months.
              </p>
            </div>

            <div
              className={`grid gap-3 ${
  editLiftingPaymentEnabled
    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
    : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
}`}
            >
              <div>
                <label className="label">
                  Chit Value
                </label>

                <div className="flex gap-2">
                  <input
                    type="number"
                    onWheel={(e) => e.currentTarget.blur()}
                    min="0"
                    className="input"
                    value={
                      editBulkChitValue
                    }
                    onChange={(
                      e
                    ) =>
                      setEditBulkChitValue(
                        e.target
                          .value
                      )
                    }
                    placeholder="Amount"
                  />

                  <button
                    type="button"
                    className="btn-secondary shrink-0"
                    onClick={() =>
                      applyEditBulkValue(
                        'chit_value',
                        editBulkChitValue
                      )
                    }
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div>
                <label className="label">
                  Lift Amount
                </label>
                <div className="flex gap-2">
                  <input type="number"
                  onWheel={(e) => e.currentTarget.blur()}
                   min="0" className="input" value={editBulkLiftAmount}
                    onChange={(e) => setEditBulkLiftAmount(e.target.value)} placeholder="Amount" />
                  <button type="button" className="btn-secondary shrink-0"
                    onClick={() => applyEditBulkValue('lift_amount', editBulkLiftAmount)}>
                    Apply
                  </button>
                </div>
              </div>

              <div>
                <label className="label">
                  {editLiftingPaymentEnabled
                    ? 'Before Lifting'
                    : 'Monthly Amount'}
                </label>

                <div className="flex gap-2">
                  <input
                    type="number"
                    onWheel={(e) => e.currentTarget.blur()}
                    min="0"
                    className="input"
                    value={
                      editBulkBefore
                    }
                    onChange={(
                      e
                    ) =>
                      setEditBulkBefore(
                        e.target
                          .value
                      )
                    }
                    placeholder="Amount"
                  />

                  <button
                    type="button"
                    className="btn-secondary shrink-0"
                    onClick={() =>
                      applyEditBulkValue(
                        'before_lifting_amount',
                        editBulkBefore
                      )
                    }
                  >
                    Apply
                  </button>
                </div>
              </div>

              {editLiftingPaymentEnabled && (
                <div>
                  <label className="label">
                    After Lifting
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      onWheel={(e) => e.currentTarget.blur()}
                      min="0"
                      className="input"
                      value={
                        editBulkAfter
                      }
                      onChange={(
                        e
                      ) =>
                        setEditBulkAfter(
                          e.target
                            .value
                        )
                      }
                      placeholder="Amount"
                    />

                    <button
                      type="button"
                      className="btn-secondary shrink-0"
                      onClick={() =>
                        applyEditBulkValue(
                          'after_lifting_amount',
                          editBulkAfter
                        )
                      }
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Monthly Schedule
              </h3>

              <p className="text-xs text-slate-500">
                Configure each month's draw date and payment amount.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700">
              <div
  className="overflow-x-auto rounded-b-xl"
  style={{
    WebkitOverflowScrolling: 'touch',
    touchAction: 'pan-x pan-y',
  }}
>
                <table
  className="w-full min-w-[950px] table-auto border-separate border-spacing-0 touch-pan-x"
  style={{ WebkitUserSelect: 'none' }}
>
                  <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800">

                    <tr>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500">
                        Month
                      </th>

                      <th className="p-3 text-left text-xs font-semibold text-slate-500">
                        Draw Date
                      </th>

                      <th className="p-3 text-left text-xs font-semibold text-slate-500">
                        Chit Value
                      </th>

                      <th className="p-3 text-left text-xs font-semibold text-slate-500">
                        Lift Amount
                      </th>

                      <th className="p-3 text-left text-xs font-semibold text-slate-500">
                        {editLiftingPaymentEnabled
                          ? 'Before Lifting'
                          : 'Monthly Amount'}
                      </th>

                      {editLiftingPaymentEnabled && (
                        <th className="p-3 text-left text-xs font-semibold text-slate-500">
                          After Lifting
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {editScheduleRows.map(
                      (
                        row,
                        index
                      ) => (
                        <tr
                          key={
                            row.month_number
                          }
                          className="border-t border-slate-200 dark:border-slate-700"
                        >
                          <td className="p-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                            {
                              row.month_number
                            }
                          </td>

                          <td className="p-2 align-top">
                            <input
                              type="date"
                              onPointerDown={(e) => e.stopPropagation()}
                              className="input min-w-[140px] touch-pan-y lg:min-w-[160px]"
                              value={
                                
                                row.draw_date
                              }
                              onChange={(
                                e
                              ) =>
                                updateEditScheduleRow(
                                  index,
                                  'draw_date',
                                  e.target
                                    .value
                                )
                              }
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              onWheel={(e) => e.currentTarget.blur()}
                              min="0"
                              className="input h-8 min-w-[115px] text-xs lg:min-w-[125px]"
                              value={
                                row.chit_value
                              }
                              onChange={(
                                e
                              ) =>
                                updateEditScheduleRow(
                                  index,
                                  'chit_value',
                                  e.target
                                    .value
                                )
                              }
                            />
                          </td>

                          <td className="p-2 align-top">
                            <input type="number"
                            onWheel={(e) => e.currentTarget.blur()}
                             min="0" className="input h-8 min-w-[115px] text-xs lg:min-w-[125px]"
                              value={row.lift_amount}
                              onChange={(e) => updateEditScheduleRow(index, 'lift_amount', e.target.value)}
                            />
                          </td>

                          <td className="p-2 align-top">
                            <input
                              type="number"
                              onWheel={(e) => e.currentTarget.blur()}
                              min="0"
                              className="input h-8 min-w-[115px] text-xs lg:min-w-[125px]"
                              value={
                                row.before_lifting_amount
                              }
                              onChange={(
                                e
                              ) =>
                                updateEditScheduleRow(
                                  index,
                                  'before_lifting_amount',
                                  e.target
                                    .value
                                )
                              }
                            />
                          </td>

                          {editLiftingPaymentEnabled && (
                            <td className="p-2">
                              <input
                                type="number"
                                onWheel={(e) => e.currentTarget.blur()}
                                min="0"
                                className="input h-8 min-w-[115px] text-xs lg:min-w-[125px]"
                                value={
                                  row.after_lifting_amount
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateEditScheduleRow(
                                    index,
                                    'after_lifting_amount',
                                    e.target
                                      .value
                                  )
                                }
                              />
                            </td>
                          )}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {editScheduleError && (
            <div className="rounded-lg bg-danger-500/10 p-3">
              <p className="text-sm text-danger-600">
                {
                  editScheduleError
                }
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* ================================================= */}
      {/* DELETE CONFIRMATION */}
      {/* ================================================= */}

      <ConfirmDialog
        open={
          !!confirmDelete
        }
        onClose={() =>
          setConfirmDelete(
            null
          )
        }
        onConfirm={() => {
  if (busy) return;

  if (confirmDelete) {
    remove(confirmDelete);
    setConfirmDelete(null);
  }
}}
          
        title="Delete chitti?"
        message={`This will permanently delete "${confirmDelete?.name}" and all its members, payments and schedule data. This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}