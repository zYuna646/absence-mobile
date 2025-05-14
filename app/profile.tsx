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
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/context/UserContext";
import {
  api,
  StudentProfileUpdateData,
  AdvisorProfileUpdateData,
  StaseData,
} from "@/services/api";
import PrimaryButton from "@/components/PrimaryButton";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function ProfileScreen() {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();
  const { role, userInfo, token, setUserInfo } = useUser();

  // Student form state
  const [studentForm, setStudentForm] = useState<StudentProfileUpdateData>({
    name: "",
    username: "",
    email: "",
    phone: "",
    birthday: "",
    gender: "",
    student_id: "",
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

  // UI states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stases, setStases] = useState<StaseData[]>([]);
  const [loadingStases, setLoadingStases] = useState(false);

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
        });
      } else if (role === "advisor") {
        setAdvisorForm({
          name: userInfo.name || "",
          username: userInfo.username || "",
          email: userInfo.email || "",
          phone: userInfo.phone || "",
          birthday: userInfo.birthday || "",
          gender: userInfo.gender || "",
          stase_id: userInfo.stase_id || 0,
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

  // Handle input change for student form
  const handleStudentInputChange = (field: keyof StudentProfileUpdateData, value: string) => {
    setStudentForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle input change for advisor form
  const handleAdvisorInputChange = (field: keyof AdvisorProfileUpdateData, value: string) => {
    setAdvisorForm((prev) => ({
      ...prev,
      [field]: field === "stase_id" ? parseInt(value) || 0 : value,
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
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      const response = await api.updateStudentProfile(token, studentForm);
      
      if (response.success && response.data) {
        Alert.alert("Success", "Profile updated successfully");
        setUserInfo(response.data);
      } else {
        Alert.alert("Error", response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating student profile:", error);
      Alert.alert("Error", "An error occurred while updating your profile");
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

  // Change advisor type
  const handleTypeChange = (type: string) => {
    handleAdvisorInputChange("type", type);
  };

  // Render student profile form
  const renderStudentForm = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={[styles.formTitle, { color: colors.text }]}>
          Student Profile
        </Text>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Name</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
            ]}
            placeholder="Enter your name"
            placeholderTextColor={colors.icon}
            value={studentForm.name}
            onChangeText={(text) => handleStudentInputChange("name", text)}
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
            value={studentForm.username}
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
            value={studentForm.email}
            onChangeText={(text) => handleStudentInputChange("email", text)}
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
            value={studentForm.phone}
            onChangeText={(text) => handleStudentInputChange("phone", text)}
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
            <Text style={{ color: studentForm.birthday ? colors.text : colors.icon }}>
              {studentForm.birthday ? formatDisplayDate(studentForm.birthday) : "Select your birthday"}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleStudentInputChange("gender", "Laki-laki")}
            >
              <View
                style={[
                  styles.radioCircle,
                  studentForm.gender === "Laki-laki" && { borderColor: colors.tint }
                ]}
              >
                {studentForm.gender === "Laki-laki" && (
                  <View style={[styles.selectedRadio, { backgroundColor: colors.tint }]} />
                )}
              </View>
              <Text style={[styles.radioLabel, { color: colors.text }]}>Laki-laki</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleStudentInputChange("gender", "Perempuan")}
            >
              <View
                style={[
                  styles.radioCircle,
                  studentForm.gender === "Perempuan" && { borderColor: colors.tint }
                ]}
              >
                {studentForm.gender === "Perempuan" && (
                  <View style={[styles.selectedRadio, { backgroundColor: colors.tint }]} />
                )}
              </View>
              <Text style={[styles.radioLabel, { color: colors.text }]}>Perempuan</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Student ID</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
            ]}
            placeholder="Enter your student ID"
            placeholderTextColor={colors.icon}
            value={studentForm.student_id}
            onChangeText={(text) => handleStudentInputChange("student_id", text)}
          />
        </View>

        <PrimaryButton
          label="Save Profile"
          onPress={saveStudentProfile}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        />
      </View>
    );
  };

  // Render advisor profile form
  const renderAdvisorForm = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={[styles.formTitle, { color: colors.text }]}>
          Advisor Profile
        </Text>

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
        
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Render form based on user role */}
          {role === "student" ? renderStudentForm() : renderAdvisorForm()}
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
  saveButton: {
    marginTop: 24,
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
}); 