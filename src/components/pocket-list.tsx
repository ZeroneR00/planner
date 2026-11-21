import { Pressable, Text, View } from 'react-native';

import { FlashRing } from '@/components/flash-ring';
import { FocusRing } from '@/components/focus-ring';
import { Icon } from '@/components/icon';
import { PhotoThumb } from '@/components/photo-thumb';
import { PocketNotes } from '@/components/pocket-notes';
import type { Flash } from '@/hooks/use-reveal';
import { themedStyles, useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import { shownTitle } from '@/lib/photo';
import type { PocketItem } from '@/lib/today-view';
import type { Task } from '@/lib/types';
import { circle, pressedOpacity, size, space, touch } from '@/theme';

export type PocketListProps = {
  items: readonly PocketItem[];
  editingId: string | null;
  flash: Flash | null; // подсветка после тапа по напоминанию
  onMarkDone: (task: Task) => void;
  movingId: string | null;
  onWhen: (task: Task) => void;
  onRemove: (task: Task) => void;
  onEdit: (task: Task) => void;
};

/** Стикеры: одна карточка (Ночь, День), строки через линию (Голос) или бумажки вбок (Стикеры). */
export function PocketList(props: PocketListProps) {
  const { items } = props;
  const { text, details } = useTheme();
  const styles = useStyles();
  const { pocket } = details;
  const count = details.monoLabels ? String(items.length).padStart(2, '0') : String(items.length);
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        {pocket === 'card' && <Text style={text.section}>{copy.pocket.title(count)}</Text>}
        {pocket === 'lines' && (
          <>
            <Text style={text.section}>{copy.pocket.name}</Text>
            <Text style={text.section}>{count}</Text>
          </>
        )}
        {pocket === 'notes' && (
          <View style={styles.badgeTitle}>
            <Text style={text.section}>{copy.pocket.name}</Text>
            <View style={styles.badge}>
              <Text style={[text.mono, styles.badgeText]}>{count}</Text>
            </View>
          </View>
        )}
        {details.editHint && items.length > 0 && (
          <Text style={[text.caption, styles.editHint]}>{copy.pocket.editHint}</Text>
        )}
      </View>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={text.hint}>{copy.pocket.empty}</Text>
        </View>
      ) : pocket === 'notes' ? (
        <PocketNotes {...props} />
      ) : (
        <View style={pocket === 'card' ? styles.card : null}>
          {items.map((item, index) => (
            <PocketRow
              key={item.task.id}
              {...props}
              item={item}
              first={index === 0}
              last={index === items.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

type RowProps = Omit<PocketListProps, 'items'> & {
  item: PocketItem;
  first: boolean;
  last: boolean;
};

// Строка стикера: в карточке — через линию, в «Голосе» — линии сверху и под последней, без фона
function PocketRow({
  item: { task, missed },
  first,
  last,
  editingId,
  flash,
  movingId,
  onMarkDone,
  onWhen,
  onRemove,
  onEdit,
}: RowProps) {
  const { colors, text, details } = useTheme();
  const styles = useStyles();
  const lines = details.pocket === 'lines';
  return (
    <View style={[styles.row, lines ? [styles.line, last && styles.lineLast] : !first && styles.divided]}>
      {task.photo !== undefined && <PhotoThumb name={task.photo} style={styles.thumb} />}
      <Pressable
        onPress={() => onEdit(task)}
        accessibilityRole="button"
        accessibilityLabel={copy.a11y.edit(shownTitle(task))}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <Text style={[text.body, styles.title, task.title === '' && styles.untitled]}>{shownTitle(task)}</Text>
        {missed !== null && (
          <View style={styles.meta}>
            <Icon name="return" size={14} color={colors.warning} />
            <Text style={[text.note, styles.warning]}>{missed}</Text>
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
        {details.when === 'text' ? (
          <Text style={text.action}>{copy.pocket.when}</Text>
        ) : (
          <Text style={text.monoCount}>{copy.pocket.whenArrow}</Text>
        )}
      </Pressable>
      <Pressable
        onPress={() => onRemove(task)}
        accessibilityRole="button"
        accessibilityLabel={copy.a11y.remove(shownTitle(task))}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <Icon name="close" size={18} color={colors.textSecondary} strokeWidth={2} />
      </Pressable>
      {/* В карточке углы колец обрезает она сама, у строк через линию углов нет */}
      {(task.id === editingId || task.id === movingId) && <FocusRing offset={0} radius={0} />}
      {flash?.id === task.id && <FlashRing key={flash.key} offset={0} radius={0} />}
    </View>
  );
}

const useStyles = themedStyles(({ colors, radius, details }) => ({
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
  // «Стикеры»: заголовок и чёрный кружок с числом
  badgeTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  badge: {
    minWidth: size.countBadge,
    height: size.countBadge,
    paddingHorizontal: space[4],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: circle,
    backgroundColor: colors.accent,
  },
  badgeText: {
    color: colors.onAccent,
  },
  // Углы колец правки и подсветки обрезает карточка
  card: {
    borderRadius: radius.panel,
    overflow: 'hidden',
    backgroundColor: colors.row,
    ...(details.framed ? { borderWidth: 1, borderColor: colors.cardBorder } : {}),
  },
  row: {
    minHeight: size.row,
    paddingLeft: space[16],
    flexDirection: 'row',
    alignItems: 'center',
  },
  divided: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  line: {
    paddingLeft: space[2],
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  lineLast: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
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
}));
