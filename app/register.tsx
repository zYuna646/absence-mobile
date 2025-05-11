import React, { useState } from "react";
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { api } from "@/services/api";

// Import reusable components
import StepIndicator from "@/components/ui/StepIndicator";
import PrimaryButton from "@/components/PrimaryButton";
import AppLogo from "@/components/AppLogo";

// Registration step screens
import RoleSelection from "@/components/register/RoleSelection";
import BiodataForm from "@/components/register/BiodataForm";
import AccountForm from "@/components/register/AccountForm";

// Types
type Role = "mahasiswa" | "preseptor_akademik" |  "";
type Gender = "Laki-laki" | "Perempuan" | "";

interface RegistrationData {
  // Role step
  role: Role;
  
  // Biodata step
  name: string;
  gender: Gender;
  birthday: string;
  student_id: string;
  group_id: number | null;
  stase_id: number | null;
  phone: string;
  
  // Fields for preseptor_akademik
  type: string;
  npwp: string;
  nip: string;
  location: string;
  room: string;
  
  // Account step
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterScreen() {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Define the steps
  const steps = ["Pilih Role", "Biodata", "Akun"];
  
  // State for form data
  const [formData, setFormData] = useState<RegistrationData>({
    // Role
    role: "",
    
    // Biodata
    name: "",
    gender: "",
    birthday: "",
    student_id: "",
    group_id: null,
    stase_id: null,
    phone: "",
    
    // Fields for preseptor_akademik
    type: "clinic",
    npwp: "",
    nip: "",
    location: "",
    room: "",
    
    // Account
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  
  // Handle form data changes
  const handleChange = (field: keyof RegistrationData | string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle role change specifically for the RoleSelection component
  const handleRoleChange = (role: Role) => {
    setFormData(prev => ({
      ...prev,
      role
    }));
  };
  
  // Validate current step
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Role selection
        if (!formData.role) {
          Alert.alert("Error", "Silakan pilih role Anda");
          return false;
        }
        return true;
        
      case 2: // Biodata
        if (!formData.name) {
          Alert.alert("Error", "Nama wajib diisi");
          return false;
        }
        if (!formData.gender) {
          Alert.alert("Error", "Jenis kelamin wajib dipilih");
          return false;
        }
        if (!formData.birthday) {
          Alert.alert("Error", "Tanggal lahir wajib diisi");
          return false;
        }
        if (formData.role === "mahasiswa") {
          if (!formData.student_id) {
            Alert.alert("Error", "NIM wajib diisi");
            return false;
          }
          if (formData.group_id === null) {
            Alert.alert("Error", "Kelompok wajib dipilih");
            return false;
          }
        } else if (formData.role === "preseptor_akademik") {
          if (formData.stase_id === null) {
            Alert.alert("Error", "Stase wajib dipilih");
            return false;
          }
          if (!formData.nip) {
            Alert.alert("Error", "NIP wajib diisi");
            return false;
          }
          if (!formData.npwp) {
            Alert.alert("Error", "NPWP wajib diisi");
            return false;
          }
          if (!formData.location) {
            Alert.alert("Error", "Lokasi wajib diisi");
            return false;
          }
          if (!formData.room) {
            Alert.alert("Error", "Ruangan wajib diisi");
            return false;
          }
        }
        return true;
        
      case 3: // Account
        if (!formData.email) {
          Alert.alert("Error", "Email wajib diisi");
          return false;
        }
        if (!formData.username) {
          Alert.alert("Error", "Username wajib diisi");
          return false;
        }
        if (!formData.password) {
          Alert.alert("Error", "Password wajib diisi");
          return false;
        }
        
        // Check password complexity
        const passwordValidation = {
          minLength: formData.password.length >= 8,
          hasLower: /[a-z]/.test(formData.password),
          hasUpper: /[A-Z]/.test(formData.password),
          hasNumber: /[0-9]/.test(formData.password),
          hasSpecial: /[@$!%*?&]/.test(formData.password)
        };
        
        if (!passwordValidation.minLength) {
          Alert.alert("Error", "Password minimal 8 karakter");
          return false;
        }
        if (!passwordValidation.hasLower) {
          Alert.alert("Error", "Password harus mengandung huruf kecil");
          return false;
        }
        if (!passwordValidation.hasUpper) {
          Alert.alert("Error", "Password harus mengandung huruf besar");
          return false;
        }
        if (!passwordValidation.hasNumber) {
          Alert.alert("Error", "Password harus mengandung angka");
          return false;
        }
        if (!passwordValidation.hasSpecial) {
          Alert.alert("Error", "Password harus mengandung karakter spesial (@$!%*?&)");
          return false;
        }
        
        if (formData.password !== formData.confirmPassword) {
          Alert.alert("Error", "Password dan konfirmasi password tidak cocok");
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };
  
  // Handle next step button press
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };
  
  // Handle back button press
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };
  
  // Handle submit registration
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Process data based on role
      let apiData: any;
      let result;
      
      // Format birthday in dd-mm-yyyy format
      // The date is already in the correct format from BiodataForm component
      // No need to reformat, just validate that it's correct
      const dateFormatRegex = /^\d{2}-\d{2}-\d{4}$/;
      if (!dateFormatRegex.test(formData.birthday)) {
        console.error("Invalid date format:", formData.birthday);
        Alert.alert("Error", "Format tanggal lahir tidak valid");
        setIsLoading(false);
        return;
      }
      
      if (formData.role === "mahasiswa") {
        apiData = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          birthday: formData.birthday, // already in dd-mm-yyyy format
          gender: formData.gender,
          student_id: formData.student_id,
          group_id: formData.group_id!,
          password: formData.password
        };
        
        console.log("Submitting student data:", apiData);
        result = await api.registerStudent(apiData);
      } else if (formData.role === "preseptor_akademik") {
        apiData = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          birthday: formData.birthday, // already in dd-mm-yyyy format
          gender: formData.gender,
          stase_id: formData.stase_id!,
          type: formData.type,
          npwp: formData.npwp,
          nip: formData.nip,
          location: formData.location,
          room: formData.room,
          password: formData.password
        };
        
        console.log("Submitting advisor data:", apiData);
        result = await api.registerAdvisor(apiData);
      } else {
        throw new Error("Invalid role");
      }
      
