import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler } from 'react-native';

import { usePlanner } from '@/hooks/use-planner';
import { useUndo } from '@/hooks/use-undo';
import { copy } from '@/lib/copy';
import { formatDayBrief, nowIso } from '@/lib/dates';
import {
  markDoneFromPocket,
  moveToDay,
  postpone,
  removeTask,
  toggleDone,
} from '@/lib/task-actions';
import { todayView } from '@/lib/today-view';
import type { Task } from '@/lib/types';

/** Экран «Сегодня»: что показать и что можно сделать. */
export function useToday() {
  const planner = usePlanner();
  const undo = useUndo();
  // Стикер, для которого открыто меню «Когда?»
  const [moving, setMoving] = useState<Task | null>(null);

  // «Назад» при открытом меню закрывает меню, а не приложение
  useFocusEffect(
    useCallback(() => {
      if (moving === null) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setMoving(null);
        return true;
      });
      return () => sub.remove();
    }, [moving]),
  );

  // nowIso() — в обработчиках: нужно время нажатия, а не рендера
  return {
    today: planner.today,
    ...todayView(planner),
    toggle: (task: Task) => planner.commit(toggleDone(task, nowIso())),
    postpone: (task: Task) => planner.commit(postpone(planner, task, nowIso())),
    markDone: (task: Task) =>
      undo.commit(markDoneFromPocket(planner, task, nowIso()), copy.undo.done(task.title)),
    remove: (task: Task) => undo.commit(removeTask(task), copy.undo.removed(task.title)),
    moving,
    // Повторный тап по «Когда?» того же стикера закрывает меню
    openMove: (task: Task) => setMoving((current) => (current?.id === task.id ? null : task)),
    closeMove: () => setMoving(null),
    moveTo: (date: string) => {
      if (moving === null) return;
      const text = copy.undo.moved(formatDayBrief(date, planner.today), moving.title);
      undo.commit(moveToDay(planner, moving, date, nowIso()), text);
      setMoving(null);
    },
  };
}
