import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/constants/Colors';

interface SelectorItem {
  id: number;
  name: string;
  subtitle?: string;
}

interface BottomSheetSelectorProps {
  visible: boolean;
  title: string;
  items: SelectorItem[];
  selectedId?: number;
  loading?: boolean;
  emptyText?: string;
  onSelect: (item: SelectorItem) => void;
  onClose: () => void;
  renderItem?: (item: SelectorItem, isSelected: boolean) => React.ReactNode;
}

export default function BottomSheetSelector({
  visible,
  title,
  items,
  selectedId,
  loading = false,
  emptyText = "Tidak ada data tersedia",
  onSelect,
  onClose,
  renderItem,
}: BottomSheetSelectorProps) {
  const colors = useThemeColor();

  const defaultRenderItem = ({ item }: { item: SelectorItem }): React.JSX.Element => {
    const isSelected = selectedId === item.id;
    
    if (renderItem) {
      const customRender = renderItem(item, isSelected);
      return customRender as React.JSX.Element;
    }

    return (
      <TouchableOpacity
        style={[
          styles.selectorItem,
          isSelected && { backgroundColor: `${colors.tint}20` },
        ]}
        onPress={() => onSelect(item)}
      >
        <Text style={[styles.selectorItemName, { color: colors.text }]}>
          {item.name}
        </Text>
        {item.subtitle && (
          <Text style={[styles.selectorItemSubtitle, { color: colors.icon }]}>
            {item.subtitle}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading...
              </Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {emptyText}
              </Text>
            </View>
          ) : (
            <FlatList
              data={items}
              renderItem={defaultRenderItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.selectorList}
              showsVerticalScrollIndicator={true}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  selectorList: {
    marginVertical: 8,
  },
  selectorItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  selectorItemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectorItemSubtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
}); 