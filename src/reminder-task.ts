import { registerTaskAsync, type NotificationTaskPayload } from 'expo-notifications';
import { openDatabaseSync } from 'expo-sqlite';
import { defineTask } from 'expo-task-manager';

import { runReminderAction } from '@/hooks/use-reminders';
import { DB_NAME, migrate } from '@/lib/db';
import { isReminderAction } from '@/lib/reminder-actions';

// Фоновая задача кнопок уведомления: Android запускает JS без интерфейса, когда приложение в фоне или закрыто
const REMINDER_TASK = 'reminder-actions';

defineTask<NotificationTaskPayload>(REMINDER_TASK, async ({ data }) => {
  if (!('actionIdentifier' in data) || !isReminderAction(data.actionIdentifier)) return;
  const db = openDatabaseSync(DB_NAME);
  try {
    migrate(db);
    await runReminderAction(db, data.notification.request.identifier, data.actionIdentifier);
  } finally {
    db.closeSync();
  }
});

registerTaskAsync(REMINDER_TASK).catch((error: unknown) => {
  if (__DEV__) console.warn('[напоминания]', error);
});
