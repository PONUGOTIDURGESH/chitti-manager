import { motion } from 'framer-motion';
import type { MemberStatus } from '@/lib/finance';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, AlertCircle, Clock, CalendarClock, PauseCircle, CheckCircle } from 'lucide-react';

interface Config {
  label: string;
  classes: string;
  icon: LucideIcon;
}

const config: Record<MemberStatus, Config> = {
  UP_TO_DATE: { label: 'Up to date', classes: 'bg-success-500/10 text-success-600 dark:text-success-500', icon: CheckCircle2 },
  DUE_SOON: { label: 'Due soon', classes: 'bg-warning-500/10 text-warning-600 dark:text-warning-500', icon: Clock },
  DUE: { label: 'Due', classes: 'bg-warning-500/10 text-warning-600 dark:text-warning-500', icon: CalendarClock },
  OVERDUE: { label: 'Overdue', classes: 'bg-danger-500/10 text-danger-600 dark:text-danger-500', icon: AlertCircle },
  PARTIALLY_PAID: { label: 'Partially paid', classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-500', icon: PauseCircle },
  COMPLETED: { label: 'Completed', classes: 'bg-brand-500/10 text-brand-600 dark:text-brand-400', icon: CheckCircle },
};

export function StatusBadge({ status, size = 'md' }: { status: MemberStatus; size?: 'sm' | 'md' }) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={`chip ${c.classes} ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : ''}`}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {c.label}
    </span>
  );
}

export function StatusBadgeAnimated({ status, size = 'md' }: { status: MemberStatus; size?: 'sm' | 'md' }) {
  return (
    <motion.span
      key={status}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <StatusBadge status={status} size={size} />
    </motion.span>
  );
}
