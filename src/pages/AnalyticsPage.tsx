import { useMemo } from 'react';
import { BarChart3, TrendingUp, Wallet, PieChart } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/States';
import { computeChittiFinance, computeMemberFinance } from '@/lib/finance';
import { formatMoney } from '@/lib/format';
import type { useAppData } from '@/hooks/useAppData';

interface Props { appData: ReturnType<typeof useAppData>; }

export function AnalyticsPage({ appData }: Props) {
  const { members, payments, loading, error, refresh } = appData;

  const data = useMemo(() => {
    const finance = computeChittiFinance(members, payments);
    const activePayments = payments.filter((p) => !p.reversed);

    // monthly collection trend (last 12 months)
    const now = new Date();
    const months: { label: string; key: string; collected: number; expected: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short' });
      const collected = activePayments
        .filter((p) => p.installment_month === key)
        .reduce((a, p) => a + Number(p.amount), 0);
      const expected = members
        .filter((m) => !m.archived)
        .reduce((a, m) => {
          const months = getMemberMonths(m);
          return months.includes(key) ? a + Number(m.installment_amount) : a;
        }, 0);
      months.push({ label, key, collected, expected });
    }

    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyCollected = activePayments
      .filter((p) => p.installment_month === currentMonthKey)
      .reduce((a, p) => a + Number(p.amount), 0);
    const monthlyExpected = members.filter((m) => !m.archived).reduce((a, m) => {
      const months = getMemberMonths(m);
      return months.includes(currentMonthKey) ? a + Number(m.installment_amount) : a;
    }, 0);

    const maxBar = Math.max(...months.map((m) => Math.max(m.collected, m.expected)), 1);

    const completionRate = finance.totalExpected > 0 ? (finance.totalCollected / finance.totalExpected) * 100 : 0;
    const collectionRate = monthlyExpected > 0 ? (monthlyCollected / monthlyExpected) * 100 : 0;

    // paid vs outstanding pie
    const paid = finance.totalCollected;
    const outstanding = finance.remainingBalance;
    const total = paid + outstanding || 1;

    return { finance, months, monthlyCollected, monthlyExpected, maxBar, completionRate, collectionRate, paid, outstanding, total };
  }, [members, payments]);

  if (loading) return <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (members.length === 0) return <EmptyState icon={BarChart3} title="No data to analyze" description="Add members and payments to see analytics." />;

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold text-slate-900 dark:text-white">Analytics</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Monthly expected" value={data.monthlyExpected} icon={Wallet} tone="brand" />
        <StatCard label="Monthly collected" value={data.monthlyCollected} icon={TrendingUp} tone="success" />
        <StatCard label="Outstanding" value={data.finance.remainingBalance} icon={Wallet} tone="warning" />
        <StatCard label="Completion" value={`${data.completionRate.toFixed(1)}%`} icon={PieChart} tone="brand" />
      </div>

      {/* Monthly trend */}
      <section className="card p-4">
        <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Monthly collection trend</h2>
        <div className="flex items-end gap-1.5" style={{ height: 160 }}>
          {data.months.map((m) => (
            <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 120 }}>
                <div className="w-1/2 rounded-t bg-slate-200 dark:bg-slate-700" style={{ height: `${(m.expected / data.maxBar) * 100}%` }} title={`Expected ${formatMoney(m.expected)}`} />
                <div className="w-1/2 rounded-t bg-brand-500" style={{ height: `${(m.collected / data.maxBar) * 100}%` }} title={`Collected ${formatMoney(m.collected)}`} />
              </div>
              <span className="text-[10px] text-slate-500">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-slate-200 dark:bg-slate-700" /> Expected</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-brand-500" /> Collected</span>
        </div>
      </section>

      {/* Paid vs Outstanding */}
      <section className="card p-4">
        <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Paid vs outstanding</h2>
        <div className="flex items-center gap-5">
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="none" strokeWidth="4" className="stroke-warning-500/30" />
              <circle
                cx="18" cy="18" r="15.915" fill="none" strokeWidth="4"
                className="stroke-success-500"
                strokeDasharray={`${(data.paid / data.total) * 100} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{((data.paid / data.total) * 100).toFixed(0)}%</span>
              <span className="text-[10px] text-slate-500">paid</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span className="h-3 w-3 rounded bg-success-500" /> Paid</span>
              <span className="font-bold">{formatMoney(data.paid)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span className="h-3 w-3 rounded bg-warning-500/30" /> Outstanding</span>
              <span className="font-bold">{formatMoney(data.outstanding)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Collection rate */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">This month's collection rate</h2>
        <ProgressBar value={data.collectionRate} showLabel />
        <p className="mt-2 text-xs text-slate-500">{formatMoney(data.monthlyCollected)} of {formatMoney(data.monthlyExpected)} collected this month</p>
      </section>
    </div>
  );
}

function getMemberMonths(member: { start_date: string | null; total_installments: number }): string[] {
  const start = member.start_date ? new Date(member.start_date) : new Date();
  const months: string[] = [];
  for (let i = 0; i < member.total_installments; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}
