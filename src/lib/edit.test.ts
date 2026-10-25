import type { Changes } from '@/lib/changes';
import {
  addedHint,
  editText,
  pickDate,
  pickRepeat,
  resolveWhen,
  toggleWeekday,
  type Draft,
  type When,
} from '@/lib/composer';
import { formatDayLong } from '@/lib/dates';
import { patternFor } from '@/lib/rules';
import {
  editHint,
  editUndoText,
  savedHint,
  saveEdit,
  startEdit,
  startRuleEdit,
  type EditState,
} from '@/lib/edit';
import type { PlannerData, RepeatPattern, Rule, Task } from '@/lib/types';

const TODAY = '2026-10-18'; // воскресенье
const TOMORROW = '2026-10-19';
const NOW = '2026-10-18T09:30:00.000Z';
const BEFORE = '2026-10-01T06:00:00.000Z';
const CLOCK = '10:00'; // время на часах для разбора «в 9»

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

function rule(pattern: RepeatPattern, overrides: Partial<Omit<Rule, keyof RepeatPattern>> = {}): Rule {
  return { id: 'r', title: 'зарядка', startDate: '2026-10-01', active: true, ...overrides, ...pattern };
}

function data(tasks: Task[], rules: Rule[] = [], today = TODAY): PlannerData {
  return { today, tasks, rules };
}

let ids = 0;
const makeId = () => `id${ids++}`;
beforeEach(() => {
  ids = 0;
});

/** Правка, как в поле: тап по задаче, действия с черновиком, ✓. */
function save(d: PlannerData, t: Task, change: (draft: Draft) => Draft): Changes | null {
  const { edit, draft } = startEdit(d, t);
  return saveEdit(d, edit, resolveWhen(change(draft), d.today, CLOCK), NOW, makeId);
}

const retitle = (text: string) => (d: Draft) => editText(d, text, TODAY, CLOCK, true);

/** Единственная задача из putTasks. */
function only(changes: Changes | null): Task {
  expect(changes?.removeTasks).toBeUndefined();
  expect(changes?.putTasks).toHaveLength(1);
  const t = changes?.putTasks?.[0];
  if (t === undefined) throw new Error('нет задачи в putTasks');
  return t;
}

describe('startEdit', () => {
  it('обычная задача на сегодня', () => {
    const t = task({ id: 'a', title: 'купить хлеб' });
    expect(startEdit(data([t]), t)).toEqual({
      edit: {
        target: { kind: 'task', taskId: 'a' },
        origin: { title: 'купить хлеб', date: TODAY, repeat: null, time: null, fromText: false },
      },
      draft: {
        text: 'купить хлеб',
        date: { manual: true, value: TODAY },
        repeat: { manual: true, value: null },
      },
    });
  });

  it('задача в Кармане — без дня', () => {
    const t = task({ id: 'p', date: null });
    const { edit, draft } = startEdit(data([t]), t);
    expect(edit.origin.date).toBeNull();
    expect(draft.date).toEqual({ manual: true, value: null });
  });

  it('экземпляр повтора правит правило', () => {
    const r = rule({ kind: 'weekly', weekdays: [0] }, { title: 'полить цветы' });
    const t = task({ id: 'i', title: 'старое', ruleId: 'r' });
    const { edit, draft } = startEdit(data([t], [r]), t);
    expect(edit.target).toEqual({ kind: 'rule', ruleId: 'r', taskId: 'i' });
    expect(edit.origin.repeat).toEqual({ kind: 'weekly', weekdays: [0] });
    expect(draft.text).toBe('полить цветы');
    expect(draft.repeat).toEqual({ manual: true, value: { kind: 'weekly', weekdays: [0] } });
  });

  it('вернувшийся экземпляр в Кармане — обычная задача', () => {
    const t = task({ id: 'p', date: null, ruleId: 'r', returned: true });
    const { edit } = startEdit(data([t], [rule({ kind: 'daily' })]), t);
    expect(edit.target).toEqual({ kind: 'task', taskId: 'p' });
  });
});

