import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import TopNavBar from '../../components/TopNavBar';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { theme, themeKey, changeTheme } = useTheme();
  const { language, changeLanguage, t, getAvailableLanguages } = useLanguage();
  const router = useRouter();
  const {
    user,
    users,
    setUserRole,
    resetPassword,
    removeUser,
    requestVerificationCode,
    changePasswordWithVerification,
    changeEmailWithVerification,
    deleteAccountWithVerification,
  } = useAuth();

  // Delete Account now routes to dedicated screen

  const themeOptions = ['system', 'light', 'dark', 'blue', 'purple', 'green', 'pink'];

  const onChangeTheme = async (key) => {
    await changeTheme(key);
  };

  const onChangeLanguage = async (code) => {
    await changeLanguage(code);
  };

  const isAdmin = user?.role === 'Administrator' || user?.username === 'admin';

  const handleToggleRole = (target) => {
    const nextRole = target.role === 'Administrator' ? 'Student' : 'Administrator';
    setUserRole(target.id, nextRole);
  };

  const handleResetPassword = (target) => {
    const newPass = `Temp${Math.floor(100000 + Math.random() * 900000)}`;
    resetPassword(target.id, newPass);
    Alert.alert('Password Reset', `Temporary password for ${target.username}: ${newPass}`);
  };

  const handleRemoveUser = (target) => {
    if (target.username === 'admin' || target.role === 'Administrator' && target.username === 'admin') {
      Alert.alert('Not Allowed', 'Cannot remove the primary admin account.');
      return;
    }
    Alert.alert(
      'Confirm Deletion',
      `Remove user ${target.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeUser(target.id) },
      ]
    );
  };

  const Section = ({ title, children }) => (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 10 }}>{title}</Text>
      <View style={{ backgroundColor: theme.card, borderRadius: 12, overflow: 'hidden' }}>{children}</View>
    </View>
  );

  const RowButton = ({ label, selected, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: selected ? theme.primary : 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: '#00000010',
      }}
    >
      <Text style={{ color: selected ? '#ffffff' : theme.text, fontSize: 15 }}>{label}</Text>
    </TouchableOpacity>
  );

  const AdminUserRow = ({ item }) => (
    <View
      style={{
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#00000010',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>
        {item.fullName} ({item.username})
      </Text>
      <Text style={{ color: theme.subtext, fontSize: 13 }}>Role: {item.role}</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <SmallBtn
          label={item.role === 'Administrator' ? 'Make Student' : 'Make Admin'}
          onPress={() => handleToggleRole(item)}
        />
        <SmallBtn label="Reset Password" onPress={() => handleResetPassword(item)} />
        <SmallBtn
          label="Remove"
          danger
          disabled={item.username === 'admin'}
          onPress={() => handleRemoveUser(item)}
        />
      </View>
    </View>
  );

  const SmallBtn = ({ label, onPress, danger, disabled }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: disabled ? '#cccccc' : danger ? '#d9534f' : theme.primary,
      }}
    >
      <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <TopNavBar title={t('settings')} showMenu showNotifications />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Section title={t('language')}>
          {getAvailableLanguages().map((lang) => (
            <RowButton
              key={lang.code}
              label={`${lang.name} (${lang.nativeName})`}
              selected={language === lang.code}
              onPress={() => onChangeLanguage(lang.code)}
            />
          ))}
        </Section>

        <Section title={t('theme')}>
          {themeOptions.map((key) => (
            <RowButton
              key={key}
              label={`${key.charAt(0).toUpperCase()}${key.slice(1)}`}
              selected={themeKey === key}
              onPress={() => onChangeTheme(key)}
            />
          ))}
        </Section>

        <Section title="Security">
          <RowButton
            label="Account Security"
            onPress={() => router.push('/settings/account-security')}
          />
          <RowButton
            label="Delete Account"
            onPress={() => router.push('/settings/DeleteAccount')}
          />
        </Section>

        {/* Account Security */}
        <AccountSecurity
          theme={theme}
          user={user}
          requestVerificationCode={requestVerificationCode}
          changePasswordWithVerification={changePasswordWithVerification}
          changeEmailWithVerification={changeEmailWithVerification}
          deleteAccountWithVerification={deleteAccountWithVerification}
        />

        {isAdmin && (
          <Section title="Admin Panel">
            {users.map((u) => (
              <AdminUserRow key={u.id} item={u} />
            ))}
          </Section>
        )}
      </ScrollView>
      {/* Inline Delete Modal removed in favor of dedicated screen */}
    </View>
  );
}

function AccountSecurity({ theme, user, requestVerificationCode, changePasswordWithVerification, changeEmailWithVerification, deleteAccountWithVerification }) {
  const { useRouter } = require('expo-router');
  const router = useRouter();
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordCode, setPasswordCode] = useState('');
  const [pwCodeSent, setPwCodeSent] = useState(false);
  // Delete Account handled via dedicated screen

  const field = (label, inputEl, rightEl) => (
    <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#00000010' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: theme.text, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
        {rightEl || null}
      </View>
      {inputEl}
    </View>
  );

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Account Security</Text>
      <View style={{ backgroundColor: theme.card, borderRadius: 12, overflow: 'hidden' }}>
        {/* Change Email */}
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

        {/* Change Password */}
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

        {/* Delete Account */}
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
    </View>
  );
}
