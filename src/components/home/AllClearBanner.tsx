import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Card } from '../common/Card';
import { Spacing, Typography, Radius } from '../../theme/tokens';

export function AllClearBanner() {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <Card
      variant="outlined"
      style={[
        styles.card,
        {
          backgroundColor: theme.custom.statusActiveBg,
          borderColor: theme.custom.statusActive,
        },
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: theme.custom.statusActive },
          ]}
        >
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={22}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: theme.custom.statusActive }]}>
            {t('home.allClearTitle')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
            {t('home.allClearSubtitle')}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textCol: {
    flex: 1,
  },
  title: {
    ...Typography.titleSmall,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.bodySmall,
    lineHeight: 18,
  },
});
