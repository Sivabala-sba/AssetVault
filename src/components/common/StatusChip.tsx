import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { WarrantyStatus } from '../../types/models';
import { Radius, Spacing, Typography } from '../../theme/tokens';

interface StatusChipProps {
  status: WarrantyStatus;
  label?: string;
  style?: ViewStyle;
  compact?: boolean;
}

export function StatusChip({ status, label, style, compact = false }: StatusChipProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const colorMap: Record<WarrantyStatus, { bg: string; text: string }> = {
    active:            { bg: theme.custom.statusActiveBg,   text: theme.custom.statusActive },
    expiringSoon:      { bg: theme.custom.statusWarningBg,  text: theme.custom.statusWarning },
    expired:           { bg: theme.custom.statusDangerBg,   text: theme.custom.statusDanger },
    needsConfirmation: { bg: theme.custom.surfaceVariant,   text: theme.custom.statusWarning },
    unknown:           { bg: theme.custom.surfaceVariant,   text: theme.custom.textSecondary },
  };

  const defaultLabels: Record<WarrantyStatus, string> = {
    active:            t('warrantyStatus.active'),
    expiringSoon:      t('warrantyStatus.expiringSoon'),
    expired:           t('warrantyStatus.expired'),
    needsConfirmation: t('warrantyStatus.needsConfirmation'),
    unknown:           t('warrantyStatus.unknown'),
  };

  const { bg, text } = colorMap[status] || colorMap.unknown;
  const displayLabel = label ?? (defaultLabels[status] || status);

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
    fontWeight: '600',
  },
  labelCompact: {
    ...Typography.labelSmall,
    fontWeight: '600',
    fontSize: 11,
  },
});
