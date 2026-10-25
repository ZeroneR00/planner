import { addDays, dateParts, daysInMonth, makeDate } from '@/lib/dates';
import { nextOccurrence, patternFor } from '@/lib/rules';
import type { RepeatPattern } from '@/lib/types';

export type ParsedWhen = {
  title: string;
  date: string | null;
  repeat: RepeatPattern | null;
  hit: boolean;
};

type Found = { date: string; repeat: RepeatPattern | null };

// null — фраза похожа, но даты не существует; тогда пробуем следующий матчер
type Matcher = { re: RegExp; resolve: (m: RegExpExecArray, today: string) => Found | null };

// Ключевые слова парсера — не тексты интерфейса, поэтому живут здесь, а не в copy.ts.
//
// Границы слов — \s, а текст обёрнут пробелами: \b в JS опирается на \w,
// а это только латиница и цифры — кириллицу он не видит.
// Короткие «пн»…«вс» — после полных слов, чтобы «вторник» не разобрался как «вт» + «орник»
const WD =
  '(понедельник\\S*|вторник\\S*|сред\\S*|четверг\\S*|пятниц\\S*|суббот\\S*|воскресен\\S*|пн|вт|ср|чт|пт|сб|вс)';

// «каждую среду и четверг», «по средам и четвергам», «каждый пн, ср и пт»
const WD_LIST = `${WD}(?:(?:\\s*,\\s*(?:и\\s+)?|\\s+и\\s+)(?:(?:каждый|каждую|каждое)\\s+)?${WD})*`;

const YEARLY = '(?:каждый\\s+год|ежегодно)';

// Индекс = номер дня недели, 0 = вс
const WEEKDAY_STEMS = ['воскресен', 'понедельник', 'вторник', 'сред', 'четверг', 'пятниц', 'суббот'];
const WEEKDAY_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

// Високосный: «каждое 29 февраля» — допустимая дата
const LEAP_YEAR = 2028;

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function re(source: string): RegExp {
  return new RegExp(source, 'i');
}

// Обязательная группа регулярки: если её нет — ошибка в самой регулярке
function group(m: RegExpExecArray, i: number): string {
  const value = m[i];
  if (value === undefined) throw new Error(`В совпадении «${m[0]}» нет группы ${i}`);
  return value;
}

function weekdayNumber(word: string): number {
  const lower = word.toLowerCase();
  const short = WEEKDAY_SHORT.indexOf(lower);
  if (short !== -1) return short;
  const i = WEEKDAY_STEMS.findIndex((stem) => lower.startsWith(stem));
  return i === -1 ? 0 : i;
}

const WD_WORD = re(`^${WD}$`);

/** Дни недели из найденного списка — без повторов, по возрастанию. */
function weekdayList(phrase: string): number[] {
  const days = phrase
    .split(/[\s,]+/)
    .filter((word) => WD_WORD.test(word))
    .map(weekdayNumber);
  return [...new Set(days)].sort((a, b) => a - b);
}

function repeating(repeat: RepeatPattern, today: string): Found {
  return { date: nextOccurrence(repeat, today), repeat };
}

function once(date: string | null): Found | null {
  return date === null ? null : { date, repeat: null };
}

/** Ближайшая дата с таким числом и месяцем: в этом году, а если уже прошла — в следующем. */
function upcoming(today: string, month: number, day: number): string | null {
  const { year } = dateParts(today);
  const date = makeDate(year, month, day);
  if (date === null || date >= today) return date;
  return makeDate(year + 1, month, day);
}

