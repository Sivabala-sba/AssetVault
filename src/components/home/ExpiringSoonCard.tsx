import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from '../common/Card';
import { formatIndianDate } from '../../logic/formatting';
import { Spacing, Typography, Radius } from '../../theme/tokens';
import type { ExpiringSoonItem } from '../../logic/dashboard';

interface ExpiringSoonCardProps {
  item: ExpiringSoonItem;
  onPress: () => void;
}

export function ExpiringSoonCard({ item, onPress }: ExpiringSoonCardProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const isWarranty = item.type === 'warranty';

  // Example wording: "Washing machine warranty expires in 45 days."
  let messageText = '';
  if (isWarranty) {
    if (item.daysRemaining === 0) {
      messageText = t('home.warrantyExpiresToday', { name: item.title });
    } else if (item.daysRemaining === 1) {
      messageText = t('home.warrantyExpiresInOneDay', { name: item.title });
    } else {
      messageText = t('home.warrantyExpiresIn', {
        name: item.title,
        count: item.daysRemaining,
      });
    }
  } else {
    if (item.daysRemaining === 0) {
      messageText = t('home.reminderDueToday', { title: item.title });
    } else if (item.daysRemaining === 1) {
      messageText = t('home.reminderDueInOneDay', { title: item.title });
    } else {
      messageText = t('home.reminderDueIn', {
        title: item.title,
        count: item.daysRemaining,
      });
    }
  }

  const badgeText =
    item.daysRemaining === 0
      ? 'Today'
      : `${item.daysRemaining}d`;

  return (
    <Card
      variant="outlined"
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.custom.statusWarningBg,
          borderColor: theme.custom.statusWarning,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: theme.custom.statusWarning },
          ]}
        >
          <MaterialCommunityIcons
            name={isWarranty ? 'shield-alert-outline' : 'bell-ring-outline'}
            size={20}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.infoCol}>
          <View style={styles.topLine}>
            <Text
              style={[styles.message, { color: theme.colors.onSurface }]}
              numberOfLines={2}
            >
              {messageText}
            </Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: theme.custom.statusWarning },
              ]}
            >
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          </View>

          <Text style={[styles.dueText, { color: theme.custom.textSecondary }]}>
            {isWarranty ? 'Warranty expiry: ' : 'Due: '}
            {formatIndianDate(item.dueDate)}
          </Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={theme.custom.textSecondary}
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  infoCol: {
    flex: 1,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  message: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    flex: 1,
    lineHeight: 19,
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
  dueText: {
    ...Typography.bodySmall,
    fontSize: 11,
    marginTop: 2,
  },
  chevron: {
    marginLeft: Spacing.xs,
  },
});
