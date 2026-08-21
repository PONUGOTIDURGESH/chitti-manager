import { useState, type ReactNode } from 'react';
import { useRouter } from '@/hooks/useRouter';
import { useAppData } from '@/hooks/useAppData';
import { BottomNav, MobileHeader, Sidebar } from '@/components/Navigation';
import { DashboardPage } from '@/pages/DashboardPage';
import { MembersPage } from '@/pages/MembersPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { MonthlyCollectionPage } from '@/pages/MonthlyCollectionPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ChittisPage } from '@/pages/ChittisPage';
import { MemberDetailPage } from '@/pages/MemberDetailPage';
import { ActivityPage } from '@/pages/ActivityPage';
import { ChittiContext } from '@/hooks/useChitti';

const titles: Record<string, string> = {
  dashboard: 'Dashboard',
  members: 'Members',
  payments: 'Payments',
  monthly_collection: 'Monthly Collection',
  analytics: 'Analytics',
  settings: 'Settings',
  chittis: 'Chittis',
  member: 'Member',
  activity: 'Activity Log',
};

export function AppShell() {
  const { route } = useRouter();
  const [selectedChittiId, setSelectedChittiId] = useState<string | null>(null);
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
  page = <MonthlyCollectionPage appData={appData} />;
  break;
    case 'analytics':
      page = <AnalyticsPage appData={appData} />;
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
            <div className="mx-auto w-full max-w-7xl space-y-6">{page}</div>
          </main>
          <BottomNav />
        </div>
      </div>
    </ChittiContext.Provider>
  );
}
