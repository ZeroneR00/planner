import { router } from 'expo-router';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AheadDays } from '@/components/ahead-days';
import { Composer } from '@/components/composer';
import { FloatingLayer } from '@/components/floating-layer';
import { Icon } from '@/components/icon';
import { ListenCatcher } from '@/components/listen-catcher';
import { RepeatList } from '@/components/repeat-list';
import { UndoBar } from '@/components/undo-bar';
import { useAhead } from '@/hooks/use-ahead';
import { useComposer } from '@/hooks/use-composer';
import { RevealScrollContext, useFlash, useRevealScroll } from '@/hooks/use-reveal';
import { useUndo } from '@/hooks/use-undo';
import { copy } from '@/lib/copy';
import { colors, pressedOpacity, size, space, text, touch } from '@/theme';

export default function AheadScreen() {
  const ahead = useAhead();
  const composer = useComposer();
  const undo = useUndo();
  const flash = useFlash();
  const { scrollRef, reveal } = useRevealScroll();
  return (
    // Снизу отступ от системной панели даёт поле записи: при открытой клавиатуре он не нужен
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.screen} behavior="padding">
        {/* Шапка и список — вместе: во время диктовки их накрывает ListenCatcher, а поле записи — нет */}
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={copy.ahead.back}
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            >
              <Icon name="back" size={22} color={colors.text} strokeWidth={2.2} />
            </Pressable>
            <Text style={text.screenTitle}>{copy.ahead.title}</Text>
          </View>
          <View style={styles.screen}>
            <ScrollView
              ref={scrollRef}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.content}
            >
              <RevealScrollContext value={reveal}>
                <AheadDays
                  days={ahead.days}
                  editingId={composer.editingId}
                  flash={flash}
                  onEdit={composer.startEdit}
                  onRemove={ahead.remove}
                />
                <RepeatList
                  rules={ahead.rules}
                  editingRuleId={composer.editingRuleId}
                  flash={flash}
                  onEdit={composer.startRuleEdit}
                  onStop={ahead.stop}
                />
              </RevealScrollContext>
            </ScrollView>
            <FloatingLayer composer={composer}>
              <UndoBar notice={undo.notice} onUndo={undo.revert} onExpire={undo.expire} />
            </FloatingLayer>
          </View>
          <ListenCatcher composer={composer} />
        </View>
        <Composer composer={composer} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: space[18],
    paddingRight: space[16],
    paddingBottom: space[12],
    paddingLeft: space[6],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  back: {
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Снизу место под 🎙 «в воздухе»: последнюю строку можно докрутить из-под неё
  content: {
    paddingTop: space[4],
    paddingHorizontal: space[16],
    paddingBottom: size.voice + space[24],
    gap: space[24],
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
