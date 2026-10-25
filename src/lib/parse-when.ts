import {
  addDays,
  addMonths,
  at,
  dateParts,
  daysInMonth,
  formatTime,
  makeDate,
  nextWeekStart,
  weekdayOf,
} from '@/lib/dates';
import { normalize } from '@/lib/normalize';
import { nextOccurrence, patternFor } from '@/lib/rules';
import type { RepeatPattern } from '@/lib/types';

export type ParsedWhen = {
  title: string;
  date: string | null; // только время («в 15») — null: день решает resolveWhen
  repeat: RepeatPattern | null;
  time: string | null; // 'HH:MM'
  hit: boolean; // распознана дата или время
};

type Found = { date: string; repeat: RepeatPattern | null };

// null — фраза похожа, но даты не существует; тогда пробуем дальше
type Matcher = { re: RegExp; resolve: (m: RegExpExecArray, today: string) => Found | null };

// Часы как написаны: уточнение «утром» / «вечером» применится к ним позже, если своего нет
type Clock = { kind: 'clock'; time: string; hour: number; minute: number; zero: boolean; explicit: boolean };
// «в полдень», «через час» — время уже точное; days — сдвиг дня у «через», null — день не задан
type Exact = { kind: 'exact'; time: string; days: number | null };
type TimeFound = Clock | Exact;

type TimeContext = { now: string; bareOk: (m: RegExpExecArray) => boolean };
type TimeMatcher = { re: RegExp; resolve: (m: RegExpExecArray, ctx: TimeContext) => TimeFound | null };

type PartWord = { part: string; time: string };
type PartMatcher = { re: RegExp; resolve: (m: RegExpExecArray) => PartWord | null };

// Ключевые слова парсера — не тексты интерфейса, поэтому живут здесь, а не в copy.ts.
//
// Регулярки ищут по нормализованному тексту (normalize.ts): знаки — пробелы, ё — е, числа — цифрами.
// Границы слов — \s, а текст обёрнут пробелами: \b в JS опирается на \w,
// а это только латиница и цифры — кириллицу он не видит.
// Короткие «пн»…«вс» — после полных слов, чтобы «вторник» не разобрался как «вт» + «орник»
const WD =
  '(понедельник\\S*|вторник\\S*|сред\\S*|четверг\\S*|пятниц\\S*|суббот\\S*|воскресен\\S*|пн|вт|ср|чт|пт|сб|вс)';

// «каждую среду и четверг», «по средам и четвергам», «каждый пн, ср и пт» — запятые уже пробелы
const WD_LIST = `${WD}(?:\\s+(?:и\\s+)?(?:(?:каждый|каждую|каждое)\\s+)?${WD})*`;

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
const MONTH = `(${MONTHS.join('|')})`;

// «в 3 часа дня»; «днем» — уже без ё
const PART = '(?:\\s+(утра|дня|вечера|ночи))?';
const AT = '(?:в|к)';

const MORNING = '09:00';
const AFTERNOON = '13:00';
const EVENING = '19:00';

const MINUTES_IN_DAY = 24 * 60;

