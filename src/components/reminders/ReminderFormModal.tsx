import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isValid, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from '../common/Card';
import { AppButton } from '../common/AppButton';
import { generateId } from '../../utils/id';
import { Spacing, Typography, Radius } from '../../theme/tokens';
import type { Reminder, ReminderType } from '../../types/models';

interface ReminderFormModalProps {
  visible: boolean;
  initialReminder?: Reminder | null;
  defaultAssetId?: string;
  assets?: Array<{ id: string; name: string }>;
  onSave: (reminder: Reminder) => Promise<void>;
  onClose: () => void;
}

const AVAILABLE_OFFSETS = [60, 30, 14, 7, 3, 1, 0];
const TIME_PRESETS = ['09:00', '12:00', '18:00', '20:00'];

export function ReminderFormModal({
  visible,
  initialReminder,
  defaultAssetId,
  assets = [],
  onSave,
  onClose,
}: ReminderFormModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const [title, setTitle] = useState('');
  const [assetId, setAssetId] = useState(defaultAssetId || '');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [repeatFrequency, setRepeatFrequency] = useState<'none' | 'monthly' | 'yearly'>('none');
  const [type, setType] = useState<ReminderType>('custom');
  const [alertOffsets, setAlertOffsets] = useState<number[]>([60, 30, 14, 3]);

  const [errors, setErrors] = useState<{ title?: string; dueDate?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialReminder) {
      setTitle(initialReminder.title);
      setAssetId(initialReminder.assetId);
      setDueDate(initialReminder.dueDate);
      setNotificationTime(initialReminder.notificationTime || '09:00');
      setRepeatFrequency(initialReminder.repeatFrequency || 'none');
      setType(initialReminder.type || 'custom');
      setAlertOffsets(initialReminder.alertOffsetsDays || [60, 30, 14, 3]);
    } else {
      setTitle('');
      setAssetId(defaultAssetId || (assets[0]?.id ?? ''));
      setDueDate(format(new Date(), 'yyyy-MM-dd'));
      setNotificationTime('09:00');
      setRepeatFrequency('none');
      setType('custom');
      setAlertOffsets([60, 30, 14, 3]);
    }
    setErrors({});
  }, [initialReminder, defaultAssetId, visible]);

  const toggleOffset = (offset: number) => {
    if (alertOffsets.includes(offset)) {
      setAlertOffsets(alertOffsets.filter((o) => o !== offset));
    } else {
      setAlertOffsets([...alertOffsets, offset].sort((a, b) => b - a));
    }
  };

  const handleSave = async () => {
    const newErrors: { title?: string; dueDate?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    const parsed = parseISO(dueDate);
    if (!isValid(parsed) || dueDate.length !== 10) {
      newErrors.dueDate = 'Enter a valid date (YYYY-MM-DD)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const reminderToSave: Reminder = {
        id: initialReminder?.id || generateId(),
        assetId: assetId || defaultAssetId || 'general',
        title: title.trim(),
        type,
        dueDate,
        alertOffsetsDays: alertOffsets.length > 0 ? alertOffsets : [0],
        repeatFrequency: repeatFrequency === 'none' ? undefined : repeatFrequency,
        status: initialReminder?.status || 'upcoming',
        snoozedUntil: initialReminder?.snoozedUntil,
        notificationTime,
      };

      await onSave(reminderToSave);
      onClose();
    } catch (e) {
      console.error('Failed to save reminder:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Card elevated style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              {initialReminder ? t('reminders.editReminder') : t('reminders.newReminder')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={theme.custom.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={[styles.label, { color: theme.custom.textSecondary }]}>
              {t('reminders.reminderTitle')} *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.custom.surfaceVariant,
                  color: theme.colors.onSurface,
                  borderColor: errors.title ? theme.colors.error : theme.custom.border,
                },
              ]}
              placeholder={t('reminders.reminderTitlePlaceholder')}
              placeholderTextColor={theme.custom.textDisabled}
              value={title}
              onChangeText={(v) => {
                setTitle(v);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
            />
            {!!errors.title && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.title}
              </Text>
            )}

            {/* Asset Selection (if assets exist and not forced by defaultAssetId) */}
            {assets.length > 0 && !defaultAssetId && (
              <>
                <Text style={[styles.label, { color: theme.custom.textSecondary }]}>
                  {t('reminders.assetSelect')}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {assets.map((a) => {
                    const isSelected = assetId === a.id;
                    return (
                      <Chip
                        key={a.id}
                        selected={isSelected}
                        onPress={() => setAssetId(a.id)}
                        style={[
                          styles.chip,
                          isSelected && { backgroundColor: theme.colors.primaryContainer },
                        ]}
                      >
                        {a.name}
                      </Chip>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Due Date */}
            <Text style={[styles.label, { color: theme.custom.textSecondary }]}>
              {t('reminders.dueDate')} (YYYY-MM-DD) *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.custom.surfaceVariant,
                  color: theme.colors.onSurface,
                  borderColor: errors.dueDate ? theme.colors.error : theme.custom.border,
                },
              ]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.custom.textDisabled}
              value={dueDate}
              onChangeText={(v) => {
                setDueDate(v);
                if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: undefined }));
              }}
              maxLength={10}
            />
            {!!errors.dueDate && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.dueDate}
              </Text>
            )}

            {/* Notification Time */}
            <Text style={[styles.label, { color: theme.custom.textSecondary }]}>
              {t('reminders.notificationTime')}
            </Text>
            <View style={styles.presetRow}>
              {TIME_PRESETS.map((tPreset) => (
                <Chip
                  key={tPreset}
                  selected={notificationTime === tPreset}
                  onPress={() => setNotificationTime(tPreset)}
                  style={[
                    styles.timeChip,
                    notificationTime === tPreset && {
                      backgroundColor: theme.colors.primaryContainer,
                    },
                  ]}
                >
                  {tPreset}
                </Chip>
              ))}
            </View>

            {/* Repeat Frequency */}
            <Text style={[styles.label, { color: theme.custom.textSecondary }]}>
              {t('reminders.repeat')}
            </Text>
            <View style={styles.presetRow}>
              {(['none', 'monthly', 'yearly'] as const).map((freq) => (
                <Chip
                  key={freq}
                  selected={repeatFrequency === freq}
                  onPress={() => setRepeatFrequency(freq)}
                  style={[
                    styles.timeChip,
                    repeatFrequency === freq && {
                      backgroundColor: theme.colors.primaryContainer,
                    },
                  ]}
                >
                  {freq === 'none'
                    ? t('reminders.repeatNone')
                    : freq === 'monthly'
                    ? t('reminders.repeatMonthly')
                    : t('reminders.repeatYearly')}
                </Chip>
              ))}
            </View>

            {/* Alert Offsets */}
            <Text style={[styles.label, { color: theme.custom.textSecondary }]}>
              {t('reminders.alertOffsets')}
            </Text>
            <View style={styles.offsetsWrap}>
              {AVAILABLE_OFFSETS.map((offset) => {
                const isSelected = alertOffsets.includes(offset);
                const label =
                  offset === 0
                    ? t('reminders.onDueDate')
                    : t('reminders.offsetDays', { count: offset });
                return (
                  <Chip
                    key={offset}
                    selected={isSelected}
                    onPress={() => toggleOffset(offset)}
                    style={[
                      styles.offsetChip,
                      isSelected && { backgroundColor: theme.colors.primaryContainer },
                    ]}
                  >
                    {label}
                  </Chip>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer buttons */}
          <View style={styles.footer}>
            <AppButton
              variant="ghost"
              label={t('common.cancel')}
              onPress={onClose}
              style={styles.footerBtn}
            />
            <AppButton
              variant="primary"
              label={t('common.save')}
              loading={saving}
              disabled={saving}
              onPress={handleSave}
              style={styles.footerBtn}
            />
          </View>
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
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    ...Typography.titleMedium,
    fontWeight: '700',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  body: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: 15,
  },
  errorText: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  chip: {
    marginRight: Spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  timeChip: {
    marginBottom: Spacing.xs,
  },
  offsetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  offsetChip: {
    marginBottom: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  footerBtn: {
    minWidth: 100,
  },
});
