import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AppTextField } from '../common/AppTextField';
import { AppButton } from '../common/AppButton';
import { DOCUMENT_TYPES } from './CameraScannerModal';
import { Spacing, Typography, Radius } from '../../theme/tokens';
import type { AssetDocument, DocumentType } from '../../types/models';

interface EditDocumentModalProps {
  visible: boolean;
  document: AssetDocument | null;
  onSave: (docId: string, updates: { title?: string; type?: DocumentType }) => Promise<void>;
  onClose: () => void;
}

export function EditDocumentModal({
  visible,
  document,
  onSave,
  onClose,
}: EditDocumentModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<DocumentType>('invoice');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (document) {
      setTitle(document.title || '');
      setSelectedType(document.type);
    }
  }, [document, visible]);

  if (!visible || !document) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(document.id, {
        title: title.trim() || undefined,
        type: selectedType,
      });
      onClose();
    } catch (e) {
      console.error('Failed to update document:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.dialog, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              {t('documents.rename')} / {t('documents.changeType')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={theme.custom.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Title Input */}
          <View style={styles.inputContainer}>
            <AppTextField
              label={t('documents.documentTitle')}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Purchase Invoice - Croma"
            />
          </View>

          {/* Type Selector */}
          <Text style={[styles.typeLabel, { color: theme.custom.textSecondary }]}>
            {t('documents.documentType')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeRow}
          >
            {DOCUMENT_TYPES.map((type) => {
              const selected = selectedType === type;
              return (
                <Chip
                  key={type}
                  selected={selected}
                  onPress={() => setSelectedType(type)}
                  style={[
                    styles.typeChip,
                    selected && {
                      backgroundColor: theme.colors.primaryContainer,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                  textStyle={[
                    styles.typeChipText,
                    selected && { color: theme.colors.primary, fontWeight: '700' },
                  ]}
                  showSelectedOverlay={false}
                >
                  {t(`documents.types.${type}`)}
                </Chip>
              );
            })}
          </ScrollView>

          {/* Actions */}
          <View style={styles.buttonRow}>
            <AppButton
              variant="outline"
              label={t('common.cancel')}
              onPress={onClose}
              disabled={saving}
              style={styles.actionBtn}
            />
            <AppButton
              variant="primary"
              label={t('common.save')}
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
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
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  typeLabel: {
    fontSize: Typography.labelMedium.fontSize,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingBottom: Spacing.lg,
  },
  typeChip: {
    marginRight: 4,
  },
  typeChipText: {
    fontSize: Typography.labelSmall.fontSize,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    minWidth: 100,
  },
});
