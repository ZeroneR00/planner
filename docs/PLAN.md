# ПЛАН ЭТАПА 2 — база: SQLite, схема, миграции, данные в памяти

**Статус:** выполнен, коммит fd89f8a.

## Контекст
Этап 1 дал чистую логику: `dates`, `parse-when`, `rules`, `rollover`. Теперь её нужно связать с хранилищем на телефоне. Нужны:
- `expo-sqlite`;
- схема и миграции через `PRAGMA user_version`;
- загрузка данных при запуске со сменой дня;
- один путь записи, через который пойдут все действия этапов 3–7.

Новых экранов нет. Экран «Сегодня» не меняется. Всё работает офлайн: база на телефоне, сети не нужно.

## Как выполнять
- План готовый. SPEC, прототип и код целиком не перечитывать: всё нужное — ниже.
- **Первый шаг — `npx expo install expo-sqlite`.** Установка согласована этим планом. Если команда допишет плагин в `app.json`, оставить.
- Если API `expo-sqlite` отличается от описанного ниже, сверить с `node_modules/expo-sqlite/build/*.d.ts`. Нужны: `SQLiteProvider`, `useSQLiteContext` и синхронные методы `execSync`, `runSync`, `getAllSync`, `getFirstSync`, `withTransactionSync`.
- Порядок: `types` → `dates` (`nowIso`) → `id` → `changes` → `db` → `demo` → `use-planner` → `_layout`. Тесты — сразу после своего файла.
- Этап меняет запуск приложения, поэтому нужна проверка на телефоне. Коммит — после «работает».

## Общие решения
- **Данные в памяти, база — хранилище.** `PlannerProvider` при запуске делает смену дня. Он держит `{ today, tasks, rules }` в React-состоянии. Экраны читают через `usePlanner()` и сами считают свои списки чистыми функциями (этап 3+).
- **Единственный путь записи — `commit(changes)`.**
  - Сначала `writeChanges(db, changes)`: одна транзакция SQLite.
  - Потом `setData(d => applyChanges(d, changes))`: то же самое в памяти.
  - Сначала база: если запись упала, память не меняется.
  - Отмена на этапе 6 — это просто обратные `Changes`.
- **Синхронный API `expo-sqlite` (`*Sync`).** Данных мало (сотни строк), вызов занимает доли миллисекунды. Зато нет гонок между записями и состояний «загрузка».
- **`src/lib/db.ts` не импортирует `expo-sqlite`.** Он работает через свой интерфейс `Db` — подмножество методов `SQLiteDatabase`. Настоящая база подходит под него структурно.
  - В Jest вместо неё — встроенный в Node `node:sqlite`. Он есть в Node 22.14, проверено: `ON CONFLICT` работает, SQLite 3.47.
  - Так SQL покрыт тестами на настоящем SQLite без новых пакетов.
- **Колонки в SQL — snake_case, в TS — camelCase.** Маппинг — в `db.ts`. `order` → `sort_order`, потому что `ORDER` — слово SQL.
- **Без внешних ключей и `CHECK`.** Целостность держит логика. `CHECK` в SQLite нельзя поменять без пересборки таблицы.
- **В память не грузим выполненные задачи прошлых дней.** Это история, экраны её не показывают, а в базе она остаётся. Запрос: `done = 0 OR date IS NULL OR date >= today`.
- **Смена дня пока только при запуске.** `AppState` и полночь — этап 8.
- **id — свой генератор** в формате uuid v4 на `Math.random`, без пакета. Уникальности в пределах телефона хватает.
- **Демо-данные:** только в `__DEV__` и только при создании базы (миграция с версии 0). Это задачи из прототипа. В APK база будет пустой. Чтобы получить демо заново — «Очистить данные» у Expo Go.
- **`Env` — всё «нечистое», что нужно чистым функциям:** `today`, `now`, `makeId`. Снаружи его собирает только `use-planner.tsx`. На этапах 3–7 действия будут выглядеть как `(data, env, …) => Changes`.

## Файлы

### `src/lib/types.ts` (дописать)
```ts
/** Всё, что держим в памяти. today — день последней смены дня; «сегодня» экраны берут отсюда. */
export type PlannerData = { today: string; tasks: Task[]; rules: Rule[] };

/** «Нечистое», что нужно чистым функциям: день, время, генератор id. В тестах — фиксированное. */
export type Env = { today: string; now: string; makeId: () => string };
```

