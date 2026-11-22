import React from 'react';
import { View, StyleSheet, Modal, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from '../common/Card';
import { AppButton } from '../common/AppButton';
import { Spacing, Typography, Radius } from '../../theme/tokens';

interface BatteryHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BatteryHelpModal({ visible, onClose }: BatteryHelpModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Card elevated style={styles.card}>
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="battery-alert-variant-outline"
              size={28}
              color={theme.colors.primary}
              style={{ marginRight: Spacing.sm }}
            />
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              {t('reminders.batteryHelpTitle')}
            </Text>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[styles.leadText, { color: theme.custom.textSecondary }]}>
              {t('reminders.batteryHelpDesc')}
            </Text>

            <View style={styles.deviceList}>
              <View style={[styles.deviceItem, { backgroundColor: theme.custom.surfaceVariant }]}>
                <Text style={[styles.deviceBrand, { color: theme.colors.onSurface }]}>
                  Samsung (OneUI)
                </Text>
                <Text style={[styles.deviceInstructions, { color: theme.custom.textSecondary }]}>
                  Settings → Battery → Background usage limits → Add AssetVault to "Never sleeping apps".
                </Text>
              </View>

              <View style={[styles.deviceItem, { backgroundColor: theme.custom.surfaceVariant }]}>
                <Text style={[styles.deviceBrand, { color: theme.colors.onSurface }]}>
                  Xiaomi / Redmi / POCO (MIUI / HyperOS)
                </Text>
                <Text style={[styles.deviceInstructions, { color: theme.custom.textSecondary }]}>
                  Settings → Apps → Manage apps → AssetVault → Battery saver → Choose "No restrictions", and enable "Autostart".
                </Text>
              </View>

              <View style={[styles.deviceItem, { backgroundColor: theme.custom.surfaceVariant }]}>
                <Text style={[styles.deviceBrand, { color: theme.colors.onSurface }]}>
                  OnePlus / Oppo / Realme (OxygenOS / ColorOS)
                </Text>
                <Text style={[styles.deviceInstructions, { color: theme.custom.textSecondary }]}>
                  Settings → Battery → More battery settings → Optimize battery use → Select AssetVault → Choose "Don't optimize".
                </Text>
              </View>

              <View style={[styles.deviceItem, { backgroundColor: theme.custom.surfaceVariant }]}>
                <Text style={[styles.deviceBrand, { color: theme.colors.onSurface }]}>
                  Vivo / iQOO (Funtouch OS)
                </Text>
                <Text style={[styles.deviceInstructions, { color: theme.custom.textSecondary }]}>
                  Settings → Battery → Background power consumption management → Select AssetVault → Allow background power usage.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <AppButton
              variant="primary"
              label={t('reminders.batteryHelpAction')}
              onPress={onClose}
              style={styles.button}
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
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.titleMedium,
    fontWeight: '700',
    flex: 1,
  },
  body: {
    marginBottom: Spacing.md,
  },
  leadText: {
    ...Typography.bodyMedium,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  deviceList: {
    gap: Spacing.sm,
  },
  deviceItem: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
  },
  deviceBrand: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    marginBottom: 4,
  },
  deviceInstructions: {
    ...Typography.bodySmall,
    lineHeight: 18,
  },
  footer: {
    paddingTop: Spacing.sm,
  },
  button: {
    width: '100%',
  },
});
