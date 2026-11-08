import { router, usePathname } from 'expo-router';
import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { HostInstance, ScrollViewInstance } from 'react-native';

import { usePlanner } from '@/hooks/use-planner';
import { useReminderTaps } from '@/hooks/use-reminders';
import { reminderTarget } from '@/lib/reminders';
import { space } from '@/theme';

/** Что подсветить: id задачи или правила. key меняется на каждый тап — рамка мигает заново. */
export type Flash = { id: string; key: number };

// Сколько держим подсветку: рамка успевает мигнуть три раза
const FLASH_MS = 2000;

const FlashContext = createContext<Flash | null>(null);

/** Экран отдаёт сюда, как прокрутить к подсвеченной строке; строка зовёт, когда встала на место. */
export const RevealScrollContext = createContext<((node: HostInstance) => void) | null>(null);

/** Тап по напоминанию: переход на экран задачи и подсветка. */
export function RevealProvider({ children }: { children: ReactNode }) {
  const planner = usePlanner();
  const pathname = usePathname();
  const [flash, setFlash] = useState<Flash | null>(null);
  const latest = useRef({ planner, pathname });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const taps = useRef(0);

  useEffect(() => {
    latest.current = { planner, pathname };
  }, [planner, pathname]);
  useEffect(() => () => clearTimeout(timer.current), []);

  useReminderTaps((reminderId) => {
    const target = reminderTarget(reminderId, latest.current.planner);
    if (target === null) return;
    // «Впереди» открывается только поверх «Сегодня», поэтому назад — это всегда «Сегодня»
    const onAhead = latest.current.pathname === '/ahead';
    if (target.screen === 'today' && onAhead) router.back();
    if (target.screen === 'ahead' && !onAhead) router.push('/ahead');
    taps.current += 1;
    setFlash({ id: target.id, key: taps.current });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(null), FLASH_MS);
  });

  return <FlashContext value={flash}>{children}</FlashContext>;
}

export function useFlash(): Flash | null {
  return use(FlashContext);
}

/** Для экрана со списком: ref на прокрутку и функция «докрутить до строки». */
export function useRevealScroll() {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const reveal = useCallback((node: HostInstance) => {
    const scroll = scrollRef.current;
    const content = scroll?.getInnerViewRef();
    if (scroll == null || content == null) return;
    // Строка чуть ниже верха экрана, а не впритык
    node.measureLayout(content, (_x, y) => scroll.scrollTo({ y: Math.max(0, y - space[24]), animated: true }));
  }, []);
  return { scrollRef, reveal };
}