describe('saveEdit: задача', () => {
  it('только текст — тот же день и место', () => {
    const t = task({ id: 'a', title: 'купить хлеб', order: 3 });
    expect(only(save(data([t]), t, retitle('купить молоко')))).toEqual({
      ...t,
      title: 'купить молоко',
      updatedAt: NOW,
    });
  });

  it('текст в Кармане снимает «вчера не отмечено» и связь с повтором', () => {
    const t = task({ id: 'p', date: null, ruleId: 'r', returned: true, order: 3 });
    const result = only(save(data([t]), t, retitle('новое')));
    expect(result).toEqual({ ...task({ id: 'p', date: null, order: 3 }), title: 'новое', updatedAt: NOW });
  });

  it('сегодня → Карман: сверху Кармана', () => {
    const t = task({ id: 'a', order: 1 });
    const result = only(save(data([t, task({ id: 'p', date: null, order: 2 })]), t, (d) => pickDate(d, null)));
    expect(result).toMatchObject({ date: null, order: 1, done: false });
  });

  it('сделанная сегодня → завтра: в конец дня и снова не сделана', () => {
    const t = task({ id: 'a', done: true, doneAt: NOW });
    const d = data([t, task({ id: 'b', date: TOMORROW, order: 4 })]);
    const result = only(save(d, t, (draft) => pickDate(draft, TOMORROW)));
    expect(result).toEqual({ ...task({ id: 'a', date: TOMORROW, order: 5 }), updatedAt: NOW });
  });

  it('вернувшийся экземпляр → сегодня: обычная задача', () => {
    const t = task({ id: 'p', date: null, ruleId: 'r', returned: true });
    const d = data([t, task({ id: 'a', order: 2 })]);
    const result = only(save(d, t, (draft) => pickDate(draft, TODAY)));
    expect(result).toEqual({ ...task({ id: 'p', order: 3 }), updatedAt: NOW });
  });

  it('стала повтором — правило и экземпляр на сегодня вместо задачи', () => {
    const t = task({ id: 'a', title: 'полить цветы' });
    expect(save(data([t]), t, (d) => pickRepeat(d, patternFor('weekly', TODAY)))).toEqual({
      removeTasks: ['a'],
      putRules: [
        { kind: 'weekly', weekdays: [0], id: 'id0', title: 'полить цветы', startDate: TODAY, active: true },
      ],
      putTasks: [
        {
          id: 'id1',
          title: 'полить цветы',
          date: TODAY,
          done: false,
          order: 0, // сама задача убрана и места не занимает
          ruleId: 'id0',
          createdAt: NOW,
          updatedAt: NOW,
        },
      ],
    });
  });

  it('пока правили, задачу перенесли на сегодня — день не откатывается', () => {
    const t = task({ id: 'p', date: null });
    const { edit, draft } = startEdit(data([t]), t);
    const moved = { ...t, date: TODAY, order: 3, updatedAt: NOW };
    const when = resolveWhen(retitle('новое')(draft), TODAY, CLOCK);
    expect(only(saveEdit(data([moved]), edit, when, NOW, makeId))).toEqual({ ...moved, title: 'новое' });
  });

  it('задачи уже нет — ничего', () => {
    const t = task({ id: 'a' });
    const { edit, draft } = startEdit(data([t]), t);
    expect(saveEdit(data([]), edit, resolveWhen(draft, TODAY, CLOCK), NOW, makeId)).toBeNull();
  });
});

