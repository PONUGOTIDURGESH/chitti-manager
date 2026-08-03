import { motion } from 'framer-motion';

export function ProgressBar({
  value,
  max = 100,
  className = '',
  showLabel = false,
  animated = true,
}: {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  animated?: boolean;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 ${className}`}>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-brand-500"
        initial={animated ? { width: 0 } : false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      {showLabel && (
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500">
          {pct.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

export function ProgressRing({
  value,
  max = 100,
  size = 120,
  stroke = 10,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-brand-500"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">{pct.toFixed(0)}%</span>
        <span className="text-[11px] font-medium text-slate-500">collected</span>
      </div>
    </div>
  );
}
