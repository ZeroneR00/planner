import { applyChanges, type Changes } from '@/lib/changes';
import { at } from '@/lib/dates';
import { rollover } from '@/lib/rollover';
import type { Env, PlannerData, Rule, Task } from '@/lib/types';

export type BindValue = string | number | null;

/** Подмножество SQLiteDatabase из expo-sqlite. Настоящая база подходит структурно, в тестах — node:sqlite. */
export type Db = {
  execSync(sql: string): void;
  runSync(sql: string, params: BindValue[]): unknown;
  getAllSync<T>(sql: string, params: BindValue[]): T[];
  getFirstSync<T>(sql: string, params: BindValue[]): T | null;
  withTransactionSync(task: () => void): void;
};

// Индекс i — миграция на версию i + 1. Уже выпущенные миграции не меняем, только дописываем новые.
// Внешних ключей и CHECK нет: целостность держит логика, а CHECK в SQLite не поменять без пересборки таблицы
export const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE tasks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    date TEXT,                       -- 'YYYY-MM-DD'; NULL — в Кармане
    done INTEGER NOT NULL DEFAULT 0,
    done_at TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    rule_id TEXT,
    returned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX tasks_date ON tasks (date);
  CREATE INDEX tasks_rule ON tasks (rule_id);
  CREATE TABLE rules (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    kind TEXT NOT NULL,
    weekday INTEGER,                 -- только weekly
    month_day INTEGER,               -- только monthly
    start_date TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );
  `,
];

/** Доводит схему до последней версии. Возвращает версию до миграции: 0 — база только что создана. */
export function migrate(db: Db): number {
  // Режим журнала нельзя менять внутри транзакции
  db.execSync('PRAGMA journal_mode = WAL');
  const from = db.getFirstSync<{ user_version: number }>('PRAGMA user_version', [])?.user_version ?? 0;
  for (let version = from; version < MIGRATIONS.length; version++) {
    // Миграция и номер версии — вместе или никак: иначе упавшая миграция запустится повторно на полусхеме
    db.withTransactionSync(() => {
      db.execSync(at(MIGRATIONS, version));
      db.execSync(`PRAGMA user_version = ${version + 1}`);
    });
  }
  return from;
}

type TaskRow = {
  id: string;
  title: string;
  date: string | null;
  done: number;
  done_at: string | null;
  sort_order: number;
  rule_id: string | null;
  returned: number;
  created_at: string;
  updated_at: string;
};

type RuleRow = {
  id: string;
  title: string;
  kind: string;
  weekday: number | null;
  month_day: number | null;
  start_date: string;
  active: number;
};

const TASK_COLUMNS = 'id, title, date, done, done_at, sort_order, rule_id, returned, created_at, updated_at';
const RULE_COLUMNS = 'id, title, kind, weekday, month_day, start_date, active';

function placeholders(columns: string): string {
  return columns
    .split(',')
    .map(() => '?')
    .join(', ');
}

// REPLACE = удалить и вставить заново — ровно смысл put; триггеров и внешних ключей у нас нет
const PUT_TASK = `INSERT OR REPLACE INTO tasks (${TASK_COLUMNS}) VALUES (${placeholders(TASK_COLUMNS)})`;
const PUT_RULE = `INSERT OR REPLACE INTO rules (${RULE_COLUMNS}) VALUES (${placeholders(RULE_COLUMNS)})`;

// Необязательные поля появляются, только если есть значение: задача из базы должна быть
// равна задаче, созданной в коде, где этих полей нет вовсе, а не стоит doneAt: undefined
function taskFromRow(row: TaskRow): Task {
  const task: Task = {
    id: row.id,
    title: row.title,
    date: row.date,
    done: row.done === 1,
    order: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.done_at !== null) task.doneAt = row.done_at;
  if (row.rule_id !== null) task.ruleId = row.rule_id;
  if (row.returned === 1) task.returned = true;
  return task;
}

/** В порядке TASK_COLUMNS. */
function taskToParams(task: Task): BindValue[] {
  return [
    task.id,
    task.title,
    task.date,
    task.done ? 1 : 0,
    task.doneAt ?? null,
    task.order,
    task.ruleId ?? null,
    task.returned ? 1 : 0,
    task.createdAt,
    task.updatedAt,
  ];
}

// Битые строки могут появиться только из-за нашей ошибки — лучше упасть сразу, чем тихо потерять повтор
function required(value: number | null, field: string, row: RuleRow): number {
  if (value === null) throw new Error(`У правила ${row.id} (${row.kind}) пустое поле ${field}`);
  return value;
}

function ruleFromRow(row: RuleRow): Rule {
  const base = { id: row.id, title: row.title, startDate: row.start_date, active: row.active === 1 };
  switch (row.kind) {
    case 'daily':
      return { ...base, kind: 'daily' };
    case 'weekdays':
      return { ...base, kind: 'weekdays' };
    case 'weekly':
      return { ...base, kind: 'weekly', weekday: required(row.weekday, 'weekday', row) };
    case 'monthly':
      return { ...base, kind: 'monthly', monthDay: required(row.month_day, 'month_day', row) };
    default:
      throw new Error(`Неизвестный вид повтора «${row.kind}» у правила ${row.id}`);
  }
}

/** В порядке RULE_COLUMNS. */
function ruleToParams(rule: Rule): BindValue[] {
  return [
    rule.id,
    rule.title,
    rule.kind,
    rule.kind === 'weekly' ? rule.weekday : null,
    rule.kind === 'monthly' ? rule.monthDay : null,
    rule.startDate,
    rule.active ? 1 : 0,
  ];
}

export function loadData(db: Db, today: string): PlannerData {
  // Выполненное прошлых дней — история: экраны её не показывают, в базе она остаётся
  const tasks = db
    .getAllSync<TaskRow>(
      'SELECT * FROM tasks WHERE done = 0 OR date IS NULL OR date >= ? ORDER BY created_at, id',
      [today],
    )
    .map(taskFromRow);
  const rules = db.getAllSync<RuleRow>('SELECT * FROM rules', []).map(ruleFromRow);
  return { today, tasks, rules };
}

/** Всё одной транзакцией. Порядок как в applyChanges: сначала удалить, потом записать. */
export function writeChanges(db: Db, changes: Changes): void {
  db.withTransactionSync(() => {
    for (const id of changes.removeTasks ?? []) db.runSync('DELETE FROM tasks WHERE id = ?', [id]);
    for (const id of changes.removeRules ?? []) db.runSync('DELETE FROM rules WHERE id = ?', [id]);
    for (const task of changes.putTasks ?? []) db.runSync(PUT_TASK, taskToParams(task));
    for (const rule of changes.putRules ?? []) db.runSync(PUT_RULE, ruleToParams(rule));
  });
}

/** Смена дня прямо в базе: загрузить, применить rollover, записать. Возвращает данные для памяти. */
export function startDay(db: Db, env: Env): PlannerData {
  const data = loadData(db, env.today);
  const diff = rollover({ ...data, now: env.now, makeId: env.makeId });
  const changes: Changes = { putTasks: [...diff.created, ...diff.updated], removeTasks: diff.removed };
  writeChanges(db, changes);
  return applyChanges(data, changes);
}
