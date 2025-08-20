
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function UpdateEmail() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [currentEmail, setCurrentEmail] = useState(user?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateEmail = async () => {
    if (!newEmail || !confirmEmail || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newEmail !== confirmEmail) {
      Alert.alert('Error', 'New email addresses do not match');
      return;
    }

    if (newEmail === currentEmail) {
      Alert.alert('Error', 'New email must be different from current email');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Email updated successfully!', [
        { text: 'OK', onPress: () => {
          setNewEmail('');
          setConfirmEmail('');
          setPassword('');
        }}
      ]);
    }, 2000);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="mail" size={60} color="#3b82f6" />
        <Text style={[styles.title, { color: theme.text }]}>Update Email Address</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          Change your account email address securely
        </Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.cardBackground || '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Current Email</Text>
          <View style={[styles.currentEmailBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Ionicons name="mail-outline" size={20} color={theme.text} />
            <Text style={[styles.currentEmailText, { color: theme.text }]}>{currentEmail}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground || '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>New Email Address</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>New Email *</Text>
            <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <Ionicons name="mail-outline" size={20} color={theme.placeholder} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter new email address"
                placeholderTextColor={theme.placeholder}
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Confirm New Email *</Text>
            <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <Ionicons name="mail-outline" size={20} color={theme.placeholder} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirm new email address"
                placeholderTextColor={theme.placeholder}
                value={confirmEmail}
                onChangeText={setConfirmEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Current Password *</Text>
            <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.placeholder} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter current password"
                placeholderTextColor={theme.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>
        </View>

        <View style={[styles.warningBox, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
          <Ionicons name="warning" size={20} color="#f59e0b" />
          <Text style={[styles.warningText, { color: '#92400e' }]}>
            After updating your email, you'll need to verify the new address before you can use it to sign in.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.updateButton, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleUpdateEmail}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.buttonText}>Updating...</Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.buttonText}>Update Email Address</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  currentEmailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  currentEmailText: {
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 10,
  },
  updateButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
