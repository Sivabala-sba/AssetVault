import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Radius } from '../../theme/tokens';

interface AppTextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  disabled?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export function AppTextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  disabled = false,
  left,
  right,
  style,
}: AppTextFieldProps) {
  const theme = useAppTheme();

  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      error={!!error}
      multiline={multiline}
      numberOfLines={multiline ? numberOfLines : undefined}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      secureTextEntry={secureTextEntry}
      disabled={disabled}
      left={left}
      right={right}
      mode="outlined"
      style={[styles.input, multiline && styles.multiline, style]}
      outlineStyle={styles.outline}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: 'transparent',
  },
  multiline: {
    minHeight: 80,
  },
  outline: {
    borderRadius: Radius.md,
  },
});
