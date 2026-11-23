import { Paths, Directory, File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Share, Platform, Alert, Linking } from 'react-native';
import { generateId } from '../utils/id';
import type { AssetDocument, DocumentType } from '../types/models';

// Safe require for expo-sharing in case native module is missing in some environments
let cachedSharing: any = undefined;
function getSharingModule(): any {
  if (cachedSharing !== undefined) return cachedSharing;
  try {
    cachedSharing = require('expo-sharing');
    return cachedSharing;
  } catch {
    cachedSharing = null;
    return null;
  }
}

/**
 * Returns the permanent private directory URI for storing documents.
 */
export function getDocumentsDirectory(): string {
  try {
    if (Paths && Paths.document && Paths.document.uri) {
      const u = Paths.document.uri;
      return u.endsWith('/') ? `${u}documents/` : `${u}/documents/`;
    }
  } catch {}

  if (FileSystem.documentDirectory) {
    const d = FileSystem.documentDirectory;
    return d.endsWith('/') ? `${d}documents/` : `${d}/documents/`;
  }

  try {
    if (Paths && Paths.cache && Paths.cache.uri) {
      const u = Paths.cache.uri;
      return u.endsWith('/') ? `${u}documents/` : `${u}/documents/`;
    }
  } catch {}

  return `${FileSystem.cacheDirectory || ''}documents/`;
}

/**
 * Ensures the private documents directory exists.
 */
export async function ensureDocumentsDirectory(): Promise<string> {
  const dirUri = getDocumentsDirectory();

  // Try modern Directory first
  try {
    const dir = new Directory(dirUri);
    if (!dir.exists) {
      dir.create({ idempotent: true });
    }
    return dirUri;
  } catch {}

  // Fallback to legacy makeDirectoryAsync
  try {
    const info = await FileSystem.getInfoAsync(dirUri);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
    }
  } catch (e) {
    console.warn('ensureDocumentsDirectory fallback warning:', e);
  }

  return dirUri;
}

/**
 * Copies a source file (from camera/gallery/cache/picker) into the app's
 * permanent private storage, keeping the original file untouched.
 */
export async function saveFileToPrivateStorage(
  sourceUri: string,
  preferredExtension?: string
): Promise<string> {
  const dir = await ensureDocumentsDirectory();

  // Extract extension from URI or fallback
  let ext = preferredExtension;
  if (!ext) {
    const parts = sourceUri.split('.');
    ext = parts.length > 1 ? parts.pop()?.split('?')[0] : 'pdf';
  }
  ext = ext?.toLowerCase() || 'pdf';

  const filename = `${generateId('doc')}.${ext}`;
  const destUri = dir.endsWith('/') ? `${dir}${filename}` : `${dir}/${filename}`;

  // Method 1: Modern SDK 58 File.copy
  try {
    const srcFile = new File(sourceUri);
    const dstFile = new File(destUri);
    await srcFile.copy(dstFile);
    return destUri;
  } catch (errModern) {
    // Method 2: Legacy FileSystem.copyAsync
    try {
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destUri,
      });
      return destUri;
    } catch (errLegacy) {
      // Method 3: Read and write base64 (bulletproof for Android content:// and virtual URIs)
      try {
        const base64 = await FileSystem.readAsStringAsync(sourceUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await FileSystem.writeAsStringAsync(destUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return destUri;
      } catch (errBase64) {
        console.warn('All file copy methods failed, using sourceUri fallback:', {
          errModern,
          errLegacy,
          errBase64,
        });
        return sourceUri;
      }
    }
  }
}

/**
 * Deletes a file from the app's private storage.
 */
export async function deleteFileFromPrivateStorage(fileUri: string): Promise<void> {
  try {
    const file = new File(fileUri);
    if (file.exists) {
      file.delete();
      return;
    }
  } catch {}

  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  } catch (e) {
    console.warn('Error deleting file from storage:', e);
  }
}

/**
 * Opens / previews a document with the system's native viewer.
 * On iOS: Quick Look or PDF viewer.
 * On Android: ACTION_VIEW or system reader.
 */
