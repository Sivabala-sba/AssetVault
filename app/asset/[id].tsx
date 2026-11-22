import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { Card } from '../../src/components/common/Card';
import { AppButton } from '../../src/components/common/AppButton';
import { assetRepository } from '../../src/db/assets';
import { CATEGORY_MAP, SUB_TYPES } from '../../src/constants/categories';
import { formatIndianDate, formatINR } from '../../src/logic/formatting';
import { Radius, Spacing, Typography } from '../../src/theme/tokens';
import type { Asset } from '../../src/types/models';

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAsset = useCallback(async () => {
    if (!id) return;
    try {
      const data = await assetRepository.getById(id);
      setAsset(data);
    } catch (e) {
      console.error('Failed to fetch asset:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchAsset();
    }, [fetchAsset])
  );

  const handleEdit = () => {
    if (!asset) return;
    router.push(`/asset/edit/${asset.id}` as any);
  };

  const handleDelete = () => {
    if (!asset) return;

    Alert.alert(
      t('assetDetail.deleteTitle'),
      t('assetDetail.deleteMessage', { name: asset.name }),
      [
        { text: t('assetDetail.deleteCancel'), style: 'cancel' },
        {
          text: t('assetDetail.deleteConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await assetRepository.delete(asset.id);
              router.replace('/(tabs)/assets');
            } catch (e) {
              console.error('Failed to delete asset:', e);
              Alert.alert(t('common.error'), t('errors.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safe, styles.center, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!asset) {
    return (
      <SafeAreaView
        style={[styles.safe, styles.center, { backgroundColor: theme.colors.background }]}
      >
        <Text style={[styles.notFound, { color: theme.custom.textSecondary }]}>
          {t('errors.loadFailed')}
        </Text>
        <AppButton
          label={t('common.back')}
          onPress={() => router.back()}
          style={{ marginTop: Spacing.md }}
        />
      </SafeAreaView>
    );
  }

  const categoryMeta = CATEGORY_MAP[asset.category];
  const categoryLabel = categoryMeta ? t(categoryMeta.labelKey) : asset.category;
  const iconName = (categoryMeta?.icon || 'package-variant') as any;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Top Header */}
      <View style={[styles.topBar, { borderBottomColor: theme.custom.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.onSurface}
          />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
          {asset.name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.navBtn}>
            <MaterialCommunityIcons
              name="pencil-outline"
              size={22}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.navBtn}>
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={22}
              color={theme.colors.error}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Card elevated style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View
              style={[
                styles.heroIconBox,
                { backgroundColor: theme.custom.surfaceVariant },
              ]}
            >
              <MaterialCommunityIcons
                name={iconName}
                size={36}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={[styles.heroName, { color: theme.colors.onSurface }]}>
                {asset.name}
              </Text>
              {(asset.brand || asset.modelNumber) && (
                <Text style={[styles.heroBrand, { color: theme.custom.textSecondary }]}>
                  {[asset.brand, asset.modelNumber].filter(Boolean).join(' • ')}
                </Text>
              )}
              <View style={styles.heroBadgeRow}>
                <View
                  style={[
                    styles.heroBadge,
                    { backgroundColor: theme.custom.surfaceVariant },
                  ]}
                >
                  <Text
                    style={[styles.heroBadgeText, { color: theme.custom.textSecondary }]}
                  >
                    {categoryLabel}
                  </Text>
                </View>
                {asset.location && (
                  <View style={styles.heroLocation}>
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={14}
                      color={theme.custom.textSecondary}
                    />
                    <Text
                      style={[styles.heroBadgeText, { color: theme.custom.textSecondary }]}
                    >
                      {asset.location}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Card>

        {/* Section 1: Basic Information */}
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t('assetDetail.basicInfo')}
        </Text>
        <Card variant="outlined" style={styles.sectionCard}>
          <DetailRow label={t('assetDetail.brand')} value={asset.brand} />
          <DetailRow label={t('assetDetail.modelNumber')} value={asset.modelNumber} />
          <DetailRow label={t('assetDetail.serialNumber')} value={asset.serialNumber} />
          {asset.imeiNumber && (
            <DetailRow label={t('assetDetail.imeiNumber')} value={asset.imeiNumber} />
          )}
          <DetailRow label={t('assetDetail.category')} value={categoryLabel} />
          <DetailRow label={t('assetDetail.location')} value={asset.location} />
          <DetailRow
            label={t('assetDetail.purchaseDate')}
            value={asset.purchaseDate ? formatIndianDate(asset.purchaseDate) : undefined}
          />
          <DetailRow
            label={t('assetDetail.purchasePrice')}
            value={asset.purchasePrice ? formatINR(asset.purchasePrice) : undefined}
          />
          <DetailRow label={t('assetDetail.seller')} value={asset.seller} />
          <DetailRow label={t('assetDetail.invoiceNumber')} value={asset.invoiceNumber} />
          {asset.notes && (
            <View style={styles.notesContainer}>
              <Text style={[styles.detailLabel, { color: theme.custom.textSecondary }]}>
                {t('assetDetail.notes')}
              </Text>
              <Text style={[styles.notesValue, { color: theme.colors.onSurface }]}>
                {asset.notes}
              </Text>
            </View>
          )}
        </Card>

        {/* Section 2: Warranty (Placeholder) */}
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t('assetDetail.warrantySection')}
        </Text>
        <Card variant="outlined" style={styles.placeholderCard}>
          <MaterialCommunityIcons
            name="shield-outline"
            size={28}
            color={theme.custom.textSecondary}
            style={styles.placeholderIcon}
          />
          <Text style={[styles.placeholderText, { color: theme.custom.textSecondary }]}>
            {t('assetDetail.warrantyComingSoon')}
          </Text>
        </Card>

        {/* Section 3: Maintenance (Placeholder) */}
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t('assetDetail.maintenanceSection')}
        </Text>
        <Card variant="outlined" style={styles.placeholderCard}>
          <MaterialCommunityIcons
            name="wrench-outline"
            size={28}
            color={theme.custom.textSecondary}
            style={styles.placeholderIcon}
          />
          <Text style={[styles.placeholderText, { color: theme.custom.textSecondary }]}>
            {t('assetDetail.maintenanceComingSoon')}
          </Text>
        </Card>

        {/* Section 4: Documents (Placeholder) */}
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t('assetDetail.documentsSection')}
        </Text>
        <Card variant="outlined" style={styles.placeholderCard}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={28}
            color={theme.custom.textSecondary}
            style={styles.placeholderIcon}
          />
          <Text style={[styles.placeholderText, { color: theme.custom.textSecondary }]}>
            {t('assetDetail.documentsComingSoon')}
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  const theme = useAppTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.rowContainer, { borderBottomColor: theme.custom.border }]}>
      <Text style={[styles.detailLabel, { color: theme.custom.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.detailValue,
          { color: value ? theme.colors.onSurface : theme.custom.textDisabled },
        ]}
      >
        {value || t('assetDetail.notSpecified')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  navBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    ...Typography.titleMedium,
    fontWeight: '700',
    marginHorizontal: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  heroCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconBox: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  heroTextCol: {
    flex: 1,
  },
  heroName: {
    ...Typography.titleLarge,
    fontWeight: '700',
    marginBottom: 2,
  },
  heroBrand: {
    ...Typography.bodyMedium,
    marginBottom: 6,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  heroBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  heroBadgeText: {
    ...Typography.labelSmall,
    fontSize: 12,
  },
  heroLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionTitle: {
    ...Typography.titleSmall,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  detailLabel: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  detailValue: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    flex: 1.2,
    textAlign: 'right',
  },
  notesContainer: {
    paddingTop: Spacing.sm,
  },
  notesValue: {
    ...Typography.bodyMedium,
    marginTop: 4,
    lineHeight: 20,
  },
  placeholderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  placeholderIcon: {
    marginRight: Spacing.md,
  },
  placeholderText: {
    ...Typography.bodySmall,
    fontStyle: 'italic',
    flex: 1,
  },
  notFound: {
    ...Typography.bodyLarge,
  },
});
