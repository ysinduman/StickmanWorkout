import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import theme from '../../constants/theme';

interface CardProps extends ViewProps {
  variant?: 'primary' | 'secondary' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'primary',
  style,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'elevated':
        return styles.elevated;
      case 'primary':
      default:
        return styles.primary;
    }
  };

  return (
    <View style={[styles.base, getVariantStyle(), style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  primary: {
    backgroundColor: theme.colors.background.secondary,
  },
  secondary: {
    backgroundColor: theme.colors.background.tertiary,
  },
  elevated: {
    backgroundColor: theme.colors.background.secondary,
    ...theme.shadows.card,
  },
});
