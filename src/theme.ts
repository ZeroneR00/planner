import type { TextStyle } from 'react-native';

import type { ThemeName } from '@/lib/theme-choice';

// Цвета, скругления и детали — по теме: компоненты берут их через useTheme() / themedStyles из '@/hooks/use-theme'.
// Размеры в прототипе в px — в React Native это те же числа в dp.

export type Palette = {
  bg: string;
  surface: string; // меню, календарь, чипы, строка в правке
  row: string; // карточка стикеров, строки настроек
  footer: string; // нижняя панель, затухание бегунка
  line: string;
  lineStrong: string;

  text: string;
  textSecondary: string;
  textDone: string;
  textHint: string;

  accent: string;
  onAccent: string;
  warning: string;
  danger: string;
  listeningRing: string; // пульсирующий ореол микрофона: danger 35 %

  control: string; // серая стрелка, рамка в календаре
  disabled: string; // прошедшие часы и дни
  surfaceSelected: string;
  toast: string; // плашка «Вернуть»: полупрозрачная, без размытия
  photoBackdrop: string; // фон камеры и фото на весь экран
  cameraButton: string; // кнопки поверх видоискателя: фон 60 %, чтобы читались на любом кадре
  shutter: string; // кнопка спуска
  shadow: string; // тень кнопки микрофона «в воздухе» и карточки «Сейчас» в светлых темах

  field: string; // поле записи
  fieldBorder: string;
  panelBorder: string; // рамка меню и календаря
  switchTrack: string; // выключенный переключатель
  thumb: string; // бегунок переключателя
  micRing: string; // тонкое кольцо вокруг 🎙
  navBar: string; // полоса под кнопками навигации Android, когда их цвет не совпал с темой

  now: string; // карточка «Сейчас»
  nowText: string;
  nowSecondary: string; // «сделано 1», время, ↻
  nowEyebrow: string; // «• СЕЙЧАС»
  nowDone: string; // кнопка «Сделано»
  nowOnDone: string;
  nowLater: string; // рамка «Позже»
  nowLaterText: string;
  nowRing: string; // рамка правки и подсветка в «Сейчас»

  headerButton: string; // фон ⚙ и «Впереди»
  headerBorder: string; // их рамка
  ahead: string; // фон «Впереди»
  aheadText: string; // текст и значок «Впереди»
  aheadCount: string; // число «Впереди»; при details.countBadge — фон кружка с числом
  onAheadCount: string; // число в этом кружке
  cardBorder: string; // рамка «Сейчас» и карточки стикеров — только при details.framed
  checkBorder: string; // рамка галочки
  checkFill: string; // фон пустой галочки
  mark: string; // значок 🎙 и ✓ в галочке на акценте
};

const night: Palette = {
  bg: '#111316',
  surface: '#1C1F24',
  row: '#181B1F',
  footer: '#16191D',
  line: '#23272D',
  lineStrong: '#2C3037',

  text: '#ECEDEF',
  textSecondary: '#9BA0A8',
  textDone: '#80868F',
  textHint: '#8A909A',

  accent: '#C6F36B',
  onAccent: '#111316',
  warning: '#FDBA74',
  danger: '#F87171',
  listeningRing: '#F8717159',

  control: '#5F656E',
  disabled: '#4A4F57',
  surfaceSelected: '#262A31',
  toast: '#262A31E0',
  photoBackdrop: '#000000',
  cameraButton: '#11131699',
  shutter: '#FFFFFF',
  shadow: '#000000',

  field: '#1C1F24',
  fieldBorder: '#2C3037',
  panelBorder: '#00000000',
  switchTrack: '#2C3037',
  thumb: '#ECEDEF',
  micRing: '#C6F36B38',
  navBar: '#9BA0A8', // кнопки тёмные — светлая полоса

  now: '#1C1F24',
  nowText: '#ECEDEF',
  nowSecondary: '#9BA0A8',
  nowEyebrow: '#C6F36B',
  nowDone: '#C6F36B',
  nowOnDone: '#111316',
  nowLater: '#3A3F47',
  nowLaterText: '#ECEDEF',
  nowRing: '#C6F36B',

  headerButton: '#16191D',
  headerBorder: '#2C3037',
  ahead: '#16191D',
  aheadText: '#ECEDEF',
  aheadCount: '#C6F36B',
  onAheadCount: '#111316',
  cardBorder: '#23272D',
  checkBorder: '#5F656E',
  checkFill: '#00000000',
  mark: '#111316',
};

