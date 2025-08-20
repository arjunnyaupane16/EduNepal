import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "./context/AuthContext";
import { useLanguage } from "./context/LanguageContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState(""); // email or username for user login
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleLogin = async () => {
    let credentials;

    if (isAdminLogin) {
      // Admin shortcut login
      credentials = { username, password, mode: 'admin' };
    } else {
      // User login: identifier (email or username) + password
      if (!identifier || !password) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }
      credentials = { identifier, password, mode: 'user' };
    }

    const result = await login(credentials);

    if (result.success) {
      Alert.alert("Welcome", `Logged in as ${result.user?.role || 'User'}`);
      router.replace("/(authenticated)");
    } else {
      Alert.alert("Error", result.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('welcomeBack')}</Text>


      {/* Login Type Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, !isAdminLogin && styles.activeToggle]}
          onPress={() => setIsAdminLogin(false)}
        >
          <Text style={[styles.toggleText, !isAdminLogin && styles.activeToggleText]}>{t('userLogin')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, isAdminLogin && styles.activeToggle]}
          onPress={() => setIsAdminLogin(true)}
        >
          <Text style={[styles.toggleText, isAdminLogin && styles.activeToggleText]}>{t('adminLogin')}</Text>
        </TouchableOpacity>
      </View>

      {/* Input Fields */}
      {!isAdminLogin ? (
        <TextInput
          placeholder={`${t('email')} / ${t('username')} / ${t('phone') || 'Phone'}`}
          placeholderTextColor="#999"
          value={identifier}
          onChangeText={setIdentifier}
          style={styles.input}
          autoCapitalize="none"
          selectionColor="#3498db"
        />
      ) : (
        <TextInput
          placeholder={t('username')}
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
          selectionColor="#3498db"
        />
      )}

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder={t('password')}
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

      {/* Remember Me */}
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setRememberMe(!rememberMe)}
        >
          {rememberMe && <Ionicons name="checkmark" size={16} color="#3498db" />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>{t('rememberMe')}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>{t('login')}</Text>
      </TouchableOpacity>

      {/* Social Login Placeholder */}
      <View style={styles.socialContainer}>
        <Text style={styles.orText}>Or continue with</Text>
        <TouchableOpacity style={styles.googleButton}>
          <Ionicons name="logo-google" size={20} color="#db4437" />
          <Text style={styles.googleText}>Google ({t('comingSoon')})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.links}>
        <TouchableOpacity onPress={() => router.push("/signup")}>
          <Text style={styles.linkText}>{t('createAccount')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/forgot")}>
          <Text style={styles.linkText}>{t('forgotPassword')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#fff", minHeight: '100%' },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 30, color: "#2c3e50" },
  toggleContainer: { flexDirection: "row", marginBottom: 20, borderRadius: 10, overflow: "visible", borderWidth: 1, borderColor: "#ddd", width: "100%" },
  toggleButton: { flex: 1, padding: 15, alignItems: "center", backgroundColor: "#f8f9fa", minHeight: 50 },
  activeToggle: { backgroundColor: "#3498db" },
  toggleText: { fontSize: 14, fontWeight: "600", color: "#666" },
  activeToggleText: { color: "#fff" },
  demoBox: { width: "100%", backgroundColor: "#e8f5e8", borderRadius: 12, padding: 16, marginBottom: 25, borderLeftWidth: 4, borderLeftColor: "#4caf50" },
  demoTitle: { fontSize: 16, fontWeight: "bold", color: "#2e7d32", marginBottom: 8, textAlign: "center" },
  demoText: { fontSize: 14, color: "#388e3c", marginBottom: 4, textAlign: "center" },
  demoCredential: { fontWeight: "bold", backgroundColor: "#c8e6c9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, color: "#1b5e20" },
  input: { width: "100%", padding: 15, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, marginBottom: 15, minHeight: 50, fontSize: 16, color: "#000", backgroundColor: "#fff" },
  passwordContainer: { width: "100%", flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 10, marginBottom: 15, minHeight: 50 },
  passwordInput: { flex: 1, padding: 15, fontSize: 16 },
  eyeButton: { padding: 15, minWidth: 50, alignItems: "center", justifyContent: "center" },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20, width: "100%", minHeight: 30 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: "#ccc", borderRadius: 4, marginRight: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  checkboxText: { fontSize: 14, color: "#666", flex: 1 },
  button: { backgroundColor: "#3498db", padding: 18, borderRadius: 10, width: "100%", alignItems: "center", marginBottom: 20, minHeight: 55 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  socialContainer: { width: "100%", alignItems: "center", marginBottom: 20 },
  orText: { fontSize: 14, color: "#666", marginBottom: 15 },
  googleButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 15, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, width: "100%", backgroundColor: "#fff", minHeight: 50 },
  googleText: { marginLeft: 10, fontSize: 16, color: "#666" },
  links: { marginTop: 20, flexDirection: "row", justifyContent: "space-between", width: "100%", minHeight: 30 },
  linkText: { color: "#3498db", fontWeight: "bold", fontSize: 16, padding: 5 },
});
