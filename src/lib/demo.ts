import type { Changes } from '@/lib/changes';
import { addDays } from '@/lib/dates';
import { nextOccurrence } from '@/lib/rules';
import type { Env, RepeatPattern, Rule, Task } from '@/lib/types';

// Демо-данные из прототипа — только для проверки на телефоне в dev. Это содержимое базы,
// а не тексты интерфейса, поэтому они здесь, а не в copy.ts.
// Экземпляр «Прогулки» на сегодня не создаём: его создаст startDay — так на первом запуске проверяется rollover
export function demoChanges({ today, now, makeId }: Env): Changes {
  const task = (title: string, date: string | null, order: number, extra: Partial<Task> = {}): Task => ({
    id: makeId(),
    title,
    date,
    done: false,
    order,
    createdAt: now,
    updatedAt: now,
    ...extra,
  });
  const rule = (title: string, pattern: RepeatPattern): Rule => ({
    ...pattern,
    id: makeId(),
    title,
    startDate: today,
    active: true,
  });

  return {
    putTasks: [
      task('Проверить новые заказы', today, 0, { done: true, doneAt: now }),
      task('Созвон с заказчиком', today, 1),
      task('Вёрстка формы заказа', today, 2),
      task('Правки по макету', null, 0, { returned: true }),
      task('Идея: тёмная тема для сайта', null, 1),
      task('Купить батарейки', null, 2),
      task('Созвониться с новым заказчиком', addDays(today, 1), 0),
      task('Оплатить интернет', nextOccurrence({ kind: 'weekly', weekdays: [2] }, today, false), 1),
      task('Продлить домен', addDays(today, 10), 2),
    ],
    putRules: [
      rule('Прогулка', { kind: 'daily' }),
      rule('Вынести мусор', { kind: 'weekly', weekdays: [2] }),
      rule('Оплатить хостинг', { kind: 'monthly', monthDay: 1 }),
    ],
  };
}