// Камера и фото всегда на чёрном
const photo = {
  photoBackdrop: night.photoBackdrop,
  cameraButton: night.cameraButton,
  shutter: night.shutter,
} as const;

const day: Palette = {
  bg: '#F3F4F6',
  surface: '#FFFFFF',
  row: '#FFFFFF',
  footer: '#FFFFFF',
  line: '#ECEEF1',
  lineStrong: '#E2E5E9',

  text: '#14161A',
  textSecondary: '#5C636D',
  textDone: '#6B717B',
  textHint: '#636A74',

  accent: '#3355FF',
  onAccent: '#FFFFFF',
  warning: '#B45309',
  danger: '#DC2626',
  listeningRing: '#DC262659',

  control: '#A3A9B2',
  disabled: '#B8BDC5',
  surfaceSelected: '#EEF1FF',
  toast: '#FFFFFFF2',
  ...photo,
  shadow: '#14161A',

  field: '#F0F1F4',
  fieldBorder: '#F0F1F4',
  panelBorder: '#E2E5E9',
  switchTrack: '#C9CED6',
  thumb: '#FFFFFF',
  micRing: '#3355FF2E',
  navBar: '#5C636D', // кнопки белые — тёмная полоса

  now: '#3355FF',
  nowText: '#FFFFFF',
  nowSecondary: '#FFFFFFD9',
  nowEyebrow: '#FFFFFF',
  nowDone: '#FFFFFF',
  nowOnDone: '#3355FF',
  nowLater: '#FFFFFF99',
  nowLaterText: '#FFFFFF',
  nowRing: '#FFFFFF',

  headerButton: '#FFFFFF',
  headerBorder: '#E2E5E9',
  ahead: '#FFFFFF',
  aheadText: '#14161A',
  aheadCount: '#3355FF',
  onAheadCount: '#FFFFFF',
  cardBorder: '#ECEEF1',
  checkBorder: '#A3A9B2',
  checkFill: '#00000000',
  mark: '#FFFFFF',
};

const voice: Palette = {
  bg: '#070A10',
  surface: '#0B1018',
  row: '#0B1018',
  footer: '#070A10',
  line: '#161D28',
  lineStrong: '#1F2836',

  text: '#E6EEF6',
  textSecondary: '#8C9AAD',
  textDone: '#7D8A9C',
  textHint: '#7D8A9C',

  accent: '#5EE6FF',
  onAccent: '#070A10',
  warning: '#FDBA74',
  danger: '#F87171',
  listeningRing: '#F8717159',

  control: '#4A5668',
  disabled: '#2E3846',
  surfaceSelected: '#121A26',
  toast: '#121924E0',
  ...photo,
  shadow: '#000000',

  field: '#0B1018',
  fieldBorder: '#1F2836',
  panelBorder: '#1A2230',
  switchTrack: '#1F2836',
  thumb: '#E6EEF6',
  micRing: '#5EE6FF38',
  navBar: '#8C9AAD',

  now: '#0B1018',
  nowText: '#E6EEF6',
  nowSecondary: '#8C9AAD',
  nowEyebrow: '#5EE6FF',
  nowDone: '#5EE6FF',
  nowOnDone: '#070A10',
  nowLater: '#2A3445',
  nowLaterText: '#E6EEF6',
  nowRing: '#5EE6FF',

  headerButton: '#00000000',
  headerBorder: '#1F2836',
  ahead: '#00000000',
  aheadText: '#E6EEF6',
  aheadCount: '#5EE6FF',
  onAheadCount: '#070A10',
  cardBorder: '#1A2230',
  checkBorder: '#4A5668',
  checkFill: '#00000000',
  mark: '#070A10',
};

