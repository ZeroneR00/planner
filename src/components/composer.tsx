import { useEffect, useRef } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarSheet } from '@/components/calendar-sheet';
import { CameraSheet } from '@/components/camera-sheet';
import { EditBar } from '@/components/edit-bar';
import { HintLine } from '@/components/hint-line';
import { Icon } from '@/components/icon';
import { PillButton } from '@/components/pill-button';
import { RepeatSheet } from '@/components/repeat-sheet';
import { TimeSheet } from '@/components/time-sheet';
import { WhenChips } from '@/components/when-chips';
import type { Composer as ComposerModel, Sheet } from '@/hooks/use-composer';
import { useKeyboardShown } from '@/hooks/use-keyboard-shown';
import { copy } from '@/lib/copy';
import { formatTime } from '@/lib/dates';
import { repeatLabel } from '@/lib/rules';
import { colors, pressedOpacity, radius, size, space, text, touch } from '@/theme';

type Props = { composer: ComposerModel };

/** Поле записи внизу экрана: правка, подсказка, панель, бегунок «когда», поле и «Добавить». */
export function Composer({ composer: c }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardShown = useKeyboardShown();
  const inputRef = useRef<TextInputInstance>(null);
  const { when, editOrigin } = c;

  // Начали правку — клавиатура и курсор в конец текста задачи
  useEffect(() => {
    if (editOrigin === null) return;
    const end = editOrigin.title.length;
    inputRef.current?.focus();
    inputRef.current?.setSelection(end, end);
  }, [editOrigin]);
  const noDay = when.date === null;
  const time = when.time !== null ? formatTime(when.time) : null;
  const repeat = when.repeat !== null ? repeatLabel(when.repeat) : null;

  // Клавиатура прячется и после выбора не возвращается — иначе кнопки уехали бы из-под пальца
  const openSheet = (sheet: Sheet) => {
    Keyboard.dismiss();
    c.toggleSheet(sheet);
  };

  const openCamera = () => {
    Keyboard.dismiss();
    c.openCamera();
  };

  return (
    // Над системной панелью — только когда клавиатура спрятана: открытая и так выше неё
    <View style={[styles.footer, { paddingBottom: space[10] + (keyboardShown ? 0 : insets.bottom) }]}>
      {c.editing && <EditBar rule={c.editingRule} onCancel={c.cancelEdit} />}
      {c.hint !== null && <HintLine hint={c.hint} />}
      {c.sheet === 'repeat' && (
        <RepeatSheet
          options={c.repeatOptions}
          selected={when.repeat?.kind ?? null}
          weekdays={c.weekdays}
          onPick={c.pickRepeat}
          onToggleDay={c.toggleWeekday}
        />
      )}
      {c.sheet === 'calendar' && (
        <CalendarSheet today={c.today} selected={when.date} onPick={c.pickDate} />
      )}
      {c.sheet === 'time' && c.timeGrid !== null && <TimeSheet grid={c.timeGrid} onPick={c.pickTime} />}
      {c.showWhen && (
        <View style={styles.whenRow}>
          <WhenChips
            chips={c.chips}
            selectedKey={c.selectedChip}
            calendarLabel={c.calendarLabel}
            onPick={c.pickDate}
            onOpenCalendar={() => openSheet('calendar')}
          />
          {/* Время и повтор видны сразу — и понятые из текста, и выбранные в панели */}
          <PillButton
            icon="clock"
            label={time}
            disabled={noDay}
            accessibilityLabel={time !== null ? copy.composer.timeOn(time) : copy.composer.time}
            onPress={() => openSheet('time')}
          />
          <PillButton
            icon="loop"
            label={repeat}
            disabled={noDay}
            accessibilityLabel={repeat !== null ? copy.composer.repeatOn(repeat) : copy.composer.repeat}
            onPress={() => openSheet('repeat')}
          />
        </View>
      )}
      <View style={styles.inputRow}>
        <View style={styles.field}>
          <TextInput
            ref={inputRef}
            value={c.text}
            onChangeText={c.setText}
            onFocus={c.focusField}
            onSubmitEditing={c.submit}
            placeholder={copy.composer.placeholder}
            placeholderTextColor={colors.textHint}
            cursorColor={colors.accent}
            returnKeyType="send"
            submitBehavior="submit"
            accessibilityLabel={c.editing ? copy.composer.editInputLabel : copy.composer.inputLabel}
            style={[text.input, styles.input, c.editing ? styles.inputEditing : styles.inputWithCamera]}
          />
          {/* В правке фото не меняют — камеры нет */}
          {!c.editing && (
            <Pressable
              onPress={openCamera}
              accessibilityRole="button"
              accessibilityLabel={copy.photo.take}
              style={({ pressed }) => [styles.camera, pressed && styles.pressed]}
            >
              <Icon name="camera" size={22} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={c.submit}
          disabled={!c.canSubmit}
          accessibilityRole="button"
          accessibilityLabel={c.editing ? copy.composer.save : copy.composer.send}
          accessibilityState={{ disabled: !c.canSubmit }}
          style={({ pressed }) => [styles.send, c.canSubmit && styles.sendOn, pressed && styles.pressed]}
        >
          <Icon
            name={c.editing ? 'check' : 'arrowUp'}
            size={22}
            color={c.canSubmit ? colors.onAccent : colors.control}
            strokeWidth={c.editing ? 2.6 : 2.4}
          />
        </Pressable>
      </View>
      {c.camera && <CameraSheet onPhoto={(uri) => void c.addPhoto(uri)} onClose={c.closeCamera} />}
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  field: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    height: size.field,
    paddingHorizontal: space[16],
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.field,
    backgroundColor: colors.surface,
  },
  inputEditing: {
    borderColor: colors.accent,
  },
  // Текст не заходит под 📷
  inputWithCamera: {
    paddingRight: touch + space[4],
  },
  camera: {
    position: 'absolute',
    right: space[4],
    top: (size.field - touch) / 2,
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
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
