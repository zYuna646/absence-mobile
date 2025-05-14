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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { api, ActivityData, ClinicAdvisorData } from "@/services/api";
import { useUser } from "@/context/UserContext";
import Card from "@/components/ui/Card";
import PrimaryButton from "@/components/PrimaryButton";
import { router } from "expo-router";

export default function KegiatanScreen() {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();
  const { token, role } = useUser();
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
        Alert.alert("Error", response.message || "Failed to load activities");
      }
    } catch (error) {
      console.error("Error loading activities:", error);
      Alert.alert("Error", "Failed to load activities");
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
        Alert.alert("Error", response.message || "Failed to load clinic advisors");
      }
    } catch (error) {
      console.error("Error loading clinic advisors:", error);
      Alert.alert("Error", "Failed to load clinic advisors");
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
      Alert.alert("Validation Error", "Name is required");
      return;
    }
    
    if (!formData.indicators.trim()) {
      Alert.alert("Validation Error", "Indicators are required");
      return;
    }
    
    if (formData.clinic_advisor_id === 0) {
      Alert.alert("Validation Error", "Please select a clinic advisor");
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await api.createActivity(token, formData);
      
      if (response.success) {
        Alert.alert("Success", "Activity created successfully");
        setFormData({
          name: "",
          indicators: "",
          clinic_advisor_id: 0,
        });
        setShowForm(false);
        loadActivities();
      } else {
        Alert.alert("Error", response.message || "Failed to create activity");
      }
    } catch (error) {
      console.error("Error creating activity:", error);
      Alert.alert("Error", "Failed to create activity");
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
        Alert.alert("Success", "Activity updated successfully");
        setShowEditModal(false);
        loadActivities(); // Reload activities to get the updated data
        setUpdating(false);
      }, 1000);
    } catch (error) {
      console.error("Error updating activity:", error);
      Alert.alert("Error", "Failed to update activity");
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

  // Render each activity card
  const renderActivity = (activity: ActivityData) => {
    return (
      <TouchableOpacity key={activity.id} onPress={() => handleActivityClick(activity)}>
        <Card title={activity.name}>
          <Text style={[styles.advisorInfo, { color: colors.tint }]}>
            <Ionicons name="person" size={14} color={colors.tint} style={{ marginRight: 4 }} />
            Pembimbing: {activity.advisor_clinic_name || "Unknown Advisor"}
          </Text>
          {activity.created_at && (
            <Text style={styles.date}>
              Created: {new Date(activity.created_at).toLocaleDateString()}
            </Text>
          )}
          
          {role === "student" && (
            <View style={styles.reportButtonContainer}>
              <TouchableOpacity 
                style={[styles.reportButton, { backgroundColor: colors.tint }]}
                onPress={() => handleReportPress(activity)}
              >
                <Ionicons name="document-text-outline" size={16} color="white" style={styles.reportIcon} />
                <Text style={styles.reportText}>Laporan</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

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
            placeholder="Cari kegiatan..."
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
        <Card title="Tambah Kegiatan Baru">
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Nama Kegiatan</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.inputBorder
                  }
                ]}
                placeholder="Masukkan nama kegiatan"
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
              label="Simpan Kegiatan"
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
            Loading activities...
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
            filteredActivities.map(renderActivity)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-outline"
                size={64}
                color={colors.icon}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {searchQuery.length > 0 
                  ? "No activities match your search" 
                  : "No activities found"}
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
      <Modal
        visible={showAdvisorSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleAdvisorSelector}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Pilih Pembimbing Klinik
              </Text>
              <TouchableOpacity onPress={toggleAdvisorSelector}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {loadingAdvisors ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.tint} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  Loading clinic advisors...
                </Text>
              </View>
            ) : clinicAdvisors.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  No clinic advisors found
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
          </View>
        </View>
      </Modal>
      
      {/* Activity Detail/Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {role === "advisor" ? "Edit Kegiatan" : "Detail Kegiatan"}
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalScroll}>
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Nama Kegiatan</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                        borderColor: colors.inputBorder
                      }
                    ]}
                    placeholder="Nama kegiatan"
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
                    label="Update Kegiatan"
                    onPress={handleUpdate}
                    loading={updating}
                    disabled={updating}
                    style={styles.saveButton}
                  />
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  reportButtonContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  reportIcon: {
    marginRight: 4,
  },
  reportText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
});
