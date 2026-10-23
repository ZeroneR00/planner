// Дискриминированное объединение: TS сам следит, что у weekly есть weekday, а у monthly — monthDay.
// В SQLite колонки плоские, weekday и monthDay — nullable.
export type RepeatPattern =
  | { kind: 'daily' }
  | { kind: 'weekdays' }
  | { kind: 'weekly'; weekday: number } // 0–6, 0 = вс
  | { kind: 'monthly'; monthDay: number }; // 1–31

export type RepeatKind = RepeatPattern['kind'];

export type Rule = RepeatPattern & {
  id: string;
  title: string;
  startDate: string;
  active: boolean;
};

export type Task = {
  id: string;
  title: string;
  date: string | null; // null — задача в Кармане
  done: boolean;
  doneAt?: string;
  order: number;
  ruleId?: string;
  returned?: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Всё, что держим в памяти. today — день последней смены дня; «сегодня» экраны берут отсюда. */
export type PlannerData = { today: string; tasks: Task[]; rules: Rule[] };

/** «Нечистое», что нужно чистым функциям: день, время, генератор id. В тестах — фиксированное. */
export type Env = { today: string; now: string; makeId: () => string };
