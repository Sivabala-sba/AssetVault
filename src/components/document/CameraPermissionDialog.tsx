import React from 'react';
import { View, StyleSheet, Modal, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from '../common/Card';
import { AppButton } from '../common/AppButton';
import { Spacing, Typography, Radius } from '../../theme/tokens';

interface CameraPermissionDialogProps {
  visible: boolean;
  isPermanentlyDenied?: boolean;
  onRequestPermission: () => void;
  onFallbackToGallery?: () => void;
  onClose: () => void;
}

export function CameraPermissionDialog({
  visible,
  isPermanentlyDenied = false,
  onRequestPermission,
  onFallbackToGallery,
  onClose,
}: CameraPermissionDialogProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Card elevated style={styles.card}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <MaterialCommunityIcons
              name="camera-outline"
              size={36}
              color={theme.colors.primary}
            />
          </View>

          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {t('documents.cameraPermissionTitle')}
          </Text>

          <Text style={[styles.description, { color: theme.custom.textSecondary }]}>
            {t('documents.cameraPermissionDesc')}
          </Text>

          <View style={styles.btnCol}>
            {isPermanentlyDenied ? (
              <AppButton
                variant="primary"
                label={t('documents.openSettings')}
                onPress={() => Linking.openSettings()}
                style={styles.btn}
              />
            ) : (
              <AppButton
                variant="primary"
                label={t('common.confirm')}
                onPress={onRequestPermission}
                style={styles.btn}
              />
            )}

            {onFallbackToGallery && (
              <AppButton
                variant="outline"
                label={t('documents.uploadFromGallery')}
                onPress={onFallbackToGallery}
                style={styles.btn}
              />
            )}

            <AppButton
              variant="ghost"
              label={t('common.cancel')}
              onPress={onClose}
              style={styles.btn}
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
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.titleMedium,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  btnCol: {
    width: '100%',
    gap: Spacing.xs,
  },
  btn: {
    width: '100%',
  },
});
