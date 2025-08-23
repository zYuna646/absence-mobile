import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/context/UserContext";
import {
  api,
  AdvisorProfileUpdateData,
  StaseData,
  GroupData,
} from "@/services/api";
import PrimaryButton from "@/components/PrimaryButton";
import DateTimePicker from "@react-native-community/datetimepicker";
import Card from "@/components/ui/Card";

// Define local interface for student form
interface StudentForm {
  name: string;
  username: string;
  email: string;
  phone: string;
  birthday: string;
  gender: string;
  student_id: string;
  group_id: number;
  stase_id: number;
}

// Add password form interface
interface PasswordForm {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export default function ProfileScreen() {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();
  const { role, userInfo, token, setUserInfo } = useUser();

  // Student form state
  const [studentForm, setStudentForm] = useState<StudentForm>({
    name: "",
    username: "",
    email: "",
    phone: "",
    birthday: "",
    gender: "",
    student_id: "",
    group_id: 0,
    stase_id: 0
  });

  // Advisor form state
  const [advisorForm, setAdvisorForm] = useState<AdvisorProfileUpdateData>({
    name: "",
    username: "",
    email: "",
    phone: "",
    birthday: "",
    gender: "",
    stase_id: 0,
    type: "clinic",
    npwp: "",
    nip: "",
    location: "",
    room: "",
  });

  // Add password form state
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stases, setStases] = useState<StaseData[]>([]);
  const [loadingStases, setLoadingStases] = useState(false);

  // Add new state for groups
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Add animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  // Add animation on component mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Load user data into form
  useEffect(() => {
    if (userInfo) {
      if (role === "student") {
        setStudentForm({
          name: userInfo.name || "",
          username: userInfo.username || "",
          email: userInfo.email || "",
          phone: userInfo.phone || "",
          birthday: userInfo.birthday || "",
          gender: userInfo.gender || "",
          student_id: userInfo.student_id || "",
          group_id: userInfo.group?.id || 0,
          stase_id: userInfo.stace?.id || 0  // Use stace_id from new API response
        });

        // Load stases
        if (token) {
          loadStases();
          // If stace_id exists, load groups
          if (userInfo.stace_id) {
            loadGroups(userInfo.stace_id);
          }
        }
      } else if (role === "advisor") {
        setAdvisorForm({
          name: userInfo.name || "",
          username: userInfo.username || "",
          email: userInfo.email || "",
          phone: userInfo.phone || "",
          birthday: userInfo.birthday || "",
          gender: userInfo.gender || "",
          stase_id: userInfo.stace_id || 0,  // Use stace_id from new API response
          type: userInfo.type || "clinic",
          npwp: userInfo.npwp || "",
          nip: userInfo.nip || "",
          location: userInfo.location || "",
          room: userInfo.room || "",
        });
      }
    }
  }, [userInfo, role]);

  // Load stases for advisor form
  useEffect(() => {
    if (role === "advisor" && token) {
      loadStases();
    }
  }, [role, token]);

  // Load stases from API
  const loadStases = async () => {
    if (!token) return;

    try {
      setLoadingStases(true);
      const response = await api.getStases(token);
      
      if (response.success && response.data) {
        setStases(response.data);
      } else {
        console.error("Failed to load stases:", response.message);
      }
    } catch (error) {
      console.error("Error loading stases:", error);
    } finally {
      setLoadingStases(false);
    }
  };

