import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { EmptyState } from '../../src/components/common/EmptyState';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { Spacing, Typography } from '../../src/theme/tokens';

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.appName, { color: theme.colors.primary }]}>
            {t('home.title')}
          </Text>
          <Text style={[styles.tagline, { color: theme.custom.textSecondary }]}>
            {t('home.subtitle')}
          </Text>
        </View>

        {/* Empty State — assets will populate this in a later stage */}
        <EmptyState
          icon="archive-outline"
          title={t('home.emptyTitle')}
          subtitle={t('home.emptySubtitle')}
          style={styles.emptyState}
        />

        <Text style={[styles.comingSoon, { color: theme.custom.textDisabled }]}>
          Dashboard summary cards and warranty alerts — Coming in a later stage
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  appName: {
    ...Typography.displayMedium,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.bodyMedium,
  },
  emptyState: {
    marginTop: Spacing.xxxl,
  },
  comingSoon: {
    ...Typography.bodySmall,
    textAlign: 'center',
    padding: Spacing.xl,
    fontStyle: 'italic',
  },
});
