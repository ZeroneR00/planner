// Настройки в базе — строки «ключ — значение»: новая настройка без миграции

import { isThemeChoice, type ThemeChoice } from '@/lib/theme-choice';
import { DEFAULT_VOICE, isVoiceChoice, type VoiceChoice } from '@/lib/voices';

export type Settings = { voiceReplies: boolean; voice: VoiceChoice; theme: ThemeChoice };

export const DEFAULT_SETTINGS: Settings = {
  voiceReplies: true,
  voice: DEFAULT_VOICE,
  theme: 'system',
};

export type SettingRow = { key: string; value: string };

const KEYS: Record<keyof Settings, string> = {
  voiceReplies: 'voice_replies',
  voice: 'voice',
  theme: 'theme',
};

function parseFlag(value: string): boolean | null {
  if (value === '1') return true;
  if (value === '0') return false;
  return null;
}

/** Строки таблицы settings → настройки. Нет строки, чужой ключ, битое значение — по умолчанию. */
export function settingsFromRows(rows: readonly SettingRow[]): Settings {
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key === KEYS.voiceReplies) {
      const flag = parseFlag(row.value);
      if (flag !== null) settings.voiceReplies = flag;
    } else if (row.key === KEYS.voice) {
      if (isVoiceChoice(row.value)) settings.voice = row.value;
    } else if (row.key === KEYS.theme) {
      if (isThemeChoice(row.value)) settings.theme = row.value;
    }
  }
  return settings;
}

/** Только переданные поля. Ключи — snake_case: voiceReplies → 'voice_replies', флаги '1' / '0', голос и тема — id. */
export function settingsToRows(patch: Partial<Settings>): SettingRow[] {
  const rows: SettingRow[] = [];
  if (patch.voiceReplies !== undefined) {
    rows.push({ key: KEYS.voiceReplies, value: patch.voiceReplies ? '1' : '0' });
  }
  if (patch.voice !== undefined) rows.push({ key: KEYS.voice, value: patch.voice });
  if (patch.theme !== undefined) rows.push({ key: KEYS.theme, value: patch.theme });
  return rows;
}
