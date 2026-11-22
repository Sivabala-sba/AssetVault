import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Spacing, Typography } from '../../theme/tokens';

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function SectionHeader({ title, action, style }: SectionHeaderProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.title,
          { color: theme.colors.onSurface },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  title: {
    ...Typography.headlineSmall,
    flex: 1,
  },
  action: {
    marginLeft: Spacing.sm,
  },
});
