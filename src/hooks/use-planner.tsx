import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { createContext, use, useState, type ReactNode } from 'react';

import { applyChanges, type Changes } from '@/lib/changes';
import { nowIso, today } from '@/lib/dates';
import { migrate, startDay, writeChanges, type Db } from '@/lib/db';
import { demoChanges } from '@/lib/demo';
import { makeId } from '@/lib/id';
import type { Env, PlannerData } from '@/lib/types';

export const DB_NAME = 'planner.db';

// Вне компонента: время, id и запись в базу — «нечистые», в теле рендера им не место
function currentEnv(): Env {
  return { today: today(), now: nowIso(), makeId };
}

/** onInit у SQLiteProvider: схема и (только в dev, при создании базы) демо-данные. */
export async function prepareDatabase(db: SQLiteDatabase): Promise<void> {
  const from = migrate(db);
  if (__DEV__ && from === 0) writeChanges(db, demoChanges(currentEnv()));
}

function startToday(db: Db): PlannerData {
  const data = startDay(db, currentEnv());
  if (__DEV__) console.log(`[база] ${data.today}: задач ${data.tasks.length}, повторов ${data.rules.length}`);
  return data;
}

type Planner = PlannerData & { commit: (changes: Changes) => void };

const PlannerContext = createContext<Planner | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  // Один раз при запуске. Если React вызовет инициализатор дважды (StrictMode в dev),
  // второй вызов ничего не изменит: rollover идемпотентен
  const [data, setData] = useState(() => startToday(db));
  const commit = (changes: Changes) => {
    writeChanges(db, changes); // сначала база: упала запись — память не трогаем
    setData((d) => applyChanges(d, changes));
  };
  return <PlannerContext value={{ ...data, commit }}>{children}</PlannerContext>;
}

export function usePlanner(): Planner {
  const planner = use(PlannerContext);
  if (planner === null) throw new Error('usePlanner вне PlannerProvider');
  return planner;
}
