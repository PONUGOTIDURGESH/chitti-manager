import { useEffect, useState } from 'react';
import { Activity, ArrowLeft } from 'lucide-react';
import { useRouter } from '@/hooks/useRouter';
import { activityService } from '@/lib/services';
import { formatDateTime } from '@/lib/format';
import type { ActivityLog } from '@/types';

export function ActivityPage() {
  const { goBack } = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    activityService.list(200)
      .then((d) => setLogs(d))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={goBack} className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Activity log</h1>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card animate-pulse p-4 h-14" />)}</div>
      ) : error ? (
        <p className="text-sm text-danger-600">{error}</p>
      ) : logs.length === 0 ? (
        <div className="card flex flex-col items-center p-8 text-center">
          <Activity className="h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3.5">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{log.description}</p>
                <p className="text-xs text-slate-500">{formatDateTime(log.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
