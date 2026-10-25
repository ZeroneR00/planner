// Текст для регулярок parse-when: знаки → пробелы, ё → е, числа словами → цифры.
// Название задачи режется из исходного текста, поэтому храним карту позиций обратно в него.

/** Текст для разбора и карта позиций обратно в исходный текст. */
export type Normalized = {
  text: string; // для регулярок
  start: number[]; // start[i] — позиция в исходном тексте, где начинается символ i
  end: number[]; // end[j] — позиция в исходном, где кончается префикс длины j (длина text.length + 1)
};

// Десятки складываются со следующей единицей: «двадцать пять», «двадцать седьмого», «без двадцати пяти»
const TENS = new Map([
  ['двадцать', 20],
  ['тридцать', 30],
  ['сорок', 40],
  ['пятьдесят', 50],
  ['двадцати', 20],
]);

// Порядковые: основа + «ого» / «ое» — «седьмого», «первое»
const ORDINAL_STEMS: readonly (readonly [string, number])[] = [
  ['перв', 1], ['втор', 2], ['четверт', 4], ['пят', 5], ['шест', 6], ['седьм', 7], ['восьм', 8],
  ['девят', 9], ['десят', 10], ['одиннадцат', 11], ['двенадцат', 12], ['тринадцат', 13],
  ['четырнадцат', 14], ['пятнадцат', 15], ['шестнадцат', 16], ['семнадцат', 17],
  ['восемнадцат', 18], ['девятнадцат', 19], ['двадцат', 20], ['тридцат', 30],
];

const ORDINALS = new Map<string, number>([
  ['третьего', 3],
  ['третье', 3],
  ...ORDINAL_STEMS.flatMap(([stem, n]): [string, number][] => [
    [`${stem}ого`, n],
    [`${stem}ое`, n],
  ]),
]);

const UNITS = new Map([
  ['один', 1], ['одна', 1], ['одно', 1], ['два', 2], ['две', 2], ['три', 3], ['четыре', 4],
  ['пять', 5], ['шесть', 6], ['семь', 7], ['восемь', 8], ['девять', 9],
  ['пяти', 5], // «без пяти девять»
  ...[...ORDINALS].filter(([, n]) => n < 10),
]);

const NUMBERS = new Map([
  ...UNITS,
  ...TENS,
  ...ORDINALS,
  ['десять', 10], ['одиннадцать', 11], ['двенадцать', 12], ['тринадцать', 13], ['четырнадцать', 14],
  ['пятнадцать', 15], ['шестнадцать', 16], ['семнадцать', 17], ['восемнадцать', 18],
  ['девятнадцать', 19], ['десяти', 10], ['пятнадцати', 15],
]);

const PUNCT = /[,;!?]/;
const DIGIT = /\d/;

// Посимвольно, длина не меняется. «15:00» и «27.08.2027» остаются: точка и двоеточие между цифрами — часть числа
function flatten(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text.charAt(i);
    if (PUNCT.test(c)) out += ' ';
    else if (c === '.' || c === ':') {
      out += DIGIT.test(text.charAt(i - 1)) && DIGIT.test(text.charAt(i + 1)) ? c : ' ';
    } else if (c === 'ё') out += 'е';
    else if (c === 'Ё') out += 'Е';
    else out += c;
  }
  return out;
}

type Token = { word: string; from: number; to: number };

export function normalize(text: string): Normalized {
  const flat = flatten(text);
  const tokens: Token[] = [...flat.matchAll(/\S+/g)].map((m) => ({
    word: m[0].toLowerCase(),
    from: m.index ?? 0,
    to: (m.index ?? 0) + m[0].length,
  }));

  let out = '';
  const start: number[] = [];
  const end: number[] = [0];
  let pos = 0;
  const keep = (to: number) => {
    for (; pos < to; pos++) {
      out += flat.charAt(pos);
      start.push(pos);
      end.push(pos + 1);
    }
  };
  // Замена куска целиком: любая позиция внутри него ведёт на весь кусок исходного текста
  const replace = (from: number, to: number, value: string) => {
    keep(from);
    for (const c of value) {
      out += c;
      start.push(from);
      end.push(to);
    }
    pos = to;
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i] as Token;
    const next = tokens[i + 1];
    const tens = TENS.get(token.word);
    const unit = next === undefined ? undefined : UNITS.get(next.word);
    const value = NUMBERS.get(token.word);
    const half = token.word.startsWith('пол') ? ORDINALS.get(token.word.slice(3)) : undefined;
    if (tens !== undefined && unit !== undefined && next !== undefined) {
      replace(token.from, next.to, String(tens + unit));
      i++;
    } else if (value !== undefined) {
      replace(token.from, token.to, String(value));
    } else if (half !== undefined) {
      // «полвосьмого» = «половине 8»: отдельное «пол» не трогаем — «помыть пол 2 раза» не время
      replace(token.from, token.to, `половине ${half}`);
    }
  }
  keep(flat.length);
  return { text: out, start, end };
}
