import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import theme from '../../constants/theme';

interface FlameEffectProps {
  intensity: number; // 0.0 to 1.0
  size?: number;
}

export const FlameEffect: React.FC<FlameEffectProps> = ({ intensity, size = 24 }) => {
  if (intensity <= 0) return null;

  // Set colors based on intensity level (1.0, 0.5, 0.3)
  const getFlameColors = () => {
    if (intensity >= 0.8) {
      return {
        start: theme.colors.flame.hot,
        end: theme.colors.gradient.flameEnd,
        opacity: 1.0,
      };
    } else if (intensity >= 0.4) {
      return {
        start: theme.colors.flame.warm,
        end: theme.colors.gradient.flameMiddle,
        opacity: 0.7,
      };
    } else {
      return {
        start: theme.colors.flame.ember,
        end: theme.colors.flame.out,
        opacity: 0.4,
      };
    }
  };

  const colors = getFlameColors();

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <Stop offset="0%" stopColor={colors.start} />
          <Stop offset="100%" stopColor={colors.end} />
        </LinearGradient>
      </Defs>
      <Path
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        fill="url(#flameGrad)"
        opacity={colors.opacity}
      />
      <Path
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        fill="#FFE0B2"
        opacity={colors.opacity * 0.8}
      />
    </Svg>
  );
};
