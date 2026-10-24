import { createContext, use, useRef, useState, type ReactNode } from 'react';

import { usePlanner } from '@/hooks/use-planner';
import { invertChanges, type Changes } from '@/lib/changes';

// key — номер действия: новая плашка заново запускает таймер, а старый таймер не закроет новую.
// at — когда появилась (Date.now()): по нему отсчёт на любом экране, где плашку показали позже
export type UndoNotice = { key: number; text: string; inverse: Changes; at: number };

type Undo = {
  notice: UndoNotice | null;
  commit: (changes: Changes, text: string) => void;
  revert: () => void;
  expire: (key: number) => void;
};

const UndoContext = createContext<Undo | null>(null);

/** Плашка «Вернуть»: действие, которое убирает что-то с экрана, можно отменить. */
export function UndoProvider({ children }: { children: ReactNode }) {
  const planner = usePlanner();
  const [notice, setNotice] = useState<UndoNotice | null>(null);
  const lastKey = useRef(0);

  const value: Undo = {
    notice,
    commit: (changes, text) => {
      const inverse = invertChanges(planner, changes);
      planner.commit(changes);
      lastKey.current += 1;
      setNotice({ key: lastKey.current, text, inverse, at: Date.now() });
    },
    revert: () => {
      if (notice === null) return;
      planner.commit(notice.inverse);
      setNotice(null);
    },
    expire: (key) => setNotice((n) => (n?.key === key ? null : n)),
  };
  return <UndoContext value={value}>{children}</UndoContext>;
}

export function useUndo(): Undo {
  const undo = use(UndoContext);
  if (undo === null) throw new Error('useUndo вне UndoProvider');
  return undo;
}
