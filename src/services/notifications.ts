import { Platform, Alert } from 'react-native';
import type { Reminder } from '../types/models';
import { calculateAlertDates } from '../logic/reminders';
import { generateId } from '../utils/id';

// Cached reference to native expo-notifications module (if available in binary)
let cachedNotifications: any = undefined;

function getNativeNotifications(): any {
  if (cachedNotifications !== undefined) return cachedNotifications;
  try {
    cachedNotifications = require('expo-notifications');
    // Configure default foreground behavior if native module loaded successfully
    if (cachedNotifications && cachedNotifications.setNotificationHandler) {
      cachedNotifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
    return cachedNotifications;
  } catch {
    // In Expo Go without ExpoApplication / ExpoNotifications native binary,
    // safely catch the module-load error so the app boots smoothly.
    cachedNotifications = null;
    return null;
  }
}

// ── In-Memory Simulated Store (Expo Go Fallback) ──────────────────────────────
interface SimulatedNotification {
  identifier: string;
  reminderId: string;
  assetId?: string;
  title: string;
  body: string;
  triggerDate: Date;
  timerId?: any;
}

const simulatedScheduledStore = new Map<string, SimulatedNotification>();
let simulatedPermissionGranted = true;

/**
 * Initialize notification channels (required for Android 8+)
 */
export async function initNotifications(): Promise<void> {
  const native = getNativeNotifications();
  if (native && native.setNotificationChannelAsync && Platform.OS === 'android') {
    try {
      await native.setNotificationChannelAsync('asset-reminders', {
        name: 'Asset Vault Reminders',
        description: 'Notifications for warranty expiry, renewals, and maintenance',
        importance: native.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1A73E8',
      });
    } catch (e) {
      console.warn('initNotifications error:', e);
    }
  }
}

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * Get current notification permission status.
 */
export async function getNotificationPermissionStatus(): Promise<PermissionStatus> {
  const native = getNativeNotifications();
  if (native && native.getPermissionsAsync) {
    try {
      const settings = await native.getPermissionsAsync();
      if (settings.granted || settings.ios?.status === native.IosAuthorizationStatus?.PROVISIONAL) {
        return 'granted';
      }
      if (settings.status === native.PermissionStatus?.DENIED) {
        return 'denied';
      }
      return 'undetermined';
    } catch {
      return simulatedPermissionGranted ? 'granted' : 'undetermined';
    }
  }

  // Simulated fallback in Expo Go
  return simulatedPermissionGranted ? 'granted' : 'undetermined';
}

/**
 * Request notification permissions from system.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const native = getNativeNotifications();
  if (native && native.requestPermissionsAsync) {
    try {
      const { status } = await native.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      return status === native.PermissionStatus?.GRANTED;
    } catch {
      simulatedPermissionGranted = true;
      return true;
    }
  }

  simulatedPermissionGranted = true;
  return true;
}

/**
 * Schedule local notifications for a reminder across all alert offsets.
 */
export async function scheduleReminderNotifications(
  reminder: Reminder,
  assetName?: string
): Promise<string[]> {
  const native = getNativeNotifications();
  const alertDates = calculateAlertDates(
    reminder.dueDate,
    reminder.alertOffsetsDays || [60, 30, 14, 3],
    reminder.notificationTime || '09:00'
  );

  const now = new Date();
  const futureDates = alertDates.filter((d) => d.getTime() > now.getTime() + 5000);

  if (futureDates.length === 0) {
    const [h, m] = (reminder.notificationTime || '09:00').split(':');
    const dueExact = new Date(reminder.dueDate);
    dueExact.setHours(parseInt(h || '9', 10), parseInt(m || '0', 10), 0, 0);
    if (dueExact.getTime() > now.getTime() + 5000) {
      futureDates.push(dueExact);
    }
  }

  const scheduledIds: string[] = [];

  for (const date of futureDates) {
    const diffDays = Math.round(
      (new Date(reminder.dueDate).getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    let body = assetName ? `${assetName}: ${reminder.title}` : reminder.title;
    if (diffDays > 0) {
      body += ` is due in ${diffDays} day${diffDays === 1 ? '' : 's'}.`;
    } else {
      body += ` is due today!`;
    }

    if (native && native.scheduleNotificationAsync) {
      try {
        const id = await native.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body,
            data: {
              reminderId: reminder.id,
              assetId: reminder.assetId,
              type: reminder.type,
            },
            sound: true,
          },
          trigger: {
            type: native.SchedulableTriggerInputTypes?.DATE ?? 'date',
            date,
          },
        });
        scheduledIds.push(id);
      } catch (e) {
        console.warn('scheduleNotificationAsync error:', e);
      }
    } else {
      // In-memory fallback
      const id = generateId();
      simulatedScheduledStore.set(id, {
        identifier: id,
        reminderId: reminder.id,
        assetId: reminder.assetId,
        title: reminder.title,
        body,
        triggerDate: date,
      });
      scheduledIds.push(id);
    }
  }

  return scheduledIds;
}