      console.log("Registration response:", result);
      
      if (!result) {
        throw new Error("No response from server");
      }
      
      if (!result.success) {
        throw new Error(result.message || "Registration failed");
      }
      
      // Show success message
      Alert.alert(
        "Pendaftaran Berhasil", 
        result.message || "Akun Anda telah berhasil dibuat. Silakan login.",
        [
          { 
            text: "OK", 
            onPress: () => router.replace("/login") 
          }
        ]
      );
    } catch (error) {
      // Log the error for debugging
      console.error("Registration error:", error);
      
      // Show error message with more details when available
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      Alert.alert(
        "Pendaftaran Gagal", 
        `Terjadi kesalahan saat mendaftarkan akun Anda: ${errorMessage}`
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render the current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <RoleSelection 
            value={formData.role}
            onChange={handleRoleChange}
          />
        );
        
      case 2:
        return (
          <BiodataForm 
            formData={formData}
            onChange={handleChange}
          />
        );
        
      case 3:
        return (
          <AccountForm 
            formData={formData}
            onChange={handleChange}
          />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <AppLogo size="medium" showSubtitle={true} />
          
          <StepIndicator steps={steps} currentStep={currentStep} />
          
          <View style={styles.formContainer}>
            {renderStepContent()}
          </View>
          
          <View style={styles.buttonContainer}>
            <PrimaryButton
              label={currentStep === 1 ? "Batal" : "Kembali"}
              onPress={handlePrevStep}
              style={styles.buttonCancel}
              textStyle={{ color: 'white' }}
            />
            <PrimaryButton
              label={currentStep === steps.length ? "Daftar" : "Lanjut"}
              onPress={handleNextStep}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    justifyContent: "center",
  },
  formContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 0.48,
  },
  buttonCancel: {
    flex: 0.48,
    backgroundColor: "#6c757d",
  },
}); 