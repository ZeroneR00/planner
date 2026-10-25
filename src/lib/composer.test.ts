import {
  addedHint,
  calendarChipLabel,
  chipKey,
  editText,
  emptyDraft,
  hasText,
  pickDate,
  pickRepeat,
  repeatOptions,
  resolveWhen,
  toggleWeekday,
  whenChips,
  whenHint,
  type Draft,
  type When,
} from '@/lib/composer';
import { patternFor } from '@/lib/rules';

// Суббота — как на скриншотах прототипа
const TODAY = '2026-10-17';
const NOW = '10:00';

/** Набирает текст по шагам, как пользователь. */
function typed(...texts: string[]): Draft {
  return texts.reduce((draft, text) => editText(draft, text, TODAY, NOW), emptyDraft);
}

function resolve(draft: Draft): When {
  return resolveWhen(draft, TODAY, NOW);
}

describe('разбор поля', () => {
  it('без даты — в Карман', () => {
    const when = resolve(typed('идея для статьи'));
    expect(when).toEqual({ title: 'идея для статьи', date: null, repeat: null, time: null, fromText: false });
    expect(whenHint(when, TODAY)).toEqual({
      accent: false,
      parts: [{ text: 'Упадёт в стикеры, разберёшь потом' }],
    });
  });

  it('дата из текста вырезается из названия', () => {
    expect(resolve(typed('завтра купить хлеб'))).toEqual({
      title: 'купить хлеб',
      date: '2026-10-18',
      repeat: null,
      time: null,
      fromText: true,
    });
  });

  it('повтор из текста и подсказка', () => {
    const when = resolve(typed('каждый вторник вынести мусор'));
    expect(when.date).toBe('2026-10-20');
    expect(when.repeat).toEqual({ kind: 'weekly', weekdays: [2] });
    expect(whenHint(when, TODAY)).toEqual({
      accent: true,
      parts: [
        { text: 'вт, 20 октября', icon: 'arrowRight' },
        { text: 'каждый вт', icon: 'repeat' },
        { text: 'понял из текста' },
      ],
    });
  });

  it('ручной чип главнее текста', () => {
    const when = resolve(pickDate(typed('завтра купить'), TODAY));
    expect(when).toEqual({ title: 'купить', date: TODAY, repeat: null, time: null, fromText: false });
  });

  it('дописал без новой даты — ручной выбор остаётся, с новой датой — сброшен', () => {
    const manual = pickDate(typed('завтра купить'), TODAY);
    expect(resolve(editText(manual, 'завтра купить хлеб', TODAY, NOW)).date).toBe(TODAY);
    const friday = resolve(editText(manual, 'завтра купить хлеб в пятницу', TODAY, NOW));
    expect(friday.date).toBe('2026-10-23');
    expect(friday.fromText).toBe(true);
  });

  it('стёр текст — ручной выбор сброшен', () => {
    const erased = editText(pickDate(typed('купить'), TODAY), '', TODAY, NOW);
    expect(erased).toEqual({ ...emptyDraft, text: '' });
    expect(hasText(erased)).toBe(false);
    expect(resolve(editText(erased, 'идея', TODAY, NOW)).date).toBeNull();
  });

  it('стёр текст в правке — выбор дня и повтора остаётся', () => {
    const manual = pickRepeat(pickDate(typed('мусор'), TODAY), { kind: 'daily' });
    const erased = editText(manual, '', TODAY, NOW, true);
    expect(erased).toEqual({ ...manual, text: '' });
    const when = resolve(editText(erased, 'вынести мусор', TODAY, NOW, true));
    expect(when.date).toBe(TODAY);
    expect(when.repeat).toEqual({ kind: 'daily' });
  });

  it('пробелы — не текст', () => {
    expect(hasText(typed('   '))).toBe(false);
    expect(hasText(typed(' а '))).toBe(true);
  });

  it('«В карман» обнуляет повтор, даже выбранный вручную', () => {
    const when = resolve(pickDate(pickRepeat(typed('каждый вторник мусор'), { kind: 'daily' }), null));
    expect(when.date).toBeNull();
    expect(when.repeat).toBeNull();
  });

  it('«Один раз» гасит повтор из текста', () => {
    const when = resolve(pickRepeat(typed('каждый вторник мусор'), null));
    expect(when.date).toBe('2026-10-20');
    expect(when.repeat).toBeNull();
  });

  it('повтор следует за выбранным днём', () => {
    const tuesday = typed('каждый вторник мусор');
    expect(resolve(pickDate(tuesday, '2026-10-21')).repeat).toEqual({ kind: 'weekly', weekdays: [3] });
    const monthly = pickRepeat(tuesday, patternFor('monthly', '2026-10-20'));
    expect(resolve(monthly).repeat).toEqual({ kind: 'monthly', monthDay: 20 });
  });

  it('несколько дней из текста и чип дня', () => {
    const wedThu = typed('бег каждую ср и чт');
    expect(resolve(wedThu).repeat).toEqual({ kind: 'weekly', weekdays: [3, 4] });
    expect(resolve(pickDate(wedThu, '2026-10-22')).repeat).toEqual({ kind: 'weekly', weekdays: [3, 4] });
    expect(resolve(pickDate(wedThu, '2026-10-23')).repeat).toEqual({ kind: 'weekly', weekdays: [5] });
  });

  it('«каждое 31-е» в ноябре остаётся 31-м', () => {
    const today = '2026-11-05';
    const when = resolveWhen(editText(emptyDraft, 'каждое 31-е оплатить интернет', today, NOW), today, NOW);
    expect(when.date).toBe('2026-11-30');
    expect(when.repeat).toEqual({ kind: 'monthly', monthDay: 31 });
  });

  it('пробелы в названии схлопываются', () => {
    expect(resolve(typed('купить   хлеб  ')).title).toBe('купить хлеб');
    expect(resolve(typed('купить  завтра   хлеб')).title).toBe('купить хлеб');
  });

  it('только «завтра» — названия нет', () => {
    expect(resolve(typed('завтра')).title).toBe('');
  });
});