const stickers: Palette = {
  bg: '#EDEDE9',
  surface: '#FFFFFF',
  row: '#FFFFFF',
  footer: '#FFFFFF',
  line: '#E4E4DF',
  lineStrong: '#DCDCD6',

  text: '#1A1A18',
  textSecondary: '#5E5E59',
  textDone: '#6B6B66',
  textHint: '#63635E',

  // Кнопки чёрные с белым текстом; жёлтый — у «Сейчас», 🎙 и галочки (mark)
  accent: '#1A1A18',
  onAccent: '#FFFFFF',
  warning: '#8A2C0D',
  danger: '#DC2626',
  listeningRing: '#DC262659',

  control: '#8F8F89',
  disabled: '#B8B8B2',
  surfaceSelected: '#FFF1B8',
  toast: '#FFFFFFF2',
  ...photo,
  shadow: '#1A1A18',

  field: '#F2F2EF',
  fieldBorder: '#F2F2EF',
  panelBorder: '#DCDCD6',
  switchTrack: '#CFCFC9',
  thumb: '#FFFFFF',
  micRing: '#1A1A181F',
  navBar: '#5E5E59',

  now: '#FFD84D',
  nowText: '#1A1A18',
  nowSecondary: '#4A4636',
  nowEyebrow: '#1A1A18',
  nowDone: '#1A1A18',
  nowOnDone: '#FFFFFF',
  nowLater: '#1A1A18',
  nowLaterText: '#1A1A18',
  nowRing: '#1A1A18',

  headerButton: '#00000000',
  headerBorder: '#1A1A18',
  ahead: '#1A1A18',
  aheadText: '#FFFFFF',
  aheadCount: '#FFD84D',
  onAheadCount: '#1A1A18',
  cardBorder: '#DCDCD6',
  checkBorder: '#1A1A18',
  checkFill: '#FFFFFF',
  mark: '#FFD84D',
};

export const palettes: Record<ThemeName, Palette> = {
  night,
  day,
  voice,
  stickers,
};

// Имена семейств совпадают с ключами, под которыми шрифты загружаются в _layout.tsx.
// На Android fontWeight не выбирает файл у своего шрифта: каждое начертание — отдельное семейство,
// поэтому в стилях указываем fontFamily и не указываем fontWeight.
export const fonts = {
  regular: 'GolosText_400Regular',
  medium: 'GolosText_500Medium',
  semibold: 'GolosText_600SemiBold',
  bold: 'GolosText_700Bold',
  mono: 'JetBrainsMono_500Medium',
  display: 'Unbounded_600SemiBold', // заголовки в «Стикерах»
  displayBold: 'Unbounded_700Bold',
} as const;

// Ключ = значение: space[14] читается однозначно, а закрытый набор не даёт появиться случайным 13 или 15.
export const space = {
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  18: 18,
  20: 20,
  24: 24,
} as const;

export type Radii = {
  focus: number; // рамка правки вокруг текста
  small: number; // кнопка «Вернуть»
  chip: number; // кнопка «Сегодня», пункт меню повтора, день календаря, картинка темы
  row: number; // строки списков
  button: number; // кнопки «Сделано» / «Позже», плашка «Вернуть»
  field: number; // поле ввода и стрелка
  panel: number; // меню повтора, календарь, карточка стикеров
  card: number; // карточка «Сейчас», бумажки «Стикеров»
  thumb: number; // миниатюра фото в строке
  pill: number; // ⚙ и «Впереди», чипы бегунка, ⏰ / ↻
};

// Круглое в любой теме: 🎙 и её кольца, точка «Сейчас», кнопки камеры и фото
export const circle = 999;

const roundRadius: Radii = {
  focus: 8,
  small: 10,
  chip: 12,
  row: 14,
  button: 16,
  field: 16,
  panel: 18,
  card: 24,
  thumb: 8,
  pill: circle,
};

