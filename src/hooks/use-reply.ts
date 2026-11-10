import { requireOptionalNativeModule } from 'expo';
import { useCallback } from 'react';
import { Linking } from 'react-native';

import { usePlanner } from '@/hooks/use-planner';

// Единственное место с expo-speech. Что сказать — решает reply.ts.

type Speech = typeof import('expo-speech');

// Сборка без модуля (Expo Go, старая сборка) не должна падать на импорте — пакет грузим,
// только если нативная часть в ней есть
const native = requireOptionalNativeModule('ExpoSpeech');
let speech: Promise<Speech> | null = null;

function load(): Promise<Speech> | null {
  if (native === null) return null;
  speech ??= import('expo-speech');
  return speech;
}

/** Сказать сразу, оборвав прошлую фразу. Ошибки молча: ответ голосом — не главное. */
export function say(text: string): void {
  load()
    ?.then(async (s) => {
      await s.stop();
      s.speak(text, { language: 'ru-RU' });
    })
    .catch((error: unknown) => {
      if (__DEV__) console.warn('[голос] не сказал', error);
    });
}

/** Замолчать: перед записью голоса, иначе распознавание услышит само себя. */
export function hush(): void {
  load()
    ?.then((s) => s.stop())
    .catch((error: unknown) => {
      if (__DEV__) console.warn('[голос] не замолчал', error);
    });
}

/** Системные настройки синтеза речи: голос, скорость. Не вышло — настройки приложения. */
export function openSpeechSettings(): void {
  Linking.sendIntent('com.android.settings.TTS_SETTINGS').catch(() => Linking.openSettings());
}

/** say, только если в настройках «Отвечать голосом». */
export function useReply(): { reply(text: string): void; hush(): void } {
  const on = usePlanner().settings.voiceReplies;
  const reply = useCallback(
    (text: string) => {
      if (on) say(text);
    },
    [on],
  );
  return { reply, hush };
}
