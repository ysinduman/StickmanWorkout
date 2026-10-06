import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import theme from '../../constants/theme';

interface StickmanProps {
  muscleMass: number; // 0 to 100
  width?: number;
  height?: number;
  isWorkingOut?: boolean;
}

export const Stickman: React.FC<StickmanProps> = ({
  muscleMass,
  width = 200,
  height = 250,
  isWorkingOut = false,
}) => {
  // Base scales based on muscleMass (0-100)
  // Skinny: limbWidth = 2, TorsoWidth = 3
  // Buff: limbWidth = 12, TorsoWidth = 18
  const limbWidth = 2 + (muscleMass / 100) * 10;
  const torsoWidth = 3 + (muscleMass / 100) * 15;
  const chestScale = (muscleMass / 100) * 8;
  const bicepScale = (muscleMass / 100) * 6;

  // Stickman dimensions & coordinates (centered in SVG viewBox="0 0 100 120")
  const headX = 50;
  const headY = 25;
  const headRadius = 10 + (muscleMass / 100) * 2; // Head grows slightly

  const neckY = headY + headRadius;
  const shoulderY = neckY + 4;
  const hipsY = shoulderY + 30;

  // Arms - Flexed if isWorkingOut or has high muscle mass
  const leftShoulderX = 50 - (10 + chestScale / 2);
  const rightShoulderX = 50 + (10 + chestScale / 2);

  // Flexed arm calculation
  let leftElbowX = 30;
  let leftElbowY = shoulderY + 10;
  let leftHandX = 20;
  let leftHandY = shoulderY;

  let rightElbowX = 70;
  let rightElbowY = shoulderY + 10;
  let rightHandX = 80;
  let rightHandY = shoulderY;

  if (isWorkingOut || muscleMass > 50) {
    // Flexing arms up
    leftElbowX = 32 - chestScale / 2;
    leftElbowY = shoulderY - 8;
    leftHandX = 40;
    leftHandY = shoulderY - 18;

    rightElbowX = 68 + chestScale / 2;
    rightElbowY = shoulderY - 8;
    rightHandX = 60;
    rightHandY = shoulderY - 18;
  }

  // Legs
  const leftHipX = 45 - chestScale / 4;
  const rightHipX = 55 + chestScale / 4;

  const leftKneeX = leftHipX - 8;
  const leftKneeY = hipsY + 20;
  const leftFootX = leftKneeX - 4;
  const leftFootY = leftKneeY + 20;

  const rightKneeX = rightHipX + 8;
  const rightKneeY = hipsY + 20;
  const rightFootX = rightKneeX + 4;
  const rightFootY = rightKneeY + 20;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} viewBox="0 0 100 120">
        {/* Glow behind stickman for premium look */}
        <Circle cx="50" cy="55" r="40" fill={theme.colors.accent.primary} opacity="0.05" />

        {/* Head */}
        <Circle
          cx={headX}
          cy={headY}
          r={headRadius}
          stroke={theme.colors.text.primary}
          strokeWidth="3.5"
          fill={theme.colors.background.primary}
        />

        {/* Chest/Shoulder Line */}
        <Line
          x1={leftShoulderX}
          y1={shoulderY}
          x2={rightShoulderX}
          y2={shoulderY}
          stroke={theme.colors.text.primary}
          strokeWidth={torsoWidth * 0.8}
          strokeLinecap="round"
        />

        {/* Torso */}
        <Line
          x1="50"
          y1={shoulderY}
          x2="50"
          y2={hipsY}
          stroke={theme.colors.text.primary}
          strokeWidth={torsoWidth}
          strokeLinecap="round"
        />

        {/* Chest details (biceps/pectorals overlay) for muscular levels */}
        {muscleMass > 20 && (
          <>
            {/* Left Pec */}
            <Circle
              cx={headX - 6 - chestScale / 4}
              cy={shoulderY + 8}
              r={chestScale * 0.6}
              fill={theme.colors.text.primary}
            />
            {/* Right Pec */}
            <Circle
              cx={headX + 6 + chestScale / 4}
              cy={shoulderY + 8}
              r={chestScale * 0.6}
              fill={theme.colors.text.primary}
            />
            {/* Left Bicep */}
            <Circle
              cx={(leftShoulderX + leftElbowX) / 2}
              cy={(shoulderY + leftElbowY) / 2}
              r={bicepScale * 0.7}
              fill={theme.colors.text.primary}
            />
            {/* Right Bicep */}
            <Circle
              cx={(rightShoulderX + rightElbowX) / 2}
              cy={(shoulderY + rightElbowY) / 2}
              r={bicepScale * 0.7}
              fill={theme.colors.text.primary}
            />
          </>
        )}

        {/* Left Arm */}
        <Path
          d={`M ${leftShoulderX} ${shoulderY} L ${leftElbowX} ${leftElbowY} L ${leftHandX} ${leftHandY}`}
          fill="none"
          stroke={theme.colors.text.primary}
          strokeWidth={limbWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Arm */}
        <Path
          d={`M ${rightShoulderX} ${shoulderY} L ${rightElbowX} ${rightElbowY} L ${rightHandX} ${rightHandY}`}
          fill="none"
          stroke={theme.colors.text.primary}
          strokeWidth={limbWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hips Line */}
        <Line
          x1={leftHipX}
          y1={hipsY}
          x2={rightHipX}
          y2={hipsY}
          stroke={theme.colors.text.primary}
          strokeWidth={torsoWidth * 0.7}
          strokeLinecap="round"
        />

        {/* Left Leg */}
        <Path
          d={`M ${leftHipX} ${hipsY} L ${leftKneeX} ${leftKneeY} L ${leftFootX} ${leftFootY}`}
          fill="none"
          stroke={theme.colors.text.primary}
          strokeWidth={limbWidth * 1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Leg */}
        <Path
          d={`M ${rightHipX} ${hipsY} L ${rightKneeX} ${rightKneeY} L ${rightFootX} ${rightFootY}`}
          fill="none"
          stroke={theme.colors.text.primary}
          strokeWidth={limbWidth * 1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Working out details (dumbbells) */}
        {isWorkingOut && (
          <>
            {/* Left Dumbbell */}
            <Path
              d={`M ${leftHandX - 6} ${leftHandY - 6} L ${leftHandX + 6} ${leftHandY + 6}`}
              stroke={theme.colors.accent.primary}
              strokeWidth="4"
              strokeLinecap="square"
            />
            {/* Right Dumbbell */}
            <Path
              d={`M ${rightHandX - 6} ${rightHandY + 6} L ${rightHandX + 6} ${rightHandY - 6}`}
              stroke={theme.colors.accent.primary}
              strokeWidth="4"
              strokeLinecap="square"
            />
          </>
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
