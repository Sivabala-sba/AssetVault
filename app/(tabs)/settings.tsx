import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text, Divider, RadioButton, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useSettingsStore } from '../../src/store/settingsStore';
import { AppButton } from '../../src/components/common/AppButton';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { Card } from '../../src/components/common/Card';
import { Spacing, Typography, Radius } from '../../src/theme/tokens';
import { assetRepository } from '../../src/db/assets';
import { SAMPLE_ASSETS } from '../../src/data/sampleData';
import { APP_CONFIG } from '../../src/constants/config';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  scheduleTestNotification,
  PermissionStatus,
} from '../../src/services/notifications';
import { BatteryHelpModal } from '../../src/components/reminders/BatteryHelpModal';

type SnackState = { visible: boolean; message: string; isError?: boolean };

export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { themePreference, setTheme } = useSettingsStore();

  const [loadingData, setLoadingData] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [snack, setSnack] = useState<SnackState>({ visible: false, message: '' });

  // Notifications State (Stage 3)
  const [permStatus, setPermStatus] = useState<PermissionStatus>('undetermined');
  const [batteryHelpVisible, setBatteryHelpVisible] = useState(false);
  const [schedulingTest, setSchedulingTest] = useState(false);

  const refreshPermission = useCallback(async () => {
    try {
      const status = await getNotificationPermissionStatus();
      setPermStatus(status);
    } catch (e) {
      console.warn('Error checking notification permission:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshPermission();
    }, [refreshPermission])
  );

  const handleRequestPermission = async () => {
    await requestNotificationPermission();
    await refreshPermission();
  };

  const handleTestNotification = async (seconds: number) => {
    setSchedulingTest(true);
    try {
      const id = await scheduleTestNotification(seconds);
      if (id) {
        showSnack(t('settings.testNotificationScheduled', { seconds }));
      } else {
        showSnack(t('errors.unknown'), true);
      }
    } catch (e) {
      console.error('Test notification failed:', e);
      showSnack(t('errors.unknown'), true);
    } finally {
      setSchedulingTest(false);
    }
  };

  const showSnack = (message: string, isError = false) => {
    setSnack({ visible: true, message, isError });
  };

  // ── Load Sample Data ───────────────────────────────────────────────────────
  const handleLoadSampleData = async () => {
    setLoadingData(true);
    try {
      const existing = await assetRepository.count();
      if (existing > 0) {
        showSnack(t('settings.sampleDataAlreadyLoaded'));
        return;
      }
      for (const asset of SAMPLE_ASSETS) {
        await assetRepository.insert(asset);
      }
      showSnack(t('settings.sampleDataLoaded'));
    } catch (e) {
      console.error('Load sample data failed:', e);
      showSnack(t('errors.saveFailed'), true);
    } finally {
      setLoadingData(false);
    }
  };

  // ── Clear All Data ─────────────────────────────────────────────────────────
  const handleClearData = () => {
    Alert.alert(
      t('settings.clearConfirmTitle'),
      t('settings.clearConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.clearConfirmAction'),
          style: 'destructive',
          onPress: async () => {
            setClearingData(true);
            try {
              await assetRepository.deleteAll();
              showSnack(t('settings.dataCleared'));
            } catch (e) {
              console.error('Clear data failed:', e);
              showSnack(t('errors.deleteFailed'), true);
            } finally {
              setClearingData(false);
            }
          },
        },
      ]
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <SectionHeader title={t('settings.title')} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Data & Storage ── */}
        <SettingsGroupLabel label={t('settings.sectionData')} theme={theme} />

        <Card style={styles.card} variant="outlined">
          {/* Load Sample Data */}
          <SettingsRow
            icon="database-import-outline"
            title={t('settings.loadSampleData')}
            subtitle={t('settings.loadSampleDataDesc')}
            theme={theme}
          >
            <AppButton
              label={t('settings.loadSampleData')}
              onPress={handleLoadSampleData}
              variant="primary"
              loading={loadingData}
              disabled={loadingData || clearingData}
              icon="download-outline"
            />
          </SettingsRow>

          <Divider style={styles.divider} />

          {/* Clear All Data */}
          <SettingsRow
            icon="trash-can-outline"
            title={t('settings.clearAllData')}
            subtitle={t('settings.clearAllDataDesc')}
            theme={theme}
          >
            <AppButton
              label={t('settings.clearAllData')}
              onPress={handleClearData}
              variant="danger"
              loading={clearingData}
              disabled={loadingData || clearingData}
              icon="delete-outline"
            />
          </SettingsRow>
        </Card>

        {/* ── Notifications & Reminders (Stage 3) ── */}
        <SettingsGroupLabel label={t('settings.sectionNotifications')} theme={theme} />

        <Card style={styles.card} variant="outlined">
          {/* Permission Status */}
          <SettingsRow
            icon="bell-ring-outline"
            title={t('settings.notificationPermission')}
            subtitle={
              permStatus === 'granted'
                ? t('settings.permissionGranted')
                : permStatus === 'denied'
                ? t('settings.permissionDenied')
                : t('settings.permissionUndetermined')
            }
            theme={theme}
          >
            {permStatus !== 'granted' && (
              <AppButton
                label={t('reminders.permissionEnable')}
                onPress={handleRequestPermission}
                variant="primary"
                icon="bell-check-outline"
              />
            )}
          </SettingsRow>

          <Divider style={styles.divider} />

          {/* Quick Notification Test (60 sec & 10 sec) */}
          <View style={styles.testSection}>
            <View style={styles.rowHeader}>
              <MaterialCommunityIcons
                name="timer-outline"
                size={22}
                color={theme.custom.textSecondary}
                style={styles.rowIcon}
              />
              <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>
                {t('settings.testNotification')}
              </Text>
            </View>
            <View style={styles.testBtnRow}>
              <AppButton
                label={t('settings.testNotification')}
                onPress={() => handleTestNotification(60)}
                variant="outline"
                disabled={schedulingTest}
                icon="bell-outline"
                style={{ flex: 1 }}
              />
              <AppButton
                label={t('settings.testNotification10s')}
                onPress={() => handleTestNotification(10)}
                variant="outline"
                disabled={schedulingTest}
                icon="timer-sand"
                style={{ flex: 1 }}
              />
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Battery Optimisation Guide */}
          <SettingsRow
            icon="battery-charging-wireless"
            title={t('settings.batteryGuide')}
            subtitle={t('settings.batteryGuideDesc')}
            theme={theme}
          >
            <AppButton
              label={t('common.select')}
              onPress={() => setBatteryHelpVisible(true)}
              variant="outline"
              icon="information-outline"
            />
          </SettingsRow>
        </Card>

        {/* ── Appearance ── */}
        <SettingsGroupLabel label={t('settings.sectionAppearance')} theme={theme} />

        <Card style={styles.card} variant="outlined">
          <View style={styles.rowHeader}>
            <MaterialCommunityIcons
              name="theme-light-dark"
              size={22}
              color={theme.custom.textSecondary}
              style={styles.rowIcon}
            />
            <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>
              {t('settings.theme')}
            </Text>
          </View>

          <RadioButton.Group
            onValueChange={(val) => setTheme(val as 'system' | 'light' | 'dark')}
            value={themePreference}
          >
            {[
              { value: 'system', label: t('settings.themeSystem') },
              { value: 'light',  label: t('settings.themeLight') },
              { value: 'dark',   label: t('settings.themeDark') },
            ].map((opt) => (
              <RadioButton.Item
                key={opt.value}
                value={opt.value}
                label={opt.label}
                style={styles.radioItem}
                labelStyle={{ color: theme.colors.onSurface }}
              />
            ))}
          </RadioButton.Group>
        </Card>

        {/* ── About ── */}
        <SettingsGroupLabel label={t('settings.sectionAbout')} theme={theme} />

        <Card style={styles.card} variant="outlined">
          <SettingsRow
            icon="shield-lock-outline"
            title={t('settings.about')}
            subtitle={t('settings.aboutDesc')}
            theme={theme}
          />
          <Divider style={styles.divider} />
          <SettingsRow
            icon="information-outline"
            title={t('settings.appVersion')}
            subtitle={APP_CONFIG.version}
            theme={theme}
          />
        </Card>

        {/* Coming soon note */}
        <Text style={[styles.comingSoon, { color: theme.custom.textDisabled }]}>
          Language, notifications, cloud backup, export — {t('settings.comingSoon')}
        </Text>
      </ScrollView>

      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack((s) => ({ ...s, visible: false }))}
        duration={3000}
        style={{ backgroundColor: snack.isError ? theme.colors.error : '#323232' }}
      >
        <Text style={{ color: '#fff' }}>{snack.message}</Text>
      </Snackbar>

      <BatteryHelpModal
        visible={batteryHelpVisible}
        onClose={() => setBatteryHelpVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsGroupLabel({
  label,
  theme,
}: {
  label: string;
  theme: ReturnType<typeof useAppTheme>;
}) {
  return (
    <Text style={[styles.groupLabel, { color: theme.colors.primary }]}>{label}</Text>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  theme,
  children,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  theme: ReturnType<typeof useAppTheme>;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.settingsRow}>
      <View style={styles.rowHeader}>
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={theme.custom.textSecondary}
          style={styles.rowIcon}
        />
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.rowSubtitle, { color: theme.custom.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {children ? <View style={styles.rowAction}>{children}</View> : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  card: {
    marginBottom: Spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  groupLabel: {
    ...Typography.labelLarge,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  divider: {
    marginHorizontal: Spacing.lg,
  },
  settingsRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  rowIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...Typography.titleLarge,
    marginBottom: 2,
  },
  rowSubtitle: {
    ...Typography.bodySmall,
  },
  rowAction: {
    marginTop: Spacing.sm,
  },
  radioItem: {
    paddingVertical: Spacing.xs,
  },
  comingSoon: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontStyle: 'italic',
  },
  testSection: {
    padding: Spacing.md,
  },
  testBtnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
