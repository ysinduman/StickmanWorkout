import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Vibration,
  Alert,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import ConfettiCannon from 'react-native-confetti-cannon';
import type { RootStackParamList, WorkoutNavigationProp } from '../navigation/types';
import { Typography, Card, Button } from '../components/ui';
import theme from '../constants/theme';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useUserStore } from '../stores/useUserStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { getPushUpVisionHtml } from '../utils/pushUpVisionHtml';

type PushUpRouteProp = RouteProp<RootStackParamList, 'PushUpTracker'>;

const VisionWebView = WebView as unknown as React.ComponentType<any>;

export default function PushUpTrackerScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<WorkoutNavigationProp>();
  const route = useRoute<PushUpRouteProp>();

  const targetReps = route.params?.targetReps ?? 15;
  const exerciseId = route.params?.exerciseId;
  const setIndex = route.params?.setIndex;

  const { language } = useSettingsStore();
  const { activeWorkout, updateExerciseProgress } = useWorkoutStore();
  const { addXP } = useUserStore();

  const webViewRef = useRef<any>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [currentReps, setCurrentReps] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [isCompletedModalVisible, setIsCompletedModalVisible] = useState<boolean>(false);

  // Request Android Camera Permissions
  useEffect(() => {
    async function checkCameraPermission() {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
          if (granted) {
            setHasCameraPermission(true);
          } else {
            const status = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.CAMERA,
              {
                title: t('pushUpTracker.cameraRequired'),
                message: t('pushUpTracker.cameraRequiredDesc'),
                buttonPositive: t('common.ok'),
                buttonNegative: t('common.cancel'),
              }
            );
            setHasCameraPermission(status === PermissionsAndroid.RESULTS.GRANTED);
          }
        } catch (err) {
          console.warn('Camera permission error:', err);
          setHasCameraPermission(false);
        }
      } else {
        // iOS handled automatically by WebView / info.plist
        setHasCameraPermission(true);
      }
    }

    checkCameraPermission();
  }, [t]);

  // Handle messages coming from the Computer Vision WebView
  const handleWebMessage = (dataString: string) => {
    try {
      const data = JSON.parse(dataString);

      if (data.type === 'REP_COUNTED') {
        setCurrentReps(data.count);
        Vibration.vibrate(50);

        if (data.count >= targetReps && !showCelebration) {
          setShowCelebration(true);
          Vibration.vibrate([0, 100, 80, 200]);
          setTimeout(() => {
            setIsCompletedModalVisible(true);
          }, 1200);
        }
      } else if (data.type === 'CAMERA_ERROR') {
        Alert.alert(t('pushUpTracker.cameraRequired'), data.error || t('pushUpTracker.cameraRequiredDesc'));
      }
    } catch (e) {
      console.warn('Failed to parse webview message:', e);
    }
  };

  const handleReset = () => {
    setCurrentReps(0);
    setShowCelebration(false);
    setIsCompletedModalVisible(false);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'RESET' }));
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'SET_SOUND', enabled: next }));
  };

  const handleFlipCamera = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'FLIP_CAMERA' }));
  };

  // Save progress back to workout or give standalone XP
  const handleSaveAndExit = () => {
    if (activeWorkout && exerciseId && setIndex !== undefined) {
      const exProgress = activeWorkout.exercises.find((ex) => ex.exerciseId === exerciseId);
      if (exProgress && exProgress.sets) {
        const nextSets = [...exProgress.sets];
        if (nextSets[setIndex]) {
          nextSets[setIndex] = {
            ...nextSets[setIndex],
            actualReps: currentReps > 0 ? currentReps : targetReps,
            completed: true,
          };
          updateExerciseProgress(exerciseId, nextSets);
        }
      }
    } else if (currentReps > 0) {
      // Standalone session XP
      const earnedXP = Math.max(1, Math.round(currentReps / 5));
      addXP(earnedXP);
    }

    navigation.goBack();
  };

  const htmlContent = useMemo(
    () =>
      getPushUpVisionHtml({
        targetReps,
        initialSoundEnabled: soundEnabled,
        language: language || 'tr',
      }),
    [targetReps, soundEnabled, language]
  );

  if (hasCameraPermission === false) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" />
        <MaterialCommunityIcons name="camera-off" size={64} color={theme.colors.status.error} />
        <Typography variant="title1" bold style={styles.errorTitle}>
          {t('pushUpTracker.cameraRequired')}
        </Typography>
        <Typography
          variant="body"
          color={theme.colors.text.secondary}
          style={styles.errorDesc}
        >
          {t('pushUpTracker.cameraRequiredDesc')}
        </Typography>
        <Button
          title={t('common.back')}
          style={styles.errorBtn}
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Real-time Computer Vision WebView */}
      <VisionWebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webView}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        onMessage={(event: WebViewMessageEvent) => handleWebMessage(event.nativeEvent.data)}
        scrollEnabled={false}
      />

      {/* Native Floating Header Controls */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.targetBadge}>
          <MaterialCommunityIcons name="fire" size={18} color={theme.colors.accent.primary} />
          <Typography variant="caption" bold color={theme.colors.text.primary} style={styles.targetBadgeText}>
            {exerciseId ? t('exercises.pushUp') : t('pushUpTracker.title')}
          </Typography>
          <Typography variant="caption" bold color={theme.colors.accent.primary} style={styles.targetBadgeReps}>
            ({currentReps}/{targetReps})
          </Typography>
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.circleBtn} onPress={handleFlipCamera}>
            <MaterialCommunityIcons name="camera-flip-outline" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtnMargin} onPress={handleToggleSound}>
            <MaterialCommunityIcons
              name={soundEnabled ? 'volume-high' : 'volume-off'}
              size={20}
              color={soundEnabled ? theme.colors.status.success : theme.colors.text.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtnMargin} onPress={handleReset}>
            <MaterialCommunityIcons name="refresh" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Native Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <Button
          title={exerciseId ? t('pushUpTracker.saveSet') : t('pushUpTracker.finishWorkout')}
          style={styles.saveBtn}
          onPress={handleSaveAndExit}
        />
      </View>

      {/* Celebration Confetti */}
      {showCelebration && (
        <ConfettiCannon
          count={80}
          origin={{ x: 200, y: 0 }}
          fadeOut={true}
          fallSpeed={3000}
        />
      )}

      {/* Completion Modal */}
      {isCompletedModalVisible && (
        <View style={styles.modalBackdrop}>
          <Card variant="elevated" style={styles.modalCard}>
            <MaterialCommunityIcons name="trophy" size={56} color={theme.colors.accent.primary} />
            <Typography variant="title1" bold style={styles.modalTitle}>
              {t('pushUpTracker.sessionCompletedTitle')}
            </Typography>
            <Typography
              variant="body"
              color={theme.colors.text.secondary}
              style={styles.modalDesc}
            >
              {t('pushUpTracker.sessionCompletedDesc', { count: currentReps })}
            </Typography>

            <View style={styles.modalBtnRow}>
              <Button
                title={t('pushUpTracker.tryAgain')}
                variant="outline"
                style={styles.modalBtnLeft}
                onPress={handleReset}
              />
              <Button
                title={exerciseId ? t('pushUpTracker.backToWorkout') : t('common.done')}
                style={styles.modalBtnRight}
                onPress={handleSaveAndExit}
              />
            </View>
          </Card>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  webView: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  errorTitle: {
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  errorDesc: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  errorBtn: {
    marginTop: theme.spacing.xl,
    width: 200,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 20,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 50,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(18, 18, 26, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  circleBtnMargin: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(18, 18, 26, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 26, 0.85)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.35)',
  },
  targetBadgeText: {
    marginLeft: 4,
  },
  targetBadgeReps: {
    marginLeft: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 24,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 50,
  },
  saveBtn: {
    width: '100%',
    shadowColor: theme.colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: theme.spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
  },
  modalTitle: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  modalDesc: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.xl,
    width: '100%',
  },
  modalBtnLeft: {
    flex: 1,
    marginRight: 8,
  },
  modalBtnRight: {
    flex: 1,
    marginLeft: 8,
  },
});
