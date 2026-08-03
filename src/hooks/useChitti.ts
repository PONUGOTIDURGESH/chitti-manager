import { createContext, useContext } from 'react';

interface ChittiContextValue {
  selectedChittiId: string | null;
  setSelectedChittiId: (id: string | null) => void;
}

export const ChittiContext = createContext<ChittiContextValue | undefined>(undefined);

export function useChitti(): ChittiContextValue {
  const ctx = useContext(ChittiContext);
  if (!ctx) throw new Error('useChitti must be used within ChittiContext');
  return ctx;
}
