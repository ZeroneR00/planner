import { capitalize } from '@/lib/dates';

// Ключевые слова парсера — не тексты интерфейса, поэтому живут здесь, а не в copy.ts.
// Срезаем только начало фразы и только целыми словами: «надомник» и «напомнить Пете» не трогаем.

type Word = { raw: string; key: string; colon: boolean };

const PUNCT_TOKEN = /^[,.;:!?—–-]+$/;
const TRAILING_PUNCT = /[,.;:!?—–-]+$/;

// Всегда вступление
const STRONG = [
  'напомни', 'напомните',
  'не забудь мне напомнить', 'не забудь напомнить', 'не забудь', 'не забудьте',
  'не забыть бы', 'не забыть', 'чтобы не забыть', 'чтоб не забыть', 'главное не забыть', 'только не забыть',
  'хочу не забыть', 'я хочу не забыть', 'хотел бы не забыть', 'хотела бы не забыть',
  'надо бы', 'нужно бы', 'надо будет', 'нужно будет', 'надо', 'нужно', 'необходимо',
  'мне надо', 'мне нужно', 'нам надо', 'нам нужно', 'мне бы',
  'новое напоминание', 'новая задача', 'напоминание', 'напоминалка',
  'запланируй',
  ...['поставь', 'создай', 'сделай', 'добавь', 'установи'].flatMap((verb) =>
    ['напоминание', 'напоминалку', 'задачу', 'будильник'].map((noun) => `${verb} ${noun}`),
  ),
];

// «запиши купить молоко» — вступление, «запиши ребёнка к врачу» — нет: решает следующее слово
const WRITE_DOWN = ['запиши', 'запишите', 'добавь', 'добавьте', 'запомни', 'отметь', 'пометь', 'внеси', 'закинь', 'зафиксируй'];
const LABEL = ['задача', 'заметка'];
const PRONOUN_OR_THAT = ['мне', 'нам', 'себе', 'что', 'чтобы', 'чтоб'];

// Связки после вступления: «напомни мне, что…»
const LINK = ['о том что', 'о том чтобы', 'мне', 'нам', 'себе', 'что', 'чтобы', 'чтоб'];
const THAT = ['что', 'чтобы', 'чтоб'];

const FILLER = [
  'слушай', 'слушайте', 'короче', 'кстати', 'ну', 'ну ка', 'окей', 'ок', 'ладно', 'эй', 'итак', 'блин',
  'пожалуйста', 'плиз', 'пж', 'будь добр', 'будь добра', 'будьте добры', 'будь другом', 'если можно', 'если не сложно',
];
// «так держать», «вот это да» — не вступления: режем, только если дальше настоящее вступление
const SOFT_FILLER = ['так', 'вот', 'а', 'и', 'да', 'значит', 'смотри'];

/** Хвост в конце фразы, источник регулярки для нормализованного текста (ё → е, знаки — пробелы). */
// «Спасибо» не берём: «сказать Пете спасибо»
export const TAIL =
  '(?:\\s+(?:пожалуйста|плиз|пж|ок|окей|а\\s+то\\s+забуду|чтобы\\s+не\\s+забыть|чтоб\\s+не\\s+забыть|не\\s+забудь|если\\s+не\\s+сложно))+\\s*$';

// Длинные фразы раньше коротких: «не забудь мне напомнить» прежде «не забудь»
function phrases(list: readonly string[]): string[][] {
  return list.map((phrase) => phrase.split(' ')).sort((a, b) => b.length - a.length);
}

const STRONG_PHRASES = phrases(STRONG);
const LINK_PHRASES = phrases(LINK);
const FILLER_PHRASES = phrases(FILLER);

// «-ка» не меняет смысла: «ну-ка», «запиши-ка», «напомни-ка» — те же слова
function keyOf(token: string): string {
  return token.toLowerCase().replace(/ё/g, 'е').replace(TRAILING_PUNCT, '').replace(/-ка$/, '');
}