### `src/lib/dates.ts` (дописать)
`nowIso(): string` → `new Date().toISOString()`. Текущее время берётся через одну функцию — по аналогии с `today()`.

### `src/lib/id.ts` (новый)
```ts
// uuid v4 на Math.random: id нужны уникальные только в пределах одного телефона,
// криптостойкость не важна, а пакет ради этого не ставим
export function makeId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
```

### `src/lib/changes.ts` (новый)
```ts
/** Единственный способ поменять данные: база и память применяют одно и то же. */
export type Changes = {
  putTasks?: readonly Task[];      // вставить или заменить целиком по id
  removeTasks?: readonly string[];
  putRules?: readonly Rule[];
  removeRules?: readonly string[];
};
export function applyChanges(data: PlannerData, changes: Changes): PlannerData
```
- Внутри обобщённый хелпер `applyTo<T extends { id: string }>(list, put = [], remove = [])`:
  - **сначала** убирает элементы из `remove`;
  - **потом** каждый `put` заменяет элемент на его месте, а если такого id нет — добавляет в конец.
- Входные массивы не мутируются.
- Тот же порядок «сначала удалить, потом записать» соблюдает `writeChanges`.

### `src/lib/db.ts` (новый)
```ts
export type BindValue = string | number | null;

/** Подмножество SQLiteDatabase из expo-sqlite. Настоящая база подходит структурно, в тестах — node:sqlite. */
export type Db = {
  execSync(sql: string): void;
  runSync(sql: string, params: BindValue[]): unknown;
  getAllSync<T>(sql: string, params: BindValue[]): T[];
  getFirstSync<T>(sql: string, params: BindValue[]): T | null;
  withTransactionSync(task: () => void): void;
};
```

**Миграции.** `MIGRATIONS: readonly string[]`. Индекс 0 — миграция на версию 1:
```sql
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
```

**`migrate(db): number`** — возвращает версию **до** миграции; 0 означает, что база только что создана.
- `PRAGMA journal_mode = WAL` — вне транзакции: внутри её менять нельзя.
- Версия: `getFirstSync<{ user_version: number }>('PRAGMA user_version', [])`.
- Пока версия < `MIGRATIONS.length`: в одной `withTransactionSync` выполнить `execSync(миграция)` и `PRAGMA user_version = N+1`. Миграция и номер версии применяются вместе или не применяются вовсе.
- Брать миграцию через `at(MIGRATIONS, version)` из `dates.ts`.

**Строки ↔ объекты.** Типы `TaskRow` и `RuleRow` — колонки как есть.
- `taskFromRow`: `done: row.done === 1`, `order: row.sort_order`.
  - Необязательные поля **появляются, только если есть значение**: `doneAt` (не NULL), `ruleId` (не NULL), `returned: true` (если 1).
  - Так задача из базы равна задаче, созданной в коде, где этих полей нет. Нужен комментарий.
- `taskToParams(task): BindValue[]` — в порядке колонок. Булевы → 0/1, `undefined` → `null`.
- `ruleFromRow` — `switch (row.kind)`:
  - `daily` / `weekdays` → без доп. полей;
  - `weekly` → `weekday`, `monthly` → `monthDay`. Если поле NULL — `throw`;
  - неизвестный `kind` → `throw new Error(...)`.

  Битые строки могут появиться только из-за нашей ошибки — лучше узнать о ней сразу.
- `ruleToParams(rule)` — `weekday` только у `weekly`, `month_day` только у `monthly`, иначе `null`. `active` → 0/1.

**Запросы:**
- **`loadData(db, today): PlannerData`**
  - задачи: `SELECT * FROM tasks WHERE done = 0 OR date IS NULL OR date >= ? ORDER BY created_at, id`;
  - правила: `SELECT * FROM rules`.
- **`writeChanges(db, changes): void`** — всё в одной `withTransactionSync`:
  1. `DELETE ... WHERE id = ?` для `removeTasks` и `removeRules`;
  2. `INSERT OR REPLACE INTO tasks (…колонки…) VALUES (?, …)` для `putTasks`, то же для `putRules`.

  `REPLACE` = удалить и вставить заново. Это ровно смысл `put`, а триггеров и внешних ключей у нас нет.
