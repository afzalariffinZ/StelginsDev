import React from 'react';
import { View, Text, Modal, TouchableOpacity, Image, TextInput, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';

interface ManualFoodInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  selectedImage: string | null;
  foodName: string;
  onFoodNameChange: (text: string) => void;
  isProcessing: boolean;
  t: (key: string, options?: { defaultValue: string }) => string;
}

const { width } = Dimensions.get('window');

const ManualFoodInputModal: React.FC<ManualFoodInputModalProps> = ({
  visible,
  onClose,
  onSubmit,
  selectedImage,
  foodName,
  onFoodNameChange,
  isProcessing,
  t
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('enterFood') || 'Enter Food Name'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={[styles.foodImage, { marginBottom: 12 }]} resizeMode="cover" />
          )}
          <TextInput
            style={styles.foodInput}
            value={foodName}
            onChangeText={onFoodNameChange}
            placeholder={t('enterFoodNamePlaceholder') || 'E.g., Chicken Rice, Salad'}
            placeholderTextColor="#A0AEC0"
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={onSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{t('analyzeFood') || 'Analyze This Food'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
  },
  modalClose: {
    fontSize: 24,
    color: '#A0AEC0',
    padding: 5,
  },
  foodImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#EDF2F7',
  },
  foodInput: {
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A202C',
    marginBottom: 20,
    backgroundColor: '#F7FAFC',
  },
  submitButton: {
    backgroundColor: '#E53935',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ManualFoodInputModal; 