/**
 * Cancel all scheduled notifications for a reminder.
 */
export async function cancelReminderNotifications(reminderId: string): Promise<void> {
  const native = getNativeNotifications();
  if (native && native.getAllScheduledNotificationsAsync && native.cancelScheduledNotificationAsync) {
    try {
      const scheduled = await native.getAllScheduledNotificationsAsync();
      for (const notification of scheduled) {
        if (notification.content?.data?.reminderId === reminderId) {
          await native.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (e) {
      console.warn('cancelReminderNotifications error:', e);
    }
  }

  // Also clean from simulated store
  for (const [id, item] of simulatedScheduledStore.entries()) {
    if (item.reminderId === reminderId) {
      if (item.timerId) clearTimeout(item.timerId);
      simulatedScheduledStore.delete(id);
    }
  }
}

/**
 * Reschedule notifications for an updated reminder.
 */
export async function rescheduleReminderNotifications(
  reminder: Reminder,
  assetName?: string
): Promise<string[]> {
  await cancelReminderNotifications(reminder.id);
  if (reminder.status === 'upcoming') {
    return scheduleReminderNotifications(reminder, assetName);
  }
  return [];
}

/**
 * Schedule a test notification (default 60 seconds from now, or custom seconds).
 */
export async function scheduleTestNotification(
  secondsFromNow: number = 60
): Promise<string | null> {
  const native = getNativeNotifications();
  const triggerDate = new Date(Date.now() + secondsFromNow * 1000);

  if (native && native.scheduleNotificationAsync) {
    try {
      const id = await native.scheduleNotificationAsync({
        content: {
          title: 'AssetVault Notification Test',
          body: `Test notification scheduled for ${secondsFromNow}s ago fired successfully!`,
          data: { test: true },
          sound: true,
        },
        trigger: {
          type: native.SchedulableTriggerInputTypes?.DATE ?? 'date',
          date: triggerDate,
        },
      });
      return id;
    } catch (e) {
      console.warn('Native scheduleTestNotification failed, falling back to simulated:', e);
    }
  }

  // Simulated fallback: timer that alerts when fired in Expo Go
  const id = generateId();
  const timerId = setTimeout(() => {
    Alert.alert(
      'AssetVault Notification Test',
      `Test notification scheduled for ${secondsFromNow}s ago fired successfully!`
    );
    simulatedScheduledStore.delete(id);
  }, secondsFromNow * 1000);

  simulatedScheduledStore.set(id, {
    identifier: id,
    reminderId: 'test',
    title: 'AssetVault Notification Test',
    body: `Test notification scheduled for ${secondsFromNow}s ago fired successfully!`,
    triggerDate,
    timerId,
  });

  return id;
}

/**
 * Listens for user response (tapping notification) to open asset.
 */
export function addNotificationResponseListener(
  onOpenAsset: (assetId: string) => void
): () => void {
  const native = getNativeNotifications();
  if (native && native.addNotificationResponseReceivedListener) {
    try {
      const subscription = native.addNotificationResponseReceivedListener(
        (response: any) => {
          const assetId = response?.notification?.request?.content?.data?.assetId;
          if (assetId && assetId !== 'general') {
            onOpenAsset(assetId);
          }
        }
      );

      if (native.getLastNotificationResponseAsync) {
        native.getLastNotificationResponseAsync()
          .then((response: any) => {
            const assetId = response?.notification?.request?.content?.data?.assetId;
            if (assetId && assetId !== 'general') {
              onOpenAsset(assetId);
            }
          })
          .catch(() => {});
      }

      return () => subscription.remove();
    } catch (e) {
      console.warn('addNotificationResponseReceivedListener error:', e);
    }
  }

  return () => {};
}
