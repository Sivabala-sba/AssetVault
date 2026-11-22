import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { WarrantyStatus } from '../../types/models';
import { Radius, Spacing, Typography } from '../../theme/tokens';

interface StatusChipProps {
  status: WarrantyStatus;
  label?: string;
  style?: ViewStyle;
  compact?: boolean;
}

const STATUS_LABEL: Record<WarrantyStatus, string> = {
  active:       'Active',
  expiringSoon: 'Expiring Soon',
  expired:      'Expired',
  unknown:      'No Warranty',
};

export function StatusChip({ status, label, style, compact = false }: StatusChipProps) {
  const theme = useAppTheme();

  const colorMap: Record<WarrantyStatus, { bg: string; text: string }> = {
    active:       { bg: theme.custom.statusActiveBg,   text: theme.custom.statusActive },
    expiringSoon: { bg: theme.custom.statusWarningBg,  text: theme.custom.statusWarning },
    expired:      { bg: theme.custom.statusDangerBg,   text: theme.custom.statusDanger },
    unknown:      { bg: theme.custom.surfaceVariant,   text: theme.custom.textSecondary },
  };

  const { bg, text } = colorMap[status];
  const displayLabel = label ?? STATUS_LABEL[status];

  return (
    <View
      style={[
        styles.chip,
        compact && styles.chipCompact,
        { backgroundColor: bg },
        style,
      ]}
    >
      <Text style={[compact ? styles.labelCompact : styles.label, { color: text }]}>
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
  },
  chipCompact: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  label: {
    ...Typography.labelMedium,
  },
  labelCompact: {
    ...Typography.labelSmall,
  },
});
