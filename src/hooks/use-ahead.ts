import { usePlanner } from '@/hooks/use-planner';
import { useUndo } from '@/hooks/use-undo';
import { aheadView } from '@/lib/ahead-view';
import { copy } from '@/lib/copy';
import { nowIso } from '@/lib/dates';
import { shownTitle } from '@/lib/photo';
import { removeTask, stopRule } from '@/lib/task-actions';
import type { Rule, Task } from '@/lib/types';

/** Экран «Впереди»: что показать и что можно сделать. */
export function useAhead() {
  const planner = usePlanner();
  const undo = useUndo();
  return {
    today: planner.today,
    ...aheadView(planner),
    remove: (task: Task) => undo.commit(removeTask(task), copy.undo.removed(shownTitle(task))),
    stop: (rule: Rule) => undo.commit(stopRule(planner, rule, nowIso()), copy.undo.stopped(shownTitle(rule))),
  };
}
