// app/(authenticated)/settings/DeleteAccount.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';

export default function DeleteAccount() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const keyboardVerticalOffset = Platform.OS === 'ios' ? insets.top + headerHeight : 0;
  
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleDeleteAccount = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    if (confirmText !== 'DELETE') {
      Alert.alert('Error', 'Please type "DELETE" to confirm');
      return;
    }

    Alert.alert(
      'Final Confirmation',
      'Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            setLoading(true);
            // Simulate API call
            setTimeout(() => {
              setLoading(false);
              Alert.alert('Account Deleted', 'Your account has been permanently deleted.', [
                { text: 'OK', onPress: () => logout() }
              ]);
            }, 2000);
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentInsetAdjustmentBehavior="always"
        keyboardDismissMode={Platform.OS === 'ios' ? 'none' : 'on-drag'}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 120 : 30 }}
      >
      <View style={styles.header}>
        <Ionicons name="warning" size={60} color="#ef4444" />
        <Text style={[styles.title, { color: theme.text }]}>Delete Account</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>\n          Permanently remove your account and all associated data
        </Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.warningSection, { backgroundColor: '#fef2f2', borderColor: '#ef4444' }]}>
          <Ionicons name="alert-circle" size={24} color="#ef4444" />
          <View style={styles.warningContent}>
            <Text style={[styles.warningTitle, { color: '#dc2626' }]}>Warning: This action is irreversible</Text>
            <Text style={[styles.warningText, { color: '#991b1b' }]}>\n              Deleting your account will permanently remove all your data, including:
            </Text>
            <View style={styles.warningList}>
              <Text style={[styles.warningItem, { color: '#991b1b' }]}>• Profile information and settings</Text>
              <Text style={[styles.warningItem, { color: '#991b1b' }]}>• Downloaded content and progress</Text>
              <Text style={[styles.warningItem, { color: '#991b1b' }]}>• Study history and achievements</Text>
              <Text style={[styles.warningItem, { color: '#991b1b' }]}>• All personal data and preferences</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground || '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Information</Text>
          <View style={[styles.accountInfo, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.accountRow}>
              <Text style={[styles.accountLabel, { color: theme.text }]}>Email:</Text>
              <Text style={[styles.accountValue, { color: theme.text }]}>{user?.email}</Text>
            </View>
            <View style={styles.accountRow}>
              <Text style={[styles.accountLabel, { color: theme.text }]}>Account Type:</Text>
              <Text style={[styles.accountValue, { color: theme.text }]}>{user?.role || 'Student'}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground || '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Confirm Account Deletion</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Enter your password *</Text>
            <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.placeholder} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your current password"
                placeholderTextColor={theme.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={theme.placeholder} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Type "DELETE" to confirm *</Text>
            <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <Ionicons name="text-outline" size={20} color={theme.placeholder} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Type DELETE in capital letters"
                placeholderTextColor={theme.placeholder}
                value={confirmText}
                onChangeText={setConfirmText}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>

        <View style={[styles.alternativeSection, { backgroundColor: '#f0f9ff', borderColor: '#0ea5e9' }]}>
          <Ionicons name="information-circle" size={20} color="#0ea5e9" />
          <View style={styles.alternativeContent}>
            <Text style={[styles.alternativeTitle, { color: '#0c4a6e' }]}>Looking for alternatives?</Text>
            <Text style={[styles.alternativeText, { color: '#075985' }]}>\n              Consider temporarily deactivating your account instead of permanent deletion. You can always reactivate it later.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleDeleteAccount}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.deleteButtonText}>Deleting Account...</Text>
          ) : (
            <>
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete My Account Permanently</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  content: {
    paddingHorizontal: 20,
  },
  warningSection: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    marginBottom: 20,
  },
  warningContent: {
    flex: 1,
    marginLeft: 15,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  warningList: {
    marginLeft: 10,
  },
  warningItem: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 3,
  },
  section: {
    padding: 20,
    marginVertical: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  accountInfo: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  accountLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  accountValue: {
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  alternativeSection: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 20,
  },
  alternativeContent: {
    flex: 1,
    marginLeft: 10,
  },
  alternativeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  alternativeText: {
    fontSize: 13,
    lineHeight: 18,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 30,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
