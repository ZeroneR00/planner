import { Pressable, StyleSheet, Text } from 'react-native';

import { Icon } from '@/components/icon';
import { copy } from '@/lib/copy';
import { colors, pressedOpacity, radius, space, text, touch } from '@/theme';

type Props = { count: number; onPress: () => void };

export function AheadButton({ count, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.a11y.ahead(count)}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="calendar" size={16} color={colors.text} strokeWidth={2} />
      <Text style={text.label}>{copy.ahead.title}</Text>
      <Text style={text.monoCount}>{count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: touch,
    paddingHorizontal: space[14],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    backgroundColor: colors.row,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
