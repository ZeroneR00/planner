import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { copy } from '@/lib/copy';
import { space, text } from '@/theme';

export default function TodayScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={text.title}>{copy.today.title}</Text>
      </View>
      <View style={styles.content}>
        <Text style={text.emptyTitle}>{copy.today.empty}</Text>
        <Text style={text.mono}>{copy.today.doneCount(0)}</Text>
      </View>
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
  },
  content: {
    paddingHorizontal: space[16],
    gap: space[8],
  },
});
