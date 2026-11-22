import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from '../common/Card';
import { AppButton } from '../common/AppButton';
import { formatIndianDate } from '../../logic/formatting';
import { Spacing, Typography, Radius } from '../../theme/tokens';
import type { Asset } from '../../types/models';

interface WarrantySuggestionCardProps {
  asset: Asset;
  expiryDate: string;
  onAccept: () => void;
  onEdit: () => void;
  onSkip: () => void;
}

export function WarrantySuggestionCard({
  asset,
  expiryDate,
  onAccept,
  onEdit,
  onSkip,
}: WarrantySuggestionCardProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <Card
      variant="outlined"
      elevated
      style={[
        styles.card,
        {
          backgroundColor: theme.custom.surfaceVariant,
          borderColor: theme.colors.primary,
          borderWidth: 1.5,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="bell-ring"
            size={24}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {t('reminders.warrantySuggestionTitle')}
          </Text>
          <Text style={[styles.dateText, { color: theme.colors.primary }]}>
            Expires: {formatIndianDate(expiryDate)}
          </Text>
        </View>
      </View>

      <Text style={[styles.desc, { color: theme.custom.textSecondary }]}>
        {t('reminders.warrantySuggestionDesc', {
          date: formatIndianDate(expiryDate),
        })}
      </Text>

      <View style={styles.actionsRow}>
        <AppButton
          variant="ghost"
          label={t('reminders.skip')}
          onPress={onSkip}
          style={styles.skipBtn}
        />
        <AppButton
          variant="outline"
          label={t('reminders.editSuggestion')}
          onPress={onEdit}
          style={styles.editBtn}
        />
        <AppButton
          variant="primary"
          label={t('reminders.accept')}
          onPress={onAccept}
          style={styles.acceptBtn}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginVertical: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
  dateText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginTop: 2,
  },
  desc: {
    ...Typography.bodySmall,
    lineHeight: 18,
    marginVertical: Spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  skipBtn: {
    marginRight: 'auto',
  },
  editBtn: {},
  acceptBtn: {},
});
