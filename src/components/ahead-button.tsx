import { Pressable, Text } from 'react-native';

import { Icon } from '@/components/icon';
import { themedStyles, useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import { pressedOpacity, radius, space, touch } from '@/theme';

type Props = { count: number; onPress: () => void };

export function AheadButton({ count, onPress }: Props) {
  const { colors, text } = useTheme();
  const styles = useStyles();
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

const useStyles = themedStyles(({ colors }) => ({
  button: {
    height: touch,
    paddingHorizontal: space[14],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    backgroundColor: colors.footer,
  },
  pressed: {
    opacity: pressedOpacity,
  },
}));
