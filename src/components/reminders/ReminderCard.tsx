import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from '../common/Card';
import { formatIndianDate } from '../../logic/formatting';
import { Spacing, Typography, Radius } from '../../theme/tokens';
import type { Reminder } from '../../types/models';

interface ReminderCardProps {
  reminder: Reminder;
  assetName?: string;
  onComplete: (reminder: Reminder) => void;
  onSnooze: (reminder: Reminder) => void;
  onReschedule: (reminder: Reminder) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
  onPressAsset?: () => void;
}

export function ReminderCard({
  reminder,
  assetName,
  onComplete,
  onSnooze,
  onReschedule,
  onEdit,
  onDelete,
  onPressAsset,
}: ReminderCardProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const isCompleted = reminder.status === 'completed';
  const isSnoozed = reminder.status === 'snoozed';

  const today = startOfDay(new Date());
  const dueDate = startOfDay(parseISO(reminder.dueDate));
  const diffDays = differenceInDays(dueDate, today);

  let dateStatusText = '';
  let statusColor = theme.colors.primary;

  if (isCompleted) {
    dateStatusText = `${t('reminders.completed')} • ${formatIndianDate(reminder.dueDate)}`;
    statusColor = theme.custom.statusActive;
  } else if (isSnoozed && reminder.snoozedUntil) {
    dateStatusText = t('reminders.snoozedUntil', {
      date: formatIndianDate(reminder.snoozedUntil),
    });
    statusColor = theme.custom.statusWarning;
  } else if (diffDays < 0) {
    dateStatusText = `${t('reminders.overdueBy', { count: Math.abs(diffDays) })} • ${formatIndianDate(reminder.dueDate)}`;
    statusColor = theme.colors.error;
  } else if (diffDays === 0) {
    dateStatusText = `${t('reminders.dueToday')} • ${formatIndianDate(reminder.dueDate)}`;
    statusColor = theme.custom.statusWarning;
  } else {
    dateStatusText = `${t('reminders.dueIn', { count: diffDays })} • ${formatIndianDate(reminder.dueDate)}`;
    statusColor = theme.colors.primary;
  }

  const getTypeIcon = () => {
    switch (reminder.type) {
      case 'warrantyExpiry':
        return 'shield-alert-outline';
      case 'maintenanceDue':
        return 'wrench-outline';
      case 'insuranceRenewal':
        return 'file-document-check-outline';
      case 'amcRenewal':
        return 'update';
      default:
        return 'bell-outline';
    }
  };

  return (
    <Card
      variant="outlined"
      style={[
        styles.card,
        isCompleted && { opacity: 0.75 },
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isCompleted
                ? theme.custom.surfaceVariant
                : theme.colors.primaryContainer,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={isCompleted ? 'check-circle' : getTypeIcon()}
            size={22}
            color={isCompleted ? theme.custom.statusActive : theme.colors.primary}
          />
        </View>

        <View style={styles.headerText}>
          <Text
            style={[
              styles.title,
              { color: theme.colors.onSurface },
              isCompleted && styles.completedText,
            ]}
            numberOfLines={1}
          >
            {reminder.title}
          </Text>

          {assetName && (
            <TouchableOpacity
              onPress={onPressAsset}
              disabled={!onPressAsset}
              activeOpacity={0.7}
              style={styles.assetRow}
            >
              <MaterialCommunityIcons
                name="cube-outline"
                size={14}
                color={theme.custom.textSecondary}
              />
              <Text
                style={[styles.assetName, { color: theme.colors.primary }]}
                numberOfLines={1}
              >
                {assetName}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.dateText, { color: statusColor }]}>
            {dateStatusText}
          </Text>
        </View>
      </View>

      {/* Meta tags: repeat frequency & notification offsets */}
      <View style={styles.metaRow}>
        {reminder.repeatFrequency && reminder.repeatFrequency !== 'none' && (
          <View
            style={[
              styles.metaBadge,
              { backgroundColor: theme.custom.surfaceVariant },
            ]}
          >
            <MaterialCommunityIcons
              name="sync"
              size={12}
              color={theme.custom.textSecondary}
            />
            <Text
              style={[styles.metaText, { color: theme.custom.textSecondary }]}
            >
              {reminder.repeatFrequency === 'monthly'
                ? t('reminders.repeatMonthly')
                : t('reminders.repeatYearly')}
            </Text>
          </View>
        )}

        {reminder.alertOffsetsDays && reminder.alertOffsetsDays.length > 0 && (
          <View
            style={[
              styles.metaBadge,
              { backgroundColor: theme.custom.surfaceVariant },
            ]}
          >
            <MaterialCommunityIcons
              name="bell-badge-outline"
              size={12}
              color={theme.custom.textSecondary}
            />
            <Text
              style={[styles.metaText, { color: theme.custom.textSecondary }]}
            >
              {reminder.alertOffsetsDays.map((d) => (d === 0 ? '0d' : `${d}d`)).join(', ')}
            </Text>
          </View>
        )}

        {reminder.notificationTime && (
          <View
            style={[
              styles.metaBadge,
              { backgroundColor: theme.custom.surfaceVariant },
            ]}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={12}
              color={theme.custom.textSecondary}
            />
            <Text
              style={[styles.metaText, { color: theme.custom.textSecondary }]}
            >
              {reminder.notificationTime}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={[styles.actionsRow, { borderTopColor: theme.custom.border }]}>
        {!isCompleted && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.completeBtn]}
            onPress={() => onComplete(reminder)}
          >
            <MaterialCommunityIcons
              name="check-bold"
              size={16}
              color="#ffffff"
            />
            <Text style={styles.completeBtnText}>{t('reminders.markComplete')}</Text>
          </TouchableOpacity>
        )}

        {!isCompleted && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: theme.custom.surfaceVariant },
            ]}
            onPress={() => onSnooze(reminder)}
          >
            <MaterialCommunityIcons
              name="clock-time-four-outline"
              size={16}
              color={theme.custom.textSecondary}
            />
            <Text
              style={[styles.actionBtnText, { color: theme.custom.textSecondary }]}
            >
              {t('reminders.snooze')}
            </Text>
          </TouchableOpacity>
        )}

        {!isCompleted && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: theme.custom.surfaceVariant },
            ]}
            onPress={() => onReschedule(reminder)}
          >
            <MaterialCommunityIcons
              name="calendar-clock"
              size={16}
              color={theme.custom.textSecondary}
            />
            <Text
              style={[styles.actionBtnText, { color: theme.custom.textSecondary }]}
            >
              {t('reminders.reschedule')}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: theme.custom.surfaceVariant },
          ]}
          onPress={() => onEdit(reminder)}
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={16}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: theme.custom.surfaceVariant },
          ]}
          onPress={() => onDelete(reminder)}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={16}
            color={theme.colors.error}
          />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  assetName: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  dateText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  metaText: {
    ...Typography.bodySmall,
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    gap: 4,
  },
  actionBtnText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  completeBtn: {
    backgroundColor: '#1E8E3E',
    marginRight: 'auto',
  },
  completeBtnText: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: '#ffffff',
  },
});
