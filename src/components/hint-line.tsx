import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import type { Hint } from '@/lib/composer';
import { colors, space, text } from '@/theme';

type Props = { hint: Hint };

/** Строка над полем: как приложение поняло запись или что с ней стало. */
export function HintLine({ hint }: Props) {
  const color = hint.accent ? colors.accent : colors.textSecondary;
  const tone = hint.accent ? styles.accent : null;
  return (
    <View style={styles.line} accessibilityLiveRegion="polite">
      {hint.parts.map((part, i) => (
        <Fragment key={`${i}:${part.text}`}>
          {i > 0 && <Text style={[text.status, tone]}>·</Text>}
          <View style={styles.part}>
            {part.icon !== undefined && <Icon name={part.icon} size={13} color={color} />}
            <Text style={[text.status, tone, styles.partText]}>{part.text}</Text>
          </View>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    paddingHorizontal: space[4],
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: space[4],
  },
  part: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  partText: {
    flexShrink: 1,
  },
  accent: {
    color: colors.accent,
  },
});