describe('ряд дней в ↻', () => {
  // «бег», «Сегодня» (сб), дальше — тапы по дням
  const once = pickDate(typed('бег'), TODAY);

  function days(draft: Draft): { date: string | null; repeat: unknown } {
    const { date, repeat } = resolve(draft);
    return { date, repeat };
  }

  it('дни включаются и выключаются, начало — ближайший отмеченный день', () => {
    const wed = toggleWeekday(once, TODAY, NOW, 3);
    expect(days(wed)).toEqual({ date: '2026-10-21', repeat: { kind: 'weekly', weekdays: [3] } });
    const wedThu = toggleWeekday(wed, TODAY, NOW, 4);
    expect(days(wedThu)).toEqual({ date: '2026-10-21', repeat: { kind: 'weekly', weekdays: [3, 4] } });
    const thu = toggleWeekday(wedThu, TODAY, NOW, 3);
    expect(days(thu)).toEqual({ date: '2026-10-22', repeat: { kind: 'weekly', weekdays: [4] } });
    // Начало считается от выбранного дня, а не от прошлого сдвига
    expect(days(toggleWeekday(thu, TODAY, NOW, 3)).date).toBe('2026-10-21');
    expect(days(toggleWeekday(thu, TODAY, NOW, 4))).toEqual({ date: TODAY, repeat: null });
  });

  it('из другого повтора — еженедельный только с этим днём', () => {
    const daily = pickRepeat(once, { kind: 'daily' });
    expect(resolve(toggleWeekday(daily, TODAY, NOW, 1)).repeat).toEqual({ kind: 'weekly', weekdays: [1] });
  });

  it('чип дня: не из отмеченных — повтор по нему одному, из отмеченных — дни остаются', () => {
    const wedThu = toggleWeekday(toggleWeekday(once, TODAY, NOW, 3), TODAY, NOW, 4);
    expect(resolve(pickDate(wedThu, '2026-10-23')).repeat).toEqual({ kind: 'weekly', weekdays: [5] });
    expect(days(pickDate(wedThu, '2026-10-22'))).toEqual({
      date: '2026-10-22',
      repeat: { kind: 'weekly', weekdays: [3, 4] },
    });
  });

  it('подсказка', () => {
    const wedThu = toggleWeekday(toggleWeekday(once, TODAY, NOW, 3), TODAY, NOW, 4);
    expect(whenHint(resolve(wedThu), TODAY).parts.map((p) => p.text)).toEqual([
      'ср, 21 октября',
      'по ср и чт',
    ]);
  });
});

describe('addedHint', () => {
  const base: When = { title: 'x', date: null, repeat: null, time: null, fromText: false };

  function line(when: Partial<When>): string {
    const hint = addedHint({ ...base, ...when }, TODAY);
    expect(hint.accent).toBe(false);
    return hint.parts.map((p) => p.text).join(' · ');
  }

  it('Карман, сегодня, другой день', () => {
    expect(line({})).toBe('Добавлено в стикеры. Разберёшь, когда будет минута');
    expect(line({ date: TODAY })).toBe('Добавлено на сегодня');
    expect(line({ date: '2026-10-20' })).toBe('Запланировано: вт, 20 октября');
  });

  it('повтор', () => {
    expect(line({ date: TODAY, repeat: { kind: 'daily' } })).toBe('Каждый день, начиная с сегодня');
    const weekly = addedHint({ ...base, date: '2026-10-20', repeat: { kind: 'weekly', weekdays: [2] } }, TODAY);
    expect(weekly.parts).toEqual([{ text: 'Каждый вт, начиная с 20 окт', icon: 'repeat' }]);
  });
});

