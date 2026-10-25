import {
  AndroidImportance,
  SchedulableTriggerInputTypes,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { copy } from '@/lib/copy';
import { localDateTime, nowTime, today } from '@/lib/dates';
import { diffReminders, planReminders, type Reminder } from '@/lib/reminders';
import type { PlannerData } from '@/lib/types';

// Единственное место с expo- Какие напоминания должны стоять, решает reminders.ts

const CHANNEL_ID = 'reminders';

// Уведомление показываем и при открытом приложении
setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureAllowed(): Promise<boolean> {
  // Канал — до запроса: на Android 13 без канала системный вопрос не появляется
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(CHANNEL_ID, {
      name: copy.reminders.channel,
      importance: AndroidImportance.HIGH,
    });
  }
  const current = await getPermissionsAsync();
  if (current.granted) return true;
  // Спрашиваем один раз: после «Запретить» не дёргаем человека при каждой правке
  if (current.status !== 'undetermined') return false;
  return (await requestPermissionsAsync()).granted;
}

/** Ставит и отменяет уведомления, чтобы совпали с planned. true — уведомления выключены. */
async function sync(planned: readonly Reminder[]): Promise<boolean> {
  const scheduled = (await getAllScheduledNotificationsAsync()).map((r) => ({
    id: r.identifier,
    title: r.content.title ?? '',
  }));
  // Нечего ставить — не спрашиваем, но запрет помним: иначе первая задача со временем
  // после пустого списка не показала бы «уведомления выключены»
  const allowed =
    planned.length === 0
      ? (await getPermissionsAsync()).status !== 'denied'
      : await ensureAllowed();
  const { cancel, schedule } = diffReminders(allowed ? planned : [], scheduled);
  for (const id of cancel) await cancelScheduledNotificationAsync(id);
  for (const r of schedule) {
    await scheduleNotificationAsync({
      identifier: r.id,
      content: { title: r.title },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: localDateTime(r.date, r.time),
        channelId: CHANNEL_ID,
      },
    });
  }
  return !allowed;
}

/** Держит уведомления в согласии с задачами и повторами. off — человек запретил уведомления. */
export function useReminders(data: PlannerData): { off: boolean } {
  const { tasks, rules } = data;
  const [off, setOff] = useState(false);
  const latest = useRef<Pick<PlannerData, 'tasks' | 'rules'>>({ tasks, rules });
  const chain = useRef<Promise<void>>(Promise.resolve());

  // Синхронизации идут по одной, план считаем в момент запуска по последним данным —
  // поэтому лишний запуск ничего не меняет
  const resync = useCallback(() => {
    chain.current = chain.current.then(async () => {
      try {
        setOff(await sync(planReminders(latest.current, { date: today(), time: nowTime() })));
      } catch (error) {
        // Приложение не должно падать из-за уведомлений
        if (__DEV__) console.warn('[напоминания]', error);
      }
    });
  }, []);

  useEffect(() => {
    latest.current = { tasks, rules };
    resync();
  }, [tasks, rules, resync]);

  // Возврат в приложение дотягивает горизонт повторов и подхватывает разрешение из настроек
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') resync();
    });
    return () => subscription.remove();
  }, [resync]);

  return { off };
}
