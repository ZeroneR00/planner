import { copy } from '@/lib/copy';
import { dateParts, formatDayMonth, formatTime, localDate, localTime } from '@/lib/dates';

/** «Версия 1.0.0» или «Версия 1.0.0 · обновление 16 ноября, 15:40» — для низа «Настроек». */
export function versionLabel(version: string, updatedAt: Date | null): string {
  if (!updatedAt) return copy.settings.version(version);
  const { month, day } = dateParts(localDate(updatedAt));
  const when = `${formatDayMonth(month, day)}, ${formatTime(localTime(updatedAt))}`;
  return copy.settings.versionUpdated(version, when);
}
