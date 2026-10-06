import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { usePlanStore } from '../stores/usePlanStore';
import { EXERCISE_LIBRARY } from '../constants/exercises';
import { Typography, Card, Button } from '../components/ui';
import theme from '../constants/theme';
import {
  WorkoutPlan,
  PlanDay,
  DayOfWeek,
  MuscleGroup,
  PlannedSet,
} from '../types';
import { getRepository } from '../data/repositories';

type FormStep = 'type_select' | 'split_days' | 'full_body_rest' | 'exercise_select' | 'set_targets';

export default function PlannerScreen() {
  const { t } = useTranslation();
  const { storedPlan, setPlan, updatePlan, deletePlan, levelUpPlan } = usePlanStore();

  // Mode & step state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [step, setStep] = useState<FormStep>('type_select');
  const [planType, setPlanType] = useState<'split' | 'fullBody'>('split');

  // Full Body Configuration
  const [restDaysBetween, setRestDaysBetween] = useState<number>(1);
  const [selectedFullBodyExercises, setSelectedFullBodyExercises] = useState<string[]>([]);
  const [fullBodyTargets, setFullBodyTargets] = useState<Record<string, PlannedSet[]>>({});

  // Split Configuration
  const [splitDays, setSplitDays] = useState<Record<DayOfWeek, MuscleGroup[]>>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });
  const [currentSplitDayForConfig, setCurrentSplitDayForConfig] = useState<DayOfWeek>('monday');
  const [selectedSplitExercises, setSelectedSplitExercises] = useState<Record<DayOfWeek, string[]>>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });
  const [splitTargets, setSplitTargets] = useState<Record<string, PlannedSet[]>>({}); // Key: "day_exerciseId"

  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const muscleGroups: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];

  // Start editing existing plan
  const handleStartEdit = () => {
    if (!storedPlan) return;
    const plan = storedPlan.plan;

    if (plan.type === 'split') {
      setPlanType('split');

      const loadedSplitDays: Record<DayOfWeek, MuscleGroup[]> = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      };
      const loadedSelectedSplitExercises: Record<DayOfWeek, string[]> = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      };
      const loadedSplitTargets: Record<string, PlannedSet[]> = {};

      days.forEach((day) => {
        const planDayId = plan.schedule[day];
        if (planDayId) {
          const wd = plan.workoutDays.find((d) => d.id === planDayId);
          if (wd) {
            loadedSplitDays[day] = [...wd.muscleGroups];
            loadedSelectedSplitExercises[day] = wd.exercises.map((e) => e.exerciseId);
            wd.exercises.forEach((e) => {
              loadedSplitTargets[`${day}_${e.exerciseId}`] = JSON.parse(JSON.stringify(e.sets));
            });
          }
        }
      });

      setSplitDays(loadedSplitDays);
      setSelectedSplitExercises(loadedSelectedSplitExercises);
      setSplitTargets(loadedSplitTargets);

      const firstActive = days.find((d) => loadedSplitDays[d].length > 0) || 'monday';
      setCurrentSplitDayForConfig(firstActive);
      setStep('set_targets');
    } else {
      setPlanType('fullBody');
      setRestDaysBetween(plan.restDaysBetween);
      setSelectedFullBodyExercises(plan.workoutDay.exercises.map((e) => e.exerciseId));

      const loadedFullBodyTargets: Record<string, PlannedSet[]> = {};
      plan.workoutDay.exercises.forEach((e) => {
        loadedFullBodyTargets[e.exerciseId] = JSON.parse(JSON.stringify(e.sets));
      });
      setFullBodyTargets(loadedFullBodyTargets);
      setStep('set_targets');
    }

    setIsEditing(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setStep('type_select');
  };

  // Handle plan deletion
  const handleDelete = () => {
    Alert.alert(t('planner.deletePlan'), t('planner.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          deletePlan();
          try {
            await getRepository().deletePlan();
          } catch (err) {
            console.warn('Error deleting plan:', err);
          }
          setIsEditing(false);
          setStep('type_select');
        },
      },
    ]);
  };

  // Level Up Plan (Bumps all weights globally)
  const handleLevelUp = async () => {
    Alert.alert(t('home.levelUpPlan'), t('planner.levelUpConfirm', { percentage: 5 }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        onPress: async () => {
          levelUpPlan(5);
          const current = usePlanStore.getState().storedPlan;
          if (current) {
            try {
              await getRepository().savePlan(current.plan);
            } catch (err) {
              console.warn('Error saving leveled plan:', err);
            }
          }
          Alert.alert(t('common.success'), t('planner.levelUpSuccess', { percentage: 5 }));
        },
      },
    ]);
  };

  // Initialize targets helper
  const initializeTargetsForExercise = (
    exerciseId: string,
    customKey: string,
    currentTargets: Record<string, PlannedSet[]>
  ) => {
    if (currentTargets[customKey] && currentTargets[customKey].length > 0) return currentTargets;
    const exercise = EXERCISE_LIBRARY.find((e) => e.id === exerciseId);
    if (!exercise) return currentTargets;

    const defaultSets = exercise.defaultSets || 3;
    const setsArray: PlannedSet[] = Array.from({ length: defaultSets }, (_, index) => ({
      setNumber: index + 1,
      targetReps: exercise.defaultReps ?? 10,
      targetWeightKg: exercise.defaultWeightKg ?? 20,
      targetTimeSeconds: exercise.defaultTimeSeconds ?? 60,
    }));

    return {
      ...currentTargets,
      [customKey]: setsArray,
    };
  };

  // Add a set to an exercise
  const handleAddSet = (exerciseId: string, customKey: string, isSplit: boolean) => {
    const currentSets = isSplit ? splitTargets[customKey] || [] : fullBodyTargets[exerciseId] || [];
    const ex = EXERCISE_LIBRARY.find((e) => e.id === exerciseId);

    const lastSet = currentSets[currentSets.length - 1];
    const newSet: PlannedSet = {
      setNumber: currentSets.length + 1,
      targetReps: lastSet?.targetReps ?? ex?.defaultReps ?? 10,
      targetWeightKg: lastSet?.targetWeightKg ?? ex?.defaultWeightKg ?? 20,
      targetTimeSeconds: lastSet?.targetTimeSeconds ?? ex?.defaultTimeSeconds ?? 60,
    };

    const nextSets = [...currentSets, newSet];

    if (isSplit) {
      setSplitTargets((prev) => ({ ...prev, [customKey]: nextSets }));
    } else {
      setFullBodyTargets((prev) => ({ ...prev, [exerciseId]: nextSets }));
    }
  };

  // Remove a set from an exercise
  const handleRemoveSet = (exerciseId: string, customKey: string, setIndex: number, isSplit: boolean) => {
    const currentSets = isSplit ? splitTargets[customKey] || [] : fullBodyTargets[exerciseId] || [];
    if (currentSets.length <= 1) {
      Alert.alert(t('common.error'), 'Each exercise must have at least one set.');
      return;
    }

    const nextSets = currentSets
      .filter((_, i) => i !== setIndex)
      .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

    if (isSplit) {
      setSplitTargets((prev) => ({ ...prev, [customKey]: nextSets }));
    } else {
      setFullBodyTargets((prev) => ({ ...prev, [exerciseId]: nextSets }));
    }
  };

  // Update a single set field value
  const handleUpdateSetValue = (
    exerciseId: string,
    customKey: string,
    setIndex: number,
    field: 'targetWeightKg' | 'targetReps' | 'targetTimeSeconds',
    value: number,
    isSplit: boolean
  ) => {
    const currentSets = isSplit ? splitTargets[customKey] || [] : fullBodyTargets[exerciseId] || [];
    const nextSets = currentSets.map((s, idx) => {
      if (idx !== setIndex) return s;
      return {
        ...s,
        [field]: value,
      };
    });

    if (isSplit) {
      setSplitTargets((prev) => ({ ...prev, [customKey]: nextSets }));
    } else {
      setFullBodyTargets((prev) => ({ ...prev, [exerciseId]: nextSets }));
    }
  };

  // Save the constructed or edited plan
  const handleSavePlan = async () => {
    let finalPlan: WorkoutPlan;

    if (planType === 'fullBody') {
      if (selectedFullBodyExercises.length === 0) {
        Alert.alert(t('common.error'), t('planner.selectExercises'));
        return;
      }

      const workoutDay: PlanDay = {
        id: 'full_body_workout',
        name: t('planner.workoutName', { number: 1 }),
        muscleGroups: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'],
        exercises: selectedFullBodyExercises.map((exerciseId) => ({
          exerciseId,
          sets: fullBodyTargets[exerciseId] || [],
        })),
      };

      finalPlan = {
        type: 'fullBody',
        restDaysBetween,
        workoutDay,
      };
    } else {
      // Split Plan
      const workoutDays: PlanDay[] = [];
      const schedule: Record<DayOfWeek, string | null> = {
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null,
      };

      let workoutCounter = 1;

      days.forEach((day) => {
        const mGroups = splitDays[day];
        const exIds = selectedSplitExercises[day];

        if (mGroups.length > 0 && exIds.length > 0) {
          const planDayId = `split_workout_${day}`;
          workoutDays.push({
            id: planDayId,
            name: t('planner.workoutName', { number: workoutCounter++ }),
            muscleGroups: mGroups,
            exercises: exIds.map((exerciseId) => ({
              exerciseId,
              sets: splitTargets[`${day}_${exerciseId}`] || [],
            })),
          });
          schedule[day] = planDayId;
        }
      });

      if (workoutDays.length === 0) {
        Alert.alert(t('common.error'), 'Please assign muscle groups and exercises to at least one day.');
        return;
      }

      finalPlan = {
        type: 'split',
        schedule,
        workoutDays,
      };
    }

    if (isEditing) {
      updatePlan(finalPlan);
    } else {
      setPlan(finalPlan);
    }

    try {
      await getRepository().savePlan(finalPlan);
    } catch (err) {
      console.warn('Error saving plan to repository:', err);
    }

    setIsEditing(false);
    Alert.alert(t('common.success'), t('planner.planSaved'));
  };

  // Helper for rendering target sets of an exercise
  const renderExerciseTargetCard = (
    exerciseId: string,
    customKey: string,
    isSplit: boolean
  ) => {
    const ex = EXERCISE_LIBRARY.find((e) => e.id === exerciseId);
    if (!ex) return null;

    const sets = isSplit ? splitTargets[customKey] || [] : fullBodyTargets[exerciseId] || [];

    return (
      <Card key={customKey} style={styles.exerciseTargetCard}>
        {/* Exercise Header */}
        <View style={styles.targetCardHeader}>
          <View style={{ flex: 1 }}>
            <Typography variant="body" bold color={theme.colors.text.primary}>
              {t(ex.name)}
            </Typography>
            <Typography variant="caption" color={theme.colors.accent.primary}>
              {t(`muscleGroups.${ex.muscleGroup}`)}
            </Typography>
          </View>
          <View style={styles.setCountBadge}>
            <Typography variant="label" bold color={theme.colors.accent.primary}>
              {sets.length} {t('common.sets')}
            </Typography>
          </View>
        </View>

        {/* Set Rows */}
        {sets.map((set, setIdx) => (
          <View key={setIdx} style={styles.setRowCard}>
            <View style={styles.setRowTop}>
              <View style={styles.setNumBadge}>
                <Typography variant="caption" bold color={theme.colors.text.primary}>
                  SET {set.setNumber}
                </Typography>
              </View>

              {sets.length > 1 && (
                <TouchableOpacity
                  onPress={() => handleRemoveSet(exerciseId, customKey, setIdx, isSplit)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.trashBtn}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.status.error} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.setInputsRow}>
              {ex.type === 'weight' ? (
                <>
                  {/* Weight Input */}
                  <View style={styles.inputColumn}>
                    <Typography variant="caption" style={styles.fieldLabel}>
                      {t('planner.targetWeight')}
                    </Typography>
                    <View style={styles.stepperInputGroup}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() =>
                          handleUpdateSetValue(
                            exerciseId,
                            customKey,
                            setIdx,
                            'targetWeightKg',
                            Math.max(0, (set.targetWeightKg || 0) - 2.5),
                            isSplit
                          )
                        }
                      >
                        <MaterialCommunityIcons name="minus" size={16} color={theme.colors.text.primary} />
                      </TouchableOpacity>

                      <View style={styles.numInputWrapper}>
                        <TextInput
                          style={styles.numInput}
                          keyboardType="decimal-pad"
                          value={String(set.targetWeightKg ?? 0)}
                          onChangeText={(text) => {
                            const cleaned = text.replace(/[^0-9.]/g, '');
                            handleUpdateSetValue(
                              exerciseId,
                              customKey,
                              setIdx,
                              'targetWeightKg',
                              cleaned === '' ? 0 : parseFloat(cleaned),
                              isSplit
                            );
                          }}
                          selectTextOnFocus
                        />
                        <Typography variant="caption" style={styles.inputSuffix}>
                          kg
                        </Typography>
                      </View>

                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() =>
                          handleUpdateSetValue(
                            exerciseId,
                            customKey,
                            setIdx,
                            'targetWeightKg',
                            (set.targetWeightKg || 0) + 2.5,
                            isSplit
                          )
                        }
                      >
                        <MaterialCommunityIcons name="plus" size={16} color={theme.colors.text.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Reps Input */}
                  <View style={styles.inputColumn}>
                    <Typography variant="caption" style={styles.fieldLabel}>
                      {t('planner.targetReps')}
                    </Typography>
                    <View style={styles.stepperInputGroup}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() =>
                          handleUpdateSetValue(
                            exerciseId,
                            customKey,
                            setIdx,
                            'targetReps',
                            Math.max(1, (set.targetReps || 0) - 1),
                            isSplit
                          )
                        }
                      >
                        <MaterialCommunityIcons name="minus" size={16} color={theme.colors.text.primary} />
                      </TouchableOpacity>

                      <View style={styles.numInputWrapper}>
                        <TextInput
                          style={styles.numInput}
                          keyboardType="number-pad"
                          value={String(set.targetReps ?? 1)}
                          onChangeText={(text) => {
                            const cleaned = text.replace(/[^0-9]/g, '');
                            handleUpdateSetValue(
                              exerciseId,
                              customKey,
                              setIdx,
                              'targetReps',
                              cleaned === '' ? 1 : parseInt(cleaned, 10),
                              isSplit
                            );
                          }}
                          selectTextOnFocus
                        />
                        <Typography variant="caption" style={styles.inputSuffix}>
                          {t('common.reps')}
                        </Typography>
                      </View>

                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() =>
                          handleUpdateSetValue(
                            exerciseId,
                            customKey,
                            setIdx,
                            'targetReps',
                            (set.targetReps || 0) + 1,
                            isSplit
                          )
                        }
                      >
                        <MaterialCommunityIcons name="plus" size={16} color={theme.colors.text.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                /* Time Input */
                <View style={[styles.inputColumn, { flex: 1 }]}>
                  <Typography variant="caption" style={styles.fieldLabel}>
                    {t('planner.targetTime')}
                  </Typography>
                  <View style={styles.stepperInputGroup}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() =>
                        handleUpdateSetValue(
                          exerciseId,
                          customKey,
                          setIdx,
                          'targetTimeSeconds',
                          Math.max(5, (set.targetTimeSeconds || 0) - 5),
                          isSplit
                        )
                      }
                    >
                      <MaterialCommunityIcons name="minus" size={16} color={theme.colors.text.primary} />
                    </TouchableOpacity>

                    <View style={styles.numInputWrapper}>
                      <TextInput
                        style={styles.numInput}
                        keyboardType="number-pad"
                        value={String(set.targetTimeSeconds ?? 60)}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/[^0-9]/g, '');
                          handleUpdateSetValue(
                            exerciseId,
                            customKey,
                            setIdx,
                            'targetTimeSeconds',
                            cleaned === '' ? 5 : parseInt(cleaned, 10),
                            isSplit
                          );
                        }}
                        selectTextOnFocus
                      />
                      <Typography variant="caption" style={styles.inputSuffix}>
                        {t('common.secs')}
                      </Typography>
                    </View>

                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() =>
                        handleUpdateSetValue(
                          exerciseId,
                          customKey,
                          setIdx,
                          'targetTimeSeconds',
                          (set.targetTimeSeconds || 0) + 5,
                          isSplit
                        )
                      }
                    >
                      <MaterialCommunityIcons name="plus" size={16} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}

        {/* Add Set Button */}
        <TouchableOpacity
          style={styles.addSetBtn}
          onPress={() => handleAddSet(exerciseId, customKey, isSplit)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={18} color={theme.colors.accent.primary} />
          <Typography variant="caption" bold color={theme.colors.accent.primary} style={{ marginLeft: theme.spacing.xs }}>
            {t('planner.addSet')} (Set {sets.length + 1})
          </Typography>
        </TouchableOpacity>
      </Card>
    );
  };

  // Helper for Top Step Breadcrumb Navigation
  const renderStepIndicator = () => {
    const stepList: { key: FormStep; label: string }[] = [
      { key: 'type_select', label: t('planner.steps.type') },
      {
        key: planType === 'split' ? 'split_days' : 'full_body_rest',
        label: planType === 'split' ? t('planner.steps.days') : t('planner.steps.rest'),
      },
      { key: 'exercise_select', label: t('planner.steps.exercises') },
      { key: 'set_targets', label: t('planner.steps.targets') },
    ];

    const currentStepIndex = stepList.findIndex(
      (s) =>
        s.key === step ||
        (step === 'full_body_rest' && s.key === 'split_days') ||
        (step === 'split_days' && s.key === 'full_body_rest')
    );

    return (
      <View style={styles.stepIndicatorContainer}>
        {stepList.map((item, index) => {
          const isActive = index === currentStepIndex;
          const isPassed = index < currentStepIndex;

          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.stepBadge,
                isActive && styles.stepBadgeActive,
                isPassed && styles.stepBadgePassed,
              ]}
              onPress={() => {
                // Allow jumping to visited steps or any step in edit mode
                if (isEditing || isPassed) {
                  setStep(item.key);
                }
              }}
              disabled={!isEditing && !isPassed}
            >
              <Typography
                variant="caption"
                bold
                color={isActive ? theme.colors.accent.primary : isPassed ? theme.colors.text.secondary : theme.colors.text.tertiary}
              >
                {index + 1}. {item.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // ──── RENDER EXISTING PLAN (VIEW MODE) ────
  if (storedPlan && !isEditing) {
    const plan = storedPlan.plan;

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Card variant="elevated" style={styles.planCard}>
          <View style={styles.headerRow}>
            <View>
              <Typography variant="title2" bold>
                {plan.type === 'split' ? t('planner.split') : t('planner.fullBody')}
              </Typography>
              <Typography variant="caption" color={theme.colors.text.secondary}>
                {t('planner.title')}
              </Typography>
            </View>
            <View style={styles.planIconBadge}>
              <MaterialCommunityIcons
                name={plan.type === 'split' ? 'chart-gantt' : 'weight-lifter'}
                size={26}
                color={theme.colors.accent.primary}
              />
            </View>
          </View>

          <Typography variant="bodyMuted" style={{ marginTop: theme.spacing.sm }}>
            {plan.type === 'split'
              ? 'Program: ' +
                Object.entries((plan as any).schedule)
                  .filter(([_, v]) => v !== null)
                  .map(([k, _]) => t(`days.${k}`))
                  .join(', ')
              : `${plan.restDaysBetween} ${t('planner.restDaysBetween').toLowerCase()}`}
          </Typography>

          <View style={styles.divider} />

          {plan.type === 'split' ? (
            plan.workoutDays.map((wd) => (
              <View key={wd.id} style={styles.workoutDaySummary}>
                <View style={styles.summaryDayHeader}>
                  <Typography variant="body" bold color={theme.colors.accent.primary}>
                    {wd.name}
                  </Typography>
                  <Typography variant="caption" color={theme.colors.text.secondary}>
                    ({wd.muscleGroups.map((g) => t(`muscleGroups.${g}`)).join(', ')})
                  </Typography>
                </View>

                {wd.exercises.map((ex) => {
                  const exDetails = EXERCISE_LIBRARY.find((e) => e.id === ex.exerciseId);
                  return (
                    <View key={ex.exerciseId} style={styles.summaryExerciseRow}>
                      <Typography variant="caption" bold style={styles.exerciseSummaryItem}>
                        • {exDetails ? t(exDetails.name) : ex.exerciseId}
                      </Typography>
                      <Typography variant="caption" color={theme.colors.text.secondary}>
                        {ex.sets.length} {t('common.sets')} (
                        {ex.sets
                          .map((s) => (exDetails?.type === 'weight' ? `${s.targetWeightKg}kg` : `${s.targetTimeSeconds}s`))
                          .join(', ')}
                        )
                      </Typography>
                    </View>
                  );
                })}
              </View>
            ))
          ) : (
            <View style={styles.workoutDaySummary}>
              <Typography variant="body" bold color={theme.colors.accent.primary}>
                {plan.workoutDay.name}
              </Typography>
              {plan.workoutDay.exercises.map((ex) => {
                const exDetails = EXERCISE_LIBRARY.find((e) => e.id === ex.exerciseId);
                return (
                  <View key={ex.exerciseId} style={styles.summaryExerciseRow}>
                    <Typography variant="caption" bold style={styles.exerciseSummaryItem}>
                      • {exDetails ? t(exDetails.name) : ex.exerciseId}
                    </Typography>
                    <Typography variant="caption" color={theme.colors.text.secondary}>
                      {ex.sets.length} {t('common.sets')} (
                      {ex.sets
                        .map((s) => (exDetails?.type === 'weight' ? `${s.targetWeightKg}kg` : `${s.targetTimeSeconds}s`))
                        .join(', ')}
                      )
                    </Typography>
                  </View>
                );
              })}
            </View>
          )}

          {/* Action Buttons */}
          <Button
            title={t('planner.editPlan')}
            variant="primary"
            style={{ marginTop: theme.spacing.xl }}
            onPress={handleStartEdit}
          />
          <Button
            title={t('home.levelUpPlan')}
            variant="outline"
            style={{ marginTop: theme.spacing.md }}
            onPress={handleLevelUp}
          />
          <Button
            title={t('planner.deletePlan')}
            variant="secondary"
            style={{ marginTop: theme.spacing.md, borderColor: theme.colors.status.error }}
            onPress={handleDelete}
          />
        </Card>
      </ScrollView>
    );
  }

  // ──── RENDER PLAN CREATION / EDIT STEPS ────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header with Edit/Create Mode Banner */}
        <View style={styles.screenHeader}>
          <Typography variant="title1" bold align="center" style={styles.title}>
            {isEditing ? t('planner.editingPlan') : t('planner.createPlan')}
          </Typography>

          {isEditing && (
            <TouchableOpacity style={styles.cancelEditBtn} onPress={handleCancelEdit}>
              <Typography variant="caption" bold color={theme.colors.status.error}>
                {t('planner.cancelEdit')}
              </Typography>
            </TouchableOpacity>
          )}
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* ──── STEP 1: Plan Type Select ──── */}
        {step === 'type_select' && (
          <View style={styles.stepContainer}>
            <Typography variant="title2" align="center" style={{ marginBottom: theme.spacing.lg }}>
              {t('planner.choosePlanType')}
            </Typography>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPlanType('split')}
            >
              <Card
                variant="elevated"
                style={[styles.typeCard, planType === 'split' && styles.selectedCard]}
              >
                <MaterialCommunityIcons name="chart-gantt" size={36} color={theme.colors.accent.primary} />
                <Typography variant="body" bold style={{ marginTop: theme.spacing.sm }}>
                  {t('planner.split')}
                </Typography>
                <Typography variant="caption" style={{ marginTop: theme.spacing.xs, textAlign: 'center' }}>
                  {t('planner.splitDescription')}
                </Typography>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPlanType('fullBody')}
            >
              <Card
                variant="elevated"
                style={[styles.typeCard, planType === 'fullBody' && styles.selectedCard]}
              >
                <MaterialCommunityIcons name="weight-lifter" size={36} color={theme.colors.accent.primary} />
                <Typography variant="body" bold style={{ marginTop: theme.spacing.sm }}>
                  {t('planner.fullBody')}
                </Typography>
                <Typography variant="caption" style={{ marginTop: theme.spacing.xs, textAlign: 'center' }}>
                  {t('planner.fullBodyDescription')}
                </Typography>
              </Card>
            </TouchableOpacity>

            <Button
              title={t('common.next')}
              style={{ marginTop: theme.spacing.xl }}
              onPress={() => {
                if (planType === 'split') {
                  setStep('split_days');
                } else {
                  setStep('full_body_rest');
                }
              }}
            />
          </View>
        )}

        {/* ──── STEP 2A: Split Days Select ──── */}
        {step === 'split_days' && (
          <View style={styles.stepContainer}>
            <Typography variant="title2" style={{ marginBottom: theme.spacing.xs }}>
              {t('planner.selectDays')}
            </Typography>
            <Typography variant="bodyMuted" style={{ marginBottom: theme.spacing.md }}>
              Choose muscle groups for days you want to work out. Keep rest days empty.
            </Typography>

            {days.map((day) => {
              const activeGroups = splitDays[day];
              const isWorkoutDay = activeGroups.length > 0;

              return (
                <Card
                  key={day}
                  style={[styles.dayConfigCard, isWorkoutDay && styles.dayConfigCardActive]}
                >
                  <View style={styles.dayConfigHeader}>
                    <Typography variant="body" bold style={{ textTransform: 'capitalize' }}>
                      {t(`days.${day}`)}
                    </Typography>
                    {isWorkoutDay && (
                      <Typography variant="caption" color={theme.colors.accent.primary} bold>
                        {activeGroups.length} {t('planner.steps.exercises').toLowerCase()}
                      </Typography>
                    )}
                  </View>

                  <View style={styles.badgeRow}>
                    {muscleGroups.map((group) => {
                      const isSelected = activeGroups.includes(group);
                      return (
                        <TouchableOpacity
                          key={group}
                          style={[
                            styles.musclePill,
                            isSelected && styles.musclePillActive,
                          ]}
                          onPress={() => {
                            const next = isSelected
                              ? activeGroups.filter((g) => g !== group)
                              : [...activeGroups, group];
                            setSplitDays({ ...splitDays, [day]: next });
                          }}
                        >
                          <Typography
                            variant="caption"
                            bold={isSelected}
                            color={isSelected ? theme.colors.text.inverse : theme.colors.text.primary}
                          >
                            {t(`muscleGroups.${group}`)}
                          </Typography>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Card>
              );
            })}

            <View style={styles.btnRow}>
              <Button
                title={t('common.back')}
                variant="secondary"
                style={styles.flexBtn}
                onPress={() => setStep('type_select')}
              />
              <Button
                title={t('common.next')}
                style={styles.flexBtn}
                onPress={() => {
                  const activeDays = days.filter((d) => splitDays[d].length > 0);
                  if (activeDays.length === 0) {
                    Alert.alert(t('common.error'), 'Please select at least one workout day.');
                    return;
                  }
                  setCurrentSplitDayForConfig(activeDays[0]);
                  setStep('exercise_select');
                }}
              />
            </View>
          </View>
        )}

        {/* ──── STEP 2B: Full Body Rest Select ──── */}
        {step === 'full_body_rest' && (
          <View style={styles.stepContainer}>
            <Typography variant="title2" style={{ marginBottom: theme.spacing.md }}>
              {t('planner.restDaysBetween')}
            </Typography>

            <View style={styles.restOptionsRow}>
              {[1, 2, 3].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.restOptionCard,
                    restDaysBetween === num && styles.restOptionCardActive,
                  ]}
                  onPress={() => setRestDaysBetween(num)}
                >
                  <Typography
                    variant="title1"
                    bold
                    color={restDaysBetween === num ? theme.colors.accent.primary : theme.colors.text.primary}
                  >
                    {num}
                  </Typography>
                  <Typography variant="caption" color={theme.colors.text.secondary}>
                    {num === 1 ? '1 day rest' : `${num} days rest`}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.btnRow, { marginTop: theme.spacing.xxl }]}>
              <Button
                title={t('common.back')}
                variant="secondary"
                style={styles.flexBtn}
                onPress={() => setStep('type_select')}
              />
              <Button
                title={t('common.next')}
                style={styles.flexBtn}
                onPress={() => setStep('exercise_select')}
              />
            </View>
          </View>
        )}

        {/* ──── STEP 3: Exercise Selection ──── */}
        {step === 'exercise_select' && (
          <View style={styles.stepContainer}>
            {planType === 'split' ? (
              <View>
                {/* Day selector tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabsScroll}>
                  {days
                    .filter((d) => splitDays[d].length > 0)
                    .map((d) => {
                      const isActiveDay = d === currentSplitDayForConfig;
                      const count = selectedSplitExercises[d]?.length || 0;

                      return (
                        <TouchableOpacity
                          key={d}
                          style={[styles.dayTabPill, isActiveDay && styles.dayTabPillActive]}
                          onPress={() => setCurrentSplitDayForConfig(d)}
                        >
                          <Typography
                            variant="caption"
                            bold
                            color={isActiveDay ? theme.colors.text.inverse : theme.colors.text.primary}
                            style={{ textTransform: 'capitalize' }}
                          >
                            {t(`days.${d}`)} ({count})
                          </Typography>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>

                <View style={styles.exerciseSectionHeader}>
                  <Typography variant="title2" style={{ textTransform: 'capitalize' }}>
                    {t(`days.${currentSplitDayForConfig}`)} {t('planner.selectExercises')}
                  </Typography>
                  <Typography variant="bodyMuted" style={{ marginTop: theme.spacing.xs }}>
                    Muscle groups: {splitDays[currentSplitDayForConfig].map((g) => t(`muscleGroups.${g}`)).join(', ')}
                  </Typography>
                </View>

                {/* Available Exercises for Selected Muscle Groups */}
                {EXERCISE_LIBRARY.filter((ex) =>
                  splitDays[currentSplitDayForConfig].includes(ex.muscleGroup)
                ).map((ex) => {
                  const isSelected = selectedSplitExercises[currentSplitDayForConfig]?.includes(ex.id);

                  return (
                    <TouchableOpacity
                      key={ex.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        const current = selectedSplitExercises[currentSplitDayForConfig] || [];
                        const next = current.includes(ex.id)
                          ? current.filter((id) => id !== ex.id)
                          : [...current, ex.id];
                        setSelectedSplitExercises({
                          ...selectedSplitExercises,
                          [currentSplitDayForConfig]: next,
                        });

                        const key = `${currentSplitDayForConfig}_${ex.id}`;
                        setSplitTargets((prev) => initializeTargetsForExercise(ex.id, key, prev));
                      }}
                    >
                      <Card
                        style={[styles.exerciseSelectCard, isSelected && styles.selectedExerciseCard]}
                      >
                        <View style={{ flex: 1 }}>
                          <Typography variant="body" bold color={theme.colors.text.primary}>
                            {t(ex.name)}
                          </Typography>
                          <Typography variant="caption" color={theme.colors.text.secondary}>
                            {t(`muscleGroups.${ex.muscleGroup}`)} • {ex.defaultSets} {t('common.sets')}
                          </Typography>
                        </View>
                        <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                          {isSelected && (
                            <MaterialCommunityIcons name="check" size={16} color={theme.colors.text.inverse} />
                          )}
                        </View>
                      </Card>
                    </TouchableOpacity>
                  );
                })}

                <View style={styles.btnRow}>
                  <Button
                    title={t('common.back')}
                    variant="secondary"
                    style={styles.flexBtn}
                    onPress={() => setStep('split_days')}
                  />
                  <Button
                    title={t('common.next')}
                    style={styles.flexBtn}
                    onPress={() => {
                      const activeDays = days.filter((d) => splitDays[d].length > 0);
                      const hasEmptyDay = activeDays.some(
                        (d) => (selectedSplitExercises[d] || []).length === 0
                      );
                      if (hasEmptyDay) {
                        Alert.alert('Warning', 'Please select at least one exercise for each workout day.');
                        return;
                      }
                      setStep('set_targets');
                    }}
                  />
                </View>
              </View>
            ) : (
              <View>
                <Typography variant="title2" style={{ marginBottom: theme.spacing.xs }}>
                  {t('planner.selectExercises')}
                </Typography>
                <Typography variant="bodyMuted" style={{ marginBottom: theme.spacing.md }}>
                  Select the exercises for your full body session:
                </Typography>

                {EXERCISE_LIBRARY.map((ex) => {
                  const isSelected = selectedFullBodyExercises.includes(ex.id);

                  return (
                    <TouchableOpacity
                      key={ex.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        const next = isSelected
                          ? selectedFullBodyExercises.filter((id) => id !== ex.id)
                          : [...selectedFullBodyExercises, ex.id];
                        setSelectedFullBodyExercises(next);
                        setFullBodyTargets((prev) => initializeTargetsForExercise(ex.id, ex.id, prev));
                      }}
                    >
                      <Card
                        style={[styles.exerciseSelectCard, isSelected && styles.selectedExerciseCard]}
                      >
                        <View style={{ flex: 1 }}>
                          <Typography variant="body" bold color={theme.colors.text.primary}>
                            {t(ex.name)}
                          </Typography>
                          <Typography variant="caption" color={theme.colors.text.secondary}>
                            {t(`muscleGroups.${ex.muscleGroup}`)} • {ex.defaultSets} {t('common.sets')}
                          </Typography>
                        </View>
                        <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                          {isSelected && (
                            <MaterialCommunityIcons name="check" size={16} color={theme.colors.text.inverse} />
                          )}
                        </View>
                      </Card>
                    </TouchableOpacity>
                  );
                })}

                <View style={styles.btnRow}>
                  <Button
                    title={t('common.back')}
                    variant="secondary"
                    style={styles.flexBtn}
                    onPress={() => setStep('full_body_rest')}
                  />
                  <Button
                    title={t('common.next')}
                    style={styles.flexBtn}
                    onPress={() => {
                      if (selectedFullBodyExercises.length === 0) {
                        Alert.alert(t('common.error'), 'Please select at least one exercise.');
                        return;
                      }
                      setStep('set_targets');
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* ──── STEP 4: Target Selection & Set Configurator ──── */}
        {step === 'set_targets' && (
          <View style={styles.stepContainer}>
            <View style={{ marginBottom: theme.spacing.md }}>
              <Typography variant="title2">
                {t('planner.setTargets')}
              </Typography>
              <Typography variant="caption" color={theme.colors.text.secondary}>
                Directly edit weight, reps or hold times. Use + / - or tap number to type.
              </Typography>
            </View>

            {planType === 'split' ? (
              days
                .filter((day) => splitDays[day].length > 0)
                .map((day) => {
                  const dayExercises = selectedSplitExercises[day] || [];
                  if (dayExercises.length === 0) return null;

                  return (
                    <View key={day} style={styles.splitDayTargetGroup}>
                      <View style={styles.dayGroupHeader}>
                        <MaterialCommunityIcons name="calendar-check" size={20} color={theme.colors.accent.primary} />
                        <Typography
                          variant="body"
                          bold
                          style={{ textTransform: 'capitalize', marginLeft: theme.spacing.xs }}
                          color={theme.colors.accent.primary}
                        >
                          {t(`days.${day}`)}
                        </Typography>
                      </View>

                      {dayExercises.map((exerciseId) =>
                        renderExerciseTargetCard(exerciseId, `${day}_${exerciseId}`, true)
                      )}
                    </View>
                  );
                })
            ) : (
              selectedFullBodyExercises.map((exerciseId) =>
                renderExerciseTargetCard(exerciseId, exerciseId, false)
              )
            )}

            <View style={styles.btnRow}>
              <Button
                title={t('common.back')}
                variant="secondary"
                style={styles.flexBtn}
                onPress={() => setStep('exercise_select')}
              />
              <Button
                title={isEditing ? t('planner.saveChanges') : t('common.save')}
                style={styles.flexBtn}
                onPress={handleSavePlan}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    flexGrow: 1,
    paddingBottom: theme.spacing.xxxl,
  },
  screenHeader: {
    marginBottom: theme.spacing.md,
    position: 'relative',
    alignItems: 'center',
  },
  title: {
    color: theme.colors.text.primary,
  },
  cancelEditBtn: {
    position: 'absolute',
    right: 0,
    top: 6,
    padding: theme.spacing.xs,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.round,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepBadge: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: theme.borderRadius.round,
  },
  stepBadgeActive: {
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
  },
  stepBadgePassed: {
    opacity: 0.9,
  },
  stepContainer: {
    flex: 1,
  },
  typeCard: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    borderRadius: theme.borderRadius.lg,
  },
  selectedCard: {
    borderColor: theme.colors.accent.primary,
    borderWidth: 1.5,
    backgroundColor: theme.colors.background.tertiary,
  },
  planCard: {
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.lg,
  },
  workoutDaySummary: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  summaryExerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  exerciseSummaryItem: {
    color: theme.colors.text.primary,
  },
  dayConfigCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dayConfigCardActive: {
    borderColor: theme.colors.accent.primary,
    borderWidth: 1,
  },
  dayConfigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  musclePill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  musclePillActive: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  },
  restOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  restOptionCard: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    paddingVertical: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restOptionCardActive: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 2,
  },
  dayTabsScroll: {
    marginBottom: theme.spacing.md,
  },
  dayTabPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.xs,
  },
  dayTabPillActive: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  },
  exerciseSectionHeader: {
    marginBottom: theme.spacing.md,
  },
  exerciseSelectCard: {
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
  },
  selectedExerciseCard: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1.5,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.text.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  },
  splitDayTargetGroup: {
    marginBottom: theme.spacing.xl,
  },
  dayGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  exerciseTargetCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  targetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  setCountBadge: {
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  setRowCard: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  setRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  setNumBadge: {
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trashBtn: {
    padding: 2,
  },
  setInputsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  inputColumn: {
    flex: 1,
  },
  fieldLabel: {
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  stepperInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 38,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 32,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
  },
  numInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  numInput: {
    color: theme.colors.text.primary,
    fontWeight: '700',
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
    minWidth: 32,
    padding: 0,
  },
  inputSuffix: {
    color: theme.colors.text.tertiary,
    marginLeft: 2,
  },
  addSetBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.xs,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  flexBtn: {
    flex: 1,
  },
});
