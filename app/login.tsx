import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  TextStyle,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser, UserRole } from "@/context/UserContext";

// Dummy data for supervisor dropdown
const SUPERVISORS = [
  { id: "1", name: "Dr. Ahmad Surya" },
  { id: "2", name: "Prof. Budi Santoso" },
  { id: "3", name: "Dr. Citra Dewi" },
  { id: "4", name: "Prof. Dimas Purnomo" },
  { id: "5", name: "Dr. Eva Rahmadhani" },
];

// Interface for FloatingLabelInput props
interface FloatingLabelInputProps extends Omit<TextInputProps, "style"> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  disabled?: boolean;
  inputStyle: TextStyle;
  placeholderTextColor: string;
  isPassword?: boolean;
  togglePasswordVisibility?: () => void;
  passwordVisible?: boolean;
}

// Custom Floating Label Input Component
const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  disabled = false,
  inputStyle,
  placeholderTextColor,
  isPassword = false,
  togglePasswordVisibility,
  passwordVisible,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedIsFocused = useState(new Animated.Value(value ? 1 : 0))[0];
  const colors = useThemeColor();

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, animatedIsFocused]);

  const labelStyle = {
    position: "absolute" as "absolute",
    left: 16,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [placeholderTextColor, colors.tint],
    }),
    backgroundColor: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ["transparent", inputStyle.backgroundColor as string],
    }),
    paddingHorizontal: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 5],
    }),
    zIndex: 1,
  };

  return (
    <View style={styles.inputContainer}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <TextInput
        style={[
          inputStyle,
          styles.floatingInput,
          isPassword && { paddingRight: 50 }, // Add padding for the eye icon
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={secureTextEntry}
        editable={!disabled}
        blurOnSubmit
        {...props}
      />
      {isPassword && togglePasswordVisibility && (
        <TouchableOpacity
          style={styles.eyeIconContainer}
          onPress={togglePasswordVisibility}
          disabled={disabled}
        >
          <Ionicons
            name={passwordVisible ? "eye-off" : "eye"}
            size={22}
            color={colors.icon}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [supervisor, setSupervisor] = useState("");
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

      <View style={styles.logoContainer}>
        <Text style={[styles.welcomeText, { color: colors.text }]}>
          Selamat Datang
        </Text>
        <Text style={[styles.logoText, { color: colors.tint }]}>DI SIKAD</Text>
        <Text style={[styles.subtitleText, { color: colors.tint }]}>
          Sistem Informasi Kehadiran
        </Text>
      </View>

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

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.tint },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>Masuk</Text>
          )}
        </TouchableOpacity>
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "bold",
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 8,
  },
  subtitleText: {
    fontSize: 16,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    marginBottom: 5,
    position: "relative",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  floatingInput: {
    paddingTop: 16,
    height: 60,
  },
  eyeIconContainer: {
    position: "absolute",
    right: 16,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: Platform.OS === "ios" ? 120 : 50,
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
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
  },
  spacer: {
    height: 16,
  },
});
