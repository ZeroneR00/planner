import { capitalize } from '@/lib/dates';

// Ключевые слова парсера — не тексты интерфейса, поэтому живут здесь, а не в copy.ts.
// Срезаем только начало фразы и только целыми словами: «надомник» и «напомнить Пете» не трогаем.
// Обращения к самому приложению — тоже вступления: «мне нужно, чтобы ты записал…», «можешь напомнить мне…».

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
const PRONOUNS = ['мне', 'нам', 'себе'];

// Связки после вступления: «напомни мне, что…». «Что бы» раздельно — так часто пишет распознавание
const LINK = ['о том что', 'о том чтобы', 'о том что бы', 'мне', 'нам', 'себе', 'что', 'чтобы', 'чтоб', 'что бы'];
const THAT = ['что', 'чтобы', 'чтоб'];
// «…чтобы я купил хлеб»: после них прошедшее время становится действием — «купить хлеб»
const SUBJECTS = ['я', 'мы'];

// Обращение к приложению: «можешь записать», «чтобы ты напомнил». Глаголы записи — по основе
const ASK_STEMS = ['записа', 'напомни', 'запомни', 'добави', 'отмети', 'сохрани', 'зафиксирова'];
const ASK_INF = [...ASK_STEMS.map((stem) => `${stem}ть`), 'внести'];
const ASK_PAST = [
  ...ASK_STEMS.flatMap((stem) => ['л', 'ла', 'ли'].map((end) => `${stem}${end}`)),
  'внес', 'внесла', 'внесли',
];
const CAN = [
  'можешь', 'можете', 'ты можешь', 'вы можете', 'можешь ли ты', 'можете ли вы',
  'мог бы ты', 'могла бы ты', 'могли бы вы', 'не мог бы ты', 'не могла бы ты', 'не могли бы вы',
  'ты не мог бы', 'ты не могла бы', 'вы не могли бы',
];
// «Хочу» само не вступление («хочу пиццу»): только «хочу, чтобы ты записал…»
const WANT = ['я хочу', 'хочу', 'я хотел бы', 'я хотела бы', 'хотел бы', 'хотела бы', 'хотелось бы'];
const THAT_WORDS = ['чтобы', 'чтоб', 'что бы'];

const FILLER = [
  'слушай', 'слушайте', 'короче', 'кстати', 'ну', 'ну ка', 'окей', 'ок', 'ладно', 'эй', 'итак', 'блин',
  'пожалуйста', 'плиз', 'пж', 'будь добр', 'будь добра', 'будьте добры', 'будь другом', 'если можно', 'если не сложно',
];
// «так держать», «вот это да» — не вступления: режем, только если дальше настоящее вступление
const SOFT_FILLER = ['так', 'вот', 'а', 'и', 'да', 'значит', 'смотри'];

// Прошедшее время, которое не превращается в «-ть» по окончанию: есть, сесть, попасть, класть
const IRREGULAR_PAST = new Set([
  'ел', 'поел', 'съел', 'доел', 'наел', 'объел',
  'сел', 'присел', 'пересел', 'подсел', 'усел', 'засел',
  'попал', 'упал', 'пропал', 'напал', 'клал', 'крал',
]);

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
const CAN_PHRASES = phrases(CAN);
const WANT_PHRASES = phrases(WANT);
const THAT_PHRASES = phrases(THAT_WORDS);

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

/** После глагола записи видно, что дальше само дело: двоеточие, «мне / что», «о том» или действие. */
function notesNext(words: readonly Word[], at: number): boolean {
  const next = words[at + 1];
  const aboutThat = next?.key === 'о' && words[at + 2]?.key === 'том';
  return (
    words[at]?.colon === true ||
    (next !== undefined && PRONOUN_OR_THAT.includes(next.key)) ||
    aboutThat ||
    isInfinitive(next)
  );
}

/** «Запиши», «напомнить», «задача» — вступление, только если это видно по следующему слову. */
function matchSoft(words: readonly Word[], at: number): number {
  const word = words[at];
  if (word === undefined) return 0;
  const next = words[at + 1];
  if (WRITE_DOWN.includes(word.key)) return notesNext(words, at) ? 1 : 0;
  if (word.key === 'напомнить') return next !== undefined && PRONOUN_OR_THAT.includes(next.key) ? 1 : 0;
  if (LABEL.includes(word.key)) return word.colon || isInfinitive(next) ? 1 : 0;
  return 0;
}

function skipFillers(words: readonly Word[], at: number): number {
  let i = at;
  let length = matchPhrase(words, i, FILLER_PHRASES);
  while (length > 0) {
    i += length;
    length = matchPhrase(words, i, FILLER_PHRASES);
  }
  return i;
}

/**
 * «(пожалуйста) (мне) записать» с позиции at: конец или 0. Глагол записи — вступление, если перед ним
 * «мне» или дальше видно дело: «можешь записать ребёнка к врачу» не трогаем, как «запиши ребёнка».
 */
