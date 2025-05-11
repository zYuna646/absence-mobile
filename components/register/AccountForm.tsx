import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import FloatingLabelInput from "@/components/FloatingLabelInput";

interface AccountFormProps {
  formData: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
  };
  onChange: (field: string, value: string) => void;
}

/**
 * Account form component for registration
 */
const AccountForm: React.FC<AccountFormProps> = ({ formData, onChange }) => {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLower: false,
    hasUpper: false,
    hasNumber: false,
    hasSpecial: false
  });
  
  // Check password strength
  useEffect(() => {
    const password = formData.password;
    setPasswordValidation({
      minLength: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[@$!%*?&]/.test(password)
    });
  }, [formData.password]);
  
  // Input style
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
  
  // Error input style
  const errorInputStyle: TextStyle = {
    ...inputStyle,
    borderColor: colors.error
  };
  
  // Placeholder text color
  const placeholderTextColor = colorScheme === "dark" ? "#9BA1A6" : "#687076";
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };
  
  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };
  
  // Check if passwords match
  const passwordsMatch = formData.password === formData.confirmPassword;
  const shouldShowError = formData.confirmPassword !== "" && !passwordsMatch;
  
  // Check if password is valid
  const isPasswordValid = Object.values(passwordValidation).every(value => value);

  // Render validation item
  const renderValidationItem = (isValid: boolean, text: string) => (
    <View style={styles.validationItem}>
      <Ionicons 
        name={isValid ? "checkmark-circle" : "close-circle"} 
        size={16} 
        color={isValid ? colors.success : colors.error} 
      />
      <Text style={[styles.validationText, { color: colors.text }]}>
        {text}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Informasi Akun
      </Text>
      
      <FloatingLabelInput
        label="Email"
        value={formData.email}
        onChangeText={(value) => onChange("email", value)}
        inputStyle={inputStyle}
        placeholderTextColor={placeholderTextColor}
        keyboardType="email-address"
        autoCapitalize="none"
        disabled={false}
      />
      
      <View style={styles.spacer} />
      
      <FloatingLabelInput
        label="Username"
        value={formData.username}
        onChangeText={(value) => onChange("username", value)}
        inputStyle={inputStyle}
        placeholderTextColor={placeholderTextColor}
        autoCapitalize="none"
        disabled={false}
      />
      
      <View style={styles.spacer} />
      
      <FloatingLabelInput
        label="Password"
        value={formData.password}
        onChangeText={(value) => onChange("password", value)}
        inputStyle={!isPasswordValid && formData.password.length > 0 ? errorInputStyle : inputStyle}
        placeholderTextColor={placeholderTextColor}
        secureTextEntry={!passwordVisible}
        autoCapitalize="none"
        disabled={false}
        isPassword={true}
        togglePasswordVisibility={togglePasswordVisibility}
        passwordVisible={passwordVisible}
      />
      
      {formData.password.length > 0 && (
        <View style={styles.validationContainer}>
          {renderValidationItem(passwordValidation.minLength, "Minimal 8 karakter")}
          {renderValidationItem(passwordValidation.hasLower, "Mengandung huruf kecil")}
          {renderValidationItem(passwordValidation.hasUpper, "Mengandung huruf besar")}
          {renderValidationItem(passwordValidation.hasNumber, "Mengandung angka")}
          {renderValidationItem(passwordValidation.hasSpecial, "Mengandung karakter spesial (@$!%*?&)")}
        </View>
      )}
      
      <View style={styles.spacer} />
      
      <FloatingLabelInput
        label="Konfirmasi Password"
        value={formData.confirmPassword}
        onChangeText={(value) => onChange("confirmPassword", value)}
        inputStyle={shouldShowError ? errorInputStyle : inputStyle}
        placeholderTextColor={placeholderTextColor}
        secureTextEntry={!confirmPasswordVisible}
        autoCapitalize="none"
        disabled={false}
        isPassword={true}
        togglePasswordVisibility={toggleConfirmPasswordVisibility}
        passwordVisible={confirmPasswordVisible}
      />
      
      {shouldShowError && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          Password dan konfirmasi password tidak cocok
        </Text>
      )}
      
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle" size={18} color={colors.icon} />
        <Text style={[styles.infoText, { color: colors.icon }]}>
          Password harus terdiri dari minimal 8 karakter
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 24,
  },
  spacer: {
    height: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  infoText: {
    fontSize: 12,
    marginLeft: 8,
  },
  validationContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  validationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  validationText: {
    fontSize: 12,
    marginLeft: 8,
  }
});

export default AccountForm; 