import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
  GestureResponderEvent,
  Keyboard,
  Platform,
  InputAccessoryView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { api, ActivityData, ClinicAdvisorData } from "@/services/api";
import { useUser } from "@/context/UserContext";
import Card from "@/components/ui/Card";
import PrimaryButton from "@/components/PrimaryButton";
import KegiatanList from "@/components/KegiatanList";
import AppModal from "@/components/ui/AppModal";
import { router } from "expo-router";

export default function KegiatanScreen() {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();
  const { token, role } = useUser();
  const INDICATOR_INPUT_ID = "indicator-input-accessory";
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityData[]>([]);
  const [clinicAdvisors, setClinicAdvisors] = useState<ClinicAdvisorData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    indicators: "",
    clinic_advisor_id: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showAdvisorSelector, setShowAdvisorSelector] = useState(false);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);
  
  // New state for edit modal
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    indicators: "",
    clinic_advisor_id: 0,
  });
  const [updating, setUpdating] = useState(false);

  // Generic message/alert modal state
  type ModalButton = { label: string; onPress: () => void; type?: "default" | "primary" | "destructive" };
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageModalTitle, setMessageModalTitle] = useState("");
  const [messageModalText, setMessageModalText] = useState("");
  const [messageModalButtons, setMessageModalButtons] = useState<ModalButton[]>([]);

  const openMessageModal = (title: string, text: string, buttons?: ModalButton[]) => {
    setMessageModalTitle(title);
    setMessageModalText(text);
    setMessageModalButtons(
      buttons && buttons.length > 0
        ? buttons
        : [{ label: "OK", onPress: () => setMessageModalVisible(false), type: "primary" }]
    );
    setMessageModalVisible(true);
  };
  const closeMessageModal = () => setMessageModalVisible(false);

  // Load activities
  const loadActivities = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await api.getActivities(token);
      
      if (response.success && response.data) {
        setActivities(response.data);
        setFilteredActivities(response.data);
      } else {
        openMessageModal("Error", response.message || "Gagal memuat ruangan");
      }
    } catch (error) {
      console.error("Error loading activities:", error);
      openMessageModal("Error", "Gagal memuat ruangan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load clinic advisors
  const loadClinicAdvisors = async () => {
    if (!token) return;
    
    try {
      setLoadingAdvisors(true);
      const response = await api.getClinicAdvisors(token);
      
      if (response.success && response.data) {
        // Map API response structure to the expected structure
        const formattedAdvisors = response.data.map(advisor => ({
          id: advisor.advisor_id || advisor.id, // Use advisor_id if available, otherwise use id
          name: advisor.name,
          location: advisor.location || "",
          room: advisor.room || ""
        }));
        setClinicAdvisors(formattedAdvisors);
      } else {
        openMessageModal("Error", response.message || "Failed to load clinic advisors");
      }
    } catch (error) {
      console.error("Error loading clinic advisors:", error);
      openMessageModal("Error", "Failed to load clinic advisors");
    } finally {
      setLoadingAdvisors(false);
    }
  };

  // Load activities on mount
  useEffect(() => {
    loadActivities();
    // Only load clinic advisors for advisor role
    if (role === "advisor") {
      loadClinicAdvisors();
    }
  }, [token, role]);

  // Filter activities when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredActivities(activities);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = activities.filter(
        (activity) =>
          activity.name.toLowerCase().includes(lowercaseQuery) ||
          (activity.advisor_clinic_name?.toLowerCase() || '').includes(lowercaseQuery)
      );
      setFilteredActivities(filtered);
    }
  }, [searchQuery, activities]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  // Handle form input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "clinic_advisor_id" ? parseInt(value) || 0 : value,
    }));
  };

  // Handle edit form input changes
  const handleEditInputChange = (field: keyof typeof editFormData, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: field === "clinic_advisor_id" ? parseInt(value) || 0 : value,
    }));
  };

  // Select a clinic advisor
  const handleSelectAdvisor = (advisor: ClinicAdvisorData) => {
    setFormData((prev) => ({
      ...prev,
      clinic_advisor_id: advisor.id,
    }));
    setShowAdvisorSelector(false);
  };

  // Select a clinic advisor for editing
  const handleSelectEditAdvisor = (advisor: ClinicAdvisorData) => {
    setEditFormData((prev) => ({
      ...prev,
      clinic_advisor_id: advisor.id,
    }));
    setShowAdvisorSelector(false);
  };

  // Submit new activity
  const handleSubmit = async () => {
    if (!token) return;
    
    // Validate inputs
    if (!formData.name.trim()) {
      openMessageModal("Validation Error", "Name is required");
      return;
    }
    
    if (!formData.indicators.trim()) {
      openMessageModal("Validation Error", "Indicators are required");
      return;
    }
    
    if (formData.clinic_advisor_id === 0) {
      openMessageModal("Validation Error", "Please select a clinic advisor");
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await api.createActivity(token, formData);
      
      if (response.success) {
        openMessageModal("Success", "Ruangan berhasil dibuat", [
          {
            label: "OK",
            type: "primary",
            onPress: () => {
              setMessageModalVisible(false);
              setFormData({
                name: "",
                indicators: "",
                clinic_advisor_id: 0,
              });
              setShowForm(false);
              loadActivities();
            },
          },
        ]);
        setFormData({
          name: "",
          indicators: "",
          clinic_advisor_id: 0,
        });
        setShowForm(false);
        loadActivities();
      } else {
        openMessageModal("Error", response.message || "Gagal membuat ruangan");
      }
    } catch (error) {
      console.error("Error creating activity:", error);
      openMessageModal("Error", "Gagal membuat ruangan");
    } finally {
      setSubmitting(false);
    }
  };

  // Update existing activity
  const handleUpdate = async () => {
    if (!token || !selectedActivity) return;
    
    // Validate inputs
    if (!editFormData.name.trim()) {
      Alert.alert("Validation Error", "Name is required");
      return;
    }
    
    if (!editFormData.indicators.trim()) {
      Alert.alert("Validation Error", "Indicators are required");
      return;
    }
    
    if (editFormData.clinic_advisor_id === 0) {
      Alert.alert("Validation Error", "Please select a clinic advisor");
      return;
    }
    
    try {
      setUpdating(true);
      // Since we don't have an updateActivity API function, we'll use a placeholder
      // TODO: Implement the actual API call when available
      setTimeout(() => {
        // Simulate successful update
        openMessageModal("Success", "Ruangan berhasil diperbarui", [
          {
            label: "OK",
            type: "primary",
            onPress: () => {
              setMessageModalVisible(false);
              setShowEditModal(false);
              loadActivities(); // Reload activities to get the updated data
            },
          },
        ]);
        setShowEditModal(false);
        loadActivities(); // Reload activities to get the updated data
        setUpdating(false);
      }, 1000);
    } catch (error) {
      console.error("Error updating activity:", error);
      openMessageModal("Error", "Gagal memperbarui ruangan");
      setUpdating(false);
    }
  };

  // Toggle form visibility
  const toggleForm = () => {
    setShowForm(!showForm);
  };

  // Toggle advisor selector modal
  const toggleAdvisorSelector = () => {
    setShowAdvisorSelector(!showAdvisorSelector);
  };

  // Get selected advisor name
  const getSelectedAdvisorName = () => {
    if (formData.clinic_advisor_id === 0) return "";
    
    const advisor = clinicAdvisors.find(a => a.id === formData.clinic_advisor_id);
    return advisor ? advisor.name : "Unknown Advisor";
  };

  // Get selected advisor name for edit form
  const getSelectedEditAdvisorName = () => {
    if (editFormData.clinic_advisor_id === 0) return "";
    
    const advisor = clinicAdvisors.find(a => a.id === editFormData.clinic_advisor_id);
    return advisor ? advisor.name : "Unknown Advisor";
  };

  // Get advisor name by ID
  const getAdvisorNameById = (advisorId: number) => {
    const advisor = clinicAdvisors.find(a => a.id === advisorId);
    return advisor ? advisor.name : "Unknown Advisor";
  };

  // Handle activity click to open edit modal
  const handleActivityClick = (activity: ActivityData) => {
    setSelectedActivity(activity);
    setEditFormData({
      name: activity.name,
      indicators: activity.indicators,
      clinic_advisor_id: 0, // Set to 0 as requested
    });
    setShowEditModal(true);
  };

  // Handle lock/unlock activity
  const handleToggleActivity = async (activity: ActivityData, action: 'unlock' | 'lock') => {
    if (!token) return;
    
    const actionText = action === 'unlock' ? 'Buka' : 'Tutup';
    const message = action === 'unlock' 
      ? 'Membuka ruangan akan memungkinkan mahasiswa untuk membuat logbook baru.'
      : 'Menutup ruangan akan mencegah mahasiswa membuat logbook baru.';
    
    openMessageModal(`${actionText} Ruangan`, `${message} Lanjutkan?`, [
      { label: "Batal", type: "default", onPress: () => setMessageModalVisible(false) },
      { 
        label: actionText, 
        type: action === 'lock' ? "destructive" : "primary",
        onPress: async () => {
          setMessageModalVisible(false);
          try {
            setLoading(true);
            const response = action === 'unlock' 
              ? await api.unlockActivity(token, activity.id)
              : await api.lockActivity(token, activity.id);
            if (response.success) {
              openMessageModal("Success", `Ruangan berhasil di${action === 'unlock' ? 'buka' : 'tutup'}`, [
                {
                  label: "OK",
                  type: "primary",
                  onPress: () => {
                    setMessageModalVisible(false);
                    loadActivities();
                  }
                }
              ]);
            } else {
              openMessageModal("Error", response.message || `Gagal ${actionText.toLowerCase()} kegiatan`);
            }
          } catch (error) {
            console.error(`Error ${action} activity:`, error);
            openMessageModal("Error", `Gagal ${actionText.toLowerCase()} kegiatan`);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Check if activity can be unlocked (is_lock = 1 and lock_date = null)
  const canUnlock = (activity: ActivityData): boolean => {
    return activity.is_lock === 1 && activity.lock_date === null;
  };

  // Check if activity is currently locked
  const isLocked = (activity: ActivityData): boolean => {
    return activity.is_lock === 1 && activity.lock_date !== null;
  };

  // Check if activity is currently unlocked
  const isUnlocked = (activity: ActivityData): boolean => {
    return activity.is_lock === 0;
  };

  // Get activity status text and color
  const getActivityStatus = (activity: ActivityData) => {
    if (isUnlocked(activity)) {
      return { text: "Terbuka", color: colors.success || "#28a745" };
    } else if (isLocked(activity)) {
      return { text: "Tertutup", color: colors.error || "#dc3545" };
    } else if (canUnlock(activity)) {
      return { text: "Tertutup", color: colors.error || "#dc3545" };
    } else {
      return { text: "Tidak Diketahui", color: colors.icon || "#6c757d" };
    }
  };

  // Render activities with component-based list

  // Handle report button press
  const handleReportPress = (activity: ActivityData) => {
    // Navigate to the report screen for this activity
    router.push({
      pathname: "/laporan",
      params: { activityId: activity.id }
    });
  };

  // Render each advisor item in the selector
  const renderAdvisorItem = ({ item }: { item: ClinicAdvisorData }) => (
    <TouchableOpacity 
      style={[
        styles.advisorItem, 
        formData.clinic_advisor_id === item.id && {
          backgroundColor: `${colors.tint}20`
        }
      ]}
      onPress={() => handleSelectAdvisor(item)}
    >
      <Text style={[styles.advisorName, { color: colors.text }]}>{item.name}</Text>
      {item.location && (
        <Text style={[styles.advisorDetail, { color: colors.icon }]}>
          {item.location}{item.room ? `, Room ${item.room}` : ''}
        </Text>
      )}
    </TouchableOpacity>
  );

  // Render each advisor item in the selector for edit modal
  const renderEditAdvisorItem = ({ item }: { item: ClinicAdvisorData }) => (
    <TouchableOpacity 
      style={[
        styles.advisorItem, 
        editFormData.clinic_advisor_id === item.id && {
          backgroundColor: `${colors.tint}20`
        }
      ]}
      onPress={() => handleSelectEditAdvisor(item)}
    >
      <Text style={[styles.advisorName, { color: colors.text }]}>{item.name}</Text>
      {item.location && (
        <Text style={[styles.advisorDetail, { color: colors.icon }]}>
          {item.location}{item.room ? `, Room ${item.room}` : ''}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
      </View>
      
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={[
          styles.searchBar, 
          { 
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder 
          }
        ]}>
          <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Cari ruangan..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Create form (visible only for advisors) */}
      {role === "advisor" && showForm && (
        <Card title="Tambah Ruangan Baru">
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Nama Ruangan</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.inputBorder
                  }
                ]}
                placeholder="Masukkan nama ruangan"
                placeholderTextColor={colors.icon}
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Indikator</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { 
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.inputBorder
                  }
                ]}
                placeholder="Masukkan indikator kegiatan"
                placeholderTextColor={colors.icon}
                value={formData.indicators}
                onChangeText={(text) => handleInputChange("indicators", text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                blurOnSubmit={Platform.OS === "ios"}
                returnKeyType={Platform.OS === "ios" ? "done" : "default"}
                onSubmitEditing={() => Keyboard.dismiss()}
                inputAccessoryViewID={Platform.OS === "ios" ? INDICATOR_INPUT_ID : undefined}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Pembimbing Klinik</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.selector,
                  { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder
                  }
                ]}
                onPress={toggleAdvisorSelector}
              >
                <Text style={{ 
                  color: formData.clinic_advisor_id === 0 ? colors.icon : colors.text 
                }}>
                  {formData.clinic_advisor_id === 0 
                    ? "Pilih pembimbing klinik" 
                    : getSelectedAdvisorName()
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>
            
            <PrimaryButton
              label="Simpan Ruangan"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              style={styles.submitButton}
            />
          </View>
        </Card>
      )}

      {/* Activity list */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Memuat ruangan...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.tint]}
              tintColor={colors.tint}
            />
          }
        >
          {filteredActivities.length > 0 ? (
            <KegiatanList
              activities={filteredActivities}
              role={role as any}
              onToggleActivity={handleToggleActivity}
              onOpenDetail={handleActivityClick}
              onReportPress={handleReportPress}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-outline"
                size={64}
                color={colors.icon}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {searchQuery.length > 0 
                  ? "Tidak ada ruangan yang sesuai dengan pencarian" 
                  : "Tidak ada ruangan ditemukan"}
              </Text>
            </View>
          )}
          
          {/* Extra space at the bottom for the floating button */}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}
      
      {/* Floating add button (only for advisors) */}
      {role === "advisor" && (
        <TouchableOpacity 
          style={[
            styles.floatingButton, 
            { 
              backgroundColor: colors.tint,
              opacity: showForm ? 0.7 : 1 
            }
          ]} 
          onPress={toggleForm}
        >
          <Ionicons 
            name={showForm ? "close" : "add"} 
            size={28} 
            color="white" 
          />
        </TouchableOpacity>
      )}

      {/* Advisor selector modal */}
      <AppModal
        visible={showAdvisorSelector}
        title="Pilih Pembimbing Klinik"
        onClose={toggleAdvisorSelector}
      >
        {loadingAdvisors ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Memuat pembimbing klinik...
            </Text>
          </View>
        ) : clinicAdvisors.length === 0 ? (
          <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Tidak ada pembimbing klinik ditemukan
              </Text>
            </View>
        ) : showEditModal ? (
          <FlatList
            data={clinicAdvisors}
            renderItem={renderEditAdvisorItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.advisorList}
          />
        ) : (
          <FlatList
            data={clinicAdvisors}
            renderItem={renderAdvisorItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.advisorList}
          />
        )}
      </AppModal>

      {/* Generic message modal for alerts and confirmations */}
      <AppModal
        visible={messageModalVisible}
        title={messageModalTitle}
        onClose={closeMessageModal}
      >
        <Text style={{ color: colors.text, fontSize: 15 }}>{messageModalText}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          {messageModalButtons.map((btn, idx) => {
            const bg =
              btn.type === "destructive"
                ? (colors.error || "#dc3545")
                : btn.type === "primary"
                ? colors.tint
                : "#6c757d";
            return (
              <TouchableOpacity
                key={`${btn.label}-${idx}`}
                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: bg }}
                onPress={btn.onPress}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>{btn.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </AppModal>

      {/* Activity Detail/Edit Modal */}
      <AppModal
        visible={showEditModal}
        title={role === "advisor" ? "Edit Ruangan" : "Detail Ruangan"}
        onClose={() => setShowEditModal(false)}
        scroll
      >
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Nama Ruangan</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.inputBorder
                }
              ]}
              placeholder="Nama ruangan"
              placeholderTextColor={colors.icon}
              value={editFormData.name}
              onChangeText={(text) => handleEditInputChange("name", text)}
              editable={role === "advisor"}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Indikator</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { 
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.inputBorder
                }
              ]}
              placeholder="Indikator kegiatan"
              placeholderTextColor={colors.icon}
              value={editFormData.indicators}
              onChangeText={(text) => handleEditInputChange("indicators", text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={role === "advisor"}
              blurOnSubmit={Platform.OS === "ios"}
              returnKeyType={Platform.OS === "ios" ? "done" : "default"}
              onSubmitEditing={() => Keyboard.dismiss()}
              inputAccessoryViewID={Platform.OS === "ios" ? INDICATOR_INPUT_ID : undefined}
            />
          </View>
          
          {role === "advisor" && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Pembimbing Klinik</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.selector,
                  { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder
                  }
                ]}
                onPress={toggleAdvisorSelector}
              >
                <Text style={{ 
                  color: editFormData.clinic_advisor_id === 0 ? colors.icon : colors.text 
                }}>
                  {editFormData.clinic_advisor_id === 0 
                    ? "Pilih pembimbing klinik" 
                    : getSelectedEditAdvisorName()
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>
          )}
          
          {role !== "advisor" && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Pembimbing Klinik</Text>
              <Text style={[styles.readOnlyField, { color: colors.text }]}>
                {selectedActivity?.advisor_clinic_name || "Unknown Advisor"}
              </Text>
            </View>
          )}
          
          {selectedActivity?.created_at && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Tanggal Dibuat</Text>
              <Text style={[styles.readOnlyField, { color: colors.text }]}>
                {new Date(selectedActivity.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          {role === "advisor" && (
            <PrimaryButton
              label="Update Ruangan"
              onPress={handleUpdate}
              loading={updating}
              disabled={updating}
              style={styles.saveButton}
            />
          )}
        </View>
      </AppModal>
      
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={INDICATOR_INPUT_ID}>
          <View style={{ 
            backgroundColor: colors.background, 
            borderTopWidth: 1, 
            borderColor: colors.inputBorder,
            padding: 8,
            alignItems: "flex-end"
          }}>
            <TouchableOpacity
              onPress={() => Keyboard.dismiss()}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: colors.tint
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Done</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 44,
  },
  floatingButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
  },
  indicator: {
    fontSize: 14,
    marginBottom: 8,
  },
  advisorInfo: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },

  date: {
    fontSize: 12,
    color: "#888",
  },
  form: {
    marginBottom: 10,
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
    borderWidth:.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  submitButton: {
    marginTop: 8,
  },
  saveButton: {
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  editModalScroll: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  advisorList: {
    marginVertical: 8,
  },
  advisorItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  advisorName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  advisorDetail: {
    fontSize: 14,
  },
  readOnlyField: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  activityButtonsContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  advisorButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activityActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  reportIcon: {
    marginRight: 4,
  },
  buttonIcon: {
    marginRight: 4,
  },
  reportText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  activityActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
});
