import { usePlanner } from '@/hooks/use-planner';
import { nowIso } from '@/lib/dates';
import {
  markDoneFromPocket,
  moveToToday,
  postpone,
  removeTask,
  toggleDone,
} from '@/lib/task-actions';
import { todayView } from '@/lib/today-view';
import type { Task } from '@/lib/types';

/** Экран «Сегодня»: что показать и что можно сделать. */
export function useToday() {
  const planner = usePlanner();
  // nowIso() — в обработчиках: нужно время нажатия, а не рендера
  return {
    today: planner.today,
    ...todayView(planner),
    toggle: (task: Task) => planner.commit(toggleDone(task, nowIso())),
    postpone: (task: Task) => planner.commit(postpone(planner, task, nowIso())),
    moveToToday: (task: Task) => planner.commit(moveToToday(planner, task, nowIso())),
    markDone: (task: Task) => planner.commit(markDoneFromPocket(planner, task, nowIso())),
    remove: (task: Task) => planner.commit(removeTask(task)),
  };
}
