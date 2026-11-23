import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { EmptyState } from '../../src/components/common/EmptyState';
import { SummaryCards } from '../../src/components/home/SummaryCards';
import { OverdueCard } from '../../src/components/home/OverdueCard';
import { ExpiringSoonCard } from '../../src/components/home/ExpiringSoonCard';
import { UpcomingTaskCard } from '../../src/components/home/UpcomingTaskCard';
import { AllClearBanner } from '../../src/components/home/AllClearBanner';
import { AssetCard } from '../../src/components/asset/AssetCard';
import { assetRepository } from '../../src/db/assets';
import { reminderRepository } from '../../src/db/reminders';
import {
  getDashboardData,
  OverdueTaskItem,
  ExpiringSoonItem,
  UpcomingTaskItem,
} from '../../src/logic/dashboard';
import { Spacing, Typography, Radius } from '../../src/theme/tokens';
import type { Asset, Reminder } from '../../src/types/models';

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [allAssets, allReminders] = await Promise.all([
        assetRepository.getAll(),
        reminderRepository.getAll(),
      ]);
      setAssets(allAssets);
      setReminders(allReminders);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Compute dashboard aggregation
  const dashboard = useMemo(() => {
    return getDashboardData(assets, reminders);
  }, [assets, reminders]);

  // Navigation handlers
  const handleAssetPress = (id: string) => {
    router.push(`/asset/${id}` as any);
  };

  const handleOverduePress = (item: OverdueTaskItem) => {
    if (item.asset?.id) {
      router.push(`/asset/${item.asset.id}` as any);
    } else {
      router.push('/(tabs)/reminders' as any);
    }
  };

  const handleExpiringPress = (item: ExpiringSoonItem) => {
    if (item.asset?.id) {
      router.push(`/asset/${item.asset.id}` as any);
    } else if (item.reminder?.assetId && item.reminder.assetId !== 'general') {
      router.push(`/asset/${item.reminder.assetId}` as any);
    } else {
      router.push('/(tabs)/reminders' as any);
    }
  };

  const handleUpcomingPress = (item: UpcomingTaskItem) => {
    if (item.asset?.id) {
      router.push(`/asset/${item.asset.id}` as any);
    } else {
      router.push('/(tabs)/reminders' as any);
    }
  };

  const handleAddFirstAsset = () => {
    router.push('/asset/add' as any);
  };

  const handleViewAllAssets = () => {
    router.push('/(tabs)/assets' as any);
  };

  const handleViewAllReminders = () => {
    router.push('/(tabs)/reminders' as any);
  };

  const hasAlerts =
    dashboard.overdueTasks.length > 0 || dashboard.expiringSoon.length > 0;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header greeting */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.custom.textSecondary }]}>
            {t('home.greeting')}
          </Text>
          <Text style={[styles.appName, { color: theme.colors.onSurface }]}>
            {t('home.title')}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : dashboard.summary.totalAssets === 0 ? (
          /* Empty State for brand new user */
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="package-variant-closed-plus"
              title={t('home.emptyTitle')}
              subtitle={t('home.emptySubtitle')}
              actionLabel={t('home.emptyAction')}
              onAction={handleAddFirstAsset}
            />
          </View>
        ) : (
          /* Real Dashboard Content */
          <>
            {/* 1. Summary Cards (Top) */}
            <SummaryCards
              summary={dashboard.summary}
              onPressAssets={handleViewAllAssets}
            />

            {/* 2. Overdue Tasks (Highlighted at Top) */}
            {dashboard.overdueTasks.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleRow}>
                    <MaterialCommunityIcons
                      name="alert-octagon"
                      size={20}
                      color={theme.custom.statusDanger}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: theme.custom.statusDanger },
                      ]}
                    >
                      {t('home.sectionOverdue')} ({dashboard.overdueTasks.length})
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleViewAllReminders}>
                    <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                      {t('home.seeAll')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {dashboard.overdueTasks.map((item) => (
                  <OverdueCard
                    key={item.id}
                    item={item}
                    onPress={() => handleOverduePress(item)}
                  />
                ))}
              </View>
            )}

            {/* 3. Expiring Soon (Within 60 Days: Warranties & Reminders) */}
            {dashboard.expiringSoon.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleRow}>
                    <MaterialCommunityIcons
                      name="clock-alert-outline"
                      size={20}
                      color={theme.custom.statusWarning}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {t('home.sectionExpiringSoon')} ({dashboard.expiringSoon.length})
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleViewAllReminders}>
                    <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                      {t('home.seeAll')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {dashboard.expiringSoon.map((item) => (
                  <ExpiringSoonCard
                    key={item.id}
                    item={item}
                    onPress={() => handleExpiringPress(item)}
                  />
                ))}
              </View>
            )}

            {/* 4. All Clear Banner (when no overdue or expiring alerts) */}
            {!hasAlerts && <AllClearBanner />}

            {/* 5. Upcoming Tasks / Maintenance */}
            {dashboard.upcomingTasks.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleRow}>
                    <MaterialCommunityIcons
                      name="calendar-month-outline"
                      size={20}
                      color={theme.colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {t('home.sectionUpcoming')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleViewAllReminders}>
                    <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                      {t('home.seeAll')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {dashboard.upcomingTasks.slice(0, 4).map((item) => (
                  <UpcomingTaskCard
                    key={item.id}
                    item={item}
                    onPress={() => handleUpcomingPress(item)}
                  />
                ))}
              </View>
            )}

            {/* 6. Recently Added Assets */}
            {dashboard.recentAssets.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleRow}>
                    <MaterialCommunityIcons
                      name="history"
                      size={20}
                      color={theme.colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {t('home.recentAssets')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleViewAllAssets}>
                    <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                      {t('home.seeAll')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {dashboard.recentAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onPress={() => handleAssetPress(asset.id)}
                  />
                ))}
              </View>
            )}
          </>
        )}
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
    paddingBottom: Spacing.xxl * 2,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    ...Typography.bodySmall,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: 2,
  },
  appName: {
    ...Typography.headlineMedium,
    fontWeight: '800',
  },
  loadingContainer: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.titleSmall,
    fontWeight: '700',
  },
  seeAllText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
});
