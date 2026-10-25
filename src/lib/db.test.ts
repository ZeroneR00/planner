/** @jest-environment node */
import { at } from '@/lib/dates';
import { demoChanges } from '@/lib/demo';
import {
  loadData,
  migrate,
  MIGRATIONS,
  startDay,
  writeChanges,
  type BindValue,
  type Db,
} from '@/lib/db';
import type { Env, Rule, Task } from '@/lib/types';

type NodeStatement = {
  run(...p: BindValue[]): unknown;
  all(...p: BindValue[]): unknown[];
  get(...p: BindValue[]): unknown;
};
type NodeDatabase = { exec(sql: string): void; prepare(sql: string): NodeStatement };
// Типов Node в проекте нет (приложение не для Node) — описываем только нужное тесту
// eslint-disable-next-line @typescript-eslint/no-require-imports -- встроенный модуль Node, только в тесте
const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => NodeDatabase };

/** Тот же интерфейс Db, что у expo-sqlite, но поверх встроенного в Node SQLite. */
function openTestDb(): Db {
  const db = new DatabaseSync(':memory:');
  return {
    execSync(sql) {
      db.exec(sql);
    },
    runSync(sql, params) {
      return db.prepare(sql).run(...params);
    },
    getAllSync<T>(sql: string, params: BindValue[]) {
      return db.prepare(sql).all(...params) as T[];
    },
    getFirstSync<T>(sql: string, params: BindValue[]) {
      return (db.prepare(sql).get(...params) ?? null) as T | null;
    },
    withTransactionSync(task) {
      db.exec('BEGIN');
      try {
        task();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

const TODAY = '2026-10-18';
const YESTERDAY = '2026-10-17';
const NOW = '2026-10-18T06:00:00.000Z';
const BEFORE = '2026-10-01T06:00:00.000Z';

function makeEnv(): Env {
  let n = 0;
  return { today: TODAY, now: NOW, makeId: () => `new-${++n}` };
}

function task(overrides: Partial<Task> & { id: string }): Task {
  return {
    title: overrides.id,
    date: TODAY,
    done: false,
    order: 0,
    createdAt: BEFORE,
    updatedAt: BEFORE,
    ...overrides,
  };
}

function rule(overrides: Partial<Rule> & { id: string }): Rule {
  return {
    kind: 'daily',
    title: `правило ${overrides.id}`,
    startDate: '2026-10-01',
    active: true,
    ...overrides,
  } as Rule;
}

function count(db: Db, table: 'tasks' | 'rules'): number {
  return db.getFirstSync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`, [])?.n ?? -1;
}

let db: Db;

beforeEach(() => {
  db = openTestDb();
  migrate(db);
});

describe('migrate', () => {
  it('создаёт схему на пустой базе', () => {
    const fresh = openTestDb();
    expect(migrate(fresh)).toBe(0);
    expect(fresh.getFirstSync<{ user_version: number }>('PRAGMA user_version', [])?.user_version).toBe(
      MIGRATIONS.length,
    );
    const tables = fresh
      .getAllSync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name", [])
      .map((row) => row.name);
    expect(tables).toEqual(['rules', 'tasks']);
  });

  it('повторный запуск ничего не делает', () => {
    expect(migrate(db)).toBe(MIGRATIONS.length);
  });

  it('версия 1 → 2: один день недели становится списком дней', () => {
    const old = openTestDb();
    old.execSync(at(MIGRATIONS, 0));
    old.execSync('PRAGMA user_version = 1');
    old.runSync(
      'INSERT INTO rules (id, title, kind, weekday, month_day, start_date, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['w', 'мусор', 'weekly', 2, null, '2026-10-01', 1],
    );
    expect(migrate(old)).toBe(1);
    expect(old.getFirstSync<{ user_version: number }>('PRAGMA user_version', [])?.user_version).toBe(2);
    expect(loadData(old, TODAY).rules).toStrictEqual([
      { id: 'w', title: 'мусор', kind: 'weekly', weekdays: [2], startDate: '2026-10-01', active: true },
    ]);
  });
});

describe('writeChanges и loadData', () => {
  it('задача после записи и чтения та же; у минимальной нет лишних полей', () => {
    const full = task({ id: 'full', done: true, doneAt: NOW, ruleId: 'r1', returned: true, order: 3 });
    const min = task({ id: 'min', date: null });
    writeChanges(db, { putTasks: [full, min] });

    const { tasks } = loadData(db, TODAY);
    expect(tasks).toStrictEqual([full, min]);
    expect(tasks[1]).not.toHaveProperty('doneAt');
    expect(tasks[1]).not.toHaveProperty('ruleId');
    expect(tasks[1]).not.toHaveProperty('returned');
  });

  it('правила всех видов после записи и чтения те же', () => {
    const rules = [
      rule({ id: 'd', kind: 'daily' }),
      rule({ id: 'wd', kind: 'weekdays' }),
      rule({ id: 'w', kind: 'weekly', weekdays: [2] }),
      rule({ id: 'w2', kind: 'weekly', weekdays: [3, 4] }),
      rule({ id: 'm', kind: 'monthly', monthDay: 31 }),
      rule({ id: 'y', kind: 'yearly', month: 8, monthDay: 27 }),
      rule({ id: 'off', active: false }),
    ];
    writeChanges(db, { putRules: rules });
    expect(loadData(db, TODAY).rules).toStrictEqual(rules);
  });

  it('put существующего id заменяет строку', () => {
    writeChanges(db, { putTasks: [task({ id: 'a' })] });
    const changed = task({ id: 'a', title: 'новое' });
    writeChanges(db, { putTasks: [changed] });

    expect(count(db, 'tasks')).toBe(1);
    expect(loadData(db, TODAY).tasks).toStrictEqual([changed]);
  });

  it('remove удаляет задачи и правила', () => {
    writeChanges(db, { putTasks: [task({ id: 'a' })], putRules: [rule({ id: 'r' })] });
    writeChanges(db, { removeTasks: ['a'], removeRules: ['r'] });

    expect(count(db, 'tasks')).toBe(0);
    expect(count(db, 'rules')).toBe(0);
  });

  it('loadData не грузит только выполненное прошлых дней', () => {
    writeChanges(db, {
      putTasks: [
        task({ id: 'done-yesterday', date: YESTERDAY, done: true, doneAt: BEFORE }),
        task({ id: 'missed-yesterday', date: YESTERDAY }),
        task({ id: 'done-today', done: true, doneAt: NOW }),
        task({ id: 'pocket', date: null }),
        task({ id: 'future', date: '2026-10-25' }),
      ],
    });
    expect(loadData(db, TODAY).tasks.map((t) => t.id)).toEqual([
      'done-today',
      'future',
      'missed-yesterday',
      'pocket',
    ]);
    expect(count(db, 'tasks')).toBe(5);
  });

  it('транзакция: при ошибке не записывается ничего', () => {
    const bad = task({ id: 'bad', title: null as unknown as string });
    expect(() => writeChanges(db, { putTasks: [task({ id: 'good' }), bad] })).toThrow();
    expect(count(db, 'tasks')).toBe(0);
  });

  it('неизвестный вид повтора в базе — ошибка при загрузке', () => {
    db.runSync("INSERT INTO rules (id, title, kind, start_date) VALUES ('y', 'Раз в год', 'yearly', ?)", [
      TODAY,
    ]);
    expect(() => loadData(db, TODAY)).toThrow('yearly');
  });
});

describe('startDay', () => {
  function seed() {
    writeChanges(db, {
      putTasks: [task({ id: 'missed', date: YESTERDAY })],
      putRules: [rule({ id: 'walk', kind: 'daily' })],
    });
  }

  it('несделанное вчерашнее — в Карман, повтор — экземпляр на сегодня, база совпадает с памятью', () => {
    seed();
    const data = startDay(db, makeEnv());

    expect(data.tasks).toStrictEqual([
      task({ id: 'missed', date: null, returned: true, updatedAt: NOW }),
      task({ id: 'new-1', title: 'правило walk', ruleId: 'walk', createdAt: NOW, updatedAt: NOW }),
    ]);
    expect(loadData(db, TODAY)).toStrictEqual(data);
  });

  it('второй запуск ничего не меняет', () => {
    seed();
    const first = startDay(db, makeEnv());
    const second = startDay(db, makeEnv());

    expect(second).toStrictEqual(first);
    expect(count(db, 'tasks')).toBe(2);
  });

  it('демо-данные: три правила, «Прогулка» на сегодня, три задачи в Кармане', () => {
    const env = makeEnv();
    writeChanges(db, demoChanges(env));
    const data = startDay(db, env);

    expect(data.rules).toHaveLength(3);
    const walk = data.tasks.find((t) => t.date === TODAY && t.title === 'Прогулка');
    expect(walk?.ruleId).toBeDefined();
    expect(data.tasks.filter((t) => t.date === null)).toHaveLength(3);
  });
});
