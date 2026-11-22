import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { Card } from '../../src/components/common/Card';
import { AssetForm, AssetFormData } from '../../src/components/asset/AssetForm';
import { assetRepository } from '../../src/db/assets';
import { generateId } from '../../src/utils/id';
import { Radius, Spacing, Typography } from '../../src/theme/tokens';
import type { Asset } from '../../src/types/models';

type AddMode = 'options' | 'form';

interface OptionItem {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  active: boolean;
}

const OPTIONS: OptionItem[] = [
  {
    id: 'scan_bill',
    icon: 'file-document-outline',
    titleKey: 'addAsset.scanBill',
    descKey: 'addAsset.scanBillDesc',
    active: false,
  },
  {
    id: 'scan_warranty',
    icon: 'shield-check-outline',
    titleKey: 'addAsset.scanWarranty',
    descKey: 'addAsset.scanWarrantyDesc',
    active: false,
  },
  {
    id: 'scan_label',
    icon: 'barcode-scan',
    titleKey: 'addAsset.scanProductLabel',
    descKey: 'addAsset.scanProductLabelDesc',
    active: false,
  },
  {
    id: 'scan_vehicle',
    icon: 'car-outline',
    titleKey: 'addAsset.scanVehicleDoc',
    descKey: 'addAsset.scanVehicleDocDesc',
    active: false,
  },
  {
    id: 'upload_doc',
    icon: 'file-upload-outline',
    titleKey: 'addAsset.uploadDoc',
    descKey: 'addAsset.uploadDocDesc',
    active: false,
  },
  {
    id: 'manual',
    icon: 'form-textbox',
    titleKey: 'addAsset.enterManually',
    descKey: 'addAsset.enterManuallyDesc',
    active: true,
  },
];

export default function AddAssetScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();

  const [mode, setMode] = useState<AddMode>('options');

  const handleOptionPress = (option: OptionItem) => {
    if (option.active) {
      setMode('form');
    } else {
      Alert.alert(
        t('common.comingSoon'),
        t('addAsset.comingSoonNotice'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const handleSaveAsset = async (formData: AssetFormData) => {
    const now = new Date().toISOString();
    const newAsset: Asset = {
      id: generateId('ast'),
      name: formData.name,
      category: formData.category,
      brand: formData.brand,
      modelNumber: formData.modelNumber,
      serialNumber: formData.serialNumber,
      imeiNumber: formData.imeiNumber,
      purchaseDate: formData.purchaseDate,
      purchasePrice: formData.purchasePrice,
      seller: formData.seller,
      invoiceNumber: formData.invoiceNumber,
      location: formData.location,
      notes: formData.notes,
      photos: formData.photos,
      documents: [],
      maintenanceTasks: [],
      serviceHistory: [],
      reminders: [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      await assetRepository.insert(newAsset);
      // Navigate to the newly created asset details
      router.replace(`/asset/${newAsset.id}` as any);
    } catch (e) {
      console.error('Failed to create asset:', e);
      Alert.alert(t('common.error'), t('errors.saveFailed'));
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Top Navigation Bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.custom.border }]}>
        <TouchableOpacity
          onPress={() => {
            if (mode === 'form') {
              setMode('options');
            } else {
              router.back();
            }
          }}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.onSurface}
          />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.colors.onSurface }]}>
          {mode === 'form' ? t('assetForm.newTitle') : t('addAsset.title')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {mode === 'options' ? (
        <ScrollView
          contentContainerStyle={styles.optionsContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.subtitle, { color: theme.custom.textSecondary }]}>
            {t('addAsset.subtitle')}
          </Text>

          {OPTIONS.map((opt) => (
            <Card
              key={opt.id}
              onPress={() => handleOptionPress(opt)}
              elevated={opt.active}
              style={[
                styles.optionCard,
                !opt.active && styles.inactiveCard,
              ]}
            >
              <View style={styles.optionRow}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: opt.active
                        ? theme.colors.primaryContainer
                        : theme.custom.surfaceVariant,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={opt.icon as any}
                    size={26}
                    color={opt.active ? theme.colors.primary : theme.custom.textDisabled}
                  />
                </View>

                <View style={styles.optionTextCol}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        styles.optionTitle,
                        {
                          color: opt.active
                            ? theme.colors.onSurface
                            : theme.custom.textSecondary,
                        },
                      ]}
                    >
                      {t(opt.titleKey)}
                    </Text>
                    {!opt.active && (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: theme.custom.surfaceVariant },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: theme.custom.textDisabled },
                          ]}
                        >
                          {t('common.comingSoon')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionDesc,
                      { color: theme.custom.textSecondary },
                    ]}
                  >
                    {t(opt.descKey)}
                  </Text>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={opt.active ? theme.colors.primary : theme.custom.textDisabled}
                />
              </View>
            </Card>
          ))}
        </ScrollView>
      ) : (
        <AssetForm onSubmit={handleSaveAsset} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    ...Typography.titleMedium,
    fontWeight: '700',
  },
  optionsContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  subtitle: {
    ...Typography.bodyMedium,
    marginBottom: Spacing.lg,
  },
  optionCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  inactiveCard: {
    opacity: 0.85,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionTextCol: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  optionTitle: {
    ...Typography.titleSmall,
    fontWeight: '600',
  },
  optionDesc: {
    ...Typography.bodySmall,
  },
  badge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: Radius.sm,
  },
  badgeText: {
    ...Typography.labelSmall,
    fontSize: 10,
    fontWeight: '600',
  },
});
