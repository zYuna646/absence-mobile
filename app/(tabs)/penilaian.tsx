import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import Card from "@/components/ui/Card";
import { Picker } from "@react-native-picker/picker";

type DummySubActivity = {
  id: number;
  name: string;
  description?: string;
  is_logbook_activity: boolean;
  categoryId: number;
  categoryName: string;
};
type DummyStudent = { id: number; name: string; nim: string };

type Assessment = {
  id: number;
  name: string;
  date: string; // ISO date
  selectedSubActivityIds: number[];
  scores: {
    studentId: number;
    perSub: { subId: number; score: string; note: string }[];
  }[];
};

export default function PenilaianScreen() {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();

  // Dummy data
  const subActivities: DummySubActivity[] = [
    {
      id: 11,
      name: "Anamnesis",
      description: "Menggali keluhan utama",
      is_logbook_activity: false,
      categoryId: 1,
      categoryName: "Klinik Dasar",
    },
    {
      id: 12,
      name: "Pemeriksaan Fisik",
      description: "Pemeriksaan tanda vital",
      is_logbook_activity: false,
      categoryId: 1,
      categoryName: "Klinik Dasar",
    },
    {
      id: 21,
      name: "Interpretasi Lab",
      description: "Menganalisis hasil lab",
      is_logbook_activity: false,
      categoryId: 2,
      categoryName: "Penunjang",
    },
  ];
  const students: DummyStudent[] = [
    { id: 1001, name: "Mahasiswa 1", nim: "NIM001" },
    { id: 1002, name: "Mahasiswa 2", nim: "NIM002" },
    { id: 1003, name: "Mahasiswa 3", nim: "NIM003" },
  ];

  // Local CRUD state
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [creating, setCreating] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  // Form state for create/edit
  const [formName, setFormName] = useState("");
  const [formDate, setFormDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [selectedSubIds, setSelectedSubIds] = useState<number[]>([]);
  const [studentScores, setStudentScores] = useState<{
    [studentId: number]: { [subId: number]: { score: string; note: string } };
  }>({});

  const subActivitiesByCategory = useMemo(() => {
    const map: {
      [catId: number]: { categoryName: string; subs: DummySubActivity[] };
    } = {};
    subActivities
      .filter((s) => !s.is_logbook_activity)
      .forEach((sa) => {
        if (!map[sa.categoryId]) {
          map[sa.categoryId] = { categoryName: sa.categoryName, subs: [] };
        }
        map[sa.categoryId].subs.push(sa);
      });
    return map;
  }, []);

  const startCreate = () => {
    setCreating(true);
    setEditIdx(null);
    setFormName("");
    setFormDate(new Date().toISOString().slice(0, 10));
    setSelectedSubIds([]);
    setStudentScores({});
  };

  const startEdit = (index: number) => {
    const a = assessments[index];
    setCreating(true);
    setEditIdx(index);
    setFormName(a.name);
    setFormDate(a.date);
    setSelectedSubIds(a.selectedSubActivityIds);
    const scoresMap: {
      [studentId: number]: { [subId: number]: { score: string; note: string } };
    } = {};
    a.scores.forEach((s) => {
      scoresMap[s.studentId] = {};
      s.perSub.forEach((ps) => {
        scoresMap[s.studentId][ps.subId] = { score: ps.score, note: ps.note };
      });
    });
    setStudentScores(scoresMap);
  };

  const cancelForm = () => {
    setCreating(false);
    setEditIdx(null);
  };

  const toggleSubSelection = (subId: number) => {
    setSelectedSubIds((prev) =>
      prev.includes(subId)
        ? prev.filter((id) => id !== subId)
        : [...prev, subId]
    );
  };

  const updateStudentScore = (
    studentId: number,
    subId: number,
    field: "score" | "note",
    value: string
  ) => {
    setStudentScores((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subId]: {
          ...((prev[studentId] || {})[subId] || { score: "", note: "" }),
          [field]: value,
        },
      },
    }));
  };

  const saveForm = () => {
    // Build payload
    const newAssessment: Assessment = {
      id: editIdx !== null ? assessments[editIdx].id : Date.now(),
      name: formName.trim() || "Penilaian Tanpa Nama",
      date: formDate,
      selectedSubActivityIds: selectedSubIds,
      scores: students.map((st) => ({
        studentId: st.id,
        perSub: selectedSubIds.map((subId) => ({
          subId,
          score: (studentScores[st.id]?.[subId]?.score || "").trim(),
          note: (studentScores[st.id]?.[subId]?.note || "").trim(),
        })),
      })),
    };

    // Simple validation: ensure score fields exist for selected subs
    const hasInvalid = newAssessment.scores.some((s) =>
      s.perSub.some(
        (ps) =>
          ps.score !== "" &&
          (isNaN(Number(ps.score)) ||
            Number(ps.score) < 0 ||
            Number(ps.score) > 100)
      )
    );
    if (hasInvalid) {
      Alert.alert("Validasi", "Nilai harus 0-100 atau dikosongkan");
      return;
    }

    if (editIdx !== null) {
      const copy = [...assessments];
      copy[editIdx] = newAssessment;
      setAssessments(copy);
    } else {
      setAssessments((prev) => [newAssessment, ...prev]);
    }
    cancelForm();
  };

  const deleteItem = (index: number) => {
    Alert.alert("Hapus", "Yakin ingin menghapus penilaian?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () =>
          setAssessments((prev) => prev.filter((_, i) => i !== index)),
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Penilaian</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.tint }]}
            onPress={startCreate}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Tambah</Text>
          </TouchableOpacity>
        </View>

        {/* List of Assessments */}
        {assessments.map((a, idx) => (
          <Card key={a.id} title={a.name}>
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              Tanggal Penilaian: {a.date}
            </Text>
            <View style={styles.rowGap}>
              <TouchableOpacity
                style={[styles.smallButton, { borderColor: colors.tint }]}
                onPress={() => startEdit(idx)}
              >
                <Ionicons name="create-outline" size={16} color={colors.tint} />
                <Text style={[styles.smallButtonText, { color: colors.tint }]}>
                  Edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, { borderColor: "#FF4D4D" }]}
                onPress={() => deleteItem(idx)}
              >
                <Ionicons name="trash-outline" size={16} color="#FF4D4D" />
                <Text style={[styles.smallButtonText, { color: "#FF4D4D" }]}>
                  Hapus
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {/* Create/Edit Form */}
        {creating && (
          <Card title={editIdx !== null ? "Edit Penilaian" : "Buat Penilaian"}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Nama Penilaian
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.inputBorder,
                  },
                ]}
                placeholder="Masukkan nama penilaian"
                placeholderTextColor={colors.icon}
                value={formName}
                onChangeText={setFormName}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Tanggal Penilaian
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.inputBorder,
                  },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.icon}
                value={formDate}
                onChangeText={setFormDate}
              />
            </View>

            {/* Repeater: Choose sub activities (only is_logbook_activity=false) */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Pilih Sub Aktivitas
              </Text>
              {Object.entries(subActivitiesByCategory).map(([catId, group]) => (
                <View key={catId} style={{ marginBottom: 12 }}>
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>
                    {group.categoryName}
                  </Text>
                  {group.subs.map((sub) => (
                    <TouchableOpacity
                      key={sub.id}
                      style={styles.checkboxRow}
                      onPress={() => toggleSubSelection(sub.id)}
                    >
                      <Ionicons
                        name={
                          selectedSubIds.includes(sub.id)
                            ? "checkbox"
                            : "square-outline"
                        }
                        size={20}
                        color={
                          selectedSubIds.includes(sub.id)
                            ? colors.tint
                            : colors.icon
                        }
                        style={{ marginRight: 8 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.checkboxLabel, { color: colors.text }]}
                        >
                          {sub.name}
                        </Text>
                        {!!sub.description && (
                          <Text
                            style={[
                              styles.checkboxDescription,
                              { color: colors.icon },
                            ]}
                          >
                            {sub.description}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            {/* Repeater: students with per selected sub inputs */}
            {selectedSubIds.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Nilai Per Mahasiswa
                </Text>
                {students.map((st) => (
                  <View key={st.id} style={styles.studentBlock}>
                    <Text style={[styles.studentTitle, { color: colors.text }]}>
                      {st.name} • {st.nim}
                    </Text>
                    {selectedSubIds.map((subId) => {
                      const sub = subActivities.find((s) => s.id === subId);
                      if (!sub) return null;
                      return (
                        <View
                          key={`${st.id}-${subId}`}
                          style={styles.subScoreRow}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[styles.subName, { color: colors.text }]}
                            >
                              {sub.name}
                            </Text>
                            {!!sub.description && (
                              <Text
                                style={[styles.subDesc, { color: colors.icon }]}
                              >
                                {sub.description}
                              </Text>
                            )}
                          </View>
                          <View style={styles.scoreInputs}>
                            <TextInput
                              style={[
                                styles.scoreInput,
                                {
                                  backgroundColor: colors.inputBackground,
                                  color: colors.text,
                                  borderColor: colors.inputBorder,
                                },
                              ]}
                              placeholder="Nilai"
                              placeholderTextColor={colors.icon}
                              keyboardType="numeric"
                              value={studentScores[st.id]?.[subId]?.score || ""}
                              onChangeText={(t) =>
                                updateStudentScore(st.id, subId, "score", t)
                              }
                            />
                            <TextInput
                              style={[
                                styles.noteInput,
                                {
                                  backgroundColor: colors.inputBackground,
                                  color: colors.text,
                                  borderColor: colors.inputBorder,
                                },
                              ]}
                              placeholder="Catatan"
                              placeholderTextColor={colors.icon}
                              value={studentScores[st.id]?.[subId]?.note || ""}
                              onChangeText={(t) =>
                                updateStudentScore(st.id, subId, "note", t)
                              }
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.inputBorder }]}
                onPress={cancelForm}
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.tint }]}
                onPress={saveForm}
              >
                <Text style={styles.saveText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: "700" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: { color: "white", marginLeft: 6, fontWeight: "600" },
  rowGap: { flexDirection: "row", gap: 8 },
  smallButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  smallButtonText: { marginLeft: 6, fontWeight: "600" },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  categoryTitle: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  checkboxLabel: { fontSize: 14, fontWeight: "600" },
  checkboxDescription: { fontSize: 12 },
  studentBlock: {
    borderWidth: 0.5,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  studentTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  subScoreRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  subName: { fontSize: 14, fontWeight: "600" },
  subDesc: { fontSize: 12, marginTop: 2 },
  scoreInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 12,
  },
  scoreInput: {
    width: 70,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  noteInput: {
    flex: 1,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelText: { fontWeight: "600" },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  saveText: { color: "white", fontWeight: "700" },
});
