import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Radius, Spacing, Typography } from '../../theme/tokens';
import { AppButton } from './AppButton';
import { formatIndianDate } from '../../logic/formatting';

interface SimpleDatePickerModalProps {
  visible: boolean;
  value?: string | null; // ISO string 'YYYY-MM-DD'
  onConfirm: (dateIso: string) => void;
  onDismiss: () => void;
  onClear?: () => void;
  title?: string;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function SimpleDatePickerModal({
  visible,
  value,
  onConfirm,
  onDismiss,
  onClear,
  title,
}: SimpleDatePickerModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const parseInitialDate = () => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      }
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
  };

  const initial = parseInitialDate();
  const [selectedYear, setSelectedYear] = useState<number>(initial.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(initial.month);
  const [selectedDay, setSelectedDay] = useState<number>(initial.day);

  useEffect(() => {
    if (visible) {
      const init = parseInitialDate();
      setSelectedYear(init.year);
      setSelectedMonth(init.month);
      setSelectedDay(init.day);
    }
  }, [visible, value]);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const validDay = Math.min(selectedDay, daysInMonth);

  const currentYear = new Date().getFullYear();
  // Provide a range of years from 20 years back to 5 years forward
  const years = Array.from({ length: 30 }, (_, i) => currentYear - 20 + i);

  const getIsoString = () => {
    const mm = String(selectedMonth + 1).padStart(2, '0');
    const dd = String(validDay).padStart(2, '0');
    return `${selectedYear}-${mm}-${dd}`;
  };

  const handleConfirm = () => {
    onConfirm(getIsoString());
  };

  const setPreset = (offsetMonths: number = 0, offsetYears: number = 0) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - offsetYears);
    d.setMonth(d.getMonth() - offsetMonths);
    setSelectedYear(d.getFullYear());
    setSelectedMonth(d.getMonth());
    setSelectedDay(d.getDate());
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onDismiss}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onDismiss}
          />
          <View style={[styles.dialog, { backgroundColor: theme.colors.surface }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                {title || t('assetForm.selectDate')}
              </Text>
              <Text style={[styles.datePreview, { color: theme.colors.primary }]}>
                {formatIndianDate(getIsoString())}
              </Text>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetsRow}>
              <TouchableOpacity
                onPress={() => setPreset(0, 0)}
                style={[styles.presetChip, { borderColor: theme.custom.border }]}
              >
                <Text style={[styles.presetText, { color: theme.colors.onSurface }]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPreset(6, 0)}
                style={[styles.presetChip, { borderColor: theme.custom.border }]}
              >
                <Text style={[styles.presetText, { color: theme.colors.onSurface }]}>6 mo ago</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPreset(0, 1)}
                style={[styles.presetChip, { borderColor: theme.custom.border }]}
              >
                <Text style={[styles.presetText, { color: theme.colors.onSurface }]}>1 yr ago</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPreset(0, 2)}
                style={[styles.presetChip, { borderColor: theme.custom.border }]}
              >
                <Text style={[styles.presetText, { color: theme.colors.onSurface }]}>2 yr ago</Text>
              </TouchableOpacity>
            </View>

            {/* Year Selector */}
            <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Year</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectorRow}
            >
              {years.map((y) => {
                const isSelected = y === selectedYear;
                return (
                  <TouchableOpacity
                    key={y}
                    onPress={() => setSelectedYear(y)}
                    style={[
                      styles.yearItem,
                      isSelected && { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.yearText,
                        { color: isSelected ? '#fff' : theme.colors.onSurface },
                      ]}
                    >
                      {y}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Month Selector */}
            <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Month</Text>
            <View style={styles.monthsGrid}>
              {MONTHS.map((m, idx) => {
                const isSelected = idx === selectedMonth;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSelectedMonth(idx)}
                    style={[
                      styles.monthItem,
                      isSelected && { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthText,
                        { color: isSelected ? '#fff' : theme.colors.onSurface },
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Day Selector */}
            <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Day</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectorRow}
            >
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                const isSelected = d === validDay;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setSelectedDay(d)}
                    style={[
                      styles.dayItem,
                      isSelected && { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: isSelected ? '#fff' : theme.colors.onSurface },
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              {onClear && (
                <AppButton
                  label={t('assetForm.clearDate')}
                  variant="ghost"
                  onPress={() => {
                    onClear();
                    onDismiss();
                  }}
                  style={styles.actionBtn}
                />
              )}
              <View style={{ flex: 1 }} />
              <AppButton
                label={t('common.cancel')}
                variant="outline"
                onPress={onDismiss}
                style={styles.actionBtn}
              />
              <AppButton
                label={t('common.confirm')}
                variant="primary"
                onPress={handleConfirm}
                style={[styles.actionBtn, { marginLeft: Spacing.sm }]}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    elevation: 8,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.titleSmall,
    fontWeight: '700',
  },
  datePreview: {
    ...Typography.titleMedium,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  presetChip: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  presetText: {
    ...Typography.labelSmall,
  },
  sectionLabel: {
    ...Typography.labelSmall,
    fontWeight: '600',
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  yearItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  yearText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 4,
  },
  monthItem: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  monthText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  dayItem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  actionBtn: {
    minWidth: 80,
  },
});
