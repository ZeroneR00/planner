import type { When } from '@/lib/composer';
import { copy } from '@/lib/copy';
import { WEEK_ORDER, at, capitalize, dateParts, diffDays, formatDayMonth, weekdayOf } from '@/lib/dates';
import { repeatLabel } from '@/lib/rules';
import type { RepeatPattern } from '@/lib/types';

// Что приложение отвечает голосом на надиктованное. Читает синтезатор — поэтому полные слова:
// «вт» он прочтёт по буквам, а «9:00» — как «девять ноль-ноль»

/** '09:00' → '9', '09:30' → '9:30'. */
function spokenTime(time: string): string {
  const hour = String(Number(time.slice(0, 2)));
  const minute = time.slice(3, 5);
  return minute === '00' ? hour : `${hour}:${minute}`;
}

/** Повтор для озвучки, полными словами: «Каждый вторник», «По средам и четвергам», «Каждый день». */
export function spokenRepeat(p: RepeatPattern): string {
  if (p.kind !== 'weekly') return capitalize(repeatLabel(p));
  // Неделя с понедельника: «по субботам и воскресеньям», как в подписи повтора
  const names = WEEK_ORDER.filter((d) => p.weekdays.includes(d)).map((d) => at(copy.reply.weeklyDays, d));
  const last = names.pop();
  if (last === undefined) throw new Error('Еженедельный повтор без дней');
  if (names.length === 0) return capitalize(at(copy.reply.weekly, at(p.weekdays, 0)));
  return capitalize(copy.reply.weeklyMany(names.join(', '), last));
}

/** Куда легла задача: «В стикеры», «На сегодня», «Сегодня в 15:30», «Завтра в 9», «Во вторник», «20 ноября». */
export function spokenWhen(when: When, today: string): string {
  if (when.date === null) return copy.reply.pocket;
  const time = when.time === null ? null : spokenTime(when.time);
  const withTime = (day: string) => (time === null ? day : `${day} ${copy.reply.at(time)}`);
  if (when.repeat !== null) return withTime(spokenRepeat(when.repeat));
  const days = diffDays(today, when.date);
  if (days === 0) return time === null ? copy.reply.today : copy.reply.todayAt(time);
  if (days === 1) return withTime(copy.reply.tomorrow);
  if (days === 2) return withTime(copy.reply.dayAfter);
  if (days >= 3 && days <= 6) return withTime(at(copy.reply.weekday, weekdayOf(when.date)));
  const { month, day } = dateParts(when.date);
  return withTime(formatDayMonth(month, day));
}

/** «Принял. Завтра в 9.» pick — номер ответа по счёту: начала идут по кругу и подряд не повторяются. */
export function addedReply(when: When, today: string, pick: number, remindersOff: boolean): string {
  const openers = copy.reply.openers;
  const opener = at(openers, pick % openers.length);
  const tail = remindersOff && when.time !== null ? ` ${copy.reply.remindersOff}.` : '';
  return `${opener}. ${spokenWhen(when, today)}.${tail}`;
}
