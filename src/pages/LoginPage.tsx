import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Eye, EyeOff, Loader2, Phone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function mobileToEmail(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  return `${digits}@chitti.app`;
}

export function LoginPage() {
  const { signIn } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mobile.replace(/\D/g, '').length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setBusy(true);
    const { error: err } = await signIn(mobileToEmail(mobile), password);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-brand-50/40 px-5 dark:from-slate-950 dark:to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
            <Wallet className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Chitti Manager</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track collections, payments and member statements
          </p>
        </div>

        <form onSubmit={submit} className="card p-5">
          <div className="mb-4">
            <label className="label">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                autoComplete="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="8790886889"
                inputMode="numeric"
                maxLength={10}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className="input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-danger-500/10 px-3 py-2 text-sm text-danger-600 dark:text-danger-500">
              {error}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in
          </button>
        </form>
      </motion.div>
    </div>
  );
}
