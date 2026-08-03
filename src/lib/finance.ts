import type {
  Member,
  Payment,
  Chitti,
  ChittiSchedule,
} from '@/types';

export type MemberStatus =
  | 'UP_TO_DATE'
  | 'DUE_SOON'
  | 'DUE'
  | 'OVERDUE'
  | 'PARTIALLY_PAID'
  | 'COMPLETED';

export interface InstallmentRow {
  index: number;
  monthLabel: string;
  dueDate: string;

  // Amount member can receive if chitti is lifted in this month
  liftAmount: number;

  // Monthly installment member has to pay
  amountDue: number;

  amountPaid: number;
  paymentDate: string | null;
  paymentMode: string | null;
  status: 'PAID' | 'PARTIALLY_PAID' | 'PENDING';
}

export interface MemberFinance {
  totalExpected: number;
  totalPaid: number;
  remainingBalance: number;
  installmentsPaid: number;
  installmentsRemaining: number;
  collectionPercentage: number;
  status: MemberStatus;
}

export interface ChittiFinance {
  totalExpected: number;
  totalCollected: number;
  remainingBalance: number;
  collectionPercentage: number;
  totalMembers: number;
  upToDateCount: number;
  pendingCount: number;
  completedCount: number;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function sumPayments(payments: Payment[]): number {
  return round2(
    payments
      .filter((p) => !p.reversed)
      .reduce((acc, p) => acc + Number(p.amount), 0)
  );
}

export function getInstallmentMonthLabel(
  monthStr: string
): string {
  const [y, m] = monthStr.split('-').map(Number);
  const date = new Date(y, m - 1, 1);

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

export function getInstallmentMonths(
  member: Member
): string[] {
  const start = member.start_date
    ? new Date(member.start_date)
    : new Date();

  const months: string[] = [];

  for (let i = 0; i < member.total_installments; i++) {
    const d = new Date(
      start.getFullYear(),
      start.getMonth() + i,
      1
    );

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');

    months.push(`${y}-${m}`);
  }

  return months;
}

export function getDueDateForMonth(
  monthStr: string,
  dueDay: number
): string {
  const [y, m] = monthStr.split('-').map(Number);

  const lastDay = new Date(y, m, 0).getDate();
  const day = Math.min(dueDay, lastDay);

  const d = new Date(y, m - 1, day);

  return d.toISOString().slice(0, 10);
}

export function getScheduledInstallmentAmount(
  member: Member,
  chitti: Chitti | undefined,
  schedule: ChittiSchedule | undefined,
  installmentMonth?: string
): number {
  if (!schedule) {
    return Number(member.installment_amount);
  }

  // Normal chitti:
  // lifting does not affect installment amount.
  if (!chitti?.lifting_payment_enabled) {
    return Number(schedule.before_lifting_amount);
  }

  // Member has not lifted yet.
  if (
    !member.is_lifted ||
    member.lifted_month_number === null
  ) {
    return Number(schedule.before_lifting_amount);
  }

  // Source of truth = schedule month number.
  // Example:
  // lifted_month_number = 7
  // months 1-6  -> before lifting
  // months 7+   -> after lifting
  if (
    schedule.month_number >=
    member.lifted_month_number
  ) {
    return Number(schedule.after_lifting_amount);
  }

  return Number(schedule.before_lifting_amount);
}

export function getInstallmentRows(
  member: Member,
  payments: Payment[],
  chitti?: Chitti,
  schedules: ChittiSchedule[] = []
): InstallmentRow[] {
  const months = getInstallmentMonths(member);

  const activePayments = payments.filter(
    (p) => p.member_id === member.id && !p.reversed
  );

  const memberSchedules = schedules
    .filter(
      (schedule) =>
        schedule.chitti_id === member.chitti_id
    )
    .sort(
      (a, b) => a.month_number - b.month_number
    );

  return months.map((month, index) => {
  const schedule = memberSchedules.find(
    (s) => s.month_number === index + 1
  );

  const amountDue = getScheduledInstallmentAmount(
    member,
    chitti,
    schedule,
    month
  );

  const liftAmount = schedule
    ? Number(schedule.lift_amount)
    : 0;

  const monthPayments = activePayments.filter(
    (p) => p.installment_month === month
  );

  const paid = round2(
    monthPayments.reduce(
      (acc, payment) =>
        acc + Number(payment.amount),
      0
    )
  );

  const lastPayment = [...monthPayments].sort(
    (a, b) =>
      (b.payment_date || '').localeCompare(
        a.payment_date || ''
      )
  )[0];

  let status: InstallmentRow['status'] = 'PENDING';

  if (amountDue > 0 && paid >= amountDue) {
    status = 'PAID';
  } else if (paid > 0) {
    status = 'PARTIALLY_PAID';
  }

  return {
    index: index + 1,
    monthLabel: getInstallmentMonthLabel(month),

    dueDate: schedule?.draw_date
  ? schedule.draw_date
  : getDueDateForMonth(month, member.due_day),

    liftAmount: round2(liftAmount),
    amountDue: round2(amountDue),
    amountPaid: paid,

    paymentDate:
      lastPayment?.payment_date ?? null,

    paymentMode:
      lastPayment?.payment_mode ?? null,

    status,
  };
});
}

export function computeMemberFinance(
  member: Member,
  payments: Payment[],
  chitti?: Chitti,
  schedules: ChittiSchedule[] = []
): MemberFinance {
  const rows = getInstallmentRows(
    member,
    payments,
    chitti,
    schedules
  );

  const totalExpected = round2(
    rows.reduce(
      (sum, row) => sum + row.amountDue,
      0
    )
  );

  const totalPaid = sumPayments(
    payments.filter(
      (p) => p.member_id === member.id
    )
  );

  const remainingBalance = round2(
    Math.max(
      0,
      totalExpected - totalPaid
    )
  );

  const installmentsPaid = rows.filter(
    (row) => row.status === 'PAID'
  ).length;

  const installmentsRemaining = rows.filter(
    (row) => row.status !== 'PAID'
  ).length;

  const collectionPercentage =
    totalExpected > 0
      ? round2(
          Math.min(
            100,
            (totalPaid / totalExpected) * 100
          )
        )
      : 0;

  const status = computeMemberStatus(
    member,
    rows,
    totalPaid,
    totalExpected
  );

  return {
    totalExpected,
    totalPaid,
    remainingBalance,
    installmentsPaid,
    installmentsRemaining,
    collectionPercentage,
    status,
  };
}

export function computeMemberStatus(
  member: Member,
  rows: InstallmentRow[],
  totalPaid: number,
  totalExpected: number
): MemberStatus {
  if (
    totalExpected > 0 &&
    totalPaid >= totalExpected
  ) {
    return 'COMPLETED';
  }

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const pendingRows = rows.filter(
    (row) => row.status !== 'PAID'
  );

  if (pendingRows.length === 0) {
    return 'COMPLETED';
  }

  const firstPending = pendingRows[0];

  if (
    firstPending.status === 'PARTIALLY_PAID'
  ) {
    return 'PARTIALLY_PAID';
  }

  const dueDate = new Date(
    firstPending.dueDate
  );

  const diffDays = Math.floor(
    (dueDate.getTime() - today.getTime()) /
      86400000
  );

  if (diffDays < 0) return 'OVERDUE';
  if (diffDays <= 3) return 'DUE';
  if (diffDays <= 7) return 'DUE_SOON';

  return 'UP_TO_DATE';
}

export function computeChittiFinance(
  members: Member[],
  payments: Payment[],
  chitti?: Chitti,
  schedules: ChittiSchedule[] = []
): ChittiFinance {
  let totalExpected = 0;
  let totalCollected = 0;
  let upToDateCount = 0;
  let pendingCount = 0;
  let completedCount = 0;

  for (const member of members) {
    if (member.archived) continue;

    const finance = computeMemberFinance(
      member,
      payments,
      chitti,
      schedules
    );

    totalExpected += finance.totalExpected;
    totalCollected += finance.totalPaid;

    if (finance.status === 'COMPLETED') {
      completedCount++;
    } else if (
      finance.status === 'UP_TO_DATE' ||
      finance.status === 'DUE_SOON'
    ) {
      upToDateCount++;
    } else {
      pendingCount++;
    }
  }

  totalExpected = round2(totalExpected);
  totalCollected = round2(totalCollected);

  const remainingBalance = round2(
    Math.max(
      0,
      totalExpected - totalCollected
    )
  );

  const collectionPercentage =
    totalExpected > 0
      ? round2(
          Math.min(
            100,
            (totalCollected /
              totalExpected) *
              100
          )
        )
      : 0;

  return {
    totalExpected,
    totalCollected,
    remainingBalance,
    collectionPercentage,

    totalMembers: members.filter(
      (member) => !member.archived
    ).length,

    upToDateCount,
    pendingCount,
    completedCount,
  };
}

export function detectDuplicatePayment(
  payments: Payment[],
  memberId: string,
  installmentMonth: string,
  amount: number,
  withinMs = 5 * 60 * 1000
): Payment | null {
  const now = Date.now();

  return (
    payments.find(
      (payment) =>
        payment.member_id === memberId &&
        payment.installment_month ===
          installmentMonth &&
        Number(payment.amount) === amount &&
        !payment.reversed &&
        Math.abs(
          now -
            new Date(
              payment.created_at
            ).getTime()
        ) <= withinMs
    ) ?? null
  );
}

export function getOutstandingForInstallment(
  member: Member,
  payments: Payment[],
  installmentMonth: string,
  chitti?: Chitti,
  schedules: ChittiSchedule[] = []
): number {
  const months = getInstallmentMonths(member);

  const monthIndex =
    months.indexOf(installmentMonth);

  if (monthIndex === -1) {
    return 0;
  }

  const schedule = schedules.find(
    (s) =>
      s.chitti_id === member.chitti_id &&
      s.month_number === monthIndex + 1
  );

  const amountDue =
    getScheduledInstallmentAmount(
      member,
      chitti,
      schedule,
      installmentMonth
    );


  const paid = round2(
    payments
      .filter(
        (payment) =>
          payment.member_id === member.id &&
          payment.installment_month ===
            installmentMonth &&
          !payment.reversed
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount),
        0
      )
  );

  return round2(
    Math.max(0, amountDue - paid)
  );
}

export function getNextUnpaidInstallmentMonth(
  member: Member,
  payments: Payment[],
  chitti?: Chitti,
  schedules: ChittiSchedule[] = []
): string | null {
  const rows = getInstallmentRows(
    member,
    payments,
    chitti,
    schedules
  );

  const next = rows.find(
    (row) => row.status !== 'PAID'
  );

  if (!next) {
    return null;
  }

  const months =
    getInstallmentMonths(member);

  return months[next.index - 1] ?? null;
}