- **`startDay(db, env: Env): PlannerData`** — смена дня прямо в базе:
  1. `loadData(db, env.today)`;
  2. `rollover({ ...data, now: env.now, makeId: env.makeId })`;
  3. собрать changes: `{ putTasks: [...created, ...updated], removeTasks: removed }`;
  4. `writeChanges`;
  5. вернуть `applyChanges(data, changes)`.

### `src/lib/demo.ts` (новый)
`demoChanges(env: Env): Changes` — данные из прототипа (`seed()`) для проверки на телефоне. Это не тексты интерфейса, поэтому они не в `copy.ts`: нужен комментарий. Все задачи получают `createdAt` / `updatedAt` = `env.now`, все правила — `startDate` = `env.today`, `active: true`.

- **Сегодня** (`date = today`), `order` 0, 1, 2:
  - «Проверить новые заказы» — `done: true`, `doneAt: now`;
  - «Созвон с заказчиком»;
  - «Вёрстка формы заказа».
- **Карман** (`date: null`), `order` 0, 1, 2:
  - «Правки по макету» — `returned: true`;
  - «Идея: тёмная тема для сайта»;
  - «Купить батарейки».
- **Впереди:**
  - «Созвониться с новым заказчиком» — today + 1;
  - «Оплатить интернет» — `nextOccurrence({ kind: 'weekly', weekday: 2 }, today, false)`;
  - «Продлить домен» — today + 10.
- **Правила:**
  - «Прогулка» — `daily`;
  - «Вынести мусор» — `weekly`, вт (2);
  - «Оплатить хостинг» — `monthly`, 1-го.

Экземпляр «Прогулки» на сегодня demo **не создаёт**: его создаст `startDay`. Так на первом же запуске проверяется rollover.

### `src/hooks/use-planner.tsx` (новый)
```tsx
export const DB_NAME = 'planner.db';

// Вне компонента: время, id и запись в базу — «нечистые», в теле рендера им не место
function currentEnv(): Env { return { today: today(), now: nowIso(), makeId }; }

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

export function usePlanner(): Planner  // use(PlannerContext); null → throw 'usePlanner вне PlannerProvider'
```
- React Compiler включён, поэтому `useCallback` / `useMemo` не нужны.
- `<Context value>` и `use()` — синтаксис React 19.

### `src/app/_layout.tsx` (правка)
Внутри `ThemeProvider` обернуть `Stack`:
```tsx
<SQLiteProvider databaseName={DB_NAME} onInit={prepareDatabase}>
  <PlannerProvider>
    <Stack … />
  </PlannerProvider>
</SQLiteProvider>
```
- `SQLiteProvider` ничего не рисует, пока база не открыта и `onInit` не закончился. Это миллисекунды, а фон под ним уже наш.
- Ошибку миграции `SQLiteProvider` по умолчанию пробрасывает: в dev будет красный экран. Для v1 этого достаточно.

## Тесты

