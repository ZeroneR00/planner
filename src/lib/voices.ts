// Свои голоса Джарвиса: Piper ru_RU в int8 из релиза sherpa-onnx — по ~20 МБ на голос

export type VoiceId = 'ruslan' | 'dmitri' | 'denis' | 'irina';

/** Порядок — как в списке настроек. */
export const VOICES: readonly { id: VoiceId; male: boolean }[] = [
  { id: 'ruslan', male: true },
  { id: 'dmitri', male: true },
  { id: 'denis', male: true },
  { id: 'irina', male: false },
];

/** Системный синтезатор телефона — тоже выбор в списке (решение пользователя). */
export const PHONE_VOICE = 'phone';

export type VoiceChoice = VoiceId | typeof PHONE_VOICE;

export const DEFAULT_VOICE: VoiceChoice = 'ruslan';

/** Скорость речи своего голоса: 1 — как записан диктор. */
export const SPEECH_SPEED = 1.0;

export function isVoiceId(value: string): value is VoiceId {
  return VOICES.some((voice) => voice.id === value);
}

export function isVoiceChoice(value: string): value is VoiceChoice {
  return value === PHONE_VOICE || isVoiceId(value);
}

// Шипит — поменять «-int8» на «-fp16» (34 МБ): это только адрес, сборка не нужна
export function voiceUrl(id: VoiceId): string {
  return `https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-ru_RU-${id}-medium-int8.tar.bz2`;
}

/** Пауза перед повтором скачивания: 5 с, 15 с, дальше раз в минуту. */
export function retryDelay(attempt: number): number {
  if (attempt <= 0) return 5000;
  if (attempt === 1) return 15000;
  return 60000;
}

/** Сколько скачано, целым процентом 0…100. Размер неизвестен — 0. */
export function percent(received: number, total: number): number {
  if (total <= 0 || received <= 0) return 0;
  return Math.min(100, Math.floor((received / total) * 100));
}

export type VoiceState =
  | { kind: 'ready' }
  | { kind: 'loading'; percent: number }
  | { kind: 'waiting' }
  | { kind: 'none' };
