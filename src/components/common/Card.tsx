import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Radius, Spacing, Elevation } from '../../theme/tokens';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevated?: boolean;
  variant?: 'default' | 'outlined';
}

export function Card({
  children,
  style,
  onPress,
  elevated = false,
  variant = 'default',
  ...rest
}: CardProps) {
  const theme = useAppTheme();

  const containerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...(variant === 'outlined'
      ? { borderWidth: 1, borderColor: theme.custom.border }
      : {}),
    ...(elevated
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: Elevation.low,
        }
      : {}),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[containerStyle, style]}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[containerStyle, style]}>{children}</View>;
}
