import { Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { themedStyles, useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import { formatTime } from '@/lib/dates';
import { size, space } from '@/theme';

type Props = {
  time?: string; // 'HH:MM'
  label?: string | null; // подпись повтора
  icon?: boolean; // ↻ перед подписью
  done?: boolean; // на сегодня сделано — подпись акцентом
  large?: boolean; // в карточке «Сейчас»
  compact?: boolean; // «Голос»: справа от текста одной строкой, ↻ — символом
};

/** Строка под текстом задачи: «15:00 · ↻ каждый день». Нечего показать — ничего. */
export function TaskMeta({ time, label = null, icon = true, done = false, large = false, compact = false }: Props) {
  const { colors, text } = useTheme();
  const styles = useStyles();
  if (time === undefined && label === null) return null;
  if (compact) {
    const parts = [time === undefined ? null : formatTime(time), label === null ? null : copy.repeat.inline(label)];
    return (
      <Text style={[text.mono, styles.compact, done && label !== null && styles.done]} numberOfLines={1}>
        {parts.filter((p) => p !== null).join(' · ')}
      </Text>
    );
  }
  // В «Сейчас» — цвета карточки: в Дне она синяя
  const onNow = large && styles.onNow;
  const labelStyle = [large ? text.note : text.meta, onNow];
  const iconColor = done ? colors.accent : large ? colors.nowSecondary : colors.textSecondary;
  return (
    <View style={styles.meta}>
      {time !== undefined && (
        <Text style={[large ? text.monoNote : text.mono, onNow]}>{formatTime(time)}</Text>
      )}
      {time !== undefined && label !== null && <Text style={labelStyle}>·</Text>}
      {label !== null && icon && <Icon name="repeat" size={large ? 13 : 12} color={iconColor} />}
      {label !== null && <Text style={[labelStyle, styles.label, done && styles.done]}>{label}</Text>}
    </View>
  );
}

const useStyles = themedStyles(({ colors }) => ({
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space[4],
  },
  label: {
    flexShrink: 1,
  },
  compact: {
    maxWidth: size.restMeta,
  },
  onNow: {
    color: colors.nowSecondary,
  },
  done: {
    color: colors.accent,
  },
}));
