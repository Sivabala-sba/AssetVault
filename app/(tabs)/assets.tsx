import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { FAB, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { EmptyState } from '../../src/components/common/EmptyState';
import { AssetCard } from '../../src/components/asset/AssetCard';
import { assetRepository } from '../../src/db/assets';
import { Spacing } from '../../src/theme/tokens';
import type { Asset } from '../../src/types/models';

export default function AssetsScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAssets = useCallback(async () => {
    try {
      const data = await assetRepository.getAll();
      setAssets(data);
    } catch (e) {
      console.error('Failed to load assets:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAssets();
    }, [loadAssets])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadAssets();
  };

  const handleAddPress = () => {
    router.push('/asset/add' as any);
  };

  const handleAssetPress = (id: string) => {
    router.push(`/asset/${id}` as any);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <SectionHeader
        title={t('assets.title')}
        subtitle={assets.length > 0 ? t('assets.totalCount', { count: assets.length }) : undefined}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : assets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="package-variant-closed-plus"
            title={t('assets.emptyTitle')}
            subtitle={t('assets.emptySubtitle')}
            actionLabel={t('assets.addFirstAsset')}
            onAction={handleAddPress}
          />
        </View>
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AssetCard
              asset={item}
              onPress={() => handleAssetPress(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}

      {/* Floating Action Button */}
      {assets.length > 0 && (
        <FAB
          icon="plus"
          onPress={handleAddPress}
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color="#ffffff"
          label={t('assets.addAsset')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.xxl * 2,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    elevation: 6,
  },
});
