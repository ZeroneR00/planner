import { Pressable, Text, View } from 'react-native';

import { FlashRing } from '@/components/flash-ring';
import { FocusRing } from '@/components/focus-ring';
import { Icon } from '@/components/icon';
import { PhotoThumb } from '@/components/photo-thumb';
import { TaskMeta } from '@/components/task-meta';
import type { Flash } from '@/hooks/use-reveal';
import { themedStyles, useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import { shownTitle } from '@/lib/photo';
import { restProgress, type DayItem } from '@/lib/today-view';
import type { Task } from '@/lib/types';
import { pressedOpacity, size, space, touch } from '@/theme';

type Props = {
  items: readonly DayItem[];
  editingId: string | null;
  flash: Flash | null; // подсветка после тапа по напоминанию
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
};

export function RestList({ items, editingId, flash, onToggle, onEdit }: Props) {
  const { colors, text, radius, details } = useTheme();
  const styles = useStyles();
  if (items.length === 0) return null;
  const right = details.restMeta === 'right';
  const progress = restProgress(items);
  return (
    <View style={styles.section}>
      {details.restCount ? (
        <View style={[styles.heading, styles.headingRow]}>
          <Text style={text.section}>{copy.today.rest}</Text>
          <Text style={text.section}>{copy.today.restProgress(progress.done, progress.total)}</Text>
        </View>
      ) : (
        <Text style={[text.section, styles.heading]}>{copy.today.rest}</Text>
      )}
      {items.map(({ task, repeat }) => (
        <View key={task.id} style={[styles.row, task.id === editingId && styles.rowEditing]}>
          <Pressable
            onPress={() => onToggle(task)}
            // Узкая кнопка добирает до touch влево — там поле экрана
            hitSlop={right ? { left: touch - size.checkNarrow } : undefined}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: task.done }}
            accessibilityLabel={task.done ? copy.a11y.uncheck(shownTitle(task)) : copy.a11y.check(shownTitle(task))}
            style={({ pressed }) => [styles.check, right && styles.checkLeft, pressed && styles.pressed]}
          >
            <View style={[styles.circle, task.done && styles.circleDone]}>
              {task.done && (
                <Icon name="check" size={Math.round(details.check.size * 0.6)} color={colors.mark} strokeWidth={3} />
              )}
            </View>
          </Pressable>
          {task.photo !== undefined && <PhotoThumb name={task.photo} style={styles.thumb} />}
          <Pressable
            onPress={() => onEdit(task)}
            accessibilityRole="button"
            accessibilityLabel={copy.a11y.edit(shownTitle(task))}
            style={({ pressed }) => [styles.main, right && styles.mainRow, pressed && styles.pressed]}
          >
            <Text
              style={[
                text.task,
                right && styles.titleShrink,
                task.title === '' && styles.untitled,
                task.done && styles.titleDone,
              ]}
            >
              {shownTitle(task)}
            </Text>
            <TaskMeta
              time={task.time}
              label={repeat !== null && task.done ? `${repeat} · ${copy.repeat.doneToday}` : repeat}
              done={task.done}
              compact={right}
            />
          </Pressable>
          {task.id === editingId && <FocusRing offset={0} radius={radius.row} />}
          {flash?.id === task.id && <FlashRing key={flash.key} offset={0} radius={radius.row} />}
        </View>
      ))}
    </View>
  );
}

const useStyles = themedStyles(({ colors, radius, details }) => ({
  section: {
    gap: space[2],
  },
  heading: {
    paddingHorizontal: space[4],
    paddingBottom: space[6],
  },
  // «Голос»: справа счётчик «1/3»
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[8],
  },
  row: {
    minHeight: size.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    borderRadius: radius.row,
  },
  rowEditing: {
    backgroundColor: colors.surface,
  },
  check: {
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // «Голос»: галочка прижата влево, кнопка уже
  checkLeft: {
    width: size.checkNarrow,
    alignItems: 'flex-start',
  },
  circle: {
    width: details.check.size,
    height: details.check.size,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: details.check.radius,
    borderWidth: details.check.border,
    borderColor: colors.checkBorder,
    backgroundColor: colors.checkFill,
  },
  circleDone: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: space[2],
    paddingVertical: space[6],
    paddingRight: space[10],
  },
  // «Голос»: время и повтор справа от текста
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  titleShrink: {
    flex: 1,
  },
  // «Фото» вместо подписи — вторичным цветом: это не текст задачи
  untitled: {
    color: colors.textSecondary,
  },
  thumb: {
    marginRight: space[8],
  },
  titleDone: {
    color: colors.textDone,
    textDecorationLine: 'line-through',
  },
  pressed: {
    opacity: pressedOpacity,
  },
}));
