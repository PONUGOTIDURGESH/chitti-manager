import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatMoney } from '@/lib/format';

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  sub,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'brand';
  sub?: string;
}) {
  const tones: Record<string, string> = {
    default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-success-500/10 text-success-600 dark:text-success-500',
    warning: 'bg-warning-500/10 text-warning-600 dark:text-warning-500',
    danger: 'bg-danger-500/10 text-danger-600 dark:text-danger-500',
    brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  };
  const isMoney = typeof value === 'number';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="card card-hover p-4"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 truncate text-xl font-bold text-slate-900 dark:text-white">
            {isMoney ? formatMoney(value) : value}
          </p>
          {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
        </div>
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
        </div>
      </div>
    </motion.div>
  );
}
