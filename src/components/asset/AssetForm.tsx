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
import { calculateWarrantyEndDate } from '../../logic/warranty';
import { formatIndianDate } from '../../logic/formatting';
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
  // Warranty fields (Stage 2)
  warrantyProvider?: string;
  warrantyStartDate?: string;
  warrantyDurationMonths?: number;
  warrantyEndDate?: string;
  coverageDetails?: string;
  exclusions?: string;
  customerCareNumber?: string;
  claimInstructions?: string;
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

  // Basic form states
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

  // Warranty form states (Stage 2)
  const [warrantyProvider, setWarrantyProvider] = useState(initialValues?.warrantyProvider || '');
  const [warrantyStartDate, setWarrantyStartDate] = useState<string | undefined>(
    initialValues?.warrantyStartDate || initialValues?.purchaseDate
  );
  const [warrantyDurationStr, setWarrantyDurationStr] = useState<string>(
    initialValues?.warrantyDurationMonths ? String(initialValues.warrantyDurationMonths) : ''
  );
  const [warrantyEndDate, setWarrantyEndDate] = useState<string | undefined>(
    initialValues?.warrantyEndDate ||
      (initialValues?.warrantyStartDate && initialValues?.warrantyDurationMonths
        ? calculateWarrantyEndDate(initialValues.warrantyStartDate, initialValues.warrantyDurationMonths) ?? undefined
        : undefined)
  );
  const [coverageDetails, setCoverageDetails] = useState(initialValues?.coverageDetails || '');
  const [exclusions, setExclusions] = useState(initialValues?.exclusions || '');
  const [customerCareNumber, setCustomerCareNumber] = useState(
    initialValues?.customerCareNumber || ''
  );
  const [claimInstructions, setClaimInstructions] = useState(
    initialValues?.claimInstructions || ''
  );

  // Track if expiry was auto-calculated
  const [isAutoCalculated, setIsAutoCalculated] = useState(
    Boolean(
      initialValues?.warrantyStartDate &&
        initialValues?.warrantyDurationMonths &&
        initialValues?.warrantyEndDate ===
          calculateWarrantyEndDate(initialValues.warrantyStartDate, initialValues.warrantyDurationMonths)
    )
  );

  // UI / Modal states
  const [nameError, setNameError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [purchaseDateModalVisible, setPurchaseDateModalVisible] = useState(false);
  const [warrantyStartModalVisible, setWarrantyStartModalVisible] = useState(false);
  const [warrantyEndModalVisible, setWarrantyEndModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Derive suggested locations and whether IMEI should be shown
  const currentSubTypeMeta: SubTypeMeta | undefined = subType ? SUB_TYPE_MAP[subType] : undefined;
  const suggestedLocations = currentSubTypeMeta?.suggestedLocations || COMMON_LOCATIONS.slice(0, 4);
  const showImei = currentSubTypeMeta?.showImei || !!imeiNumber || category === 'electronics';

  // Handle purchase date change -> default warranty start date if not manually diverged
  const handlePurchaseDateChange = (newDate?: string) => {
    setPurchaseDate(newDate);
    // If warranty start date is empty or was identical to previous purchase date, default it
    if (!warrantyStartDate || warrantyStartDate === purchaseDate) {
      setWarrantyStartDate(newDate);
      if (newDate && warrantyDurationStr) {
        const months = parseInt(warrantyDurationStr, 10);
        if (!isNaN(months) && months > 0) {
          const calculated = calculateWarrantyEndDate(newDate, months);
          if (calculated) {
            setWarrantyEndDate(calculated);
            setIsAutoCalculated(true);
          }
        }
      }
    }
  };

  // Handle warranty start date change
  const handleWarrantyStartDateChange = (newDate?: string) => {
    setWarrantyStartDate(newDate);
    if (newDate && warrantyDurationStr) {
      const months = parseInt(warrantyDurationStr, 10);
      if (!isNaN(months) && months > 0) {
        const calculated = calculateWarrantyEndDate(newDate, months);
        if (calculated) {
          setWarrantyEndDate(calculated);
          setIsAutoCalculated(true);
        }
      }
    }
  };

  // Handle duration change -> recalculate expiry date if start date exists
  const handleDurationChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    setWarrantyDurationStr(cleanText);
    const months = parseInt(cleanText, 10);

    if (!isNaN(months) && months > 0) {
      if (warrantyStartDate) {
        const calculated = calculateWarrantyEndDate(warrantyStartDate, months);
        if (calculated) {
          setWarrantyEndDate(calculated);
          setIsAutoCalculated(true);
        }
      }
    } else if (!cleanText) {
      // If duration cleared, clear auto-calculated end date
      if (isAutoCalculated) {
        setWarrantyEndDate(undefined);
        setIsAutoCalculated(false);
      }
    }
  };

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
      const priceNum = purchasePriceStr
        ? parseFloat(purchasePriceStr.replace(/[^0-9.]/g, ''))
        : undefined;
      const durationNum = warrantyDurationStr
        ? parseInt(warrantyDurationStr.replace(/[^0-9]/g, ''), 10)
        : undefined;

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
        // Warranty fields
        warrantyProvider: warrantyProvider.trim() || undefined,
        warrantyStartDate: warrantyStartDate || undefined,
        warrantyDurationMonths: isNaN(durationNum as number) ? undefined : durationNum,
        warrantyEndDate: warrantyEndDate || undefined,
        coverageDetails: coverageDetails.trim() || undefined,
        exclusions: exclusions.trim() || undefined,
        customerCareNumber: customerCareNumber.trim() || undefined,
        claimInstructions: claimInstructions.trim() || undefined,
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

  // Check if start date is missing while duration is entered (Needs Confirmation condition)
  const durationEntered = Boolean(warrantyDurationStr && parseInt(warrantyDurationStr, 10) > 0);
  const needsStartDateConfirmation = durationEntered && !warrantyStartDate;

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
        {/* Section 1: Category & Template */}
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
                {selectedSubTypeLabel ||
                  (category ? t(`categories.${category}`) : t('assetForm.subTypePlaceholder'))}
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

        {/* Section 2: Purchase & Identification */}
        <Text style={[styles.sectionTitle, { color: theme.colors.primary, marginTop: Spacing.xl }]}>
          {t('assetForm.purchaseSection')}
        </Text>

        {/* Purchase Date */}
        <DatePickerField
          label={t('assetForm.purchaseDateLabel')}
          value={purchaseDate}
          onPress={() => setPurchaseDateModalVisible(true)}
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

        {/* Section 3: Warranty Information (Stage 2) */}
        <Text style={[styles.sectionTitle, { color: theme.colors.primary, marginTop: Spacing.xl }]}>
          {t('assetForm.warrantySection')}
        </Text>

        {/* Warranty Provider */}
        <AppTextField
          label={t('assetForm.warrantyProviderLabel')}
          value={warrantyProvider}
          onChangeText={setWarrantyProvider}
          placeholder={t('assetForm.warrantyProviderPlaceholder')}
          style={styles.field}
        />

        {/* Warranty Start Date (defaults to purchase date) */}
        <DatePickerField
          label={t('assetForm.warrantyStartDateLabel')}
          value={warrantyStartDate}
          onPress={() => setWarrantyStartModalVisible(true)}
          style={styles.field}
        />
        {warrantyStartDate && warrantyStartDate === purchaseDate && (
          <Text style={[styles.hintText, { color: theme.custom.textSecondary }]}>
            ℹ️ {t('assetForm.warrantyStartDefaultsPurchase')}
          </Text>
        )}

        {/* Warning if duration is entered without start date */}
        {needsStartDateConfirmation && (
          <View
            style={[
              styles.warningBox,
              { backgroundColor: theme.custom.statusWarningBg, borderColor: theme.custom.statusWarning },
            ]}
          >
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={18}
              color={theme.custom.statusWarning}
              style={{ marginRight: Spacing.xs }}
            />
            <Text style={[styles.warningText, { color: theme.custom.statusWarning }]}>
              {t('assetForm.needsConfirmationDesc')}
            </Text>
          </View>
        )}

        {/* Duration in Months */}
        <AppTextField
          label={t('assetForm.warrantyDurationLabel')}
          value={warrantyDurationStr}
          onChangeText={handleDurationChange}
          placeholder={t('assetForm.warrantyDurationPlaceholder')}
          keyboardType="numeric"
          style={styles.field}
        />

        {/* Direct Expiry Date */}
        <DatePickerField
          label={t('assetForm.warrantyEndDateLabel')}
          value={warrantyEndDate}
          onPress={() => setWarrantyEndModalVisible(true)}
          style={styles.field}
        />

        {/* Auto-calculation indicator */}
        {warrantyEndDate && warrantyStartDate && durationEntered && (
          <View style={styles.autoCalcBadge}>
            <MaterialCommunityIcons
              name="calculator-variant-outline"
              size={16}
              color={theme.colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.autoCalcText, { color: theme.colors.primary }]}>
              {t('assetForm.warrantyCalculatedHint', {
                date: formatIndianDate(warrantyEndDate),
                months: warrantyDurationStr,
              })}
            </Text>
          </View>
        )}

        {/* Coverage Details */}
        <AppTextField
          label={t('assetForm.coverageDetailsLabel')}
          value={coverageDetails}
          onChangeText={setCoverageDetails}
          placeholder={t('assetForm.coverageDetailsPlaceholder')}
          multiline
          numberOfLines={2}
          style={styles.field}
        />

        {/* Exclusions */}
        <AppTextField
          label={t('assetForm.exclusionsLabel')}
          value={exclusions}
          onChangeText={setExclusions}
          placeholder={t('assetForm.exclusionsPlaceholder')}
          multiline
          numberOfLines={2}
          style={styles.field}
        />

        {/* Customer Care Number */}
        <AppTextField
          label={t('assetForm.customerCareLabel')}
          value={customerCareNumber}
          onChangeText={setCustomerCareNumber}
          placeholder={t('assetForm.customerCarePlaceholder')}
          keyboardType="phone-pad"
          style={styles.field}
        />

        {/* Claim Instructions */}
        <AppTextField
          label={t('assetForm.claimInstructionsLabel')}
          value={claimInstructions}
          onChangeText={setClaimInstructions}
          placeholder={t('assetForm.claimInstructionsPlaceholder')}
          multiline
          numberOfLines={2}
          style={styles.field}
        />

        {/* Section 4: Location & Notes */}
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

      {/* Purchase Date Picker Modal */}
      <SimpleDatePickerModal
        visible={purchaseDateModalVisible}
        value={purchaseDate}
        onConfirm={(iso) => {
          handlePurchaseDateChange(iso);
          setPurchaseDateModalVisible(false);
        }}
        onClear={() => {
          handlePurchaseDateChange(undefined);
          setPurchaseDateModalVisible(false);
        }}
        onDismiss={() => setPurchaseDateModalVisible(false)}
      />

      {/* Warranty Start Date Picker Modal */}
      <SimpleDatePickerModal
        visible={warrantyStartModalVisible}
        value={warrantyStartDate}
        onConfirm={(iso) => {
          handleWarrantyStartDateChange(iso);
          setWarrantyStartModalVisible(false);
        }}
        onClear={() => {
          handleWarrantyStartDateChange(undefined);
          setWarrantyStartModalVisible(false);
        }}
        onDismiss={() => setWarrantyStartModalVisible(false)}
      />

      {/* Warranty End Date Picker Modal */}
      <SimpleDatePickerModal
        visible={warrantyEndModalVisible}
        value={warrantyEndDate}
        onConfirm={(iso) => {
          setWarrantyEndDate(iso);
          setIsAutoCalculated(false);
          setWarrantyEndModalVisible(false);
        }}
        onClear={() => {
          setWarrantyEndDate(undefined);
          setIsAutoCalculated(false);
          setWarrantyEndModalVisible(false);
        }}
        onDismiss={() => setWarrantyEndModalVisible(false)}
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
  hintText: {
    ...Typography.bodySmall,
    fontSize: 12,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  warningText: {
    ...Typography.bodySmall,
    flex: 1,
    fontWeight: '600',
  },
  autoCalcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
    paddingLeft: Spacing.xs,
  },
  autoCalcText: {
    ...Typography.labelSmall,
    fontSize: 12,
    fontWeight: '600',
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
