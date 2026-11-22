import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { Card } from '../../src/components/common/Card';
import { AppButton } from '../../src/components/common/AppButton';
import { StatusChip } from '../../src/components/common/StatusChip';
import { assetRepository } from '../../src/db/assets';
import { CATEGORY_MAP } from '../../src/constants/categories';
import { formatIndianDate, formatINR, formatIndianPhone } from '../../src/logic/formatting';
import { getWarrantyInfo, getWarrantyRelativeText } from '../../src/logic/warranty';
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
    router.push({ pathname: '/asset/edit', params: { id: asset.id } } as any);
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

  const handleCallCustomerCare = async (phone: string) => {
    const cleanNumber = phone.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanNumber}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('common.error'), t('assetDetail.callFailed'));
      }
    } catch {
      Alert.alert(t('common.error'), t('assetDetail.callFailed'));
    }
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

  // Warranty calculations (Stage 2)
  const warrantyInfo = getWarrantyInfo(asset);
  const relativeWarrantyText = getWarrantyRelativeText(warrantyInfo);
  const hasAnyWarrantyData = Boolean(
    asset.warrantyProvider ||
      asset.warrantyStartDate ||
      asset.warrantyEndDate ||
      asset.warrantyDurationMonths ||
      asset.customerCareNumber ||
      asset.coverageDetails ||
      asset.exclusions ||
      asset.claimInstructions
  );

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
              <View style={styles.heroTopLine}>
                <Text style={[styles.heroName, { color: theme.colors.onSurface }]}>
                  {asset.name}
                </Text>
                <StatusChip status={warrantyInfo.status} compact />
              </View>

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

        {/* Section 2: Warranty (Stage 2) */}
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t('assetDetail.warrantySection')}
        </Text>

        {!hasAnyWarrantyData ? (
          <Card variant="outlined" style={styles.noWarrantyCard}>
            <MaterialCommunityIcons
              name="shield-off-outline"
              size={28}
              color={theme.custom.textSecondary}
              style={{ marginRight: Spacing.md }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.noWarrantyTitle, { color: theme.colors.onSurface }]}>
                {t('assetDetail.noWarrantyDetails')}
              </Text>
            </View>
          </Card>
        ) : (
          <View>
            {/* Warranty Status Banner */}
            <Card elevated style={styles.warrantyBannerCard}>
              <View style={styles.warrantyBannerHeader}>
                <View style={styles.warrantyStatusRow}>
                  <StatusChip status={warrantyInfo.status} />
                  <Text style={[styles.warrantyRelativeText, { color: theme.colors.onSurface }]}>
                    {relativeWarrantyText}
                  </Text>
                </View>

                {warrantyInfo.endDate && (
                  <View style={styles.expiryBox}>
                    <Text style={[styles.expiryLabel, { color: theme.custom.textSecondary }]}>
                      {t('assetDetail.warrantyEndDate')}
                    </Text>
                    <Text style={[styles.expiryValue, { color: theme.colors.primary }]}>
                      {formatIndianDate(warrantyInfo.endDate)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Needs confirmation alert */}
              {warrantyInfo.needsConfirmation && (
                <View
                  style={[
                    styles.needsConfirmBanner,
                    {
                      backgroundColor: theme.custom.statusWarningBg,
                      borderColor: theme.custom.statusWarning,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={20}
                    color={theme.custom.statusWarning}
                    style={{ marginRight: Spacing.xs }}
                  />
                  <Text style={[styles.needsConfirmText, { color: theme.custom.statusWarning }]}>
                    {t('assetDetail.needsConfirmationPrompt')}
                  </Text>
                </View>
              )}
            </Card>

            {/* Detailed Warranty Fields */}
            <Card variant="outlined" style={styles.sectionCard}>
              <DetailRow
                label={t('assetDetail.warrantyProvider')}
                value={asset.warrantyProvider}
              />
              <DetailRow
                label={t('assetDetail.warrantyStartDate')}
                value={
                  asset.warrantyStartDate
                    ? formatIndianDate(asset.warrantyStartDate)
                    : undefined
                }
              />
              <DetailRow
                label={t('assetDetail.warrantyDuration')}
                value={
                  asset.warrantyDurationMonths
                    ? t('assetDetail.warrantyMonths', { count: asset.warrantyDurationMonths })
                    : undefined
                }
              />
              <DetailRow
                label={t('assetDetail.warrantyEndDate')}
                value={
                  warrantyInfo.endDate
                    ? formatIndianDate(warrantyInfo.endDate)
                    : undefined
                }
              />

              {/* Customer Care with Tap-to-Call */}
              {asset.customerCareNumber && (
                <View style={[styles.rowContainer, { borderBottomColor: theme.custom.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.custom.textSecondary }]}>
                    {t('assetDetail.customerCare')}
                  </Text>
                  <View style={styles.phoneActionCol}>
                    <Text style={[styles.phoneText, { color: theme.colors.onSurface }]}>
                      {formatIndianPhone(asset.customerCareNumber)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleCallCustomerCare(asset.customerCareNumber!)}
                      style={[
                        styles.callBtn,
                        { backgroundColor: theme.colors.primary },
                      ]}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="phone" size={16} color="#ffffff" />
                      <Text style={styles.callBtnText}>{t('assetDetail.call')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Coverage Details */}
              {asset.coverageDetails && (
                <View style={styles.notesContainer}>
                  <Text style={[styles.detailLabel, { color: theme.custom.textSecondary }]}>
                    {t('assetDetail.coverage')}
                  </Text>
                  <Text style={[styles.notesValue, { color: theme.colors.onSurface }]}>
                    {asset.coverageDetails}
                  </Text>
                </View>
              )}

              {/* Exclusions */}
              {asset.exclusions && (
                <View style={styles.notesContainer}>
                  <Text style={[styles.detailLabel, { color: theme.custom.textSecondary }]}>
                    {t('assetDetail.exclusions')}
                  </Text>
                  <Text style={[styles.notesValue, { color: theme.colors.onSurface }]}>
                    {asset.exclusions}
                  </Text>
                </View>
              )}

              {/* Claim Instructions */}
              {asset.claimInstructions && (
                <View style={styles.notesContainer}>
                  <Text style={[styles.detailLabel, { color: theme.custom.textSecondary }]}>
                    {t('assetDetail.claimInstructions')}
                  </Text>
                  <Text style={[styles.notesValue, { color: theme.colors.onSurface }]}>
                    {asset.claimInstructions}
                  </Text>
                </View>
              )}
            </Card>
          </View>
        )}

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
  heroTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: Spacing.xs,
  },
  heroName: {
    ...Typography.titleLarge,
    fontWeight: '700',
    flex: 1,
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
    alignItems: 'center',
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
  phoneActionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  phoneText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  callBtnText: {
    color: '#ffffff',
    ...Typography.labelSmall,
    fontWeight: '700',
  },
  notesContainer: {
    paddingTop: Spacing.sm,
  },
  notesValue: {
    ...Typography.bodyMedium,
    marginTop: 4,
    lineHeight: 20,
  },
  noWarrantyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  noWarrantyTitle: {
    ...Typography.bodyMedium,
    fontWeight: '500',
  },
  warrantyBannerCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  warrantyBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  warrantyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  warrantyRelativeText: {
    ...Typography.titleSmall,
    fontWeight: '700',
  },
  expiryBox: {
    alignItems: 'flex-end',
  },
  expiryLabel: {
    ...Typography.labelSmall,
    fontSize: 11,
  },
  expiryValue: {
    ...Typography.titleSmall,
    fontWeight: '700',
  },
  needsConfirmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  needsConfirmText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    flex: 1,
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
