import React from "react";
import { Modal, View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface AppModalProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  scroll?: boolean;
  maxHeight?: number | string;
}

const AppModal: React.FC<AppModalProps> = ({
  visible,
  title,
  onClose,
  children,
  scroll = false,
  maxHeight = "80%",
}) => {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();

  const ContentWrapper = scroll ? ScrollView : View;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.background, maxHeight },
          ]}
        >
          {(title || true) && (
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Ionicons
                name="close"
                size={24}
                color={colors.text}
                onPress={onClose}
              />
            </View>
          )}

          <ContentWrapper style={styles.content}>
            {children}
          </ContentWrapper>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
});

export default AppModal;
