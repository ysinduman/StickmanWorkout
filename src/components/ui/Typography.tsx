import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import theme from '../../constants/theme';

function upperForLanguage(value: string, language: string): string {
  if (language.toLowerCase().startsWith('tr')) {
    return value.replace(/i/g, '\u0130').replace(/\u0131/g, 'I').toUpperCase();
  }
  return value.toUpperCase();
}

function upperNode(node: React.ReactNode, language: string): React.ReactNode {
  if (typeof node === 'string') return upperForLanguage(node, language);
  if (typeof node === 'number') return upperForLanguage(String(node), language);
  if (Array.isArray(node)) return node.map(child => upperNode(child, language));
  return node;
}

interface TypographyCustomProps extends TextProps {
  variant?: 'display' | 'title1' | 'title2' | 'body' | 'bodyMuted' | 'caption' | 'label';
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  color?: string;
}

export const Typography: React.FC<TypographyCustomProps> = ({
  children,
  variant = 'body',
  align = 'left',
  bold = false,
  color,
  style,
  ...props
}) => {
  const { i18n } = useTranslation();
  const isLabel = variant === 'label';
  const content = isLabel ? upperNode(children, i18n.language || 'tr') : children;

  const getVariantStyle = () => {
    switch (variant) {
      case 'display':
        return styles.display;
      case 'title1':
        return styles.title1;
      case 'title2':
        return styles.title2;
      case 'bodyMuted':
        return styles.bodyMuted;
      case 'caption':
        return styles.caption;
      case 'label':
        return styles.label;
      case 'body':
      default:
        return styles.body;
    }
  };

  return (
    <Text
      style={[
        styles.base,
        getVariantStyle(),
        { textAlign: align },
        color ? { color } : null,
        bold && styles.bold,
        style,
        isLabel ? { textTransform: 'none' as const } : null,
      ]}
      {...props}
    >
      {content}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    color: theme.colors.text.primary,
  },
  display: {
    fontSize: theme.typography.fontSize.display,
    lineHeight: theme.typography.fontSize.display * theme.typography.lineHeight.tight,
    fontWeight: '800',
  },
  title1: {
    fontSize: theme.typography.fontSize.xxl,
    lineHeight: theme.typography.fontSize.xxl * theme.typography.lineHeight.tight,
    fontWeight: '700',
  },
  title2: {
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.fontSize.xl * theme.typography.lineHeight.tight,
    fontWeight: '600',
  },
  body: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
    fontWeight: '400',
  },
  bodyMuted: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
    color: theme.colors.text.secondary,
    fontWeight: '400',
  },
  caption: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
    color: theme.colors.text.tertiary,
    fontWeight: '400',
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.tight,
    letterSpacing: 1,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  bold: {
    fontWeight: '700',
  },
});
