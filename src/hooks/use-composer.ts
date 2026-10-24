import { useState } from 'react';

import { usePlanner } from '@/hooks/use-planner';
import {
  addedHint,
  calendarChipLabel,
  chipKey,
  editText,
  emptyDraft,
  hasText,
  pickDate,
  pickRepeat,
  repeatOptions,
  resolveWhen,
  whenChips,
  whenHint,
  type Draft,
  type Hint,
} from '@/lib/composer';
import { nowIso } from '@/lib/dates';
import { makeId } from '@/lib/id';
import { addTask } from '@/lib/task-actions';
import type { RepeatKind } from '@/lib/types';

export type Sheet = 'repeat' | 'calendar';

/** Поле записи: текст, выбор «когда», панели и строка-подсказка. */
export function useComposer() {
  const planner = usePlanner();
  const today = planner.today;
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  // Что добавили последним — показываем, пока не начали печатать следующее
  const [notice, setNotice] = useState<Hint | null>(null);

  const when = resolveWhen(draft, today);
  const typing = hasText(draft);

  return {
    text: draft.text,
    when,
    typing,
    canSubmit: when.title !== '',
    hint: typing ? whenHint(when, today) : notice,
    sheet: typing ? sheet : null,
    chips: whenChips(today),
    selectedChip: chipKey(when.date, today),
    calendarLabel: calendarChipLabel(when.date, today),
    repeatOptions: repeatOptions(when.date ?? today),
    today,
    setText: (text: string) => {
      setDraft((d) => editText(d, text, today));
      setNotice(null);
      if (text.trim() === '') setSheet(null);
    },
    pickDate: (date: string | null) => {
      setDraft((d) => pickDate(d, date));
      setSheet(null);
    },
    pickRepeat: (kind: RepeatKind | null) => {
      setDraft((d) => pickRepeat(d, kind));
      setSheet(null);
    },
    toggleSheet: (next: Sheet) => setSheet((current) => (current === next ? null : next)),
    closeSheet: () => setSheet(null),
    submit: () => {
      if (when.title === '') return;
      planner.commit(addTask(planner, when, nowIso(), makeId));
      setDraft(emptyDraft);
      setSheet(null);
      setNotice(addedHint(when, today));
    },
  };
}

export type Composer = ReturnType<typeof useComposer>;
