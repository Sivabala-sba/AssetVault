import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDays, format, isValid, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from '../common/Card';
import { AppButton } from '../common/AppButton';
import { Spacing, Typography, Radius } from '../../theme/tokens';
import type { Reminder } from '../../types/models';

interface SnoozeModalProps {
  visible: boolean;
  reminder: Reminder | null;
  onSnooze: (reminder: Reminder, snoozeUntilDate: string) => void;
  onClose: () => void;
}

export function SnoozeModal({
  visible,
  reminder,
  onSnooze,
  onClose,
}: SnoozeModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState(
    format(addDays(new Date(), 14), 'yyyy-MM-dd')
  );
  const [customError, setCustomError] = useState('');

  if (!reminder) return null;

  const handleQuickSnooze = (days: number) => {
    const targetDate = format(addDays(new Date(), days), 'yyyy-MM-dd');
    onSnooze(reminder, targetDate);
    onClose();
  };

  const handleCustomSnooze = () => {
    const parsed = parseISO(customDate);
    if (!isValid(parsed) || customDate.length !== 10) {
      setCustomError('Please enter valid date YYYY-MM-DD');
      return;
    }
    setCustomError('');
    onSnooze(reminder, customDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Card elevated style={styles.card}>
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="clock-time-four-outline"
              size={24}
              color={theme.colors.primary}
              style={{ marginRight: Spacing.sm }}
            />
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              {t('reminders.snoozeTitle')}
            </Text>
          </View>

          <Text
            style={[styles.reminderTitle, { color: theme.custom.textSecondary }]}
            numberOfLines={1}
          >
            {reminder.title}
          </Text>

          {!showCustom ? (
            <View style={styles.optionsList}>
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  { backgroundColor: theme.custom.surfaceVariant },
                ]}
                onPress={() => handleQuickSnooze(1)}
              >
                <MaterialCommunityIcons
                  name="numeric-1-box-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>
                  {t('reminders.snooze1Day')}
                </Text>
                <Text style={[styles.datePreview, { color: theme.custom.textSecondary }]}>
                  {format(addDays(new Date(), 1), 'dd MMM')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionItem,
                  { backgroundColor: theme.custom.surfaceVariant },
                ]}
                onPress={() => handleQuickSnooze(3)}
              >
                <MaterialCommunityIcons
                  name="numeric-3-box-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>
                  {t('reminders.snooze3Days')}
                </Text>
                <Text style={[styles.datePreview, { color: theme.custom.textSecondary }]}>
                  {format(addDays(new Date(), 3), 'dd MMM')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionItem,
                  { backgroundColor: theme.custom.surfaceVariant },
                ]}
                onPress={() => handleQuickSnooze(7)}
              >
                <MaterialCommunityIcons
                  name="calendar-week"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>
                  {t('reminders.snooze1Week')}
                </Text>
                <Text style={[styles.datePreview, { color: theme.custom.textSecondary }]}>
                  {format(addDays(new Date(), 7), 'dd MMM')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionItem,
                  { backgroundColor: theme.custom.surfaceVariant },
                ]}
                onPress={() => setShowCustom(true)}
              >
                <MaterialCommunityIcons
                  name="calendar-edit"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>
                  {t('reminders.snoozeCustom')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.customContainer}>
              <Text style={[styles.inputLabel, { color: theme.custom.textSecondary }]}>
                {t('reminders.snoozeCustom')} (YYYY-MM-DD):
              </Text>
              <TextInput
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: theme.custom.surfaceVariant,
                    color: theme.colors.onSurface,
                    borderColor: customError ? theme.colors.error : theme.custom.border,
                  },
                ]}
                value={customDate}
                onChangeText={(val) => {
                  setCustomDate(val);
                  setCustomError('');
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.custom.textDisabled}
                maxLength={10}
              />
              {!!customError && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {customError}
                </Text>
              )}

              <View style={styles.customBtnRow}>
                <AppButton
                  variant="ghost"
                  label={t('common.back')}
                  onPress={() => setShowCustom(false)}
                  style={{ flex: 1 }}
                />
                <AppButton
                  variant="primary"
                  label={t('reminders.snooze')}
                  onPress={handleCustomSnooze}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {!showCustom && (
            <AppButton
              variant="ghost"
              label={t('common.cancel')}
              onPress={onClose}
              style={styles.cancelBtn}
            />
          )}
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.titleMedium,
    fontWeight: '700',
  },
  reminderTitle: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },
  optionsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.sm,
  },
  optionText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    marginLeft: Spacing.md,
    flex: 1,
  },
  datePreview: {
    ...Typography.bodySmall,
  },
  cancelBtn: {
    width: '100%',
  },
  customContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  errorText: {
    ...Typography.bodySmall,
    marginBottom: Spacing.sm,
  },
  customBtnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