function wordsOf(title: string): Word[] {
  const words: Word[] = [];
  for (const token of title.trim().split(/\s+/)) {
    if (token === '') continue;
    const last = words[words.length - 1];
    if (PUNCT_TOKEN.test(token)) {
      // Знак отдельным словом прилипает к предыдущему; в начале — просто пропадает
      if (last !== undefined) {
        last.raw = `${last.raw} ${token}`;
        last.colon ||= token.includes(':');
      }
      continue;
    }
    words.push({ raw: token, key: keyOf(token), colon: (TRAILING_PUNCT.exec(token)?.[0] ?? '').includes(':') });
  }
  return words;
}

function isInfinitive(word: Word | undefined): boolean {
  return word !== undefined && /(?:ть|ться|ти|тись|чь|чься)$/.test(word.key);
}

/** Длина фразы из списка, которая стоит с позиции at, или 0. */
function matchPhrase(words: readonly Word[], at: number, list: readonly string[][]): number {
  const found = list.find((phrase) => phrase.every((part, i) => words[at + i]?.key === part));
  return found?.length ?? 0;
}

/** «Запиши», «напомнить», «задача» — вступление, только если это видно по следующему слову. */
function matchSoft(words: readonly Word[], at: number): number {
  const word = words[at];
  if (word === undefined) return 0;
  const next = words[at + 1];
  const nextIsPronoun = next !== undefined && PRONOUN_OR_THAT.includes(next.key);
  if (WRITE_DOWN.includes(word.key)) {
    const aboutThat = next?.key === 'о' && words[at + 2]?.key === 'том';
    return word.colon || nextIsPronoun || aboutThat || isInfinitive(next) ? 1 : 0;
  }
  if (word.key === 'напомнить') return nextIsPronoun ? 1 : 0;
  if (LABEL.includes(word.key)) return word.colon || isInfinitive(next) ? 1 : 0;
  return 0;
}

function matchIntro(words: readonly Word[], at: number): number {
  return matchPhrase(words, at, STRONG_PHRASES) || matchSoft(words, at);
}

/** Мягкое слово-паразит режем, если за ним (и за другими паразитами) идёт вступление. */
function introAfterFillers(words: readonly Word[], at: number): boolean {
  let i = at;
  while (i < words.length) {
    if (matchIntro(words, i) > 0) return true;
    const filler = matchPhrase(words, i, FILLER_PHRASES);
    const word = words[i];
    if (filler > 0) i += filler;
    else if (word !== undefined && SOFT_FILLER.includes(word.key)) i += 1;
    else return false;
  }
  return false;
}

/** Срезает вежливые вступления в начале названия. Нечего оставить — возвращает как было. */
export function stripIntro(title: string): string {
  const words = wordsOf(title);
  let at = 0;
  let introFound = false; // связки «мне», «что» режем только после вступления
  let previous = '';

  for (;;) {
    const word = words[at];
    if (word === undefined) break;
    let length = matchIntro(words, at);
    if (length > 0) {
      introFound = true;
    } else if (introFound) {
      length = matchPhrase(words, at, LINK_PHRASES);
      if (length === 0 && word.key === 'я' && THAT.includes(previous)) length = 1;
    }
    if (length === 0) length = matchPhrase(words, at, FILLER_PHRASES);
    if (length === 0 && SOFT_FILLER.includes(word.key) && introAfterFillers(words, at + 1)) length = 1;
    if (length === 0) break;
    at += length;
    previous = words[at - 1]?.key ?? '';
  }

  if (at === 0 || at >= words.length) return title;
  const rest = words
    .slice(at)
    .map((word) => word.raw)
    .join(' ')
    .replace(/^[\s,.;:!?—–-]+/, '');
  if (rest === '') return title;
  const head = title.trim().charAt(0);
  return head !== head.toLowerCase() ? capitalize(rest) : rest;
}
