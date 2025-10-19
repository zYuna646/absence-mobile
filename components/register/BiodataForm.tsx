import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

// Import reusable components
import FloatingLabelInput from "@/components/FloatingLabelInput";
import { api, StaseData, GroupData } from "@/services/api";

interface BiodataFormProps {
  formData: {
    role: string;
    name: string;
    student_id: string;
    group_id: number | null;
    stace_id: number | null; // Changed from stase_id to stace_id
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
        // Fetch stases data for all roles
        const stasesResponse = await api.getStases();
        if (stasesResponse.success && stasesResponse.data) {
          setStases(stasesResponse.data);
        } else {
          console.error("Failed to fetch stases:", stasesResponse.message);
          setError("Gagal memuat data stase");
        }
        
        // Only fetch groups data if role is mahasiswa and stase is selected
        if (formData.role === "mahasiswa" && formData.stace_id) {
          const groupsResponse = await api.getGroupsByStase(formData.stace_id);
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
    
    if (formData.role) {
      fetchData();
    }
  }, [formData.role, formData.stace_id]);
  
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
  
  // All date-related functions have been removed

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

        <Text style={[styles.label, { color: colors.text }]}>Stase</Text>
        <View style={pickerContainerStyle}>
          <Picker
            selectedValue={formData.stace_id}
            onValueChange={(value) => {
              onChange("stace_id", value);
              // Reset group selection when stase changes
              onChange("group_id", null);
            }}
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
        
        <Text style={[styles.label, { color: colors.text }]}>Kelompok</Text>
        <View style={pickerContainerStyle}>
          <Picker
            selectedValue={formData.group_id}
            onValueChange={(value) => onChange("group_id", value)}
            style={{ color: colors.text }}
            dropdownIconColor={colors.icon}
            enabled={!isLoading && !error && formData.stace_id !== null}
          >
            <Picker.Item 
              label={formData.stace_id ? "Pilih Kelompok" : "Pilih Stase terlebih dahulu"} 
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
            selectedValue={formData.stace_id}
            onValueChange={(value) => onChange("stace_id", value)}
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
              label="NIK (Optional - Untuk administratif kampus)"
              value={formData.nip}
              onChangeText={(value) => onChange("nip", value)}
              inputStyle={inputStyle}
              placeholderTextColor={placeholderTextColor}
              disabled={false}
            />
            
            <View style={styles.spacer} />
            
            <FloatingLabelInput
              label="NPWP (Optional - Untuk administratif kampus)"
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
              label="NIK (Optional - Untuk administratif kampus)"
              value={formData.nip}
              onChangeText={(value) => onChange("nip", value)}
              inputStyle={inputStyle}
              placeholderTextColor={placeholderTextColor}
              disabled={false}
            />
            
            <View style={styles.spacer} />
            
            <FloatingLabelInput
              label="NPWP (Optional - Untuk administratif kampus)"
              value={formData.npwp}
              onChangeText={(value) => onChange("npwp", value)}
              inputStyle={inputStyle}
              placeholderTextColor={placeholderTextColor}
              disabled={false}
            />
            
            <View style={styles.spacer} />
            
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