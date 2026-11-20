import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { stepChips, windowLimits, type RepeatOption } from '@/lib/composer';
import { copy } from '@/lib/copy';
import { WEEK_ORDER, at, capitalize, weekdayHeaders } from '@/lib/dates';
import { stepLabel } from '@/lib/rules';
import type { RepeatKind, RepeatPattern } from '@/lib/types';
import { colors, pressedOpacity, radius, size, space, text, touch } from '@/theme';

type Hourly = Extract<RepeatPattern, { kind: 'hourly' }>;

type Props = {
  options: readonly RepeatOption[];
  selected: RepeatKind | null;
  weekdays: readonly number[];
  onPick: (repeat: RepeatPattern | null) => void;
  onToggleDay: (weekday: number) => void;
  hourly: Hourly | null; // выбранный «каждые N» — под ним шаг и часы
  onPickStep: (minutes: number) => void;
  onShift: (edge: 'from' | 'to', delta: 1 | -1) => void;
};

export function RepeatSheet({
  options,
  selected,
  weekdays,
  onPick,
  onToggleDay,
  hourly,
  onPickStep,
  onShift,
}: Props) {
  return (
    <View style={styles.sheet}>
      <Text style={[text.sheetTitle, styles.title]}>{copy.composer.repeat}</Text>
      {options.map((option) => {
        const isSelected = (option.pattern?.kind ?? null) === selected;
        return (
          <Fragment key={option.key}>
            <Pressable
              onPress={() => onPick(option.pattern)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => [
                styles.item,
                isSelected && styles.itemSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[text.row, styles.label]}>{option.label}</Text>
              {isSelected && <Icon name="check" size={18} color={colors.accent} strokeWidth={2.4} />}
            </Pressable>
            {option.key === 'weekly' && <DayRow weekdays={weekdays} onToggle={onToggleDay} />}
            {option.key === 'hourly' && hourly !== null && (
              <HourlyControls hourly={hourly} onPickStep={onPickStep} onShift={onShift} />
            )}
          </Fragment>
        );
      })}
    </View>
  );
}

function DayRow({ weekdays, onToggle }: { weekdays: readonly number[]; onToggle: (weekday: number) => void }) {
  const names = weekdayHeaders();
  return (
    <View style={styles.days}>
      {WEEK_ORDER.map((weekday, i) => {
        const isOn = weekdays.includes(weekday);
        return (
          <Pressable
            key={weekday}
            onPress={() => onToggle(weekday)}
            accessibilityRole="button"
            accessibilityLabel={capitalize(at(copy.repeat.weeklyPlural, weekday))}
            accessibilityState={{ selected: isOn }}
            style={({ pressed }) => [styles.day, isOn && styles.dayOn, pressed && styles.pressed]}
          >
            <Text style={isOn ? text.chipOn : text.label}>{at(names, i)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type HourlyProps = {
  hourly: Hourly;
  onPickStep: (minutes: number) => void;
  onShift: (edge: 'from' | 'to', delta: 1 | -1) => void;
};

function HourlyControls({ hourly, onPickStep, onShift }: HourlyProps) {
  const limits = windowLimits(hourly);
  return (
    <View>
      <View style={styles.days}>
        {stepChips(hourly.minutes).map((minutes) => {
          const isOn = minutes === hourly.minutes;
          return (
            <Pressable
              key={minutes}
              onPress={() => onPickStep(minutes)}
              accessibilityRole="button"
              accessibilityLabel={capitalize(stepLabel(minutes))}
              accessibilityState={{ selected: isOn }}
              style={({ pressed }) => [styles.day, isOn && styles.dayOn, pressed && styles.pressed]}
            >
              <Text numberOfLines={1} style={isOn ? text.chipOn : text.label}>
                {copy.composer.hourlyStep(minutes)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <WindowRow
        label={copy.composer.windowFrom}
        hour={hourly.from}
        down={{ enabled: limits.fromDown, label: copy.composer.windowFromEarlier, onPress: () => onShift('from', -1) }}
        up={{ enabled: limits.fromUp, label: copy.composer.windowFromLater, onPress: () => onShift('from', 1) }}
      />
      <WindowRow
        label={copy.composer.windowTo}
        hour={hourly.to}
        down={{ enabled: limits.toDown, label: copy.composer.windowToEarlier, onPress: () => onShift('to', -1) }}
        up={{ enabled: limits.toUp, label: copy.composer.windowToLater, onPress: () => onShift('to', 1) }}
      />
    </View>
  );
}

type StepButton = { enabled: boolean; label: string; onPress: () => void };

function WindowRow({ label, hour, down, up }: { label: string; hour: number; down: StepButton; up: StepButton }) {
  return (
    <View style={styles.window}>
      <Text style={[text.label, styles.windowLabel]}>{label}</Text>
      <ShiftButton icon="minus" button={down} />
      <Text style={[text.timeCell, styles.windowTime]}>{`${hour}:00`}</Text>
      <ShiftButton icon="plus" button={up} />
    </View>
  );
}

function ShiftButton({ icon, button }: { icon: 'minus' | 'plus'; button: StepButton }) {
  return (
    <Pressable
      onPress={button.onPress}
      disabled={!button.enabled}
      accessibilityRole="button"
      accessibilityLabel={button.label}
      accessibilityState={{ disabled: !button.enabled }}
      style={({ pressed }) => [styles.shift, pressed && styles.pressed]}
    >
      <Icon name={icon} size={18} color={button.enabled ? colors.text : colors.disabled} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  window: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[12],
  },
  windowLabel: {
    flex: 1,
  },
  windowTime: {
    minWidth: touch + space[8],
    textAlign: 'center',
  },
  shift: {
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.chip,
  },
  sheet: {
    padding: space[6],
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
  },
  title: {
    paddingTop: space[8],
    paddingHorizontal: space[12],
    paddingBottom: space[6],
  },
  item: {
    minHeight: size.menuItem,
    paddingHorizontal: space[12],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
    borderRadius: radius.chip,
  },
  itemSelected: {
    backgroundColor: colors.surfaceSelected,
  },
  label: {
    flexShrink: 1,
  },
  days: {
    flexDirection: 'row',
    gap: space[2],
    paddingVertical: space[4],
  },
  day: {
    flex: 1,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.chip,
  },
  dayOn: {
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
