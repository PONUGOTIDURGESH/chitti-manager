import { createContext, useContext, useState, type ReactNode } from 'react';

export type Route =
  | { name: 'dashboard' }
  | { name: 'members' }
  | { name: 'payments' }
  | { name: 'analytics' }
  | { name: 'settings' }
  | { name: 'chittis' }
  | { name: 'member'; id: string }
  | { name: 'activity' };

interface RouterContextValue {
  route: Route;
  navigate: (r: Route) => void;
  goBack: () => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: 'dashboard' }]);
  const route = stack[stack.length - 1];

  const navigate = (r: Route) => {
    setStack((s) => {
      // reset to top-level tabs
      if ('name' in r && ['dashboard', 'members', 'payments', 'analytics', 'settings', 'chittis'].includes(r.name)) {
        return [r];
      }
      return [...s, r];
    });
    window.scrollTo(0, 0);
  };

  const goBack = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

  return (
    <RouterContext.Provider value={{ route, navigate, goBack }}>{children}</RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
