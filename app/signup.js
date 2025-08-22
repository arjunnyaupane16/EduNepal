import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, KeyboardAvoidingView } from "react-native";
import { useAuth } from "./context/AuthContext";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signup } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const keyboardVerticalOffset = Platform.OS === 'ios' ? insets.top + headerHeight : 0;

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (password) => {
    if (password.length < 6) return { strength: "weak", color: "#e74c3c" };
    if (password.length < 8) return { strength: "medium", color: "#f39c12" };
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: "strong", color: "#27ae60" };
    }
    return { strength: "medium", color: "#f39c12" };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSignup = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert("Error", "Full name is required");
      return;
    }
    if (!email || !validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (!agreeTerms) {
      Alert.alert("Error", "Please agree to the Terms & Conditions");
      return;
    }

    const signupData = {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      username: username.trim(),
      phone: phone.trim(),
      password,
    };

    try {
      setLoading(true);
      const result = await signup(signupData);
      if (result?.success) {
        Alert.alert("Success", "Account created successfully! Please login with your credentials.", [
          { text: "OK", onPress: () => router.replace("/login") }
        ]);
      } else {
        Alert.alert("Error", result?.message || "Signup failed. Please try again.");
      }
    } catch (e) {
      Alert.alert("Error", "Network or server error during signup. Please try again.");
    } finally {
      setLoading(false);
    }
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
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join EduNepal today</Text>

      {/* Required Fields */}
      <Text style={styles.sectionTitle}>Required Information</Text>

      <TextInput
        placeholder="Full Name *"
        placeholderTextColor="#999"
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
        autoCapitalize="words"
        selectionColor="#3498db"
      />

      <TextInput
        placeholder="Email Address *"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        selectionColor="#3498db"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password *"
          placeholderTextColor="#999"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          style={styles.passwordInput}
          selectionColor="#3498db"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      {/* Password Strength Indicator */}
      {password.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={[styles.strengthBar, { backgroundColor: passwordStrength.color }]} />
          <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
            Password: {passwordStrength.strength}
          </Text>
        </View>
      )}

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Confirm Password *"
          placeholderTextColor="#999"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.passwordInput}
          selectionColor="#3498db"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Ionicons
            name={showConfirmPassword ? "eye-off" : "eye"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      {/* Optional Fields */}
      <Text style={styles.sectionTitle}>Optional Information</Text>

      <TextInput
        placeholder="Username (optional)"
        placeholderTextColor="#999"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        autoCapitalize="none"
        selectionColor="#3498db"
      />

      <TextInput
        placeholder="Phone Number (optional)"
        placeholderTextColor="#999"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
        keyboardType="phone-pad"
        selectionColor="#3498db"
      />

      {/* Social Signup */}
      <View style={styles.socialContainer}>
        <Text style={styles.orText}>Or sign up with</Text>
        <TouchableOpacity style={styles.googleButton}>
          <Ionicons name="logo-google" size={20} color="#db4437" />
          <Text style={styles.googleText}>Google (Coming Soon)</Text>
        </TouchableOpacity>
      </View>

      {/* Terms & Conditions */}
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setAgreeTerms(!agreeTerms)}
        >
          {agreeTerms && <Ionicons name="checkmark" size={16} color="#3498db" />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>
          I agree to the <Text style={styles.linkText}>Terms & Conditions</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating…' : 'Create Account'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#fff", minHeight: '100%' },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 10, color: "#2c3e50" },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 30, textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 20, marginBottom: 15, color: "#2c3e50", alignSelf: "flex-start", width: "100%" },
  input: { width: "100%", padding: 15, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, marginBottom: 15, fontSize: 16, minHeight: 50, color: "#000", backgroundColor: "#fff" },
  passwordContainer: { width: "100%", flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, marginBottom: 15, minHeight: 50, backgroundColor: "#fff" },
  passwordInput: { flex: 1, padding: 15, fontSize: 16, color: "#000" },
  eyeButton: { padding: 15, minWidth: 50, alignItems: "center", justifyContent: "center" },
  strengthContainer: { width: "100%", marginBottom: 15, minHeight: 25 },
  strengthBar: { height: 4, borderRadius: 2, marginBottom: 5, width: "100%" },
  strengthText: { fontSize: 12, fontWeight: "600" },
  socialContainer: { width: "100%", alignItems: "center", marginVertical: 20 },
  orText: { fontSize: 14, color: "#666", marginBottom: 15 },
  googleButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 15, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, width: "100%", backgroundColor: "#f8f9fa", minHeight: 50 },
  googleText: { marginLeft: 10, fontSize: 16, color: "#666" },
  checkboxContainer: { flexDirection: "row", alignItems: "flex-start", marginBottom: 25, width: "100%", minHeight: 40 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: "#ddd", borderRadius: 4, marginRight: 12, marginTop: 2, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  checkboxText: { flex: 1, fontSize: 14, color: "#666", lineHeight: 20 },
  button: { backgroundColor: "#27ae60", padding: 18, borderRadius: 10, width: "100%", alignItems: "center", marginBottom: 20, minHeight: 55 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  linkText: { color: "#3498db", fontWeight: "600", textAlign: "center", marginTop: 10, fontSize: 16, padding: 5 },
});
