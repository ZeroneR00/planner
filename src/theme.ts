import type { TextStyle } from 'react-native';

import type { ThemeName } from '@/lib/theme-choice';

// Цвета — по теме: компоненты берут их через useTheme() / themedStyles из '@/hooks/use-theme'.
// Размеры в прототипе в px — в React Native это те же числа в dp.

export type Palette = {
  bg: string;
  surface: string; // меню, календарь, чипы, строка в правке
  row: string; // карточка стикеров, строки настроек, «Впереди», кнопки шапки
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

  control: string; // кружок-галочка, серая стрелка
  disabled: string; // прошедшие часы и дни
  surfaceSelected: string;
  toast: string; // плашка «Вернуть»: полупрозрачная, без размытия
  photoBackdrop: string; // фон камеры и фото на весь экран
  cameraButton: string; // кнопки поверх видоискателя: фон 60 %, чтобы читались на любом кадре
  shutter: string; // кнопка спуска
  shadow: string; // тень кнопки микрофона «в воздухе» и карточки «Сейчас» в Дне

  field: string; // поле записи
  fieldBorder: string;
  panelBorder: string; // рамка меню и календаря
  switchTrack: string; // выключенный переключатель
  thumb: string; // бегунок переключателя
  micRing: string; // тонкое кольцо вокруг 🎙

  now: string; // карточка «Сейчас»
  nowText: string;
  nowSecondary: string; // «сделано 1», время, ↻
  nowEyebrow: string; // «• СЕЙЧАС»
  nowDone: string; // кнопка «Сделано»
  nowOnDone: string;
  nowLater: string; // рамка «Позже»
  nowLaterText: string;
  nowRing: string; // рамка правки и подсветка в «Сейчас»
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

  now: '#1C1F24',
  nowText: '#ECEDEF',
  nowSecondary: '#9BA0A8',
  nowEyebrow: '#C6F36B',
  nowDone: '#C6F36B',
  nowOnDone: '#111316',
  nowLater: '#3A3F47',
  nowLaterText: '#ECEDEF',
  nowRing: '#C6F36B',
};

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
  // Камера и фото всегда на чёрном
  photoBackdrop: night.photoBackdrop,
  cameraButton: night.cameraButton,
  shutter: night.shutter,
  shadow: '#14161A',

  field: '#F0F1F4',
  fieldBorder: '#F0F1F4',
  panelBorder: '#E2E5E9',
  switchTrack: '#C9CED6',
  thumb: '#FFFFFF',
  micRing: '#3355FF2E',

  now: '#3355FF',
  nowText: '#FFFFFF',
  nowSecondary: '#FFFFFFD9',
  nowEyebrow: '#FFFFFF',
  nowDone: '#FFFFFF',
  nowOnDone: '#3355FF',
  nowLater: '#FFFFFF99',
  nowLaterText: '#FFFFFF',
  nowRing: '#FFFFFF',
};

export const palettes: Record<ThemeName, Palette> = { night, day };

// Имена семейств совпадают с ключами, под которыми шрифты загружаются в _layout.tsx.
// На Android fontWeight не выбирает файл у своего шрифта: каждое начертание — отдельное семейство,
// поэтому в стилях указываем fontFamily и не указываем fontWeight.
export const fonts = {
  regular: 'GolosText_400Regular',
  medium: 'GolosText_500Medium',
  semibold: 'GolosText_600SemiBold',
  bold: 'GolosText_700Bold',
  mono: 'JetBrainsMono_500Medium',
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

export const radius = {
  focus: 8, // рамка правки вокруг текста
  small: 10, // кнопка «Вернуть»
  chip: 12, // кнопка «Сегодня», пункт меню повтора, день календаря, картинка темы
  row: 14, // строки списков
  field: 16, // поле ввода, плашка «Вернуть», кнопки «Сделано» / «Позже»
  panel: 18, // меню повтора, календарь, карточка стикеров
  card: 24, // карточка «Сейчас»
  thumb: 8, // миниатюра фото в строке
  pill: 999, // чипы бегунка, кнопка «Впереди»
} as const;

// Минимальная зона нажатия. Если элемент визуально меньше — добирать hitSlop.
export const touch = 44;

// Прозрачность нажатой кнопки (Pressable, pressed)
export const pressedOpacity = 0.6;

// Размеры элементов списков и кнопок
export const size = {
  button: 48, // кнопки на всю ширину
  nowButton: 52, // «Сделано» / «Позже» в «Сейчас»
  row: 52, // минимальная высота строки списка
  checkbox: 22, // кружок-галочка
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
  thumb: 40, // миниатюра фото в строке
  nowPhoto: 180, // высота фото в «Сейчас»
  shutter: 72, // кнопка спуска камеры
  voice: 56, // кнопка микрофона «в воздухе» над полем
  voiceListening: 72, // она же, пока слушает
  themeTile: 78, // ширина картинки темы в «Настройках»: четыре в ряд влезают в 358
  themePreview: 124, // её высота
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
    screenTitle: { fontFamily: fonts.bold, fontSize: 28, letterSpacing: -0.56, color: c.text },
    nowTitle: {
      fontFamily: fonts.semibold,
      fontSize: 26,
      lineHeight: 31,
      letterSpacing: -0.26,
      color: c.nowText,
    },
    emptyTitle: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, color: c.text },
    body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, color: c.text },
    input: { fontFamily: fonts.regular, fontSize: 16, color: c.text },
    row: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: c.text },
    label: { fontFamily: fonts.medium, fontSize: 14, color: c.text },
    dayTitle: { fontFamily: fonts.semibold, fontSize: 14, color: c.textSecondary }, // день во «Впереди»
    chipOn: { fontFamily: fonts.semibold, fontSize: 14, color: c.onAccent },
    headerDate: { fontFamily: fonts.regular, fontSize: 15, color: c.textSecondary },
    hint: { fontFamily: fonts.regular, fontSize: 14, color: c.textSecondary },
    button: { fontFamily: fonts.semibold, fontSize: 16, color: c.onAccent },
    buttonSecondary: { fontFamily: fonts.medium, fontSize: 16, color: c.text },
    action: { fontFamily: fonts.semibold, fontSize: 14, color: c.accent },
    note: { fontFamily: fonts.regular, fontSize: 13, color: c.textSecondary },
    editTitle: { fontFamily: fonts.semibold, fontSize: 13, color: c.accent },
    status: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.textSecondary },
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

export type TextStyles = ReturnType<typeof makeText>;

export type Theme = { name: ThemeName; dark: boolean; colors: Palette; text: TextStyles };

export const themes: Record<ThemeName, Theme> = {
  night: { name: 'night', dark: true, colors: night, text: makeText(night) },
  day: { name: 'day', dark: false, colors: day, text: makeText(day) },
};
