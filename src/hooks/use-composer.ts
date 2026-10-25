import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler } from 'react-native';

import { usePlanner } from '@/hooks/use-planner';
import { useUndo } from '@/hooks/use-undo';
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
  toggleWeekday,
  whenChips,
  whenHint,
  type Draft,
  type Hint,
} from '@/lib/composer';
import { nowIso } from '@/lib/dates';
import {
  editHint,
  editUndoText,
  savedHint,
  saveEdit,
  startEdit,
  startRuleEdit,
  type EditState,
} from '@/lib/edit';
import { makeId } from '@/lib/id';
import { addTask } from '@/lib/task-actions';
import type { RepeatPattern, Rule, Task } from '@/lib/types';

export type Sheet = 'repeat' | 'calendar';

// stash — недописанная мысль: вернётся в поле, когда правка закончится
type Editing = EditState & { stash: Draft | null };

/** Поле записи: текст, выбор «когда», панели, строка-подсказка и правка задачи по тапу. */
export function useComposer() {
  const planner = usePlanner();
  const undo = useUndo();
  const today = planner.today;
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  // Что добавили последним — показываем, пока не начали печатать следующее
  const [notice, setNotice] = useState<Hint | null>(null);
  const [edit, setEdit] = useState<Editing | null>(null);

  const when = resolveWhen(draft, today);
  const typing = hasText(draft);
  const showWhen = typing || edit !== null;

  const finishEdit = useCallback((e: Editing) => {
    setDraft(e.stash ?? emptyDraft);
    setEdit(null);
    setSheet(null);
  }, []);

  // Первое «Назад» прячет клавиатуру (это делает система), второе — отменяет правку
  useFocusEffect(
    useCallback(() => {
      if (edit === null) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        finishEdit(edit);
        return true;
      });
      return () => sub.remove();
    }, [edit, finishEdit]),
  );

  // Повторный тап по тому же отменяет правку, по другому — переключает на него
  const begin = (same: boolean, start: () => { edit: EditState; draft: Draft }) => {
    if (edit !== null && same) {
      finishEdit(edit);
      return;
    }
    const next = start();
    const stash = edit !== null ? edit.stash : hasText(draft) ? draft : null;
    setEdit({ ...next.edit, stash });
    setDraft(next.draft);
    setSheet(null);
    setNotice(null);
  };

  return {
    text: draft.text,
    when,
    typing,
    editing: edit !== null,
    editingRule: edit?.target.kind === 'rule',
    editingId: edit?.target.taskId ?? null,
    editingRuleId: edit?.target.kind === 'rule' ? edit.target.ruleId : null,
    // Новый объект на каждую начатую правку — по нему поле берёт фокус и ставит курсор в конец
    editOrigin: edit?.origin ?? null,
    showWhen,
    canSubmit: when.title !== '',
    hint:
      edit !== null
        ? editHint(when, today, edit.target.kind === 'rule')
        : typing
          ? whenHint(when, today)
          : notice,
    sheet: showWhen ? sheet : null,
    chips: whenChips(today),
    selectedChip: chipKey(when.date, today),
    calendarLabel: calendarChipLabel(when.date, today),
    repeatOptions: repeatOptions(when.date ?? today, when.repeat),
    weekdays: when.repeat?.kind === 'weekly' ? when.repeat.weekdays : [],
    today,
    setText: (text: string) => {
      setDraft((d) => editText(d, text, today, edit !== null));
      setNotice(null);
      if (edit === null && text.trim() === '') setSheet(null);
    },
    pickDate: (date: string | null) => {
      setDraft((d) => pickDate(d, date));
      setSheet(null);
    },
    pickRepeat: (repeat: RepeatPattern | null) => {
      setDraft((d) => pickRepeat(d, repeat));
      setSheet(null);
    },
    // Меню не закрывается: дни отмечают по одному
    toggleWeekday: (weekday: number) => setDraft((d) => toggleWeekday(d, today, weekday)),
    toggleSheet: (next: Sheet) => setSheet((current) => (current === next ? null : next)),
    closeSheet: () => setSheet(null),
    startEdit: (task: Task) =>
      begin(edit?.target.taskId === task.id, () => startEdit(planner, task)),
    // Из «Повторяется»: «та же» — по правилу, экземпляра на сегодня может не быть
    startRuleEdit: (rule: Rule) =>
      begin(edit?.target.kind === 'rule' && edit.target.ruleId === rule.id, () =>
        startRuleEdit(planner, rule),
      ),
    cancelEdit: () => {
      if (edit !== null) finishEdit(edit);
    },
    submit: () => {
      if (when.title === '') return;
      if (edit !== null) {
        const changes = saveEdit(planner, edit, when, nowIso(), makeId);
        // Задача уехала на другой день — пропадает с глаз, поэтому плашка «Вернуть» вместо подсказки
        const undoText = editUndoText(edit, when, today);
        if (changes !== null && undoText !== null) {
          undo.commit(changes, undoText);
          setNotice(null);
        } else {
          if (changes !== null) planner.commit(changes);
          setNotice(changes === null ? null : savedHint(edit, when, today));
        }
        finishEdit(edit);
        return;
      }
      planner.commit(addTask(planner, when, nowIso(), makeId));
      setDraft(emptyDraft);
      setSheet(null);
      setNotice(addedHint(when, today));
    },
  };
}

export type Composer = ReturnType<typeof useComposer>;
