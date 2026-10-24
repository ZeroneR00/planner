import { useId } from 'react';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '@/theme';

type Props = { stops: readonly (readonly [offset: number, opacity: number])[] };

/** Горизонтальное затухание цветом футера; размер — от родителя. */
export function EdgeFade({ stops }: Props) {
  // useId даёт «:r1:» — в url(#…) двоеточия ломают ссылку на градиент
  const id = `fade${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width="100%" height="100%" accessible={false}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          {stops.map(([offset, opacity]) => (
            <Stop key={offset} offset={offset} stopColor={colors.footer} stopOpacity={opacity} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
