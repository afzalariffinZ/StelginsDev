import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Modal, Pressable, Switch, BackHandler, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from './i18n/LanguageContext';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';

const { width, height: windowHeight } = Dimensions.get('window');

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [modalContentType, setModalContentType] = useState<'tos' | 'privacy' | null>(null);

  const handleLanguageSelect = async (lang: 'en' | 'ms' | 'zh' | 'ta') => {
    await setLanguage(lang as any);
    setLanguageModalVisible(false);
  };

  useEffect(() => {
    const onBackPress = () => {
      if (languageModalVisible) {
        setLanguageModalVisible(false);
        return true;
      }
      if (infoModalVisible) {
        setInfoModalVisible(false);
        return true;
      }
      console.log("Hardware back press on this screen");
      return false;
    };

    const backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => {
      console.log("Removing BackHandler listener as component unmounts");
      backHandlerSubscription.remove();
    };
  }, [languageModalVisible, infoModalVisible]);


  const { name, patientId: patientIdParam } = useLocalSearchParams() as { name?: string, patientId?: string };
  const patientId = patientIdParam;

  const patientCredentials = {
    name: name,
    patientId: patientId,
  };

  const handleLogout = () => {
    Alert.alert(
      t('logoutConfirmationTitle') || 'Logout',
      t('logoutConfirmationMessage') || 'Are you sure you want to logout?',
      [
        {
          text: t('cancel') || 'Cancel',
          style: 'cancel'
        },
        {
          text: t('logout') || 'Logout',
          onPress: () => {
            router.replace('/LoginScreen');
          }
        }
      ]
    );
  };

  const renderInfoModalContent = () => {
    switch (modalContentType) {
      case 'tos':
        return <TermsOfService t={t} />;
      case 'privacy':
        return <PrivacyPolicy t={t} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>{t('settings')}</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => router.replace({pathname:'/ProfileScreen',params:patientCredentials})}>
            <View style={styles.iconCircle}><Text style={styles.icon}>👤</Text></View>
            <Text style={styles.rowLabel}>{t('profile')}</Text>
            <View style={styles.rowRight}><Text style={styles.rowArrow}>›</Text></View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => setLanguageModalVisible(true)}>
            <View style={styles.iconCircle}><Text style={styles.icon}>🌐</Text></View>
            <Text style={styles.rowLabel}>{t('language')}</Text>
            <View style={styles.rowRight}><Text style={styles.rowValue}>{language === 'en' ? 'English' : language === 'ms' ? 'Bahasa Melayu' : language === 'zh' ? '中文 (Chinese)' : language === 'ta' ? 'தமிழ் (Tamil)' : ''}</Text></View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => setNotificationsEnabled(!notificationsEnabled)}>
            <View style={styles.iconCircle}><Text style={styles.icon}>🔔</Text></View>
            <Text style={styles.rowLabel}>{t('notification')}</Text>
            <View style={styles.rowRight}>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                thumbColor={notificationsEnabled ? '#E53935' : '#ccc'}
                trackColor={{ false: '#eee', true: '#FDEAEA' }}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => {
            setModalContent('terms');
            setShowInfoModal(true);
          }}>
            <View style={styles.iconCircle}><Text style={styles.icon}>📄</Text></View>
            <Text style={styles.rowLabel}>{t('tos')}</Text>
            <View style={styles.rowRight}><Text style={styles.rowArrow}>›</Text></View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => {
            setModalContent('privacy');
            setShowInfoModal(true);
          }}>
            <View style={styles.iconCircle}><Text style={styles.icon}>🛡️</Text></View>
            <Text style={styles.rowLabel}>{t('privacy')}</Text>
            <View style={styles.rowRight}><Text style={styles.rowArrow}>›</Text></View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/HomeScreen',params: patientCredentials})}><Text style={[styles.navIcon]}>🏠</Text><Text style={[styles.navLabel]}>{t('home')}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/AIChatScreen',params: patientCredentials})}><Text style={styles.navIcon}>💬</Text><Text style={styles.navLabel}>{t('stelgginAI')}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/ProgressScreen',params: patientCredentials})}><Text style={styles.navIcon}>📊</Text><Text style={styles.navLabel}>{t('progress')}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/SettingsScreen',params: patientCredentials})}><Text style={[styles.navIcon, styles.navIconActive]}>⚙️</Text><Text style={[styles.navLabel, styles.navLabelActive]}>{t('settings')}</Text></TouchableOpacity>
      </View>

      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLanguageModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>{t('language')}</Text>
            <TouchableOpacity style={styles.modalOption} onPress={() => handleLanguageSelect('en')}>
              <Text style={[styles.modalOptionText, language === 'en' && styles.modalOptionTextActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={() => handleLanguageSelect('ms')}>
              <Text style={[styles.modalOptionText, language === 'ms' && styles.modalOptionTextActive]}>Bahasa Melayu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={() => handleLanguageSelect('zh')}>
              <Text style={[styles.modalOptionText, language === 'zh' && styles.modalOptionTextActive]}>中文 (Chinese)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={() => handleLanguageSelect('ta')}>
              <Text style={[styles.modalOptionText, language === 'ta' && styles.modalOptionTextActive]}>தமிழ் (Tamil)</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={infoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setInfoModalVisible(false)}>
          {/* Prevent modal content from closing when pressed */}
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalContent, styles.infoModalContentContainer]}>
              <Text style={styles.modalHeader}>
                {modalContentType === 'tos' ? t('tos') : modalContentType === 'privacy' ? t('privacy') : ''}
              </Text>
              <ScrollView style={styles.infoModalScrollView}>
                  {renderInfoModalContent()}
              </ScrollView>
              <TouchableOpacity style={styles.closeButton} onPress={() => setInfoModalVisible(false)}>
                  <Text style={styles.closeButtonText}>{t('close')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 2
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
    paddingTop: 18
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 20,
    paddingLeft: 4
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 18,
    ...cardShadow
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: '#2d3748',
    marginLeft: 16
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rowValue: {
    color: '#718096',
    fontSize: 15,
    marginRight: 6
  },
  rowArrow: {
    color: '#a0aec0',
    fontSize: 24,
    marginLeft: 8
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDEAEA',
    justifyContent: 'center',
    alignItems: 'center'
  },
  icon: {
    fontSize: 18,
    color: '#E53935'
  },
  logoutCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    marginBottom: 25,
    ...cardShadow
  },
  logoutIcon: {
    color: '#E53935',
    fontSize: 20,
    marginRight: 10
  },
  logoutText: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: '600'
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 75,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: Platform.OS === 'ios' ? 15 : 5,
    zIndex: 1000
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  navIcon: {
    fontSize: 26,
    marginBottom: 4,
    color: '#A0AEC0'
  },
  navIconActive: {
    color: '#E53935'
  },
  navLabel: {
    fontSize: 10,
    color: '#718096',
    fontWeight: '500'
  },
  navLabelActive: {
    color: '#E53935',
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: { // Base style for modals
    width: width * 0.9, // Wider modal
    maxWidth: 450,
    backgroundColor: '#fff',
    borderRadius: 16, // More rounded
    padding: 20, // Uniform padding
    elevation: 10, // More pronounced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHeader: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 20,
    color: '#E53935',
    textAlign: 'center'
  },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7'
  },
  modalOptionText: {
    fontSize: 16,
    color: '#2d3748',
    textAlign: 'center'
  },
  modalOptionTextActive: {
    color: '#E53935',
    fontWeight: 'bold'
  },
  infoModalContentContainer: {
    maxHeight: windowHeight * 0.85,
    paddingHorizontal: 5
  },
  infoModalScrollView: {
    marginBottom: 20,
    paddingHorizontal: 15
  },
  infoModalHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 15,
    textAlign: 'center'
  },
  infoModalSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2d3748',
    marginTop: 20,
    marginBottom: 8
  },
  infoModalParagraph: {
    fontSize: 15,
    color: '#4a5568',
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'justify'
  },
  infoModalListItem: {
    fontSize: 15,
    color: '#4a5568',
    lineHeight: 22,
    marginBottom: 6,
    marginLeft: 10
  },
  infoModalStrong: {
    fontWeight: 'bold',
    color: '#2d3748'
  },
  closeButton: {
    backgroundColor: '#E53935',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'center'
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C'
  },
  modalClose: {
    fontSize: 24,
    color: '#A0AEC0',
    padding: 5
  }
});