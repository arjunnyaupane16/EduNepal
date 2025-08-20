import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';

const DOWNLOADS_DIR = FileSystem.documentDirectory + 'downloads/';

export default function Downloads() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState(new Set()); // of uri

  const ensureDir = useCallback(async () => {
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
    }
  }, []);

  const loadFiles = useCallback(async () => {
    try {
      await ensureDir();
      const names = await FileSystem.readDirectoryAsync(DOWNLOADS_DIR);
      const infoPromises = names.map(async (name) => {
        const uri = DOWNLOADS_DIR + name;
        const info = await FileSystem.getInfoAsync(uri, { size: true });
        return {
          name,
          uri,
          size: info.size || 0,
          mtime: info.modificationTime || 0,
          ext: name.split('.').pop()?.toLowerCase() || '',
        };
      });
      const results = await Promise.all(infoPromises);
      // Sort by modification time desc
      results.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
      setFiles(results);
    } catch (e) {
      console.error('Failed to load downloads:', e);
      Alert.alert(t('error') || 'Error', t('unableToLoadDownloads') || 'Unable to load downloads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ensureDir]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFiles();
  }, [loadFiles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, query]);

  const isSelected = (uri) => selected.has(uri);
  const toggleSelect = (uri) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uri)) next.delete(uri); else next.add(uri);
      return next;
    });
  };
  const enterSelectionMode = (uri) => {
    setSelectionMode(true);
    if (uri) setSelected(new Set([uri]));
  };
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelected(new Set());
  };
  const selectAll = () => {
    setSelectionMode(true);
    setSelected(new Set(filtered.map((f) => f.uri)));
  };
  const clearSelection = () => setSelected(new Set());

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const val = bytes / Math.pow(1024, i);
    return `${val.toFixed(1)} ${sizes[i]}`;
  };

  const iconForExt = (ext) => {
    switch (ext) {
      case 'pdf':
        return <MaterialIcons name="picture-as-pdf" size={28} color={theme.primary} />;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <Ionicons name="image-outline" size={28} color={theme.primary} />;
      case 'mp4':
      case 'mov':
        return <Ionicons name="videocam-outline" size={28} color={theme.primary} />;
      default:
        return <Ionicons name="document-outline" size={28} color={theme.primary} />;
    }
  };

  const handleShare = async (uri) => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t('sharingNotAvailable'));
        return;
      }
      await Sharing.shareAsync(uri);
    } catch (e) {
      console.error('Share failed', e);
      Alert.alert(t('error') || 'Error', t('failedToShareFile') || 'Failed to share file');
    }
  };

  const handleDelete = async (item) => {
    Alert.alert(t('deleteSelectedConfirmTitle'), `${t('delete')} ${item.name}?`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await FileSystem.deleteAsync(item.uri, { idempotent: true });
            setFiles((prev) => prev.filter((f) => f.uri !== item.uri));
          } catch (e) {
            console.error('Delete failed', e);
            Alert.alert(t('error') || 'Error', t('failedToDeleteFile') || 'Failed to delete file');
          }
        },
      },
    ]);
  };

  const handleDeleteSelected = async () => {
    const items = files.filter((f) => selected.has(f.uri));
    if (items.length === 0) return;
    Alert.alert(t('deleteSelectedConfirmTitle'), t('deleteSelectedConfirmMsg'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await Promise.all(items.map((it) => FileSystem.deleteAsync(it.uri, { idempotent: true })));
            setFiles((prev) => prev.filter((f) => !selected.has(f.uri)));
            exitSelectionMode();
          } catch (e) {
            console.error('Bulk delete failed', e);
            Alert.alert(t('error') || 'Error', t('failedToDeleteSomeFiles') || 'Failed to delete some files');
          }
        },
      },
    ]);
  };

  const handleClearAll = async () => {
    if (files.length === 0) return;
    Alert.alert(t('clearAllConfirmTitle'), t('clearAllConfirmMsg'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('clearAll'),
        style: 'destructive',
        onPress: async () => {
          try {
            await Promise.all(files.map((it) => FileSystem.deleteAsync(it.uri, { idempotent: true })));
            setFiles([]);
            exitSelectionMode();
          } catch (e) {
            console.error('Clear all failed', e);
            Alert.alert(t('error') || 'Error', t('failedToClearAll') || 'Failed to clear all files');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => enterSelectionMode(item.uri)}
      onPress={() => {
        if (selectionMode) toggleSelect(item.uri);
      }}
      style={[styles.row, { backgroundColor: theme.card }]}
    > 
      <View style={styles.rowLeft}>
        <TouchableOpacity
          onPress={() => {
            if (!selectionMode) enterSelectionMode(item.uri); else toggleSelect(item.uri);
          }}
          style={[styles.checkbox, { borderColor: isSelected(item.uri) ? theme.primary : theme.subtext, backgroundColor: isSelected(item.uri) ? theme.primary : 'transparent' }]}
        >
          {isSelected(item.uri) && <Ionicons name="checkmark" size={16} color="#fff" />}
        </TouchableOpacity>
        {iconForExt(item.ext)}
        <View style={styles.meta}>
          <Text numberOfLines={1} style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.sub, { color: theme.subtext }]}>{formatBytes(item.size)}</Text>
        </View>
      </View>
      {!selectionMode && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleShare(item.uri)} style={[styles.iconButton, { borderColor: theme.primary }]}> 
            <Ionicons name="share-social-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.iconButton, { borderColor: '#ef4444' }]}> 
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}> 
        <ActivityIndicator color={theme.primary} />
        <Text style={{ color: theme.text, marginTop: 8 }}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={[styles.toolbar, { backgroundColor: theme.card, borderColor: theme.placeholder }]}> 
        {selectionMode ? (
          <>
            <Text style={[styles.toolbarText, { color: theme.text }]}>{selected.size} {t('selected')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={selectAll} style={[styles.toolbarBtn, { borderColor: theme.primary }]}> 
                <Ionicons name="checkmark-done-outline" size={18} color={theme.primary} />
                <Text style={[styles.toolbarBtnText, { color: theme.primary }]}>{t('selectAll')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearSelection} style={[styles.toolbarBtn, { borderColor: theme.subtext }]}> 
                <Ionicons name="close-outline" size={18} color={theme.subtext} />
                <Text style={[styles.toolbarBtnText, { color: theme.subtext }]}>{t('clear')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteSelected} style={[styles.toolbarBtn, { borderColor: '#ef4444' }]}> 
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                <Text style={[styles.toolbarBtnText, { color: '#ef4444' }]}>{t('delete')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={exitSelectionMode} style={[styles.toolbarBtn, { borderColor: theme.subtext }]}> 
                <Ionicons name="exit-outline" size={18} color={theme.subtext} />
                <Text style={[styles.toolbarBtnText, { color: theme.subtext }]}>{t('done')}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.toolbarText, { color: theme.text }]}>{t('downloads')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={enterSelectionMode} style={[styles.toolbarBtn, { borderColor: theme.primary }]}> 
                <Ionicons name="checkbox-outline" size={18} color={theme.primary} />
                <Text style={[styles.toolbarBtnText, { color: theme.primary }]}>{t('select')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClearAll} style={[styles.toolbarBtn, { borderColor: '#ef4444' }]}> 
                <Ionicons name="trash-bin-outline" size={18} color="#ef4444" />
                <Text style={[styles.toolbarBtnText, { color: '#ef4444' }]}>{t('clearAll')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      <View style={[styles.searchBar, { borderColor: theme.placeholder }]}> 
        <Ionicons name="search-outline" size={18} color={theme.subtext} />
        <TextInput
          placeholder={t('searchBooksNotes')}
          placeholderTextColor={theme.subtext}
          value={query}
          onChangeText={setQuery}
          style={[styles.input, { color: theme.text }]}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-download-outline" size={56} color={theme.subtext} />
          <Text style={{ color: theme.subtext, marginTop: 8 }}>{t('noDownloadsYet')}</Text>
          <Text style={{ color: theme.subtext, marginTop: 2, textAlign: 'center' }}>{t('downloadsAppearHere')}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.uri}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: 36,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  sub: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  toolbarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 10,
  },
  toolbarBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
