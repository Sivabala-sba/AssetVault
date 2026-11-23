import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AppButton } from '../common/AppButton';
import { shareDocument, openDocument } from '../../services/documents';
import { Spacing, Typography, Radius } from '../../theme/tokens';
import type { AssetDocument } from '../../types/models';

interface DocumentViewerModalProps {
  visible: boolean;
  documents: AssetDocument[];
  initialIndex?: number;
  onClose: () => void;
  onEdit?: (document: AssetDocument) => void;
  onDelete?: (document: AssetDocument) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Robust cross-platform Zoomable and Pannable Image component.
 * Supports:
 * - 2-finger pinch to zoom (Android + iOS)
 * - 1-finger drag to pan when zoomed
 * - Double-tap to zoom in (2.5x) or reset (1x)
 * - On-screen Zoom In / Zoom Out / Reset controls for 100% reliability
 */
function ZoomableImage({ uri }: { uri: string }) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const [scaleValue, setScaleValue] = useState(1);
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const currentScaleRef = useRef(1);
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);
  const lastTapRef = useRef<number>(0);

  // Reset zoom & pan when image changes
  useEffect(() => {
    resetZoom();
  }, [uri]);

  const resetZoom = () => {
    currentScaleRef.current = 1;
    panOffsetRef.current = { x: 0, y: 0 };
    setScaleValue(1);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }),
    ]).start();
  };

  const applyZoom = (newScale: number) => {
    const clamped = Math.min(Math.max(1, newScale), 4.0);
    currentScaleRef.current = clamped;
    setScaleValue(Math.round(clamped * 10) / 10);

    if (clamped === 1) {
      panOffsetRef.current = { x: 0, y: 0 };
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.spring(scale, { toValue: clamped, useNativeDriver: true }).start();
    }
  };

  const getDistance = (touches: readonly any[]) => {
    const [t1, t2] = touches;
    const dx = t1.pageX - t2.pageX;
    const dy = t1.pageY - t2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          gestureState.numberActiveTouches === 2 ||
          (currentScaleRef.current > 1 &&
            (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2))
        );
      },
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        // Detect double tap
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          if (currentScaleRef.current > 1.2) {
            resetZoom();
          } else {
            applyZoom(2.5);
          }
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;

        if (evt.nativeEvent.touches.length === 2) {
          initialPinchDistRef.current = getDistance(evt.nativeEvent.touches);
          pinchStartScaleRef.current = currentScaleRef.current;
        } else {
          pan.setOffset({
            x: panOffsetRef.current.x,
            y: panOffsetRef.current.y,
          });
          pan.setValue({ x: 0, y: 0 });
        }
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Two-finger pinch
        if (evt.nativeEvent.touches.length === 2) {
          const currentDist = getDistance(evt.nativeEvent.touches);
          if (initialPinchDistRef.current) {
            const factor = currentDist / initialPinchDistRef.current;
            const newScale = Math.min(Math.max(1, pinchStartScaleRef.current * factor), 4.0);
            currentScaleRef.current = newScale;
            scale.setValue(newScale);
            setScaleValue(Math.round(newScale * 10) / 10);
          }
        } else if (currentScaleRef.current > 1) {
          // 1-finger pan with scale constraints
          const maxPanX = (SCREEN_WIDTH * (currentScaleRef.current - 1)) / 2;
          const maxPanY = (SCREEN_HEIGHT * 0.7 * (currentScaleRef.current - 1)) / 2;

          let targetX = panOffsetRef.current.x + gestureState.dx;
          let targetY = panOffsetRef.current.y + gestureState.dy;

          targetX = Math.max(-maxPanX, Math.min(maxPanX, targetX));
          targetY = Math.max(-maxPanY, Math.min(maxPanY, targetY));

          pan.setValue({
            x: targetX - panOffsetRef.current.x,
            y: targetY - panOffsetRef.current.y,
          });
        }
      },
      onPanResponderRelease: () => {
        initialPinchDistRef.current = null;
        if (currentScaleRef.current <= 1) {
          resetZoom();
        } else {
          pan.flattenOffset();
          // Extract current position
          // @ts-ignore
          const currentX = pan.x._value || 0;
          // @ts-ignore
          const currentY = pan.y._value || 0;
          panOffsetRef.current = { x: currentX, y: currentY };
        }
      },
    })
  ).current;

  return (
    <View style={styles.imageViewerWrapper}>
      <View style={styles.imageGestureArea} {...panResponder.panHandlers}>
        <Animated.Image
          source={{ uri }}
          style={[
            styles.image,
            {
              transform: [
                { scale },
                { translateX: pan.x },
                { translateY: pan.y },
              ],
            },
          ]}
          resizeMode="contain"
        />
      </View>

      {/* Floating Zoom Controls Toolbar */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          onPress={() => applyZoom(currentScaleRef.current - 0.5)}
          disabled={scaleValue <= 1}
          style={[styles.zoomBtn, scaleValue <= 1 && styles.zoomBtnDisabled]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="minus" size={20} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={resetZoom}
          style={styles.zoomLevelChip}
          activeOpacity={0.7}
        >
          <Text style={styles.zoomLevelText}>
            {Math.round(scaleValue * 100)}%
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => applyZoom(currentScaleRef.current + 0.5)}
          disabled={scaleValue >= 4}
          style={[styles.zoomBtn, scaleValue >= 4 && styles.zoomBtnDisabled]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
        </TouchableOpacity>

        {scaleValue > 1 && (
          <TouchableOpacity
            onPress={resetZoom}
            style={[styles.zoomBtn, styles.resetZoomBtn]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="restore" size={18} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function DocumentViewerModal({
  visible,
  documents,
  initialIndex = 0,
  onClose,
  onEdit,
  onDelete,
}: DocumentViewerModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) {
      const idx = Math.min(Math.max(0, initialIndex), Math.max(0, documents.length - 1));
      setCurrentIndex(idx);
    }
  }, [visible, initialIndex, documents.length]);

  if (!visible || documents.length === 0) {
    return null;
  }

  const currentDoc = documents[currentIndex] || documents[0];
  const isPdf =
    currentDoc.mimeType === 'application/pdf' ||
    currentDoc.fileUri.toLowerCase().endsWith('.pdf');

  const handleOpen = async () => {
    await openDocument(currentDoc.fileUri, currentDoc.title || 'Document');
  };

  const handleShare = async () => {
    await shareDocument(currentDoc.fileUri, currentDoc.title || 'Document');
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < documents.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const docTypeName = t(`documents.types.${currentDoc.type}`, {
    defaultValue: currentDoc.type,
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: '#121212' }]}
        edges={['top', 'bottom']}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.headerIconButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentDoc.title || docTypeName}
            </Text>
            <View style={styles.headerSubtitleRow}>
              <Chip
                compact
                style={styles.headerTypeChip}
                textStyle={styles.headerTypeChipText}
              >
                {docTypeName}
              </Chip>
              {documents.length > 1 && (
                <Text style={styles.pageCountText}>
                  {t('documents.pageOf', {
                    current: currentIndex + 1,
                    total: documents.length,
                  })}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.headerActions}>
            {/* Open / Preview Action */}
            <TouchableOpacity
              onPress={handleOpen}
              style={styles.headerIconButton}
              accessibilityLabel={t('documents.openDocument')}
            >
              <MaterialCommunityIcons name="open-in-new" size={22} color="#ffffff" />
            </TouchableOpacity>

            {onEdit && (
              <TouchableOpacity
                onPress={() => onEdit(currentDoc)}
                style={styles.headerIconButton}
              >
                <MaterialCommunityIcons name="pencil-outline" size={22} color="#ffffff" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={() => onDelete(currentDoc)}
                style={styles.headerIconButton}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={22} color="#ff6b6b" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleShare}
              style={styles.headerIconButton}
            >
              <MaterialCommunityIcons name="share-variant-outline" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Viewer */}
        <View style={styles.contentArea}>
          {isPdf ? (
            <View style={styles.pdfContainer}>
              <View style={styles.pdfCard}>
                <MaterialCommunityIcons
                  name="file-pdf-box"
                  size={88}
                  color="#EF5350"
                  style={styles.pdfIcon}
                />
                <Text style={styles.pdfTitle} numberOfLines={2}>
                  {currentDoc.title || 'PDF Document'}
                </Text>
                <Text style={styles.pdfHint}>
                  {docTypeName}
                </Text>

                {/* PDF Action Buttons: Open & Share */}
                <View style={styles.pdfActionsCol}>
                  <AppButton
                    variant="primary"
                    icon="open-in-new"
                    label={t('documents.openPdf')}
                    onPress={handleOpen}
                    fullWidth
                    style={styles.pdfBtn}
                  />
                  <AppButton
                    variant="outline"
                    icon="share-variant-outline"
                    label={t('documents.share')}
                    onPress={handleShare}
                    fullWidth
                    style={styles.pdfBtn}
                  />
                </View>
              </View>
            </View>
          ) : (
            <ZoomableImage uri={currentDoc.fileUri} />
          )}

          {/* Previous / Next Page Controls for Multi-Page */}
          {documents.length > 1 && (
            <>
              {currentIndex > 0 && (
                <TouchableOpacity
                  style={[styles.navArrow, styles.navArrowLeft]}
                  onPress={handlePrev}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="chevron-left" size={32} color="#ffffff" />
                </TouchableOpacity>
              )}
              {currentIndex < documents.length - 1 && (
                <TouchableOpacity
                  style={[styles.navArrow, styles.navArrowRight]}
                  onPress={handleNext}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="chevron-right" size={32} color="#ffffff" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Bottom Pagination Bar when multiple documents */}
        {documents.length > 1 && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              disabled={currentIndex === 0}
              onPress={handlePrev}
              style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={18}
                color={currentIndex === 0 ? '#666666' : '#ffffff'}
              />
              <Text
                style={[
                  styles.navButtonText,
                  { color: currentIndex === 0 ? '#666666' : '#ffffff' },
                ]}
              >
                {t('documents.prevPage')}
              </Text>
            </TouchableOpacity>

            <Text style={styles.bottomPageText}>
              {currentIndex + 1} / {documents.length}
            </Text>

            <TouchableOpacity
              disabled={currentIndex === documents.length - 1}
              onPress={handleNext}
              style={[
                styles.navButton,
                currentIndex === documents.length - 1 && styles.navButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.navButtonText,
                  { color: currentIndex === documents.length - 1 ? '#666666' : '#ffffff' },
                ]}
              >
                {t('documents.nextPage')}
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={18}
                color={currentIndex === documents.length - 1 ? '#666666' : '#ffffff'}
              />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333',
  },
  headerIconButton: {
    padding: Spacing.xs,
    marginHorizontal: 2,
  },
  headerTitleCol: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: '600',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: Spacing.xs,
  },
  headerTypeChip: {
    backgroundColor: '#2c2c2c',
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTypeChipText: {
    color: '#dddddd',
    fontSize: 10,
    marginVertical: 0,
    marginHorizontal: 0,
  },
  pageCountText: {
    color: '#888888',
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentArea: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageGestureArea: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.72,
  },
  zoomControls: {
    position: 'absolute',
    bottom: Spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#444444',
    gap: Spacing.xs,
    zIndex: 20,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: '#383838',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomBtnDisabled: {
    opacity: 0.35,
  },
  resetZoomBtn: {
    backgroundColor: '#555555',
  },
  zoomLevelChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  zoomLevelText: {
    color: '#ffffff',
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '700',
    minWidth: 44,
    textAlign: 'center',
  },
  pdfContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  pdfCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#333333',
  },
  pdfIcon: {
    marginBottom: Spacing.md,
  },
  pdfTitle: {
    color: '#ffffff',
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  pdfHint: {
    color: '#aaaaaa',
    fontSize: Typography.bodyMedium.fontSize,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  pdfActionsCol: {
    width: '100%',
    gap: Spacing.sm,
  },
  pdfBtn: {
    width: '100%',
  },
  navArrow: {
    position: 'absolute',
    top: '48%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  navArrowLeft: {
    left: Spacing.sm,
  },
  navArrowRight: {
    right: Spacing.sm,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333333',
    backgroundColor: '#181818',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    gap: 4,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontWeight: '500',
  },
  bottomPageText: {
    color: '#ffffff',
    fontSize: Typography.labelLarge.fontSize,
    fontWeight: '600',
  },
});
