import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { BackHandler } from 'react-native';

import { savePhoto } from '@/hooks/use-photos';
import { usePlanner } from '@/hooks/use-planner';
import { useReply } from '@/hooks/use-reply';
import { useUndo } from '@/hooks/use-undo';
import { useVoice } from '@/hooks/use-voice';
import {
  addedHint,
  calendarChipLabel,
  chipKey,
  editText,
  emptyDraft,
  hasText,
  pickDate,
  pickRepeat,
  pickTime,
  repeatOptions,
  resolveWhen,
  toggleWeekday,
  whenChips,
  whenHint,
  type Draft,
  type Hint,
  type When,
} from '@/lib/composer';
import { copy } from '@/lib/copy';
import { nowIso, nowTime } from '@/lib/dates';
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
import { addedReply } from '@/lib/reply';
import { addTask } from '@/lib/task-actions';
import { timeGrid } from '@/lib/time-grid';
import type { RepeatPattern, Rule, Task } from '@/lib/types';
import { listeningHint, voiceHint } from '@/lib/voice';

export type Sheet = 'repeat' | 'calendar' | 'time';

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
  const [camera, setCamera] = useState(false);
  const { reply, hush } = useReply();
  // Сколько раз ответили — начала ответа идут по кругу
  const picks = useRef(0);

  // Каждый рендер — свежее: «в 9», написанное в 8:59 и отправленное в 9:01, уже на завтра
  const now = nowTime();
  const when = resolveWhen(draft, today, now);
  const typing = hasText(draft);

  const add = (w: When, photo?: string) => {
    planner.commit(addTask(planner, w, nowIso(), makeId, photo));
    setDraft(emptyDraft);
    setSheet(null);
    setNotice(addedHint(w, today, planner.remindersOff));
  };

  const voice = useVoice({
    // Услышанное по ходу — прямо в поле; фраза приходит целиком, поэтому разбирается с чистого черновика
    onText: (text) => setDraft({ ...emptyDraft, text }),
    // Замолчал — задача сразу записана. Сказал только «завтра» — текст остаётся в поле, дописать
    onFinal: (text) => {
      if (text.trim() === '') return;
      const spoken = editText(emptyDraft, text, today, nowTime());
      const heard = resolveWhen(spoken, today, nowTime());
      if (heard.title === '') {
        setDraft(spoken);
        reply(copy.reply.noTitle);
        return;
      }
      add(heard);
      // Отвечаем только на голос: напечатал — и так смотришь на экран
      reply(addedReply(heard, today, picks.current++, planner.remindersOff));
    },
    onError: (error) => {
      setNotice(voiceHint(error));
      reply(copy.reply[error]);
    },
  });
  const { abort: abortVoice } = voice;

  // Пока слушаем, бегунок и ↻ спрятаны — футер не прыгает от каждого слова
  const showWhen = (typing || edit !== null) && !voice.listening;

  const finishEdit = useCallback((e: Editing) => {
    setDraft(e.stash ?? emptyDraft);
    setEdit(null);
    setSheet(null);
  }, []);

  // Ушли с экрана — диктовка прерывается
  useFocusEffect(useCallback(() => abortVoice, [abortVoice]));

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
    abortVoice();
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
    // У задачи-фото подпись можно стереть совсем — останется «Фото»
    canSubmit: when.title !== '' || edit?.photo !== undefined,
    camera,
    hint:
      edit !== null
        ? editHint(when, today, edit.target.kind === 'rule')
        : voice.listening
          ? listeningHint
          : typing
            ? whenHint(when, today)
            : notice,
    mic: { available: voice.available, listening: voice.listening, level: voice.level },
    sheet: showWhen ? sheet : null,
    chips: whenChips(today),
    selectedChip: chipKey(when.date, today),
    calendarLabel: calendarChipLabel(when.date, today),
    repeatOptions: repeatOptions(when.date ?? today, when.repeat),
    weekdays: when.repeat?.kind === 'weekly' ? when.repeat.weekdays : [],
    // Без дня времени нет — и панели тоже
    timeGrid: when.date === null ? null : timeGrid(when.time, when.date, today, now),
    today,
    setText: (text: string) => {
      setDraft((d) => editText(d, text, today, now, edit !== null));
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
    // Тап по часу панель не закрывает — можно выбрать минуты; минуты, «Утром» и «Без времени» закрывают
    pickTime: (time: string | null, close: boolean) => {
      setDraft((d) => pickTime(d, time));
      if (close) setSheet(null);
    },
    // Меню не закрывается: дни отмечают по одному
    toggleWeekday: (weekday: number) => setDraft((d) => toggleWeekday(d, today, now, weekday)),
    toggleSheet: (next: Sheet) => setSheet((current) => (current === next ? null : next)),
    toggleVoice: () => {
      hush(); // иначе распознавание услышит прошлый ответ
      setSheet(null);
      setNotice(null);
      voice.toggle();
    },
    // Тап по экрану во время диктовки — закончить раньше: сказанное записывается
    finishVoice: () => voice.finish(),
    // Тап по полю во время диктовки — остановить и поправить услышанное руками
    focusField: () => {
      setSheet(null);
      abortVoice();
    },
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
    openCamera: () => {
      abortVoice();
      setSheet(null);
      setCamera(true);
    },
    closeCamera: () => setCamera(false),
    // Снимок — сразу задача: подпись, день и время — из того, что уже написано в поле
    addPhoto: async (uri: string) => {
      setCamera(false);
      let name: string;
      try {
        name = await savePhoto(uri);
      } catch (error) {
        if (__DEV__) console.warn('Фото не сохранилось', error);
        setNotice({ accent: false, parts: [{ text: copy.photo.saveFailed }] });
        return;
      }
      add(when, name);
    },
    submit: () => {
      // Стрелка во время диктовки — закончить: задачу запишет конец диктовки, иначе она добавилась бы дважды
      if (voice.listening) {
        voice.finish();
        return;
      }
      if (when.title === '' && edit?.photo === undefined) return;
      if (edit !== null) {
        const changes = saveEdit(planner, edit, when, nowIso(), makeId);
        // Задача уехала на другой день — пропадает с глаз, поэтому плашка «Вернуть» вместо подсказки
        const undoText = editUndoText(edit, when, today);
        if (changes !== null && undoText !== null) {
          undo.commit(changes, undoText);
          setNotice(null);
        } else {
          if (changes !== null) planner.commit(changes);
          setNotice(changes === null ? null : savedHint(edit, when, today, planner.remindersOff));
        }
        finishEdit(edit);
        return;
      }
      add(when);
    },
  };
}

export type Composer = ReturnType<typeof useComposer>;
