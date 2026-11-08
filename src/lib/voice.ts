import type { Hint } from '@/lib/composer';
import { copy } from '@/lib/copy';

export type VoiceError = 'notHeard' | 'noAccess' | 'offline' | 'failed';

// Система обрывает запись почти сразу после последнего слова — заканчиваем сами:
// столько ждём первых слов после тапа и столько — тишины после последнего слова
export const START_WAIT_MS = 6000;
export const SILENCE_MS = 3000;

/** Сказанное целиком: готовые куски речи и тот, что ещё распознаётся. */
export function spokenText(segments: readonly string[], partial: string): string {
  return [...segments, partial]
    .map((s) => s.trim())
    .filter((s) => s !== '')
    .join(' ');
}

/** Код ошибки распознавания → что сказать человеку; null — молчим (прервали сами). */
export function voiceError(code: string): VoiceError | null {
  switch (code) {
    case 'aborted':
      return null;
    case 'no-speech':
    case 'speech-timeout':
      return 'notHeard';
    case 'not-allowed':
      return 'noAccess';
    case 'network':
      return 'offline';
    default:
      return 'failed';
  }
}

/**
 * Ошибка, на которой запись просто закончилась: тишина или что угодно после нашего «хватит».
 * Сказанное тогда записывается как обычно, а не застревает в поле.
 */
export function endsSpeech(code: string, stopping: boolean): boolean {
  return stopping || voiceError(code) === 'notHeard';
}

export function voiceHint(error: VoiceError): Hint {
  return { accent: false, parts: [{ text: copy.voice[error] }] };
}

export const listeningHint: Hint = { accent: false, parts: [{ text: copy.voice.listening }] };

// Громкость приходит от −2 до 10
const LEVEL_MIN = -2;
const LEVEL_MAX = 10;

/** Громкость голоса → 0…1 для пульсации кнопки. */
export function micLevel(value: number): number {
  const level = (value - LEVEL_MIN) / (LEVEL_MAX - LEVEL_MIN);
  return Math.min(Math.max(level, 0), 1);
}