describe('saveEdit: повтор', () => {
  it('только текст — правило и экземпляр переименованы, отметка остаётся', () => {
    const r = rule({ kind: 'daily' });
    const inst = task({ id: 'i', title: 'зарядка', ruleId: 'r', done: true, doneAt: NOW });
    expect(save(data([inst], [r]), inst, retitle('утренняя зарядка'))).toEqual({
      putRules: [{ ...r, title: 'утренняя зарядка' }],
      putTasks: [{ ...inst, title: 'утренняя зарядка', updatedAt: NOW }],
    });
  });

  it('«каждое 31-е», открытое 30 ноября, остаётся 31-м', () => {
    const r = rule({ kind: 'monthly', monthDay: 31 });
    const inst = task({ id: 'i', date: '2026-11-30', ruleId: 'r' });
    const changes = save(data([inst], [r], '2026-11-30'), inst, retitle('оплатить интернет'));
    expect(changes?.putRules).toEqual([{ ...r, title: 'оплатить интернет' }]);
  });

  it('повтор увели с сегодня — несделанный экземпляр уходит, у правила нет лишних полей', () => {
    const saturday = '2026-10-17';
    const r = rule({ kind: 'weekly', weekdays: [6] });
    const inst = task({ id: 'i', date: saturday, ruleId: 'r' });
    // «По будням» в субботу начинается с понедельника
    expect(save(data([inst], [r], saturday), inst, (d) => pickRepeat(d, { kind: 'weekdays' }))).toEqual({
      putRules: [{ kind: 'weekdays', id: 'r', title: 'зарядка', startDate: '2026-10-19', active: true }],
      removeTasks: ['i'],
    });
  });

  it('повтор увели с сегодня — сделанный экземпляр остаётся', () => {
    const saturday = '2026-10-17';
    const r = rule({ kind: 'weekly', weekdays: [6] });
    const inst = task({ id: 'i', title: 'зарядка', date: saturday, ruleId: 'r', done: true, doneAt: NOW });
    const changes = save(data([inst], [r], saturday), inst, (d) => pickRepeat(d, { kind: 'weekdays' }));
    expect(changes?.removeTasks).toBeUndefined();
    expect(changes?.putTasks).toEqual([{ ...inst, updatedAt: NOW }]);
  });

  it('«Один раз» — правило выключено, экземпляр стал обычной задачей', () => {
    const r = rule({ kind: 'daily' });
    const inst = task({ id: 'i', ruleId: 'r', order: 2 });
    expect(save(data([inst], [r]), inst, (d) => pickRepeat(retitle('новое')(d), null))).toEqual({
      putRules: [{ ...r, active: false }],
      putTasks: [{ ...task({ id: 'i', order: 2 }), title: 'новое', updatedAt: NOW }],
    });
  });

  it('«Один раз» + «Завтра» — обычная задача на завтра', () => {
    const r = rule({ kind: 'daily' });
    const inst = task({ id: 'i', ruleId: 'r', order: 2 });
    const changes = save(data([inst], [r]), inst, (d) => pickDate(pickRepeat(d, null), TOMORROW));
    expect(changes?.putRules).toEqual([{ ...r, active: false }]);
    expect(changes?.putTasks).toEqual([{ ...task({ id: 'i', date: TOMORROW }), title: 'зарядка', updatedAt: NOW }]);
  });

  it('«В карман» — правило выключено, экземпляр в Кармане', () => {
    const r = rule({ kind: 'daily' });
    const inst = task({ id: 'i', ruleId: 'r', order: 2 });
    const changes = save(data([inst], [r]), inst, (d) => pickDate(d, null));
    expect(changes?.putRules).toEqual([{ ...r, active: false }]);
    expect(changes?.putTasks).toEqual([{ ...task({ id: 'i', date: null }), title: 'зарядка', updatedAt: NOW }]);
  });

  it('«Завтра» с повтором — правило с завтра, сегодняшний экземпляр уходит', () => {
    const r = rule({ kind: 'daily' });
    const inst = task({ id: 'i', ruleId: 'r' });
    expect(save(data([inst], [r]), inst, (d) => pickDate(d, TOMORROW))).toEqual({
      putRules: [{ kind: 'daily', id: 'r', title: 'зарядка', startDate: TOMORROW, active: true }],
      removeTasks: ['i'],
    });
  });
});

describe('правка из «Повторяется»', () => {
  const tuesday = '2026-10-20';
  const r = rule({ kind: 'weekly', weekdays: [2] }, { title: 'вынести мусор' });

  it('есть экземпляр на сегодня — правим с сегодня', () => {
    const daily = rule({ kind: 'daily' });
    const inst = task({ id: 'i', ruleId: 'r' });
    const { edit, draft } = startRuleEdit(data([inst], [daily]), daily);
    expect(edit.target).toEqual({ kind: 'rule', ruleId: 'r', taskId: 'i' });
    expect(draft.date).toEqual({ manual: true, value: TODAY });
  });

  it('экземпляра нет — ближайший день правила', () => {
    const { edit, draft } = startRuleEdit(data([], [r]), r);
    expect(edit.target).toEqual({ kind: 'rule', ruleId: 'r', taskId: null });
    expect(edit.origin).toEqual({
      title: 'вынести мусор',
      date: tuesday,
      repeat: { kind: 'weekly', weekdays: [2] },
      time: null,
      fromText: false,
    });
    expect(draft.repeat).toEqual({ manual: true, value: { kind: 'weekly', weekdays: [2] } });
  });

  function saveRule(change: (draft: Draft) => Draft): Changes | null {
    const d = data([], [r]);
    const { edit, draft } = startRuleEdit(d, r);
    return saveEdit(d, edit, resolveWhen(change(draft), d.today, CLOCK), NOW, makeId);
  }

  it('новый текст — правило переименовано, начало прежнее, задач не добавилось', () => {
    expect(saveRule(retitle('мусор и бумага'))).toEqual({ putRules: [{ ...r, title: 'мусор и бумага' }] });
  });

  it('добавили день в ряду ↻ — дни сохраняются, начало прежнее', () => {
    expect(saveRule((d) => toggleWeekday(d, TODAY, CLOCK, 4))).toEqual({ putRules: [{ ...r, weekdays: [2, 4] }] });
  });

  it('«Один раз» — правило выключено, обычная задача на ближайший день', () => {
    const changes = saveRule((d) => pickRepeat(d, null));
    expect(changes?.putRules).toEqual([{ ...r, active: false }]);
    expect(changes?.putTasks).toEqual([
      { id: 'id0', title: 'вынести мусор', date: tuesday, done: false, order: 0, createdAt: NOW, updatedAt: NOW },
    ]);
  });
});

