import { Pressable, ScrollView, Text, View } from 'react-native';

import { FlashRing } from '@/components/flash-ring';
import { FocusRing } from '@/components/focus-ring';
import { Icon } from '@/components/icon';
import { PhotoThumb } from '@/components/photo-thumb';
import type { PocketListProps } from '@/components/pocket-list';
import { themedStyles, useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import { shownTitle } from '@/lib/photo';
import { circle, fonts, pressedOpacity, size, space, touch } from '@/theme';

// Сколько строк текста влезает на бумажку 164×140 над нижним рядом кнопок:
// пометка ↩ забирает строку, фото — две
function titleLines(missed: boolean, photo: boolean): number {
  return 4 - (missed ? 1 : 0) - (photo ? 2 : 0);
}

// Видимые «Когда?», ✓ и × ниже зоны нажатия — добираем до touch
const NOTE_SLOP = (touch - size.notePill) / 2;

/** «Стикеры»: стикеры — квадратные цветные бумажки в ряд, листаются вбок. */
export function PocketNotes({
  items,
  editingId,
  flash,
  movingId,
  onMarkDone,
  onWhen,
  onRemove,
  onEdit,
}: PocketListProps) {
  const { colors, text, radius, details } = useTheme();
  const styles = useStyles();
  const notes = details.notes ?? [];
  return (
    // handled — тап по «Когда?» при открытой клавиатуре срабатывает с первого раза
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {items.map(({ task, missed }, index) => {
        const note = notes[index % notes.length] ?? null;
        const title = shownTitle(task);
        const photo = task.photo !== undefined;
        return (
          <View
            key={task.id}
            style={[
              styles.note,
              note !== null && {
                backgroundColor: note.color,
                transform: [{ rotate: note.tilt }],
              },
            ]}
          >
            <Pressable
              onPress={() => onEdit(task)}
              accessibilityRole="button"
              accessibilityLabel={copy.a11y.edit(title)}
              style={({ pressed }) => [styles.top, pressed && styles.pressed]}
            >
              {task.photo !== undefined && <PhotoThumb name={task.photo} style={styles.thumb} />}
              {missed !== null && (
                <View style={styles.missed}>
                  <Icon name="return" size={12} color={colors.warning} />
                  <Text style={[text.note, styles.missedText]} numberOfLines={1}>
                    {missed}
                  </Text>
                </View>
              )}
              <Text
                style={[text.body, styles.title, task.title === '' && styles.untitled]}
                numberOfLines={titleLines(missed !== null, photo)}
              >
                {title}
              </Text>
            </Pressable>
            <View style={styles.bottom}>
              <Pressable
                onPress={() => onWhen(task)}
                hitSlop={NOTE_SLOP}
                accessibilityRole="button"
                accessibilityLabel={copy.a11y.when(title)}
                style={({ pressed }) => [styles.when, pressed && styles.pressed]}
              >
                <Text style={[text.chipOn, styles.whenText]} numberOfLines={1}>
                  {copy.pocket.when}
                </Text>
              </Pressable>
              <View style={styles.icons}>
                {missed !== null && (
                  <Pressable
                    onPress={() => onMarkDone(task)}
                    hitSlop={NOTE_SLOP}
                    accessibilityRole="button"
                    accessibilityLabel={copy.a11y.markDone(title)}
                    style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
                  >
                    <Icon name="check" size={18} color={colors.text} strokeWidth={2.4} />
                  </Pressable>
                )}
                <Pressable
                  onPress={() => onRemove(task)}
                  hitSlop={NOTE_SLOP}
                  accessibilityRole="button"
                  accessibilityLabel={copy.a11y.remove(title)}
                  style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
                >
                  <Icon name="close" size={18} color={colors.text} strokeWidth={2} />
                </Pressable>
              </View>
            </View>
            {(task.id === editingId || task.id === movingId) && <FocusRing offset={0} radius={radius.card} />}
            {flash?.id === task.id && <FlashRing key={flash.key} offset={0} radius={radius.card} />}
          </View>
        );
      })}
    </ScrollView>
  );
}

const useStyles = themedStyles(({ colors, radius }) => ({
  // Ряд уходит до правого края экрана; сверху и снизу место наклону и тени
  scroll: {
    marginRight: -space[16],
  },
  row: {
    paddingTop: space[8],
    paddingBottom: space[16],
    paddingLeft: space[2],
    paddingRight: space[16],
    gap: space[12],
  },
  note: {
    width: size.noteWidth,
    height: size.noteHeight,
    paddingTop: space[14],
    paddingRight: space[8],
    paddingBottom: space[8],
    paddingLeft: space[14],
    justifyContent: 'space-between',
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    elevation: 4,
    shadowColor: colors.shadow,
  },
  top: {
    flexShrink: 1,
    gap: space[4],
  },
  thumb: {
    width: size.noteThumb,
    height: size.noteThumb,
  },
  missed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  missedText: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.warning,
  },
  title: {
    paddingRight: space[6],
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  // «Фото» вместо подписи — вторичным цветом: это не текст задачи
  untitled: {
    color: colors.textSecondary,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  when: {
    flexShrink: 1,
    height: size.notePill,
    paddingHorizontal: space[12],
    justifyContent: 'center',
    borderRadius: circle,
    backgroundColor: colors.accent,
  },
  whenText: {
    fontSize: 13,
  },
  icons: {
    flexDirection: 'row',
  },
  icon: {
    width: size.notePill,
    height: size.notePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: pressedOpacity,
  },
}));