// Детали и раскладка «Сегодня» по теме: поведение и данные общие, различается только вид
export type Details = {
  laterStroke: number; // толщина рамки «Позже»
  headerStroke: number; // толщина рамки ⚙ и «Впереди»
  check: { size: number; radius: number; border: number }; // галочка в «Дальше сегодня»
  monoLabels: boolean; // Голос: дата «СР · 18 НОЯБРЯ», счётчики двумя цифрами «04»
  framed: boolean; // Голос: у «Сейчас» рамка cardBorder
  nowCorners: boolean; // Голос: уголки-скобки цвета акцента у «Сейчас»
  nowTime: 'below' | 'right' | 'eyebrow'; // время задачи в «Сейчас»: под текстом / справа вверху / «СЕЙЧАС · 14:00»
  when: 'text' | 'arrow'; // «Когда?» в строке стикера: текст / «→ когда?»
  glow: string | null; // Голос: свечение 🎙 и точки «Сейчас»
  waves: boolean; // Голос: от 🎙 расходятся три кольца вместо одного неподвижного
  sticker: { tilt: string; tape: string } | null; // Стикеры: «Сейчас» — стикер на скотче
  footer: 'field' | 'voice'; // Голос: внизу «Аа · 🎙 · 📷» вместо поля
  pocket: 'card' | 'lines' | 'notes'; // стикеры: одна карточка / строки через линию / бумажки вбок
  notes: readonly { color: string; tilt: string }[] | null; // цвета и наклоны бумажек — по очереди
  restMeta: 'below' | 'right'; // время и повтор в «Дальше сегодня»: под текстом / справа
  restCount: boolean; // «1/3» у заголовка «Дальше сегодня»
  countBadge: boolean; // числа «Впереди» и «Стикеры» — в кружках
  editHint: boolean; // «тапни текст, чтобы изменить» у заголовка стикеров
};

const plainDetails: Details = {
  laterStroke: 1,
  headerStroke: 1,
  check: { size: 22, radius: 11, border: 2 },
  monoLabels: false,
  framed: false,
  nowCorners: false,
  nowTime: 'below',
  when: 'text',
  glow: null,
  waves: false,
  sticker: null,
  footer: 'field',
  pocket: 'card',
  notes: null,
  restMeta: 'below',
  restCount: false,
  countBadge: false,
  editHint: true,
};

// Минимальная зона нажатия. Если элемент визуально меньше — добирать hitSlop.
export const touch = 44;

// Прозрачность нажатой кнопки (Pressable, pressed)
export const pressedOpacity = 0.6;

// Размеры элементов списков и кнопок
export const size = {
  button: 48, // кнопки на всю ширину
  nowButton: 52, // «Сделано» / «Позже» в «Сейчас»
  row: 52, // минимальная высота строки списка
  menuItem: 48, // пункт меню повтора
  field: 52, // поле записи и кнопка «Добавить»
  fadeRight: 28, // затухание правого края бегунка
  fadeLeft: 10, // затухание левого края бегунка
  fadeLeftScroll: 25, // за столько dp прокрутки левое затухание проявляется полностью
  chipLead: 48, // сколько оставить слева от чипа, когда бегунок сам к нему прокручивается
  undoRing: 28, // круг с таймером на плашке «Вернуть»
  undoProgress: 2, // полоска времени внизу плашки
  daySheet: 220, // минимальная ширина меню «Когда?»
  repeatPill: 160, // наибольшая ширина ↻ с надписью повтора
  restMeta: 120, // «Голос»: наибольшая ширина времени и повтора справа от текста — текст не сжимается в столбик
  checkNarrow: 40, // «Голос»: кнопка галочки, прижатой влево
  thumb: 40, // миниатюра фото в строке
  nowPhoto: 180, // высота фото в «Сейчас»
  shutter: 72, // кнопка спуска камеры
  voice: 56, // кнопка микрофона «в воздухе» над полем
  voiceListening: 72, // она же, пока слушает
  voiceBig: 76, // 🎙 по центру нижней панели «Голоса»
  voiceBigListening: 88, // она же, пока слушает
  voiceSide: 48, // «Аа» и 📷 по бокам от неё
  themeTile: 78, // ширина картинки темы в «Настройках»: четыре в ряд влезают в 358
  themePreview: 124, // её высота
  noteWidth: 164, // бумажка стикера в «Стикерах»
  noteHeight: 140,
  notePill: 36, // видимая высота «Когда?», ✓ и × на бумажке; зона нажатия — touch
  noteThumb: 32, // миниатюра фото на бумажке: меньше строки, чтобы текст влез
  countBadge: 24, // кружок с числом у «Стикеры»
  aheadBadge: 22, // кружок с числом во «Впереди»
} as const;

