import { router } from 'expo-router';
import { Keyboard, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AheadButton } from '@/components/ahead-button';
import { Composer } from '@/components/composer';
import { DaySheet } from '@/components/day-sheet';
import { NowCard } from '@/components/now-card';
import { PocketList } from '@/components/pocket-list';
import { RestList } from '@/components/rest-list';
import { UndoBar } from '@/components/undo-bar';
import { useComposer } from '@/hooks/use-composer';
import { useToday } from '@/hooks/use-today';
import { useUndo } from '@/hooks/use-undo';
import { copy } from '@/lib/copy';
import { formatHeaderDate } from '@/lib/dates';
import type { Task } from '@/lib/types';
import { space, text } from '@/theme';

export default function TodayScreen() {
  const day = useToday();
  const composer = useComposer();
  const undo = useUndo();
  // Правка и меню «Когда?» не открыты одновременно
  const edit = (task: Task) => {
    day.closeMove();
    composer.startEdit(task);
  };
  return (
    // Снизу отступ от системной панели даёт поле записи: при открытой клавиатуре он не нужен
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.screen} behavior="padding">
        <View style={styles.header}>
          <View style={styles.titles}>
            <Text style={text.headerDate}>{formatHeaderDate(day.today)}</Text>
            <Text style={text.title}>{copy.today.title}</Text>
          </View>
          <AheadButton count={day.aheadCount} onPress={() => router.push('/ahead')} />
        </View>
        <View style={styles.screen}>
          {/* handled — тап по кнопкам при открытой клавиатуре срабатывает с первого раза */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.content}
          >
            <NowCard
              item={day.now}
              doneCount={day.doneCount}
              editingId={composer.editingId}
              onDone={day.toggle}
              onLater={day.postpone}
              onEdit={edit}
            />
            <PocketList
              tasks={day.pocket}
              editingId={composer.editingId}
              movingId={day.moving?.id ?? null}
              onMarkDone={day.markDone}
              onWhen={(task) => {
                composer.cancelEdit();
                Keyboard.dismiss();
                day.openMove(task);
              }}
              onRemove={day.remove}
              onEdit={edit}
            />
            <RestList
              items={day.rest}
              editingId={composer.editingId}
              onToggle={day.toggle}
              onEdit={edit}
            />
          </ScrollView>
          <UndoBar
            notice={undo.notice}
            onUndo={undo.revert}
            onExpire={undo.expire}
            style={styles.undo}
          />
          {day.moving !== null && (
            <>
              {/* Тап мимо меню закрывает его */}
              <Pressable style={StyleSheet.absoluteFill} onPress={day.closeMove} />
              <DaySheet today={day.today} onPick={day.moveTo} />
            </>
          )}
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
    paddingTop: space[24],
    paddingRight: space[16],
    paddingBottom: space[16],
    paddingLeft: space[20],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: space[12],
  },
  titles: {
    flex: 1,
    minWidth: 0,
    gap: space[4],
  },
  content: {
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
});
