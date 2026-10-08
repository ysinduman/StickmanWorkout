import React, { useId } from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import theme from '../../constants/theme';

interface FlameEffectProps {
  intensity: number; // 0.0 to 1.0
  size?: number;
}

export const FlameEffect: React.FC<FlameEffectProps> = ({ intensity, size = 24 }) => {
  const gradId = useId().replace(/:/g, '');
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
        <LinearGradient id={gradId} x1="0%" y1="100%" x2="0%" y2="0%">
          <Stop offset="0%" stopColor={colors.start} />
          <Stop offset="100%" stopColor={colors.end} />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 22c3.2-2.2 6-5.4 6-9.2C18 8.2 14.5 4.2 12 2 9.5 4.2 6 8.2 6 12.8 6 16.6 8.8 19.8 12 22z"
        fill={`url(#${gradId})`}
        opacity={colors.opacity}
      />
      <Path
        d="M12 20c1.6-1.3 3-3.2 3-5.4C15 12 13.4 9.6 12 8c-1.4 1.6-3 4-3 6.6 0 2.2 1.4 4.1 3 5.4z"
        fill="#FFE0B2"
        opacity={colors.opacity * 0.85}
      />
    </Svg>
  );
};
