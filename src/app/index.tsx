import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AheadButton } from '@/components/ahead-button';
import { NowCard } from '@/components/now-card';
import { PocketList } from '@/components/pocket-list';
import { RestList } from '@/components/rest-list';
import { useToday } from '@/hooks/use-today';
import { copy } from '@/lib/copy';
import { formatHeaderDate } from '@/lib/dates';
import { space, text } from '@/theme';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const day = useToday();
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text style={text.headerDate}>{formatHeaderDate(day.today)}</Text>
          <Text style={text.title}>{copy.today.title}</Text>
        </View>
        <AheadButton count={day.aheadCount} onPress={() => router.push('/ahead')} />
      </View>
      {/* Нижний отступ — с учётом системной панели: экран рисуется под ней (edge-to-edge) */}
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: space[20] + insets.bottom }]}>
        <NowCard item={day.now} doneCount={day.doneCount} onDone={day.toggle} onLater={day.postpone} />
        <PocketList
          tasks={day.pocket}
          onMarkDone={day.markDone}
          onToToday={day.moveToToday}
          onRemove={day.remove}
        />
        <RestList items={day.rest} onToggle={day.toggle} />
      </ScrollView>
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
    gap: space[24],
  },
});
