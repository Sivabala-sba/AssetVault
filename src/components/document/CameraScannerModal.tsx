import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from '../common/Card';
import { AppButton } from '../common/AppButton';
import { CameraPermissionDialog } from './CameraPermissionDialog';
import { saveFileToPrivateStorage } from '../../services/documents';
import { generateId } from '../../utils/id';
import { Spacing, Typography, Radius } from '../../theme/tokens';
import type { AssetDocument, DocumentType } from '../../types/models';

export const DOCUMENT_TYPES: DocumentType[] = [
  'invoice',
  'warrantyCard',
  'productLabel',
  'manual',
  'insurance',
  'serviceReceipt',
  'registrationCertificate',
  'other',
];

interface CapturedPage {
  id: string;
  uri: string;
}

interface CameraScannerModalProps {
  visible: boolean;
  defaultType?: DocumentType;
  assetId?: string;
  onSave: (documents: AssetDocument[]) => void;
  onClose: () => void;
}

export function CameraScannerModal({
  visible,
  defaultType = 'invoice',
  assetId,
  onSave,
  onClose,
}: CameraScannerModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const [pages, setPages] = useState<CapturedPage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [documentType, setDocumentType] = useState<DocumentType>(defaultType);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [permissionDialogVisible, setPermissionDialogVisible] = useState(false);
  const [isPermanentlyDenied, setIsPermanentlyDenied] = useState(false);

  useEffect(() => {
    if (visible) {
      setDocumentType(defaultType);
      setTitle('');
      setPages([]);
      setSelectedIndex(0);
    }
  }, [visible, defaultType]);

  const requestCameraAndCapture = async () => {
    try {
      const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        setIsPermanentlyDenied(!canAskAgain);
        setPermissionDialogVisible(true);
        return;
      }

      // Launch camera with edge/crop adjustment
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPage: CapturedPage = {
          id: generateId('page'),
          uri: result.assets[0].uri,
        };
        setPages((prev) => {
          const next = [...prev, newPage];
          setSelectedIndex(next.length - 1);
          return next;
        });
      }
    } catch (e) {
      console.error('Camera capture error:', e);
    }
  };

  const handleRetakePage = async (index: number) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const updatedUri = result.assets[0].uri;
        setPages((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], uri: updatedUri };
          return next;
        });
      }
    } catch (e) {
      console.error('Retake error:', e);
    }
  };

  const handleMoveLeft = (index: number) => {
    if (index <= 0) return;
    setPages((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
    setSelectedIndex(index - 1);
  };

  const handleMoveRight = (index: number) => {
    if (index >= pages.length - 1) return;
    setPages((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
    setSelectedIndex(index + 1);
  };

  const handleDeletePage = (index: number) => {
    setPages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (selectedIndex >= next.length) {
        setSelectedIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (pages.length === 0) return;
    setSaving(true);

    try {
      const now = new Date().toISOString();
      const defaultTitle = t(`documents.types.${documentType}`);
      const baseTitle = title.trim() || defaultTitle;

      const createdDocs: AssetDocument[] = [];

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        // Store permanently in app's private storage
        const privateUri = await saveFileToPrivateStorage(page.uri, 'jpg');

        const pageTitle =
          pages.length > 1
            ? `${baseTitle} (Page ${i + 1})`
            : baseTitle;

        createdDocs.push({
          id: generateId('doc'),
          assetId,
          title: pageTitle,
          type: documentType,
          fileUri: privateUri,
          mimeType: 'image/jpeg',
          addedAt: now,
        });
      }

      onSave(createdDocs);
      onClose();
    } catch (e) {
      console.error('Error saving captured documents:', e);
      Alert.alert(t('common.error'), t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const currentPage = pages[selectedIndex];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.custom.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            {t('documents.scanWithCamera')}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Captured Page Preview or Initial Prompt */}
          {pages.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.custom.surfaceVariant }]}>
              <MaterialCommunityIcons
                name="camera-metering-matrix"
                size={54}
                color={theme.colors.primary}
              />
              <Text style={[styles.emptyPromptTitle, { color: theme.colors.onSurface }]}>
                {t('documents.scanWithCamera')}
              </Text>
              <Text style={[styles.emptyPromptDesc, { color: theme.custom.textSecondary }]}>
                {t('documents.scanWithCameraDesc')}
              </Text>
              <AppButton
                variant="primary"
                label={t('documents.capturePage')}
                icon="camera"
                onPress={requestCameraAndCapture}
                style={{ marginTop: Spacing.md }}
              />
            </View>
          ) : (
            <View style={styles.previewContainer}>
              {/* Preview card with image */}
              <View style={[styles.imageCard, { backgroundColor: '#1A1A1A' }]}>
                {currentPage && (
                  <Image
                    source={{ uri: currentPage.uri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                )}
                {/* Page indicator pill */}
                <View style={styles.pageBadge}>
                  <Text style={styles.pageBadgeText}>
                    {t('documents.pageOf', {
                      current: selectedIndex + 1,
                      total: pages.length,
                    })}
                  </Text>
                </View>
              </View>

              {/* Per-page Action Toolbar: Retake, Move Left, Move Right, Delete */}
              <View style={[styles.toolbar, { backgroundColor: theme.custom.surfaceVariant }]}>
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => handleRetakePage(selectedIndex)}
                >
                  <MaterialCommunityIcons name="camera-retake-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.toolBtnText, { color: theme.colors.primary }]}>
                    {t('documents.retake')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toolBtn, selectedIndex === 0 && styles.disabledTool]}
                  disabled={selectedIndex === 0}
                  onPress={() => handleMoveLeft(selectedIndex)}
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={20}
                    color={selectedIndex === 0 ? theme.custom.textDisabled : theme.colors.onSurface}
                  />
                  <Text
                    style={[
                      styles.toolBtnText,
                      { color: selectedIndex === 0 ? theme.custom.textDisabled : theme.colors.onSurface },
                    ]}
                  >
                    {t('documents.moveLeft')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toolBtn, selectedIndex === pages.length - 1 && styles.disabledTool]}
                  disabled={selectedIndex === pages.length - 1}
                  onPress={() => handleMoveRight(selectedIndex)}
                >
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={20}
                    color={selectedIndex === pages.length - 1 ? theme.custom.textDisabled : theme.colors.onSurface}
                  />
                  <Text
                    style={[
                      styles.toolBtnText,
                      { color: selectedIndex === pages.length - 1 ? theme.custom.textDisabled : theme.colors.onSurface },
                    ]}
                  >
                    {t('documents.moveRight')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => handleDeletePage(selectedIndex)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.colors.error} />
                  <Text style={[styles.toolBtnText, { color: theme.colors.error }]}>
                    {t('common.delete')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Thumbnail strip of multi-page capture */}
              <Text style={[styles.sectionHeading, { color: theme.custom.textSecondary }]}>
                {t('documents.pagesCaptured', { count: pages.length })}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbStrip}>
                {pages.map((p, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.thumbBox,
                        isSelected && { borderColor: theme.colors.primary, borderWidth: 2 },
                      ]}
                      onPress={() => setSelectedIndex(idx)}
                    >
                      <Image source={{ uri: p.uri }} style={styles.thumbImage} resizeMode="cover" />
                      <View style={styles.thumbNumberBadge}>
                        <Text style={styles.thumbNumberText}>{idx + 1}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Add Another Page Button */}
                <TouchableOpacity
                  style={[styles.addPageThumb, { backgroundColor: theme.custom.surfaceVariant }]}
                  onPress={requestCameraAndCapture}
                >
                  <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
                  <Text style={[styles.addPageThumbText, { color: theme.colors.primary }]}>
                    {t('documents.addPage')}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Document Metadata: Type & Title */}
          {pages.length > 0 && (
            <View style={styles.metaSection}>
              {/* Document Type Selector */}
              <Text style={[styles.inputLabel, { color: theme.custom.textSecondary }]}>
                {t('documents.documentType')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeChipsRow}>
                {DOCUMENT_TYPES.map((dType) => {
                  const isSelected = documentType === dType;
                  return (
                    <Chip
                      key={dType}
                      selected={isSelected}
                      onPress={() => setDocumentType(dType)}
                      style={[
                        styles.typeChip,
                        isSelected && { backgroundColor: theme.colors.primaryContainer },
                      ]}
                    >
                      {t(`documents.types.${dType}`)}
                    </Chip>
                  );
                })}
              </ScrollView>

              {/* Document Title (Optional) */}
              <Text style={[styles.inputLabel, { color: theme.custom.textSecondary }]}>
                {t('documents.documentTitle')}
              </Text>
              <TextInput
                style={[
                  styles.titleInput,
                  {
                    backgroundColor: theme.custom.surfaceVariant,
                    color: theme.colors.onSurface,
                    borderColor: theme.custom.border,
                  },
                ]}
                placeholder={t(`documents.types.${documentType}`)}
                placeholderTextColor={theme.custom.textDisabled}
                value={title}
                onChangeText={setTitle}
              />
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        {pages.length > 0 && (
          <View style={[styles.footer, { borderTopColor: theme.custom.border }]}>
            <AppButton
              variant="primary"
              label={t('documents.savePages')}
              loading={saving}
              disabled={saving}
              icon="check"
              onPress={handleSave}
              fullWidth
            />
          </View>
        )}

        {/* Camera Permission Education Dialog */}
        <CameraPermissionDialog
          visible={permissionDialogVisible}
          isPermanentlyDenied={isPermanentlyDenied}
          onRequestPermission={requestCameraAndCapture}
          onClose={() => setPermissionDialogVisible(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.titleMedium,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    marginTop: Spacing.xl,
  },
  emptyPromptTitle: {
    ...Typography.titleLarge,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyPromptDesc: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    maxWidth: 280,
  },
  previewContainer: {
    marginBottom: Spacing.md,
  },
  imageCard: {
    width: '100%',
    height: 340,
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  pageBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  pageBadgeText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  toolBtn: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  disabledTool: {
    opacity: 0.4,
  },
  toolBtnText: {
    ...Typography.labelSmall,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeading: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  thumbStrip: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  thumbBox: {
    width: 64,
    height: 84,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbNumberBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbNumberText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  addPageThumb: {
    width: 64,
    height: 84,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9AA0A6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPageThumbText: {
    ...Typography.labelSmall,
    fontSize: 9,
    fontWeight: '700',
  },
  metaSection: {
    marginTop: Spacing.md,
  },
  inputLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  typeChipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  typeChip: {
    marginBottom: Spacing.xs,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: 15,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
});
