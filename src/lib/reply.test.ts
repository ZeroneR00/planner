import type { When } from '@/lib/composer';
import { addedReply, spokenRepeat, spokenWhen } from '@/lib/reply';
import type { RepeatPattern } from '@/lib/types';

const TODAY = '2026-11-10'; // вторник

function when(date: string | null, time: string | null = null, repeat: RepeatPattern | null = null): When {
  return { title: 'позвонить', date, time, repeat, fromText: true };
}

describe('spokenWhen', () => {
  it('стикеры', () => {
    expect(spokenWhen(when(null), TODAY)).toBe('В стикеры');
  });

  it('сегодня — без времени и со временем', () => {
    expect(spokenWhen(when(TODAY), TODAY)).toBe('На сегодня');
    expect(spokenWhen(when(TODAY, '15:30'), TODAY)).toBe('Сегодня в 15:30');
  });

  it('ближайшие дни словами, дальше — число и месяц', () => {
    expect(spokenWhen(when('2026-11-11', '09:00'), TODAY)).toBe('Завтра в 9');
    expect(spokenWhen(when('2026-11-12'), TODAY)).toBe('Послезавтра');
    expect(spokenWhen(when('2026-11-14'), TODAY)).toBe('В субботу');
    expect(spokenWhen(when('2026-11-16'), TODAY)).toBe('В понедельник');
    expect(spokenWhen(when('2026-11-17'), TODAY)).toBe('17 ноября');
    expect(spokenWhen(when('2026-11-13', '09:30'), TODAY)).toBe('В пятницу в 9:30');
  });

  it('повтор вместо дня', () => {
    expect(spokenWhen(when(TODAY, '09:00', { kind: 'weekly', weekdays: [2] }), TODAY)).toBe(
      'Каждый вторник в 9',
    );
  });
});

describe('spokenRepeat', () => {
  it('один день недели — в нужном роде', () => {
    expect(spokenRepeat({ kind: 'weekly', weekdays: [3] })).toBe('Каждую среду');
    expect(spokenRepeat({ kind: 'weekly', weekdays: [0] })).toBe('Каждое воскресенье');
  });

  it('несколько дней — полными словами, неделя с понедельника', () => {
    expect(spokenRepeat({ kind: 'weekly', weekdays: [3, 4] })).toBe('По средам и четвергам');
    expect(spokenRepeat({ kind: 'weekly', weekdays: [1, 3, 5] })).toBe('По понедельникам, средам и пятницам');
    expect(spokenRepeat({ kind: 'weekly', weekdays: [0, 6] })).toBe('По субботам и воскресеньям');
  });

  it('остальное — как подпись повтора, с заглавной', () => {
    expect(spokenRepeat({ kind: 'daily' })).toBe('Каждый день');
    expect(spokenRepeat({ kind: 'interval', days: 2 })).toBe('Через день');
  });
});

describe('addedReply', () => {
  it('начало + когда', () => {
    expect(addedReply(when(null), TODAY, 0, false)).toBe('Принял. В стикеры.');
    expect(addedReply(when('2026-11-11', '09:00'), TODAY, 0, false)).toBe('Принял. Завтра в 9.');
  });

  it('уведомления выключены — говорим, только если есть время', () => {
    expect(addedReply(when('2026-11-11', '09:00'), TODAY, 0, true)).toMatch(/Уведомления выключены\.$/);
    expect(addedReply(when('2026-11-11'), TODAY, 0, true)).toBe('Принял. Завтра.');
  });

  it('начала по кругу и подряд не повторяются', () => {
    const w = when(TODAY);
    expect(addedReply(w, TODAY, 6, false)).toBe(addedReply(w, TODAY, 0, false));
    expect(addedReply(w, TODAY, 1, false)).not.toBe(addedReply(w, TODAY, 0, false));
    expect(addedReply(w, TODAY, 2, false)).toBe('Будет сделано, сэр. На сегодня.');
  });
});