  // Load groups based on selected stase
  const loadGroups = async (staseId: number) => {
    if (!token) return;

    try {
      setLoadingGroups(true);
      const response = await api.getGroupsByStase(staseId);
      
      if (response.success && response.data) {
        setGroups(response.data);
      } else {
        console.error("Failed to load groups:", response.message);
      }
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Handle stase selection
  const handleStaseSelect = async (staseId: number) => {
    setStudentForm(prev => ({
      ...prev,
      stase_id: staseId,
      group_id: 0 // Reset group selection when stase changes
    }));
    
    if (staseId) {
      await loadGroups(staseId);
    } else {
      setGroups([]);
    }
  };

  // Update handleStudentInputChange function
  const handleStudentInputChange = (field: keyof StudentForm, value: string | number) => {
    setStudentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle input change for advisor form
  const handleAdvisorInputChange = (field: keyof AdvisorProfileUpdateData, value: string) => {
    setAdvisorForm((prev) => ({
      ...prev,
      [field]: field === "stase_id" ? parseInt(value) || 0 : value,
    }));
  };

  // Handle password form change
  const handlePasswordChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle password visibility toggle
  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle date change from date picker
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      const formattedDate = formatDate(selectedDate);
      
      if (role === "student") {
        handleStudentInputChange("birthday", formattedDate);
      } else if (role === "advisor") {
        handleAdvisorInputChange("birthday", formattedDate);
      }
    }
  };

console.log(userInfo);
  // Format date for API
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format date for display
  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return "";
    
    try {
      // Parse date from dd-mm-yyyy format
      const [day, month, year] = dateString.split("-");
      // Create a date object (months are 0-indexed in JavaScript)
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      
      // Format for display
      const displayDay = String(date.getDate()).padStart(2, "0");
      const displayMonth = date.toLocaleString("default", { month: "long" });
      const displayYear = date.getFullYear();
      
      return `${displayDay} ${displayMonth} ${displayYear}`;
    } catch (error) {
      console.error("Error formatting display date:", error);
      return dateString;
    }
  };

