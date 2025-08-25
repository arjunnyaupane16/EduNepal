import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BottomNavBar from '../../../components/BottomNavBar';
import baseStyles from '../../../styles/ClassScreenStyles';
import { useTheme } from '../../context/ThemeContext';
import { getSupabase } from '../../services/supabaseClient';

// Extend the base styles with our custom styles
const styles = StyleSheet.create({
  ...baseStyles,
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  downloadText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
});
const supabase = getSupabase();

const DOWNLOADED_FILES_KEY = '@downloaded_files';
const CACHE_DURATION = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB max cache size
const MEMORY_CACHE = new Map(); // In-memory cache for better performance

// Directory where files will be saved
const DOWNLOAD_DIR = FileSystem.documentDirectory + 'downloads/';

// Web-compatible directory check
const ensureDirExists = async () => {
  if (Platform.OS === 'web') {
    return; // No directory operations on web
  }

  try {
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
    } else {
      // Clean up old files if cache is too large
      const files = await FileSystem.readDirectoryAsync(DOWNLOAD_DIR);
      let totalSize = 0;
      const fileStats = [];
      const now = Date.now();

      for (const file of files) {
        try {
          const filePath = `${DOWNLOAD_DIR}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);

          if (fileInfo.exists && fileInfo.size) {
            // Check if file is too old
            const fileAge = now - (fileInfo.modificationTime || 0);
            if (fileAge > CACHE_DURATION) {
              await FileSystem.deleteAsync(filePath, { idempotent: true });
              const cacheKey = `@file_cache_${file}`;
              await AsyncStorage.removeItem(cacheKey);
              MEMORY_CACHE.delete(cacheKey);
              continue;
            }

            totalSize += fileInfo.size;
            fileStats.push({
              uri: fileInfo.uri,
              size: fileInfo.size,
              modificationTime: fileInfo.modificationTime || 0
            });
          }
        } catch (error) {
          console.warn(`Error processing file ${file}:`, error);
        }
      }

      // If cache still exceeds max size, delete oldest files first
      if (totalSize > MAX_CACHE_SIZE) {
        // Sort by modification time (oldest first)
        fileStats.sort((a, b) => a.modificationTime - b.modificationTime);

        for (const file of fileStats) {
          if (totalSize <= MAX_CACHE_SIZE * 0.9) break; // Stop when we've cleared enough
          try {
            await FileSystem.deleteAsync(file.uri, { idempotent: true });
            totalSize -= file.size;
            const cacheKey = `@file_cache_${file.uri.split('/').pop()}`;
            await AsyncStorage.removeItem(cacheKey);
            MEMORY_CACHE.delete(cacheKey);
          } catch (error) {
            console.warn(`Error deleting file ${file.uri}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error managing cache:', error);
  }
};

// Get file extension from URL or path
const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

// Get MIME type from file extension
const getMimeType = (extension) => {
  const types = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'zip': 'application/zip'
  };
  return types[extension] || 'application/octet-stream';
};

// In-memory cache for downloaded files status
const fileStatusCache = new Map();

// Check if a file exists and is valid
const checkExistingFile = async (fileName) => {
  try {
    if (!fileName) return null;

    const filePath = `${DOWNLOAD_DIR}${fileName}`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);

    if (!fileInfo.exists) {
      return null;
    }

    // Verify file integrity
    const isValid = await checkFileIntegrity(filePath);
    if (!isValid) {
      await FileSystem.deleteAsync(filePath, { idempotent: true });
      return null;
    }

    return {
      uri: filePath,
      fileName,
      size: fileInfo.size,
      mimeType: getMimeType(getFileExtension(fileName)),
      lastModified: (await FileSystem.getInfoAsync(filePath, { md5: true })).modificationTime
    };
  } catch (error) {
    console.warn('Error checking existing file:', error);
    return null;
  }
};

// Function to get all cached files at once
const getCachedFiles = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const fileKeys = allKeys.filter(key => key.startsWith('@file_cache_'));
    const cacheItems = await AsyncStorage.multiGet(fileKeys);

    const files = [];
    for (const [key, value] of cacheItems) {
      if (value) {
        const cacheData = JSON.parse(value);
        if (cacheData.expiry > Date.now()) {
          files.push({
            ...cacheData,
            fileName: key.replace('@file_cache_', '')
          });
        } else {
          // Clean up expired cache
          await AsyncStorage.removeItem(key);
        }
      }
    }
    return files;
  } catch (error) {
    console.error('Error getting cached files:', error);
    return [];
  }
};

