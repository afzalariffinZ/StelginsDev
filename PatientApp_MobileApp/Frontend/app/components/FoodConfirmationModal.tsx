import React from 'react';
import { View, Text, Modal, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';

interface FoodConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onManualInput: () => void;
  selectedImage: string | null;
  foodName: string | undefined;
  t: (key: string, options?: { defaultValue: string }) => string;
}

const { width } = Dimensions.get('window');

const FoodConfirmationModal: React.FC<FoodConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  onManualInput,
  selectedImage,
  foodName,
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
            <Text style={styles.modalTitle}>{t('Confirmation') || 'Confirm Food'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={[styles.foodImage, { marginBottom: 12 }]} resizeMode="cover" />
          )}
          <Text style={styles.confirmationText}>
            {t('AiThink') || 'Our AI thinks this is:'}
          </Text>
          <Text style={styles.foodNameText}>{foodName || (t('unknownFood') || 'Unknown Food')}</Text>
          <Text style={styles.confirmationText}>
            {t('correctFood') || 'Is this correct?'}
          </Text>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={[styles.confirmationButton, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmationButtonText}>{t('yesFood') || 'Yes, Correct'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmationButton, styles.manualButton]}
              onPress={onManualInput}
            >
              <Text style={styles.confirmationButtonText}>{t('noFood') || 'No, Enter Manually'}</Text>
            </TouchableOpacity>
          </View>
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
  confirmationText: {
    fontSize: 16,
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  foodNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmButton: {
    backgroundColor: '#48BB78',
  },
  manualButton: {
    backgroundColor: '#F59E0B',
  },
  confirmationButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default FoodConfirmationModal; 