  // Toggle date picker
  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  // Handle save for student profile
  const saveStudentProfile = async () => {
    if (!token) return;

    // Validate inputs
    if (!studentForm.name || !studentForm.email || !studentForm.phone) {
      Alert.alert("Validation Error", "Mohon lengkapi semua field yang diperlukan");
      return;
    }

    if (!studentForm.stase_id) {
      Alert.alert("Validation Error", "Mohon pilih stase");
      return;
    }

    if (!studentForm.group_id) {
      Alert.alert("Validation Error", "Mohon pilih kelompok");
      return;
    }

    try {
      setSaving(true);

      // Prepare data for API
      const apiData = {
        name: studentForm.name.trim(),
        username: studentForm.username.trim(),
        email: studentForm.email.trim(),
        phone: studentForm.phone.trim(),
        birthday: studentForm.birthday,
        gender: studentForm.gender,
        group_id: studentForm.group_id,
        student_id: studentForm.student_id.trim()
      };

      const response = await api.updateStudentProfile(token, apiData);
      
      if (response.success && response.data) {
        Alert.alert("Sukses", "Profil berhasil diperbarui");
        setUserInfo(response.data);
      } else {
        Alert.alert("Error", response.message || "Gagal memperbarui profil");
      }
    } catch (error) {
      console.error("Error updating student profile:", error);
      Alert.alert("Error", "Terjadi kesalahan saat memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  // Handle save for advisor profile
  const saveAdvisorProfile = async () => {
    if (!token) return;

    // Validate inputs
    if (!advisorForm.name || !advisorForm.email || !advisorForm.phone) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    if (advisorForm.type === "academic" && (!advisorForm.npwp || !advisorForm.nip)) {
      Alert.alert("Validation Error", "NPWP and NIP are required for academic advisors");
      return;
    }

    if (advisorForm.type === "clinic" && (!advisorForm.location || !advisorForm.room)) {
      Alert.alert("Validation Error", "Location and room are required for clinic advisors");
      return;
    }

    try {
      setSaving(true);
      const response = await api.updateAdvisorProfile(token, advisorForm);
      
      if (response.success && response.data) {
        Alert.alert("Success", "Profile updated successfully");
        setUserInfo(response.data);
      } else {
        Alert.alert("Error", response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating advisor profile:", error);
      Alert.alert("Error", "An error occurred while updating your profile");
    } finally {
      setSaving(false);
    }
  };

  // Handle password update
  const handleUpdatePassword = async () => {
    // Validate password
    if (!passwordForm.current_password) {
      Alert.alert("Error", "Password saat ini wajib diisi");
      return;
    }
    if (!passwordForm.new_password) {
      Alert.alert("Error", "Password baru wajib diisi");
      return;
    }
    if (!passwordForm.new_password_confirmation) {
      Alert.alert("Error", "Konfirmasi password wajib diisi");
      return;
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      Alert.alert("Error", "Password baru dan konfirmasi tidak cocok");
      return;
    }

    // Check password complexity
    const passwordValidation = {
      minLength: passwordForm.new_password.length >= 8,
      hasLower: /[a-z]/.test(passwordForm.new_password),
      hasUpper: /[A-Z]/.test(passwordForm.new_password),
      hasNumber: /[0-9]/.test(passwordForm.new_password),
      hasSpecial: /[@$!%*?&]/.test(passwordForm.new_password)
    };

    if (!passwordValidation.minLength) {
      Alert.alert("Error", "Password minimal 8 karakter");
      return;
    }
    if (!passwordValidation.hasLower) {
      Alert.alert("Error", "Password harus mengandung huruf kecil");
      return;
    }
    if (!passwordValidation.hasUpper) {
      Alert.alert("Error", "Password harus mengandung huruf besar");
      return;
    }
    if (!passwordValidation.hasNumber) {
      Alert.alert("Error", "Password harus mengandung angka");
      return;
    }
    if (!passwordValidation.hasSpecial) {
      Alert.alert("Error", "Password harus mengandung karakter spesial (@$!%*?&)");
      return;
    }

    try {
      setUpdatingPassword(true);
      const response = await api.updatePassword(token!, passwordForm);

      if (response.success) {
        Alert.alert("Sukses", "Password berhasil diperbarui");
        // Reset form
        setPasswordForm({
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
      } else {
        Alert.alert("Error", response.message || "Gagal memperbarui password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      Alert.alert("Error", "Terjadi kesalahan saat memperbarui password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Change advisor type
  const handleTypeChange = (type: string) => {
    handleAdvisorInputChange("type", type);
  };

  // Enhanced student form render
  const renderStudentForm = () => {
    return (
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <Card title="Informasi Pribadi">
          <View style={styles.formContainer}>
            <View style={styles.inputRow}>
              <View style={[styles.inputColumn, { marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Nama Lengkap</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
                  ]}
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor={colors.icon}
                  value={studentForm.name}
                  onChangeText={(text) => handleStudentInputChange("name", text)}
                />
              </View>
              
              <View style={[styles.inputColumn, { marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>NIM</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
                  ]}
                  placeholder="Masukkan NIM"
                  placeholderTextColor={colors.icon}
                  value={studentForm.student_id}
                  onChangeText={(text) => handleStudentInputChange("student_id", text)}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Username</Text>
              <View style={styles.disabledInputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.disabledInput,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.text,
                      borderColor: colors.inputBorder,
                    }
                  ]}
                  placeholder="Username"
                  placeholderTextColor={colors.icon}
                  value={studentForm.username}
                  editable={false}
                />
                <Ionicons name="lock-closed" size={16} color={colors.icon} style={styles.lockIcon} />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputColumn, { marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
                  ]}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.icon}
                  value={studentForm.email}
                  onChangeText={(text) => handleStudentInputChange("email", text)}
                  keyboardType="email-address"
                />
              </View>
              
              <View style={[styles.inputColumn, { marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Telepon</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
                  ]}
                  placeholder="08xx-xxxx-xxxx"
                  placeholderTextColor={colors.icon}
                  value={studentForm.phone}
                  onChangeText={(text) => handleStudentInputChange("phone", text)}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputColumn, { marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Tanggal Lahir</Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    styles.dateSelector,
                    { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }
                  ]}
                  onPress={toggleDatePicker}
                >
                  <Text style={{ color: studentForm.birthday ? colors.text : colors.icon }}>
                    {studentForm.birthday ? formatDisplayDate(studentForm.birthday) : "Pilih tanggal"}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={colors.icon} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.inputColumn, { marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Jenis Kelamin</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      studentForm.gender === "Laki-laki" && { backgroundColor: colors.tint + '20', borderColor: colors.tint }
                    ]}
                    onPress={() => handleStudentInputChange("gender", "Laki-laki")}
                  >
                    <Text style={[
                      styles.genderText,
                      { color: studentForm.gender === "Laki-laki" ? colors.tint : colors.text }
                    ]}>
                      L
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      studentForm.gender === "Perempuan" && { backgroundColor: colors.tint + '20', borderColor: colors.tint }
                    ]}
                    onPress={() => handleStudentInputChange("gender", "Perempuan")}
                  >
                    <Text style={[
                      styles.genderText,
                      { color: studentForm.gender === "Perempuan" ? colors.tint : colors.text }
                    ]}>
                      P
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <PrimaryButton
              label="Simpan Profil"
              onPress={saveStudentProfile}
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
            />
          </View>
        </Card>

        {/* Current Group Information */}
        {userInfo && (userInfo.stace_name || userInfo.group_name) && (
          <Card title="Informasi Kelompok Saat Ini">
            <View style={styles.formContainer}>
              {userInfo.stace_name && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Stase Aktif</Text>
                  <View style={[
                    styles.input,
                    styles.disabledInput,
                    { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }
                  ]}>
                    <Text style={[{ color: colors.text, fontSize: 16, lineHeight: 48 }]}>
                      {userInfo.stace_name}
                    </Text>
                  </View>
                </View>
              )}
              
              {userInfo.group_name && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Kelompok Aktif</Text>
                  <View style={[
                    styles.input,
                    styles.disabledInput,
                    { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }
                  ]}>
                    <Text style={[{ color: colors.text, fontSize: 16, lineHeight: 48 }]}>
                      {userInfo.group_name}
                    </Text>
                  </View>
                </View>
              )}
              
              {userInfo.group_status && (
                <View style={styles.inputRow}>
                  <View style={[styles.inputColumn, { marginRight: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Status Kelompok</Text>
                    <View style={[
                      styles.input,
                      styles.disabledInput,
                      { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }
                    ]}>
                      <Text style={[{ 
                        color: userInfo.group_status === 'running' ? colors.tint : colors.text, 
                        fontSize: 16, 
                        lineHeight: 48,
                        fontWeight: userInfo.group_status === 'running' ? '600' : 'normal'
                      }]}>
                        {userInfo.group_status === 'running' ? 'Aktif' : userInfo.group_status}
                      </Text>
                    </View>
                  </View>
                  
                  {userInfo.group_start_date && userInfo.group_end_date && (
                    <View style={[styles.inputColumn, { marginLeft: 8 }]}>
                      <Text style={[styles.label, { color: colors.text }]}>Periode</Text>
                      <View style={[
                        styles.input,
                        styles.disabledInput,
                        { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }
                      ]}>
                        <Text style={[{ color: colors.text, fontSize: 14, lineHeight: 48 }]}>
                          {new Date(userInfo.group_start_date).toLocaleDateString('id-ID')} - {new Date(userInfo.group_end_date).toLocaleDateString('id-ID')}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </Card>
        )}

        <Card title="Informasi Akademik">
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Stase</Text>
              <View style={[styles.dropdownContainer, { backgroundColor: colors.background }]}>
                {loadingStases ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.tint} />
                    <Text style={{ color: colors.text, marginLeft: 8 }}>Loading stases...</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.dropdownScrollView}>
                    {stases.map((stase) => (
                      <TouchableOpacity
                        key={stase.id}
                        style={[
                          styles.dropdownItem,
                          studentForm.stase_id === stase.id && {
                            backgroundColor: colors.tint + '20',
                          },
                        ]}
                        onPress={() => handleStaseSelect(stase.id)}
                      >
                        <View style={styles.dropdownItemContent}>
                          <Text
                            style={[
                              styles.dropdownItemText,
                              { color: colors.text },
                              studentForm.stase_id === stase.id && { color: colors.tint, fontWeight: "bold" },
                            ]}
                          >
                            {stase.name}
                          </Text>
                          {studentForm.stase_id === stase.id && (
                            <Ionicons name="checkmark" size={20} color={colors.tint} />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Kelompok</Text>
              <View style={[styles.dropdownContainer, { backgroundColor: colors.background }]}>
                {loadingGroups ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.tint} />
                    <Text style={{ color: colors.text, marginLeft: 8 }}>Loading groups...</Text>
                  </View>
                ) : !studentForm.stase_id ? (
                  <View style={[styles.dropdownPlaceholder, { borderColor: colors.inputBorder }]}>
                    <Text style={[styles.placeholderText, { color: colors.icon }]}>
                      Pilih stase terlebih dahulu
                    </Text>
                  </View>
                ) : groups.length === 0 ? (
                  <View style={[styles.dropdownPlaceholder, { borderColor: colors.inputBorder }]}>
                    <Text style={[styles.placeholderText, { color: colors.icon }]}>
                      Tidak ada kelompok tersedia untuk stase ini
                    </Text>
                  </View>
                ) : (
                  <ScrollView style={styles.dropdownScrollView}>
                    {groups.map((group) => (
                      <TouchableOpacity
                        key={group.id}
                        style={[
                          styles.dropdownItem,
                          studentForm.group_id === group.id && {
                            backgroundColor: colors.tint + '20',
                          },
                        ]}
                        onPress={() => handleStudentInputChange("group_id", group.id)}
                      >
                        <View style={styles.dropdownItemContent}>
                          <Text
                            style={[
                              styles.dropdownItemText,
                              { color: colors.text },
                              studentForm.group_id === group.id && { color: colors.tint, fontWeight: "bold" },
                            ]}
                          >
                            {group.name}
                          </Text>
                          {studentForm.group_id === group.id && (
                            <Ionicons name="checkmark" size={20} color={colors.tint} />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  // Render advisor profile form
  const renderAdvisorForm = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={[styles.formTitle, { color: colors.text }]}>
          Advisor Profile
        </Text>

        {/* Informasi kelompok untuk advisor telah dipindahkan ke halaman dashboard */}

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Name</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
            ]}
            placeholder="Enter your name"
            placeholderTextColor={colors.icon}
            value={advisorForm.name}
            onChangeText={(text) => handleAdvisorInputChange("name", text)}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Username</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                color: colors.text,
                borderColor: colors.inputBorder,
                opacity: 0.7,
              }
            ]}
            placeholder="Username"
            placeholderTextColor={colors.icon}
            value={advisorForm.username}
            editable={false}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
            ]}
            placeholder="Enter your email"
            placeholderTextColor={colors.icon}
            value={advisorForm.email}
            onChangeText={(text) => handleAdvisorInputChange("email", text)}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
            ]}
            placeholder="Enter your phone number"
            placeholderTextColor={colors.icon}
            value={advisorForm.phone}
            onChangeText={(text) => handleAdvisorInputChange("phone", text)}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Birthday</Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dateSelector,
              { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }
            ]}
            onPress={toggleDatePicker}
          >
            <Text style={{ color: advisorForm.birthday ? colors.text : colors.icon }}>
              {advisorForm.birthday ? formatDisplayDate(advisorForm.birthday) : "Select your birthday"}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleAdvisorInputChange("gender", "Laki-laki")}
            >
              <View
                style={[
                  styles.radioCircle,
                  advisorForm.gender === "Laki-laki" && { borderColor: colors.tint }
                ]}
              >
                {advisorForm.gender === "Laki-laki" && (
                  <View style={[styles.selectedRadio, { backgroundColor: colors.tint }]} />
                )}
              </View>
              <Text style={[styles.radioLabel, { color: colors.text }]}>Laki-laki</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleAdvisorInputChange("gender", "Perempuan")}
            >
              <View
                style={[
                  styles.radioCircle,
                  advisorForm.gender === "Perempuan" && { borderColor: colors.tint }
                ]}
              >
                {advisorForm.gender === "Perempuan" && (
                  <View style={[styles.selectedRadio, { backgroundColor: colors.tint }]} />
                )}
              </View>
              <Text style={[styles.radioLabel, { color: colors.text }]}>Perempuan</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Advisor Type</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleTypeChange("academic")}
            >
              <View
                style={[
                  styles.radioCircle,
                  advisorForm.type === "academic" && { borderColor: colors.tint }
                ]}
              >
                {advisorForm.type === "academic" && (
                  <View style={[styles.selectedRadio, { backgroundColor: colors.tint }]} />
                )}
              </View>
              <Text style={[styles.radioLabel, { color: colors.text }]}>Academic</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleTypeChange("clinic")}
            >
              <View
                style={[
                  styles.radioCircle,
                  advisorForm.type === "clinic" && { borderColor: colors.tint }
                ]}
              >
                {advisorForm.type === "clinic" && (
                  <View style={[styles.selectedRadio, { backgroundColor: colors.tint }]} />
                )}
              </View>
              <Text style={[styles.radioLabel, { color: colors.text }]}>Clinic</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Stase</Text>
          {loadingStases ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.tint} />
              <Text style={{ color: colors.text, marginLeft: 8 }}>Loading stases...</Text>
            </View>
          ) : (
            <View style={styles.pickerContainer}>
              {stases.map((stase) => (
                <TouchableOpacity
                  key={stase.id}
                  style={[
                    styles.staseOption,
                    advisorForm.stase_id === stase.id && {
                      backgroundColor: `${colors.tint}20`,
                      borderColor: colors.tint,
                    },
                  ]}
                  onPress={() => handleAdvisorInputChange("stase_id", stase.id.toString())}
                >
                  <Text
                    style={[
                      styles.staseText,
                      { color: colors.text },
                      advisorForm.stase_id === stase.id && { color: colors.tint, fontWeight: "bold" },
                    ]}
                  >
                    {stase.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Only show NPWP and NIP fields for academic advisors */}
        {advisorForm.type === "academic" && (
          <>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>NPWP</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
                ]}
                placeholder="Enter your NPWP"
                placeholderTextColor={colors.icon}
                value={advisorForm.npwp}
                onChangeText={(text) => handleAdvisorInputChange("npwp", text)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>NIP</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
                ]}
                placeholder="Enter your NIP"
                placeholderTextColor={colors.icon}
                value={advisorForm.nip}
                onChangeText={(text) => handleAdvisorInputChange("nip", text)}
              />
            </View>
          </>
        )}

        {/* Only show location and room fields for clinic advisors */}
        {advisorForm.type === "clinic" && (
          <>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Location</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
                ]}
                placeholder="Enter your location"
                placeholderTextColor={colors.icon}
                value={advisorForm.location}
                onChangeText={(text) => handleAdvisorInputChange("location", text)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Room</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
                ]}
                placeholder="Enter your room"
                placeholderTextColor={colors.icon}
                value={advisorForm.room}
                onChangeText={(text) => handleAdvisorInputChange("room", text)}
              />
            </View>
          </>
        )}

        <PrimaryButton
          label="Save Profile"
          onPress={saveAdvisorProfile}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        />
      </View>
    );
  };

  // Enhanced password form render
  const renderPasswordForm = () => {
    return (
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <Card title="Keamanan">
          <View style={styles.formContainer}>
            <View style={styles.securityHeader}>
              <Ionicons name="shield-checkmark" size={24} color={colors.tint} />
              <Text style={[styles.securityTitle, { color: colors.text }]}>
                Ubah Password
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Password Saat Ini</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
                  ]}
                  placeholder="Masukkan password saat ini"
                  placeholderTextColor={colors.icon}
                  value={passwordForm.current_password}
                  onChangeText={(text) => handlePasswordChange("current_password", text)}
                  secureTextEntry={!showPassword.current}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => togglePasswordVisibility("current")}
                >
                  <Ionicons
                    name={showPassword.current ? "eye-off" : "eye"}
                    size={20}
                    color={colors.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Password Baru</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
                  ]}
                  placeholder="Masukkan password baru"
                  placeholderTextColor={colors.icon}
                  value={passwordForm.new_password}
                  onChangeText={(text) => handlePasswordChange("new_password", text)}
                  secureTextEntry={!showPassword.new}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => togglePasswordVisibility("new")}
                >
                  <Ionicons
                    name={showPassword.new ? "eye-off" : "eye"}
                    size={20}
                    color={colors.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Konfirmasi Password Baru</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
                  ]}
                  placeholder="Konfirmasi password baru"
                  placeholderTextColor={colors.icon}
                  value={passwordForm.new_password_confirmation}
                  onChangeText={(text) => handlePasswordChange("new_password_confirmation", text)}
                  secureTextEntry={!showPassword.confirm}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => togglePasswordVisibility("confirm")}
                >
                  <Ionicons
                    name={showPassword.confirm ? "eye-off" : "eye"}
                    size={20}
                    color={colors.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.passwordRequirements}>
              <Text style={[styles.requirementsTitle, { color: colors.text }]}>
                Persyaratan Password:
              </Text>
              <Text style={[styles.requirementText, { color: colors.icon }]}>
                • Minimal 8 karakter
              </Text>
              <Text style={[styles.requirementText, { color: colors.icon }]}>
                • Mengandung huruf besar dan kecil
              </Text>
              <Text style={[styles.requirementText, { color: colors.icon }]}>
                • Mengandung angka dan karakter spesial (@$!%*?&)
              </Text>
            </View>

            <PrimaryButton
              label="Update Password"
              onPress={handleUpdatePassword}
              loading={updatingPassword}
              disabled={updatingPassword}
              style={styles.saveButton}
            />
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        
        <View style={[styles.header, { backgroundColor: colors.tint }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Render form based on user role */}
          {role === "student" ? renderStudentForm() : renderAdvisorForm()}
          
          {/* Add password form */}
          {renderPasswordForm()}
        </ScrollView>
        
        {/* Date picker modal */}
        {showDatePicker && (
          <DateTimePicker
            value={
              role === "student" && studentForm.birthday
                ? parseDate(studentForm.birthday)
                : role === "advisor" && advisorForm.birthday
                ? parseDate(advisorForm.birthday)
                : new Date()
            }
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// Parse date string in dd-mm-yyyy format to Date object
function parseDate(dateString: string): Date {
  try {
    const [day, month, year] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  } catch (error) {
    console.error("Error parsing date:", error);
    return new Date();
  }
}

// Enhanced styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  backButton: {
    padding: 8,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  formContainer: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 12,
  },
  radioGroup: {
    flexDirection: "row",
    marginTop: 4,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#666",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedRadio: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  staseOption: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  staseText: {
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  helperText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  dropdownContainer: {
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    maxHeight: 200,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemText: {
    fontSize: 16,
  },
  dropdownPlaceholder: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  animatedContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputColumn: {
    flex: 1,
  },
  disabledInputContainer: {
    position: 'relative',
  },
  disabledInput: {
    opacity: 0.7,
  },
  lockIcon: {
    position: 'absolute',
    right: 12,
    top: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordRequirements: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    lineHeight: 18,
  },
  saveButton: {
    marginTop: 8,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
});