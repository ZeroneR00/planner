import type { TextStyle } from 'react-native';

// Тема одна (тёмная), поэтому это просто константы, без useColorScheme.
// Размеры в прототипе в px — в React Native это те же числа в dp.

export const colors = {
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

  outline: '#3A3F47',
  control: '#5F656E',
  disabled: '#4A4F57',
  surfaceSelected: '#262A31',
} as const;

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
  chip: 12, // кнопка «Сегодня», пункт меню повтора, день календаря
  row: 14, // строки списков, кнопки «Сделано» / «Позже»
  field: 16, // поле ввода, плашка «Вернуть»
  panel: 18, // меню повтора, календарь
  card: 22, // карточка «Сейчас»
  pill: 999, // чипы бегунка, кнопка «Впереди»
} as const;

// Минимальная зона нажатия. Если элемент визуально меньше — добирать hitSlop.
export const touch = 44;

// Прозрачность нажатой кнопки (Pressable, pressed)
export const pressedOpacity = 0.6;

// Размеры элементов списков и кнопок
export const size = {
  button: 48, // «Сделано» / «Позже»
  row: 52, // минимальная высота строки списка
  checkbox: 22, // кружок-галочка
  menuItem: 48, // пункт меню повтора
  field: 52, // поле записи и кнопка «Добавить»
  fadeRight: 28, // затухание правого края бегунка
  fadeLeft: 10, // затухание левого края бегунка
  fadeLeftScroll: 25, // за столько dp прокрутки левое затухание проявляется полностью
  chipLead: 48, // сколько оставить слева от чипа, когда бегунок сам к нему прокручивается
} as const;

// Готовые стили текста. letterSpacing и lineHeight в RN — в dp, а не в em и не множителем,
// поэтому значения из прототипа пересчитаны (0.08em × 13 = 1.04, 1.35 × 16 ≈ 22).
// Цвет текста в RN не наследуется от родителя, а по умолчанию чёрный, — поэтому он задан в каждом стиле.
export const text = {
  title: { fontFamily: fonts.bold, fontSize: 32, letterSpacing: -0.64, color: colors.text },
  screenTitle: { fontFamily: fonts.bold, fontSize: 28, letterSpacing: -0.56, color: colors.text },
  nowTitle: {
    fontFamily: fonts.semibold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.24,
    color: colors.text,
  },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, color: colors.text },
  input: { fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  row: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: colors.text },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  chipOn: { fontFamily: fonts.semibold, fontSize: 14, color: colors.onAccent },
  headerDate: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  hint: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  button: { fontFamily: fonts.semibold, fontSize: 16, color: colors.onAccent },
  buttonSecondary: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  action: { fontFamily: fonts.semibold, fontSize: 14, color: colors.accent },
  note: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  status: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  calendarTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  section: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 1.04,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  sheetTitle: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  caption: { fontFamily: fonts.regular, fontSize: 12, color: colors.textHint },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary },
  monoCount: { fontFamily: fonts.mono, fontSize: 13, color: colors.accent },
} as const satisfies Record<string, TextStyle>;
