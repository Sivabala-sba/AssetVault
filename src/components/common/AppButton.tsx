import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Radius } from '../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  fullWidth = false,
}: AppButtonProps) {
  const theme = useAppTheme();

  const modeMap: Record<ButtonVariant, 'contained' | 'outlined' | 'text'> = {
    primary:   'contained',
    secondary: 'contained',
    outline:   'outlined',
    ghost:     'text',
    danger:    'contained',
  };

  const buttonColor =
    variant === 'danger'
      ? theme.colors.error
      : variant === 'secondary'
      ? theme.custom.surfaceVariant
      : undefined;

  const textColor =
    variant === 'danger'
      ? '#fff'
      : variant === 'secondary'
      ? theme.colors.onSurface
      : undefined;

  return (
    <PaperButton
      mode={modeMap[variant]}
      onPress={onPress}
      disabled={disabled || loading}
      loading={loading}
      icon={icon}
      buttonColor={buttonColor}
      textColor={textColor}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        style,
      ]}
      contentStyle={styles.content}
      labelStyle={styles.label}
    >
      {label}
    </PaperButton>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    height: 48,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