function matchVerbPart(words: readonly Word[], at: number, verbs: readonly string[]): number {
  let i = skipFillers(words, at);
  const pronounBefore = PRONOUNS.includes(words[i]?.key ?? '');
  if (pronounBefore) i = skipFillers(words, i + 1);
  const verb = words[i];
  if (verb === undefined || !verbs.includes(verb.key)) return 0;
  return pronounBefore || notesNext(words, i) ? i + 1 : 0;
}

/** «Можешь напомнить мне», «не могла бы ты записать…». */
function matchAsk(words: readonly Word[], at: number): number {
  const length = matchPhrase(words, at, CAN_PHRASES);
  if (length === 0) return 0;
  const end = matchVerbPart(words, at + length, ASK_INF);
  return end === 0 ? 0 : end - at;
}

/** «Ты записал мне», «вы мне напомнили» — сразу после «чтобы». */
function matchAddress(words: readonly Word[], at: number): number {
  const word = words[at];
  if (word === undefined || (word.key !== 'ты' && word.key !== 'вы')) return 0;
  const end = matchVerbPart(words, at + 1, ASK_PAST);
  return end === 0 ? 0 : end - at;
}

/** «Я хочу, чтобы» — только если дальше обращение «ты записал…»; длина до «чтобы» включительно. */
function matchWant(words: readonly Word[], at: number): number {
  const want = matchPhrase(words, at, WANT_PHRASES);
  if (want === 0) return 0;
  const that = matchPhrase(words, at + want, THAT_PHRASES);
  if (that === 0 || matchAddress(words, at + want + that) === 0) return 0;
  return want + that;
}

function matchIntro(words: readonly Word[], at: number): number {
  return matchPhrase(words, at, STRONG_PHRASES) || matchSoft(words, at) || matchAsk(words, at) || matchWant(words, at);
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

/** Перед позицией end срезано «что / чтобы / чтоб» или «что бы»: дальше может быть «я» или «ты записал». */
function endsWithThat(words: readonly Word[], end: number): boolean {
  const last = words[end - 1]?.key ?? '';
  return THAT.includes(last) || (last === 'бы' && words[end - 2]?.key === 'что');
}

/**
 * «Купил» → «купить», «позвонила» → «позвонить», «записался» → «записаться» — по окончанию, без словаря.
 * С «ё» (пошёл, принёс) и из IRREGULAR_PAST — как сказано. «О» перед «л» не берём: «стол», «пол» — не глаголы.
 */
function toInfinitive(raw: string): string {
  const [, core = raw, punct = ''] = /^(.*?)([,.;:!?—–-]*)$/.exec(raw) ?? [];
  const lower = core.toLowerCase();
  if (lower.includes('ё') || IRREGULAR_PAST.has(lower.replace(/(?:ся|ась|ись|а|и)$/, ''))) return raw;
  if (/[аеиуыяю]л(?:ся|ась|ись)$/.test(lower)) return `${core.replace(/л(?:ся|ась|ись)$/i, 'ться')}${punct}`;
  if (/[аеиуыяю]л[аи]?$/.test(lower)) return `${core.replace(/л[аи]?$/i, 'ть')}${punct}`;
  return raw;
}

/** Срезает вежливые вступления в начале названия. Нечего оставить — возвращает как было. */
export function stripIntro(title: string): string {
  const words = wordsOf(title);
  let at = 0;
  let introFound = false; // связки «мне», «что» режем только после вступления
  let subjectCut = false; // последним срезали «я / мы» после «чтобы»: дальше прошедшее время

  for (;;) {
    const word = words[at];
    if (word === undefined) break;
    const afterThat = endsWithThat(words, at);
    let subject = false;
    let length = matchIntro(words, at);
    if (length > 0) {
      introFound = true;
    } else if (introFound) {
      length = afterThat ? matchAddress(words, at) : 0;
      if (length === 0) length = matchPhrase(words, at, LINK_PHRASES);
      if (length === 0 && afterThat && SUBJECTS.includes(word.key)) {
        length = 1;
        subject = true;
      }
    }
    if (length === 0) length = matchPhrase(words, at, FILLER_PHRASES);
    if (length === 0 && SOFT_FILLER.includes(word.key) && introAfterFillers(words, at + 1)) length = 1;
    if (length === 0) break;
    at += length;
    subjectCut = subject;
  }

  if (at === 0 || at >= words.length) return title;
  const raws = words.slice(at).map((word) => word.raw);
  if (subjectCut) {
    // «чтобы я не опоздал» → «не опоздать»
    const verbAt = words[at]?.key === 'не' ? 1 : 0;
    const verb = raws[verbAt];
    if (verb !== undefined) raws[verbAt] = toInfinitive(verb);
  }
  const rest = raws.join(' ').replace(/^[\s,.;:!?—–-]+/, '');
  if (rest === '') return title;
  const head = title.trim().charAt(0);
  return head !== head.toLowerCase() ? capitalize(rest) : rest;
}
