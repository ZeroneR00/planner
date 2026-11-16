import { requireOptionalNativeModule } from 'expo';
import { useCallback } from 'react';

import { jarvisSpeak, jarvisStop } from '@/hooks/use-jarvis-voice';
import { usePlanner } from '@/hooks/use-planner';

// Говорит свой голос Джарвиса; пока он не скачан или не смог — голос телефона через expo-speech
// (единственное место с ним). Что сказать — решает reply.ts.

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

function phoneSay(text: string): void {
  load()
    ?.then(async (s) => {
      await s.stop();
      s.speak(text, { language: 'ru-RU' });
    })
    .catch((error: unknown) => {
      if (__DEV__) console.warn('[голос] не сказал', error);
    });
}

function phoneStop(): void {
  load()
    ?.then((s) => s.stop())
    .catch((error: unknown) => {
      if (__DEV__) console.warn('[голос] не замолчал', error);
    });
}

/** Сказать сразу, оборвав прошлую фразу. Ошибки молча: ответ голосом — не главное. */
export function say(text: string): void {
  const own = jarvisSpeak(text);
  if (own === null) {
    jarvisStop();
    phoneSay(text);
    return;
  }
  phoneStop();
  own.then(
    (summary) => {
      if (__DEV__) console.log('[свой голос]', summary);
    },
    (error: unknown) => {
      if (__DEV__) console.warn('[голос] свой голос не сказал', error);
      phoneSay(text);
    },
  );
}

/** Сказать голосом телефона, даже если свой готов: «Прослушать» у голоса телефона в настройках. */
export function sayWithPhone(text: string): void {
  jarvisStop();
  phoneSay(text);
}

/** Замолчать: перед записью голоса, иначе распознавание услышит само себя. */
export function hush(): void {
  jarvisStop();
  phoneStop();
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