const MATCHERS: Matcher[] = [
  {
    re: re(`\\s(?:каждый|каждую|каждое|по)\\s+${WD_LIST}(?=\\s)`),
    resolve: (m, today) => repeating({ kind: 'weekly', weekdays: weekdayList(m[0]) }, today),
  },
  {
    re: re('\\s(?:каждый\\s+день|ежедневно)(?=\\s)'),
    resolve: (_m, today) => ({ date: today, repeat: { kind: 'daily' } }),
  },
  {
    re: re('\\s(?:по\\s+будням|каждый\\s+будний\\s+день)(?=\\s)'),
    resolve: (_m, today) => repeating({ kind: 'weekdays' }, today),
  },
  {
    // До «каждое N число», иначе «каждое 27 августа» станет повтором 27-го каждого месяца
    re: re(`\\s(каждое\\s+|${YEARLY}\\s+)?(\\d{1,2})\\s+(${MONTHS.join('|')})(\\s+${YEARLY})?(?=\\s)`),
    resolve: (m, today) => {
      // Без «каждое» и «каждый год» — просто дата, её разберёт матчер ниже
      if (m[1] === undefined && m[4] === undefined) return null;
      const month = MONTHS.indexOf(group(m, 3).toLowerCase()) + 1;
      const monthDay = Number(group(m, 2));
      if (monthDay < 1 || monthDay > daysInMonth(LEAP_YEAR, month)) return null;
      return repeating({ kind: 'yearly', month, monthDay }, today);
    },
  },
  {
    re: re(`\\s${YEARLY}(?=\\s)`),
    resolve: (_m, today) => repeating(patternFor('yearly', today), today),
  },
  {
    re: re('\\sкаждое\\s+(\\d{1,2})(?:-?(?:е|го))?(?:\\s+число)?(?=\\s)'),
    resolve: (m, today) => {
      const monthDay = Number(group(m, 1));
      if (monthDay < 1 || monthDay > 31) return null;
      return repeating({ kind: 'monthly', monthDay }, today);
    },
  },
  {
    // «в субботу», написанное в субботу, — следующая суббота: для сегодня есть слово «сегодня»
    re: re(`\\s(?:в|во)\\s+${WD}(?=\\s)`),
    resolve: (m, today) =>
      once(nextOccurrence({ kind: 'weekly', weekdays: [weekdayNumber(group(m, 1))] }, today, false)),
  },
  { re: re('\\sпослезавтра(?=\\s)'), resolve: (_m, today) => once(addDays(today, 2)) },
  { re: re('\\sзавтра(?=\\s)'), resolve: (_m, today) => once(addDays(today, 1)) },
  { re: re('\\sсегодня(?=\\s)'), resolve: (_m, today) => once(today) },
  {
    re: re('\\sчерез\\s+(?:(\\d+)\\s+)?(день|дня|дней|неделю|недели|недель)(?=\\s)'),
    resolve: (m, today) => {
      const n = m[1] === undefined ? 1 : Number(m[1]);
      const isWeeks = group(m, 2).toLowerCase().startsWith('недел');
      return once(addDays(today, isWeeks ? n * 7 : n));
    },
  },
  {
    re: re(`\\s(\\d{1,2})\\s+(${MONTHS.join('|')})(?=\\s)`),
    resolve: (m, today) => {
      const month = MONTHS.indexOf(group(m, 2).toLowerCase()) + 1;
      return once(upcoming(today, month, Number(group(m, 1))));
    },
  },
  {
    re: re('\\s(\\d{1,2})\\.(\\d{1,2})(?=\\s)'),
    resolve: (m, today) => once(upcoming(today, Number(group(m, 2)), Number(group(m, 1)))),
  },
];

/**
 * Находит в тексте «когда» и вырезает эту фразу из названия.
 * Берётся только первая найденная фраза — по порядку матчеров, а не по позиции в тексте.
 */
export function parseWhen(text: string, today: string): ParsedWhen {
  const padded = ` ${text} `;
  for (const { re: matcherRe, resolve } of MATCHERS) {
    const m = matcherRe.exec(padded);
    if (m === null) continue;
    const found = resolve(m, today);
    if (found === null) continue;
    const rest = padded.slice(0, m.index) + ' ' + padded.slice(m.index + m[0].length);
    return {
      title: rest.replace(/\s+/g, ' ').trim(),
      date: found.date,
      repeat: found.repeat,
      hit: true,
    };
  }
  return { title: text, date: null, repeat: null, hit: false };
}
