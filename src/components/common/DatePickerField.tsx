import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Radius, Spacing, Typography } from '../../theme/tokens';
import { formatIndianDate } from '../../logic/formatting';

interface DatePickerFieldProps {
  label: string;
  value?: string | null; // ISO date string
  onPress: () => void;
  placeholder?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export function DatePickerField({
  label,
  value,
  onPress,
  placeholder = 'Select date',
  style,
  disabled = false,
}: DatePickerFieldProps) {
  const theme = useAppTheme();

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          borderColor: theme.custom.border,
          backgroundColor: theme.colors.surface,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: theme.custom.textSecondary }]}>{label}</Text>
        <Text
          style={[
            styles.value,
            { color: value ? theme.colors.onSurface : theme.custom.textDisabled },
          ]}
        >
          {value ? formatIndianDate(value) : placeholder}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="calendar-outline"
        size={22}
        color={theme.custom.textSecondary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    ...Typography.labelSmall,
    marginBottom: 2,
  },
  value: {
    ...Typography.bodyLarge,
  },
  disabled: {
    opacity: 0.5,
  },
});
