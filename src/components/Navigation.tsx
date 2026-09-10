import { LayoutDashboard, Users, Wallet, Settings, Menu, LogOut, Layers, CircleDollarSign, } from 'lucide-react';
import { useRouter, type Route } from '@/hooks/useRouter';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import BrandLogo from '@/components/BrandLogo';
const navItems: { name: Route['name']; label: string; icon: typeof LayoutDashboard }[] = [
  { name: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { name: 'chittis', label: 'Chittis', icon: Layers },
  { name: 'members', label: 'Members', icon: Users },
  { name: 'payments', label: 'Payments', icon: Wallet },
  {
    name: 'monthly_collection',
    label: 'Monthly Collection',
    icon: CircleDollarSign,
  },
 
  { name: 'settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const { route, navigate } = useRouter();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-safe backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950 lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {navItems.map((item) => {
          const active = route.name === item.name;
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => navigate({ name: item.name } as Route)}
              className="relative flex flex-1 flex-col items-center gap-1 py-3"
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute -top-px h-0.5 w-8 rounded-full bg-brand-500"
                />
              )}
              <Icon
                className={`h-5 w-5 ${active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                className={`text-xs font-medium ${active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function Sidebar() {
  const { route, navigate } = useRouter();
  const { user, signOut } = useAuth();
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 lg:flex">
      <div className="relative mb-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 px-3 py-3 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
  <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-brand-500/10 blur-2xl" />

  <BrandLogo variant="sidebar" />

  <div className="mt-2 flex items-center gap-2 px-1">
    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
      Chitti Management
    </span>
  </div>
</div>
      <nav className="mt-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = route.name === item.name;
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => navigate({ name: item.name } as Route)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                active
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
          <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">
            {user?.email}
          </p>
          <button
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileHeader({ title, onMenu }: { title: string; onMenu?: () => void }) {
  const { signOut } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 pt-safe backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950 lg:hidden">
      <div className="flex min-w-0 items-center gap-2.5">
  {onMenu && (
    <button
      onClick={onMenu}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      <Menu className="h-5 w-5" />
    </button>
  )}

  <div className="flex min-w-0 items-center gap-2">
    <div className="relative shrink-0">
      <img
        src="/logo.png"
        alt="Chitti Manager"
        className="h-9 w-9 rounded-xl object-contain"
      />
      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
    </div>

    <div className="min-w-0">
      <div className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-brand-500">
        Chitti Manager
      </div>
      <h1 className="truncate text-base font-bold leading-tight text-slate-900 dark:text-white">
        {title}
      </h1>
    </div>
  </div>
</div>
      <button onClick={signOut} className="grid h-10 w-10 place-items-center rounded-lg text-slate-500">
        <LogOut className="h-6 w-6" />
      </button>
    </header>
  );
}
