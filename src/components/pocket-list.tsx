import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FlashRing } from '@/components/flash-ring';
import { FocusRing } from '@/components/focus-ring';
import { Icon } from '@/components/icon';
import { PhotoThumb } from '@/components/photo-thumb';
import type { Flash } from '@/hooks/use-reveal';
import { copy } from '@/lib/copy';
import { shownTitle } from '@/lib/photo';
import type { PocketItem } from '@/lib/today-view';
import type { Task } from '@/lib/types';
import { colors, pressedOpacity, radius, size, space, text, touch } from '@/theme';

type Props = {
  items: readonly PocketItem[];
  editingId: string | null;
  flash: Flash | null; // подсветка после тапа по напоминанию
  onMarkDone: (task: Task) => void;
  movingId: string | null;
  onWhen: (task: Task) => void;
  onRemove: (task: Task) => void;
  onEdit: (task: Task) => void;
};

export function PocketList({ items, editingId, flash, movingId, onMarkDone, onWhen, onRemove, onEdit }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text style={text.section}>{copy.pocket.title(items.length)}</Text>
        {items.length > 0 && <Text style={[text.caption, styles.editHint]}>{copy.pocket.editHint}</Text>}
      </View>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={text.hint}>{copy.pocket.empty}</Text>
        </View>
      ) : (
        items.map(({ task, missed }) => (
          <View key={task.id} style={styles.row}>
            {task.photo !== undefined && <PhotoThumb name={task.photo} style={styles.thumb} />}
            <Pressable
              onPress={() => onEdit(task)}
              accessibilityRole="button"
              accessibilityLabel={copy.a11y.edit(shownTitle(task))}
              style={({ pressed }) => [styles.main, pressed && styles.pressed]}
            >
              <Text style={[text.row, styles.title, task.title === '' && styles.untitled]}>{shownTitle(task)}</Text>
              {missed !== null && (
                <View style={styles.meta}>
                  <Icon name="return" size={12} color={colors.warning} />
                  <Text style={[text.meta, styles.warning]}>{missed}</Text>
                </View>
              )}
            </Pressable>
            {missed !== null && (
              <Pressable
                onPress={() => onMarkDone(task)}
                accessibilityRole="button"
                accessibilityLabel={copy.a11y.markDone(shownTitle(task))}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              >
                <Icon name="check" size={20} color={colors.accent} strokeWidth={2.4} />
              </Pressable>
            )}
            <Pressable
              onPress={() => onWhen(task)}
              accessibilityRole="button"
              accessibilityLabel={copy.a11y.when(shownTitle(task))}
              style={({ pressed }) => [styles.when, pressed && styles.pressed]}
            >
              <Text style={text.action}>{copy.pocket.when}</Text>
            </Pressable>
            <Pressable
              onPress={() => onRemove(task)}
              accessibilityRole="button"
              accessibilityLabel={copy.a11y.remove(shownTitle(task))}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <Icon name="close" size={18} color={colors.textSecondary} strokeWidth={2} />
            </Pressable>
            {(task.id === editingId || task.id === movingId) && <FocusRing offset={0} radius={radius.row} />}
            {flash?.id === task.id && <FlashRing key={flash.key} offset={0} radius={radius.row} />}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: space[4],
  },
  heading: {
    paddingHorizontal: space[4],
    paddingBottom: space[6],
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space[8],
  },
  editHint: {
    flexShrink: 1,
    textAlign: 'right',
  },
  row: {
    minHeight: size.row,
    paddingLeft: space[14],
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.row,
    backgroundColor: colors.row,
  },
  main: {
    flex: 1,
    minWidth: 0,
    paddingVertical: space[6],
  },
  title: {
    paddingVertical: space[4],
  },
  // «Фото» вместо подписи — вторичным цветом: это не текст задачи
  untitled: {
    color: colors.textSecondary,
  },
  thumb: {
    marginRight: space[12],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  warning: {
    flexShrink: 1,
    color: colors.warning,
  },
  iconButton: {
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  when: {
    height: touch,
    paddingHorizontal: space[10],
    justifyContent: 'center',
    borderRadius: radius.chip,
  },
  empty: {
    padding: space[14],
    borderRadius: radius.row,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
