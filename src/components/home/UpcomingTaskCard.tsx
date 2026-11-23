import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from '../common/Card';
import { formatIndianDate } from '../../logic/formatting';
import { Spacing, Typography, Radius } from '../../theme/tokens';
import type { UpcomingTaskItem } from '../../logic/dashboard';

interface UpcomingTaskCardProps {
  item: UpcomingTaskItem;
  onPress: () => void;
}

export function UpcomingTaskCard({ item, onPress }: UpcomingTaskCardProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <Card
      variant="outlined"
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.contentRow}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="calendar-clock"
            size={18}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.infoCol}>
          <Text
            style={[styles.title, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            {item.reminder.title}
          </Text>

          {item.asset && (
            <Text
              style={[styles.assetName, { color: theme.custom.textSecondary }]}
              numberOfLines={1}
            >
              {item.asset.name}
            </Text>
          )}

          <Text style={[styles.dueText, { color: theme.colors.primary }]}>
            Due {formatIndianDate(item.reminder.dueDate)} • {item.daysRemaining} days left
          </Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={theme.custom.textSecondary}
          style={styles.chevron}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  infoCol: {
    flex: 1,
  },
  title: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  assetName: {
    ...Typography.bodySmall,
    marginTop: 1,
  },
  dueText: {
    ...Typography.bodySmall,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  chevron: {
    marginLeft: Spacing.xs,
  },
});
