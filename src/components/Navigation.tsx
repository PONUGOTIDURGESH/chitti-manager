import { LayoutDashboard, Users, Wallet, BarChart3, Settings, Menu, LogOut, Layers } from 'lucide-react';
import { useRouter, type Route } from '@/hooks/useRouter';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

const navItems: { name: Route['name']; label: string; icon: typeof LayoutDashboard }[] = [
  { name: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { name: 'chittis', label: 'Chittis', icon: Layers },
  { name: 'members', label: 'Members', icon: Users },
  { name: 'payments', label: 'Payments', icon: Wallet },
  { name: 'analytics', label: 'Analytics', icon: BarChart3 },
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
      <div className="flex items-center gap-2 px-2 py-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white">
          <Wallet className="h-6 w-6" />
        </div>
        <span className="text-lg font-bold text-slate-900 dark:text-white">Chitti Manager</span>
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
      <div className="flex items-center gap-2">
        {onMenu && (
          <button onClick={onMenu} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500">
            <Menu className="h-6 w-6" />
          </button>
        )}
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h1>
      </div>
      <button onClick={signOut} className="grid h-10 w-10 place-items-center rounded-lg text-slate-500">
        <LogOut className="h-6 w-6" />
      </button>
    </header>
  );
}
