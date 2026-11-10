// Настройки в базе — строки «ключ — значение»: новая настройка без миграции

export type Settings = { voiceReplies: boolean };

export const DEFAULT_SETTINGS: Settings = { voiceReplies: true };

export type SettingRow = { key: string; value: string };

const KEYS: Record<keyof Settings, string> = { voiceReplies: 'voice_replies' };

function parseFlag(value: string): boolean | null {
  if (value === '1') return true;
  if (value === '0') return false;
  return null;
}

/** Строки таблицы settings → настройки. Нет строки, чужой ключ, битое значение — по умолчанию. */
export function settingsFromRows(rows: readonly SettingRow[]): Settings {
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key !== KEYS.voiceReplies) continue;
    const flag = parseFlag(row.value);
    if (flag !== null) settings.voiceReplies = flag;
  }
  return settings;
}

/** Только переданные поля. Ключи — snake_case: voiceReplies → 'voice_replies', значения '1' / '0'. */
export function settingsToRows(patch: Partial<Settings>): SettingRow[] {
  const rows: SettingRow[] = [];
  if (patch.voiceReplies !== undefined) {
    rows.push({ key: KEYS.voiceReplies, value: patch.voiceReplies ? '1' : '0' });
  }
  return rows;
}
