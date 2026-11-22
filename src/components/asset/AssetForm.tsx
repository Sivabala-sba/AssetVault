import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AppTextField } from '../common/AppTextField';
import { DatePickerField } from '../common/DatePickerField';
import { AppButton } from '../common/AppButton';
import { SimpleDatePickerModal } from '../common/SimpleDatePickerModal';
import { Radius, Spacing, Typography } from '../../theme/tokens';
import {
  CATEGORIES,
  CATEGORY_MAP,
  SUB_TYPES,
  SUB_TYPE_MAP,
  COMMON_LOCATIONS,
  SubTypeMeta,
} from '../../constants/categories';
import type { Asset, AssetCategory } from '../../types/models';

export interface AssetFormData {
  name: string;
  category: AssetCategory;
  subType?: string;
  brand?: string;
  modelNumber?: string;
  serialNumber?: string;
  imeiNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  seller?: string;
  invoiceNumber?: string;
  location?: string;
  notes?: string;
  photos: string[];
}

interface AssetFormProps {
  initialValues?: Partial<Asset>;
  initialSubType?: string;
  onSubmit: (data: AssetFormData) => Promise<void>;
  submitLabel?: string;
  isEditing?: boolean;
}

export function AssetForm({
  initialValues,
  initialSubType,
  onSubmit,
  submitLabel,
  isEditing = false,
}: AssetFormProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  // Form states
  const [name, setName] = useState(initialValues?.name || '');
  const [category, setCategory] = useState<AssetCategory | undefined>(initialValues?.category);
  const [subType, setSubType] = useState<string | undefined>(
    initialSubType || (initialValues?.category ? initialValues.category : undefined)
  );
  const [brand, setBrand] = useState(initialValues?.brand || '');
  const [modelNumber, setModelNumber] = useState(initialValues?.modelNumber || '');
  const [serialNumber, setSerialNumber] = useState(initialValues?.serialNumber || '');
  const [imeiNumber, setImeiNumber] = useState(initialValues?.imeiNumber || '');
  const [purchaseDate, setPurchaseDate] = useState<string | undefined>(initialValues?.purchaseDate);
  const [purchasePriceStr, setPurchasePriceStr] = useState<string>(
    initialValues?.purchasePrice ? String(initialValues.purchasePrice) : ''
  );
  const [seller, setSeller] = useState(initialValues?.seller || '');
  const [invoiceNumber, setInvoiceNumber] = useState(initialValues?.invoiceNumber || '');
  const [location, setLocation] = useState(initialValues?.location || '');
  const [notes, setNotes] = useState(initialValues?.notes || '');
  const [photos] = useState<string[]>(initialValues?.photos || []);

  // UI / Modal states
  const [nameError, setNameError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Derive suggested locations and whether IMEI should be shown
  const currentSubTypeMeta: SubTypeMeta | undefined = subType ? SUB_TYPE_MAP[subType] : undefined;
  const suggestedLocations = currentSubTypeMeta?.suggestedLocations || COMMON_LOCATIONS.slice(0, 4);
  const showImei = currentSubTypeMeta?.showImei || !!imeiNumber || category === 'electronics';

  // Handle template selection
  const handleSelectTemplate = (selected: SubTypeMeta) => {
    setSubType(selected.key);
    setCategory(selected.category);
    setCategoryError(null);

    // If location is not set and template has a primary suggested location, suggest it
    if (!location && selected.suggestedLocations.length > 0) {
      setLocation(selected.suggestedLocations[0]);
    }

    setTemplateModalVisible(false);
  };

  const validate = (): boolean => {
    let valid = true;
    if (!name.trim()) {
      setNameError(t('assetForm.nameError'));
      valid = false;
    } else {
      setNameError(null);
    }

    if (!category) {
      setCategoryError(t('assetForm.categoryError'));
      valid = false;
    } else {
      setCategoryError(null);
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const priceNum = purchasePriceStr ? parseFloat(purchasePriceStr.replace(/[^0-9.]/g, '')) : undefined;

      await onSubmit({
        name: name.trim(),
        category: category!,
        subType,
        brand: brand.trim() || undefined,
        modelNumber: modelNumber.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        imeiNumber: showImei && imeiNumber.trim() ? imeiNumber.trim() : undefined,
        purchaseDate: purchaseDate || undefined,
        purchasePrice: isNaN(priceNum as number) ? undefined : priceNum,
        seller: seller.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        photos,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryMeta = category ? CATEGORY_MAP[category] : undefined;
  const selectedSubTypeLabel = subType
    ? t(`subTypes.${subType}`, { defaultValue: subType })
    : undefined;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardAvoid}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Category & Template */}
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t('assetForm.generalSection')}
        </Text>

        <TouchableOpacity
          onPress={() => setTemplateModalVisible(true)}
          style={[
            styles.selectorBox,
            {
              borderColor: categoryError ? theme.colors.error : theme.custom.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <View style={styles.selectorLeft}>
            <MaterialCommunityIcons
              name={(currentSubTypeMeta?.icon || selectedCategoryMeta?.icon || 'shape-outline') as any}
              size={24}
              color={category ? theme.colors.primary : theme.custom.textSecondary}
              style={styles.selectorIcon}
            />
            <View>
              <Text style={[styles.selectorLabel, { color: theme.custom.textSecondary }]}>
                {t('assetForm.subTypeLabel')} *
              </Text>
              <Text
                style={[
                  styles.selectorValue,
                  { color: subType ? theme.colors.onSurface : theme.custom.textDisabled },
                ]}
              >
                {selectedSubTypeLabel || (category ? t(`categories.${category}`) : t('assetForm.subTypePlaceholder'))}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name="chevron-down"
            size={22}
            color={theme.custom.textSecondary}
          />
        </TouchableOpacity>
        {categoryError && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {categoryError}
          </Text>
        )}

        {/* Asset Name */}
        <AppTextField
          label={`${t('assetForm.nameLabel')} *`}
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (val.trim()) setNameError(null);
          }}
          placeholder={t('assetForm.namePlaceholder')}
          error={nameError || undefined}
          style={styles.field}
        />
        {nameError && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {nameError}
          </Text>
        )}

        {/* Brand */}
        <AppTextField
          label={t('assetForm.brandLabel')}
          value={brand}
          onChangeText={setBrand}
          placeholder={t('assetForm.brandPlaceholder')}
          style={styles.field}
        />

        {/* Model Number */}
        <AppTextField
          label={t('assetForm.modelNumberLabel')}
          value={modelNumber}
          onChangeText={setModelNumber}
          placeholder={t('assetForm.modelNumberPlaceholder')}
          autoCapitalize="characters"
          style={styles.field}
        />

        {/* Serial Number */}
        <AppTextField
          label={t('assetForm.serialNumberLabel')}
          value={serialNumber}
          onChangeText={setSerialNumber}
          placeholder={t('assetForm.serialNumberPlaceholder')}
          autoCapitalize="characters"
          style={styles.field}
        />

        {/* IMEI Number (Phones and Tablets) */}
        {showImei && (
          <AppTextField
            label={t('assetForm.imeiNumberLabel')}
            value={imeiNumber}
            onChangeText={setImeiNumber}
            placeholder={t('assetForm.imeiNumberPlaceholder')}
            keyboardType="numeric"
            style={styles.field}
          />
        )}

        {/* Section: Purchase & Identification */}
        <Text style={[styles.sectionTitle, { color: theme.colors.primary, marginTop: Spacing.xl }]}>
          {t('assetForm.purchaseSection')}
        </Text>

        {/* Purchase Date */}
        <DatePickerField
          label={t('assetForm.purchaseDateLabel')}
          value={purchaseDate}
          onPress={() => setDateModalVisible(true)}
          style={styles.field}
        />

        {/* Purchase Price */}
        <AppTextField
          label={t('assetForm.purchasePriceLabel')}
          value={purchasePriceStr}
          onChangeText={setPurchasePriceStr}
          placeholder={t('assetForm.purchasePricePlaceholder')}
          keyboardType="numeric"
          style={styles.field}
        />

        {/* Seller / Store */}
        <AppTextField
          label={t('assetForm.sellerLabel')}
          value={seller}
          onChangeText={setSeller}
          placeholder={t('assetForm.sellerPlaceholder')}
          style={styles.field}
        />

        {/* Invoice Number */}
        <AppTextField
          label={t('assetForm.invoiceNumberLabel')}
          value={invoiceNumber}
          onChangeText={setInvoiceNumber}
          placeholder={t('assetForm.invoiceNumberPlaceholder')}
          autoCapitalize="characters"
          style={styles.field}
        />

        {/* Section: Location & Notes */}
        <Text style={[styles.sectionTitle, { color: theme.colors.primary, marginTop: Spacing.xl }]}>
          {t('assetForm.locationSection')}
        </Text>

        {/* Location */}
        <AppTextField
          label={t('assetForm.locationLabel')}
          value={location}
          onChangeText={setLocation}
          placeholder={t('assetForm.locationPlaceholder')}
          style={styles.field}
        />

        {/* Location Suggestions */}
        {suggestedLocations.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={[styles.suggestedLabel, { color: theme.custom.textSecondary }]}>
              {t('assetForm.suggestedLocations')}
            </Text>
            <View style={styles.chipsRow}>
              {suggestedLocations.map((loc) => {
                const isSelected = location.toLowerCase() === loc.toLowerCase();
                return (
                  <TouchableOpacity
                    key={loc}
                    onPress={() => setLocation(loc)}
                    style={[
                      styles.locationChip,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : theme.custom.surfaceVariant,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.locationChipText,
                        { color: isSelected ? '#fff' : theme.colors.onSurface },
                      ]}
                    >
                      {loc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Notes */}
        <AppTextField
          label={t('assetForm.notesLabel')}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('assetForm.notesPlaceholder')}
          multiline
          numberOfLines={3}
          style={styles.field}
        />

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <AppButton
            label={
              submitLabel ||
              (isEditing ? t('assetForm.updateAsset') : t('assetForm.saveAsset'))
            }
            onPress={handleSubmit}
            loading={loading}
            fullWidth
          />
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <SimpleDatePickerModal
        visible={dateModalVisible}
        value={purchaseDate}
        onConfirm={(iso) => {
          setPurchaseDate(iso);
          setDateModalVisible(false);
        }}
        onClear={() => {
          setPurchaseDate(undefined);
          setDateModalVisible(false);
        }}
        onDismiss={() => setDateModalVisible(false)}
      />

      {/* Template & Category Selector Modal */}
      <Portal>
        <Modal
          visible={templateModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setTemplateModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                  {t('addAsset.chooseType')}
                </Text>
                <TouchableOpacity onPress={() => setTemplateModalVisible(false)}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={theme.custom.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.templateList} showsVerticalScrollIndicator={false}>
                {SUB_TYPES.map((item) => {
                  const isSelected = subType === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => handleSelectTemplate(item)}
                      style={[
                        styles.templateItem,
                        {
                          backgroundColor: isSelected
                            ? theme.custom.surfaceVariant
                            : 'transparent',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.templateIconWrap,
                          {
                            backgroundColor: isSelected
                              ? theme.colors.primary
                              : theme.custom.surfaceVariant,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={22}
                          color={isSelected ? '#fff' : theme.colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.templateName, { color: theme.colors.onSurface }]}>
                          {t(item.labelKey, { defaultValue: item.key })}
                        </Text>
                        <Text style={[styles.templateCat, { color: theme.custom.textSecondary }]}>
                          {t(`categories.${item.category}`)}
                        </Text>
                      </View>
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={20}
                          color={theme.colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  sectionTitle: {
    ...Typography.titleSmall,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  field: {
    marginBottom: Spacing.md,
  },
  selectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
    marginBottom: Spacing.sm,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorIcon: {
    marginRight: Spacing.md,
  },
  selectorLabel: {
    ...Typography.labelSmall,
    marginBottom: 2,
  },
  selectorValue: {
    ...Typography.bodyLarge,
    fontWeight: '500',
  },
  errorText: {
    ...Typography.bodySmall,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  suggestionsContainer: {
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
  },
  suggestedLabel: {
    ...Typography.labelSmall,
    marginBottom: Spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  locationChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  locationChipText: {
    ...Typography.labelSmall,
    fontWeight: '600',
  },
  submitContainer: {
    marginTop: Spacing.xl,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalTitle: {
    ...Typography.titleMedium,
    fontWeight: '700',
  },
  templateList: {
    paddingBottom: Spacing.xl,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: 4,
  },
  templateIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  templateName: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  templateCat: {
    ...Typography.bodySmall,
    fontSize: 12,
  },
});
