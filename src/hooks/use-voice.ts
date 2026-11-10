import { requireOptionalNativeModule } from 'expo';
import type { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import {
  endsSpeech,
  micLevel,
  SILENCE_MS,
  spokenText,
  START_WAIT_MS,
  voiceError,
  type VoiceError,
} from '@/lib/voice';

// Единственное место с expo-speech-recognition. Что говорить при ошибке — решает voice.ts.

// В Expo Go нативной части нет, и импорт пакета падает на старте, — поэтому берём модуль напрямую:
// в Expo Go здесь null, и кнопки микрофона просто нет
const speech = requireOptionalNativeModule<typeof ExpoSpeechRecognitionModule>('ExpoSpeechRecognition');

type Handlers = {
  onText(text: string): void; // услышанное по ходу
  onFinal(text: string): void; // закончили — фраза целиком
  onError(error: VoiceError): void;
};

export type Voice = {
  available: boolean;
  listening: boolean;
  level: SharedValue<number>; // громкость 0…1 — для пульсации кнопки
  toggle(): void;
  finish(): void; // закончить раньше — сказанное записывается
  abort(): void; // прервать — сказанное остаётся в поле
};

/** Диктовка: касание — слушаем, замолчал — фраза готова; тап по экрану — закончить раньше. */
export function useVoice(handlers: Handlers): Voice {
  const [listening, setListening] = useState(false);
  const level = useSharedValue(0);
  // Модуль один на приложение, а полей записи два («Сегодня» и «Впереди») —
  // события берёт только то, которое начало слушать
  const activeRef = useRef(false);
  // Запись идёт кусками: система закрывает кусок на каждой паузе, а слушать продолжает
  const segmentsRef = useRef<string[]>([]);
  const partialRef = useRef('');
  const shownRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Сказали «хватит» (тишина или тап) — дальше любая ошибка означает просто конец записи
  const stoppingRef = useRef(false);

  const stop = () => {
    stoppingRef.current = true;
    speech?.stop();
  };

  const stopIn = (ms: number) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(stop, ms);
  };

  const reset = useCallback(() => {
    activeRef.current = false;
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    setListening(false);
    level.set(0);
  }, [level]);

  const onResult = useEffectEvent((text: string, isFinal: boolean) => {
    if (!activeRef.current) return;
    if (isFinal) {
      segmentsRef.current.push(text);
      partialRef.current = '';
    } else {
      partialRef.current = text;
    }
    const shown = spokenText(segmentsRef.current, partialRef.current);
    if (shown === shownRef.current) return;
    // Новые слова — тишина отсчитывается заново
    shownRef.current = shown;
    stopIn(SILENCE_MS);
    handlers.onText(shown);
  });

  const onVolume = useEffectEvent((value: number) => {
    if (activeRef.current) level.set(micLevel(value));
  });

  // Конец — по тишине, по тапу или сама система закончила (Android 12 и старше): отдаём всё сказанное
  const finish = () => {
    const text = spokenText(segmentsRef.current, partialRef.current);
    reset();
    if (text === '') handlers.onError('notHeard');
    else handlers.onFinal(text);
  };

  // После своего abort() слушатель уже не активен — ошибки «прервано» не доходят.
  // Сеть оборвалась посреди фразы — текст остаётся в поле: дописать и отправить стрелкой
  const onError = useEffectEvent((code: string) => {
    if (!activeRef.current) return;
    if (endsSpeech(code, stoppingRef.current)) {
      finish();
      return;
    }
    reset();
    const error = voiceError(code);
    if (error !== null) handlers.onError(error);
  });

  const onEnd = useEffectEvent(() => {
    if (activeRef.current) finish();
  });

  const abort = useCallback(() => {
    if (!activeRef.current) return;
    reset();
    speech?.abort();
  }, [reset]);

  const abortOnUnmount = useEffectEvent(abort);

  useEffect(() => {
    if (speech === null) return;
    const subs = [
      speech.addListener('result', (e) => onResult(e.results[0]?.transcript ?? '', e.isFinal)),
      speech.addListener('volumechange', (e) => onVolume(e.value)),
      speech.addListener('error', (e) => onError(e.error)),
      speech.addListener('end', () => onEnd()),
    ];
    return () => {
      subs.forEach((sub) => sub.remove());
      abortOnUnmount();
    };
  }, []);

  const start = async () => {
    if (speech === null) return;
    if (!speech.isRecognitionAvailable()) {
      handlers.onError('failed');
      return;
    }
    // Слушатель активен уже на время вопроса о разрешении: тап по полю в это время отменит старт
    activeRef.current = true;
    const permission = await speech.requestPermissionsAsync();
    if (!activeRef.current) return;
    if (!permission.granted) {
      activeRef.current = false;
      // Система больше не спрашивает — открываем настройки приложения
      if (!permission.canAskAgain) void Linking.openSettings();
      handlers.onError('noAccess');
      return;
    }
    segmentsRef.current = [];
    partialRef.current = '';
    shownRef.current = '';
    stoppingRef.current = false;
    setListening(true);
    // Офлайн не требуем: без скачанного языкового пакета это ошибка, а есть пакет — Google возьмёт его сам.
    // continuous — система не обрывает запись на паузе, конец по тишине считаем сами (Android 13+)
    speech.start({
      lang: 'ru-RU',
      interimResults: true,
      continuous: true,
      volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
    });
    stopIn(START_WAIT_MS);
  };

  return {
    available: speech !== null,
    listening,
    level,
    toggle: () => {
      if (activeRef.current) stop();
      else void start();
    },
    finish: () => {
      if (activeRef.current) stop();
    },
    abort,
  };
}
