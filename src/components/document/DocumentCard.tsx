import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from '../common/Card';
import { formatIndianDate } from '../../logic/formatting';
import { Spacing, Typography, Radius } from '../../theme/tokens';
import type { AssetDocument } from '../../types/models';

interface DocumentCardProps {
  document: AssetDocument;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

export function DocumentCard({
  document,
  onPress,
  onEdit,
  onDelete,
  compact = false,
}: DocumentCardProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const isPdf =
    document.mimeType === 'application/pdf' ||
    document.fileUri.toLowerCase().endsWith('.pdf');

  const typeName = t(`documents.types.${document.type}`, {
    defaultValue: document.type,
  });

  return (
    <Card variant="outlined" style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        {/* Thumbnail preview */}
        <View
          style={[
            styles.thumbnailContainer,
            { backgroundColor: theme.custom.surfaceVariant },
          ]}
        >
          {isPdf ? (
            <MaterialCommunityIcons name="file-pdf-box" size={32} color="#EF5350" />
          ) : (
            <Image
              source={{ uri: document.fileUri }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          )}
        </View>

        {/* Info Column */}
        <View style={styles.infoCol}>
          <Text
            style={[styles.title, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            {document.title || typeName}
          </Text>

          <View style={styles.metaRow}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: theme.custom.surfaceVariant },
              ]}
            >
              <Text
                style={[styles.typeBadgeText, { color: theme.colors.primary }]}
              >
                {typeName}
              </Text>
            </View>

            {document.addedAt && !compact && (
              <Text style={[styles.dateText, { color: theme.custom.textSecondary }]}>
                {formatIndianDate(document.addedAt.split('T')[0])}
              </Text>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={18}
                color={theme.custom.textSecondary}
              />
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={18}
                color={theme.colors.error}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoCol: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  title: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: Typography.bodySmall.fontSize,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
});
