import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from '../common/Card';
import { StatusChip } from '../common/StatusChip';
import { Radius, Spacing, Typography } from '../../theme/tokens';
import { CATEGORY_MAP } from '../../constants/categories';
import { getWarrantyInfo, getWarrantyRelativeText } from '../../logic/warranty';
import type { Asset } from '../../types/models';

interface AssetCardProps {
  asset: Asset;
  onPress: () => void;
}

export function AssetCard({ asset, onPress }: AssetCardProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const categoryMeta = CATEGORY_MAP[asset.category];
  const categoryLabel = categoryMeta ? t(categoryMeta.labelKey) : asset.category;
  const iconName = (categoryMeta?.icon || 'package-variant') as any;

  const hasPhoto = asset.photos && asset.photos.length > 0;
  const brandAndModel = [asset.brand, asset.modelNumber].filter(Boolean).join(' • ');

  const warrantyInfo = getWarrantyInfo(asset);
  const relativeText = getWarrantyRelativeText(warrantyInfo);

  return (
    <Card
      onPress={onPress}
      elevated
      style={styles.card}
    >
      <View style={styles.contentRow}>
        {/* Photo / Icon Placeholder */}
        <View
          style={[
            styles.imageContainer,
            { backgroundColor: theme.custom.surfaceVariant },
          ]}
        >
          {hasPhoto ? (
            <Image
              source={{ uri: asset.photos[0] }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <MaterialCommunityIcons
              name={iconName}
              size={32}
              color={theme.colors.primary}
            />
          )}
        </View>

        {/* Info Column */}
        <View style={styles.infoCol}>
          <View style={styles.headerRow}>
            <Text
              style={[styles.name, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {asset.name}
            </Text>
            {/* Status Chip on card */}
            <StatusChip status={warrantyInfo.status} compact />
          </View>

          {brandAndModel ? (
            <Text
              style={[styles.brandModel, { color: theme.custom.textSecondary }]}
              numberOfLines={1}
            >
              {brandAndModel}
            </Text>
          ) : null}

          {/* Warranty sub-line if tracked */}
          {warrantyInfo.status !== 'unknown' && (
            <View style={styles.warrantyLine}>
              <MaterialCommunityIcons
                name="shield-outline"
                size={13}
                color={
                  warrantyInfo.status === 'expired'
                    ? theme.custom.statusDanger
                    : warrantyInfo.status === 'expiringSoon'
                    ? theme.custom.statusWarning
                    : theme.custom.statusActive
                }
              />
              <Text
                style={[
                  styles.warrantyText,
                  {
                    color:
                      warrantyInfo.status === 'expired'
                        ? theme.custom.statusDanger
                        : warrantyInfo.status === 'expiringSoon'
                        ? theme.custom.statusWarning
                        : theme.custom.textSecondary,
                  },
                ]}
              >
                {relativeText}
              </Text>
            </View>
          )}

          <View style={styles.metaRow}>
            {/* Category tag */}
            <View
              style={[
                styles.categoryTag,
                { backgroundColor: theme.custom.surfaceVariant },
              ]}
            >
              <Text
                style={[styles.categoryText, { color: theme.custom.textSecondary }]}
                numberOfLines={1}
              >
                {categoryLabel}
              </Text>
            </View>

            {/* Location tag if present */}
            {asset.location ? (
              <View style={styles.locationTag}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={14}
                  color={theme.custom.textSecondary}
                />
                <Text
                  style={[styles.locationText, { color: theme.custom.textSecondary }]}
                  numberOfLines={1}
                >
                  {asset.location}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Chevron */}
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={theme.custom.textDisabled}
          style={styles.chevron}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    padding: Spacing.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: Spacing.xs,
  },
  name: {
    ...Typography.titleSmall,
    fontWeight: '700',
    flex: 1,
  },
  brandModel: {
    ...Typography.bodySmall,
    marginBottom: 4,
  },
  warrantyLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  warrantyText: {
    ...Typography.labelSmall,
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  categoryTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  categoryText: {
    ...Typography.labelSmall,
    fontSize: 11,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    ...Typography.labelSmall,
    fontSize: 11,
  },
  chevron: {
    marginLeft: Spacing.xs,
  },
});
