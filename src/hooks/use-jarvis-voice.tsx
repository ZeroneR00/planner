import { NativeModule, requireOptionalNativeModule } from 'expo';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { usePlanner } from '@/hooks/use-planner';
import {
  PHONE_VOICE,
  SPEECH_SPEED,
  VOICES,
  isVoiceId,
  percent,
  retryDelay,
  voiceUrl,
  type VoiceId,
  type VoiceState,
} from '@/lib/voices';

// Единственное место с модулем JarvisVoice: свой голос на устройстве, скачивание голосов, образцы

type VoiceEvents = {
  onProgress(event: { id: string; received: number; total: number }): void;
  onReady(event: { id: string }): void;
  onFailed(event: { id: string; message: string }): void;
};

declare class JarvisVoiceModule extends NativeModule<VoiceEvents> {
  installed(): Promise<string[]>;
  download(id: string, url: string): Promise<void>;
  cancel(id: string): void;
  load(id: string): Promise<void>;
  // сводка: длина звука, сколько записано и доиграно — для консоли dev
  speak(text: string, speed: number): Promise<string>;
  stop(): void;
  playSample(id: string): Promise<void>;
}

// Expo Go и старая сборка без модуля: свой голос молчит, отвечает голос телефона, ничего не качаем
const native = requireOptionalNativeModule<JarvisVoiceModule>('JarvisVoice');

// Какой голос загружен в движок. Модульная переменная: say() из use-reply зовут и вне React
let loaded: VoiceId | null = null;

function warn(what: string) {
  return (error: unknown) => {
    if (__DEV__) console.warn(`[свой голос] ${what}`, error);
  };
}

/** Сказать своим голосом. null — свой голос не готов, пусть говорит телефон. */
export function jarvisSpeak(text: string): Promise<string> | null {
  if (native === null || loaded === null) return null;
  return native.speak(text, SPEECH_SPEED);
}

/** Замолчать сразу: и речь, и образец. */
export function jarvisStop(): void {
  native?.stop();
}

function playSample(id: VoiceId): void {
  native?.playSample(id).catch(warn('не сыграл образец'));
}

const READY: VoiceState = { kind: 'ready' };
const NONE: VoiceState = { kind: 'none' };

function allNone(): Record<VoiceId, VoiceState> {
  return Object.fromEntries(VOICES.map((voice) => [voice.id, NONE])) as Record<VoiceId, VoiceState>;
}

type JarvisVoice = { states: Record<VoiceId, VoiceState>; playSample(id: VoiceId): void };

const JarvisVoiceContext = createContext<JarvisVoice | null>(null);

/** Держит выбранный свой голос скачанным и загруженным. Внутри PlannerProvider: выбор голоса — в настройках. */
export function JarvisVoiceProvider({ children }: { children: ReactNode }) {
  const selected = usePlanner().settings.voice;
  const [states, setStates] = useState(allNone);

  useEffect(() => {
    if (native === null) return;
    const voice = native;
    let alive = true;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const put = (id: VoiceId, state: VoiceState) => {
      if (alive) setStates((s) => ({ ...s, [id]: state }));
    };

    // Выбран голос телефона — свой молчит сразу, ничего не качаем
    const own: VoiceId | null = selected === PHONE_VOICE ? null : selected;
    if (own === null) loaded = null;

    const fetchSelected = () => {
      if (own !== null) voice.download(own, voiceUrl(own)).catch(warn('не начал скачивание'));
    };

    // В движок — только выбранный. Пока он качается, говорит прежний (загруженный свой или телефон).
    // Скачанные не удаляем (решение пользователя): вернулся к голосу — качать заново не надо
    const activate = async (id: VoiceId) => {
      if (id !== own) return;
      await voice.load(id);
      // Пока грузился, выбрали другой — говорить ему уже не нам решать
      if (alive) loaded = id;
    };

    const subscriptions = [
      voice.addListener('onProgress', (e) => {
        if (isVoiceId(e.id)) put(e.id, { kind: 'loading', percent: percent(e.received, e.total) });
      }),
      voice.addListener('onReady', (e) => {
        if (!isVoiceId(e.id)) return;
        put(e.id, READY);
        if (e.id === own) attempt = 0;
        activate(e.id).catch(warn('не загрузил голос'));
      }),
      voice.addListener('onFailed', (e) => {
        if (!isVoiceId(e.id)) return;
        put(e.id, { kind: 'waiting' });
        if (__DEV__) console.warn('[свой голос] не скачался', e.id, e.message);
        if (e.id !== own) return;
        clearTimeout(timer);
        timer = setTimeout(fetchSelected, retryDelay(attempt));
        attempt += 1;
      }),
    ];

    (async () => {
      // Связь слабая: качаем только выбранный, остальные останавливаем (кусок остаётся)
      for (const other of VOICES) if (other.id !== own) voice.cancel(other.id);
      const installed = (await voice.installed()).filter(isVoiceId);
      if (!alive) return;
      setStates((s) => {
        const next = { ...s };
        for (const { id } of VOICES) {
          if (installed.includes(id)) next[id] = READY;
          else if (id !== own) next[id] = NONE;
        }
        return next;
      });
      if (own === null) return;
      if (installed.includes(own)) await activate(own);
      else fetchSelected();
    })().catch(warn('не проверил голоса'));

    return () => {
      alive = false;
      clearTimeout(timer);
      for (const subscription of subscriptions) subscription.remove();
    };
  }, [selected]);

  return <JarvisVoiceContext value={{ states, playSample }}>{children}</JarvisVoiceContext>;
}

/** Для настроек: состояние каждого голоса и «Прослушать». */
export function useJarvisVoice(): JarvisVoice {
  const value = use(JarvisVoiceContext);
  if (value === null) throw new Error('useJarvisVoice вне JarvisVoiceProvider');
  return value;
}
