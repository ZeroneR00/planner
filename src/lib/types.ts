// Дискриминированное объединение: TS сам следит, что у weekly есть дни недели, у monthly — число,
// у yearly — месяц и число. В SQLite колонки плоские и nullable.
export type RepeatPattern =
  | { kind: 'daily' }
  | { kind: 'weekdays' }
  | { kind: 'weekly'; weekdays: readonly number[] } // 0–6, 0 = вс; по возрастанию, без повторов, хотя бы один
  | { kind: 'monthly'; monthDay: number } // 1–31
  | { kind: 'yearly'; month: number; monthDay: number } // 1–12; 29 февраля в невисокосный год — 28-го
  | { kind: 'interval'; days: number }; // 2 и больше; «через день» = 2, отсчёт от startDate правила

export type RepeatKind = RepeatPattern['kind'];

export type Rule = RepeatPattern & {
  id: string;
  title: string;
  startDate: string;
  active: boolean;
  time?: string; // 'HH:MM'; переходит в экземпляры
  photo?: string; // имя файла в папке фото; переходит в экземпляры
};

export type Task = {
  id: string;
  title: string;
  date: string | null; // null — задача в Кармане
  time?: string; // 'HH:MM'; только у задачи с датой
  photo?: string; // имя файла в папке фото
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