// Готовые стили текста. letterSpacing и lineHeight в RN — в dp, а не в em и не множителем,
// поэтому значения из прототипа пересчитаны (0.08em × 13 = 1.04, 1.35 × 16 ≈ 22).
// Цвет текста в RN не наследуется от родителя, а по умолчанию чёрный, — поэтому он задан в каждом стиле.
function makeText(c: Palette) {
  return {
    title: {
      fontFamily: fonts.bold,
      fontSize: 36,
      lineHeight: 40,
      letterSpacing: -0.5,
      color: c.text,
    },
    screenTitle: {
      fontFamily: fonts.bold,
      fontSize: 28,
      letterSpacing: -0.56,
      color: c.text,
    },
    nowTitle: {
      fontFamily: fonts.semibold,
      fontSize: 26,
      lineHeight: 31,
      letterSpacing: -0.26,
      color: c.nowText,
    },
    emptyTitle: {
      fontFamily: fonts.semibold,
      fontSize: 20,
      lineHeight: 26,
      color: c.text,
    },
    body: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 22,
      color: c.text,
    },
    task: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 22,
      color: c.text,
    }, // строка «Дальше сегодня»
    input: { fontFamily: fonts.regular, fontSize: 16, color: c.text },
    row: {
      fontFamily: fonts.regular,
      fontSize: 15,
      lineHeight: 20,
      color: c.text,
    },
    label: { fontFamily: fonts.medium, fontSize: 14, color: c.text },
    dayTitle: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: c.textSecondary,
    }, // день во «Впереди»
    chipOn: { fontFamily: fonts.semibold, fontSize: 14, color: c.onAccent },
    headerDate: {
      fontFamily: fonts.regular,
      fontSize: 15,
      color: c.textSecondary,
    },
    hint: { fontFamily: fonts.regular, fontSize: 14, color: c.textSecondary },
    button: { fontFamily: fonts.semibold, fontSize: 16, color: c.onAccent },
    buttonSecondary: { fontFamily: fonts.medium, fontSize: 16, color: c.text },
    action: { fontFamily: fonts.semibold, fontSize: 14, color: c.accent },
    note: { fontFamily: fonts.regular, fontSize: 13, color: c.textSecondary },
    editTitle: { fontFamily: fonts.semibold, fontSize: 13, color: c.accent },
    status: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: c.textSecondary,
    },
    calendarTitle: { fontFamily: fonts.semibold, fontSize: 15, color: c.text },
    meta: { fontFamily: fonts.regular, fontSize: 12, color: c.textSecondary },
    section: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      letterSpacing: 1.04,
      textTransform: 'uppercase',
      color: c.textSecondary,
    },
    sheetTitle: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 0.96,
      textTransform: 'uppercase',
      color: c.textSecondary,
    },
    eyebrow: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: c.nowEyebrow,
    },
    caption: { fontFamily: fonts.regular, fontSize: 12, color: c.textHint },
    mono: { fontFamily: fonts.mono, fontSize: 12, color: c.textSecondary },
    monoNote: { fontFamily: fonts.mono, fontSize: 13, color: c.textSecondary }, // время в «Сейчас»
    monoCount: { fontFamily: fonts.mono, fontSize: 13, color: c.accent },
    timeCell: { fontFamily: fonts.mono, fontSize: 15, color: c.text }, // часы и минуты в панели ⏰
    timeCellOn: { fontFamily: fonts.mono, fontSize: 15, color: c.onAccent },
  } as const satisfies Record<string, TextStyle>;
}

export type TextStyles = Record<keyof ReturnType<typeof makeText>, TextStyle>;

