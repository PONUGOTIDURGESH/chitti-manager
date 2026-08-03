import { useEffect, useRef, useState } from 'react';
import {
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  LogOut,
  Activity,
  Palette,
  ShieldCheck,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { backupService } from '@/lib/services';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import { exportCSVTyped, exportJSON } from '@/lib/export';

import type { ThemePreference } from '@/types';
import type { useAppData } from '@/hooks/useAppData';

interface Props {
  appData: ReturnType<typeof useAppData>;
}

export function SettingsPage({ appData }: Props) {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const { navigate } = useRouter();

  const { members, payments, chittis } = appData;

  const [busy, setBusy] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);
const [restoring, setRestoring] = useState(false);
const [cloudBackups, setCloudBackups] = useState<any[]>([]);
const [selectedBackup, setSelectedBackup] = useState<any | null>(null);
const [restoreResult, setRestoreResult] = useState<{
  chittis: number;
  members: number;
  payments: number;
} | null>(null);
const [loadingCloudBackups, setLoadingCloudBackups] = useState(true);
  const [lastBackup, setLastBackup] = useState<string | null>(() =>
    localStorage.getItem('chitti_last_backup'),
  );

  const handleCloudBackupRestore = async (backupId: string) => {
  try {
    setRestoring(true);

    const result = await backupService.restoreCloudBackup(backupId);

    // Refresh restored Chittis, Members and Payments
    await appData.refresh();

    // Refresh Cloud Backups immediately
    const updatedBackups = await backupService.listCloudBackups(30);
    setCloudBackups(updatedBackups);

    setRestoreResult(result);
  } catch (error) {
    console.error('Cloud backup restore failed:', error);

    alert(
      error instanceof Error
        ? error.message
        : 'Failed to restore cloud backup.'
    );
  } finally {
    setRestoring(false);
  }
};

  useEffect(() => {
  const loadCloudBackups = async () => {
    try {
      setLoadingCloudBackups(true);

      const backups = await backupService.listCloudBackups(30);

      setCloudBackups(backups);
    } catch (error) {
      console.error('Failed to load cloud backups:', error);
    } finally {
      setLoadingCloudBackups(false);
    }
  };

  loadCloudBackups();
}, []);

  const themes: {
    value: ThemePreference;
    label: string;
    icon: typeof Sun;
  }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const timestamp = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}_${hour}-${minute}-${second}`;
  };

  const doCSVExport = async () => {
    setBusy(true);

    try {
      const stamp = timestamp();

      exportCSVTyped(
        chittis,
        `chitti-backup_${stamp}_chittis.csv`,
      );

      exportCSVTyped(
        members,
        `chitti-backup_${stamp}_members.csv`,
      );

      exportCSVTyped(
        payments,
        `chitti-backup_${stamp}_payments.csv`,
      );
    } catch (error) {
      console.error('CSV export failed:', error);
      alert('CSV export failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const createFullBackup = async () => {
    setBusy(true);

    try {
      const createdAt = new Date().toISOString();
      const stamp = timestamp();

      const backup = {
        backupType: 'CHITTI_MANAGER_FULL_BACKUP',
        backupVersion: 1,

        createdAt,

        application: {
          name: 'Chitti Manager',
          schemaVersion: 1,
        },

        statistics: {
          totalChittis: chittis.length,
          totalMembers: members.length,
          totalPayments: payments.length,
        },

        data: {
          chittis,
          members,
          payments,
        },
      };

      exportJSON(
        backup,
        `chitti-manager-full-backup_${stamp}.json`,
      );

      localStorage.setItem('chitti_last_backup', createdAt);
      setLastBackup(createdAt);
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Backup could not be created. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const formatBackupDate = (value: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  };

  const restoreBackup = async (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  const file = event.target.files?.[0];

  if (!file) return;

  setRestoring(true);

  try {
    const text = await file.text();

    let backup: any;

    try {
      backup = JSON.parse(text);
    } catch {
      throw new Error('This is not a valid JSON backup file.');
    }

    if (
      backup?.backupType !== 'CHITTI_MANAGER_FULL_BACKUP' ||
      !backup?.data ||
      !Array.isArray(backup.data.chittis) ||
      !Array.isArray(backup.data.members) ||
      !Array.isArray(backup.data.payments)
    ) {
      throw new Error(
        'This file is not a valid Chitti Manager backup.',
      );
    }

    const totalChittis = backup.data.chittis.length;
    const totalMembers = backup.data.members.length;
    const totalPayments = backup.data.payments.length;

    const confirmed = window.confirm(
      `Restore this backup?\n\n` +
        `Chittis: ${totalChittis}\n` +
        `Members: ${totalMembers}\n` +
        `Payments: ${totalPayments}\n\n` +
        `Existing records with the same IDs may be updated.`,
    );

    if (!confirmed) return;

    const result = await backupService.restore(
      backup.data.chittis,
      backup.data.members,
      backup.data.payments,
    );

    await appData.refresh();

    alert(
      `Backup restored successfully!\n\n` +
        `Chittis: ${result.chittis}\n` +
        `Members: ${result.members}\n` +
        `Payments: ${result.payments}`,
    );
  } catch (error) {
    console.error('Restore failed:', error);

    alert(
      error instanceof Error
        ? `Restore failed: ${error.message}`
        : 'Restore failed. Please try again.',
    );
  } finally {
    setRestoring(false);

    if (restoreInputRef.current) {
      restoreInputRef.current.value = '';
    }
  }
};

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage appearance, backups and account security.
        </p>
      </div>

      {/* Appearance */}
      <section className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4 text-brand-600" />

          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Appearance
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {themes.map((t) => {
            const Icon = t.icon;
            const active = theme === t.value;

            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm font-medium transition ${
                  active
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                    : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Database status */}
      <section className="card p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
            <Database className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Cloud database
              </h2>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </span>
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Your live chitti, member and payment records are stored
              in Supabase.
            </p>
          </div>
        </div>
      </section>

      {/* Backup */}
      <section className="card p-4">
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-600" />

          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Data & Backup
          </h2>
        </div>

        <p className="text-sm leading-6 text-slate-500">
          Create an independent copy of your financial records.
          Keep backup files somewhere separate from this device.
        </p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-xs font-medium text-slate-500">
            Data currently loaded
          </p>

          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {chittis.length}
              </p>
              <p className="text-[11px] text-slate-500">
                Chittis
              </p>
            </div>

            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {members.length}
              </p>
              <p className="text-[11px] text-slate-500">
                Members
              </p>
            </div>

            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {payments.length}
              </p>
              <p className="text-[11px] text-slate-500">
                Payments
              </p>
            </div>
          </div>
        </div>

        {lastBackup ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Last backup: {formatBackupDate(lastBackup)}
          </div>
        ) : (
          <p className="mt-3 text-xs font-medium text-amber-600">
            No backup has been created from this browser yet.
          </p>
        )}

        <button
          onClick={createFullBackup}
          disabled={busy}
          className="btn-primary mt-4 w-full"
        >
          <Download className="h-4 w-4" />

          {busy ? 'Creating backup...' : 'Backup Now'}
        </button>

        <input
  ref={restoreInputRef}
  type="file"
  accept=".json,application/json"
  onChange={restoreBackup}
  className="hidden"
/>

<button
  onClick={() => restoreInputRef.current?.click()}
  disabled={busy || restoring}
  className="btn-secondary mt-2 w-full"
>
  <Upload className="h-4 w-4" />

  {restoring ? 'Restoring backup...' : 'Restore Backup'}
</button>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={doCSVExport}
            disabled={busy}
            className="btn-secondary"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </button>

          <button
            onClick={createFullBackup}
            disabled={busy}
            className="btn-secondary"
          >
            <FileJson className="h-4 w-4" />
            Export JSON
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <strong>Important:</strong> Supabase is the live database.
          This backup is an additional recovery copy. Store important
          backups in another location such as Google Drive or another
          trusted storage location.
        </div>
      </section>

            {/* Cloud Backups */}
      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-brand-600" />

            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Cloud Backups
            </h2>
          </div>

          {!loadingCloudBackups && (
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              {cloudBackups.length} / 30
            </span>
          )}
        </div>

        <p className="text-sm leading-6 text-slate-500">
          Automatic recovery snapshots created when important chitti,
          member or payment data changes.
        </p>

        {loadingCloudBackups ? (
          <div className="mt-4 rounded-xl border border-slate-200 p-4 text-center dark:border-slate-700">
            <p className="text-sm text-slate-500">
              Loading cloud backups...
            </p>
          </div>
        ) : cloudBackups.length === 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              No automatic cloud backups available yet.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />

                <div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Latest automatic backup
                  </p>

                  <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                    {formatBackupDate(cloudBackups[0].created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {cloudBackups.slice(0, 5).map((backup, index) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Backup #{cloudBackups.length - index}
                    </p>

                    <div className="mt-1">
  <p className="text-xs text-slate-500">
    {formatBackupDate(backup.created_at)}
  </p>

  <p className="mt-1 text-xs text-slate-400">
    {backup.chittiCount ?? 0} Chittis • {backup.memberCount ?? 0} Members • {backup.paymentCount ?? 0} Payments
  </p>
</div>
                  </div>

                  <button
  type="button"
  onClick={() => setSelectedBackup(backup)}
  disabled={restoring}
  className="btn-secondary flex items-center gap-2 px-3 py-2"
  title="Restore this backup"
>
  <ShieldCheck className="h-4 w-4" />
  {restoring ? 'Restoring...' : 'Restore'}
</button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Activity */}
      <button
        onClick={() => navigate({ name: 'activity' })}
        className="card card-hover flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Activity className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Activity log
          </p>

          <p className="text-xs text-slate-500">
            View recent actions and changes
          </p>
        </div>
      </button>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="btn-danger w-full"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>

      <p className="pb-4 text-center text-xs text-slate-400">
        Chitti Manager · Cloud-backed financial records
      </p>
            {selectedBackup && (
              
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Restore cloud backup?
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {formatBackupDate(selectedBackup.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBackup(null)}
                disabled={restoring}
                className="text-2xl leading-none text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                Current data will be replaced
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-700 dark:text-slate-300">
                Your current chittis, members and payments will be restored
                to the state stored in this backup.
              </p>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              Changes made after this backup was created may be removed.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedBackup(null)}
                disabled={restoring}
                className="btn-secondary"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={restoring}
                onClick={async () => {
                  const backup = selectedBackup;
                  setSelectedBackup(null);
                  await handleCloudBackupRestore(backup.id);
                }}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {restoring ? 'Restoring...' : 'Restore backup'}
              </button>
            </div>

          </div>
        </div>
      )}
            {restoreResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">

            <div className="flex flex-col items-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                Backup restored successfully
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Your data has been restored from the selected cloud backup.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800">
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {restoreResult.chittis}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Chittis
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800">
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {restoreResult.members}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Members
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800">
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {restoreResult.payments}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Payments
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRestoreResult(null)}
              className="btn-primary mt-6 w-full"
            >
              Done
            </button>

          </div>
        </div>
      )}
    </div>
  );
}