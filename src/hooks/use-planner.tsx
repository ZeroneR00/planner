import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { cleanupPhotos } from '@/hooks/use-photos';
import { useReminderActions, useReminders } from '@/hooks/use-reminders';
import { applyChanges, type Changes } from '@/lib/changes';
import { nowIso, today } from '@/lib/dates';
import { loadSettings, migrate, photoNames, startDay, writeChanges, writeSettings, type Db } from '@/lib/db';
import { demoChanges } from '@/lib/demo';
import { makeId } from '@/lib/id';
import type { Settings } from '@/lib/settings';
import type { Env, PlannerData } from '@/lib/types';

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

// remindersOff — человек запретил уведомления: показываем это после добавления задачи со временем
type Planner = PlannerData & {
  commit: (changes: Changes) => void;
  remindersOff: boolean;
  settings: Settings;
  changeSettings: (patch: Partial<Settings>) => void;
};

const PlannerContext = createContext<Planner | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  // При запуске, при возврате в приложение и после кнопки в уведомлении. Если React вызовет
  // инициализатор дважды (StrictMode в dev), второй вызов ничего не изменит: rollover идемпотентен
  const [data, setData] = useState(() => startToday(db));
  const reload = useCallback(() => setData(startToday(db)), [db]);
  const reminders = useReminders(data);
  useReminderActions(db, reload);
  // Кнопку в уведомлении могли нажать при свёрнутом приложении — база уже другая. Заодно смена дня
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') reload();
    });
    return () => subscription.remove();
  }, [reload]);
  // Один раз при запуске: файлы фото, на которые больше нет ссылок
  useEffect(() => {
    cleanupPhotos(photoNames(db));
  }, [db]);
  // При возврате в приложение не перечитываем: настройки меняет только этот экран
  const [settings, setSettings] = useState(() => loadSettings(db));
  const commit = (changes: Changes) => {
    writeChanges(db, changes); // сначала база: упала запись — память не трогаем
    setData((d) => applyChanges(d, changes));
  };
  const changeSettings = (patch: Partial<Settings>) => {
    writeSettings(db, patch); // как commit: сначала база
    setSettings((s) => ({ ...s, ...patch }));
  };
  return (
    <PlannerContext value={{ ...data, commit, remindersOff: reminders.off, settings, changeSettings }}>
      {children}
    </PlannerContext>
  );
}

export function usePlanner(): Planner {
  const planner = use(PlannerContext);
  if (planner === null) throw new Error('usePlanner вне PlannerProvider');
  return planner;
}
