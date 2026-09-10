import { useState } from 'react';
import logo from '@/assets/chitti-logo.png';
import { motion } from 'framer-motion';
import {
  
  Eye,
  EyeOff,
  Loader2,
  Phone,
  ShieldCheck,
  LockKeyhole,
  ArrowRight,
} from 'lucide-react';
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

    const { error: err } = await signIn(
      mobileToEmail(mobile),
      password
    );

    setBusy(false);

    if (err) setError(err);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050b1a] text-white">
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-180px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="absolute bottom-[-220px] left-[-120px] h-[420px] w-[420px] rounded-full bg-indigo-500/10 blur-[110px]" />

        <div className="absolute right-[-140px] top-[25%] h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:px-5 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-[430px]"
        >
          {/* BRAND */}
          <div className="mb-7 text-center">
            <motion.div
  initial={{ opacity: 0, scale: 0.85 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{
    duration: 0.45,
    delay: 0.1,
  }}
  className="mx-auto h-[64px] w-[64px] overflow-hidden rounded-[19px] shadow-[0_15px_45px_rgba(37,99,235,0.22)] sm:h-[76px] sm:w-[76px] sm:rounded-[22px]"
>
  <img
  src="/logo.png"
  alt="Chitti Manager"
  className="h-full w-full object-contain"
  draggable={false}
/>
</motion.div>

            <h1 className="mt-4 text-[24px] font-bold tracking-[-0.6px] text-white sm:mt-5 sm:text-[28px]">
              Chitti Manager
            </h1>

            <p className="mx-auto mt-1.5 max-w-[300px] text-[12px] leading-5 text-slate-400 sm:mt-2 sm:max-w-[320px] sm:text-[13px]">
              Smartly manage your chittis, collections,
              payments and members.
            </p>
          </div>

          {/* LOGIN CARD */}
          <div className="rounded-[24px] border border-white/[0.08] bg-[#0d1629]/95 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-7">
            {/* CARD HEADER */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />

                <span className="text-[11px] font-bold uppercase tracking-[1.6px] text-blue-400">
                  Secure Login
                </span>
              </div>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Welcome back
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Sign in to continue to your dashboard
              </p>
            </div>

            <form onSubmit={submit}>
              {/* MOBILE */}
              <div className="mb-5">
                <label className="mb-2 block text-[12px] font-semibold text-slate-300">
                  Mobile Number
                </label>

                <div className="group relative">
                  <Phone
                    className="absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400"
                  />

                  <input
                    type="tel"
                    autoComplete="tel"
                    required
                    value={mobile}
                    onChange={(e) =>
                      setMobile(
                        e.target.value.replace(/\D/g, '')
                      )
                    }
                    placeholder="Enter 10-digit mobile number"
                    inputMode="numeric"
                    maxLength={10}
                    className="h-[52px] w-full rounded-[14px] border border-slate-700/80 bg-[#111d32] pl-11 pr-4 text-[14px] font-medium text-white outline-none transition-all placeholder:text-slate-600 hover:border-slate-600 focus:border-blue-500 focus:bg-[#13213a] focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="mb-5">
                <label className="mb-2 block text-[12px] font-semibold text-slate-300">
                  Password
                </label>

                <div className="group relative">
                  <LockKeyhole
                    className="absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400"
                  />

                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    className="h-[52px] w-full rounded-[14px] border border-slate-700/80 bg-[#111d32] pl-11 pr-12 text-[14px] font-medium text-white outline-none transition-all placeholder:text-slate-600 hover:border-slate-600 focus:border-blue-500 focus:bg-[#13213a] focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPw((s) => !s)
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
                    aria-label={
                      showPw
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPw ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="mb-5 rounded-[12px] border border-red-500/15 bg-red-500/[0.08] px-3.5 py-3 text-[12px] font-medium text-red-400"
                >
                  {error}
                </motion.div>
              )}

              {/* SIGN IN */}
              <button
                type="submit"
                disabled={busy}
                className="group relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-[14px] bg-gradient-to-r from-blue-600 to-blue-500 text-[14px] font-bold text-white shadow-[0_10px_30px_rgba(37,99,235,0.22)] transition-all hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_12px_35px_rgba(37,99,235,0.3)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* SECURITY */}
            <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/[0.06] pt-5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />

              <span className="text-[11px] font-medium text-slate-500">
                Your account information is securely protected
              </span>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-6 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[1.4px] text-slate-700">
              CHITTI MANAGEMENT SYSTEM
            </p>

            <p className="mt-1.5 text-[11px] text-slate-600">
              Secure • Simple • Reliable
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}