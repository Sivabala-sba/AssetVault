import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from '../common/Card';
import { AppButton } from '../common/AppButton';
import { DOCUMENT_TYPES, CameraScannerModal } from './CameraScannerModal';
import {
  pickImagesFromGallery,
  pickDocumentsFromFiles,
} from '../../services/documents';
import { generateId } from '../../utils/id';
import { Spacing, Typography, Radius } from '../../theme/tokens';
import type { AssetDocument, DocumentType } from '../../types/models';

interface DocumentPickerModalProps {
  visible: boolean;
  defaultType?: DocumentType;
  assetId?: string;
  onDocumentsSelected: (documents: AssetDocument[]) => void;
  onClose: () => void;
}

export function DocumentPickerModal({
  visible,
  defaultType = 'invoice',
  assetId,
  onDocumentsSelected,
  onClose,
}: DocumentPickerModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const [selectedType, setSelectedType] = useState<DocumentType>(defaultType);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePickFromGallery = async () => {
    setLoading(true);
    try {
      const picked = await pickImagesFromGallery(true);
      if (picked.length > 0) {
        const now = new Date().toISOString();
        const docs: AssetDocument[] = picked.map((item, idx) => ({
          id: generateId('doc'),
          assetId,
          title: picked.length > 1 ? `${item.name} (${idx + 1})` : item.name,
          type: selectedType,
          fileUri: item.uri,
          mimeType: item.mimeType,
          addedAt: now,
        }));
        onDocumentsSelected(docs);
        onClose();
      }
    } catch (e: any) {
      if (e.message !== 'PERMISSION_DENIED') {
        console.error('Gallery pick error:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePickFromFiles = async () => {
    setLoading(true);
    try {
      const picked = await pickDocumentsFromFiles(true);
      if (picked.length > 0) {
        const now = new Date().toISOString();
        const docs: AssetDocument[] = picked.map((item) => ({
          id: generateId('doc'),
          assetId,
          title: item.name,
          type: selectedType,
          fileUri: item.uri,
          mimeType: item.mimeType,
          addedAt: now,
        }));
        onDocumentsSelected(docs);
        onClose();
      }
    } catch (e) {
      console.error('File pick error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible && !showCameraScanner}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <Card elevated style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                {t('documents.attachDocument')}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={theme.custom.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Document Type Selector */}
            <Text style={[styles.label, { color: theme.custom.textSecondary }]}>
              {t('documents.documentType')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeChipsRow}>
              {DOCUMENT_TYPES.map((dType) => {
                const isSelected = selectedType === dType;
                return (
                  <Chip
                    key={dType}
                    selected={isSelected}
                    onPress={() => setSelectedType(dType)}
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

            {/* Option List: Camera, Gallery, Files */}
            <View style={styles.optionsList}>
              {/* 1. Camera Scanner */}
              <TouchableOpacity
                style={[styles.optionRow, { backgroundColor: theme.custom.surfaceVariant }]}
                onPress={() => setShowCameraScanner(true)}
              >
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialCommunityIcons name="camera-document" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.optionTextCol}>
                  <Text style={[styles.optionTitle, { color: theme.colors.onSurface }]}>
                    {t('documents.scanWithCamera')}
                  </Text>
                  <Text style={[styles.optionDesc, { color: theme.custom.textSecondary }]}>
                    {t('documents.scanWithCameraDesc')}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.custom.textSecondary} />
              </TouchableOpacity>

              {/* 2. Photo Gallery */}
              <TouchableOpacity
                style={[styles.optionRow, { backgroundColor: theme.custom.surfaceVariant }]}
                onPress={handlePickFromGallery}
                disabled={loading}
              >
                <View style={[styles.iconCircle, { backgroundColor: theme.custom.surfaceVariant }]}>
                  <MaterialCommunityIcons name="image-multiple-outline" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.optionTextCol}>
                  <Text style={[styles.optionTitle, { color: theme.colors.onSurface }]}>
                    {t('documents.uploadFromGallery')}
                  </Text>
                  <Text style={[styles.optionDesc, { color: theme.custom.textSecondary }]}>
                    {t('documents.uploadFromGalleryDesc')}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.custom.textSecondary} />
              </TouchableOpacity>

              {/* 3. PDF / Files */}
              <TouchableOpacity
                style={[styles.optionRow, { backgroundColor: theme.custom.surfaceVariant }]}
                onPress={handlePickFromFiles}
                disabled={loading}
              >
                <View style={[styles.iconCircle, { backgroundColor: theme.custom.surfaceVariant }]}>
                  <MaterialCommunityIcons name="file-pdf-box" size={24} color="#EA4335" />
                </View>
                <View style={styles.optionTextCol}>
                  <Text style={[styles.optionTitle, { color: theme.colors.onSurface }]}>
                    {t('documents.uploadFiles')}
                  </Text>
                  <Text style={[styles.optionDesc, { color: theme.custom.textSecondary }]}>
                    {t('documents.uploadFilesDesc')}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.custom.textSecondary} />
              </TouchableOpacity>
            </View>

            <AppButton
              variant="ghost"
              label={t('common.cancel')}
              onPress={onClose}
              style={{ marginTop: Spacing.sm }}
            />
          </Card>
        </View>
      </Modal>

      {/* Embedded Camera Scanner Modal */}
      <CameraScannerModal
        visible={showCameraScanner}
        defaultType={selectedType}
        assetId={assetId}
        onSave={(docs) => {
          setShowCameraScanner(false);
          onDocumentsSelected(docs);
          onClose();
        }}
        onClose={() => setShowCameraScanner(false)}
      />
    </>
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
    maxWidth: 400,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.titleMedium,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  typeChipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    paddingVertical: 2,
  },
  typeChip: {
    marginBottom: 2,
  },
  optionsList: {
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
  optionDesc: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
});
