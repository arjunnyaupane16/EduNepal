import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { registerForPushNotificationsAsync, scheduleLocalRandomNotification, getServerUrl, saveServerUrl } from '../../utils/notifications';

export default function DeveloperTools() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();

  const isAdmin = user?.role === 'Administrator' || user?.username === 'admin';

  const [serverUrl, setServerUrl] = useState('');
  const [pingUrl, setPingUrl] = useState(() => Constants?.expoConfig?.extra?.serverUrl || 'http://localhost:4000/health');
  const [pingStatus, setPingStatus] = useState('');
  const [kvPairs, setKvPairs] = useState([]);
  const [loadingKV, setLoadingKV] = useState(false);
  const [savingServer, setSavingServer] = useState(false);

  const deviceInfo = useMemo(() => ({
    deviceName: Device.deviceName,
    isDevice: Device.isDevice,
    osName: Device.osName,
    osVersion: Device.osVersion,
    brand: Device.brand,
    modelName: Device.modelName,
  }), []);

  useEffect(() => {
    (async () => {
      const base = await getServerUrl();
      setServerUrl(base);
      if (!pingUrl) setPingUrl(`${base.replace(/\/$/, '')}/health`);
    })();
  }, []);

  if (!isAdmin) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>{t('adminAccessDenied')}</Text>
      </View>
    );
  }

  const showConstants = () => {
    const info = {
      appName: Constants.expoConfig?.name,
      appOwnership: Constants.appOwnership,
      expoVersion: Constants.expoVersion,
      runtimeVersion: Constants.runtimeVersion,
      projectId: Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId,
      extra: Constants.expoConfig?.extra,
    };
    console.log('Expo Constants:', info);
    Alert.alert('Expo Constants', 'Printed to console');
  };

  const ping = async () => {
    const start = Date.now();
    try {
      const res = await fetch(pingUrl);
      const ms = Date.now() - start;
      setPingStatus(`HTTP ${res.status} in ${ms}ms`);
    } catch (e) {
      const ms = Date.now() - start;
      setPingStatus(`Failed in ${ms}ms: ${e?.message || e}`);
    }
  };

  const persistServerUrl = async () => {
    try {
      const trimmed = String(serverUrl || '').trim();
      if (!/^https?:\/\//i.test(trimmed)) {
        Alert.alert('Invalid URL', 'Please include http:// or https://');
        return;
      }
      setSavingServer(true);
      await saveServerUrl(trimmed.replace(/\/$/, ''));
      Alert.alert('Saved', 'Server URL saved for notifications');
    } catch (e) {
      Alert.alert('Save failed', e?.message || String(e));
    } finally {
      setSavingServer(false);
    }
  };

  const loadKV = async () => {
    try {
      setLoadingKV(true);
      const keys = await AsyncStorage.getAllKeys();
      const all = await AsyncStorage.multiGet(keys);
      setKvPairs(all.map(([k, v]) => ({ key: k, value: v })).slice(0, 100));
    } catch (e) {
      Alert.alert('AsyncStorage error', e?.message || String(e));
    } finally {
      setLoadingKV(false);
    }
  };

  const clearKV = () => {
    Alert.alert('Clear storage', 'Clear ALL AsyncStorage keys?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { await AsyncStorage.clear(); setKvPairs([]); } },
    ]);
  };

  const registerPush = async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) Alert.alert('Push Token', token);
  };

  const scheduleLocal = async () => {
    const sec = await scheduleLocalRandomNotification('Test local notification (random delay)');
    Alert.alert('Scheduled', `Local notification in ~${sec}s`);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.title, { color: theme.text }]}>{t('developerTools')}</Text>

      {/* Device Info */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}> 
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Device</Text>
        {Object.entries(deviceInfo).map(([k, v]) => (
          <View key={k} style={[styles.row, { borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.secondaryText }]}>{k}</Text>
            <Text style={{ color: theme.text }}>{String(v)}</Text>
          </View>
        ))}
      </View>

      {/* Expo Constants */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}> 
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Expo Constants</Text>
        <TouchableOpacity onPress={showConstants} style={[styles.btn, { borderColor: theme.border }]}>
          <Text style={{ color: theme.text }}>Show in Console</Text>
        </TouchableOpacity>
      </View>

      {/* Network Ping */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}> 
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Notification Server URL</Text>
        <TextInput
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="http://<your-ip>:4000"
          placeholderTextColor={theme.secondaryText}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <TouchableOpacity onPress={persistServerUrl} style={[styles.btn, { borderColor: theme.border }]}> 
            <Text style={{ color: theme.text }}>{savingServer ? 'Saving…' : 'Save URL'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Network Ping */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}> 
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Network Ping</Text>
        <TextInput
          value={pingUrl}
          onChangeText={setPingUrl}
          placeholder="http://localhost:4000/health"
          placeholderTextColor={theme.secondaryText}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          autoCapitalize="none"
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={ping} style={[styles.btn, { borderColor: theme.border }]}>
            <Text style={{ color: theme.text }}>Ping</Text>
          </TouchableOpacity>
          {pingStatus?.length > 0 && (
            <View style={{ justifyContent: 'center' }}>
              <Text style={{ color: theme.secondaryText }}>{pingStatus}</Text>
            </View>
          )}
        </View>
      </View>

      {/* AsyncStorage */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}> 
        <Text style={[styles.sectionTitle, { color: theme.text }]}>AsyncStorage</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <TouchableOpacity onPress={loadKV} style={[styles.btn, { borderColor: theme.border }]}>
            <Text style={{ color: theme.text }}>{loadingKV ? 'Loading…' : 'Load Keys'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearKV} style={[styles.btn, { borderColor: theme.border }]}>
            <Text style={{ color: '#ef4444' }}>Clear All</Text>
          </TouchableOpacity>
        </View>
        {kvPairs.map(({ key, value }) => (
          <View key={key} style={[styles.row, { borderColor: theme.border }]}> 
            <Text style={[styles.kvKey, { color: theme.text }]} numberOfLines={1}>{key}</Text>
            <Text style={[styles.kvValue, { color: theme.secondaryText }]} numberOfLines={2}>{String(value)}</Text>
          </View>
        ))}
        {kvPairs.length === 0 && (
          <Text style={{ color: theme.secondaryText }}>No keys loaded</Text>
        )}
      </View>

      {/* Push Notifications */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}> 
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Push Notifications</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={registerPush} style={[styles.btn, { borderColor: theme.border }]}>
            <Text style={{ color: theme.text }}>Register Token</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={scheduleLocal} style={[styles.btn, { borderColor: theme.border }]}>
            <Text style={{ color: theme.text }}>Schedule Local</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  row: { paddingVertical: 10, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between' },
  label: { width: 140, fontSize: 13 },
  btn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  kvKey: { flex: 0.8, marginRight: 8, fontWeight: '600' },
  kvValue: { flex: 1.2 },
});
