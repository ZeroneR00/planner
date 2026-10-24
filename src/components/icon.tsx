import Svg, { Path, Rect } from 'react-native-svg';

// Линейные иконки из прототипа, сетка 24×24. ↻ и ↩ рисуем здесь, а не символами:
// в Golos Text их нет, а запасной шрифт Android может показать ↩ цветным эмодзи
const PATHS = {
  arrowRight: ['M5 12h14', 'M13 6l6 6-6 6'],
  arrowUp: ['M12 19V5', 'M5 12l7-7 7 7'],
  calendar: ['M3 10h18', 'M8 3v4', 'M16 3v4'],
  check: ['M5 12l5 5L20 7'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  back: ['M15 18l-6-6 6-6'],
  forward: ['M9 6l6 6-6 6'],
  pencil: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z'],
  // ↻ кнопки повтора — две стрелки; repeat — в подписях
  loop: ['M17 2l4 4-4 4', 'M3 11V9a3 3 0 0 1 3-3h15', 'M7 22l-4-4 4-4', 'M21 13v2a3 3 0 0 1-3 3H3'],
  repeat: ['M21 12a9 9 0 1 1-2.64-6.36', 'M21 4v5h-5'],
  return: ['M9 14L4 9l5-5', 'M4 9h11a5 5 0 0 1 0 10h-3'],
} as const;

export type IconName = keyof typeof PATHS;

type Props = { name: IconName; size: number; color: string; strokeWidth?: number };

/** Декоративная иконка: подпись для читалки экрана даёт кнопка вокруг. */
export function Icon({ name, size, color, strokeWidth = 2 }: Props) {
  const stroke = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      {name === 'calendar' && <Rect x={3} y={5} width={18} height={16} rx={3} {...stroke} />}
      {PATHS[name].map((d) => (
        <Path key={d} d={d} {...stroke} />
      ))}
    </Svg>
  );
}
