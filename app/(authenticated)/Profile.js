import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

export default function Profile() {
  const { user, logout, updateUser, updateUserById, isAdmin, canAdminEditField, uploadProfileImage, deleteProfileImage, getFreshProfileImageUrl, requestUsernameChangeFlow, confirmUsernameChangeFlow, requestEmailChangeFlow, confirmEmailChangeFlow } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.fullName || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [editedUsername, setEditedUsername] = useState(user?.username || '');
  const [editedPhone, setEditedPhone] = useState(user?.phone || '');
  const [editedDateOfBirth, setEditedDateOfBirth] = useState(user?.dateOfBirth || '');
  const [editedGender, setEditedGender] = useState(user?.gender || '');
  const [editedCountry, setEditedCountry] = useState(user?.address?.country || '');
  const [editedState, setEditedState] = useState(user?.address?.state || '');
  const [editedCity, setEditedCity] = useState(user?.address?.city || '');
  const [editedZip, setEditedZip] = useState(user?.address?.zip || '');

  // Modal states
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [imageLoading, setImageLoading] = useState(false);

  // Autosave status
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Inline verification flows for sensitive fields
  const [showUsernameChange, setShowUsernameChange] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernamePassword, setUsernamePassword] = useState('');
  const [usernameCodeRequested, setUsernameCodeRequested] = useState(false);
  const [usernameCode, setUsernameCode] = useState('');

  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [confirmNewEmail, setConfirmNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailCodeRequested, setEmailCodeRequested] = useState(false);
  const [emailCode, setEmailCode] = useState('');

  // Helper: prefetch a URL and resolve true/false
  const prefetchImage = async (url, msTimeout = 6000) => {
    try {
      if (!url) return false;
      const p = Image.prefetch(String(url));
      const to = new Promise((resolve) => setTimeout(() => resolve(false), msTimeout));
      const ok = await Promise.race([p.then(() => true).catch(() => false), to]);
      return !!ok;
    } catch { return false; }
  };

  // Keep local image state in sync with user changes, but only switch after prefetch
  useEffect(() => {
    (async () => {
      const url = user?.profileImage || null;
      if (!url) {
        setProfileImage(null);
        return;
      }
      const ok = await prefetchImage(url);
      if (ok) setProfileImage(url);
      // if not ok, keep whatever is currently shown
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profileImage]);

  // When we have a stored path, always try to obtain a fresh signed URL
  const triedRefreshRef = useRef(false);
  useEffect(() => {
    (async () => {
      triedRefreshRef.current = false;
      const path = user?.profileImagePath;
      if (!path || !getFreshProfileImageUrl) return;
      const res = await getFreshProfileImageUrl();
      if (res?.success && res.url) {
        const ok = await prefetchImage(res.url);
        if (ok) setProfileImage(res.url);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profileImagePath]);

  // Removed local AsyncStorage persistence; Supabase is the source of truth

  // Password change removed from Profile

  // Settings states
  const [notifications, setNotifications] = useState(user?.settings?.notifications || true);
  const [emailNotifications, setEmailNotifications] = useState(user?.settings?.emailNotifications || true);
  const [pushNotifications, setPushNotifications] = useState(user?.settings?.pushNotifications || true);
  const [privacyMode, setPrivacyMode] = useState(user?.settings?.privacyMode || false);

  // Verification states (email change UI removed here)
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // If no user is logged in, show loading or redirect
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('loadingProfile')}</Text>
      </View>
    );
  }

  // Helper functions
  const pickImage = async () => {
    // Ensure media library permission
    const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!libPerm.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to choose an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      // Optimistically show local image to avoid white flash
      setProfileImage(uri);
      try {
        const resp = await uploadProfileImage(uri);
        if (!resp?.success) {
          console.error('Image upload failed:', resp?.error);
          Alert.alert('Upload failed', 'Could not upload profile image.');
        } else {
          // Prefer a freshly signed/public URL derived from the stored path
          let displayed = false;
          try {
            const fresh = await getFreshProfileImageUrl?.(resp.path);
            if (fresh?.success && fresh.url) {
              const okFresh = await prefetchImage(fresh.url, 4000);
              if (okFresh) { setProfileImage(fresh.url); displayed = true; }
            }
          } catch {}
          if (!displayed) {
            const ok = await prefetchImage(resp.url, 4000);
            if (ok) { setProfileImage(resp.url); displayed = true; }
          }
          if (!displayed) {
            // Limited retry using fresh signer again
            for (let i = 0; i < 4 && !displayed; i++) {
              try {
                const fresh = await getFreshProfileImageUrl?.(resp.path);
                if (fresh?.success && fresh.url) {
                  const ok2 = await prefetchImage(fresh.url, 4000);
                  if (ok2) { setProfileImage(fresh.url); displayed = true; break; }
                }
              } catch {}
              await new Promise(r => setTimeout(r, 1500));
            }
          }
          if (!displayed) {
            // Suppress noisy alert; silently allow image to appear after CDN propagation.
          }
        }
      } catch (e) {
        console.error('Image upload exception:', e?.message || e);
        Alert.alert('Upload error', 'An unexpected error occurred.');
      }
      setShowImagePicker(false);
    }
  };

  const takePhoto = async () => {
    // Ensure camera permission
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!camPerm.granted) {
      Alert.alert('Permission required', 'Please allow camera access to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      // Optimistically show local image to avoid white flash
      setProfileImage(uri);
      try {
        const resp = await uploadProfileImage(uri);
        if (!resp?.success) {
          console.error('Image upload failed:', resp?.error);
          Alert.alert('Upload failed', 'Could not upload profile image.');
        } else {
          let displayed = false;
          try {
            const fresh = await getFreshProfileImageUrl?.(resp.path);
            if (fresh?.success && fresh.url) {
              const okFresh = await prefetchImage(fresh.url, 4000);
              if (okFresh) { setProfileImage(fresh.url); displayed = true; }
            }
          } catch {}
          if (!displayed) {
            const ok = await prefetchImage(resp.url, 4000);
            if (ok) { setProfileImage(resp.url); displayed = true; }
          }
          if (!displayed) {
            for (let i = 0; i < 4 && !displayed; i++) {
              try {
                const fresh = await getFreshProfileImageUrl?.(resp.path);
                if (fresh?.success && fresh.url) {
                  const ok2 = await prefetchImage(fresh.url, 4000);
                  if (ok2) { setProfileImage(fresh.url); displayed = true; break; }
                }
              } catch {}
              await new Promise(r => setTimeout(r, 1500));
            }
          }
          if (!displayed) {
            // Suppress notice; silently allow image to appear after CDN propagation.
          }
        }
      } catch (e) {
        console.error('Image upload exception:', e?.message || e);
        Alert.alert('Upload error', 'An unexpected error occurred.');
      }
      setShowImagePicker(false);
    }
  };

  // Determine admin status whether isAdmin is a function or boolean
  const isAdminFlag = typeof isAdmin === 'function' ? !!isAdmin() : !!isAdmin;

  // Immediate autosave helper (admin -> updateUserById, non-admin -> updateUser)
  const saveImmediate = async (patch) => {
    try {
      if (!patch || !user?.id) return;
      setSaving(true);
      setSaveError('');
      const resp = isAdminFlag
        ? await updateUserById(user.id, patch)
        : await updateUser(patch);
      if (!resp?.success) {
        console.error('Profile autosave failed:', resp?.error);
        setSaveError('Could not save changes');
      }
    } catch (e) {
      console.error('Profile autosave exception:', e?.message || e);
      setSaveError('Unexpected error while saving');
    } finally {
      setSaving(false);
    }
  };

  // Debounce wrapper for text inputs to reduce DB writes
  const debounceTimersRef = useRef({});
  const saveDebounced = (key, patch, delay = 400) => {
    const timers = debounceTimersRef.current;
    if (timers[key]) clearTimeout(timers[key]);
    timers[key] = setTimeout(() => {
      saveImmediate(patch);
    }, delay);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      const timers = debounceTimersRef.current;
      Object.values(timers).forEach((t) => clearTimeout(t));
      debounceTimersRef.current = {};
    };
  }, []);

  const handleSave = () => {
    // Keep button for UX; fields are autosaved to Supabase
    setIsEditing(false);
    Alert.alert('Saved', 'Your changes have been saved.');
  };

  // Email is immutable via UI; hide verification flow
  const handleVerifyEmail = () => {
    setShowVerification(false);
    setVerificationCode('');
  };

  // Password change removed

  const handleCancel = () => {
    setIsEditing(false);
    setShowVerification(false);
    setEditedName(user?.fullName || '');
    setEditedEmail(user?.email || '');
    setEditedUsername(user?.username || '');
    setEditedPhone(user?.phone || '');
    setEditedDateOfBirth(user?.dateOfBirth || '');
    setEditedGender(user?.gender || '');
    setEditedCountry(user?.address?.country || '');
    setEditedState(user?.address?.state || '');
    setEditedCity(user?.address?.city || '');
    setEditedZip(user?.address?.zip || '');
    setVerificationCode('');
    setProfileImage(user?.profileImage || null);
  };

  const navigateToUserManagement = () => {
    // Navigation logic for admin user management
    Alert.alert('Navigation', 'Navigating to User Management...');
  };

  const navigateToContentManagement = () => {
    // Navigation logic for admin content management
    Alert.alert('Navigation', 'Navigating to Content Management...');
  };

  const navigateToReports = () => {
    // Navigation logic for admin reports
    Alert.alert('Navigation', 'Navigating to Reports & Analytics...');
  };

  const navigateToSupport = () => {
    // Navigation logic for support requests
    Alert.alert('Navigation', 'Navigating to Support Requests...');
  };



  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      {/* Header Section with Profile Picture */}
      <View style={[styles.header, { backgroundColor: theme.primary || '#3b82f6' }]}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={() => setShowImagePicker(true)}
        >
          {profileImage ? (
            <>
              <Image
                key={String(profileImage)}
                source={{ uri: String(profileImage) }}
                style={styles.profileImage}
                resizeMode="cover"
                onError={async () => {
                  console.warn('Profile image failed to load, attempting fresh signed URL...');
                  if (!triedRefreshRef.current && getFreshProfileImageUrl) {
                    triedRefreshRef.current = true;
                    try {
                      const res = await getFreshProfileImageUrl();
                      if (res?.success && res.url) {
                        const ok = await prefetchImage(res.url);
                        if (ok) {
                          setProfileImage(res.url);
                          return;
                        }
                      }
                    } catch {}
                  }
                  setProfileImage(null);
                }}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
              />
              {imageLoading && (
                <View style={styles.imageLoaderOverlay}>
                  <ActivityIndicator color="#3b82f6" />
                </View>
              )}
            </>
          ) : (
            <Ionicons name="person-circle" size={80} color="#fff" />
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={16} color="#3b82f6" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#fff' }]}>{user?.fullName || 'User'}</Text>
        <Text style={[styles.subtitle, { color: '#e0e7ff' }]}>EduNepal {user?.role || 'Student'}</Text>
      </View>

      {/* 1. User Information Section */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground || '#fff' }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Personal Information</Text>
          <TouchableOpacity
            style={styles.editIcon}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons name={isEditing ? "close" : "pencil"} size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Full Name */}
        <View style={styles.inputRow}>
          <Ionicons name="person" size={20} color="#3b82f6" style={styles.inputIcon} />
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Full Name</Text>
            {isEditing ? (
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                value={editedName}
                onChangeText={(v) => { setEditedName(v); saveDebounced('fullName', { fullName: v }); }}
                placeholder="Enter your full name"
                placeholderTextColor={theme.secondaryText}
              />
            ) : (
              <Text style={[styles.inputValue, { color: theme.text }]}>{user?.fullName || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Username */}
        <View style={styles.inputRow}>
          <Ionicons name="at" size={20} color="#3b82f6" style={styles.inputIcon} />
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Username</Text>
            {isEditing ? (
              <View>
                <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: '#f3f4f6' }]}
                  value={editedUsername}
                  editable={false}
                />
                {!showUsernameChange ? (
                  <TouchableOpacity style={styles.linkButton} onPress={() => { setShowUsernameChange(true); setNewUsername(''); setUsernamePassword(''); setUsernameCode(''); setUsernameCodeRequested(false); }}>
                    <Text style={styles.linkButtonText}>Change Username (requires email verification)</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ marginTop: 8 }}>
                    {!usernameCodeRequested ? (
                      <>
                        <TextInput
                          style={[styles.textInput, { color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
                          placeholder="New username"
                          placeholderTextColor={theme.secondaryText}
                          value={newUsername}
                          onChangeText={setNewUsername}
                          autoCapitalize="none"
                        />
                        <TextInput
                          style={[styles.textInput, { color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
                          placeholder="Current password"
                          placeholderTextColor={theme.secondaryText}
                          value={usernamePassword}
                          onChangeText={setUsernamePassword}
                          secureTextEntry
                        />
                        <TouchableOpacity
                          style={styles.verifyButton}
                          onPress={async () => {
                            if (!newUsername || newUsername.length < 3) { Alert.alert('Error', 'Username must be at least 3 characters'); return; }
                            if (!usernamePassword) { Alert.alert('Error', 'Enter your current password'); return; }
                            const resp = await requestUsernameChangeFlow(newUsername, usernamePassword);
                            if (!resp?.success) { Alert.alert('Error', resp?.message || 'Failed to send code'); return; }
                            setUsernameCodeRequested(true);
                            Alert.alert('Verification Sent', 'Enter the code sent to your email to confirm username change.');
                          }}
                        >
                          <Text style={styles.verifyButtonText}>Request Code</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TextInput
                          style={[styles.textInput, { color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
                          placeholder="Verification code"
                          placeholderTextColor={theme.secondaryText}
                          value={usernameCode}
                          onChangeText={setUsernameCode}
                          keyboardType="number-pad"
                        />
                        <TouchableOpacity
                          style={styles.verifyButton}
                          onPress={async () => {
                            if (!usernameCode) { Alert.alert('Error', 'Enter the verification code'); return; }
                            const r = await confirmUsernameChangeFlow(newUsername, usernameCode);
                            if (!r?.success) { Alert.alert('Error', r?.message || 'Failed to change username'); return; }
                            Alert.alert('Success', 'Username updated successfully');
                            setShowUsernameChange(false);
                            setUsernameCodeRequested(false);
                            setNewUsername('');
                            setUsernamePassword('');
                            setUsernameCode('');
                          }}
                        >
                          <Text style={styles.verifyButtonText}>Confirm Username Change</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity style={styles.cancelInlineButton} onPress={() => { setShowUsernameChange(false); setUsernameCodeRequested(false); }}>
                      <Text style={styles.cancelInlineText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <Text style={[styles.inputValue, { color: theme.text }]}>{user?.username || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Email */}
        <View style={styles.inputRow}>
          <Ionicons name="mail" size={20} color="#3b82f6" style={styles.inputIcon} />
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Email Address</Text>
            {isEditing ? (
              <View>
                <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: '#f3f4f6' }]}
                  value={editedEmail}
                  editable={false}
                />
                {!showEmailChange ? (
                  <TouchableOpacity style={styles.linkButton} onPress={() => { setShowEmailChange(true); setNewEmail(''); setConfirmNewEmail(''); setEmailPassword(''); setEmailCode(''); setEmailCodeRequested(false); }}>
                    <Text style={styles.linkButtonText}>Change Email (verification required)</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ marginTop: 8 }}>
                    {!emailCodeRequested ? (
                      <>
                        <TextInput
                          style={[styles.textInput, { color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
                          placeholder="New email"
                          placeholderTextColor={theme.secondaryText}
                          value={newEmail}
                          onChangeText={setNewEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                        <TextInput
                          style={[styles.textInput, { color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
                          placeholder="Confirm new email"
                          placeholderTextColor={theme.secondaryText}
                          value={confirmNewEmail}
                          onChangeText={setConfirmNewEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                        <TextInput
                          style={[styles.textInput, { color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
                          placeholder="Current password"
                          placeholderTextColor={theme.secondaryText}
                          value={emailPassword}
                          onChangeText={setEmailPassword}
                          secureTextEntry
                        />
                        <TouchableOpacity
                          style={styles.verifyButton}
                          onPress={async () => {
                            const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
                            if (!re.test(String(newEmail).trim())) { Alert.alert('Error', 'Enter a valid email'); return; }
                            if (newEmail !== confirmNewEmail) { Alert.alert('Error', 'Emails do not match'); return; }
                            if (!emailPassword) { Alert.alert('Error', 'Enter your current password'); return; }
                            const resp = await requestEmailChangeFlow(newEmail, emailPassword);
                            if (!resp?.success) { Alert.alert('Error', resp?.message || 'Failed to send code'); return; }
                            setEmailCodeRequested(true);
                            Alert.alert('Verification Sent', 'We sent a code to your new email. Enter it below to confirm.');
                          }}
                        >
                          <Text style={styles.verifyButtonText}>Request Code</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TextInput
                          style={[styles.textInput, { color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
                          placeholder="Verification code"
                          placeholderTextColor={theme.secondaryText}
                          value={emailCode}
                          onChangeText={setEmailCode}
                          keyboardType="number-pad"
                        />
                        <TouchableOpacity
                          style={styles.verifyButton}
                          onPress={async () => {
                            if (!emailCode) { Alert.alert('Error', 'Enter the verification code'); return; }
                            const r = await confirmEmailChangeFlow(newEmail, emailCode);
                            if (!r?.success) { Alert.alert('Error', r?.message || 'Failed to change email'); return; }
                            Alert.alert('Success', 'Email updated successfully');
                            setShowEmailChange(false);
                            setEmailCodeRequested(false);
                            setNewEmail('');
                            setConfirmNewEmail('');
                            setEmailPassword('');
                            setEmailCode('');
                          }}
                        >
                          <Text style={styles.verifyButtonText}>Confirm Email Change</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity style={styles.cancelInlineButton} onPress={() => { setShowEmailChange(false); setEmailCodeRequested(false); }}>
                      <Text style={styles.cancelInlineText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <Text style={[styles.inputValue, { color: theme.text }]}>{user?.email || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Phone */}
        <View style={styles.inputRow}>
          <Ionicons name="call" size={20} color="#3b82f6" style={styles.inputIcon} />
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                value={editedPhone}
                onChangeText={(v) => { setEditedPhone(v); saveDebounced('phone', { phone: v }); }}
                placeholder="Enter phone number"
                placeholderTextColor={theme.secondaryText}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={[styles.inputValue, { color: theme.text }]}>{user?.phone || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Date of Birth */}
        <View style={styles.inputRow}>
          <Ionicons name="calendar" size={20} color="#3b82f6" style={styles.inputIcon} />
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Date of Birth</Text>
            {isEditing ? (
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                value={editedDateOfBirth}
                onChangeText={(v) => { setEditedDateOfBirth(v); saveDebounced('dob', { dateOfBirth: v }); }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.secondaryText}
              />
            ) : (
              <Text style={[styles.inputValue, { color: theme.text }]}>{user?.dateOfBirth || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Gender */}
        <View style={styles.inputRow}>
          <Ionicons name="person-outline" size={20} color="#3b82f6" style={styles.inputIcon} />
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Gender</Text>
            {isEditing ? (
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                value={editedGender}
                onChangeText={(v) => { setEditedGender(v); saveDebounced('gender', { gender: v }); }}
                placeholder="Male/Female/Other"
                placeholderTextColor={theme.secondaryText}
              />
            ) : (
              <Text style={[styles.inputValue, { color: theme.text }]}>{user?.gender || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Address */}
        <View style={styles.inputRow}>
          <Ionicons name="location" size={20} color="#3b82f6" style={styles.inputIcon} />
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Address</Text>
            {isEditing ? (
              <View>
                <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
                  value={editedCountry}
                  onChangeText={(v) => { setEditedCountry(v); saveDebounced('addr', { address: { country: v, state: editedState, city: editedCity, zip: editedZip } }); }}
                  placeholder="Country"
                  placeholderTextColor={theme.secondaryText}
                />
                <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
                  value={editedState}
                  onChangeText={(v) => { setEditedState(v); saveDebounced('addr', { address: { country: editedCountry, state: v, city: editedCity, zip: editedZip } }); }}
                  placeholder="State/Province"
                  placeholderTextColor={theme.secondaryText}
                />
                <View style={styles.addressRow}>
                  <TextInput
                    style={[styles.textInput, { color: theme.text, borderColor: theme.border, flex: 2, marginRight: 8 }]}
                    value={editedCity}
                    onChangeText={(v) => { setEditedCity(v); saveDebounced('addr', { address: { country: editedCountry, state: editedState, city: v, zip: editedZip } }); }}
                    placeholder="City"
                    placeholderTextColor={theme.secondaryText}
                  />
                  <TextInput
                    style={[styles.textInput, { color: theme.text, borderColor: theme.border, flex: 1 }]}
                    value={editedZip}
                    onChangeText={(v) => { setEditedZip(v); saveDebounced('addr', { address: { country: editedCountry, state: editedState, city: editedCity, zip: v } }); }}
                    placeholder="ZIP"
                    placeholderTextColor={theme.secondaryText}
                  />
                </View>
              </View>
            ) : (
              <Text style={[styles.inputValue, { color: theme.text }]}>
                {user?.address ? `${user.address.city || ''}, ${user.address.state || ''}, ${user.address.country || ''}` : 'Not set'}
              </Text>
            )}
          </View>
        </View>

        {/* Role */}
        <View style={styles.inputRow}>
          <Ionicons name="shield-checkmark" size={20} color="#10b981" style={styles.inputIcon} />
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Account Role</Text>
            <View style={[styles.roleBadge, { backgroundColor: user?.role === 'Admin' ? '#ef4444' : '#3b82f6' }]}>
              <Text style={styles.roleText}>{user?.role || 'Student'}</Text>
            </View>
          </View>
        </View>

        {showVerification && (
          <View style={styles.verificationContainer}>
            <Text style={[styles.verificationTitle, { color: theme.text }]}>Email Verification</Text>
            <TextInput
              style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Enter 6-digit code"
              placeholderTextColor={theme.secondaryText}
              keyboardType="numeric"
              maxLength={6}
            />
            <View style={styles.verificationButtons}>
              <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyEmail}>
                <Text style={styles.verifyButtonText}>Verify</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      {/* 3. Settings Access Section */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground || '#fff' }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Settings & Preferences</Text>

        {/* Change Password removed */}

        <View style={styles.settingRow}>
          <Ionicons name="notifications" size={20} color="#3b82f6" />
          <Text style={[styles.settingText, { color: theme.text }]}>Push Notifications</Text>
          <Switch
            value={pushNotifications}
            onValueChange={(v) => { setPushNotifications(v); saveImmediate({ settings: { ...user?.settings, pushNotifications: v, notifications } }); }}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
          />
        </View>

        <View style={styles.settingRow}>
          <Ionicons name="mail" size={20} color="#3b82f6" />
          <Text style={[styles.settingText, { color: theme.text }]}>Email Notifications</Text>
          <Switch
            value={emailNotifications}
            onValueChange={(v) => { setEmailNotifications(v); saveImmediate({ settings: { ...user?.settings, emailNotifications: v, notifications } }); }}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
          />
        </View>

        <View style={styles.settingRow}>
          <Ionicons name="eye-off" size={20} color="#3b82f6" />
          <Text style={[styles.settingText, { color: theme.text }]}>Privacy Mode</Text>
          <Switch
            value={privacyMode}
            onValueChange={(v) => { setPrivacyMode(v); saveImmediate({ settings: { ...user?.settings, privacyMode: v, notifications } }); }}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
          />
        </View>

        <TouchableOpacity style={styles.settingRow}>
          <Ionicons name="link" size={20} color="#3b82f6" />
          <Text style={[styles.settingText, { color: theme.text }]}>Connected Services</Text>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </TouchableOpacity>

        {/* Delete Account moved to Account Security in Settings */}
      </View>

      {/* 4. Admin-Only Section */}
      {user?.role === 'Admin' && (
        <View style={[styles.card, { backgroundColor: theme.cardBackground || '#fff' }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Admin Panel</Text>

          <TouchableOpacity style={styles.adminRow} onPress={navigateToUserManagement}>
            <Ionicons name="people" size={20} color="#ef4444" />
            <Text style={[styles.adminText, { color: theme.text }]}>User Management</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminRow} onPress={navigateToContentManagement}>
            <Ionicons name="library" size={20} color="#ef4444" />
            <Text style={[styles.adminText, { color: theme.text }]}>Content Management</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminRow} onPress={navigateToReports}>
            <Ionicons name="analytics" size={20} color="#ef4444" />
            <Text style={[styles.adminText, { color: theme.text }]}>Reports & Analytics</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminRow} onPress={navigateToSupport}>
            <Ionicons name="help-circle" size={20} color="#ef4444" />
            <Text style={[styles.adminText, { color: theme.text }]}>Support Requests</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Help & Support section removed as requested */}

      {/* 6. Action Buttons */}
      <View style={styles.actionButtons}>
        {isEditing && !showVerification && (
          <>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Ionicons name="close" size={20} color="#666" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}

        {!isEditing && (
          <>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Ionicons name="log-out" size={20} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Saving indicator */}
      {saving && (
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ color: theme.secondaryText }}>Saving...</Text>
        </View>
      )}
      {saveError ? (
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ color: '#ef4444' }}>{saveError}</Text>
        </View>
      ) : null}

      {/* Image Picker Modal */}
      <Modal visible={showImagePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Profile Picture</Text>
            <TouchableOpacity style={styles.modalButton} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color="#3b82f6" />
              <Text style={styles.modalButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={pickImage}>
              <Ionicons name="images" size={24} color="#3b82f6" />
              <Text style={styles.modalButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
            {(profileImage || user?.profileImage) && (
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: '#ef4444' }]}
                onPress={async () => {
                  try {
                    const resp = await deleteProfileImage();
                    if (!resp?.success) {
                      console.error('Delete profile image failed:', resp?.error);
                      Alert.alert('Failed', 'Could not remove profile picture.');
                    } else {
                      setProfileImage(null);
                    }
                  } catch (e) {
                    console.error('Delete profile image exception:', e?.message || e);
                    Alert.alert('Error', 'Unexpected error while removing photo.');
                  } finally {
                    setShowImagePicker(false);
                  }
                }}
              >
                <Ionicons name="trash" size={24} color="#ef4444" />
                <Text style={[styles.modalButtonText, { color: '#ef4444' }]}>Remove Current Photo</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelModalButton]}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.cancelModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Password Change Modal removed */}

      {/* Delete Account Modal moved to Settings */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "400",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  editIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f0f9ff",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  inputIcon: {
    marginRight: 15,
    marginTop: 8,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  textInput: {
    fontSize: 16,
    fontWeight: "500",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f8fafc",
  },
  addressRow: {
    flexDirection: 'row',
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 2,
  },
  roleText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  verificationContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fef3c7",
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  verificationButtons: {
    flexDirection: "row",
    marginTop: 15,
    gap: 10,
  },
  verifyButton: {
    flex: 1,
    backgroundColor: "#10b981",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Inline sensitive change UI helper styles
  linkButton: {
    marginTop: 8,
    paddingVertical: 6,
  },
  linkButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelInlineButton: {
    marginTop: 8,
    paddingVertical: 6,
  },
  cancelInlineText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '500',
  },

  // Settings Styles
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
  },
  // Admin Styles
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  adminText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
  },

  actionButtons: {
    flexDirection: "row",
    gap: 15,
    marginTop: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#10b981",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
  },
  cancelModalButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
