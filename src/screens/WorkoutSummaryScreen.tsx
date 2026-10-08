import React, { useRef, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useUserStore } from '../stores/useUserStore';
import { EXERCISE_LIBRARY } from '../constants/exercises';
import { Typography, Card, Button } from '../components/ui';
import theme from '../constants/theme';
import { CompletedExercise, CompletedSet, CompletedWorkout } from '../types';
import { calculateLevel } from '../constants/gamification';
import { getTodayDateString } from '../utils/dateUtils';
import { getRepository } from '../data/repositories';
import { LevelUpModal } from '../components/LevelUpModal';
import { useCosmeticStore } from '../stores/useCosmeticStore';
import { useEmberStore } from '../stores/useEmberStore';
import { useZoneStore } from '../stores/useZoneStore';
import type { WorkoutNavigationProp } from '../navigation/types';
import { useSessionStore } from '../stores/useSessionStore';
import { usePriorityStore } from '../stores/usePriorityStore';
import { buildCompletionExercises, completionErrorKey, createIdempotencyKey } from '../utils/completionPayload';
import { sessionStartedAtForSave } from '../utils/sessionClock';

export default function WorkoutSummaryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<WorkoutNavigationProp>();
  const { activeWorkout, finishWorkout, history } = useWorkoutStore();
  const userStore = useUserStore();

  // Keep local copies of the active workout exercises so users can adjust them before saving
  const [exercises, setExercises] = useState<CompletedExercise[]>(() => {
    return activeWorkout ? JSON.parse(JSON.stringify(activeWorkout.exercises)) : [];
  });

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ prev: 1, new: 1 });
  const [isSaving, setIsSaving] = useState(false);
  const idempotencyKey = useRef(createIdempotencyKey());

  if (!activeWorkout) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="body">No active workout to summarize.</Typography>
        <Button title={t('common.back')} onPress={() => navigation.replace('Tabs')} style={{ marginTop: theme.spacing.md }} />
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
    const beforeParts = useSessionStore.getState().progression?.body_parts ?? [];
    const lines = buildCompletionExercises(exercises);
    if (lines.length === 0) {
      Alert.alert(t('common.error'), t('auth.errors.workout_too_small'));
      setIsSaving(false);
      return;
    }

    const startedAt = sessionStartedAtForSave(activeWorkout.startedAt);
    useWorkoutStore.getState().alignSessionStart(startedAt);
    const { result, error } = await useSessionStore.getState().completeWorkout(
      idempotencyKey.current,
      startedAt,
      lines,
    );
    if (error || !result) {
      Alert.alert(t('common.error'), t(`auth.errors.${completionErrorKey(error ?? 'request_failed')}`));
      setIsSaving(false);
      return;
    }

    const xpEarned = result.awarded.reduce((sum, award) => sum + award.xp, 0);
    const leveled = result.progression.body_parts.filter(part => {
      const previous = beforeParts.find(item => item.body_part_id === part.body_part_id);
      return previous != null && part.level > previous.level;
    });
    
    userStore.setStreak(result.progression.current_streak);
    userStore.updateLastWorkoutDate(result.progression.last_completed_on ?? todayStr);

    if (result.duplicate) {
      Alert.alert(t('auth.alreadySaved'), t('auth.errors.request_failed'), [
        { text: t('common.ok'), onPress: () => navigation.replace('Tabs') },
      ]);
      return;
    }

    const completedWorkout = finishWorkout(exercises, xpEarned);

    const drop = useCosmeticStore.getState().grantDrop();
    const dropLine = t('workout.cosmeticDrop', { name: t(`cosmetic.${drop}`) });
    const embersEarned = useEmberStore.getState().earnFromWorkout();
    const emberLine = t('workout.embersEarned', { count: embersEarned });
    const firstKeptDay = !history.some((workout) => workout.date === completedWorkout.date);
    const keptDayBonus = firstKeptDay && useEmberStore.getState().rollKeptDayBonus();
    const keptDayLine = keptDayBonus ? t('workout.keptDayBonus') : '';
    const pinned = usePriorityStore.getState().pinnedZone;
    const zoneGain = pinned ? useZoneStore.getState().addPinnedWorkoutXp(pinned) : null;
    const zoneLine = pinned && zoneGain
      ? t('workout.zoneXp', { zone: t(`zones.${pinned}`), xp: zoneGain.xpGained })
      : '';
    const levelLine = leveled
      .map(part => t('auth.partLevel', { part: t(`body.${part.body_part_id}`), level: part.level }))
      .join('\n');

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
        [t('workout.xpEarned', { xp: xpEarned }), t('auth.streakNow', { count: result.progression.current_streak }), levelLine, zoneLine, dropLine, emberLine, keptDayLine]
          .filter(Boolean)
          .join('\n'),
        [{ text: t('common.ok'), onPress: () => navigation.replace('Tabs') }]
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
          onPress={() => navigation.goBack()}
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
          navigation.replace('Tabs');
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
