import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { colors, pressedOpacity, radius, size, space, text } from '@/theme';

type Props = { title: string; note: string; value?: boolean; onPress: () => void };

/** Строка настроек: с value — переключатель, без — переход в настройки телефона. Тапается вся строка. */
export function SettingRow({ title, note, value, onPress }: Props) {
  const toggle = value !== undefined;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={toggle ? 'switch' : 'button'}
      accessibilityState={toggle ? { checked: value } : undefined}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.texts}>
        <Text style={text.row}>{title}</Text>
        <Text style={text.note}>{note}</Text>
      </View>
      {toggle ? (
        // Сам переключатель не ловит тапы — их ловит строка, иначе тап мимо него не срабатывал бы
        <View pointerEvents="none">
          <Switch
            value={value}
            trackColor={{ false: colors.lineStrong, true: colors.accent }}
            thumbColor={colors.text}
          />
        </View>
      ) : (
        <Icon name="forward" size={20} color={colors.textSecondary} strokeWidth={2} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.row,
    paddingHorizontal: space[16],
    paddingVertical: space[12],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    borderRadius: radius.row,
    backgroundColor: colors.row,
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: space[2],
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
