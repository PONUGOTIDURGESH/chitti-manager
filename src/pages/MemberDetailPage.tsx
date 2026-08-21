import { useEffect, useMemo, useState, useRef } from 'react';

import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Plus, Share2, FileText, Edit3, Undo2, Archive, Trash2, Clock, CheckCircle2, UserPlus, Wallet } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { StatusBadge, StatusBadgeAnimated } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { StatCard } from '@/components/StatCard';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { EmptyState, ErrorState } from '@/components/States';
import { computeMemberFinance, getInstallmentRows, detectDuplicatePayment, getOutstandingForInstallment, getNextUnpaidInstallmentMonth, getInstallmentMonths } from '@/lib/finance';
import { formatMoney, formatDate, formatDateTime, todayISO, currentMonthStr } from '@/lib/format';
import { memberService, paymentService, memberLiftService } from "@/lib/services";
import { useRouter } from '@/hooks/useRouter';
import type { useAppData } from '@/hooks/useAppData';
import type {
  Member,
  Payment,
  PaymentMode,
  Chitti,
  ChittiSchedule,
} from '@/types';
import StatementCardV2 from "@/components/StatementCardV2";
import { ReceiptCard } from '@/components/ReceiptCard';
import type { InstallmentRow } from '@/lib/finance';
interface Props { memberId: string; appData: ReturnType<typeof useAppData>; }
import type { MemberLift } from "@/types";
export function MemberDetailPage({ memberId, appData }: Props) {

  const [liftMonth, setLiftMonth] = useState("");
const [liftAmount, setLiftAmount] = useState("");
const [newInstallmentAmount, setNewInstallmentAmount] = useState("");
const [liftDate, setLiftDate] = useState(
  new Date().toISOString().split("T")[0]

  
  
);

const [lifts, setLifts] = useState<MemberLift[]>([]);



  const { goBack, navigate } = useRouter();
  const {
  allMembers,
  allPayments,
  allSchedules,
  chittis,
  refresh,
} = appData;
  const member = allMembers.find((m) => m.id === memberId);

  useEffect(() => {
  if (!member) return;

  memberLiftService
    .list(member.id)
    .then(setLifts)
    .catch(console.error);
}, [member]);

  const chitti = chittis.find((c) => c.id === member?.chitti_id);
  const memberPayments = useMemo(
    () => allPayments.filter((p) => p.member_id === memberId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [allPayments, memberId]
  );

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [confirmReverse, setConfirmReverse] = useState<Payment | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [showStatement, setShowStatement] = useState(false);
  const [showReceipt, setShowReceipt] = useState<Payment | null>(null);
  const [showLiftModal, setShowLiftModal] = useState(false);

const [liftedMonthNumber, setLiftedMonthNumber] = useState<number | null>(
  member?.lifted_month_number ?? null
);

const [liftedDate, setLiftedDate] = useState(
  member?.lifted_date ?? todayISO()
);

const [liftingNote, setLiftingNote] = useState(
  member?.lifting_note ?? ''
);

const [liftingBusy, setLiftingBusy] = useState(false);

  if (!member) {
    return <ErrorState message="Member not found" onRetry={goBack} />;
  }

  const memberSchedules = allSchedules.filter(
  (schedule) => schedule.chitti_id === member.chitti_id
);

const sortedMemberSchedules = [...memberSchedules].sort(
  (a, b) => a.month_number - b.month_number
);

const selectedLiftSchedule =
  liftedMonthNumber !== null
    ? sortedMemberSchedules.find(
        (schedule) =>
          schedule.month_number === liftedMonthNumber
      )
    : undefined;

const finance = computeMemberFinance(
  member,
  allPayments,
  chitti,
  memberSchedules,
);

const rows = getInstallmentRows(
  member,
  allPayments,
  chitti,
  memberSchedules,
  lifts
);

console.log('DEBUG SCHEDULES', memberSchedules);
console.log('DEBUG ROWS', rows);

  const timeline = useMemo(() => {
    const items: { date: string; title: string; sub?: string; kind: 'member' | 'payment' }[] = [];
    items.push({ date: member.created_at, title: `${member.full_name} added`, sub: 'Member created', kind: 'member' });
    memberPayments.filter((p) => !p.reversed).forEach((p) => {
      items.push({
        date: p.created_at, title: `${p.installment_month} payment — ${formatMoney(Number(p.amount))}`,
        sub: `${formatDate(p.payment_date)} · ${p.payment_mode}${p.note ? ` · ${p.note}` : ''}`, kind: 'payment',
      });
    });
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [member, memberPayments]);

  const archive = async () => {
    try { await memberService.archive(member.id, !member.archived); refresh(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const addLift = async () => {
  if (!liftMonth || !liftAmount) return;

  try {
    const created = await memberLiftService.create({
      member_id: member.id,
  lift_number: lifts.length + 1,
  lifted_month_number: Number(liftMonth),
  lift_amount: Number(liftAmount),
  new_installment_amount:
  newInstallmentAmount.trim() === ""
    ? null
    : Number(newInstallmentAmount),
  paid_date: liftDate,
  notes: null,
});

    // First lift added? Mark member as lifted
if (lifts.length === 0) {
  await memberService.update(member.id, {
    is_lifted: true,
    lifted_month_number: Number(liftMonth),
    lifted_date: liftDate,
  });

  refresh();
}

    setLifts((prev) => [...prev, created]);

    setLiftMonth("");
    setLiftAmount("");
  } catch (e) {
    alert(e instanceof Error ? e.message : "Failed to save lift");
  }
};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={goBack} className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar name={member.full_name} photoUrl={member.photo_url} size={48} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-slate-900 dark:text-white">{member.full_name}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {member.mobile_number && (
              <a href={`tel:${member.mobile_number}`} className="flex items-center gap-1 hover:text-brand-600">
                <Phone className="h-3.5 w-3.5" /> {member.mobile_number}
              </a>
            )}
            <span>·</span>
            <span>{chitti?.name ?? '—'}</span>
          </div>
        </div>
        <StatusBadgeAnimated status={finance.status} size="sm" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Total chitti" value={finance.totalExpected} icon={Wallet} tone="brand" />
        <StatCard
  label="Monthly installment"
  value={Number(member.installment_amount) * (member.units ?? 1)}
  icon={Clock}
  sub={`${member.units ?? 1} Chitti${(member.units ?? 1) > 1 ? 's' : ''}`}
 />
        <StatCard label="Total paid" value={finance.totalPaid} icon={CheckCircle2} tone="success" />
        <StatCard label="Balance" value={finance.remainingBalance} icon={Wallet} tone="warning" />
        <StatCard label="Installments paid" value={`${finance.installmentsPaid}/${member.total_installments}`} icon={CheckCircle2} />
        <StatCard label="Remaining" value={finance.installmentsRemaining} icon={Clock} sub="months" />
      </div>

      {/* Progress */}
      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600 dark:text-slate-300">Collection progress</span>
          <span className="font-bold text-slate-900 dark:text-white">{finance.collectionPercentage.toFixed(1)}%</span>
        </div>
        <ProgressBar value={finance.collectionPercentage} />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button className="btn-primary" onClick={() => setShowAddPayment(true)}>
          <Plus className="h-4 w-4" /> Add payment
        </button>
        {!member.is_lifted ? (
  <button
    className="btn-secondary"
    onClick={() => {
  setLiftedMonthNumber(null);
  setLiftedDate(todayISO());
  setLiftingNote('');
  setShowLiftModal(true);
}}
  >
    <Wallet className="h-4 w-4" />
    Mark as Lifted
  </button>
) : (
  <button
    className="btn-secondary"
    disabled
  >
    <CheckCircle2 className="h-4 w-4" />
    Lifted
  </button>
)}
        <button className="btn-secondary" onClick={() => setShowStatement(true)}>
          <Share2 className="h-4 w-4" /> Share statement
        </button>
        <button className="btn-secondary" onClick={() => archive()}>
          <Archive className="h-4 w-4" /> {member.archived ? 'Restore' : 'Archive'}
        </button>
        <button className="btn-ghost text-danger-600" onClick={() => setConfirmArchive(true)}>
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/5 p-5">
  <div className="mb-4 flex items-center justify-between">
    <div>
      <h2 className="text-lg font-semibold text-white">Chit Lifts</h2>
      <p className="text-sm text-slate-400">
        Add multiple lift records for this member
      </p>
    </div>

    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200">
      {lifts.length} lifts
    </span>
  </div>

  <div className="grid gap-3 md:grid-cols-3">
    <input
      type="number"
      onWheel={(e) => e.currentTarget.blur()}
      placeholder="Month"
      value={liftMonth}
      onChange={(e) => setLiftMonth(e.target.value)}
      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
    />

    <input
      type="number"
      onWheel={(e) => e.currentTarget.blur()}
      placeholder="Lift Amount"
      value={liftAmount}
      onChange={(e) => setLiftAmount(e.target.value)}
      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
    />

  {chitti?.lifting_payment_enabled && (
  <input
    type="number"
    onWheel={(e) => e.currentTarget.blur()}
    placeholder="Next installment amount"
    value={newInstallmentAmount}
    onChange={(e) => setNewInstallmentAmount(e.target.value)}
    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
  />
)}

    <input
      type="date"
      value={liftDate}
      onChange={(e) => setLiftDate(e.target.value)}
      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
    />
  </div>

  <button
    onClick={addLift}
    className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
  >
    + Add Lift
  </button>

  <div className="mt-4 space-y-3">
    {lifts.length === 0 ? (
      <p className="text-sm text-slate-400">No lift records yet.</p>
    ) : (
      lifts.map((lift) => (
        <div
          key={lift.id}
          className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3"
        >
          <div className="flex items-center justify-between w-full">
  <div>
    <p className="font-medium text-white">
      Month {lift.lifted_month_number}
    </p>

    <p className="text-sm text-slate-400">{lift.paid_date}</p>
  </div>

  <div className="flex items-center gap-3">
    <p className="font-semibold text-white">
      ₹{lift.lift_amount.toLocaleString("en-IN")}
    </p>

    <button
  onClick={async () => {
    try {
      await memberLiftService.remove(lift.id);
      setLifts((prev) => prev.filter((x) => x.id !== lift.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete lift");
    }
  }}
  className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
>
  Delete
</button>
  </div>
</div>
        </div>
      ))
    )}
  </div>
</div>

      {/* Payment table */}
      <section>
        <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">Payment schedule</h2>
        {rows.length === 0 ? (
          <EmptyState icon={FileText} title="No installments configured" />
        ) : (
          <div className="card overflow-hidden">
            {/* Desktop table */}
            <table className="hidden w-full text-sm sm:table">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Month</th>
                  <th className="px-4 py-2.5">Due date</th>
                  <th className="px-4 py-2.5 text-right">Due</th>
                  <th className="px-4 py-2.5 text-right">Paid</th>
                  <th className="px-4 py-2.5">Paid on</th>
                  <th className="px-4 py-2.5">Mode</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r) => (
                  <tr key={r.index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 text-slate-500">{r.index}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">{r.monthLabel}</td>
                    <td className="px-4 py-2.5 text-slate-500">{formatDate(r.dueDate)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-700 dark:text-slate-200">{formatMoney(r.amountDue)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800 dark:text-slate-100">{formatMoney(r.amountPaid)}</td>
                    <td className="px-4 py-2.5 text-slate-500">{formatDate(r.paymentDate)}</td>
                    <td className="px-4 py-2.5 capitalize text-slate-500">{r.paymentMode ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <InstallmentStatusChip status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 text-sm font-bold dark:bg-slate-800/50">
                <tr>
                  <td className="px-4 py-3" colSpan={3}>Totals</td>
                  <td className="px-4 py-3 text-right">{formatMoney(finance.totalExpected)}</td>
                  <td className="px-4 py-3 text-right text-success-600">{formatMoney(finance.totalPaid)}</td>
                  <td className="px-4 py-3" colSpan={2}>Balance {formatMoney(finance.remainingBalance)}</td>
                  <td className="px-4 py-3"><StatusBadge status={finance.status} size="sm" /></td>
                </tr>
              </tfoot>
            </table>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
              {rows.map((r) => (
                <div key={r.index} className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.index}. {r.monthLabel}</span>
                    <InstallmentStatusChip status={r.status} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-xs text-slate-500">
                    <span>Due {formatDate(r.dueDate)}</span>
                    <span>Due {formatMoney(r.amountDue)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-slate-500">Paid {formatDate(r.paymentDate)} · {r.paymentMode ?? '—'}</span>
                    <span className="font-semibold text-success-600 dark:text-success-500">{formatMoney(r.amountPaid)}</span>
                  </div>
                </div>
              ))}
              <div className="bg-slate-50 p-3.5 text-sm dark:bg-slate-800/50">
                <div className="flex justify-between"><span className="text-slate-500">Total paid</span><span className="font-bold text-success-600">{formatMoney(finance.totalPaid)}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-slate-500">Balance</span><span className="font-bold">{formatMoney(finance.remainingBalance)}</span></div>
                <div className="mt-2"><StatusBadge status={finance.status} size="sm" /></div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Payment history with edit/reverse */}
      <section>
        <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">Payment history</h2>
        {memberPayments.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-500">No payments recorded yet.</div>
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {memberPayments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3.5">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${p.reversed ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : 'bg-success-500/10 text-success-600'}`}>
                  {p.reversed ? <Undo2 className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {formatMoney(Number(p.amount))}
                    {p.reversed && <span className="ml-2 text-xs text-danger-600">REVERSED</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.installment_month} · {formatDate(p.payment_date)} · {p.payment_mode}
                    {p.reference_number ? ` · ref ${p.reference_number}` : ''}
                  </p>
                  {p.note && <p className="mt-0.5 text-xs text-slate-400">"{p.note}"</p>}
                </div>
                {!p.reversed && (
                  <div className="flex gap-1">
                    <button onClick={() => setShowReceipt(p)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800" title="Receipt">
                      <FileText className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingPayment(p)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800" title="Edit">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setConfirmReverse(p)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-danger-600 dark:hover:bg-slate-800" title="Reverse">
                      <Undo2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Timeline */}
      <section>
        <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">Timeline</h2>
        <div className="card p-4">
          <ol className="relative border-l-2 border-slate-100 dark:border-slate-800">
            {timeline.map((t, i) => (
              <li key={i} className="mb-4 ml-4 last:mb-0">
                <div className={`absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${t.kind === 'member' ? 'bg-accent-500' : 'bg-success-500'}`} />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.title}</p>
                <p className="text-xs text-slate-500">{formatDateTime(t.date)}</p>
                {t.sub && <p className="text-xs text-slate-400">{t.sub}</p>}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Private notes */}
      {member.notes && (
        <section>
          <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">Private notes</h2>
          <div className="card p-4 text-sm text-slate-600 dark:text-slate-300">{member.notes}</div>
        </section>
      )}

      {/* Mark as Lifted Modal */}
<Modal
  open={showLiftModal}
  onClose={() => {
    if (!liftingBusy) {
      setShowLiftModal(false);
    }
  }}
  title="Mark chitti as lifted"
  size="sm"
  footer={
    <>
      <button
        className="btn-secondary flex-1"
        disabled={liftingBusy}
        onClick={() => setShowLiftModal(false)}
      >
        Cancel
      </button>

      <button
        className="btn-primary flex-1"
        disabled={
          liftingBusy ||
          liftedMonthNumber === null ||
          !liftedDate
        }
        onClick={async () => {
          if (
            liftedMonthNumber === null ||
            !liftedDate
          ) {
            return;
          }

          setLiftingBusy(true);

          try {
            const existingLifts = await memberLiftService.list(member.id);

await memberLiftService.create({
  member_id: member.id,
  lift_number: existingLifts.length + 1,
  lifted_month_number: liftedMonthNumber,
  lift_amount: selectedLiftSchedule!.lift_amount,
   new_installment_amount:
  newInstallmentAmount.trim() === ""
    ? null
    : Number(newInstallmentAmount),
  paid_date: liftedDate,
  notes: liftingNote.trim() || null,
});

            setShowLiftModal(false);
            await refresh();
          } catch (e) {
            alert(
              e instanceof Error
                ? e.message
                : 'Failed to mark member as lifted'
            );
          } finally {
            setLiftingBusy(false);
          }
        }}
      >
        {liftingBusy ? 'Saving...' : 'Confirm Lifted'}
      </button>
    </>
  }
>
  <div className="space-y-4">

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="mb-4 flex items-center justify-between">
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Chit Lifts</h2>
      <p className="text-sm text-slate-500">
        Add multiple lift records for this member.
      </p>
    </div>

    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
      {lifts.length} lifts
    </span>
  </div>

  <div className="grid gap-3 md:grid-cols-3">
    <input
      type="number"
      onWheel={(e) => e.currentTarget.blur()}
      placeholder="Month"
      value={liftMonth}
      onChange={(e) => setLiftMonth(e.target.value)}
      className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
    />

    <input
      type="number"
      onWheel={(e) => e.currentTarget.blur()}
      placeholder="Lift Amount"
      value={liftAmount}
      onChange={(e) => setLiftAmount(e.target.value)}
      className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
    />

    <input
      type="date"
      value={liftDate}
      onChange={(e) => setLiftDate(e.target.value)}
      className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
    />
  </div>

  <button
    onClick={addLift}
    className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
  >
    + Add Lift
  </button>

  <div className="mt-5 space-y-3">
    {lifts.length === 0 ? (
      <p className="text-sm text-slate-500">No lift records yet.</p>
    ) : (
      lifts.map((lift) => (
        <div
          key={lift.id}
          className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
        >
          <div>
            <p className="font-medium text-slate-900">
              Month {lift.lifted_month_number}
            </p>

            <p className="text-sm text-slate-500">{lift.paid_date}</p>
          </div>

          <p className="font-semibold text-slate-900">
            ₹{lift.lift_amount.toLocaleString("en-IN")}
          </p>
        </div>
      ))
    )}
  </div>
</div>

    <div className="rounded-xl bg-brand-500/10 p-3">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">
        {member.full_name}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Select the month in which this member lifted the chitti.
        From that month onwards, the after-lifting installment
        amount will apply.
      </p>
    </div>

    <div>
      <label className="label">
        Lifted month
      </label>

      <select
        className="input"
        value={liftedMonthNumber ?? ''}
        onChange={(e) => {
          const value = Number(e.target.value);

          if (!value) {
            setLiftedMonthNumber(null);
            return;
          }

          setLiftedMonthNumber(value);

          const schedule =
            sortedMemberSchedules.find(
              (item) =>
                item.month_number === value
            );

          if (schedule?.draw_date) {
            setLiftedDate(schedule.draw_date);
          }
        }}
      >
        <option value="">
          Select lifted month
        </option>

        {sortedMemberSchedules.map((schedule) => (
          <option
            key={schedule.id}
            value={schedule.month_number}
          >
            Month {schedule.month_number}
          </option>
        ))}
      </select>
    </div>

    {selectedLiftSchedule && (
      <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">
            Lift amount
          </span>

          <span className="font-bold text-slate-900 dark:text-white">
            {formatMoney(
              Number(selectedLiftSchedule.lift_amount)
            )}
          </span>
        </div>

        <div className="mt-2 flex justify-between text-sm">
          <span className="text-slate-500">
            Before lifting
          </span>

          <span className="font-semibold">
            {formatMoney(
              Number(
                selectedLiftSchedule.before_lifting_amount
              )
            )}
          </span>
        </div>

        <div className="mt-2 flex justify-between text-sm">
          <span className="text-slate-500">
            After lifting
          </span>

          <span className="font-semibold">
            {formatMoney(
              Number(
                selectedLiftSchedule.after_lifting_amount
              )
            )}
          </span>
        </div>
      </div>
    )}

    <div>
      <label className="label">
        Lifted date
      </label>

      <input
        type="date"
        className="input"
        value={liftedDate}
        onChange={(e) =>
          setLiftedDate(e.target.value)
        }
      />
    </div>

    <div>
      <label className="label">
        Note (optional)
      </label>

      <textarea
        className="input"
        rows={3}
        value={liftingNote}
        onChange={(e) =>
          setLiftingNote(e.target.value)
        }
        placeholder="e.g. Lifted in auction"
      />
    </div>

  </div>
</Modal>

      {/* Add payment modal */}
      <AddPaymentModal
        open={showAddPayment}
        onClose={() => setShowAddPayment(false)}
        member={member}
        payments={allPayments}
        rows={rows}
        chitti={chitti}
schedules={memberSchedules}
lifts={lifts}
        onSaved={() => { setShowAddPayment(false); refresh(); }}
      />

      {/* Edit payment modal */}
      <AddPaymentModal
        open={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        member={member}
        payments={allPayments}
        rows={rows}
        chitti={chitti}
schedules={memberSchedules}
lifts={lifts}
        editing={editingPayment ?? undefined}
        onSaved={() => { setEditingPayment(null); refresh(); }}
      />

      {/* Reverse confirm */}
      <ConfirmDialog
        open={!!confirmReverse}
        onClose={() => setConfirmReverse(null)}
        onConfirm={async () => {
          if (!confirmReverse) return;
          try { await paymentService.reverse(confirmReverse.id); refresh(); }
          catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
        }}
        title="Reverse payment?"
        message={`Reverse ${formatMoney(Number(confirmReverse?.amount ?? 0))} for ${confirmReverse?.installment_month}? The record stays in history marked as reversed. Totals will recalculate.`}
        confirmLabel="Reverse"
        danger
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        onConfirm={async () => {
          try { await memberService.remove(member.id); goBack(); refresh(); }
          catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
        }}
        title="Delete member permanently?"
        message={`This deletes ${member.full_name} and all their payment records. This cannot be undone. Consider archiving instead.`}
        confirmLabel="Delete forever"
        danger
      />

      {/* Statement */}
      {showStatement && (
  <StatementModal
    open={showStatement}
    onClose={() => setShowStatement(false)}
    member={member}
    payments={memberPayments}
    chitti={chitti!}
    schedules={allSchedules}
    lifts={lifts}
  />
)}

      {/* Receipt */}
      {showReceipt && (
        <ReceiptModal
          payment={showReceipt}
          member={member}
          chittiName={chitti?.name ?? ''}
          remainingBalance={finance.remainingBalance}
          onClose={() => setShowReceipt(null)}
        />
      )}
    </div>
  );
}

function InstallmentStatusChip({ status }: { status: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' }) {
  const map = {
    PAID: 'bg-success-500/10 text-success-600 dark:text-success-500',
    PARTIALLY_PAID: 'bg-amber-500/10 text-amber-600 dark:text-amber-500',
    PENDING: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  };
  const label = status === 'PAID' ? 'Paid' : status === 'PARTIALLY_PAID' ? 'Partial' : 'Pending';
  return <span className={`chip ${map[status]}`}>{label}</span>;
}

// ---------- Add / Edit payment ----------
function AddPaymentModal({
  open,
  onClose,
  member,
  payments,
  rows,
  chitti,
  schedules,
  lifts,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  member: Member;
  payments: Payment[];
  rows: InstallmentRow[];
  chitti?: Chitti;
  schedules: ChittiSchedule[];
    lifts: MemberLift[];
  editing?: Payment;
  onSaved: () => void;
}) {
  const nextMonth =
    editing?.installment_month ??
    getNextUnpaidInstallmentMonth(member, payments, chitti, schedules) ??
    currentMonthStr();

  const [memberId] = useState(member.id);
  const [installmentMonth, setInstallmentMonth] = useState(nextMonth);

  const getOutstanding = (month: string) =>
  getOutstandingForInstallment(
    member,
    payments,
    month,
    chitti,
    schedules,
    lifts
  );

  const [amount, setAmount] = useState(
    String(editing?.amount ?? getOutstanding(nextMonth))
  );
  const [paymentDate, setPaymentDate] = useState(editing?.payment_date ?? todayISO());
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(editing?.payment_mode ?? 'upi');
  const [reference, setReference] = useState(editing?.reference_number ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [busy, setBusy] = useState(false);
  
  const [err, setErr] = useState<string | null>(null);
  const [dup, setDup] = useState<Payment | null>(null);
  const [overpay, setOverpay] = useState(false);

  const months = getInstallmentMonths(member);
  const outstanding = getOutstanding(installmentMonth);
  const selectedIndex = months.indexOf(installmentMonth);
  const selectedRow = selectedIndex >= 0 ? rows[selectedIndex] : undefined;
  const scheduledAmount = selectedRow?.amountDue ?? outstanding;
  const entered = Number(amount) || 0;

  const handleMonthChange = (month: string) => {
    setInstallmentMonth(month);
    if (!editing) setAmount(String(getOutstanding(month)));
    setErr(null);
    setDup(null);
    setOverpay(false);
  };

  const submit = async (force = false) => {
    if (entered <= 0) {
      setErr('Amount must be greater than 0');
      return;
    }
    setErr(null);

    if (!editing && !force) {
      const d = detectDuplicatePayment(payments, memberId, installmentMonth, entered);
      if (d) {
        setDup(d);
        return;
      }
    }

    if (entered > outstanding + 0.01 && !force) {
      setOverpay(true);
      return;
    }

    setBusy(true);
    try {
      const payload = {
        member_id: memberId,
        chitti_id: member.chitti_id,
        amount: entered,
        payment_date: paymentDate,
        installment_month: installmentMonth,
        payment_mode: paymentMode,
        reference_number: reference.trim() || null,
        note: note.trim() || null,
      };

      if (editing) await paymentService.update(editing.id, payload);
      else await paymentService.create(payload);

      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save payment');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit payment' : 'Add payment'}
      size="lg"
      footer={
        <>
          <button className="btn-secondary flex-1" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="btn-primary flex-1"
            disabled={busy}
            onClick={() => submit(false)}
            type="button"
          >
            {busy ? 'Saving...' : editing ? 'Save changes' : 'Confirm payment'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {member.full_name}
          </p>
          <p className="text-xs text-slate-500">
            Scheduled amount {formatMoney(scheduledAmount)} · Outstanding {formatMoney(outstanding)}
          </p>
          {chitti?.lifting_payment_enabled && (
            <p className="mt-1 text-xs text-slate-500">
              {member.is_lifted
                ? `Lifted${member.lifted_date ? ` on ${formatDate(member.lifted_date)}` : ''}`
                : 'Not lifted yet'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount (₹)</label>
            <input
              className="input"
              type="number"
              onWheel={(e) => e.currentTarget.blur()}
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="label">Installment month</label>
            <select
              className="input"
              value={installmentMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
            >
              {months.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Payment date</label>
            <input
              className="input"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Payment mode</label>
            <select
              className="input"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Reference number (optional)</label>
          <input
            className="input"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="UPI ref / txn id"
          />
        </div>

        <div>
          <label className="label">Note (optional)</label>
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Partial payment, etc."
          />
        </div>

        {dup && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <p className="font-semibold text-amber-700 dark:text-amber-400">Possible duplicate payment</p>
            <p className="mt-1 text-amber-700 dark:text-amber-400">
              A similar {formatMoney(Number(dup.amount))} payment was already recorded for {dup.installment_month}.
            </p>
            <div className="mt-2 flex gap-2">
              <button className="btn-secondary text-xs" onClick={() => setDup(null)}>Cancel</button>
              <button className="btn-primary text-xs" onClick={() => { setDup(null); submit(true); }}>Save anyway</button>
            </div>
          </div>
        )}

        {overpay && (
          <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-3 text-sm">
            <p className="font-semibold text-danger-700 dark:text-danger-400">Payment exceeds remaining balance</p>
            <p className="mt-1 text-danger-700 dark:text-danger-400">
              Outstanding for this installment: {formatMoney(outstanding)}. Entered: {formatMoney(entered)}.
            </p>
            <div className="mt-2 flex gap-2">
              <button className="btn-secondary text-xs" onClick={() => setOverpay(false)}>Cancel</button>
              <button className="btn-danger text-xs" onClick={() => { setOverpay(false); submit(true); }}>Save anyway</button>
            </div>
          </div>
        )}

        {err && <p className="text-sm text-danger-600">{err}</p>}
      </div>
    </Modal>
  );
}

// ---------- Statement modal ----------
function StatementModal({
  open,
  onClose,
  member,
  payments,
  chitti,
  schedules,
  lifts,
}: {
  open: boolean;
onClose: () => void;
member: Member;
payments: Payment[];
chitti: Chitti;
schedules: ChittiSchedule[];
lifts: MemberLift[];
}) {
  return (
    <Modal open={open} onClose={onClose} title="Member statement" size="lg">
      <StatementCardV2
  member={member}
  payments={payments}
  chitti={chitti}
  schedules={schedules}
  lifts={lifts}
/>
    </Modal>
  );
}

// ---------- Receipt modal ----------
function ReceiptModal({
  payment, member, chittiName, remainingBalance, onClose,
}: {
  payment: Payment; member: Member; chittiName: string; remainingBalance: number; onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} title="Payment receipt" size="md">
      <ReceiptCard payment={payment} member={member} chittiName={chittiName} remainingBalance={remainingBalance} />
    </Modal>
  );
}