// Глобальные: одна регулярка может совпасть несколько раз, и первое совпадение бывает не тем
// («в 2 этапа … в 9») — поэтому перебираем все
function re(source: string): RegExp {
  return new RegExp(source, 'gi');
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

// Не через re(): у глобальной регулярки test() помнит lastIndex между вызовами
const WD_WORD = new RegExp(`^${WD}$`, 'i');

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

/** Каждые n дней; меньше двух — не повтор. */
function interval(n: number, today: string): Found | null {
  return n < 2 ? null : repeating({ kind: 'interval', days: n }, today);
}

/** Ближайшая дата с таким числом и месяцем: в этом году, а если уже прошла — в следующем. */
function upcoming(today: string, month: number, day: number): string | null {
  const { year } = dateParts(today);
  const date = makeDate(year, month, day);
  if (date === null || date >= today) return date;
  return makeDate(year + 1, month, day);
}

// Дата с годом в прошлом не распознаётся: задача ушла бы в прошлый день и пропала с экранов
function exactDate(today: string, year: number, month: number, day: number): string | null {
  const date = makeDate(year, month, day);
  return date !== null && date >= today ? date : null;
}

function monthNumber(word: string): number {
  return MONTHS.indexOf(word.toLowerCase()) + 1;
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
    re: re(`\\s(каждое\\s+|${YEARLY}\\s+)?(\\d{1,2})\\s+${MONTH}(\\s+${YEARLY})?(?=\\s)`),
    resolve: (m, today) => {
      // Без «каждое» и «каждый год» — просто дата, её разберёт матчер ниже
      if (m[1] === undefined && m[4] === undefined) return null;
      const month = monthNumber(group(m, 3));
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
  // Повторы — до времени, иначе «раз в 3 дня» разобралось бы как «в 3 дня» = 15:00.
  // «через день» — до разового «через N дней»: это повтор, а «через 1 день» — завтра
  { re: re('\\sчерез\\s+день(?=\\s)'), resolve: (_m, today) => interval(2, today) },
  {
    re: re('\\s(?:каждые|раз\\s+в)\\s+(\\d+)\\s+(?:дня|дней|день)(?=\\s)'),
    resolve: (m, today) => interval(Number(group(m, 1)), today),
  },
  {
    re: re('\\s(?:каждые|раз\\s+в)\\s+(\\d+)\\s+(?:недели|недель|неделю)(?=\\s)'),
    resolve: (m, today) => {
      const weeks = Number(group(m, 1));
      return weeks < 2 ? null : interval(weeks * 7, today);
    },
  },
  {
    re: re('\\s(?:каждую\\s+неделю|раз\\s+в\\s+неделю|еженедельно)(?=\\s)'),
    resolve: (_m, today) => repeating(patternFor('weekly', today), today),
  },
  {
    re: re('\\s(?:каждый\\s+месяц|раз\\s+в\\s+месяц|ежемесячно)(?=\\s)'),
    resolve: (_m, today) => repeating(patternFor('monthly', today), today),
  },
  {
    // До «в WD»: «в следующий вторник» — вторник следующей недели (неделя с понедельника)
    re: re(`\\s(?:в|во)\\s+следующ\\S*\\s+${WD}(?=\\s)`),
    resolve: (m, today) => once(addDays(nextWeekStart(today), (weekdayNumber(group(m, 1)) + 6) % 7)),
  },
  { re: re('\\sна\\s+следующей\\s+неделе(?=\\s)'), resolve: (_m, today) => once(nextWeekStart(today)) },
  {
    // В субботу и воскресенье «на выходных» — уже сегодня
    re: re('\\s(?:на\\s+выходных|в\\s+выходные)(?=\\s)'),
    resolve: (_m, today) => {
      const weekday = weekdayOf(today);
      if (weekday === 6 || weekday === 0) return once(today);
      return once(nextOccurrence({ kind: 'weekly', weekdays: [6] }, today));
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
    re: re('\\sчерез\\s+(?:(\\d+)\\s+)?(день|дня|дней|неделю|недели|недель|месяц|месяца|месяцев)(?=\\s)'),
    resolve: (m, today) => {
      const n = m[1] === undefined ? 1 : Number(m[1]);
      const unit = group(m, 2).toLowerCase();
      if (unit.startsWith('месяц')) return once(addMonths(today, n));
      return once(addDays(today, unit.startsWith('недел') ? n * 7 : n));
    },
  },
  {
    re: re(`\\s(\\d{1,2})\\s+${MONTH}\\s+(\\d{4})(?:\\s+(?:года|г))?(?=\\s)`),
    resolve: (m, today) =>
      once(exactDate(today, Number(group(m, 3)), monthNumber(group(m, 2)), Number(group(m, 1)))),
  },
  {
    // Не перед годом: прошлая дата с годом не должна разобраться как дата без года
    re: re(`\\s(\\d{1,2})\\s+${MONTH}(?!\\s+\\d{4}(?=\\s))(?=\\s)`),
    resolve: (m, today) => once(upcoming(today, monthNumber(group(m, 2)), Number(group(m, 1)))),
  },
  {
    re: re('\\s(\\d{1,2})\\.(\\d{1,2})\\.(\\d{4})(?=\\s)'),
    resolve: (m, today) =>
      once(exactDate(today, Number(group(m, 3)), Number(group(m, 2)), Number(group(m, 1)))),
  },
  {
    // «в 10.12» — время, если такое время бывает; «в 27.08» — дата
    re: re('\\s(?:(в|к)\\s+)?(\\d{1,2})\\.(\\d{1,2})(?=\\s)'),
    resolve: (m, today) => {
      const first = group(m, 2);
      const second = group(m, 3);
      if (m[1] !== undefined && Number(first) <= 23 && second.length === 2 && Number(second) <= 59) {
        return null;
      }
      return once(upcoming(today, Number(second), Number(first)));
    },
  },
];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function clockText(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

/**
 * Час как написан → 0–23; null — так не бывает («в 25», «в 3 вечера»).
 * Без уточнения 1–7 — днём («в 3» = 15:00), кроме записи с нулём: «в 03:30» = 3:30.
 */
function hour24(hour: number, part: string | undefined, zero: boolean): number | null {
  const inRange = (from: number, to: number) => hour >= from && hour <= to;
  switch (part?.toLowerCase()) {
    case undefined:
      if (hour > 23) return null;
      return !zero && inRange(1, 7) ? hour + 12 : hour;
    case 'утра':
      return inRange(0, 11) ? hour : null;
    case 'дня':
      if (hour === 12 || inRange(13, 18)) return hour;
      return inRange(1, 6) ? hour + 12 : null;
    case 'вечера':
      if (inRange(16, 23)) return hour;
      return inRange(4, 11) ? hour + 12 : null;
    case 'ночи':
      if (hour === 12) return 0;
      if (inRange(0, 5) || inRange(21, 23)) return hour;
      return inRange(9, 11) ? hour + 12 : null;
    default:
      return null;
  }
}

function clock(hour: number, minute: number, part: string | undefined, zero = false): Clock | null {
  const h = hour24(hour, part, zero);
  if (h === null || minute > 59) return null;
  return { kind: 'clock', time: clockText(h, minute), hour, minute, zero, explicit: part !== undefined };
}

function written(hour: string, minute: string, part: string | undefined): Clock | null {
  return clock(Number(hour), Number(minute), part, hour.length === 2 && hour.startsWith('0'));
}

// «в половине первого» — 12:30, а не 0:30
function hourBefore(hour: number): number | null {
  if (hour < 1 || hour > 12) return null;
  return hour === 1 ? 12 : hour - 1;
}

function exact(time: string): Exact {
  return { kind: 'exact', time, days: null };
}

function later(now: string, minutes: number): Exact {
  const total = Number(now.slice(0, 2)) * 60 + Number(now.slice(3, 5)) + minutes;
  const minute = total % MINUTES_IN_DAY;
  return {
    kind: 'exact',
    time: clockText(Math.floor(minute / 60), minute % 60),
    days: Math.floor(total / MINUTES_IN_DAY),
  };
}

// Порядок важен: «в 9 30» — раньше голого «в 9»
const TIME_MATCHERS: TimeMatcher[] = [
  {
    re: re(`\\s${AT}\\s+(\\d{1,2})[:.](\\d{2})${PART}(?=\\s)`),
    resolve: (m) => written(group(m, 1), group(m, 2), m[3]),
  },
  {
    // «в девять тридцать»
    re: re(`\\s${AT}\\s+(\\d{1,2})\\s+(\\d{2})${PART}(?=\\s)`),
    resolve: (m) => written(group(m, 1), group(m, 2), m[3]),
  },
  {
    // «полвосьмого» normalize уже превратил в «половине 8»
    re: re(`\\s(?:в\\s+)?половине\\s+(\\d{1,2})${PART}(?=\\s)`),
    resolve: (m) => {
      const hour = hourBefore(Number(group(m, 1)));
      return hour === null ? null : clock(hour, 30, m[2]);
    },
  },
  {
    re: re(`\\s(?:в\\s+)?без\\s+(четверти|\\d{1,2})\\s+(\\d{1,2})${PART}(?=\\s)`),
    resolve: (m) => {
      const word = group(m, 1).toLowerCase();
      const minutes = word === 'четверти' ? 15 : Number(word);
      const hour = hourBefore(Number(group(m, 2)));
      if (hour === null || minutes < 1 || minutes >= 30) return null;
      return clock(hour, 60 - minutes, m[3]);
    },
  },
  {
    // Голое «в 9» — время, только в конце текста или перед знаком, иначе «в 2 этапа» стало бы 14:00
    re: re(`\\s${AT}\\s+(\\d{1,2})(\\s+(?:час|часа|часов))?${PART}(?=\\s)`),
    resolve: (m, ctx) => {
      if (m[2] === undefined && m[3] === undefined && !ctx.bareOk(m)) return null;
      return written(group(m, 1), '00', m[3]);
    },
  },
  {
    re: re(`\\s${AT}\\s+час(?:\\s+(дня|ночи))?(?=\\s)`),
    resolve: (m) => exact(m[1]?.toLowerCase() === 'ночи' ? '01:00' : '13:00'),
  },
  {
    re: re(`\\s${AT}\\s+(полдень|полночь)(?=\\s)`),
    resolve: (m) => exact(group(m, 1).toLowerCase() === 'полдень' ? '12:00' : '00:00'),
  },
  {
    re: re('\\sчерез\\s+(?:(\\d+)\\s+)?(минуту|минуты|минут|час|часа|часов)(?=\\s)'),
    resolve: (m, ctx) => {
      const n = m[1] === undefined ? 1 : Number(m[1]);
      return later(ctx.now, group(m, 2).toLowerCase().startsWith('мин') ? n : n * 60);
    },
  },
  { re: re('\\sчерез\\s+полчаса(?=\\s)'), resolve: (_m, ctx) => later(ctx.now, 30) },
  { re: re('\\sчерез\\s+полтора\\s+часа(?=\\s)'), resolve: (_m, ctx) => later(ctx.now, 90) },
];

const PART_WORDS: Record<string, PartWord> = {
  утром: { part: 'утра', time: MORNING },
  днем: { part: 'дня', time: AFTERNOON },
  вечером: { part: 'вечера', time: EVENING },
};

const PART_MATCHERS: PartMatcher[] = [
  {
    // «с днём рождения» — не время
    re: re('\\s(с\\s+)?(утром|днем|вечером)(\\s+рождения)?(?=\\s)'),
    resolve: (m) =>
      m[1] !== undefined || m[3] !== undefined ? null : (PART_WORDS[group(m, 2).toLowerCase()] ?? null),
  },
];

/** Первое совпадение, которое приняли: по порядку регулярок, а у одной регулярки — по позиции в тексте. */
function first<M extends { re: RegExp }, T>(
  matchers: readonly M[],
  text: string,
  resolve: (matcher: M, m: RegExpExecArray) => T | null,
): { m: RegExpExecArray; found: T } | null {
  for (const matcher of matchers) {
    matcher.re.lastIndex = 0;
    for (let m = matcher.re.exec(text); m !== null; m = matcher.re.exec(text)) {
      const found = resolve(matcher, m);
      if (found !== null) return { m, found };
    }
  }
  return null;
}

// Повисшие знаки после вырезанных фраз: «Завтра, в 9 утра, позвонить маме.» → «позвонить маме».
// «?» и «!» в конце названия остаются — если не прилегали к вырезанной фразе
function tidy(text: string): string {
  return text
    .split(/\s+/)
    .filter((word) => word !== '' && !/^[,.;:!?—–-]+$/.test(word))
    .join(' ')
    .replace(/^[,.;:!?—–-]+/, '')
    .replace(/[,.;:—–-]+$/, '')
    .trim();
}

/**
 * Находит в тексте «когда» и вырезает из названия: одну фразу даты или повтора и одну — времени.
 * Берётся первая принятая фраза — по порядку матчеров, а не по позиции в тексте.
 * now — текущее время 'HH:MM': для «через 30 минут».
 */
export function parseWhen(text: string, today: string, now: string): ParsedWhen {
  const padded = ` ${text} `;
  const n = normalize(padded);
  let scan = n.text;
  let masked = padded; // исходный текст, вырезанное — пробелами: позиции не сдвигаются

  const endOf = (m: RegExpExecArray) => at(n.end, m.index + m[0].length);
  const cut = (m: RegExpExecArray) => {
    const from = at(n.start, m.index);
    let to = endOf(m);
    // Знаки сразу после фразы уходят с ней
    while (/[,.;:!?]/.test(masked.charAt(to))) to++;
    masked = masked.slice(0, from) + ' '.repeat(to - from) + masked.slice(to);
    scan = scan.slice(0, m.index) + ' '.repeat(m[0].length) + scan.slice(m.index + m[0].length);
  };

  const day = first(MATCHERS, scan, (matcher, m) => matcher.resolve(m, today));
  if (day !== null) cut(day.m);

  const partWord = first(PART_MATCHERS, scan, (matcher, m) => matcher.resolve(m));
  const ctx: TimeContext = {
    now,
    // «утром в 7 позвонить» — уточнение есть, значит «в 7» — время, хоть и не в конце
    bareOk: (m) => partWord !== null || /^\s*(?:[,.;:!?]|$)/.test(masked.slice(endOf(m))),
  };
  const clockHit = first(TIME_MATCHERS, scan, (matcher, m) => matcher.resolve(m, ctx));
  if (clockHit !== null) cut(clockHit.m);
  if (partWord !== null) cut(partWord.m);

  if (day === null && clockHit === null && partWord === null) {
    return { title: text, date: null, repeat: null, time: null, hit: false };
  }

  let time = clockHit?.found.time ?? partWord?.found.time ?? null;
  const found = clockHit?.found;
  // «вечером в 7» = 19:00, «утром в 7» = 7:00
  if (found?.kind === 'clock' && !found.explicit && partWord !== null) {
    const hour = hour24(found.hour, partWord.found.part, found.zero);
    if (hour !== null) time = clockText(hour, found.minute);
  }
  const shift = found?.kind === 'exact' ? found.days : null;
  return {
    title: tidy(masked),
    date: day?.found.date ?? (shift === null ? null : addDays(today, shift)),
    repeat: day?.found.repeat ?? null,
    time,
    hit: true,
  };
}

/** Фраза для поля правки, которая разбирается обратно в то же время: '15:00' → 'в 15:00', '03:00' → 'в 03:00'. */
export function timePhrase(time: string): string {
  const hour = Number(time.slice(0, 2));
  // Без нуля «в 3:00» разобралось бы как 15:00
  return `в ${hour >= 1 && hour <= 7 ? time : formatTime(time)}`;
}
