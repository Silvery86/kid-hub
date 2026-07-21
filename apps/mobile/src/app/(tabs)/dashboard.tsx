import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { useGrades } from '@/hooks/use-grades';
import { useSchedule } from '@/hooks/use-schedule';
import { useTodayHomework } from '@/hooks/use-homework';

// Overview tab: a few live counts pulled from the three domain queries, plus
// a sign-out affordance so the refresh/gate flow is exercisable end to end.
export default function DashboardScreen() {
  const { signOut } = useAuth();
  const homework = useTodayHomework();
  const schedule = useSchedule();
  const grades = useGrades();

  const doneCount = homework.data?.filter((h) => h.isDone).length ?? 0;
  const totalHomework = homework.data?.length ?? 0;
  const periodCount = schedule.data?.schoolPeriods.length ?? 0;
  const average = grades.data?.averageScore;

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-neutral-950"
      contentContainerClassName="gap-4 p-5">
      <Text className="text-2xl font-bold text-neutral-900 dark:text-white">Today</Text>

      <View className="flex-row gap-3">
        <StatCard label="Homework" value={`${doneCount}/${totalHomework}`} />
        <StatCard label="Classes" value={String(periodCount)} />
        <StatCard
          label="Average"
          value={average === undefined ? '—' : average.toFixed(1)}
        />
      </View>

      <Text className="mt-2 text-lg font-bold text-neutral-900 dark:text-white">Trò chơi</Text>
      <View className="flex-row gap-3">
        <GameEntry href="/math" emoji="🧮" title="Toán Học" accent="bg-blue-600" />
        <GameEntry href="/english" emoji="🔤" title="Tiếng Anh" accent="bg-emerald-600" />
      </View>

      <Pressable
        className="mt-2 items-center rounded-xl border border-neutral-300 py-3 dark:border-neutral-700"
        onPress={signOut}
        testID="sign-out">
        <Text className="font-semibold text-red-500">Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

// Games launch in landscape (OrientationLock); these are the entry points.
function GameEntry({
  href,
  emoji,
  title,
  accent,
}: {
  href: '/math' | '/english';
  emoji: string;
  title: string;
  accent: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        testID={`game-entry-${title}`}
        className={`flex-1 gap-2 rounded-2xl p-4 active:opacity-90 ${accent}`}>
        <Text style={{ fontSize: 32 }}>{emoji}</Text>
        <Text className="text-lg font-black text-white">{title}</Text>
        <Text className="text-xs font-bold text-white/85">Chơi ngay →</Text>
      </Pressable>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 gap-1 rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-900">
      <Text className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</Text>
      <Text className="text-xs text-neutral-500 dark:text-neutral-400">{label}</Text>
    </View>
  );
}