describe('бегунок', () => {
  it('whenChips', () => {
    expect(whenChips(TODAY).map((c) => c.label)).toEqual([
      'В стикеры',
      'Сегодня',
      'Завтра',
      'Пн 19',
      'Вт 20',
      'Ср 21',
      'Чт 22',
      'Пт 23',
    ]);
    expect(whenChips(TODAY)[0]).toEqual({ key: 'pocket', label: 'В стикеры', date: null });
    expect(whenChips(TODAY)[2]).toEqual({ key: '2026-10-18', label: 'Завтра', date: '2026-10-18' });
  });

  it('chipKey', () => {
    expect(chipKey(null, TODAY)).toBe('pocket');
    expect(chipKey('2026-10-23', TODAY)).toBe('2026-10-23');
    expect(chipKey('2026-10-24', TODAY)).toBe('calendar');
  });

  it('calendarChipLabel', () => {
    expect(calendarChipLabel('2026-10-27', TODAY)).toBe('27 окт');
    expect(calendarChipLabel('2026-10-20', TODAY)).toBe('Дата');
    expect(calendarChipLabel(null, TODAY)).toBe('Дата');
  });

  it('repeatOptions берут день недели и число от выбранного дня', () => {
    expect(repeatOptions('2026-10-20', null).map((o) => o.label)).toEqual([
      'Один раз',
      'Каждый день',
      'Через день',
      'По будням',
      'Каждую неделю · по вторникам',
      'Каждый месяц · 20-го',
      'Каждый год · 20 октября',
    ]);
    expect(repeatOptions('2026-10-20', null).map((o) => o.key)).toEqual([
      'once',
      'daily',
      'interval',
      'weekdays',
      'weekly',
      'monthly',
      'yearly',
    ]);
  });

  it('repeatOptions: повтор того же вида остаётся как есть', () => {
    const options = repeatOptions('2026-10-21', { kind: 'weekly', weekdays: [3, 4] });
    expect(options[4]).toEqual({
      key: 'weekly',
      pattern: { kind: 'weekly', weekdays: [3, 4] },
      label: 'Каждую неделю · по ср и чт',
    });
    expect(options[6]?.pattern).toEqual({ kind: 'yearly', month: 10, monthDay: 21 });
    const every3 = repeatOptions('2026-10-21', { kind: 'interval', days: 3 });
    expect(every3[2]).toEqual({ key: 'interval', pattern: { kind: 'interval', days: 3 }, label: 'Каждые 3 дня' });
  });
});

describe('время', () => {
  it('время без дня — сегодня, подсказка со временем', () => {
    const when = resolve(typed('созвон в 15'));
    expect(when).toEqual({ title: 'созвон', date: TODAY, repeat: null, time: '15:00', fromText: true });
    expect(whenHint(when, TODAY)).toEqual({
      accent: true,
      parts: [
        { text: 'сегодня, сб, 17 октября', icon: 'arrowRight' },
        { text: '15:00' },
        { text: 'понял из текста' },
      ],
    });
  });

  it('время уже прошло — завтра', () => {
    expect(resolve(typed('созвон в 9'))).toMatchObject({ date: '2026-10-18', time: '09:00' });
  });

  it('показывается без ведущего нуля', () => {
    expect(whenHint(resolve(typed('созвон в 11:00')), TODAY).parts[1]).toEqual({ text: '11:00' });
    expect(whenHint(resolve(typed('созвон завтра в 9:00')), TODAY).parts[1]).toEqual({ text: '9:00' });
  });

  it('чип «В стикеры» после времени — без дня и без времени', () => {
    const when = resolve(pickDate(typed('созвон в 15'), null));
    expect(when).toMatchObject({ date: null, time: null });
    expect(whenHint(when, TODAY).parts[0]?.text).toBe('Упадёт в стикеры, разберёшь потом');
  });

  it('чип дня, потом время — день остаётся', () => {
    const monday = pickDate(typed('созвон'), '2026-10-19');
    expect(resolve(editText(monday, 'созвон в 15', TODAY, NOW))).toMatchObject({
      date: '2026-10-19',
      time: '15:00',
    });
  });

  it('«В стикеры», потом дописал время — снова сегодня', () => {
    const pocket = pickDate(typed('созвон'), null);
    expect(resolve(editText(pocket, 'созвон в 15', TODAY, NOW))).toMatchObject({ date: TODAY, time: '15:00' });
  });

  it('addedHint со временем', () => {
    const when = resolve(typed('созвон в 15'));
    expect(addedHint(when, TODAY).parts.map((p) => p.text)).toEqual(['Добавлено на сегодня', '15:00']);
  });
});

describe('повтор «через день»', () => {
  it('из текста — с сегодня', () => {
    const when = resolve(typed('полить цветы через день'));
    expect(when).toMatchObject({ title: 'полить цветы', date: TODAY, repeat: { kind: 'interval', days: 2 } });
  });

  it('чип дня сохраняет повтор и начинает с этого дня', () => {
    const when = resolve(pickDate(typed('полить цветы через день'), '2026-10-19'));
    expect(when).toMatchObject({ date: '2026-10-19', repeat: { kind: 'interval', days: 2 } });
    const manual = pickRepeat(pickDate(typed('полить'), TODAY), { kind: 'interval', days: 2 });
    expect(resolve(pickDate(manual, '2026-10-19'))).toMatchObject({
      date: '2026-10-19',
      repeat: { kind: 'interval', days: 2 },
    });
  });
});
