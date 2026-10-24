import { router } from 'expo-router';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AheadDays } from '@/components/ahead-days';
import { Composer } from '@/components/composer';
import { Icon } from '@/components/icon';
import { RepeatList } from '@/components/repeat-list';
import { UndoBar } from '@/components/undo-bar';
import { useAhead } from '@/hooks/use-ahead';
import { useComposer } from '@/hooks/use-composer';
import { useUndo } from '@/hooks/use-undo';
import { copy } from '@/lib/copy';
import { colors, pressedOpacity, space, text, touch } from '@/theme';

export default function AheadScreen() {
  const ahead = useAhead();
  const composer = useComposer();
  const undo = useUndo();
  return (
    // Снизу отступ от системной панели даёт поле записи: при открытой клавиатуре он не нужен
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.screen} behavior="padding">
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
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.content}
          >
            <AheadDays
              days={ahead.days}
              editingId={composer.editingId}
              onEdit={composer.startEdit}
              onRemove={ahead.remove}
            />
            <RepeatList
              rules={ahead.rules}
              editingRuleId={composer.editingRuleId}
              onEdit={composer.startRuleEdit}
              onStop={ahead.stop}
            />
          </ScrollView>
          <UndoBar
            notice={undo.notice}
            onUndo={undo.revert}
            onExpire={undo.expire}
            style={styles.undo}
          />
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
  content: {
    paddingTop: space[4],
    paddingHorizontal: space[16],
    paddingBottom: space[20],
    gap: space[24],
  },
  undo: {
    position: 'absolute',
    left: space[12],
    right: space[12],
    bottom: space[8],
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