// Function to get a signed URL for a file with improved caching and retry logic
const getSignedUrl = async (filePath, bucket = 'ArjunNyaupane', retries = 2) => {
  const cacheKey = `signed_url_${filePath}`;

  try {
    // Check memory cache first
    if (fileStatusCache.has(cacheKey)) {
      const { url, expiry } = fileStatusCache.get(cacheKey);
      if (expiry > Date.now()) {
        return url;
      }
      // Remove expired entry
      fileStatusCache.delete(cacheKey);
    }

    // Check persistent cache
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { url, expiry } = JSON.parse(cached);
      if (expiry > Date.now()) {
        // Update memory cache
        fileStatusCache.set(cacheKey, { url, expiry });
        return url;
      }
    }

    // Get a new signed URL with retry logic
    let lastError;
    for (let i = 0; i <= retries; i++) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (error) throw error;
        if (!data?.signedUrl) throw new Error('No URL returned');

        // Cache in memory and persistent storage
        const expiry = Date.now() + (55 * 60 * 1000); // 55 minutes
        const cacheData = { url: data.signedUrl, expiry };

        fileStatusCache.set(cacheKey, cacheData);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));

        return data.signedUrl;
      } catch (error) {
        lastError = error;
        if (i < retries) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
    }

    throw lastError || new Error('Failed to get signed URL');
  } catch (error) {
    console.warn('Error getting signed URL for', filePath, error);
    // Return direct URL as fallback if signed URL fails
    return `${supabase.storage.url}/object/public/${bucket}/${encodeURIComponent(filePath)}`;
  }
};

// Function to check if file exists and is complete
const checkFileIntegrity = async (fileUri, expectedSize) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) return false;

    // If we have an expected size, verify it
    if (expectedSize && fileInfo.size !== expectedSize) {
      console.log(`File size mismatch: expected ${expectedSize}, got ${fileInfo.size}`);
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Error checking file integrity:', error);
    return false;
  }
};

