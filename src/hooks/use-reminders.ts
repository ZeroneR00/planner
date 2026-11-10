import {
  AndroidImportance,
  DEFAULT_ACTION_IDENTIFIER,
  SchedulableTriggerInputTypes,
  addNotificationResponseReceivedListener,
  cancelScheduledNotificationAsync,
  clearLastNotificationResponse,
  dismissNotificationAsync,
  getAllScheduledNotificationsAsync,
  getLastNotificationResponse,
  getPermissionsAsync,
  getPresentedNotificationsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationCategoryAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  type NotificationPermissionsStatus,
  type NotificationResponse,
} from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';

import { applyChanges } from '@/lib/changes';
import { copy } from '@/lib/copy';
import { localDateTime, nowIso, nowTime, today } from '@/lib/dates';
import { startDay, writeChanges, type Db } from '@/lib/db';
import { makeId } from '@/lib/id';
import { isReminderAction, reminderActionChanges, type ReminderAction } from '@/lib/reminder-actions';
import { REMINDER_CATEGORY, diffReminders, planReminders, staleShown } from '@/lib/reminders';
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

// Синхронизации хука и кнопок уведомления идут по одной в общей очереди: план считается
// в момент запуска, поэтому лишний запуск ничего не меняет
let chain: Promise<void> = Promise.resolve();

function enqueue(job: () => Promise<void>): Promise<void> {
  chain = chain.then(async () => {
    try {
      await job();
    } catch (error) {
      // Приложение не должно падать из-за уведомлений
      if (__DEV__) console.warn('[напоминания]', error);
    }
  });
  return chain;
}

// Спрашиваем не чаще раза за запуск: после «Запретить» не дёргаем человека при каждой правке.
// Второй раз Android сам разрешает спросить один раз, а потом больше не показывает вопрос
let askedThisLaunch = false;

// На Android 13+ пакет до первого вопроса отвечает status: 'denied' (уведомления у нового приложения
// ещё выключены), поэтому «запретил» — это «не выдано и спросить нельзя», а не status
function refused(p: NotificationPermissionsStatus): boolean {
  return !p.granted && (!p.canAskAgain || askedThisLaunch);
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await setNotificationChannelAsync(CHANNEL_ID, {
    name: copy.reminders.channel,
    importance: AndroidImportance.HIGH,
  });
}

const APP_PACKAGE = 'com.zeroner00.planner'; // как android.package в app.json

/** Системные настройки канала «Напоминания»: звук, вибрация. Не вышло — настройки приложения. */
export async function openReminderSound(): Promise<void> {
  try {
    // Канала может ещё не быть (ни одной задачи со временем) — без него экран канала не откроется
    await ensureChannel();
    if (Platform.OS !== 'android') throw new Error('Настройки канала есть только на Android');
    await Linking.sendIntent('android.settings.CHANNEL_NOTIFICATION_SETTINGS', [
      { key: 'android.provider.extra.APP_PACKAGE', value: APP_PACKAGE },
      { key: 'android.provider.extra.CHANNEL_ID', value: CHANNEL_ID },
    ]);
  } catch (error) {
    if (__DEV__) console.warn('[напоминания] настройки канала', error);
    await Linking.openSettings().catch(() => undefined);
  }
}

async function ensureAllowed(): Promise<boolean> {
  // Канал — до запроса: на Android 13 без канала системный вопрос не появляется
  await ensureChannel();
  const current = await getPermissionsAsync();
  if (current.granted) return true;
  if (refused(current)) return false;
  askedThisLaunch = true;
  return (await requestPermissionsAsync()).granted;
}

// Кнопки регистрируем один раз за запуск JS, до первой постановки
let categoryReady = false;

async function ensureCategory(): Promise<void> {
  if (categoryReady) return;
  const titles: Record<ReminderAction, string> = {
    snooze15: copy.reminders.snoozeShort,
    snooze60: copy.reminders.snoozeLong,
    done: copy.reminders.done,
  };
  await setNotificationCategoryAsync(
    REMINDER_CATEGORY,
    (Object.keys(titles) as ReminderAction[]).map((identifier) => ({
      identifier,
      buttonTitle: titles[identifier],
      options: { opensAppToForeground: false }, // тихая кнопка: приложение не открывается
    })),
  );
  categoryReady = true;
}

/**
 * Ставит и отменяет уведомления по задачам и повторам, убирает из шторки устаревшие.
 * true — уведомления выключены.
 */
