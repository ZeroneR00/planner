import { Pressable } from 'react-native';

import { Icon } from '@/components/icon';
import { themedStyles, useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import { pressedOpacity, radius, touch } from '@/theme';

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

const useStyles = themedStyles(({ colors }) => ({
  button: {
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    backgroundColor: colors.footer,
  },
  pressed: {
    opacity: pressedOpacity,
  },
}));