describe('правка времени', () => {
  const call = task({ id: 'a', title: 'созвон', time: '15:00' });

  it('время возвращается в поле текстом', () => {
    const { edit, draft } = startEdit(data([call]), call);
    expect(draft.text).toBe('созвон в 15:00');
    expect(edit.origin.time).toBe('15:00');
  });

  it('стёрли время — у задачи его нет', () => {
    const result = only(save(data([call]), call, retitle('созвон')));
    expect(result).toEqual({ ...task({ id: 'a', title: 'созвон' }), updatedAt: NOW });
    expect(result).not.toHaveProperty('time');
  });

  it('поменяли время', () => {
    expect(only(save(data([call]), call, retitle('созвон в 16'))).time).toBe('16:00');
  });

  it('в стикеры — время снято', () => {
    const result = only(save(data([call]), call, (d) => pickDate(d, null)));
    expect(result.date).toBeNull();
    expect(result).not.toHaveProperty('time');
  });

  it('повтор: время меняется у правила и сегодняшнего экземпляра', () => {
    const r = rule({ kind: 'daily' }, { time: '07:00' });
    const inst = task({ id: 'i', title: 'зарядка', ruleId: 'r', time: '07:00' });
    const { draft } = startEdit(data([inst], [r]), inst);
    expect(draft.text).toBe('зарядка в 07:00');
    expect(save(data([inst], [r]), inst, retitle('зарядка в 8 утра'))).toEqual({
      putRules: [{ ...r, time: '08:00' }],
      putTasks: [{ ...inst, time: '08:00', updatedAt: NOW }],
    });
  });
});

describe('правка времени: место в дне по часам', () => {
  const bread = task({ id: 'bread', order: 0 });
  const gym = task({ id: 'gym', title: 'зал', order: 1, time: '10:00' });
  const call = task({ id: 'a', title: 'созвон', order: 2, time: '15:00' });

  it('15:00 → 7:00 в тот же день — встаёт выше', () => {
    expect(save(data([bread, gym, call]), call, retitle('созвон в 7 утра'))?.putTasks).toEqual([
      { ...call, time: '07:00', order: 1, updatedAt: NOW },
      { ...gym, order: 2 },
    ]);
  });

  it('стёрли время — место прежнее', () => {
    const first = { ...call, order: 0 };
    const late = task({ id: 'late', order: 1, time: '16:00' });
    expect(only(save(data([first, late]), first, retitle('созвон'))).order).toBe(0);
  });

  it('перенос на день со временем — по часам там', () => {
    const morning = task({ id: 'm', date: TOMORROW, order: 0, time: '09:00' });
    const evening = task({ id: 'e', date: TOMORROW, order: 1, time: '18:00' });
    const changes = save(data([call, morning, evening]), call, (d) => pickDate(d, TOMORROW));
    expect(changes?.putTasks).toEqual([
      { ...call, date: TOMORROW, order: 1, updatedAt: NOW },
      { ...evening, order: 2 },
    ]);
  });

  it('повтор, включённый в правке, не возвращает удалённую задачу', () => {
    const changes = save(data([bread, call]), call, (d) =>
      pickRepeat(retitle('созвон в 7 утра')(d), { kind: 'daily' }),
    );
    expect(changes?.removeTasks).toEqual(['a']);
    expect(changes?.putTasks?.map((t) => t.id)).not.toContain('a');
    expect(changes?.putTasks?.[0]).toMatchObject({ ruleId: 'id0', time: '07:00', order: 1 });
  });
});

