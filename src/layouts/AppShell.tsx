import { lazy, Suspense, useState, type ReactNode } from 'react';
import { useRouter } from '@/hooks/useRouter';
import { useAppData } from '@/hooks/useAppData';
import { BottomNav, MobileHeader, Sidebar } from '@/components/Navigation';
import { DashboardPage } from '@/pages/DashboardPage';



import { ChittiContext } from '@/hooks/useChitti';
import { currentMonthStr } from '@/lib/format';
import { AlertTriangle } from 'lucide-react';
import { SkeletonCard } from '@/components/States';


const MembersPage = lazy(() => import('@/pages/MembersPage').then((m) => ({ default: m.MembersPage })));
const PaymentsPage = lazy(() => import('@/pages/PaymentsPage').then((m) => ({ default: m.PaymentsPage })));
const MonthlyCollectionPage = lazy(() => import('@/pages/MonthlyCollectionPage').then((m) => ({ default: m.MonthlyCollectionPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const ChittisPage = lazy(() => import('@/pages/ChittisPage').then((m) => ({ default: m.ChittisPage })));
const MemberDetailPage = lazy(() => import('@/pages/MemberDetailPage').then((m) => ({ default: m.MemberDetailPage })));
const ActivityPage = lazy(() => import('@/pages/ActivityPage').then((m) => ({ default: m.ActivityPage })));




const titles: Record<string, string> = {
  dashboard: 'Dashboard',
  members: 'Members',
  payments: 'Payments',
  monthly_collection: 'Monthly Collection',
  settings: 'Settings',
  chittis: 'Chittis',
  member: 'Member',
  activity: 'Activity Log',
};

export function AppShell() {
  const { route } = useRouter();
  const [selectedChittiId, setSelectedChittiId] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(
  currentMonthStr()
);


  const appData = useAppData(selectedChittiId);

  let page: ReactNode;
  switch (route.name) {
    case 'dashboard':
      page = <DashboardPage appData={appData} selectedChittiId={selectedChittiId} setSelectedChittiId={setSelectedChittiId} />;
      break;
    case 'members':
      page = <MembersPage appData={appData} />;
      break;
    case 'member':
      page = <MemberDetailPage memberId={route.id} appData={appData} />;
      break;
    case 'payments':
      page = <PaymentsPage appData={appData} />;
      break;
    case 'monthly_collection':
  page = (
  <MonthlyCollectionPage
    appData={appData}
    selectedMonth={selectedMonth}
    setSelectedMonth={setSelectedMonth}
  />
);
  break;
    case 'settings':
      page = <SettingsPage appData={appData} />;
      break;
    case 'chittis':
      page = <ChittisPage appData={appData} selectedChittiId={selectedChittiId} setSelectedChittiId={setSelectedChittiId} />;
      break;
    case 'activity':
      page = <ActivityPage />;
      break;
    default:
      page = <DashboardPage appData={appData} selectedChittiId={selectedChittiId} setSelectedChittiId={setSelectedChittiId} />;
  }

  const title = titles[route.name] ?? 'Chitti Manager';

  return (
    <ChittiContext.Provider value={{ selectedChittiId, setSelectedChittiId }}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader title={title} />
          <main className="flex-1 px-4 py-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:py-6 lg:pb-8">
                        <div className="mx-auto w-full max-w-7xl space-y-6">
              {appData.warning && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Some data didn't load</p>
                    <p className="mt-0.5 opacity-90">
                      {appData.warning} Totals for these chittis may be incomplete until you retry.
                    </p>
                  </div>
                  <button
                    onClick={appData.refresh}
                    className="shrink-0 rounded-lg px-3 py-1.5 font-semibold underline-offset-2 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}
                            <Suspense fallback={<div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>}>
                {page}
              </Suspense>
            </div>
          </main>
          <BottomNav />
        </div>
      </div>
    </ChittiContext.Provider>
  );
}