async function sync(data: Pick<PlannerData, 'tasks' | 'rules'>): Promise<boolean> {
  const planned = planReminders(data, { date: today(), time: nowTime() });
  const scheduled = (await getAllScheduledNotificationsAsync()).map((r) => ({
    id: r.identifier,
    title: r.content.title ?? '',
    category: r.content.categoryIdentifier ?? null,
  }));
  // Нечего ставить — не спрашиваем, но запрет помним: иначе первая задача со временем
  // после пустого списка не показала бы «уведомления выключены»
  const allowed =
    planned.length === 0 ? !refused(await getPermissionsAsync()) : await ensureAllowed();
  const { cancel, schedule } = diffReminders(allowed ? planned : [], scheduled);
  for (const id of cancel) await cancelScheduledNotificationAsync(id);
  if (schedule.length > 0) await ensureCategory();
  for (const r of schedule) {
    await scheduleNotificationAsync({
      identifier: r.id,
      content: { title: r.title, categoryIdentifier: REMINDER_CATEGORY },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: localDateTime(r.date, r.time),
        channelId: CHANNEL_ID,
      },
    });
  }
  // Сделали, убрали или перенесли — висящее уведомление больше не нужно
  const shown = (await getPresentedNotificationsAsync()).map((n) => n.request.identifier);
  for (const id of staleShown(shown, data)) await dismissNotificationAsync(id);
  return !allowed;
}

/**
 * Кнопка из уведомления: и из фоновой задачи, и из слушателя при живом приложении.
 * Смена дня, расчёт и запись — синхронно, без await: два вызова не перемешаются,
 * второй увидит уже записанное и ничего не сделает. Шторку и будильники поправит sync.
 */
export async function runReminderAction(db: Db, reminderId: string, action: ReminderAction): Promise<void> {
  const data = startDay(db, { today: today(), now: nowIso(), makeId });
  const changes = reminderActionChanges(data, reminderId, action, nowTime(), nowIso());
  if (changes !== null) writeChanges(db, changes);
  const next = changes === null ? data : applyChanges(data, changes);
  await enqueue(async () => {
    await sync(next);
  });
}

/** Держит уведомления в согласии с задачами и повторами. off — человек запретил уведомления. */
export function useReminders(data: PlannerData): { off: boolean } {
  const { tasks, rules } = data;
  const [off, setOff] = useState(false);
  const latest = useRef<Pick<PlannerData, 'tasks' | 'rules'>>({ tasks, rules });

  const resync = useCallback(() => {
    void enqueue(async () => {
      setOff(await sync(latest.current));
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

/** Тап по уведомлению — и запустивший приложение, и пока оно открыто. onTap получает id напоминания. */
export function useReminderTaps(onTap: (reminderId: string) => void): void {
  const latest = useRef(onTap);
  useEffect(() => {
    latest.current = onTap;
  }, [onTap]);

  useEffect(() => {
    // Кнопки в уведомлении — не «открыть задачу», их ведёт useReminderActions
    const handle = (response: NotificationResponse) => {
      if (response.actionIdentifier !== DEFAULT_ACTION_IDENTIFIER) return;
      latest.current(response.notification.request.identifier);
    };
    // Приложение запустили тапом по уведомлению. Стираем, чтобы при перемонтировании не сработало снова
    const launch = getLastNotificationResponse();
    if (launch !== null) {
      clearLastNotificationResponse();
      handle(launch);
    }
    const subscription = addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }, []);
}

/**
 * Кнопки уведомления, пока JS приложения жив. При закрытом приложении их ведёт фоновая задача
 * (reminder-task.ts). Тихие кнопки приложение не запускают, поэтому getLastNotificationResponse не нужен.
 */
export function useReminderActions(db: Db, onChanged: () => void): void {
  const latest = useRef(onChanged);
  useEffect(() => {
    latest.current = onChanged;
  }, [onChanged]);

  useEffect(() => {
    const subscription = addNotificationResponseReceivedListener((response) => {
      const action = response.actionIdentifier;
      if (!isReminderAction(action)) return;
      runReminderAction(db, response.notification.request.identifier, action)
        .then(() => latest.current())
        .catch((error: unknown) => {
          if (__DEV__) console.warn('[напоминания]', error);
        });
    });
    return () => subscription.remove();
  }, [db]);
}