// Function to download and save file to device storage with resumable downloads and retry logic
const downloadFile = async (filePath, fileName, maxRetries = 3) => {
  let retryCount = 0;
  let lastError = null;

  const downloadWithRetry = async () => {
    let downloadResumable = null;
    const localUri = `${DOWNLOAD_DIR}${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const tempUri = `${localUri}.download`;

    try {
      await ensureDirExists();

      // Check if file already exists and is valid
      const existingFile = await checkExistingFile(fileName);
      if (existingFile) {
        const isValid = await checkFileIntegrity(existingFile.uri, existingFile.size);
        if (isValid) {
          console.log('Using existing valid file:', existingFile.uri);
          return {
            success: true,
            ...existingFile,
            cached: true,
            message: 'Using cached version'
          };
        }
      }

      // Get file extension and MIME type
      const extension = getFileExtension(fileName);
      const mimeType = getMimeType(extension);

      // Get signed URL with retry logic
      const signedUrl = await getSignedUrl(filePath);
      if (!signedUrl) throw new Error('Could not get download URL');

      // Create a resumable download
      downloadResumable = FileSystem.createDownloadResumable(
        signedUrl,
        tempUri,
        {
          headers: {
            'Cache-Control': 'max-age=31536000, immutable',
            'Accept-Ranges': 'bytes'
          },
          resumable: true,
          timeout: 60000 // 60 seconds timeout
        },
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          const cacheKey = `@download_progress_${fileName}`;
          fileStatusCache.set(cacheKey, {
            progress,
            bytesWritten: downloadProgress.totalBytesWritten,
            totalBytes: downloadProgress.totalBytesExpectedToWrite,
            lastUpdated: Date.now()
          });
        }
      );

      // Start the download
      const { uri, status } = await downloadResumable.downloadAsync();

      if (status !== 200) {
        throw new Error(`Download failed with status ${status}`);
      }

      // Verify the downloaded file
      const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
      if (!fileInfo.exists || fileInfo.size === 0) {
        throw new Error('Downloaded file is empty or corrupted');
      }

      // Rename temp file to final name
      const finalUri = `${DOWNLOAD_DIR}${fileName}`;
      await FileSystem.moveAsync({ from: tempUri, to: finalUri });

      // Save download record
      await saveDownloadedFile(fileName, finalUri);

      return {
        success: true,
        uri: finalUri,
        fileName,
        size: fileInfo.size,
        mimeType,
        message: 'File downloaded successfully'
      };

    } catch (error) {
      // Clean up any partial downloads
      try {
        if (downloadResumable) {
          await downloadResumable.cancelAsync();
        }
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
      } catch (cleanupError) {
        console.warn('Error during cleanup:', cleanupError);
      }

      lastError = error;
      console.error(`Download attempt ${retryCount + 1} failed:`, error);

      if (retryCount < maxRetries) {
        retryCount++;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return downloadWithRetry();
      }

      throw error;
    }
  };

  try {
    return await downloadWithRetry();
  } catch (error) {
    // Final fallback to cached version if available
    const existingFile = await checkExistingFile(fileName);
    if (existingFile) {
      console.log('Falling back to cached version after download failure');
      return {
        success: true,
        ...existingFile,
        fromCache: true,
        message: 'Using cached version after download failure'
      };
    }

    return {
      success: false,
      error: lastError?.message || 'Download failed',
      code: lastError?.code || 'UNKNOWN_ERROR',
      retryCount
    };
  }
};

// Save downloaded file info to AsyncStorage with enhanced error handling
const saveDownloadedFile = async (fileName, fileUri) => {
  try {
    if (!fileName || !fileUri) {
      throw new Error('Invalid file name or URI');
    }

    const files = await getDownloadedFiles();
    const existingIndex = files.findIndex(f => f.fileName === fileName);

    const fileInfo = {
      fileName,
      uri: fileUri,
      timestamp: Date.now(),
      size: 0,
      lastModified: Date.now()
    };

    try {
      // Get file info for size
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists && fileInfo.size) {
        fileInfo.size = fileInfo.size;
        fileInfo.lastModified = fileInfo.modificationTime || Date.now();
      }
    } catch (e) {
      console.warn('Could not get file info:', e);
    }

    if (existingIndex >= 0) {
      files[existingIndex] = fileInfo;
    } else {
      files.push(fileInfo);
    }

    // Limit the number of files to keep in history
    const MAX_FILES = 100;
    const sortedFiles = files
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, MAX_FILES);

    await AsyncStorage.setItem(DOWNLOADED_FILES_KEY, JSON.stringify(sortedFiles));

    // Clear the list cache
    MEMORY_CACHE.delete('downloaded_files_list');

    return true;
  } catch (error) {
    console.error('Error saving downloaded file info:', error);
    return false;
  }
};

// Function to get all downloaded files with caching
const getDownloadedFiles = async () => {
  try {
    // Check memory cache first
    const cacheKey = 'downloaded_files_list';
    if (MEMORY_CACHE.has(cacheKey)) {
      return MEMORY_CACHE.get(cacheKey);
    }

    const jsonValue = await AsyncStorage.getItem(DOWNLOADED_FILES_KEY);
    const result = jsonValue != null ? JSON.parse(jsonValue) : [];

    // Update memory cache
    MEMORY_CACHE.set(cacheKey, result);

    return result;
  } catch (e) {
    console.error('Error reading downloaded files:', e);
    return [];
  }
};

// Delete a downloaded file
const deleteFile = async (fileUri) => {
  try {
    // Delete the local file
    await FileSystem.deleteAsync(fileUri, { idempotent: true });

    // Remove from downloaded files list
    const downloadedFiles = await getDownloadedFiles();
    const fileToDelete = downloadedFiles.find(f => f.uri === fileUri);

    if (fileToDelete) {
      const updatedFiles = downloadedFiles.filter(f => f.uri !== fileUri);
      await AsyncStorage.setItem(DOWNLOADED_FILES_KEY, JSON.stringify(updatedFiles));
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
};

// Open a file with the device's default app
const openFile = async (fileUri, mimeType) => {
  try {
    if (Platform.OS === 'android') {
      // On Android, we need to get a content URI
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: mimeType,
      });
    } else {
      // On iOS, we can use Sharing API
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: 'Open with',
        UTI: mimeType
      });
    }
    return { success: true };
  } catch (error) {
    console.error('Error opening file:', error);
    return { success: false, error: error.message };
  }
};

// List all downloaded files
const listDownloadedFiles = async () => {
  if (Platform.OS === 'web') {
    return []; // Return empty array for web as we don't have file system access
  }

  try {
    await ensureDirExists();
    const files = await FileSystem.readDirectoryAsync(DOWNLOAD_DIR);
    return files.map(file => ({
      name: file,
      uri: `${DOWNLOAD_DIR}${file}`,
      size: 0, // Will be updated in the next step
      mimeType: getMimeType(getFileExtension(file))
    }));
  } catch (error) {
    console.error('Error listing downloaded files:', error);
    return [];
  }
};

export default function Guidebooks() {
  const theme = useTheme();
  const [downloadedFiles, setDownloadedFiles] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [cachedFiles, setCachedFiles] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Load downloaded files and cache status on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      const [files, cached] = await Promise.all([
        getDownloadedFiles(),
        getCachedFiles()
      ]);

      const cachedMap = {};
      cached.forEach(file => {
        cachedMap[file.fileName] = true;
      });

      setDownloadedFiles(files);
      setCachedFiles(cachedMap);
    };

    loadInitialData();
  }, []);

  const handleDownload = async (fileUrl, fileName) => {
    // For web, open the file in a new tab
    if (Platform.OS === 'web') {
      window.open(fileUrl, '_blank');
      return { success: true, fromCache: false };
    }

    // For mobile, check local storage
    const localPath = `${FileSystem.documentDirectory}${fileName}`;
    const fileInfo = await FileSystem.getInfoAsync(localPath);

    // If file exists and is valid, return immediately
    if (fileInfo.exists && fileInfo.size > 0) {
      console.log('File already exists locally');
      return { success: true, fromCache: true, uri: localPath };
    }

    // Check in-memory cache for mobile
    if (cachedFiles[fileName]) {
      console.log('File in memory cache');
      return { success: true, fromCache: true };
    }

    try {
      setIsDownloading(true);

      // On web, we've already handled the download by opening in a new tab
      if (Platform.OS === 'web') {
        return { success: true, fromCache: false };
      }

      // For mobile, proceed with file download
      const cacheBuster = `?v=${Math.floor(Date.now() / (1000 * 60 * 60 * 24))}`; // Cache for 1 day
      const result = await downloadFile(fileUrl + cacheBuster, fileName);

      if (result.success) {
        // Update cache
        const newCachedFiles = { ...cachedFiles, [fileName]: true };
        setCachedFiles(newCachedFiles);

        if (!result.fromCache) {
          console.log('File downloaded successfully');
        }
        return result;
      }
      throw new Error(result.error || 'Download failed');

    } catch (error) {
      console.error('Download error:', error);
      return {
        success: false,
        error: 'Download failed. Please check your connection and try again.',
        fromCache: false
      };
    } finally {
      setIsDownloading(false);
    }
  };

  const subjects = [
    {
      title: 'English',
      description: 'Complete notes and grammar solutions',
      color: '#dbeafe',
      icon: 'menu-book',
      route: 'english',
      downloadUrl: 'https://yoursupabaseurl.com/storage/v1/object/public/ArjunNyaupane/english-guide.pdf',
      fileName: 'english-guide.pdf'
    },
    {
      title: 'नेपाली',
      description: 'पाठ अनुसार व्याख्या र अभ्यास',
      color: '#fef9c3',
      icon: 'language',
      route: 'nepali',
      downloadUrl: 'https://yoursupabaseurl.com/storage/v1/object/public/ArjunNyaupane/nepali-guide.pdf',
      fileName: 'nepali-guide.pdf'
    },
    {
      title: 'Social',
      description: 'Key points and explanation',
      color: '#ede9fe',
      icon: 'public',
      route: 'social',
      downloadUrl: 'https://yoursupabaseurl.com/storage/v1/object/public/ArjunNyaupane/social-guide.pdf',
      fileName: 'social-guide.pdf'
    },
    {
      title: 'Math',
      description: 'Solutions, formulas and examples',
      color: '#dcfce7',
      icon: 'calculate',
      route: 'math',
      downloadUrl: 'https://yoursupabaseurl.com/storage/v1/object/public/ArjunNyaupane/math-guide.pdf',
      fileName: 'math-guide.pdf'
    },
  ];

  const filteredSubjects = subjects.filter((s) => {
    if (!searchQuery) return true; // Return all subjects if search is empty
    return (
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.title === 'नेपाली' && 'नेपाली'.includes(searchQuery)) // allows searching for Nepali
    );
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, {
        backgroundColor: theme.cardBackground,
        borderBottomColor: theme.border
      }]}>
        <Text style={[styles.appTitle, { color: theme.text }]}>Guidebooks</Text>
        <View style={styles.rightIcons}>
          <MaterialIcons name="notifications-none" size={24} color={theme.text} />
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>AN</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, {
        backgroundColor: theme.cardBackground,
        borderColor: theme.border
      }]}>
        <MaterialIcons name="search" size={20} color={theme.placeholder} />
        <TextInput
          placeholder="Search subjects..."
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[
            styles.searchInput,
            {
              color: theme.text,
              backgroundColor: theme.searchBackground || theme.cardBackground
            }
          ]}
        />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.grid}>
          {filteredSubjects.map((subject, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                  shadowColor: theme.primary,
                  elevation: 2
                }
              ]}
              onPress={() => router.push(`/classes/class10/guidebooks/${subject.route}`)}
            >
              <View style={[styles.iconWrapper, {
                backgroundColor: subject.color,
                opacity: 0.9
              }]}>
                <MaterialIcons name={subject.icon} size={20} color={theme.text} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>{subject.title}</Text>
              <Text style={[styles.subtitle, { color: theme.secondaryText }]}>{subject.description}</Text>
              <View style={[styles.cardFooter, { justifyContent: 'flex-end' }]}>
                <View style={{
                  backgroundColor: theme.iconBackground || theme.primary + '20',
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <MaterialIcons
                    name="chevron-right"
                    size={16}
                    color={theme.primary}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <BottomNavBar active="home" />
    </View>
  );
}
