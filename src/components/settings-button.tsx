import { Pressable } from 'react-native';

import { Icon } from '@/components/icon';
import { themedStyles, useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import { pressedOpacity, touch } from '@/theme';

type Props = { onPress: () => void };

/** Шестерёнка в шапке «Сегодня» — в «Настройки». */
export function SettingsButton({ onPress }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.a11y.settings}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="gear" size={18} color={colors.text} strokeWidth={2} />
    </Pressable>
  );
}

const useStyles = themedStyles(({ colors, radius, details }) => ({
  button: {
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: details.headerStroke,
    borderColor: colors.headerBorder,
    borderRadius: radius.pill,
    backgroundColor: colors.headerButton,
  },
  pressed: {
    opacity: pressedOpacity,
  },
}));
