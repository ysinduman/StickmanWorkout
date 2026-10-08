import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Modal, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Typography, Button } from './ui';
import { Stickman } from './Stickman/Stickman';
import theme from '../constants/theme';
import { useCosmeticStore } from '../stores/useCosmeticStore';

interface LevelUpModalProps {
  visible: boolean;
  previousLevel: number;
  newLevel: number;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  visible,
  previousLevel,
  newLevel,
  onClose,
}) => {
  const { t } = useTranslation();
  const equipped = useCosmeticStore((state) => state.equipped);
  const [displayedMass, setDisplayedMass] = useState(previousLevel);

  useEffect(() => {
    if (visible) {
      setDisplayedMass(previousLevel);
      
      // Animate muscle mass growth over time
      const delay = setTimeout(() => {
        const diff = newLevel - previousLevel;
        const steps = 30; // 30 steps for smooth animation
        const stepTime = 1500 / steps; // 1.5 seconds total
        let currentStep = 0;

        const interval = setInterval(() => {
          currentStep++;
          if (currentStep >= steps) {
            setDisplayedMass(newLevel);
            clearInterval(interval);
          } else {
            setDisplayedMass(previousLevel + (diff * currentStep) / steps);
          }
        }, stepTime);
        
        return () => clearInterval(interval);
      }, 500); // Wait a little before growing

      return () => clearTimeout(delay);
    }
  }, [visible, previousLevel, newLevel]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Confetti Explosion */}
        <ConfettiCannon
          count={150}
          origin={{ x: width / 2, y: 0 }}
          autoStart={true}
          fadeOut={true}
          fallSpeed={3000}
          colors={[theme.colors.accent.primary, '#FFD700', '#FF6347', '#00FA9A', '#1E90FF']}
        />

        <Animated.View entering={ZoomIn.duration(800)} exiting={FadeOut} style={styles.content}>
          <Typography variant="title1" bold style={styles.title}>
            LEVEL UP! 🎉
          </Typography>
          <Typography variant="title2" style={styles.subtitle}>
            Level {previousLevel} ➔ Level {newLevel}
          </Typography>
          
          <Animated.View entering={FadeIn.delay(400).duration(1000)} style={styles.stickmanContainer}>
             <Stickman 
               muscleMass={displayedMass} 
               width={width * 0.8} 
               height={width * 0.8} 
               isWorkingOut={true} 
             />
          </Animated.View>

          <Typography variant="body" align="center" style={styles.message}>
            Your stickman is getting stronger! Keep up the great work and maintain your streak.
          </Typography>
          {equipped ? (
            <Typography variant="body" align="center" style={styles.message}>
              {t('workout.cosmeticDrop', { name: t(`cosmetic.${equipped}`) })}
            </Typography>
          ) : null}

          <Animated.View entering={FadeIn.delay(2000).duration(500)} style={styles.buttonContainer}>
            <Button title="Awesome!" onPress={onClose} style={styles.button} />
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 15, 0.95)', // Very dark overlay to make colors pop
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.accent.primary,
    shadowColor: theme.colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    color: '#FFD700', // Gold color for Level Up
    fontSize: 36,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
  },
  stickmanContainer: {
    marginVertical: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginVertical: theme.spacing.lg,
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    marginTop: theme.spacing.md,
  },
  button: {
    width: '100%',
    shadowColor: theme.colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  }
});