// «Голос»: подписи — моноширинным капсом с разрядкой, заголовки тоньше
function voiceText(c: Palette): TextStyles {
  const base = makeText(c);
  const monoCaps = (color: string): TextStyle => ({
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color,
  });
  return {
    ...base,
    title: {
      fontFamily: fonts.medium,
      fontSize: 34,
      lineHeight: 38,
      letterSpacing: -0.5,
      color: c.text,
    },
    screenTitle: {
      fontFamily: fonts.medium,
      fontSize: 28,
      letterSpacing: -0.56,
      color: c.text,
    },
    nowTitle: {
      ...base.nowTitle,
      fontFamily: fonts.medium,
      fontSize: 25,
      lineHeight: 30,
    },
    task: { ...base.task, lineHeight: 21 },
    headerDate: monoCaps(base.headerDate.color),
    section: monoCaps(base.section.color),
    sheetTitle: monoCaps(base.sheetTitle.color),
    dayTitle: monoCaps(base.dayTitle.color),
    eyebrow: monoCaps(base.eyebrow.color),
    meta: { fontFamily: fonts.mono, fontSize: 12, color: c.textSecondary },
  };
}

// «Стикеры»: заголовки широким Unbounded
function stickersText(c: Palette): TextStyles {
  const base = makeText(c);
  return {
    ...base,
    title: {
      fontFamily: fonts.displayBold,
      fontSize: 30,
      lineHeight: 38,
      letterSpacing: -0.5,
      color: c.text,
    },
    screenTitle: { fontFamily: fonts.displayBold, fontSize: 24, color: c.text },
    nowTitle: {
      fontFamily: fonts.display,
      fontSize: 22,
      lineHeight: 28,
      color: c.nowText,
    },
    emptyTitle: {
      fontFamily: fonts.display,
      fontSize: 18,
      lineHeight: 24,
      color: c.text,
    },
    task: {
      fontFamily: fonts.medium,
      fontSize: 17,
      lineHeight: 22,
      color: c.text,
    },
    button: { ...base.button, fontSize: 17 },
    buttonSecondary: {
      fontFamily: fonts.semibold,
      fontSize: 17,
      color: c.text,
    },
    section: { fontFamily: fonts.displayBold, fontSize: 16, color: c.text },
    eyebrow: {
      fontFamily: fonts.bold,
      fontSize: 12,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: c.nowEyebrow,
    },
  };
}

export type Theme = {
  name: ThemeName;
  dark: boolean;
  colors: Palette;
  text: TextStyles;
  radius: Radii;
  details: Details;
};

export const themes: Record<ThemeName, Theme> = {
  night: {
    name: 'night',
    dark: true,
    colors: night,
    text: makeText(night),
    radius: roundRadius,
    details: plainDetails,
  },
  day: {
    name: 'day',
    dark: false,
    colors: day,
    text: makeText(day),
    radius: roundRadius,
    details: plainDetails,
  },
  voice: {
    name: 'voice',
    dark: true,
    colors: voice,
    text: voiceText(voice),
    radius: {
      focus: 4,
      small: 6,
      chip: 6,
      row: 6,
      button: 10,
      field: 10,
      panel: 6,
      card: 6,
      thumb: 4,
      pill: 12,
    },
    details: {
      ...plainDetails,
      check: { size: 20, radius: 5, border: 1.5 },
      monoLabels: true,
      framed: true,
      nowCorners: true,
      nowTime: 'right',
      when: 'arrow',
      glow: '#5EE6FF73',
      waves: true,
      footer: 'voice',
      pocket: 'lines',
      restMeta: 'right',
      restCount: true,
      editHint: false,
    },
  },
  stickers: {
    name: 'stickers',
    dark: false,
    colors: stickers,
    text: stickersText(stickers),
    radius: {
      focus: 8,
      small: 10,
      chip: 12,
      row: 12,
      button: 14,
      field: circle,
      panel: 18,
      card: 6,
      thumb: 6,
      pill: circle,
    },
    details: {
      ...plainDetails,
      laterStroke: 2,
      headerStroke: 1.5,
      check: { size: 26, radius: 13, border: 2.5 },
      nowTime: 'eyebrow',
      sticker: { tilt: '-1.4deg', tape: '#FFFFFF99' },
      pocket: 'notes',
      notes: [
        { color: '#FFB8D2', tilt: '1.2deg' },
        { color: '#A6EDC8', tilt: '-1.6deg' },
        { color: '#AFD5FF', tilt: '1.8deg' },
      ],
      countBadge: true,
      editHint: false,
    },
  },
};