### `id.test.ts`
- Формат: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/`.
- 1000 вызовов — 1000 разных id.

### `changes.test.ts`
Данные: `{ today: '2026-10-18', tasks, rules }`, хелперы `task()` / `rule()` как в `rollover.test.ts`.

| Что проверяем | Ожидание |
|---|---|
| put новой задачи | в конце списка |
| put существующей | заменена на своём месте, длина та же |
| remove | задачи нет |
| remove и put одного id | put побеждает |
| то же для правил | работает |
| вход через `Object.freeze` (и массивы) | не мутируется, `today` сохраняется |
| пустой `{}` | данные равны исходным |

### `db.test.ts` — на настоящем SQLite
- Первая строка — докблок `/** @jest-environment node */`: тест работает в чистом Node.
- Адаптер `openTestDb(): Db` поверх `node:sqlite`, в самом тест-файле:
```ts
type NodeStatement = { run(...p: BindValue[]): unknown; all(...p: BindValue[]): unknown[]; get(...p: BindValue[]): unknown };
type NodeDatabase = { exec(sql: string): void; prepare(sql: string): NodeStatement };
// Типов Node в проекте нет (приложение не для Node) — описываем только нужное тесту
// eslint-disable-next-line @typescript-eslint/no-require-imports -- встроенный модуль Node, только в тесте
const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => NodeDatabase };
```
- Методы адаптера:
  - `execSync` → `exec`;
  - `runSync` / `getAllSync` → `prepare(sql).run/all(...params)`;
  - `getFirstSync` → `get(...) ?? null`;
  - `withTransactionSync` → `BEGIN` / `COMMIT`, при ошибке `ROLLBACK` + `throw`.
- База `':memory:'`, новая в каждом тесте.
- Предупреждение `ExperimentalWarning: SQLite` в выводе Jest ожидаемо.

Сегодня `2026-10-18`, `env` фиксированный, `makeId` → `new-1`, `new-2`…

| # | Что проверяем | Ожидание |
|---|---|---|
| 1 | `migrate` на пустой базе | вернул 0; `PRAGMA user_version` = `MIGRATIONS.length`; таблицы `tasks` и `rules` есть (`sqlite_master`) |
| 2 | второй `migrate` | вернул `MIGRATIONS.length`, без ошибок |
| 3 | круг «записал → прочитал»: полная задача (`doneAt`, `ruleId`, `returned`) и минимальная | `loadData` возвращает равные объекты; у минимальной нет `doneAt` / `ruleId` / `returned` |
| 4 | круг для правил: daily, weekdays, weekly{2}, monthly{31}, неактивное | равны исходным |
| 5 | put существующего id | заменено, строк по-прежнему одна |
| 6 | `removeTasks` и `removeRules` | строк нет |
| 7 | фильтр `loadData`: выполненная вчерашняя / несделанная вчерашняя / выполненная сегодняшняя / Карман / будущая | грузятся все, кроме выполненной вчерашней |
| 8 | транзакция: put хорошей задачи и задачи с `title: null as unknown as string` | `writeChanges` бросает ошибку; в базе пусто — хорошая задача тоже откатилась |
| 9 | `startDay`: вчерашняя несделанная + daily-правило | в базе и в результате вчерашняя в Кармане (`returned`) и есть экземпляр на сегодня; `loadData` совпадает с результатом |
| 10 | `startDay` второй раз | результат тот же, новых строк нет |
| 11 | демо: `migrate` → `writeChanges(demoChanges(env))` → `startDay` | правил 3; на сегодня есть экземпляр «Прогулка» с `ruleId`; в Кармане 3 задачи |
| 12 | `ruleFromRow` через базу: строка `kind = 'yearly'`, вставленная SQL-ом напрямую | `loadData` бросает ошибку |

## Документация
- **`docs/DECISIONS.md`** — запись «2026-10-23 — этап 2 (база)»:
  - данные в памяти, база — хранилище; один путь записи `commit(changes)`;
  - синхронный API `expo-sqlite`;
  - интерфейс `Db` и тесты на `node:sqlite`;
  - свой генератор id;
  - `sort_order`, snake_case;
  - без внешних ключей и `CHECK`;
  - выполненное прошлых дней в память не грузим;
  - демо-данные в dev при создании базы;
  - смена дня пока только при запуске.
- **`docs/SPEC.md` → «Модель данных»**, после строки про таблицы: «Колонки в SQLite — snake_case; `order` → `sort_order` (ORDER — слово SQL)».
- **`AGENTS.md`:**
  - в «Структуре», в `lib/`, добавить строки:
    - `changes.ts  # Changes и applyChanges — единственный путь записи`
    - `id.ts       # makeId — uuid без пакета`
    - `demo.ts     # демо-данные для dev`
  - у `db.ts` комментарий: `# схема, миграции, запросы — через интерфейс Db`;
  - в `hooks/` — `use-planner.tsx  # PlannerProvider, usePlanner: данные в памяти, commit → база`;
  - в «Правилах кода» строку про `src/lib` уточнить: «…без React и React Native. К базе обращается только `db.ts` — через интерфейс `Db`, без импорта `expo-sqlite`».

## Проверка
1. `npm run typecheck`, `npm run lint`, `npm test` — все зелёные.
2. **Телефон:** `npx expo start`, открыть в Expo Go.
   - Экран «Сегодня» как раньше, без ошибок.
   - В терминале Expo: `[база] 2026-10-…: задач 10, повторов 3`. Задач на 1–2 больше, если сегодня вторник или 1-е число.
3. Закрыть Expo Go полностью и открыть снова: те же числа. База сохранилась, повторная смена дня ничего не добавила.

## Коммит
«Этап 2: SQLite — схема, миграции, данные в памяти, commit + тесты». Коммит — после «работает» с телефона. Затем в этом файле статус «выполнен, коммит …».
