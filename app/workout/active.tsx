import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Vibration,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeOutUp,
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useWorkoutStore } from '../../src/stores/useWorkoutStore';
import { useUserStore } from '../../src/stores/useUserStore';
import { EXERCISE_LIBRARY } from '../../src/constants/exercises';
import { Typography, Card, Button } from '../../src/components/ui';
import { Stickman } from '../../src/components/Stickman/Stickman';
import theme from '../../src/constants/theme';
import { CompletedSet } from '../../src/types';

export default function ActiveWorkoutScreen() {
  const { t } = useTranslation();
  const { activeWorkout, updateExerciseProgress, cancelWorkout } = useWorkoutStore();
  const { muscleMass } = useUserStore();

  // Timer state for static exercises (e.g. plank)
  const [activeTimerExerciseId, setActiveTimerExerciseId] = useState<string | null>(null);
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState<number>(0);
  const [exerciseTimerRunning, setExerciseTimerRunning] = useState<boolean>(false);

  // Manual Rest Timer state
  const [restDuration, setRestDuration] = useState<number>(60);
  const [restTimeLeft, setRestTimeLeft] = useState<number>(0);
  const [restTimerRunning, setRestTimerRunning] = useState<boolean>(false);
  const [showRestTimerHUD, setShowRestTimerHUD] = useState<boolean>(false);

  // Static hold exercise timer effect
  useEffect(() => {
    let interval: any = null;
    if (exerciseTimerRunning && exerciseTimeLeft > 0) {
      interval = setInterval(() => {
        setExerciseTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (exerciseTimeLeft === 0 && exerciseTimerRunning) {
      setExerciseTimerRunning(false);
      Vibration.vibrate([0, 500, 110, 500]);
      Alert.alert('Time Up! ⏱️', 'Your static hold is complete!');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [exerciseTimerRunning, exerciseTimeLeft]);

  // Rest Timer effect
  useEffect(() => {
    let interval: any = null;
    if (restTimerRunning && restTimeLeft > 0) {
      interval = setInterval(() => {
        setRestTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (restTimeLeft === 0 && restTimerRunning) {
      setRestTimerRunning(false);
      Vibration.vibrate([0, 500, 150, 500]);
      Alert.alert('Rest Completed! 💪', t('workout.restDone'));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [restTimerRunning, restTimeLeft, t]);

  if (!activeWorkout) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="body">No active workout found.</Typography>
        <Button
          title={t('common.back')}
          onPress={() => router.replace('/')}
          style={{ marginTop: theme.spacing.md }}
        />
      </View>
    );
  }

  // Calculate overall workout completion progress
  const allSets = activeWorkout.exercises.flatMap((e) => e.sets);
  const completedSetsCount = allSets.filter((s) => s.completed).length;
  const totalSetsCount = allSets.length;
  const progressRatio = totalSetsCount > 0 ? completedSetsCount / totalSetsCount : 0;

  // Animated Progress Bar
  const animatedProgress = useSharedValue(progressRatio);

  useEffect(() => {
    animatedProgress.value = withSpring(progressRatio, { damping: 20, stiffness: 90 });
  }, [progressRatio]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value * 100}%`,
    };
  });

  const handleToggleSet = (exerciseId: string, setIdx: number) => {
    const exProgress = activeWorkout.exercises.find((ex) => ex.exerciseId === exerciseId);
    if (!exProgress) return;

    const nextSets = [...exProgress.sets];
    const isNowCompleted = !nextSets[setIdx].completed;
    nextSets[setIdx] = {
      ...nextSets[setIdx],
      completed: isNowCompleted,
    };

    updateExerciseProgress(exerciseId, nextSets);
  };

  const handleStartExerciseTimer = (exerciseId: string, timeSeconds: number) => {
    setActiveTimerExerciseId(exerciseId);
    setExerciseTimeLeft(timeSeconds);
    setExerciseTimerRunning(true);
  };

  const handleStopExerciseTimer = () => {
    setExerciseTimerRunning(false);
  };

  // Rest Timer handlers (Manual)
  const handleStartRestTimer = (seconds: number) => {
    setRestDuration(seconds);
    setRestTimeLeft(seconds);
    setRestTimerRunning(true);
    setShowRestTimerHUD(true);
  };

  const handleCancelWorkout = () => {
    Alert.alert(t('common.cancel'), 'Are you sure you want to discard your current workout progress?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          cancelWorkout();
          router.replace('/');
        },
      },
    ]);
  };

  const handleFinishWorkout = () => {
    router.push('/workout/summary');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header bar with stickman */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Typography variant="label" bold color={theme.colors.accent.primary}>
            {t('workout.activeWorkout')}
          </Typography>
          <Typography variant="title1" bold style={{ marginTop: 2 }}>
            {activeWorkout.planDay.name}
          </Typography>
          <Typography variant="caption" color={theme.colors.text.secondary} style={{ textTransform: 'capitalize' }}>
            {activeWorkout.planDay.muscleGroups.map((g) => t(`muscleGroups.${g}`)).join(', ')}
          </Typography>
        </View>

        {/* Live Stickman working out */}
        <View style={styles.stickmanAvatar}>
          <Stickman muscleMass={muscleMass} isWorkingOut={true} width={80} height={95} />
        </View>
      </View>

      {/* Progress Bar Card */}
      <Card style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Typography variant="caption" bold color={theme.colors.text.primary}>
            {completedSetsCount} / {totalSetsCount} {t('common.sets')} {t('common.done').toLowerCase()}
          </Typography>
          <Typography variant="caption" bold color={theme.colors.accent.primary}>
            {Math.round(progressRatio * 100)}%
          </Typography>
        </View>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, progressStyle]} />
        </View>
      </Card>

      {/* REST TIMER SECTION (MANUAL TRIGGER) */}
      {!showRestTimerHUD ? (
        <Animated.View entering={FadeInDown}>
          <Card style={styles.manualRestBar}>
            <View style={styles.restBarContent}>
              <View style={{ flex: 1 }}>
                <Typography variant="body" bold color={theme.colors.text.primary}>
                  {t('workout.restTimer')}
                </Typography>
                <Typography variant="caption" color={theme.colors.text.secondary}>
                  Select duration to begin rest countdown
                </Typography>
              </View>
              <View style={styles.restPresetRow}>
                {[30, 60, 90, 120].map((sec) => (
                  <TouchableOpacity
                    key={sec}
                    style={styles.restPresetBtn}
                    onPress={() => handleStartRestTimer(sec)}
                  >
                    <Typography variant="caption" bold color={theme.colors.accent.primary}>
                      {sec}s
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>
        </Animated.View>
      ) : (
        /* ACTIVE REST TIMER HUD */
        <Animated.View entering={FadeInDown} exiting={FadeOutUp}>
          <Card variant="elevated" style={styles.restTimerHUD}>
            <View style={styles.restTimerHUDHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="timer-sand" size={20} color={theme.colors.accent.primary} />
                <Typography variant="caption" bold color={theme.colors.accent.primary} style={{ marginLeft: 6 }}>
                  {t('workout.restTimeRemaining')}
                </Typography>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setRestTimerRunning(false);
                  setShowRestTimerHUD(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="close" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Typography variant="display" align="center" style={styles.restTimerDisplay}>
              {Math.floor(restTimeLeft / 60)}:{String(restTimeLeft % 60).padStart(2, '0')}
            </Typography>

            <View style={styles.restControlsRow}>
              {restTimerRunning ? (
                <Button
                  title="Pause"
                  variant="outline"
                  style={styles.restControlBtn}
                  onPress={() => setRestTimerRunning(false)}
                />
              ) : (
                <Button
                  title={restTimeLeft === 0 ? 'Restart' : 'Resume'}
                  style={styles.restControlBtn}
                  onPress={() => {
                    if (restTimeLeft === 0) setRestTimeLeft(restDuration);
                    setRestTimerRunning(true);
                  }}
                />
              )}

              <Button
                title={t('workout.add30s')}
                variant="secondary"
                style={styles.restControlBtn}
                onPress={() => setRestTimeLeft((prev) => prev + 30)}
              />

              <Button
                title="Skip"
                variant="secondary"
                style={styles.restControlBtn}
                onPress={() => {
                  setRestTimerRunning(false);
                  setShowRestTimerHUD(false);
                }}
              />
            </View>
          </Card>
        </Animated.View>
      )}

      {/* STATIC EXERCISE TIMER HUD (IF ACTIVE) */}
      {activeTimerExerciseId !== null && (
        <Animated.View entering={FadeInDown} exiting={FadeOutUp}>
          <Card variant="elevated" style={styles.timerCard}>
            <Typography variant="label" bold color={theme.colors.accent.primary}>
              {t('workout.timeRemaining')}
            </Typography>
            <Typography variant="display" align="center" style={styles.timerText}>
              {Math.floor(exerciseTimeLeft / 60)}:{String(exerciseTimeLeft % 60).padStart(2, '0')}
            </Typography>
            <View style={styles.btnRow}>
              {exerciseTimerRunning ? (
                <Button title="Pause" variant="outline" style={styles.flexBtn} onPress={handleStopExerciseTimer} />
              ) : (
                <Button
                  title={exerciseTimeLeft === 0 ? 'Restart' : 'Resume'}
                  style={styles.flexBtn}
                  onPress={() => {
                    if (exerciseTimeLeft === 0) {
                      const ex = EXERCISE_LIBRARY.find((e) => e.id === activeTimerExerciseId);
                      setExerciseTimeLeft(ex?.defaultTimeSeconds || 60);
                    }
                    setExerciseTimerRunning(true);
                  }}
                />
              )}
              <Button
                title="Close"
                variant="secondary"
                style={styles.flexBtn}
                onPress={() => {
                  setExerciseTimerRunning(false);
                  setActiveTimerExerciseId(null);
                }}
              />
            </View>
          </Card>
        </Animated.View>
      )}

      {/* EXERCISE LIST */}
      {activeWorkout.exercises.map((exProgress, index) => {
        const ex = EXERCISE_LIBRARY.find((e) => e.id === exProgress.exerciseId);
        if (!ex) return null;

        const isExFullyCompleted = exProgress.sets.every((s) => s.completed);

        return (
          <Animated.View key={ex.id} entering={FadeInUp.delay(index * 150).springify()}>
            <Card
              style={[styles.exCard, isExFullyCompleted && styles.exCardCompleted]}
            >
              <View style={styles.exHeader}>
                <View style={{ flex: 1 }}>
                  <Typography variant="title2" bold color={theme.colors.text.primary}>
                    {t(ex.name)}
                  </Typography>
                  <Typography variant="caption" color={theme.colors.accent.primary}>
                    {t(`muscleGroups.${ex.muscleGroup}`)}
                  </Typography>
                </View>

                {isExFullyCompleted && (
                  <Animated.View entering={FadeInUp} style={styles.completedBadge}>
                    <MaterialCommunityIcons name="check-all" size={16} color={theme.colors.status.success} />
                    <Typography variant="caption" bold color={theme.colors.status.success} style={{ marginLeft: 4 }}>
                      {t('common.done')}
                    </Typography>
                  </Animated.View>
                )}
              </View>

              {/* Set Lines */}
              {exProgress.sets.map((set, setIdx) => {
                const planEx = activeWorkout.planDay.exercises.find((p) => p.exerciseId === ex.id);
                const planSet = planEx?.sets[setIdx];

                return (
                  <View
                    key={setIdx}
                    style={[styles.setRow, set.completed && styles.setRowCompleted]}
                  >
                    <View style={styles.setLeft}>
                      <View style={[styles.setNumCircle, set.completed && styles.setNumCircleCompleted]}>
                        <Typography
                          variant="caption"
                          bold
                          color={set.completed ? theme.colors.text.inverse : theme.colors.text.primary}
                        >
                          {set.setNumber}
                        </Typography>
                      </View>

                      <View>
                        {ex.type === 'weight' ? (
                          <Typography
                            variant="body"
                            style={[
                              styles.setDetailsText,
                              set.completed && styles.setDetailsTextCompleted,
                            ]}
                          >
                            {planSet?.targetWeightKg ?? set.actualWeightKg ?? 0} kg ×{' '}
                            {planSet?.targetReps ?? set.actualReps ?? 10} {t('common.reps')}
                          </Typography>
                        ) : (
                          <Typography
                            variant="body"
                            style={[
                              styles.setDetailsText,
                              set.completed && styles.setDetailsTextCompleted,
                            ]}
                          >
                            {planSet?.targetTimeSeconds ?? set.actualTimeSeconds ?? 60} {t('common.secs')}
                          </Typography>
                        )}
                      </View>
                    </View>

                    <View style={styles.setRight}>
                      {/* Timer trigger for static hold */}
                      {ex.type === 'time' && (
                        <TouchableOpacity
                          style={styles.timerBtn}
                          onPress={() =>
                            handleStartExerciseTimer(
                              ex.id,
                              planSet?.targetTimeSeconds || 60
                            )
                          }
                        >
                          <MaterialCommunityIcons name="timer-outline" size={18} color={theme.colors.accent.primary} />
                        </TouchableOpacity>
                      )}

                      {/* Completion Checkbox */}
                      <TouchableOpacity
                        style={[styles.checkBtn, set.completed && styles.checkBtnCompleted]}
                        onPress={() => {
                          Vibration.vibrate(10); // Light haptic feedback
                          handleToggleSet(ex.id, setIdx);
                        }}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name={set.completed ? 'check' : 'checkbox-blank-outline'}
                          size={22}
                          color={set.completed ? theme.colors.text.inverse : theme.colors.text.secondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </Card>
          </Animated.View>
        );
      })}

      {/* BOTTOM ACTIONS */}
      <View style={[styles.btnRow, { marginTop: theme.spacing.xl }]}>
        <Button
          title={t('common.cancel')}
          variant="secondary"
          style={styles.flexBtn}
          onPress={handleCancelWorkout}
        />
        <Button
          title={t('workout.finishWorkout')}
          style={styles.flexBtn}
          onPress={handleFinishWorkout}
        />
      </View>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  stickmanAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent.primary,
  },
  manualRestBar: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderColor: theme.colors.border,
  },
  restBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restPresetRow: {
    flexDirection: 'row',
    gap: 6,
  },
  restPresetBtn: {
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  restTimerHUD: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1.5,
    borderColor: theme.colors.accent.primary,
  },
  restTimerHUDHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restTimerDisplay: {
    fontSize: 48,
    color: theme.colors.accent.primary,
    marginVertical: theme.spacing.sm,
  },
  restControlsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  restControlBtn: {
    flex: 1,
    height: 40,
  },
  timerCard: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  timerText: {
    fontSize: theme.typography.fontSize.display,
    marginVertical: theme.spacing.md,
    color: theme.colors.accent.primary,
  },
  exCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  exCardCompleted: {
    borderColor: theme.colors.status.success,
    opacity: 0.9,
  },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  setRowCompleted: {
    opacity: 0.7,
  },
  setLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  setNumCircleCompleted: {
    backgroundColor: theme.colors.status.success,
  },
  setDetailsText: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  setDetailsTextCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.secondary,
  },
  setRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  checkBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  checkBtnCompleted: {
    backgroundColor: theme.colors.status.success,
    borderColor: theme.colors.status.success,
  },
  btnRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  flexBtn: {
    flex: 1,
  },
});