export async function openDocument(
  fileUri: string,
  title: string = 'Asset Document'
): Promise<boolean> {
  // 1. Try modern SDK 58 File.preview
  try {
    const file = new File(fileUri);
    if (file && (await file.canPreview())) {
      await file.preview({ title });
      return true;
    }
  } catch (e) {
    // continue to next method
  }

  // 2. Try expo-sharing shareAsync (handles open/view with system apps)
  const sharing = getSharingModule();
  if (sharing && sharing.isAvailableAsync) {
    try {
      const isAvailable = await sharing.isAvailableAsync();
      if (isAvailable) {
        await sharing.shareAsync(fileUri, {
          dialogTitle: title,
          mimeType: fileUri.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          UTI: fileUri.toLowerCase().endsWith('.pdf') ? 'com.adobe.pdf' : 'public.jpeg',
        });
        return true;
      }
    } catch (e) {
      console.warn('expo-sharing failed for openDocument:', e);
    }
  }

  // 3. Fallback to Linking.openURL
  try {
    const canOpen = await Linking.canOpenURL(fileUri);
    if (canOpen) {
      await Linking.openURL(fileUri);
      return true;
    }
  } catch {}

  // 4. Fallback to Share.share
  try {
    await Share.share({ title, url: fileUri });
    return true;
  } catch (e) {
    console.error('All open/view options failed:', e);
    return false;
  }
}

/**
 * Shares a document via system Share sheet.
 */
export async function shareDocument(
  fileUri: string,
  title: string = 'Asset Document'
): Promise<void> {
  const sharing = getSharingModule();
  if (sharing && sharing.isAvailableAsync) {
    try {
      const isAvailable = await sharing.isAvailableAsync();
      if (isAvailable) {
        await sharing.shareAsync(fileUri, {
          dialogTitle: title,
          mimeType: fileUri.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          UTI: fileUri.toLowerCase().endsWith('.pdf') ? 'com.adobe.pdf' : 'public.jpeg',
        });
        return;
      }
    } catch (e) {
      console.warn('expo-sharing failed, falling back to Share.share:', e);
    }
  }

  // Fallback to React Native's Share API
  try {
    await Share.share({
      title,
      url: fileUri,
    });
  } catch (e) {
    console.error('Share failed:', e);
  }
}

// ── Permission Helpers ───────────────────────────────────────────────────────

export async function requestCameraAccess(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === ImagePicker.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}

export async function checkCameraAccess(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    return status === ImagePicker.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}

export async function requestGalleryAccess(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === ImagePicker.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}

// ── Document Pickers ─────────────────────────────────────────────────────────

export interface PickedDocumentResult {
  uri: string;
  name: string;
  mimeType: string;
}

/**
 * Picks images from the device photo gallery.
 */
export async function pickImagesFromGallery(
  allowsMultiple: boolean = true
): Promise<PickedDocumentResult[]> {
  const hasPermission = await requestGalleryAccess();
  if (!hasPermission) {
    throw new Error('PERMISSION_DENIED');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: allowsMultiple,
    quality: 0.9,
  });

  if (result.canceled || !result.assets) {
    return [];
  }

  const results: PickedDocumentResult[] = [];
  for (const asset of result.assets) {
    const savedUri = await saveFileToPrivateStorage(asset.uri, 'jpg');
    results.push({
      uri: savedUri,
      name: asset.fileName || `Photo-${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
    });
  }

  return results;
}

/**
 * Picks documents (PDFs or Images) from the file system.
 */
export async function pickDocumentsFromFiles(
  allowsMultiple: boolean = true
): Promise<PickedDocumentResult[]> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      multiple: allowsMultiple,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets) {
      return [];
    }

    const results: PickedDocumentResult[] = [];
    for (const asset of result.assets) {
      const ext = asset.name?.split('.').pop() || (asset.mimeType === 'application/pdf' ? 'pdf' : 'jpg');
      const savedUri = await saveFileToPrivateStorage(asset.uri, ext);
      results.push({
        uri: savedUri,
        name: asset.name || `Document-${Date.now()}.${ext}`,
        mimeType: asset.mimeType || (ext === 'pdf' ? 'application/pdf' : 'image/jpeg'),
      });
    }

    return results;
  } catch (e: any) {
    if (e.message?.includes('cancelled')) return [];
    console.error('pickDocumentsFromFiles error:', e);
    return [];
  }
}

/**
 * Launches the camera to capture a photo with edge/crop adjustment.
 */
export async function capturePhotoFromCamera(
  allowsEditing: boolean = true
): Promise<PickedDocumentResult | null> {
  const hasPermission = await requestCameraAccess();
  if (!hasPermission) {
    throw new Error('CAMERA_PERMISSION_DENIED');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing,
    quality: 0.9,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const savedUri = await saveFileToPrivateStorage(asset.uri, 'jpg');

  return {
    uri: savedUri,
    name: asset.fileName || `Scan-${Date.now()}.jpg`,
    mimeType: asset.mimeType || 'image/jpeg',
  };
}
