import { Pressable, StyleSheet, Text } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { colors, pressedOpacity, radius, size, space, text, touch } from '@/theme';

type Props = {
  icon: IconName;
  label: string | null; // есть надпись — кнопка выбрана и раскрыта
  disabled: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

/** ⏰ и ↻ справа от бегунка: пусто — круглая иконка, выбрано — пилюля с надписью. */
export function PillButton({ icon, label, disabled, accessibilityLabel, onPress }: Props) {
  const on = label !== null;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected: on }}
      style={({ pressed }) => [
        styles.pill,
        disabled ? styles.off : on && styles.on,
        pressed && styles.pressed,
      ]}
    >
      <Icon name={icon} size={18} color={disabled ? colors.disabled : on ? colors.onAccent : colors.text} />
      {label !== null && (
        <Text numberOfLines={1} style={[text.chipOn, styles.label]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Бегунок слева сужается сам, когда кнопка раскрывается
  pill: {
    minWidth: touch,
    maxWidth: size.repeatPill,
    height: touch,
    paddingHorizontal: space[12],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[6],
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  off: {
    borderColor: colors.line,
    backgroundColor: 'transparent',
  },
  on: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  label: {
    flexShrink: 1,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
