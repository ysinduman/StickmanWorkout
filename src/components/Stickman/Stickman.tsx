import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path, G, Rect } from 'react-native-svg';
import theme from '../../constants/theme';
import { useCosmeticStore } from '../../stores/useCosmeticStore';
import { useZoneStore } from '../../stores/useZoneStore';
import type { MuscleZone } from '../../constants/zones';
import { bodyPartsForZone } from '../../constants/zones';
import { getPartEvolution } from './evolution';

interface StickmanProps {
  muscleMass: number; // 0 to 100
  width?: number;
  height?: number;
  isWorkingOut?: boolean;
  partLevels?: Record<string, number>;
  priorityZone?: MuscleZone | null;
}

export const Stickman: React.FC<StickmanProps> = ({
  muscleMass,
  width = 200,
  height = 250,
  isWorkingOut = false,
  partLevels,
  priorityZone = null,
}) => {
  const equipped = useCosmeticStore((state) => state.equipped);
  const bars = useZoneStore((state) => state.bars);

  // Helper to resolve level for any body part
  const getLevel = (id: string) => {
    if (partLevels && typeof partLevels[id] === 'number') {
      return partLevels[id];
    }
    // Fallback: check zone store or map muscleMass (0-100)
    if (id === 'shoulders' && bars.shoulders) return bars.shoulders.level || 1;
    if (id === 'back' && bars.back) return bars.back.level || 1;
    if (id === 'abs' && bars.abs) return bars.abs.level || 1;
    if (id === 'glutes' && bars.glutes) return bars.glutes.level || 1;
    if ((id === 'biceps' || id === 'triceps' || id === 'forearms') && bars.leftArm) {
      return bars.leftArm.level || 1;
    }
    if ((id === 'quadriceps' || id === 'hamstrings' || id === 'calves') && bars.legs) {
      return bars.legs.level || 1;
    }
    return Math.max(1, Math.round(muscleMass));
  };

  const isPartPriority = (id: string) =>
    priorityZone ? bodyPartsForZone(priorityZone).includes(id) : false;

  // Evolution data for all 11 anatomical parts
  const bicepsEvo = getPartEvolution(getLevel('biceps'), isPartPriority('biceps'));
  const tricepsEvo = getPartEvolution(getLevel('triceps'), isPartPriority('triceps'));
  const forearmsEvo = getPartEvolution(getLevel('forearms'), isPartPriority('forearms'));
  const chestEvo = getPartEvolution(getLevel('chest'), false);
  const absEvo = getPartEvolution(getLevel('abs'), isPartPriority('abs'));
  const shouldersEvo = getPartEvolution(getLevel('shoulders'), isPartPriority('shoulders'));
  const backEvo = getPartEvolution(getLevel('back'), isPartPriority('back'));
  const quadsEvo = getPartEvolution(getLevel('quadriceps'), isPartPriority('quadriceps'));
  const hamsEvo = getPartEvolution(getLevel('hamstrings'), isPartPriority('hamstrings'));
  const calvesEvo = getPartEvolution(getLevel('calves'), isPartPriority('calves'));
  const glutesEvo = getPartEvolution(getLevel('glutes'), isPartPriority('glutes'));

  // Coordinate geometry
  const headX = 50;
  const headY = 25;
  const headRadius = 10 + Math.min(2, (muscleMass / 100) * 2);

  const neckY = headY + headRadius;
  const shoulderY = neckY + 4;
  const hipsY = shoulderY + 32;

  // Chest width & lateral extension
  const chestSpread = 12 + chestEvo.growth * 10;
  const leftShoulderX = 50 - chestSpread;
  const rightShoulderX = 50 + chestSpread;

  // Arm poses (flexed when working out or buff)
  const isFlexing = isWorkingOut || muscleMass > 40 || bicepsEvo.level > 20;

  let leftElbowX = 30 - chestEvo.growth * 3;
  let leftElbowY = shoulderY + 12;
  let leftHandX = 20 - chestEvo.growth * 2;
  let leftHandY = shoulderY + 2;

  let rightElbowX = 70 + chestEvo.growth * 3;
  let rightElbowY = shoulderY + 12;
  let rightHandX = 80 + chestEvo.growth * 2;
  let rightHandY = shoulderY + 2;

  if (isFlexing) {
    leftElbowX = 28 - chestEvo.growth * 4;
    leftElbowY = shoulderY - 5;
    leftHandX = 37 - chestEvo.growth * 2;
    leftHandY = shoulderY - 18;

    rightElbowX = 72 + chestEvo.growth * 4;
    rightElbowY = shoulderY - 5;
    rightHandX = 63 + chestEvo.growth * 2;
    rightHandY = shoulderY - 18;
  }

  // Biceps midpoint & geometry
  const leftBicepX = (leftShoulderX + leftElbowX) / 2;
  const leftBicepY = (shoulderY + leftElbowY) / 2 - (isFlexing ? 3 : 0);
  const rightBicepX = (rightShoulderX + rightElbowX) / 2;
  const rightBicepY = (shoulderY + rightElbowY) / 2 - (isFlexing ? 3 : 0);
  const bicepRadius = 2.5 + bicepsEvo.growth * 7.5; // Level 1: 2.5, Level 50: 10.0 (huge!)

  // Triceps bulge on the back/outer edge
  const leftTricepX = leftBicepX - (isFlexing ? 4 : 3) - tricepsEvo.growth * 2;
  const leftTricepY = leftBicepY + (isFlexing ? 3 : 0);
  const rightTricepX = rightBicepX + (isFlexing ? 4 : 3) + tricepsEvo.growth * 2;
  const rightTricepY = rightBicepY + (isFlexing ? 3 : 0);
  const tricepRadius = 1.5 + tricepsEvo.growth * 5.5;

  // Forearm thickness
  const forearmStroke = 2.5 + forearmsEvo.growth * 5.5;

  // Torso / Back (V-Taper Lats)
  const latSpread = 4 + backEvo.growth * 11; // Level 1: 4, Level 50: 15 (wings!)
  const torsoWidth = 3 + absEvo.growth * 4;

  // Shoulders (Cannonball Delts)
  const deltRadius = 3.5 + shouldersEvo.growth * 7.0; // Level 1: 3.5, Level 50: 10.5

  // Hips and Legs
  const hipWidth = 8 + glutesEvo.growth * 5;
  const leftHipX = 50 - hipWidth;
  const rightHipX = 50 + hipWidth;

  const quadSpread = 3 + quadsEvo.growth * 6;
  const leftKneeX = leftHipX - 5 - quadSpread;
  const leftKneeY = hipsY + 22;
  const leftFootX = leftKneeX - 2;
  const leftFootY = leftKneeY + 22;

  const rightKneeX = rightHipX + 5 + quadSpread;
  const rightKneeY = hipsY + 22;
  const rightFootX = rightKneeX + 2;
  const rightFootY = rightKneeY + 22;

  // Calves bulge geometry
  const leftCalfX = (leftKneeX + leftFootX) / 2 - 2 - calvesEvo.growth * 3;
  const leftCalfY = (leftKneeY + leftFootY) / 2 - 2;
  const rightCalfX = (rightKneeX + rightFootX) / 2 + 2 + calvesEvo.growth * 3;
  const rightCalfY = (rightKneeY + rightFootY) / 2 - 2;
  const calfRadius = 2 + calvesEvo.growth * 5;

  // Any part prestige glow check
  const hasAnyPrestige =
    bicepsEvo.isPrestige ||
    tricepsEvo.isPrestige ||
    chestEvo.isPrestige ||
    absEvo.isPrestige ||
    shouldersEvo.isPrestige ||
    backEvo.isPrestige ||
    quadsEvo.isPrestige ||
    calvesEvo.isPrestige;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} viewBox="-20 -15 140 155">
        {/* Ambient Back Glow */}
        <Circle
          cx="50"
          cy="60"
          r="48"
          fill={hasAnyPrestige ? '#FFD700' : theme.colors.accent.primary}
          opacity={hasAnyPrestige ? 0.12 : 0.05}
        />

        {/* ================= BACK / LATS (V-Taper) ================= */}
        {backEvo.growth > 0.05 && (
          <G>
            {backEvo.isPrestige && (
              <Path
                d={`M 50 ${shoulderY} Q ${50 - latSpread * 1.3} ${(shoulderY + hipsY) / 2} ${leftHipX} ${hipsY} L ${rightHipX} ${hipsY} Q ${50 + latSpread * 1.3} ${(shoulderY + hipsY) / 2} 50 ${shoulderY} Z`}
                fill={backEvo.glowColor || '#FFD700'}
                opacity={0.2}
              />
            )}
            <Path
              d={`M 50 ${shoulderY + 2} Q ${50 - latSpread} ${(shoulderY + hipsY) / 2} ${leftHipX} ${hipsY} L ${rightHipX} ${hipsY} Q ${50 + latSpread} ${(shoulderY + hipsY) / 2} 50 ${shoulderY + 2} Z`}
              fill={backEvo.strokeColor}
              opacity={0.35 + backEvo.growth * 0.4}
            />
            {/* Back Vascularity (Level 51-100) */}
            {backEvo.vascularity > 0 && (
              <G opacity={0.5 + backEvo.vascularity * 0.5}>
                <Path
                  d={`M ${50 - latSpread * 0.7} ${(shoulderY + hipsY) / 2 - 3} Q ${50 - latSpread * 0.4} ${(shoulderY + hipsY) / 2 + 2} 48 ${hipsY - 5}`}
                  stroke={backEvo.veinColor}
                  strokeWidth={0.8 + backEvo.vascularity * 0.8}
                  fill="none"
                  strokeLinecap="round"
                />
                <Path
                  d={`M ${50 + latSpread * 0.7} ${(shoulderY + hipsY) / 2 - 3} Q ${50 + latSpread * 0.4} ${(shoulderY + hipsY) / 2 + 2} 52 ${hipsY - 5}`}
                  stroke={backEvo.veinColor}
                  strokeWidth={0.8 + backEvo.vascularity * 0.8}
                  fill="none"
                  strokeLinecap="round"
                />
              </G>
            )}
          </G>
        )}

        {/* Head */}
        <Circle
          cx={headX}
          cy={headY}
          r={headRadius}
          stroke={theme.colors.text.primary}
          strokeWidth="3.5"
          fill={theme.colors.background.primary}
        />

        {/* ================= CHEST / PECTORALS ================= */}
        {/* Collar line */}
        <Line
          x1={leftShoulderX}
          y1={shoulderY}
          x2={rightShoulderX}
          y2={shoulderY}
          stroke={shouldersEvo.strokeColor}
          strokeWidth={4 + shouldersEvo.growth * 4}
          strokeLinecap="round"
        />

        {/* Pec Plates (Level 1..100) */}
        {chestEvo.growth > 0.05 && (
          <G>
            {/* Left Pec */}
            <Path
              d={`M 50 ${shoulderY + 3} Q ${leftShoulderX + 4} ${shoulderY + 4} ${leftShoulderX + 6} ${shoulderY + 8 + chestEvo.growth * 8} Q 50 ${shoulderY + 12 + chestEvo.growth * 8} 50 ${shoulderY + 3} Z`}
              fill={chestEvo.strokeColor}
              opacity={0.85}
            />
            {/* Right Pec */}
            <Path
              d={`M 50 ${shoulderY + 3} Q ${rightShoulderX - 4} ${shoulderY + 4} ${rightShoulderX - 6} ${shoulderY + 8 + chestEvo.growth * 8} Q 50 ${shoulderY + 12 + chestEvo.growth * 8} 50 ${shoulderY + 3} Z`}
              fill={chestEvo.strokeColor}
              opacity={0.85}
            />
            {/* Chest Veins (Level 51-100) */}
            {chestEvo.vascularity > 0 && (
              <G opacity={0.6 + chestEvo.vascularity * 0.4}>
                <Path
                  d={`M ${leftShoulderX + 8} ${shoulderY + 4} Q ${46} ${shoulderY + 7} ${48} ${shoulderY + 10 + chestEvo.growth * 4}`}
                  stroke={chestEvo.veinColor}
                  strokeWidth={0.8 + chestEvo.vascularity * 0.9}
                  fill="none"
                  strokeLinecap="round"
                />
                <Path
                  d={`M ${rightShoulderX - 8} ${shoulderY + 4} Q ${54} ${shoulderY + 7} ${52} ${shoulderY + 10 + chestEvo.growth * 4}`}
                  stroke={chestEvo.veinColor}
                  strokeWidth={0.8 + chestEvo.vascularity * 0.9}
                  fill="none"
                  strokeLinecap="round"
                />
              </G>
            )}
          </G>
        )}

        {/* Spine / Torso Line */}
        <Line
          x1="50"
          y1={shoulderY}
          x2="50"
          y2={hipsY}
          stroke={backEvo.strokeColor}
          strokeWidth={torsoWidth}
          strokeLinecap="round"
        />

        {/* ================= ABS / SIX-PACK ================= */}
        {absEvo.growth > 0.08 && (
          <G>
            {/* Upper Abs */}
            <Rect
              x={44 - absEvo.growth * 2}
              y={shoulderY + 14}
              width={5 + absEvo.growth * 2}
              height={3 + absEvo.growth * 1.5}
              rx="1.5"
              fill={absEvo.strokeColor}
            />
            <Rect
              x={51}
              y={shoulderY + 14}
              width={5 + absEvo.growth * 2}
              height={3 + absEvo.growth * 1.5}
              rx="1.5"
              fill={absEvo.strokeColor}
            />
            {/* Mid Abs (Level 20+) */}
            {absEvo.level >= 20 && (
              <>
                <Rect
                  x={44 - absEvo.growth * 2}
                  y={shoulderY + 19}
                  width={5 + absEvo.growth * 2}
                  height={3 + absEvo.growth * 1.5}
                  rx="1.5"
                  fill={absEvo.strokeColor}
                />
                <Rect
                  x={51}
                  y={shoulderY + 19}
                  width={5 + absEvo.growth * 2}
                  height={3 + absEvo.growth * 1.5}
                  rx="1.5"
                  fill={absEvo.strokeColor}
                />
              </>
            )}
            {/* Lower Abs (Level 40+) */}
            {absEvo.level >= 40 && (
              <>
                <Rect
                  x={45 - absEvo.growth * 1.5}
                  y={shoulderY + 24}
                  width={4.5 + absEvo.growth * 1.5}
                  height={3}
                  rx="1.5"
                  fill={absEvo.strokeColor}
                />
                <Rect
                  x={50.5}
                  y={shoulderY + 24}
                  width={4.5 + absEvo.growth * 1.5}
                  height={3}
                  rx="1.5"
                  fill={absEvo.strokeColor}
                />
              </>
            )}
            {/* Abdominal Vascularity (Level 51-100) */}
            {absEvo.vascularity > 0 && (
              <G opacity={0.65 + absEvo.vascularity * 0.35}>
                <Path
                  d={`M ${42} ${shoulderY + 21} Q ${46} ${shoulderY + 25} ${48} ${hipsY - 2}`}
                  stroke={absEvo.veinColor}
                  strokeWidth={0.8 + absEvo.vascularity * 0.7}
                  fill="none"
                  strokeLinecap="round"
                />
                <Path
                  d={`M ${58} ${shoulderY + 21} Q ${54} ${shoulderY + 25} ${52} ${hipsY - 2}`}
                  stroke={absEvo.veinColor}
                  strokeWidth={0.8 + absEvo.vascularity * 0.7}
                  fill="none"
                  strokeLinecap="round"
                />
              </G>
            )}
          </G>
        )}

        {/* ================= SHOULDERS / DELTS ================= */}
        {/* Left Delt */}
        {shouldersEvo.isPrestige && (
          <Circle
            cx={leftShoulderX}
            cy={shoulderY}
            r={deltRadius + 2.5}
            fill={shouldersEvo.glowColor || '#FFD700'}
            opacity={0.25}
          />
        )}
        <Circle
          cx={leftShoulderX}
          cy={shoulderY}
          r={deltRadius}
          fill={shouldersEvo.fillColor}
        />
        {/* Right Delt */}
        {shouldersEvo.isPrestige && (
          <Circle
            cx={rightShoulderX}
            cy={shoulderY}
            r={deltRadius + 2.5}
            fill={shouldersEvo.glowColor || '#FFD700'}
            opacity={0.25}
          />
        )}
        <Circle
          cx={rightShoulderX}
          cy={shoulderY}
          r={deltRadius}
          fill={shouldersEvo.fillColor}
        />
        {/* Delt Veins (Level 51-100) */}
        {shouldersEvo.vascularity > 0 && (
          <G opacity={0.7 + shouldersEvo.vascularity * 0.3}>
            <Path
              d={`M ${leftShoulderX - deltRadius * 0.5} ${shoulderY - deltRadius * 0.4} Q ${leftShoulderX} ${shoulderY} ${leftShoulderX + deltRadius * 0.4} ${shoulderY + deltRadius * 0.6}`}
              stroke={shouldersEvo.veinColor}
              strokeWidth={0.9 + shouldersEvo.vascularity * 0.7}
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d={`M ${rightShoulderX + deltRadius * 0.5} ${shoulderY - deltRadius * 0.4} Q ${rightShoulderX} ${shoulderY} ${rightShoulderX - deltRadius * 0.4} ${shoulderY + deltRadius * 0.6}`}
              stroke={shouldersEvo.veinColor}
              strokeWidth={0.9 + shouldersEvo.vascularity * 0.7}
              fill="none"
              strokeLinecap="round"
            />
          </G>
        )}

        {/* ================= TRICEPS ================= */}
        {tricepsEvo.growth > 0.05 && (
          <G>
            <Circle
              cx={leftTricepX}
              cy={leftTricepY}
              r={tricepRadius}
              fill={tricepsEvo.fillColor}
              opacity={0.8}
            />
            <Circle
              cx={rightTricepX}
              cy={rightTricepY}
              r={tricepRadius}
              fill={tricepsEvo.fillColor}
              opacity={0.8}
            />
          </G>
        )}

        {/* ================= BICEPS ================= */}
        {/* Left Bicep */}
        {bicepsEvo.isPrestige && (
          <Circle
            cx={leftBicepX}
            cy={leftBicepY}
            r={bicepRadius + 3}
            fill={bicepsEvo.glowColor || '#FFD700'}
            opacity={0.25}
          />
        )}
        <Circle
          cx={leftBicepX}
          cy={leftBicepY}
          r={bicepRadius}
          fill={bicepsEvo.fillColor}
        />

        {/* Right Bicep */}
        {bicepsEvo.isPrestige && (
          <Circle
            cx={rightBicepX}
            cy={rightBicepY}
            r={bicepRadius + 3}
            fill={bicepsEvo.glowColor || '#FFD700'}
            opacity={0.25}
          />
        )}
        <Circle
          cx={rightBicepX}
          cy={rightBicepY}
          r={bicepRadius}
          fill={bicepsEvo.fillColor}
        />

        {/* Bicep Cephalic Veins (Level 51-100: Branching increases with level!) */}
        {bicepsEvo.vascularity > 0 && (
          <G opacity={0.7 + bicepsEvo.vascularity * 0.3}>
            {/* Left Bicep Main Vein */}
            <Path
              d={`M ${leftBicepX - bicepRadius * 0.6} ${leftBicepY + bicepRadius * 0.4} Q ${leftBicepX} ${leftBicepY - bicepRadius * 0.5} ${leftBicepX + bicepRadius * 0.6} ${leftBicepY - bicepRadius * 0.1}`}
              stroke={bicepsEvo.veinColor}
              strokeWidth={1.0 + bicepsEvo.vascularity * 1.2}
              fill="none"
              strokeLinecap="round"
            />
            {/* Left Bicep Branch 2 (Level 65+) */}
            {bicepsEvo.veinCount >= 2 && (
              <Path
                d={`M ${leftBicepX - 1} ${leftBicepY - bicepRadius * 0.2} Q ${leftBicepX + bicepRadius * 0.3} ${leftBicepY + bicepRadius * 0.5} ${leftBicepX + bicepRadius * 0.7} ${leftBicepY + bicepRadius * 0.6}`}
                stroke={bicepsEvo.veinColor}
                strokeWidth={0.8 + bicepsEvo.vascularity * 0.7}
                fill="none"
                strokeLinecap="round"
              />
            )}
            {/* Right Bicep Main Vein */}
            <Path
              d={`M ${rightBicepX + bicepRadius * 0.6} ${rightBicepY + bicepRadius * 0.4} Q ${rightBicepX} ${rightBicepY - bicepRadius * 0.5} ${rightBicepX - bicepRadius * 0.6} ${rightBicepY - bicepRadius * 0.1}`}
              stroke={bicepsEvo.veinColor}
              strokeWidth={1.0 + bicepsEvo.vascularity * 1.2}
              fill="none"
              strokeLinecap="round"
            />
            {/* Right Bicep Branch 2 (Level 65+) */}
            {bicepsEvo.veinCount >= 2 && (
              <Path
                d={`M ${rightBicepX + 1} ${rightBicepY - bicepRadius * 0.2} Q ${rightBicepX - bicepRadius * 0.3} ${rightBicepY + bicepRadius * 0.5} ${rightBicepX - bicepRadius * 0.7} ${rightBicepY + bicepRadius * 0.6}`}
                stroke={bicepsEvo.veinColor}
                strokeWidth={0.8 + bicepsEvo.vascularity * 0.7}
                fill="none"
                strokeLinecap="round"
              />
            )}
          </G>
        )}

        {/* ================= ARMS & FOREARMS ================= */}
        {/* Left Arm Bone/Core */}
        <Path
          d={`M ${leftShoulderX} ${shoulderY} L ${leftElbowX} ${leftElbowY} L ${leftHandX} ${leftHandY}`}
          fill="none"
          stroke={forearmsEvo.strokeColor}
          strokeWidth={forearmStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Arm Bone/Core */}
        <Path
          d={`M ${rightShoulderX} ${shoulderY} L ${rightElbowX} ${rightElbowY} L ${rightHandX} ${rightHandY}`}
          fill="none"
          stroke={forearmsEvo.strokeColor}
          strokeWidth={forearmStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Forearm Veins (Level 51-100) */}
        {forearmsEvo.vascularity > 0 && (
          <G opacity={0.65 + forearmsEvo.vascularity * 0.35}>
            <Path
              d={`M ${leftElbowX} ${leftElbowY} Q ${(leftElbowX + leftHandX) / 2 - 2} ${(leftElbowY + leftHandY) / 2} ${leftHandX} ${leftHandY}`}
              stroke={forearmsEvo.veinColor}
              strokeWidth={0.8 + forearmsEvo.vascularity * 0.8}
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d={`M ${rightElbowX} ${rightElbowY} Q ${(rightElbowX + rightHandX) / 2 + 2} ${(rightElbowY + rightHandY) / 2} ${rightHandX} ${rightHandY}`}
              stroke={forearmsEvo.veinColor}
              strokeWidth={0.8 + forearmsEvo.vascularity * 0.8}
              fill="none"
              strokeLinecap="round"
            />
          </G>
        )}

        {/* ================= HIPS & GLUTES ================= */}
        <Line
          x1={leftHipX}
          y1={hipsY}
          x2={rightHipX}
          y2={hipsY}
          stroke={glutesEvo.strokeColor}
          strokeWidth={4 + glutesEvo.growth * 5}
          strokeLinecap="round"
        />

        {/* ================= LEGS (QUADS & HAMSTRINGS) ================= */}
        {/* Hamstrings contour (inner/rear thigh fullness) */}
        {hamsEvo.growth > 0.05 && (
          <G>
            <Path
              d={`M ${leftHipX + 2} ${hipsY + 2} Q ${(leftHipX + leftKneeX) / 2 + 3} ${(hipsY + leftKneeY) / 2} ${leftKneeX + 2} ${leftKneeY}`}
              stroke={hamsEvo.strokeColor}
              strokeWidth={2 + hamsEvo.growth * 3.5}
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d={`M ${rightHipX - 2} ${hipsY + 2} Q ${(rightHipX + rightKneeX) / 2 - 3} ${(hipsY + rightKneeY) / 2} ${rightKneeX - 2} ${rightKneeY}`}
              stroke={hamsEvo.strokeColor}
              strokeWidth={2 + hamsEvo.growth * 3.5}
              fill="none"
              strokeLinecap="round"
            />
          </G>
        )}

        {/* Left Leg Line */}
        <Path
          d={`M ${leftHipX} ${hipsY} L ${leftKneeX} ${leftKneeY} L ${leftFootX} ${leftFootY}`}
          fill="none"
          stroke={quadsEvo.strokeColor}
          strokeWidth={3.5 + quadsEvo.growth * 5.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Leg Line */}
        <Path
          d={`M ${rightHipX} ${hipsY} L ${rightKneeX} ${rightKneeY} L ${rightFootX} ${rightFootY}`}
          fill="none"
          stroke={quadsEvo.strokeColor}
          strokeWidth={3.5 + quadsEvo.growth * 5.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Quad Sweep & Teardrop (Outer muscle bellies) */}
        {quadsEvo.growth > 0.08 && (
          <G>
            {/* Left Quad Teardrop */}
            <Circle
              cx={leftKneeX - 3 - quadsEvo.growth * 2}
              cy={leftKneeY - 4}
              r={2 + quadsEvo.growth * 4.5}
              fill={quadsEvo.fillColor}
            />
            {/* Right Quad Teardrop */}
            <Circle
              cx={rightKneeX + 3 + quadsEvo.growth * 2}
              cy={rightKneeY - 4}
              r={2 + quadsEvo.growth * 4.5}
              fill={quadsEvo.fillColor}
            />
            {/* Quad Veins (Level 51-100) */}
            {quadsEvo.vascularity > 0 && (
              <G opacity={0.65 + quadsEvo.vascularity * 0.35}>
                <Path
                  d={`M ${leftHipX - 2} ${hipsY + 3} Q ${leftKneeX - 4} ${(hipsY + leftKneeY) / 2} ${leftKneeX} ${leftKneeY - 2}`}
                  stroke={quadsEvo.veinColor}
                  strokeWidth={0.8 + quadsEvo.vascularity * 0.9}
                  fill="none"
                  strokeLinecap="round"
                />
                <Path
                  d={`M ${rightHipX + 2} ${hipsY + 3} Q ${rightKneeX + 4} ${(hipsY + rightKneeY) / 2} ${rightKneeX} ${rightKneeY - 2}`}
                  stroke={quadsEvo.veinColor}
                  strokeWidth={0.8 + quadsEvo.vascularity * 0.9}
                  fill="none"
                  strokeLinecap="round"
                />
              </G>
            )}
          </G>
        )}

        {/* ================= CALVES ================= */}
        {calvesEvo.growth > 0.08 && (
          <G>
            {/* Left Calf Diamond */}
            <Circle
              cx={leftCalfX}
              cy={leftCalfY}
              r={calfRadius}
              fill={calvesEvo.fillColor}
            />
            {/* Right Calf Diamond */}
            <Circle
              cx={rightCalfX}
              cy={rightCalfY}
              r={calfRadius}
              fill={calvesEvo.fillColor}
            />
            {/* Calf Veins (Level 51-100) */}
            {calvesEvo.vascularity > 0 && (
              <G opacity={0.65 + calvesEvo.vascularity * 0.35}>
                <Path
                  d={`M ${leftKneeX} ${leftKneeY + 2} Q ${leftCalfX - 1} ${leftCalfY} ${leftFootX} ${leftFootY - 2}`}
                  stroke={calvesEvo.veinColor}
                  strokeWidth={0.7 + calvesEvo.vascularity * 0.7}
                  fill="none"
                  strokeLinecap="round"
                />
                <Path
                  d={`M ${rightKneeX} ${rightKneeY + 2} Q ${rightCalfX + 1} ${rightCalfY} ${rightFootX} ${rightFootY - 2}`}
                  stroke={calvesEvo.veinColor}
                  strokeWidth={0.7 + calvesEvo.vascularity * 0.7}
                  fill="none"
                  strokeLinecap="round"
                />
              </G>
            )}
          </G>
        )}

        {/* ================= COSMETICS ================= */}
        {equipped === 'chalk_dust' && (
          <>
            <Circle cx={leftHandX - 4} cy={leftHandY - 3} r="1.2" fill="#E8E4DC" opacity="0.85" />
            <Circle cx={leftHandX + 3} cy={leftHandY + 2} r="0.9" fill="#E8E4DC" opacity="0.6" />
            <Circle cx={rightHandX + 4} cy={rightHandY - 2} r="1.2" fill="#E8E4DC" opacity="0.85" />
            <Circle cx={rightHandX - 3} cy={rightHandY + 3} r="0.9" fill="#E8E4DC" opacity="0.6" />
          </>
        )}

        {equipped === 'wrist_wrap' && (
          <>
            <Line
              x1={leftElbowX + (leftHandX - leftElbowX) * 0.78 - 3}
              y1={leftElbowY + (leftHandY - leftElbowY) * 0.78}
              x2={leftElbowX + (leftHandX - leftElbowX) * 0.78 + 3}
              y2={leftElbowY + (leftHandY - leftElbowY) * 0.78}
              stroke={theme.colors.accent.secondary}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <Line
              x1={rightElbowX + (rightHandX - rightElbowX) * 0.78 - 3}
              y1={rightElbowY + (rightHandY - rightElbowY) * 0.78}
              x2={rightElbowX + (rightHandX - rightElbowX) * 0.78 + 3}
              y2={rightElbowY + (rightHandY - rightElbowY) * 0.78}
              stroke={theme.colors.accent.secondary}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </>
        )}

        {equipped === 'ember_crown' && (
          <>
            <Circle cx={headX - 4} cy={headY - headRadius - 3} r="2.2" fill={theme.colors.flame.warm} />
            <Circle cx={headX} cy={headY - headRadius - 6} r="2.8" fill={theme.colors.flame.hot} />
            <Circle cx={headX + 4} cy={headY - headRadius - 3} r="2.2" fill={theme.colors.gradient.flameEnd} />
          </>
        )}

        {/* Working out dumbbells */}
        {isWorkingOut && (
          <>
            <Path
              d={`M ${leftHandX - 6} ${leftHandY - 6} L ${leftHandX + 6} ${leftHandY + 6}`}
              stroke={theme.colors.accent.primary}
              strokeWidth="4"
              strokeLinecap="square"
            />
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
