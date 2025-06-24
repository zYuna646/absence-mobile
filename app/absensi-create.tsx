import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  Linking,
  Modal,
  FlatList,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/context/UserContext";
import { useLocalSearchParams, router } from "expo-router";
import Card from "@/components/ui/Card";
import PrimaryButton from "@/components/PrimaryButton";
import BottomSheetSelector from "@/components/ui/BottomSheetSelector";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { api, ActivityData } from "@/services/api";

export default function AbsensiCreateScreen() {
  const colors = useThemeColor();
  const theme = useColorScheme() ?? 'light';
  const { token } = useUser();
  const params = useLocalSearchParams();
  const checkInId = params.checkInId ? parseInt(params.checkInId as string) : 0;
  const mode = params.mode as string || "checkin"; // "checkin" or "checkout"
  const activityId = params.activityId ? parseInt(params.activityId as string) : 0;
  const activityName = params.activityName as string || "";
  
  // Activity state
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  
  // Form state
  const [description, setDescription] = useState("");
  const [score, setScore] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  
  // Permissions state
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  
  // Photo and location state
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Modal state
  const [showActivityModal, setShowActivityModal] = useState(false);

  // Load activities and request permissions on mount
  useEffect(() => {
    (async () => {
      // Request camera permissions
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === "granted");
      
      // Request location permissions
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus.status === "granted");
      
      if (locationStatus.status === "granted") {
        await getLocation();
      }
      
      // Load activities
      if (token) {
        try {
          const response = await api.getActivities(token);
          if (response.success && response.data) {
            setActivities(response.data);
          }
        } catch (error) {
          console.error("Error loading activities:", error);
        } finally {
          setLoadingActivities(false);
        }
      }
      
      // Set activity from params
      if (activityId && activityName) {
        setSelectedActivity({
          id: activityId,
          name: activityName,
          indicators: "",
          advisor_clinic_name: "",
          is_lock: 0,
          lock_date: null,
          unlock_date: null
        });
      }
    })();
  }, [token]);

  // Update current date
  const updateCurrentTime = () => {
    setCheckInDate(new Date());
  };

  // Get current location
  const getLocation = async () => {
    try {
      setLoadingLocation(true);
      
      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest
      });
      
      setLocation(location);
      
      // Reverse geocode to get address
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      if (geocode && geocode.length > 0) {
        const loc = geocode[0];
        const addressParts = [
          loc.street,
          loc.district,
          loc.city,
          loc.region,
          loc.postalCode,
          loc.country
        ].filter(Boolean);
        
        setAddress(addressParts.join(", "));
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Gagal mendapatkan lokasi");
    } finally {
      setLoadingLocation(false);
    }
  };

  // Take a photo using camera
  const takePhoto = async () => {
    if (hasCameraPermission !== true) {
      Alert.alert(
        "Izin Kamera Diperlukan",
        "Aplikasi memerlukan akses ke kamera untuk mengambil foto",
        [
          { text: "Batal", style: "cancel" },
          { text: "Buka Pengaturan", onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Gagal mengambil foto");
    }
  };

  // Handle form submission for check-in
  const handleCheckIn = async () => {
    if (!token || !selectedActivity) {
      Alert.alert("Error", "Data tidak lengkap");
      return;
    }

    if (!photo) {
      Alert.alert("Validation Error", "Foto harus diambil");
      return;
    }
    
    if (!location) {
      Alert.alert("Validation Error", "Lokasi tidak tersedia");
      return;
    }

    try {
      setSubmitting(true);
      
      // Format dates for API
      const formattedDate = formatDateForAPI(checkInDate, false);
      const formattedTime = formatDateForAPI(checkInDate, true);
      
      // Create form data
      const formData = new FormData();
      formData.append("date", formattedDate);
      formData.append("check_time", formattedTime);
      formData.append("latitude", location.coords.latitude.toString());
      formData.append("longitude", location.coords.longitude.toString());
      formData.append("address", address);
      
      // Append photo
      const photoName = photo.split("/").pop() || "photo.jpg";
      const photoType = "image/jpeg";
      formData.append("photo", {
        uri: photo,
        name: photoName,
        type: photoType,
      } as any);
      
      // Call the API for check-in
      console.log(formData);
      
      const response = await api.checkInAttendance(token, selectedActivity.id, formData);
      console.log(response);
      
      if (response.success) {
        Alert.alert(
          "Berhasil",
          "Check-in absensi berhasil disimpan",
          [
            {
              text: "OK",
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert("Error", response.message || "Gagal menyimpan check-in absensi");
      }
    } catch (error) {
      console.error("Error submitting attendance check-in:", error);
      Alert.alert("Error", "Gagal menyimpan check-in absensi");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submission for check-out
  const handleCheckOut = async () => {
    if (!token || !checkInId) {
      Alert.alert("Error", "Data tidak lengkap");
      return;
    }

    if (!photo) {
      Alert.alert("Validation Error", "Foto harus diambil");
      return;
    }
    
    if (!location) {
      Alert.alert("Validation Error", "Lokasi tidak tersedia");
      return;
    }

    try {
      setSubmitting(true);
      
      // Format dates for API
      const formattedDate = formatDateForAPI(checkInDate, false);
      const formattedTime = formatDateForAPI(checkInDate, true);
      
      // Create form data
      const formData = new FormData();
      formData.append("date", formattedDate);
      formData.append("check_time", formattedTime);
      formData.append("latitude", location.coords.latitude.toString());
      formData.append("longitude", location.coords.longitude.toString());
      formData.append("address", address);
      
      if (description) {
        formData.append("description", description);
      }
      
      if (score) {
        formData.append("score", score);
      }
      
      // Append photo
      const photoName = photo.split("/").pop() || "photo.jpg";
      const photoType = "image/jpeg";
      formData.append("photo", {
        uri: photo,
        name: photoName,
        type: photoType,
      } as any);
      
      // Call the API for check-out
      const response = await api.checkOutAttendance(token, checkInId, formData);
      console.log(response);
      if (response.success) {
        Alert.alert(
          "Berhasil",
          "Check-out absensi berhasil disimpan",
          [
            {
              text: "OK",
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert("Error", response.message || "Gagal menyimpan check-out absensi");
      }
    } catch (error) {
      console.error("Error submitting attendance check-out:", error);
      Alert.alert("Error", "Gagal menyimpan check-out absensi");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle activity selection
  const handleSelectActivity = (selectedActivity: ActivityData) => {
    setSelectedActivity(selectedActivity);
    setShowActivityModal(false);
  };

  // Custom render for activity items
  const renderCustomActivityItem = (item: ActivityData, isSelected: boolean) => {
    const isLocked = item.is_lock === 1;
    
    return (
      <TouchableOpacity
        style={[
          styles.activityItem,
          isSelected && { backgroundColor: `${colors.tint}20` },
          isLocked && { opacity: 0.5, backgroundColor: `${colors.icon}10` }
        ]}
        onPress={() => {
          if (!isLocked) {
            handleSelectActivity(item);
          } else {
            Alert.alert(
              "Kegiatan Tertutup",
              "Kegiatan ini sedang tertutup dan tidak dapat dipilih untuk absensi."
            );
          }
        }}
        disabled={isLocked}
      >
        <View style={styles.activityHeader}>
          <Text style={[
            styles.activityName, 
            { color: isLocked ? colors.icon : colors.text }
          ]}>
            {item.name}
          </Text>
          <View style={styles.activityStatus}>
            <Ionicons 
              name={isLocked ? "lock-closed" : "lock-open"} 
              size={16} 
              color={isLocked ? colors.error || "#dc3545" : colors.success || "#28a745"} 
            />
            <Text style={{
              fontSize: 12,
              fontWeight: "500",
              color: isLocked ? colors.error || "#dc3545" : colors.success || "#28a745",
              marginLeft: 4
            }}>
              {isLocked ? "Tertutup" : "Terbuka"}
            </Text>
          </View>
        </View>
        
        {item.advisor_clinic_name && (
          <Text style={[
            styles.activityDetail, 
            { color: isLocked ? colors.icon : colors.text }
          ]}>
            Pembimbing: {item.advisor_clinic_name}
          </Text>
        )}
        
        {item.location && (
          <Text style={[
            styles.activityDetail, 
            { color: isLocked ? colors.icon : colors.text }
          ]}>
            Lokasi: {item.location}{item.room ? `, Ruang ${item.room}` : ''}
          </Text>
        )}
        
        {isLocked && (
          <Text style={[
            styles.lockedNote,
            { color: colors.error || "#dc3545" }
          ]}>
            <Ionicons name="information-circle" size={12} color={colors.error || "#dc3545"} />
            {" "}Kegiatan tidak tersedia untuk absensi
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!selectedActivity && mode !== "checkout") {
      Alert.alert("Error", "Pilih kegiatan terlebih dahulu");
      return;
    }

    // Check if selected activity is locked for check-in
    if (mode !== "checkout" && selectedActivity?.is_lock === 1) {
      Alert.alert(
        "Kegiatan Tertutup",
        "Kegiatan yang dipilih sedang tertutup. Tidak dapat melakukan check-in."
      );
      return;
    }
    
    if (mode === "checkout") {
      handleCheckOut();
    } else {
      handleCheckIn();
    }
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date for API
  const formatDateForAPI = (date: Date, timeOnly: boolean = false): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    
    if (timeOnly) {
      return `${hours}:${minutes}:00`;
    }
    
    return `${day}-${month}-${year}`;
  };

  // Open app settings
  const openSettings = () => {
    Linking.openSettings();
  };

  // Get screen title based on mode
  const getScreenTitle = () => {
    return mode === "checkout" ? "Check-out Absensi" : "Check-in Absensi";
  };

  // Get button label based on mode
  const getButtonLabel = () => {
    return mode === "checkout" ? "Simpan Check-out" : "Simpan Check-in";
  };

  // Show loading indicator while submitting
  if (submitting) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        
        <View style={[styles.header, { backgroundColor: colors.tint }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getScreenTitle()}</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Menyimpan data...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      
      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getScreenTitle()}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Activity Selection - Only show for check-in */}
        {mode !== "checkout" && (
          <Card title="Pilih Kegiatan">
            {loadingActivities ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.tint} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  Memuat daftar kegiatan...
                </Text>
              </View>
            ) : (
              <View>
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    { 
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                    }
                  ]}
                  onPress={() => setShowActivityModal(true)}
                >
                  <Text 
                    style={[
                      styles.selectButtonText,
                      { color: selectedActivity ? colors.text : colors.icon }
                    ]}
                  >
                    {selectedActivity ? selectedActivity.name : "Pilih Kegiatan"}
                  </Text>
                  <Ionicons 
                    name="chevron-down" 
                    size={20} 
                    color={colors.icon} 
                  />
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}
        
        {/* Check-in/out Form */}
        <Card title={`Detail ${mode === "checkout" ? "Check-out" : "Check-in"}`}>
          {/* Check-in/out Time */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Waktu {mode === "checkout" ? "Check-out" : "Check-in"}
            </Text>
            <View
              style={[
                styles.dateInput,
                { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }
              ]}
            >
              <View style={styles.dateDisplay}>
                <Ionicons name="calendar-outline" size={20} color={colors.icon} style={styles.dateIcon} />
                <Text style={{ color: colors.text }}>{formatDate(checkInDate)}</Text>
              </View>
              <View style={styles.timeDisplay}>
                <Ionicons name="time-outline" size={20} color={colors.icon} style={styles.dateIcon} />
                <Text style={{ color: colors.text }}>{formatTime(checkInDate)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.refreshButton, { borderColor: colors.tint, alignSelf: 'flex-end', marginTop: 8 }]}
              onPress={updateCurrentTime}
            >
              <Ionicons name="refresh" size={16} color={colors.tint} />
              <Text style={[styles.refreshText, { color: colors.tint }]}>Perbarui Waktu</Text>
            </TouchableOpacity>
          </View>
          
          {/* Photo */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Foto</Text>
            
            {photo ? (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: photo }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={[styles.photoAction, { backgroundColor: colors.tint }]}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera" size={20} color="white" />
                  <Text style={styles.photoActionText}>Ambil Ulang</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.photoAction, { backgroundColor: colors.tint, alignSelf: 'center', width: '100%' }]}
                onPress={takePhoto}
              >
                <Ionicons name="camera" size={20} color="white" />
                <Text style={styles.photoActionText}>Ambil Foto</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Location */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Lokasi</Text>
            
            {loadingLocation ? (
              <View style={[styles.locationContainer, { borderColor: colors.inputBorder }]}>
                <ActivityIndicator size="small" color={colors.tint} />
                <Text style={[styles.locationText, { color: colors.text }]}>
                  Mendapatkan lokasi...
                </Text>
              </View>
            ) : location ? (
              <View style={[styles.locationContainer, { borderColor: colors.inputBorder }]}>
                <View style={styles.locationCoords}>
                  <Ionicons name="location" size={20} color={colors.tint} style={styles.locationIcon} />
                  <Text style={[styles.coordsText, { color: colors.text }]}>
                    {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                  </Text>
                </View>
                
                <Text style={[styles.addressText, { color: colors.text }]}>
                  {address || "Alamat tidak tersedia"}
                </Text>
                
                <TouchableOpacity
                  style={[styles.refreshButton, { borderColor: colors.tint }]}
                  onPress={getLocation}
                >
                  <Ionicons name="refresh" size={16} color={colors.tint} />
                  <Text style={[styles.refreshText, { color: colors.tint }]}>Perbarui Lokasi</Text>
                </TouchableOpacity>
              </View>
            ) : hasLocationPermission === false ? (
              <View style={[styles.locationContainer, { borderColor: colors.inputBorder }]}>
                <Text style={[styles.locationText, { color: colors.text }]}>
                  Akses lokasi tidak diberikan
                </Text>
                <TouchableOpacity
                  style={[styles.refreshButton, { borderColor: colors.tint }]}
                  onPress={openSettings}
                >
                  <Ionicons name="settings" size={16} color={colors.tint} />
                  <Text style={[styles.refreshText, { color: colors.tint }]}>Buka Pengaturan</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.locationContainer, { borderColor: colors.inputBorder }]}>
                <Text style={[styles.locationText, { color: colors.text }]}>
                  Lokasi tidak tersedia
                </Text>
                <TouchableOpacity
                  style={[styles.refreshButton, { borderColor: colors.tint }]}
                  onPress={getLocation}
                >
                  <Ionicons name="refresh" size={16} color={colors.tint} />
                  <Text style={[styles.refreshText, { color: colors.tint }]}>Dapatkan Lokasi</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Description field - only show for check-out */}
          {mode === "checkout" && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Catatan
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
                ]}
                placeholder="Masukkan catatan (opsional)"
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>
          )}
          
          {/* Score field - only show for check-out */}
          {/* {mode === "checkout" && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Nilai (Opsional)
              </Text>
              <TextInput
                style={[
                  styles.scoreInput,
                  { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }
                ]}
                placeholder="Masukkan nilai (0-100)"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
                value={score}
                onChangeText={(text) => {
                  // Only allow numbers between 0-100
                  const numValue = parseInt(text);
                  if (text === "" || (numValue >= 0 && numValue <= 100)) {
                    setScore(text);
                  }
                }}
              />
            </View>
          )} */}
        </Card>
        
        <PrimaryButton
          label={getButtonLabel()}
          onPress={handleSubmit}
          loading={submitting}
          disabled={
            submitting || 
            !photo || 
            !location ||
            (!selectedActivity && mode !== "checkout")
          }
          style={styles.submitButton}
        />
      </ScrollView>

      {/* Activity Selector Modal */}
      <BottomSheetSelector
        visible={showActivityModal}
        title="Pilih Kegiatan"
        items={activities.map(activity => ({
          id: activity.id,
          name: activity.name,
          subtitle: activity.advisor_clinic_name
        }))}
        selectedId={selectedActivity?.id}
        loading={loadingActivities}
        emptyText="Tidak ada kegiatan tersedia"
        onSelect={(item) => {
          const selectedActivity = activities.find(a => a.id === item.id);
          if (selectedActivity) {
            handleSelectActivity(selectedActivity);
          }
        }}
        onClose={() => setShowActivityModal(false)}
        renderItem={(item, isSelected) => {
          const activityData = activities.find(a => a.id === item.id);
          if (activityData) {
            return renderCustomActivityItem(activityData, isSelected);
          }
          return null;
        }}
      />
    </View>
  );
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    padding: 12,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  activityItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  activityInfo: {
    paddingVertical: 8,
  },
  activityName: {
    fontSize: 16,
    fontWeight: "600",
  },
  activityInfoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 0.5,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateIcon: {
    marginRight: 6,
  },
  textArea: {
    borderWidth: 0.5,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 16,
  },
  scoreInput: {
    borderWidth: 0.5,
    borderRadius: 8,
    padding: 12,
    height: 48,
    fontSize: 16,
  },
  submitButton: {
    marginTop: 24,
  },
  photoAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  photoActionText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "500",
  },
  photoPreviewContainer: {
    alignItems: "center",
  },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  locationContainer: {
    borderWidth: 0.5,
    borderRadius: 8,
    padding: 12,
  },
  locationText: {
    fontSize: 14,
    marginBottom: 8,
  },
  locationCoords: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationIcon: {
    marginRight: 6,
  },
  coordsText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addressText: {
    fontSize: 14,
    marginBottom: 12,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  refreshText: {
    marginLeft: 6,
    fontWeight: "500",
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  selectButtonText: {
    fontSize: 16,
  },

  // Activity item styles
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  lockedNote: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
}); 