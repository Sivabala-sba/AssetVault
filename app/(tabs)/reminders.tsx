import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, ActivityIndicator, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { EmptyState } from '../../src/components/common/EmptyState';
import { ReminderCard } from '../../src/components/reminders/ReminderCard';
import { ReminderFormModal } from '../../src/components/reminders/ReminderFormModal';
import { SnoozeModal } from '../../src/components/reminders/SnoozeModal';
import { PermissionDialog } from '../../src/components/reminders/PermissionDialog';
import { reminderRepository } from '../../src/db/reminders';
import { assetRepository } from '../../src/db/assets';
import {
  categorizeReminders,
  calculateNextOccurrence,
} from '../../src/logic/reminders';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  cancelReminderNotifications,
  rescheduleReminderNotifications,
  scheduleReminderNotifications,
} from '../../src/services/notifications';
import { generateId } from '../../src/utils/id';
import { Typography, Spacing, Radius } from '../../src/theme/tokens';
import type { Reminder, Asset } from '../../src/types/models';

type SegmentKey = 'upcoming' | 'overdue' | 'snoozed' | 'completed';

export default function RemindersScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeSegment, setActiveSegment] = useState<SegmentKey>('upcoming');

  // Modals state
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [snoozeModalVisible, setSnoozeModalVisible] = useState(false);
  const [snoozeTarget, setSnoozeTarget] = useState<Reminder | null>(null);
  const [permissionDialogVisible, setPermissionDialogVisible] = useState(false);

  const assetMap = useMemo(() => {
    const map: Record<string, Asset> = {};
    assets.forEach((a) => {
      map[a.id] = a;
    });
    return map;
  }, [assets]);

  const loadData = useCallback(async () => {
    try {
      const [rems, allAssets] = await Promise.all([
        reminderRepository.getAll(),
        assetRepository.getAll(),
      ]);
      setReminders(rems);
      setAssets(allAssets);
    } catch (e) {
      console.error('Failed to load reminders:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const categorized = useMemo(() => {
    return categorizeReminders(reminders);
  }, [reminders]);

  const currentList = categorized[activeSegment] || [];

  // Check permission helper before creating first reminder
  const checkPermissionAndOpenModal = async (reminderToEdit: Reminder | null = null) => {
    const status = await getNotificationPermissionStatus();
    if (status === 'undetermined') {
      setPermissionDialogVisible(true);
    } else {
      setEditingReminder(reminderToEdit);
      setFormModalVisible(true);
    }
  };

  const handleEnablePermission = async () => {
    setPermissionDialogVisible(false);
    await requestNotificationPermission();
    setEditingReminder(null);
    setFormModalVisible(true);
  };

  const handleNotNowPermission = () => {
    setPermissionDialogVisible(false);
    setEditingReminder(null);
    setFormModalVisible(true);
  };

  // Mark Completed
  const handleComplete = async (reminder: Reminder) => {
    try {
      const updated: Reminder = {
        ...reminder,
        status: 'completed',
      };
      await reminderRepository.update(updated);
      await cancelReminderNotifications(reminder.id);

      // Handle recurrence
      if (reminder.repeatFrequency && reminder.repeatFrequency !== 'none') {
        const next = calculateNextOccurrence(reminder);
        if (next) {
          const nextReminder: Reminder = {
            ...reminder,
            id: generateId(),
            dueDate: next.dueDate,
            status: 'upcoming',
            snoozedUntil: undefined,
          };
          await reminderRepository.insert(nextReminder);
          await scheduleReminderNotifications(
            nextReminder,
            assetMap[nextReminder.assetId]?.name
          );
          Alert.alert(
            t('reminders.completed'),
            t('reminders.recurringCreatedNotice', { date: next.dueDate })
          );
        }
      }

      await loadData();
    } catch (e) {
      console.error('Failed to complete reminder:', e);
    }
  };

  // Snooze
  const handleOpenSnooze = (reminder: Reminder) => {
    setSnoozeTarget(reminder);
    setSnoozeModalVisible(true);
  };

  const handleConfirmSnooze = async (reminder: Reminder, snoozeUntilDate: string) => {
    try {
      const updated: Reminder = {
        ...reminder,
        status: 'snoozed',
        snoozedUntil: snoozeUntilDate,
      };
      await reminderRepository.update(updated);
      // Cancel regular offsets and schedule on snooze date
      await cancelReminderNotifications(reminder.id);
      await loadData();
    } catch (e) {
      console.error('Failed to snooze reminder:', e);
    }
  };

  // Reschedule / Edit
  const handleReschedule = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormModalVisible(true);
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormModalVisible(true);
  };

  // Delete
  const handleDelete = (reminder: Reminder) => {
    Alert.alert(
      t('reminders.deleteConfirmTitle'),
      t('reminders.deleteConfirmMessage', { title: reminder.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await reminderRepository.delete(reminder.id);
              await cancelReminderNotifications(reminder.id);
              await loadData();
            } catch (e) {
              console.error('Failed to delete reminder:', e);
            }
          },
        },
      ]
    );
  };

  // Save new or edited reminder
  const handleSaveReminder = async (saved: Reminder) => {
    const isNew = !reminders.some((r) => r.id === saved.id);
    if (isNew) {
      await reminderRepository.insert(saved);
    } else {
      await reminderRepository.update(saved);
    }

    const assetName = assetMap[saved.assetId]?.name;
    await rescheduleReminderNotifications(saved, assetName);
    await loadData();
  };

  const renderEmptyState = () => {
    switch (activeSegment) {
      case 'overdue':
        return (
          <EmptyState
            icon="check-circle-outline"
            title={t('reminders.emptyOverdue')}
            subtitle={t('reminders.emptyOverdueSubtitle')}
          />
        );
      case 'snoozed':
        return (
          <EmptyState
            icon="clock-time-four-outline"
            title={t('reminders.emptySnoozed')}
            subtitle={t('reminders.emptySnoozedSubtitle')}
          />
        );
      case 'completed':
        return (
          <EmptyState
            icon="checkbox-marked-circle-outline"
            title={t('reminders.emptyCompleted')}
            subtitle={t('reminders.emptyCompletedSubtitle')}
          />
        );
      case 'upcoming':
      default:
        return (
          <EmptyState
            icon="bell-outline"
            title={t('reminders.emptyUpcoming')}
            subtitle={t('reminders.emptyUpcomingSubtitle')}
            actionLabel={t('reminders.addReminder')}
            onAction={() => checkPermissionAndOpenModal(null)}
          />
        );
    }
  };

  const segments: { key: SegmentKey; label: string; count: number }[] = [
    {
      key: 'upcoming',
      label: t('reminders.filterUpcoming'),
      count: categorized.upcoming.length,
    },
    {
      key: 'overdue',
      label: t('reminders.filterOverdue'),
      count: categorized.overdue.length,
    },
    {
      key: 'snoozed',
      label: t('reminders.filterSnoozed'),
      count: categorized.snoozed.length,
    },
    {
      key: 'completed',
      label: t('reminders.filterCompleted'),
      count: categorized.completed.length,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <SectionHeader title={t('reminders.title')} />

      {/* Segmented Bar */}
      <View style={[styles.segmentContainer, { backgroundColor: theme.custom.surfaceVariant }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentScroll}>
          {segments.map((seg) => {
            const isActive = activeSegment === seg.key;
            return (
              <TouchableOpacity
                key={seg.key}
                onPress={() => setActiveSegment(seg.key)}
                style={[
                  styles.segmentItem,
                  isActive && [styles.segmentActive, { backgroundColor: theme.colors.primaryContainer }],
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: isActive ? theme.colors.primary : theme.custom.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {seg.label}
                </Text>
                {seg.count > 0 && (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          seg.key === 'overdue'
                            ? theme.colors.error
                            : isActive
                            ? theme.colors.primary
                            : theme.custom.textDisabled,
                      },
                    ]}
                  >
                    <Text style={styles.badgeText}>{seg.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : currentList.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {currentList.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              assetName={assetMap[reminder.assetId]?.name}
              onComplete={handleComplete}
              onSnooze={handleOpenSnooze}
              onReschedule={handleReschedule}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPressAsset={
                reminder.assetId && reminder.assetId !== 'general'
                  ? () => router.push(`/asset/${reminder.assetId}`)
                  : undefined
              }
            />
          ))}
        </ScrollView>
      )}

      {/* Floating Add Reminder Button */}
      <FAB
        icon="plus"
        label={t('reminders.addReminder')}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#ffffff"
        onPress={() => checkPermissionAndOpenModal(null)}
      />

      {/* Reminder Create/Edit Modal */}
      <ReminderFormModal
        visible={formModalVisible}
        initialReminder={editingReminder}
        assets={assets.map((a) => ({ id: a.id, name: a.name }))}
        onSave={handleSaveReminder}
        onClose={() => {
          setFormModalVisible(false);
          setEditingReminder(null);
        }}
      />

      {/* Snooze Options Modal */}
      <SnoozeModal
        visible={snoozeModalVisible}
        reminder={snoozeTarget}
        onSnooze={handleConfirmSnooze}
        onClose={() => {
          setSnoozeModalVisible(false);
          setSnoozeTarget(null);
        }}
      />

      {/* Permission Explanation Dialog */}
      <PermissionDialog
        visible={permissionDialogVisible}
        onEnable={handleEnablePermission}
        onNotNow={handleNotNowPermission}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  segmentContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    padding: 4,
  },
  segmentScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    gap: 6,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  segmentText: {
    ...Typography.bodyMedium,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...Typography.bodySmall,
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 90,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    margin: Spacing.lg,
    right: 0,
    bottom: Spacing.md,
  },
});
