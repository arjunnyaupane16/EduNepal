
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function UpdatePassword() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { requestVerificationCode, changePasswordWithVerification } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(newPassword);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (!passwordValidation.isValid) {
      Alert.alert('Error', 'Please ensure your new password meets all requirements');
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setLoading(true);
    // Step 1: request a verification code to current email
    const resp = await requestVerificationCode('change_password');
    setLoading(false);
    if (!resp?.success) {
      Alert.alert('Error', resp?.message || 'Failed to send verification code');
      return;
    }
    setCodeRequested(true);
    Alert.alert('Verification Required', 'We sent a verification code to your email. Enter it below to confirm the password change.');
  };

  const handleConfirmChange = async () => {
    if (!verificationCode || verificationCode.length < 4) {
      Alert.alert('Error', 'Enter the verification code');
      return;
    }
    setLoading(true);
    const r = await changePasswordWithVerification(newPassword, verificationCode);
    setLoading(false);
    if (!r?.success) {
      Alert.alert('Error', r?.message || 'Failed to update password');
      return;
    }
    Alert.alert('Success', 'Password updated successfully!', [
      { text: 'OK', onPress: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setVerificationCode('');
        setCodeRequested(false);
      }}
    ]);
  };

  const PasswordRequirement = ({ met, text }) => (
    <View style={styles.requirementRow}>
      <Ionicons 
        name={met ? "checkmark-circle" : "close-circle"} 
        size={16} 
        color={met ? "#22c55e" : "#ef4444"} 
      />
      <Text style={[styles.requirementText, { 
        color: met ? "#22c55e" : "#ef4444" 
      }]}>
        {text}
      </Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="lock-closed" size={60} color="#3b82f6" />
        <Text style={[styles.title, { color: theme.text }]}>Change Password</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          Update your account password for better security
        </Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.cardBackground || '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Current Password</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Current Password *</Text>
            <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.placeholder} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter current password"
                placeholderTextColor={theme.placeholder}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <Ionicons 
                  name={showCurrentPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={theme.placeholder} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground || '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>New Password</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>New Password *</Text>
            <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.placeholder} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter new password"
                placeholderTextColor={theme.placeholder}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons 
                  name={showNewPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={theme.placeholder} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Confirm New Password *</Text>
            <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.placeholder} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirm new password"
                placeholderTextColor={theme.placeholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={theme.placeholder} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {newPassword.length > 0 && (
            <View style={[styles.requirementsBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.requirementsTitle, { color: theme.text }]}>Password Requirements:</Text>
              <PasswordRequirement met={passwordValidation.minLength} text="At least 8 characters" />
              <PasswordRequirement met={passwordValidation.hasUpperCase} text="One uppercase letter" />
              <PasswordRequirement met={passwordValidation.hasLowerCase} text="One lowercase letter" />
              <PasswordRequirement met={passwordValidation.hasNumbers} text="One number" />
              <PasswordRequirement met={passwordValidation.hasSpecialChar} text="One special character" />
            </View>
          )}
        </View>

        <View style={[styles.securityTipBox, { backgroundColor: '#e0f2fe', borderColor: '#0ea5e9' }]}>
          <Ionicons name="information-circle" size={20} color="#0ea5e9" />
          <Text style={[styles.securityTipText, { color: '#0c4a6e' }]}>
            Use a strong password with a mix of letters, numbers, and symbols. Avoid using personal information.
          </Text>
        </View>

        {!codeRequested ? (
          <TouchableOpacity
            style={[styles.updateButton, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.buttonText}>Sending Code...</Text>
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
                <Text style={styles.buttonText}>Request Verification Code</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Verification Code *</Text>
              <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
                <Ionicons name="key" size={20} color={theme.placeholder} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter the code from your email"
                  placeholderTextColor={theme.placeholder}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.updateButton, { opacity: loading ? 0.7 : 1 }]}
              onPress={handleConfirmChange}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.buttonText}>Updating...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Confirm Password Change</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
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
  requirementsBox: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  requirementText: {
    fontSize: 13,
    marginLeft: 8,
  },
  securityTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 20,
  },
  securityTipText: {
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
