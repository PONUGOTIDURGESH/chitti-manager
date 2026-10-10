import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type Route =
  | { name: 'dashboard' }
  | { name: 'members' }
  | { name: 'payments' }
  | { name: 'monthly_collection' }
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

// Tabs replace the current history entry; detail pages add one
const TOP_LEVEL = [
  'dashboard',
  'members',
  'payments',
  'monthly_collection',
  'analytics',
  'settings',
  'chittis',
];
const SIMPLE_ROUTES = [...TOP_LEVEL, 'activity'];

function routeToHash(r: Route): string {
  return r.name === 'member' ? `#/member/${encodeURIComponent(r.id)}` : `#/${r.name}`;
}

function hashToRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/');
  const name = parts[0];
  if (name === 'member' && parts[1]) {
    return { name: 'member', id: decodeURIComponent(parts[1]) };
  }
  if (SIMPLE_ROUTES.includes(name)) return { name } as Route;
  return { name: 'dashboard' };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => hashToRoute(window.location.hash));

  // Browser Back/Forward buttons, and edits to the address bar
  useEffect(() => {
    const onPop = () => setRoute(hashToRoute(window.location.hash));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((r: Route) => {
    const hash = routeToHash(r);
    if (TOP_LEVEL.includes(r.name)) {
      window.history.replaceState({ inApp: false }, '', hash);
    } else {
      window.history.pushState({ inApp: true }, '', hash);
    }
    setRoute(r);
    window.scrollTo(0, 0);
  }, []);

  const goBack = useCallback(() => {
    if (window.history.state?.inApp) {
      window.history.back();
    } else {
      // Opened directly (for example from a link): go to the parent page
      navigate({ name: route.name === 'member' ? 'members' : 'dashboard' });
    }
  }, [navigate, route.name]);

  return (
    <RouterContext.Provider value={{ route, navigate, goBack }}>{children}</RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}