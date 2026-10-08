import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useSessionStore } from '../stores/useSessionStore';
import i18n from '../i18n';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { EXERCISE_LIBRARY } from '../constants/exercises';
import { Typography, Card } from '../components/ui';
import theme from '../constants/theme';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { history } = useWorkoutStore();
  const progression = useSessionStore(state => state.progression);

  // Sort history descending by date/time
  const sortedHistory = [...history].sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  // Helper to calculate duration in minutes
  const calculateDuration = (start: string, end: string): number => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMs = endTime - startTime;
    return Math.max(1, Math.round(diffMs / (1000 * 60))); // minutes
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Typography variant="title1" bold style={styles.title}>
        {t('history.title')}
      </Typography>

      {/* Aggregate Stats */}
      {progression ? (
        <Card style={styles.statsCard}>
          <View style={styles.statBox}>
            <Typography variant="title2" bold color={theme.colors.accent.primary}>
              {progression.current_streak}
            </Typography>
            <Typography variant="caption">{t('history.currentStreak')}</Typography>
          </View>
          <View style={styles.statBox}>
            <Typography variant="title2" bold color={theme.colors.accent.primary}>
              {progression.longest_streak}
            </Typography>
            <Typography variant="caption">{t('history.longestStreak')}</Typography>
          </View>
          <View style={styles.statBox}>
            <Typography variant="title2" bold color={theme.colors.accent.primary}>
              {progression.total_xp}
            </Typography>
            <Typography variant="caption">XP</Typography>
          </View>
        </Card>
      ) : null}

      {/* WORKOUT LIST */}
      {sortedHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Typography variant="body" align="center" style={{ marginBottom: theme.spacing.sm }}>
            {progression && progression.total_xp > 0 ? t('history.noHistoryDevice') : t('history.noHistory')}
          </Typography>
          <Typography variant="bodyMuted" align="center">
            {progression && progression.total_xp > 0 ? t('history.progressKept') : t('history.startFirst')}
          </Typography>
        </View>
      ) : (
        sortedHistory.map((workout, index) => {
          const duration = calculateDuration(workout.startedAt, workout.completedAt);
          const dateObj = new Date(workout.date);
          const localizedDate = dateObj.toLocaleDateString(
            i18n.language.startsWith('tr') ? 'tr-TR' : 'en-US',
            { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
          );

          return (
            <Animated.View key={workout.id} entering={FadeInUp.delay(index * 100)}>
              <Card style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <View>
                  <Typography variant="body" bold>
                    {workout.planDayName}
                  </Typography>
                  <Typography variant="caption">{localizedDate}</Typography>
                </View>
                <Typography variant="body" bold color={theme.colors.accent.primary}>
                  +{workout.xpEarned} XP
                </Typography>
              </View>

              <View style={styles.metaRow}>
                <Typography variant="caption">
                  {t('history.duration')}: {duration} {t('common.mins')}
                </Typography>
              </View>

              <View style={styles.divider} />

              {/* Exercises completed */}
              {workout.exercises.map((exCompleted) => {
                const ex = EXERCISE_LIBRARY.find((e) => e.id === exCompleted.exerciseId);
                const completedSets = exCompleted.sets.filter((s) => s.completed);
                if (completedSets.length === 0) return null;

                return (
                  <View key={exCompleted.exerciseId} style={styles.exerciseItem}>
                    <Typography variant="body" style={styles.exerciseName}>
                      {ex ? t(ex.name) : exCompleted.exerciseId}
                    </Typography>
                    <View style={styles.setsList}>
                      {completedSets.map((set, idx) => (
                        <Typography key={idx} variant="caption" style={styles.setDetail}>
                          Set {set.setNumber}:{' '}
                          {ex?.type === 'weight'
                            ? `${set.actualWeightKg}kg x ${set.actualReps} reps`
                            : `${set.actualTimeSeconds}s`}
                        </Typography>
                      ))}
                    </View>
                  </View>
                );
              })}
            </Card>
            </Animated.View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    flexGrow: 1,
    paddingBottom: theme.spacing.xxxl,
  },
  title: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xl,
  },
  statsCard: {
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
  },
  statBox: {
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.huge,
  },
  workoutCard: {
    marginBottom: theme.spacing.md,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaRow: {
    marginTop: theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.md,
  },
  exerciseItem: {
    marginBottom: theme.spacing.sm,
  },
  exerciseName: {
    fontWeight: 'bold',
  },
  setsList: {
    paddingLeft: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  setDetail: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
});
