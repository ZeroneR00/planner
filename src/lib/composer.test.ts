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
  whenChips,
  whenHint,
  type Draft,
  type When,
} from '@/lib/composer';

// Суббота — как на скриншотах прототипа
const TODAY = '2026-10-17';

/** Набирает текст по шагам, как пользователь. */
function typed(...texts: string[]): Draft {
  return texts.reduce((draft, text) => editText(draft, text, TODAY), emptyDraft);
}

function resolve(draft: Draft): When {
  return resolveWhen(draft, TODAY);
}

describe('разбор поля', () => {
  it('без даты — в Карман', () => {
    const when = resolve(typed('идея для статьи'));
    expect(when).toEqual({ title: 'идея для статьи', date: null, repeat: null, fromText: false });
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
      fromText: true,
    });
  });

  it('повтор из текста и подсказка', () => {
    const when = resolve(typed('каждый вторник вынести мусор'));
    expect(when.date).toBe('2026-10-20');
    expect(when.repeat).toEqual({ kind: 'weekly', weekday: 2 });
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
    expect(when).toEqual({ title: 'купить', date: TODAY, repeat: null, fromText: false });
  });

  it('дописал без новой даты — ручной выбор остаётся, с новой датой — сброшен', () => {
    const manual = pickDate(typed('завтра купить'), TODAY);
    expect(resolve(editText(manual, 'завтра купить хлеб', TODAY)).date).toBe(TODAY);
    const friday = resolve(editText(manual, 'завтра купить хлеб в пятницу', TODAY));
    expect(friday.date).toBe('2026-10-23');
    expect(friday.fromText).toBe(true);
  });

  it('стёр текст — ручной выбор сброшен', () => {
    const erased = editText(pickDate(typed('купить'), TODAY), '', TODAY);
    expect(erased).toEqual({ ...emptyDraft, text: '' });
    expect(hasText(erased)).toBe(false);
    expect(resolve(editText(erased, 'идея', TODAY)).date).toBeNull();
  });

  it('стёр текст в правке — выбор дня и повтора остаётся', () => {
    const manual = pickRepeat(pickDate(typed('мусор'), TODAY), 'daily');
    const erased = editText(manual, '', TODAY, true);
    expect(erased).toEqual({ ...manual, text: '' });
    const when = resolve(editText(erased, 'вынести мусор', TODAY, true));
    expect(when.date).toBe(TODAY);
    expect(when.repeat).toEqual({ kind: 'daily' });
  });

  it('пробелы — не текст', () => {
    expect(hasText(typed('   '))).toBe(false);
    expect(hasText(typed(' а '))).toBe(true);
  });

  it('«В карман» обнуляет повтор, даже выбранный вручную', () => {
    const when = resolve(pickDate(pickRepeat(typed('каждый вторник мусор'), 'daily'), null));
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
    expect(resolve(pickDate(tuesday, '2026-10-21')).repeat).toEqual({ kind: 'weekly', weekday: 3 });
    expect(resolve(pickRepeat(tuesday, 'monthly')).repeat).toEqual({ kind: 'monthly', monthDay: 20 });
  });

  it('«каждое 31-е» в ноябре остаётся 31-м', () => {
    const today = '2026-11-05';
    const when = resolveWhen(editText(emptyDraft, 'каждое 31-е оплатить интернет', today), today);
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

describe('addedHint', () => {
  const base: When = { title: 'x', date: null, repeat: null, fromText: false };

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
    const weekly = addedHint({ ...base, date: '2026-10-20', repeat: { kind: 'weekly', weekday: 2 } }, TODAY);
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
    expect(repeatOptions('2026-10-20').map((o) => o.label)).toEqual([
      'Один раз',
      'Каждый день',
      'По будням',
      'Каждую неделю · по вторникам',
      'Каждый месяц · 20-го',
    ]);
  });
});
