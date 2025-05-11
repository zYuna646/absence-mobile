import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

// Import reusable components
import FloatingLabelInput from "@/components/FloatingLabelInput";
import { api, StaseData, GroupData } from "@/services/api";

interface BiodataFormProps {
  formData: {
    role: string;
    name: string;
    gender: string;
    birthday: string;
    student_id: string;
    group_id: number | null;
    stase_id: number | null;
    phone: string;
    // Fields for advisor
    type: string;
    npwp: string;
    nip: string;
    location: string;
    room: string;
  };
  onChange: (field: string, value: any) => void;
}

/**
 * Biodata form component for registration
 */
const BiodataForm: React.FC<BiodataFormProps> = ({ formData, onChange }) => {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // State for API data
  const [stases, setStases] = useState<StaseData[]>([]);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch stases and groups data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch stases data for preceptors (both academic and clinic)
        if (formData.role === "preseptor_akademik" || formData.role === "preseptor_klinik") {
          const stasesResponse = await api.getStases();
          if (stasesResponse.success && stasesResponse.data) {
            setStases(stasesResponse.data);
          } else {
            console.error("Failed to fetch stases:", stasesResponse.message);
            setError("Gagal memuat data stase");
          }
        }
        
        // Only fetch groups data if role is mahasiswa
        if (formData.role === "mahasiswa") {
          // Fetch stases data
          const stasesResponse = await api.getStases();
          if (stasesResponse.success && stasesResponse.data) {
            setStases(stasesResponse.data);
          } else {
            console.error("Failed to fetch stases:", stasesResponse.message);
            setError("Gagal memuat data stase");
          }
          
          const groupsResponse = await api.getGroups();
          if (groupsResponse.success && groupsResponse.data) {
            setGroups(groupsResponse.data);
          } else {
            console.error("Failed to fetch groups:", groupsResponse.message);
            setError("Gagal memuat data kelompok");
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Terjadi kesalahan saat memuat data");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (formData.role === "mahasiswa" || formData.role === "preseptor_akademik" || formData.role === "preseptor_klinik") {
      fetchData();
    }
  }, [formData.role]);
  
  // Input style for text inputs
  const inputStyle = {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    color: colors.text,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  };
  
  // Style for picker container
  const pickerContainerStyle = {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden" as const,
  };
  
  // Placeholder text color
  const placeholderTextColor = colorScheme === "dark" ? "#9BA1A6" : "#687076";
  
  // Handle date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      try {
        // Format date as dd-mm-yyyy
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const year = selectedDate.getFullYear();
        onChange("birthday", `${day}-${month}-${year}`);
      } catch (error) {
        console.error("Error formatting date:", error);
        // Fallback to simple formatting
        const date = new Date(selectedDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        onChange("birthday", `${day}-${month}-${year}`);
      }
    }
  };
  
  // Open date picker
  const openDatePicker = () => {
    setShowDatePicker(true);
  };
  
  // Close date picker (for iOS)
  const closeDatePicker = () => {
    setShowDatePicker(false);
  };
  
  // Birthday display format
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    
    try {
      // Parse date from dd-mm-yyyy format
      const [day, month, year] = dateString.split('-');
      // Create a date object (months are 0-indexed in JavaScript)
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      
      // Format for display
      const displayDay = String(date.getDate()).padStart(2, '0');
      const displayMonth = date.toLocaleString('default', { month: 'long' });
      const displayYear = date.getFullYear();
      
      return `${displayDay} ${displayMonth} ${displayYear}`;
    } catch (error) {
      console.error("Error formatting display date:", error);
      return dateString;
    }
  };

  // Loading indicator for API data
  const renderLoadingOrError = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Memuat data...
          </Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      );
    }
    
    return null;
  };

  // Render student specific fields
  const renderStudentFields = () => {
    if (formData.role !== "mahasiswa") return null;
    
    return (
      <>
        <View style={styles.spacer} />
        
        <FloatingLabelInput
          label="NIM"
          value={formData.student_id}
          onChangeText={(value) => onChange("student_id", value)}
          inputStyle={inputStyle}
          placeholderTextColor={placeholderTextColor}
          disabled={false}
        />
        
        {renderLoadingOrError()}
        
        <Text style={[styles.label, { color: colors.text }]}>Kelompok</Text>
        <View style={pickerContainerStyle}>
          <Picker
            selectedValue={formData.group_id}
            onValueChange={(value) => onChange("group_id", value)}
            style={{ color: colors.text }}
            dropdownIconColor={colors.icon}
            enabled={!isLoading && !error}
          >
            <Picker.Item 
              label="Pilih Kelompok" 
              value={null} 
              color={placeholderTextColor} 
            />
            {groups.map((group) => (
              <Picker.Item 
                key={group.id} 
                label={group.name} 
                value={group.id} 
              />
            ))}
          </Picker>
        </View>
      </>
    );
  };

  // Render advisor specific fields
  const renderAdvisorFields = () => {
    if (formData.role !== "preseptor_akademik" && formData.role !== "preseptor_klinik") return null;
    
    return (
      <>
        <View style={styles.spacer} />
        
        {renderLoadingOrError()}
        
        <Text style={[styles.label, { color: colors.text }]}>Stase</Text>
        <View style={pickerContainerStyle}>
          <Picker
            selectedValue={formData.stase_id}
            onValueChange={(value) => onChange("stase_id", value)}
            style={{ color: colors.text }}
            dropdownIconColor={colors.icon}
            enabled={!isLoading && !error}
          >
            <Picker.Item 
              label="Pilih Stase" 
              value={null} 
              color={placeholderTextColor} 
            />
            {stases.map((stase) => (
              <Picker.Item 
                key={stase.id} 
                label={stase.name} 
                value={stase.id} 
              />
            ))}
          </Picker>
        </View>
        
        {/* Academic Preceptor specific fields */}
        {formData.role === "preseptor_akademik" && (
          <>
            <FloatingLabelInput
              label="NIP"
              value={formData.nip}
              onChangeText={(value) => onChange("nip", value)}
              inputStyle={inputStyle}
              placeholderTextColor={placeholderTextColor}
              disabled={false}
            />
            
            <View style={styles.spacer} />
            
            <FloatingLabelInput
              label="NPWP"
              value={formData.npwp}
              onChangeText={(value) => onChange("npwp", value)}
              inputStyle={inputStyle}
              placeholderTextColor={placeholderTextColor}
              disabled={false}
            />
          </>
        )}
        
        {/* Clinic Preceptor specific fields */}
        {formData.role === "preseptor_klinik" && (
          <>
            <FloatingLabelInput
              label="Lokasi"
              value={formData.location}
              onChangeText={(value) => onChange("location", value)}
              inputStyle={inputStyle}
              placeholderTextColor={placeholderTextColor}
              disabled={false}
            />
            
            <View style={styles.spacer} />
            
            <FloatingLabelInput
              label="Ruangan"
              value={formData.room}
              onChangeText={(value) => onChange("room", value)}
              inputStyle={inputStyle}
              placeholderTextColor={placeholderTextColor}
              disabled={false}
            />
          </>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Informasi Biodata
      </Text>
      
      <FloatingLabelInput
        label="Nama Lengkap"
        value={formData.name}
        onChangeText={(value) => onChange("name", value)}
        inputStyle={inputStyle}
        placeholderTextColor={placeholderTextColor}
        disabled={false}
      />
      
      <View style={styles.spacer} />
      
      <Text style={[styles.label, { color: colors.text }]}>Jenis Kelamin</Text>
      <View style={pickerContainerStyle}>
        <Picker
          selectedValue={formData.gender}
          onValueChange={(value) => onChange("gender", value)}
          style={{ color: colors.text }}
          dropdownIconColor={colors.icon}
        >
          <Picker.Item 
            label="Pilih Jenis Kelamin" 
            value="" 
            color={placeholderTextColor} 
          />
          <Picker.Item label="Laki-laki" value="Laki-laki" />
          <Picker.Item label="Perempuan" value="Perempuan" />
        </Picker>
      </View>
      
      <Text style={[styles.label, { color: colors.text }]}>Tanggal Lahir</Text>
      <TouchableOpacity 
        style={[
          styles.datePickerButton,
          { 
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
          }
        ]}
        onPress={openDatePicker}
      >
        <Text 
          style={[
            styles.datePickerText, 
            { 
              color: formData.birthday ? colors.text : placeholderTextColor 
            }
          ]}
        >
          {formData.birthday 
            ? formatDisplayDate(formData.birthday) 
            : "Pilih Tanggal Lahir"
          }
        </Text>
        <Ionicons name="calendar" size={20} color={colors.icon} />
      </TouchableOpacity>
      
      {showDatePicker && (
        <>
          <DateTimePicker
            value={formData.birthday ? new Date(formData.birthday) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
          
          {Platform.OS === 'ios' && (
            <View style={styles.iosDatePickerActions}>
              <TouchableOpacity 
                onPress={closeDatePicker}
                style={[styles.iosButton, { backgroundColor: colors.tint }]}
              >
                <Text style={styles.iosButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
      
      <View style={styles.spacer} />
      
      <FloatingLabelInput
        label="Nomor Telepon"
        value={formData.phone}
        onChangeText={(value) => onChange("phone", value)}
        inputStyle={inputStyle}
        placeholderTextColor={placeholderTextColor}
        keyboardType="phone-pad"
        disabled={false}
      />

      {renderStudentFields()}
      {renderAdvisorFields()}
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
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  spacer: {
    height: 16,
  },
  datePickerButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  datePickerText: {
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 8,
    backgroundColor: "rgba(220, 53, 69, 0.1)",
    borderRadius: 8,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
  },
  iosDatePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    marginBottom: 16,
  },
  iosButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  iosButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default BiodataForm; 