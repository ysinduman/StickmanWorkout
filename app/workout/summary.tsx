import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useWorkoutStore } from '../../src/stores/useWorkoutStore';
import { useUserStore } from '../../src/stores/useUserStore';
import { usePlanStore } from '../../src/stores/usePlanStore';
import { EXERCISE_LIBRARY } from '../../src/constants/exercises';
import { Typography, Card, Button } from '../../src/components/ui';
import theme from '../../src/constants/theme';
import { CompletedExercise, CompletedSet, CompletedWorkout } from '../../src/types';
import { calculateWorkoutXP, calculateLevel } from '../../src/constants/gamification';
import { getTodayDateString } from '../../src/utils/dateUtils';
import { calculateCurrentStreak } from '../../src/utils/streakCalculator';
import { getRepository } from '../../src/data/repositories';
import { LevelUpModal } from '../../src/components/LevelUpModal';

export default function WorkoutSummaryScreen() {
  const { t } = useTranslation();
  const { activeWorkout, finishWorkout, history } = useWorkoutStore();
  const userStore = useUserStore();
  const planStore = usePlanStore();

  // Keep local copies of the active workout exercises so users can adjust them before saving
  const [exercises, setExercises] = useState<CompletedExercise[]>(() => {
    return activeWorkout ? JSON.parse(JSON.stringify(activeWorkout.exercises)) : [];
  });

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ prev: 1, new: 1 });
  const [isSaving, setIsSaving] = useState(false);

  if (!activeWorkout) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="body">No active workout to summarize.</Typography>
        <Button title={t('common.back')} onPress={() => router.replace('/')} style={{ marginTop: theme.spacing.md }} />
      </View>
    );
  }

  const handleAdjustWeight = (exId: string, setIdx: number, delta: number) => {
    const nextExs = [...exercises];
    const ex = nextExs.find((e) => e.exerciseId === exId);
    if (ex) {
      ex.sets[setIdx].actualWeightKg = Math.max(0, (ex.sets[setIdx].actualWeightKg || 0) + delta);
      setExercises(nextExs);
    }
  };

  const handleAdjustReps = (exId: string, setIdx: number, delta: number) => {
    const nextExs = [...exercises];
    const ex = nextExs.find((e) => e.exerciseId === exId);
    if (ex) {
      ex.sets[setIdx].actualReps = Math.max(1, (ex.sets[setIdx].actualReps || 0) + delta);
      setExercises(nextExs);
    }
  };

  const handleAdjustTime = (exId: string, setIdx: number, delta: number) => {
    const nextExs = [...exercises];
    const ex = nextExs.find((e) => e.exerciseId === exId);
    if (ex) {
      ex.sets[setIdx].actualTimeSeconds = Math.max(10, (ex.sets[setIdx].actualTimeSeconds || 0) + delta);
      setExercises(nextExs);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    // 1. Calculate stats and rewards
    const completedSetsCount = exercises.reduce(
      (acc, curr) => acc + curr.sets.filter((s) => s.completed).length,
      0
    );

    // If no sets completed, alert
    if (completedSetsCount === 0) {
      Alert.alert(t('common.error'), 'Please complete at least one set before saving.');
      setIsSaving(false);
      return;
    }

    const previousLevel = userStore.level;
    const todayStr = getTodayDateString();

    // 2. Add XP (uses the current streak before it is potentially reset by this workout)
    const xpEarned = userStore.addXP(completedSetsCount);
    
    // 3. Save completed workout record to store and DB
    const completedWorkout = finishWorkout(exercises, xpEarned);

    // 4. Update streak logic properly considering rest days
    const newHistory = [...history, completedWorkout];
    const newStreak = calculateCurrentStreak(planStore.activePlan, newHistory);
    userStore.setStreak(newStreak);
    userStore.updateLastWorkoutDate(todayStr);

    try {
      const repo = getRepository();
      // Save completed workout to local AsyncStorage repo
      await repo.saveWorkout(completedWorkout);
      // Save updated user profile
      await repo.saveUserProfile(userStore.getProfile());
    } catch (err) {
      console.warn('Error saving to repository:', err);
    }

    // 4. Check for Level Up
    const newLevel = calculateLevel(userStore.xp + xpEarned);
    if (newLevel > previousLevel) {
      setLevelUpData({ prev: previousLevel, new: newLevel });
      setShowLevelUp(true);
      setIsSaving(false); // Can be reset since modal is now visible
    } else {
      Alert.alert(
        t('workout.greatJob'),
        t('workout.xpEarned', { xp: xpEarned }),
        [{ text: t('common.ok'), onPress: () => router.replace('/') }]
      );
      // Don't reset isSaving because we are navigating away, to prevent extra clicks during navigation
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Typography variant="title1" bold align="center">
          {t('workout.summary')}
        </Typography>
        <Typography variant="title2" align="center" style={{ marginTop: theme.spacing.sm }}>
          {t('workout.summaryQuestion')}
        </Typography>
        <Typography variant="bodyMuted" align="center" style={{ marginTop: theme.spacing.xs }}>
          {t('workout.adjustValues')}
        </Typography>
      </View>

      {/* RENDER AND ADJUST SETS */}
      {exercises.map((exProgress) => {
        const ex = EXERCISE_LIBRARY.find((e) => e.id === exProgress.exerciseId);
        if (!ex) return null;

        // Only show if the user actually completed at least one set of this exercise
        const completedSets = exProgress.sets.filter((s) => s.completed);
        if (completedSets.length === 0) return null;

        return (
          <Card key={ex.id} style={styles.exCard}>
            <Typography variant="body" bold color={theme.colors.accent.primary}>
              {t(ex.name)}
            </Typography>

            {exProgress.sets.map((set, setIdx) => {
              if (!set.completed) return null;

              return (
                <View key={setIdx} style={styles.setAdjustmentRow}>
                  <Typography variant="caption" style={styles.setNum}>
                    Set {set.setNumber}
                  </Typography>

                  <View style={styles.controlsRow}>
                    {ex.type === 'weight' ? (
                      <>
                        {/* Weight adjustment */}
                        <View style={styles.controlGroup}>
                          <Button title="-" style={styles.miniBtn} onPress={() => handleAdjustWeight(ex.id, setIdx, -2.5)} />
                          <Typography variant="body" style={styles.controlVal}>
                            {set.actualWeightKg}kg
                          </Typography>
                          <Button title="+" style={styles.miniBtn} onPress={() => handleAdjustWeight(ex.id, setIdx, 2.5)} />
                        </View>

                        {/* Reps adjustment */}
                        <View style={[styles.controlGroup, { marginLeft: theme.spacing.md }]}>
                          <Button title="-" style={styles.miniBtn} onPress={() => handleAdjustReps(ex.id, setIdx, -1)} />
                          <Typography variant="body" style={styles.controlVal}>
                            {set.actualReps}
                          </Typography>
                          <Button title="+" style={styles.miniBtn} onPress={() => handleAdjustReps(ex.id, setIdx, 1)} />
                        </View>
                      </>
                    ) : (
                      /* Time adjustment */
                      <View style={styles.controlGroup}>
                        <Button title="-" style={styles.miniBtn} onPress={() => handleAdjustTime(ex.id, setIdx, -5)} />
                        <Typography variant="body" style={styles.controlVal}>
                          {set.actualTimeSeconds}s
                        </Typography>
                        <Button title="+" style={styles.miniBtn} onPress={() => handleAdjustTime(ex.id, setIdx, 5)} />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </Card>
        );
      })}

      <View style={styles.btnRow}>
        <Button
          title={t('common.cancel')}
          variant="secondary"
          style={styles.flexBtn}
          onPress={() => router.back()}
          disabled={isSaving}
        />
        <Button 
          title={isSaving ? t('common.loading') : t('workout.saveWorkout')} 
          style={styles.flexBtn} 
          onPress={handleSave} 
          disabled={isSaving} 
        />
      </View>

      <LevelUpModal
        visible={showLevelUp}
        previousLevel={levelUpData.prev}
        newLevel={levelUpData.new}
        onClose={() => {
          setShowLevelUp(false);
          router.replace('/');
        }}
      />
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  exCard: {
    marginBottom: theme.spacing.md,
  },
  setAdjustmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    paddingBottom: theme.spacing.sm,
  },
  setNum: {
    fontWeight: 'bold',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  controlVal: {
    width: 55,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: 'bold',
  },
  miniBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 0,
  },
  btnRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xxl,
  },
  flexBtn: {
    flex: 1,
  },
});