describe('правка повтора «через день»', () => {
  const r = rule({ kind: 'interval', days: 2 }, { startDate: '2026-10-16' });
  const inst = task({ id: 'i', title: 'зарядка', ruleId: 'r' });

  it('открывается с тем же шагом', () => {
    expect(startEdit(data([inst], [r]), inst).draft.repeat).toEqual({
      manual: true,
      value: { kind: 'interval', days: 2 },
    });
  });

  it('без смены дня начало прежнее', () => {
    expect(save(data([inst], [r]), inst, retitle('полить цветы'))?.putRules).toEqual([
      { ...r, title: 'полить цветы' },
    ]);
  });

  it('смена дня — начало с нового дня', () => {
    const changes = save(data([inst], [r]), inst, (d) => pickDate(d, TOMORROW));
    expect(changes?.putRules).toEqual([{ ...r, startDate: TOMORROW }]);
    expect(changes?.removeTasks).toEqual(['i']);
  });
});

describe('подсказки правки', () => {
  const daily: When = { title: 'зарядка', date: TODAY, repeat: { kind: 'daily' }, time: null, fromText: true };

  it('правка повтора — «для всех повторов», без «понял из текста»', () => {
    expect(editHint(daily, TODAY, true)).toEqual({
      accent: true,
      parts: [
        { text: formatDayLong(TODAY, TODAY), icon: 'arrowRight' },
        { text: 'каждый день', icon: 'repeat' },
        { text: 'для всех повторов' },
      ],
    });
    expect(editHint(daily, TODAY, false).parts).toHaveLength(2);
  });

  it('в стикеры — серым', () => {
    const pocket: When = { title: 'идея', date: null, repeat: null, time: null, fromText: false };
    expect(editHint(pocket, TODAY, false)).toEqual({
      accent: false,
      parts: [{ text: 'в стикеры', icon: 'arrowRight' }],
    });
  });

  it('итог после ✓', () => {
    const origin: When = { title: 'купить хлеб', date: TODAY, repeat: null, time: null, fromText: false };
    const taskEdit: EditState = { target: { kind: 'task', taskId: 'a' }, origin };
    const ruleEdit: EditState = {
      target: { kind: 'rule', ruleId: 'r', taskId: 'i' },
      origin: { ...origin, repeat: { kind: 'daily' } },
    };
    const text = (hint: { parts: { text: string }[] }) => hint.parts.map((p) => p.text).join(' · ');

    expect(text(savedHint(taskEdit, { ...origin, title: 'купить молоко' }, TODAY))).toBe('Изменено');
    const moved: When = { ...origin, date: TOMORROW };
    expect(savedHint(taskEdit, moved, TODAY)).toEqual(addedHint(moved, TODAY));
    expect(text(savedHint(ruleEdit, daily, TODAY))).toBe('Изменено для всех повторов');
    expect(text(savedHint(ruleEdit, origin, TODAY))).toBe('Больше не повторяется');
  });
});

describe('editUndoText', () => {
  const sticker: When = { title: 'идея', date: null, repeat: null, time: null, fromText: false };
  const stickerEdit: EditState = { target: { kind: 'task', taskId: 'a' }, origin: sticker };
  const todayEdit: EditState = { target: { kind: 'task', taskId: 'a' }, origin: { ...sticker, date: TODAY } };

  it('стикер на другой день — плашка с днём', () => {
    expect(editUndoText(stickerEdit, { ...sticker, date: TOMORROW }, TODAY)).toBe('На завтра: идея');
    expect(editUndoText(stickerEdit, { ...sticker, date: TODAY }, TODAY)).toBe('На сегодня: идея');
  });

  it('в стикеры, правка текста и правка повтора — без плашки', () => {
    expect(editUndoText(todayEdit, sticker, TODAY)).toBeNull();
    expect(editUndoText(todayEdit, { ...sticker, date: TODAY, title: 'мысль' }, TODAY)).toBeNull();
    const ruleEdit: EditState = {
      target: { kind: 'rule', ruleId: 'r', taskId: 'i' },
      origin: { ...sticker, date: TODAY, repeat: { kind: 'daily' } },
    };
    expect(editUndoText(ruleEdit, { ...sticker, date: TOMORROW }, TODAY)).toBeNull();
  });
});
