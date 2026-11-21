import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { themedStyles, useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import { circle, pressedOpacity, size, space, touch } from '@/theme';

type Props = { count: number; onPress: () => void };

export function AheadButton({ count, onPress }: Props) {
  const { colors, text, details } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.a11y.ahead(count)}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="calendar" size={16} color={colors.aheadText} strokeWidth={2} />
      <Text style={[text.label, styles.label]}>{copy.ahead.title}</Text>
      {details.countBadge ? (
        // «Стикеры»: число в жёлтом кружке
        <View style={styles.badge}>
          <Text style={[text.mono, styles.badgeText]}>{count}</Text>
        </View>
      ) : (
        <Text style={[text.monoCount, styles.count]}>
          {details.monoLabels ? String(count).padStart(2, '0') : count}
        </Text>
      )}
    </Pressable>
  );
}

const useStyles = themedStyles(({ colors, radius, details }) => ({
  button: {
    height: touch,
    paddingHorizontal: space[14],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    borderWidth: details.headerStroke,
    borderColor: colors.headerBorder,
    borderRadius: radius.pill,
    backgroundColor: colors.ahead,
  },
  label: {
    color: colors.aheadText,
  },
  count: {
    color: colors.aheadCount,
  },
  badge: {
    minWidth: size.aheadBadge,
    height: size.aheadBadge,
    paddingHorizontal: space[4],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: circle,
    backgroundColor: colors.aheadCount,
  },
  badgeText: {
    color: colors.onAheadCount,
  },
  pressed: {
    opacity: pressedOpacity,
  },
}));
