import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, Search, Undo2 } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { ConfirmDialog } from '@/components/Modal';
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

  const total = useMemo(() => payments.filter((p) => !p.reversed).reduce((a, p) => a + Number(p.amount), 0), [payments]);

  if (loading) return <div className="grid gap-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Payments</h1>
          <p className="text-sm text-slate-500">{payments.length} records · {formatMoney(total)} collected</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Search by member" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payments yet"
          description="Record your first payment to start building the collection history."
          action={<button className="btn-primary" onClick={() => navigate({ name: 'members' })}><Plus className="h-4 w-4" /> Record payment</button>}
        />
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {sorted.map((p) => {
            const m = memberById(p.member_id);
            if (!m) return null;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-3.5"
              >
                <button onClick={() => navigate({ name: 'member', id: m.id })}>
                  <Avatar name={m.full_name} photoUrl={m.photo_url} size={40} />
                </button>
                <button onClick={() => navigate({ name: 'member', id: m.id })} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{m.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {p.installment_month} · {formatDate(p.payment_date)} · {p.payment_mode}
                    {p.reversed && <span className="ml-1 text-danger-600">· REVERSED</span>}
                  </p>
                </button>
                <div className="text-right">
                  <p className={`text-sm font-bold ${p.reversed ? 'text-slate-400 line-through' : 'text-success-600 dark:text-success-500'}`}>
                    {formatMoney(Number(p.amount))}
                  </p>
                  {!p.reversed && (
                    <button onClick={() => setConfirmReverse(p)} className="text-xs text-slate-400 hover:text-danger-600">
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmReverse}
        onClose={() => setConfirmReverse(null)}
        onConfirm={async () => {
          if (!confirmReverse) return;
          try { await paymentService.reverse(confirmReverse.id); refresh(); }
          catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
        }}
        title="Reverse payment?"
        message={`Reverse ${formatMoney(Number(confirmReverse?.amount ?? 0))}? It stays in history as reversed.`}
        confirmLabel="Reverse"
        danger
      />
    </div>
  );
}
