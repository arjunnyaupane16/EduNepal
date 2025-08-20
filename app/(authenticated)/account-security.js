import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import TopNavBar from '../../components/TopNavBar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function AccountSecurityScreen() {
  const { theme } = useTheme();
  const {
    user,
    requestVerificationCode,
    changePasswordWithVerification,
    changeEmailWithVerification,
    deleteAccountWithVerification,
  } = useAuth();
  const router = useRouter();

  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordCode, setPasswordCode] = useState('');
  const [pwCodeSent, setPwCodeSent] = useState(false);

  // Delete Account is handled via dedicated screen

  const field = (label, inputEl) => (
    <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#00000010' }}>
      <Text style={{ color: theme.text, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
      {inputEl}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <TopNavBar title={'Account Security'} showBack />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: theme.card, borderRadius: 12, overflow: 'hidden' }}>
          {field(
            'Change Email (requires verification)',
            <View>
              <TextInput
                style={{ backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e5e7eb', color: theme.text }}
                placeholder="new-email@example.com"
                value={emailInput}
                onChangeText={setEmailInput}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={async () => {
                    const r = await requestVerificationCode('change_email');
                    if (r?.success) { setEmailCodeSent(true); Alert.alert('Code sent', 'Check your email for the code.'); }
                    else Alert.alert('Failed', r?.message || 'Could not send code');
                  }}
                  style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: emailCodeSent ? '#10b981' : '#3b82f6', backgroundColor: '#fff' }}
                >
                  <Text style={{ color: emailCodeSent ? '#10b981' : '#3b82f6', fontWeight: '600' }}>{emailCodeSent ? 'Code Sent' : 'Send Code'}</Text>
                </TouchableOpacity>
                <TextInput
                  style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e5e7eb', color: theme.text }}
                  placeholder="Enter code"
                  value={emailCode}
                  onChangeText={setEmailCode}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TouchableOpacity
                  onPress={async () => {
                    if (!emailInput.includes('@')) return Alert.alert('Invalid', 'Enter a valid email');
                    if (!emailCode) return Alert.alert('Required', 'Enter the email code');
                    const r = await changeEmailWithVerification(emailInput.trim(), emailCode.trim());
                    if (r?.success) { Alert.alert('Success', 'Email updated'); setEmailCode(''); setEmailCodeSent(false); }
                    else Alert.alert('Failed', r?.message || 'Could not update email');
                  }}
                  style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#3b82f6' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Update Email</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {field(
            'Change Password (requires verification)',
            <View>
              <TextInput
                style={{ backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e5e7eb', color: theme.text, marginBottom: 8 }}
                placeholder="New password"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={{ backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e5e7eb', color: theme.text, marginBottom: 8 }}
                placeholder="Confirm new password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={async () => {
                    const r = await requestVerificationCode('change_password');
                    if (r?.success) { setPwCodeSent(true); Alert.alert('Code sent', 'Check your email for the code.'); }
                    else Alert.alert('Failed', r?.message || 'Could not send code');
                  }}
                  style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: pwCodeSent ? '#10b981' : '#3b82f6', backgroundColor: '#fff' }}
                >
                  <Text style={{ color: pwCodeSent ? '#10b981' : '#3b82f6', fontWeight: '600' }}>{pwCodeSent ? 'Code Sent' : 'Send Code'}</Text>
                </TouchableOpacity>
                <TextInput
                  style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e5e7eb', color: theme.text }}
                  placeholder="Enter code"
                  value={passwordCode}
                  onChangeText={setPasswordCode}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TouchableOpacity
                  onPress={async () => {
                    if (!newPassword || newPassword.length < 6) return Alert.alert('Invalid', 'Password must be at least 6 characters');
                    if (newPassword !== confirmPassword) return Alert.alert('Mismatch', 'Passwords do not match');
                    if (!passwordCode) return Alert.alert('Required', 'Enter the email code');
                    const r = await changePasswordWithVerification(newPassword, passwordCode.trim());
                    if (r?.success) { Alert.alert('Success', 'Password updated'); setNewPassword(''); setConfirmPassword(''); setPasswordCode(''); setPwCodeSent(false); }
                    else Alert.alert('Failed', r?.message || 'Could not update password');
                  }}
                  style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#3b82f6' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Update Password</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {field(
            'Delete Account (requires verification)',
            <View>
              <TouchableOpacity
                onPress={() => router.push('/settings/DeleteAccount')}
                style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#ef4444', alignSelf: 'flex-start' }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Delete My Account</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
