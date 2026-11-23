import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from '../common/Card';
import { formatIndianDate } from '../../logic/formatting';
import { Spacing, Typography, Radius } from '../../theme/tokens';
import type { OverdueTaskItem } from '../../logic/dashboard';

interface OverdueCardProps {
  item: OverdueTaskItem;
  onPress: () => void;
}

export function OverdueCard({ item, onPress }: OverdueCardProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const overdueText =
    item.daysOverdue === 1
      ? t('home.overdueByOneDay')
      : t('home.overdueBy', { count: item.daysOverdue });

  return (
    <Card
      variant="outlined"
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.custom.statusDangerBg,
          borderColor: theme.custom.statusDanger,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: theme.custom.statusDanger },
          ]}
        >
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={22}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.infoCol}>
          <View style={styles.topLine}>
            <Text
              style={[styles.title, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {item.reminder.title}
            </Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: theme.custom.statusDanger },
              ]}
            >
              <Text style={styles.badgeText}>{overdueText}</Text>
            </View>
          </View>

          {item.asset && (
            <View style={styles.assetRow}>
              <MaterialCommunityIcons
                name="cube-outline"
                size={13}
                color={theme.custom.textSecondary}
              />
              <Text
                style={[styles.assetName, { color: theme.custom.textSecondary }]}
                numberOfLines={1}
              >
                {item.asset.name}
              </Text>
            </View>
          )}

          <Text style={[styles.dueText, { color: theme.custom.statusDanger }]}>
            Due {formatIndianDate(item.reminder.dueDate)}
          </Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={theme.custom.statusDanger}
          style={styles.chevron}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  infoCol: {
    flex: 1,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  title: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    ...Typography.bodySmall,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  assetName: {
    ...Typography.bodySmall,
  },
  dueText: {
    ...Typography.bodySmall,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  chevron: {
    marginLeft: Spacing.xs,
  },
});
