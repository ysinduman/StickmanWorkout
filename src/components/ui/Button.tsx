import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import theme from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
        };
      case 'outline':
        return {
          container: styles.outlineContainer,
          text: styles.outlineText,
        };
      case 'text':
        return {
          container: styles.textContainer,
          text: styles.textText,
        };
      case 'primary':
      default:
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const isButtonDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.baseContainer,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        isButtonDisabled && styles.disabledContainer,
        style,
      ]}
      disabled={isButtonDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? theme.colors.text.inverse : theme.colors.accent.primary}
        />
      ) : (
        <Text style={[styles.baseText, variantStyles.text, isButtonDisabled && styles.disabledText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    height: 50,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    flexDirection: 'row',
  },
  baseText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
  },
  fullWidth: {
    width: '100%',
  },
  primaryContainer: {
    backgroundColor: theme.colors.accent.primary,
    ...theme.shadows.button,
  },
  primaryText: {
    color: theme.colors.text.inverse,
  },
  secondaryContainer: {
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryText: {
    color: theme.colors.text.primary,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.accent.primary,
  },
  outlineText: {
    color: theme.colors.accent.primary,
  },
  textContainer: {
    backgroundColor: 'transparent',
    height: 'auto',
    paddingHorizontal: 0,
  },
  textText: {
    color: theme.colors.accent.primary,
  },
  disabledContainer: {
    backgroundColor: theme.colors.background.tertiary,
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: theme.colors.text.tertiary,
  },
});
