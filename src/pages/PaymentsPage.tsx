import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  Plus,
  Search,
  Undo2,
  TrendingUp,
  RotateCcw,
  ReceiptText,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { Modal,ConfirmDialog } from '@/components/Modal';
import { formatMoney, formatDate } from '@/lib/format';
import { paymentService } from '@/lib/services';
import { useRouter } from '@/hooks/useRouter';
import type { useAppData } from '@/hooks/useAppData';
import type { Payment } from '@/types';

interface Props { appData: ReturnType<typeof useAppData>; }

export function PaymentsPage({ appData }: Props) {
  const { members, payments, loading, error, refresh } = appData;
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  const [confirmReverse, setConfirmReverse] = useState<Payment | null>(null);
const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const memberById = (id: string) => members.find((m) => m.id === id);

  const sorted = useMemo(() => {
    const list = [...payments].sort((a, b) => (b.payment_date + b.created_at).localeCompare(a.payment_date + a.created_at));
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((p) => {
      const m = memberById(p.member_id);
      return m && (m.full_name.toLowerCase().includes(q) || (m.mobile_number ?? '').includes(q));
    });
  }, [payments, query, members]);

  const total = useMemo(
  () =>
    payments
      .filter((p) => !p.reversed)
      .reduce((a, p) => a + Number(p.amount), 0),
  [payments]
);

const activePayments = useMemo(
  () => payments.filter((p) => !p.reversed),
  [payments]
);

const reversedPayments = useMemo(
  () => payments.filter((p) => p.reversed),
  [payments]
);

  if (loading) return <div className="grid gap-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
  <div className="space-y-4 pb-6">

    {/* ================================================= */}
    {/* HEADER */}
    {/* ================================================= */}

    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-400">
          Payment management
        </p>

        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-white">
          Payments
        </h1>

        <p className="mt-0.5 text-xs text-slate-500">
          Track collections and payment history.
        </p>
      </div>

      <button
        className="btn-primary self-start sm:self-auto"
        onClick={() => navigate({ name: 'members' })}
      >
        <Plus className="h-4 w-4" />
        Record payment
      </button>

    </div>


    {/* ================================================= */}
    {/* SUMMARY */}
    {/* ================================================= */}

    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">

      {/* TOTAL COLLECTED */}

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">

        <div className="flex items-start justify-between">

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Total collected
            </p>

            <p className="mt-1 text-lg font-bold text-emerald-400">
              {formatMoney(total)}
            </p>
          </div>

          <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="h-4 w-4" />
          </div>

        </div>

      </div>


      {/* PAYMENT RECORDS */}

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">

        <div className="flex items-start justify-between">

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Payment records
            </p>

            <p className="mt-1 text-lg font-bold text-white">
              {activePayments.length}
            </p>
          </div>

          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/10 text-brand-400">
            <ReceiptText className="h-4 w-4" />
          </div>

        </div>

      </div>


      {/* REVERSED */}

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">

        <div className="flex items-start justify-between">

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Reversed
            </p>

            <p className="mt-1 text-lg font-bold text-slate-300">
              {reversedPayments.length}
            </p>
          </div>

          <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-500/10 text-slate-400">
            <RotateCcw className="h-4 w-4" />
          </div>

        </div>

      </div>

    </div>


    {/* ================================================= */}
    {/* SEARCH */}
    {/* ================================================= */}

    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">

      <div className="relative">

        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

        <input
          className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/10"
          placeholder="Search member by name or phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

      </div>

    </div>


    {/* ================================================= */}
    {/* PAYMENT CONTENT */}
    {/* ================================================= */}

    {sorted.length === 0 ? (

      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40">

        <EmptyState
          icon={Wallet}
          title={
            payments.length === 0
              ? 'No payments yet'
              : 'No payments found'
          }
          description={
            payments.length === 0
              ? 'Record your first payment to start building the collection history.'
              : 'Try searching with a different member name or phone number.'
          }
          action={
            payments.length === 0 ? (
              <button
                className="btn-primary"
                onClick={() => navigate({ name: 'members' })}
              >
                <Plus className="h-4 w-4" />
                Record payment
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

        <div className="hidden border-b border-slate-800 bg-slate-950/40 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 lg:grid lg:grid-cols-[2fr_1.8fr_1fr_0.9fr_0.7fr] lg:items-center lg:gap-4">

          <div>Member</div>
          <div>Payment details</div>
          <div>Amount</div>
          <div>Status</div>
          <div className="text-right">Action</div>

        </div>


        {/* ================================================= */}
        {/* PAYMENT ROWS */}
        {/* ================================================= */}

        {sorted.map((p) => {

          const m = memberById(p.member_id);

          if (!m) return null;

          return (

            <motion.div
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-b border-slate-800/70 last:border-b-0"
            >

              {/* ================================================= */}
              {/* DESKTOP */}
              {/* ================================================= */}

              <div className="hidden px-4 py-2.5 transition hover:bg-slate-800/20 lg:grid lg:grid-cols-[2fr_1.8fr_1fr_0.9fr_0.7fr] lg:items-center lg:gap-4">

                {/* MEMBER */}

                <button
                  onClick={() =>
                    navigate({
                      name: 'member',
                      id: m.id,
                    })
                  }
                  className="flex min-w-0 items-center gap-3 text-left"
                >

                  <Avatar
                    name={m.full_name}
                    photoUrl={m.photo_url}
                    size={36}
                  />

                  <div className="min-w-0">

                    <p className="truncate text-[13px] font-semibold text-slate-100">
                      {m.full_name}
                    </p>

                    <p className="mt-0.5 truncate text-[10px] text-slate-500">
                      {m.mobile_number || 'No phone number'}
                    </p>

                  </div>

                </button>


                {/* PAYMENT DETAILS */}

                <div className="min-w-0">

                  <p className="truncate text-xs font-medium text-slate-300">
                    {p.installment_month || 'Payment'}
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {formatDate(p.payment_date)}
                    {' · '}
                    {p.payment_mode}
                  </p>

                </div>


                {/* AMOUNT */}

                <div>

                  <p
                    className={`text-sm font-bold ${
                      p.reversed
                        ? 'text-slate-500 line-through'
                        : 'text-emerald-400'
                    }`}
                  >
                    {formatMoney(Number(p.amount))}
                  </p>

                </div>


                {/* STATUS */}

                <div>

                  {p.reversed ? (

                    <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-400">
                      Reversed
                    </span>

                  ) : (

                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400">
                      Completed
                    </span>

                  )}

                </div>


                {/* ACTION */}
                <button
  type="button"
  onClick={() => setEditingPayment(p)}
  title="Edit payment"
  className="mr-1.5 rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-500 transition hover:border-brand-500/30 hover:bg-brand-500/5 hover:text-brand-400"
>
  <Pencil className="h-3.5 w-3.5" />
</button>

                <div className="flex justify-end">

                  {!p.reversed && (

                    <button
                      onClick={() =>
                        setConfirmReverse(p)
                      }
                      title="Reverse payment"
                      className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-500 transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>

                  )}

                </div>

              </div>


              {/* ================================================= */}
              {/* MOBILE */}
              {/* ================================================= */}

              <div className="p-2.5 lg:hidden">

                <div className="rounded-xl border border-slate-800/80 bg-slate-950/30">

                  {/* MEMBER */}

                  <button
                    onClick={() =>
                      navigate({
                        name: 'member',
                        id: m.id,
                      })
                    }
                    className="flex w-full items-center gap-3 p-3 text-left"
                  >

                    <Avatar
                      name={m.full_name}
                      photoUrl={m.photo_url}
                      size={38}
                    />

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-semibold text-slate-100">
                        {m.full_name}
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {m.mobile_number || 'No phone number'}
                      </p>

                    </div>

                    <p
                      className={`text-sm font-bold ${
                        p.reversed
                          ? 'text-slate-500 line-through'
                          : 'text-emerald-400'
                      }`}
                    >
                      {formatMoney(Number(p.amount))}
                    </p>

                  </button>


                  {/* DETAILS */}

                  <div className="grid grid-cols-3 border-t border-slate-800/70">

                    <div className="p-2.5">

                      <p className="text-[9px] uppercase tracking-wide text-slate-600">
                        Installment
                      </p>

                      <p className="mt-1 truncate text-[10px] font-medium text-slate-300">
                        {p.installment_month || 'Payment'}
                      </p>

                    </div>


                    <div className="border-l border-slate-800/70 p-2.5">

                      <p className="text-[9px] uppercase tracking-wide text-slate-600">
                        Date
                      </p>

                      <p className="mt-1 text-[10px] font-medium text-slate-300">
                        {formatDate(p.payment_date)}
                      </p>

                    </div>


                    <div className="border-l border-slate-800/70 p-2.5">

                      <p className="text-[9px] uppercase tracking-wide text-slate-600">
                        Mode
                      </p>

                      <p className="mt-1 text-[10px] font-medium text-slate-300">
                        {p.payment_mode}
                      </p>

                    </div>

                  </div>


                  {/* ACTION */}

                  <div className="flex items-center justify-between border-t border-slate-800/70 px-3 py-2">

                    {p.reversed ? (

                      <span className="text-[10px] font-semibold text-red-400">
                        Payment reversed
                      </span>

                    ) : (

                      <span className="text-[10px] font-semibold text-emerald-400">
                        Payment completed
                      </span>

                    )}

                    {!p.reversed && (

                      <button
                        onClick={() =>
                          setConfirmReverse(p)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400"
                      >
                        <Undo2 className="h-3 w-3" />
                        Reverse
                      </button>

                    )}

                  </div>

                </div>

              </div>

            </motion.div>

          );
        })}

      </div>

    )}

{/* EDIT PAYMENT */}
{editingPayment && (
  <Modal
    open={!!editingPayment}
    onClose={() => setEditingPayment(null)}
    title="Edit Payment"
    footer={
      <>
        <button
          type="button"
          className="btn-secondary flex-1"
          onClick={() => setEditingPayment(null)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="btn-primary flex-1"
          onClick={async () => {
            if (!editingPayment) return;

            try {
              await paymentService.update(
                editingPayment.id,
                {
                  amount: editingPayment.amount,
                  payment_date: editingPayment.payment_date,
                  payment_mode: editingPayment.payment_mode,
                  installment_month: editingPayment.installment_month,
                }
              );

              setEditingPayment(null);
              refresh();
            } catch (e) {
              alert(
                e instanceof Error
                  ? e.message
                  : 'Failed to update payment'
              );
            }
          }}
        >
          Save Changes
        </button>
      </>
    }
  >
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
          Amount
        </label>

        <input
          type="number"
          min="0"
          value={editingPayment.amount}
          onChange={(e) =>
            setEditingPayment({
              ...editingPayment,
              amount: Number(e.target.value),
            })
          }
          className="input w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
          Payment Date
        </label>

        <input
          type="date"
          value={editingPayment.payment_date}
          onChange={(e) =>
            setEditingPayment({
              ...editingPayment,
              payment_date: e.target.value,
            })
          }
          className="input w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
          Payment Mode
        </label>

        <input
          type="text"
          value={editingPayment.payment_mode}
          onChange={(e) =>
            setEditingPayment({
              ...editingPayment,
              payment_mode: e.target.value as typeof editingPayment.payment_mode,
            })
          }
          className="input w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
          Installment
        </label>

        <input
          type="text"
          value={editingPayment.installment_month ?? ''}
          onChange={(e) =>
            setEditingPayment({
              ...editingPayment,
              installment_month: e.target.value,
            })
          }
          className="input w-full"
        />
      </div>
    </div>
  </Modal>
)}

    {/* ================================================= */}
    {/* REVERSE CONFIRMATION */}
    {/* ================================================= */}

    <ConfirmDialog
      open={!!confirmReverse}
      onClose={() => setConfirmReverse(null)}
      onConfirm={async () => {

        if (!confirmReverse) return;

        try {

          await paymentService.reverse(
            confirmReverse.id
          );

          setConfirmReverse(null);

          refresh();

        } catch (e) {

          alert(
            e instanceof Error
              ? e.message
              : 'Failed'
          );

        }

      }}
      title="Reverse payment?"
      message={`Reverse ${formatMoney(
        Number(confirmReverse?.amount ?? 0)
      )}? It stays in history as reversed.`}
      confirmLabel="Reverse"
      danger
    />

  </div>
);
}
