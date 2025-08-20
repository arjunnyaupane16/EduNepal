import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { listContent, createContent, updateContent, deleteContent } from '../services/supabaseContent';
import { getOrDownload } from '../utils/fileCache';

// Content manager backed by Supabase. Add by entering Title + URL; later we can add upload UI.
export default function ContentManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('PDF'); // PDF/Notes/etc.

  const load = async () => {
    setLoading(true);
    try {
      const data = await listContent();
      if (Array.isArray(data)) setItems(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load content from Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onAdd = async () => {
    if (!title.trim() || !url.trim()) return;
    const id = `content-${Date.now()}`;
    const item = { id, type, title: title.trim(), url: url.trim(), status: 'Draft' };
    setItems(prev => [item, ...prev]);
    setTitle('');
    setUrl('');
    try {
      await createContent(item);
    } catch (e) {
      Alert.alert('Error', 'Failed to add content to Supabase');
      // rollback UI
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const onToggleStatus = async (i) => {
    const next = i.status === 'Draft' ? 'Published' : 'Draft';
    setItems(prev => prev.map(x => x.id === i.id ? { ...x, status: next } : x));
    try {
      await updateContent(i.id, { status: next });
    } catch (e) {
      // rollback
      setItems(prev => prev.map(x => x.id === i.id ? { ...x, status: i.status } : x));
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const onRemove = (i) => {
    Alert.alert('Remove Content', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        const snapshot = items;
        setItems(prev => prev.filter(x => x.id !== i.id));
        try { await deleteContent(i.id); } catch (e) {
          setItems(snapshot);
          Alert.alert('Error', 'Failed to remove content');
        }
      }}
    ]);
  };

  const onOpenOnline = async (i) => {
    if (!i.url) return;
    await WebBrowser.openBrowserAsync(i.url);
  };

  const onDownloadOffline = async (i) => {
    if (!i.url) return;
    try {
      await getOrDownload(i.url, 'pdf');
      Alert.alert('Downloaded', 'Available offline next time');
    } catch (e) {
      Alert.alert('Error', 'Download failed');
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: '#fff', borderColor: '#e5e7eb' }]}>
      <View style={styles.rowBetween}>
        <Text style={[styles.title, { color: '#111827' }]}>{item.title}</Text>
        <View style={[styles.badge, { backgroundColor: item.status === 'Published' ? '#10b981' : '#f59e0b' }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={{ color: '#6b7280', marginTop: 6 }}>{item.type}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.pill]} onPress={() => onOpenOnline(item)}>
          <Ionicons name="open-outline" size={16} color="#1F2937" />
          <Text style={styles.pillText}>Open</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pill]} onPress={() => onDownloadOffline(item)}>
          <Ionicons name="download-outline" size={16} color="#1F2937" />
          <Text style={styles.pillText}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pill, styles.primary]} onPress={() => onToggleStatus(item)}>
          <Ionicons name="cloud-upload" size={16} color="#fff" />
          <Text style={styles.pillPrimaryText}>{item.status === 'Draft' ? 'Publish' : 'Unpublish'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pill, styles.danger]} onPress={() => onRemove(item)}>
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.pillDangerText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#f9fafb' }]}>
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: '#111827' }]}>Content Management</Text>
      </View>

      <View style={styles.toolbar}>
        <View style={[styles.input, { borderColor: '#e5e7eb', backgroundColor: '#fff' }]}>
          <Ionicons name="book" size={18} color="#6b7280" />
          <TextInput
            style={[styles.text, { color: '#111827' }]}
            placeholder="Title"
            placeholderTextColor="#9aa0a6"
            value={title}
            onChangeText={setTitle}
          />
        </View>
        <View style={[styles.input, { borderColor: '#e5e7eb', backgroundColor: '#fff' }]}>
          <Ionicons name="link" size={18} color="#6b7280" />
          <TextInput
            style={[styles.text, { color: '#111827' }]}
            placeholder="File URL (Supabase public/signed URL)"
            placeholderTextColor="#9aa0a6"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity style={[styles.pill, styles.primary]} onPress={onAdd}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.pillPrimaryText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pill]} onPress={load}>
          <Ionicons name="refresh" size={18} color="#1F2937" />
          <Text style={styles.pillText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ padding: 16 }}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={() => (
            <View style={{ padding: 16 }}>
              <Text style={{ color: '#6b7280' }}>No content yet. Add with Title and URL.</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  screenTitle: { fontSize: 22, fontWeight: '700' },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { flex: 1, fontSize: 14 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#EEF2F7' },
  primary: { backgroundColor: '#2563EB' },
  pillPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  danger: { backgroundColor: '#DC2626' },
  pillDangerText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  pillText: { color: '#1F2937', fontWeight: '700', fontSize: 12 },
});
