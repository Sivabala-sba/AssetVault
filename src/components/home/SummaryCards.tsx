import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from '../common/Card';
import { formatINR } from '../../logic/formatting';
import { Spacing, Typography, Radius } from '../../theme/tokens';
import type { DashboardSummary } from '../../logic/dashboard';

interface SummaryCardsProps {
  summary: DashboardSummary;
  onPressAssets: () => void;
  onPressWarranties?: () => void;
  onPressValue?: () => void;
}

export function SummaryCards({
  summary,
  onPressAssets,
  onPressWarranties,
  onPressValue,
}: SummaryCardsProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      {/* Total Assets */}
      <Card
        variant="outlined"
        onPress={onPressAssets}
        style={styles.card}
      >
        <View style={styles.cardContent}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <MaterialCommunityIcons
              name="cube-outline"
              size={20}
              color={theme.colors.primary}
            />
          </View>
          <Text style={[styles.cardValue, { color: theme.colors.onSurface }]}>
            {summary.totalAssets}
          </Text>
          <Text
            style={[styles.cardLabel, { color: theme.custom.textSecondary }]}
            numberOfLines={1}
          >
            {t('home.summaryAssets')}
          </Text>
        </View>
      </Card>

      {/* Active Warranties */}
      <Card
        variant="outlined"
        onPress={onPressWarranties || onPressAssets}
        style={styles.card}
      >
        <View style={styles.cardContent}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: theme.custom.statusActiveBg },
            ]}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={20}
              color={theme.custom.statusActive}
            />
          </View>
          <Text style={[styles.cardValue, { color: theme.custom.statusActive }]}>
            {summary.activeWarrantiesCount}
          </Text>
          <Text
            style={[styles.cardLabel, { color: theme.custom.textSecondary }]}
            numberOfLines={1}
          >
            {t('home.summaryWarrantiesActive')}
          </Text>
        </View>
      </Card>

      {/* Total Purchase Value (INR) */}
      <Card
        variant="outlined"
        onPress={onPressValue || onPressAssets}
        style={styles.card}
      >
        <View style={styles.cardContent}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: theme.custom.surfaceVariant },
            ]}
          >
            <MaterialCommunityIcons
              name="currency-inr"
              size={20}
              color={theme.colors.onSurface}
            />
          </View>
          <Text
            style={[styles.cardValue, styles.currencyValue, { color: theme.colors.onSurface }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatINR(summary.totalPurchaseValue)}
          </Text>
          <Text
            style={[styles.cardLabel, { color: theme.custom.textSecondary }]}
            numberOfLines={1}
          >
            {t('home.summaryTotalValue')}
          </Text>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  card: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  cardValue: {
    ...Typography.titleMedium,
    fontWeight: '700',
    marginBottom: 2,
  },
  currencyValue: {
    fontSize: 15,
  },
  cardLabel: {
    ...Typography.bodySmall,
    fontSize: 11,
    textAlign: 'center',
  },
});
