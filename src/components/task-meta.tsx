import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { formatTime } from '@/lib/dates';
import { colors, space, text } from '@/theme';

type Props = {
  time?: string; // 'HH:MM'
  label?: string | null; // подпись повтора
  icon?: boolean; // ↻ перед подписью
  done?: boolean; // на сегодня сделано — подпись акцентом
  large?: boolean; // в карточке «Сейчас»
};

/** Строка под текстом задачи: «15:00 · ↻ каждый день». Нечего показать — ничего. */
export function TaskMeta({ time, label = null, icon = true, done = false, large = false }: Props) {
  if (time === undefined && label === null) return null;
  const labelStyle = large ? text.note : text.meta;
  return (
    <View style={styles.meta}>
      {time !== undefined && <Text style={large ? text.monoNote : text.mono}>{formatTime(time)}</Text>}
      {time !== undefined && label !== null && <Text style={labelStyle}>·</Text>}
      {label !== null && icon && (
        <Icon name="repeat" size={large ? 13 : 12} color={done ? colors.accent : colors.textSecondary} />
      )}
      {label !== null && <Text style={[labelStyle, styles.label, done && styles.done]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space[4],
  },
  label: {
    flexShrink: 1,
  },
  done: {
    color: colors.accent,
  },
});
