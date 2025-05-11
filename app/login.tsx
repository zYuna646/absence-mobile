import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextStyle,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/context/UserContext";

// Import reusable components
import FloatingLabelInput from "@/components/FloatingLabelInput";
import AppLogo from "@/components/AppLogo";
import PrimaryButton from "@/components/PrimaryButton";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const colorScheme = useColorScheme();
  const colors = useThemeColor();
  const { login, isLoading, isLoggedIn, error } = useUser();

  // If already logged in, redirect to main app
  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/(tabs)");
    }
  }, [isLoggedIn]);

  // Sync error states
  useEffect(() => {
    if (error) {
      setLoginError(error);
    }
  }, [error]);

  const handleLogin = async () => {
    // Clear previous errors
    setLoginError(null);

    // Validate form
    if (!username || !username.trim()) {
      setLoginError("Username wajib diisi");
      return;
    }

    if (!password || !password.trim()) {
      setLoginError("Password wajib diisi");
      return;
    }

    try {
      // Call API login - role will be retrieved from the auth/session endpoint
      const success = await login(username, password);

      if (success) {
        // Login successful, the useEffect hook will handle navigation
      } else {
        // API login failed with error, already handled by the context
      }
    } catch (err) {
      setLoginError("Terjadi kesalahan. Silakan coba lagi.");
    }
  };

  const handleForgotPassword = () => {
    // Show alert with reset password instructions
    Alert.alert(
      "Reset Password",
      "Silahkan hubungi administrator untuk reset password Anda.",
      [
        {
          text: "OK",
          onPress: () => console.log("OK Pressed"),
        },
      ]
    );
  };
  
  const handleRegister = () => {
    router.navigate("/register");
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const placeholderTextColor = colorScheme === "dark" ? "#9BA1A6" : "#687076";

  const inputStyle: TextStyle = {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    color: colors.text,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      <AppLogo size="large" showSubtitle={true} />

      <View style={styles.formContainer}>
        <FloatingLabelInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          inputStyle={inputStyle}
          placeholderTextColor={placeholderTextColor}
          autoCapitalize="none"
          disabled={isLoading}
        />

        <View style={styles.spacer} />

        <FloatingLabelInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!passwordVisible}
          inputStyle={inputStyle}
          placeholderTextColor={placeholderTextColor}
          disabled={isLoading}
          isPassword={true}
          togglePasswordVisibility={togglePasswordVisibility}
          passwordVisible={passwordVisible}
        />

        <TouchableOpacity
          style={styles.forgotPasswordContainer}
          onPress={handleForgotPassword}
          disabled={isLoading}
        >
          <Text style={[styles.forgotPasswordText, { color: colors.tint }]}>
            Lupa Password?
          </Text>
        </TouchableOpacity>

        {loginError && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {loginError}
          </Text>
        )}

        <PrimaryButton
          label="Masuk"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          style={styles.loginButton}
        />
        
        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: colors.text }]}>
            Belum memiliki akun?
          </Text>
          <TouchableOpacity onPress={handleRegister}>
            <Text style={[styles.registerLink, { color: colors.tint }]}>
              Daftar Sekarang
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginTop: 8,
    marginBottom: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
  },
  spacer: {
    height: 16,
  },
  loginButton: {
    marginTop: 20,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    paddingVertical: 8,
  },
  registerText: {
    fontSize: 14,
    marginRight: 4,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "bold",
  }
});
