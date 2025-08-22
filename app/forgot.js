import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, KeyboardAvoidingView, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./context/AuthContext";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: enter email, 2: enter code + new pass
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { requestPasswordReset, confirmPasswordReset } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const keyboardVerticalOffset = Platform.OS === 'ios' ? insets.top + headerHeight : 0;

  const handleSend = async () => {
    const e = String(email || '').trim();
    if (!e) return Alert.alert("Error", "Enter your email");
    setLoading(true);
    const resp = await requestPasswordReset?.(e);
    setLoading(false);
    if (!resp?.success) return Alert.alert("Error", resp?.message || "Failed to send code");
    Alert.alert("Email sent", "Enter the verification code sent to your email.");
    setStep(2);
  };

  const handleConfirm = async () => {
    const e = String(email || '').trim();
    if (!e) return Alert.alert("Error", "Enter your email");
    if (!code) return Alert.alert("Error", "Enter the verification code");
    if (!password || password.length < 6) return Alert.alert("Error", "Password must be at least 6 characters");
    if (password !== confirm) return Alert.alert("Error", "Passwords do not match");
    setLoading(true);
    const resp = await confirmPasswordReset?.(e, code, password);
    setLoading(false);
    if (!resp?.success) return Alert.alert("Error", resp?.message || "Failed to reset password");
    Alert.alert("Success", "Your password has been reset. Please log in.");
    router.replace("/login");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: Platform.OS === 'ios' ? 120 : 30 }]}
      keyboardDismissMode={Platform.OS === 'ios' ? 'none' : 'on-drag'}
      keyboardShouldPersistTaps="always"
      contentInsetAdjustmentBehavior="always"
    >
      <Text style={styles.title}>Forgot Password</Text>

      {step === 1 ? (
        <>
          <TextInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleSend} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send Code'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            placeholder="Verification code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            style={styles.input}
          />
          <TextInput
            placeholder="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            placeholder="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            style={styles.input}
          />
          <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleConfirm} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Updating...' : 'Reset Password'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep(1)} style={{ marginTop: 12 }}>
            <Text style={styles.linkText}>Use a different email</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 30, color: "#2c3e50" },
  input: { width: "100%", padding: 15, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, marginBottom: 15 },
  button: { backgroundColor: "#e67e22", padding: 15, borderRadius: 10, width: "100%", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  linkText: { color: "#3498db", fontWeight: "bold" },
});
