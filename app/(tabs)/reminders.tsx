import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { EmptyState } from '../../src/components/common/EmptyState';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { Typography, Spacing } from '../../src/theme/tokens';

export default function RemindersScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <SectionHeader title={t('reminders.title')} />

      <EmptyState
        icon="bell-sleep-outline"
        title={t('reminders.emptyTitle')}
        subtitle={t('reminders.emptySubtitle')}
      />

      <Text style={[styles.comingSoon, { color: theme.custom.textDisabled }]}>
        Reminder list, snooze and status filters — Coming in a later stage
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  comingSoon: {
    ...Typography.bodySmall,
    textAlign: 'center',
    padding: Spacing.xl,
    fontStyle: 'italic',
  },
});
