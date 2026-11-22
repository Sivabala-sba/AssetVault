import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../src/hooks/useAppTheme';
import { AssetForm, AssetFormData } from '../../../src/components/asset/AssetForm';
import { assetRepository } from '../../../src/db/assets';
import { Spacing, Typography } from '../../../src/theme/tokens';
import type { Asset } from '../../../src/types/models';

export default function EditAssetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await assetRepository.getById(id);
        setAsset(data);
      } catch (e) {
        console.error('Failed to load asset for edit:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleUpdateAsset = async (formData: AssetFormData) => {
    if (!asset) return;

    const updatedAsset: Asset = {
      ...asset,
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
      updatedAt: new Date().toISOString(),
    };

    try {
      await assetRepository.update(updatedAsset);
      router.back();
    } catch (e) {
      console.error('Failed to update asset:', e);
      Alert.alert(t('common.error'), t('errors.saveFailed'));
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safe, styles.center, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!asset) {
    return (
      <SafeAreaView
        style={[styles.safe, styles.center, { backgroundColor: theme.colors.background }]}
      >
        <Text style={{ color: theme.custom.textSecondary }}>{t('errors.loadFailed')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.custom.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.onSurface}
          />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.colors.onSurface }]}>
          {t('assetForm.editTitle')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <AssetForm
        initialValues={asset}
        onSubmit={handleUpdateAsset}
        isEditing
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
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
});
