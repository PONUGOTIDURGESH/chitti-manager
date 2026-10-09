import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import type { Payment } from '@/types';

const MONTHS = 6;

function compact(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

export function CollectionTrend({ payments }: { payments: Payment[] }) {
  const data = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: MONTHS }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - i), 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('en-IN', { month: 'short' }),
        total: 0,
      };
    });
    for (const p of payments) {
      if (p.reversed) continue;
      const b = buckets.find((x) => x.key === p.payment_date.slice(0, 7));
      if (b) b.total += p.amount;
    }
    return buckets;
  }, [payments]);

  const max = Math.max(...data.map((d) => d.total), 1);
  const current = data[data.length - 1].total;
  const previous = data[data.length - 2].total;
  const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
  const empty = data.every((d) => d.total === 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label="Collections over the last six months"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Collection trend</h2>
          <p className="tabular mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatMoney(current)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">collected this month</p>
        </div>
        {change !== null && (
          <span
            className={`chip ${
              change >= 0
                ? 'bg-success-500/10 text-success-600'
                : 'bg-danger-500/10 text-danger-600'
            }`}
          >
            <TrendingUp className={`h-3.5 w-3.5 ${change < 0 ? 'rotate-180' : ''}`} />
            {change >= 0 ? '+' : ''}
            {change}% vs last month
          </span>
        )}
      </div>

      {empty ? (
        <p className="mt-6 pb-2 text-center text-sm text-slate-500">
          Payments will appear here once you start recording them.
        </p>
      ) : (
        <div
          className="mt-5 flex h-36 items-end gap-2 sm:gap-4"
          role="img"
          aria-label={data.map((d) => `${d.label}: ${formatMoney(d.total)}`).join(', ')}
        >
          {data.map((d, i) => {
            const isCurrent = i === data.length - 1;
            const h = Math.max((d.total / max) * 100, d.total > 0 ? 6 : 2);
            return (
              <div
                key={d.key}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                title={`${d.label}: ${formatMoney(d.total)}`}
              >
                <span className="tabular text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {d.total > 0 ? compact(d.total) : ''}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                  className={`w-full max-w-[44px] rounded-t-lg ${
                    isCurrent ? 'bg-brand-500' : 'bg-brand-500/25 dark:bg-brand-400/25'
                  }`}
                />
                <span
                  className={`text-xs ${
                    isCurrent
                      ? 'font-semibold text-brand-600 dark:text-brand-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}