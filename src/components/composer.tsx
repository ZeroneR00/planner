import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarSheet } from '@/components/calendar-sheet';
import { HintLine } from '@/components/hint-line';
import { Icon } from '@/components/icon';
import { RepeatSheet } from '@/components/repeat-sheet';
import { WhenChips } from '@/components/when-chips';
import type { Composer as ComposerModel, Sheet } from '@/hooks/use-composer';
import { useKeyboardShown } from '@/hooks/use-keyboard-shown';
import { copy } from '@/lib/copy';
import { repeatLabel } from '@/lib/rules';
import { colors, pressedOpacity, radius, size, space, text, touch } from '@/theme';

type Props = { composer: ComposerModel };

/** Поле записи внизу экрана: подсказка, панель, бегунок «когда», поле и «Добавить». */
export function Composer({ composer: c }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardShown = useKeyboardShown();
  const { when } = c;
  const noDay = when.date === null;
  const repeatOn = when.repeat !== null;

  // Клавиатура прячется и после выбора не возвращается — иначе кнопки уехали бы из-под пальца
  const openSheet = (sheet: Sheet) => {
    Keyboard.dismiss();
    c.toggleSheet(sheet);
  };

  return (
    // Над системной панелью — только когда клавиатура спрятана: открытая и так выше неё
    <View style={[styles.footer, { paddingBottom: space[10] + (keyboardShown ? 0 : insets.bottom) }]}>
      {c.hint !== null && <HintLine hint={c.hint} />}
      {c.sheet === 'repeat' && (
        <RepeatSheet
          options={c.repeatOptions}
          selected={when.repeat?.kind ?? null}
          onPick={c.pickRepeat}
        />
      )}
      {c.sheet === 'calendar' && (
        <CalendarSheet today={c.today} selected={when.date} onPick={c.pickDate} />
      )}
      {c.typing && (
        <View style={styles.whenRow}>
          <WhenChips
            chips={c.chips}
            selectedKey={c.selectedChip}
            calendarLabel={c.calendarLabel}
            onPick={c.pickDate}
            onOpenCalendar={() => openSheet('calendar')}
          />
          <Pressable
            onPress={() => openSheet('repeat')}
            disabled={noDay}
            accessibilityRole="button"
            accessibilityLabel={
              when.repeat !== null ? copy.composer.repeatOn(repeatLabel(when.repeat)) : copy.composer.repeat
            }
            accessibilityState={{ disabled: noDay, selected: repeatOn }}
            style={({ pressed }) => [
              styles.repeat,
              noDay ? styles.repeatOff : repeatOn && styles.repeatOn,
              pressed && styles.pressed,
            ]}
          >
            <Icon
              name="loop"
              size={18}
              color={noDay ? colors.disabled : repeatOn ? colors.onAccent : colors.text}
            />
          </Pressable>
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          value={c.text}
          onChangeText={c.setText}
          onFocus={c.closeSheet}
          onSubmitEditing={c.submit}
          placeholder={copy.composer.placeholder}
          placeholderTextColor={colors.textHint}
          cursorColor={colors.accent}
          returnKeyType="send"
          submitBehavior="submit"
          accessibilityLabel={copy.composer.inputLabel}
          style={[text.input, styles.input]}
        />
        <Pressable
          onPress={c.submit}
          disabled={!c.canSubmit}
          accessibilityRole="button"
          accessibilityLabel={copy.composer.send}
          accessibilityState={{ disabled: !c.canSubmit }}
          style={({ pressed }) => [styles.send, c.canSubmit && styles.sendOn, pressed && styles.pressed]}
        >
          <Icon
            name="arrowUp"
            size={22}
            color={c.canSubmit ? colors.onAccent : colors.control}
            strokeWidth={2.4}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingTop: space[10],
    paddingHorizontal: space[12],
    gap: space[10],
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.footer,
  },
  whenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[6],
  },
  repeat: {
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  repeatOff: {
    borderColor: colors.line,
    backgroundColor: 'transparent',
  },
  repeatOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: size.field,
    paddingHorizontal: space[16],
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.field,
    backgroundColor: colors.surface,
  },
  send: {
    width: size.field,
    height: size.field,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.field,
    backgroundColor: colors.lineStrong,
  },
  sendOn: {
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
