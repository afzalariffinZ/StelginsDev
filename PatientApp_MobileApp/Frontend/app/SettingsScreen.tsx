import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Modal, Pressable, Switch, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from './i18n/LanguageContext';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [languageModalVisible, setLanguageModalVisible] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleLanguageSelect = async (lang: 'en' | 'ms' | 'zh' | 'ta') => {
    await setLanguage(lang as any);
    setLanguageModalVisible(false);
  };

  useEffect(() => {
    const onBackPress = () => {
      // Your back press logic
      console.log("Hardware back press on this screen");
      // Return true to prevent default behavior (e.g., exiting app, going back in nav stack)
      // Return false to allow default behavior
      return false; // Example: allow default back behavior
    };

    // Add the event listener and store the subscription
    const backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    // Cleanup function: This is called when the component unmounts
    return () => {
      console.log("Removing BackHandler listener as component unmounts");
      backHandlerSubscription.remove(); // Correct way to remove the listener
    };
  }, []); // Add any dependencies if `onBackPress` uses props or state



  const { name, patientId: patientIdParam } = useLocalSearchParams() as { name?: string, patientId?: string };
  const patientId = patientIdParam;

  const patientCredentials = {
    name: name,    
    patientId: patientId, 
    
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
          <TouchableOpacity style={styles.row}>
            <View style={styles.iconCircle}><Text style={styles.icon}>📄</Text></View>
            <Text style={styles.rowLabel}>{t('about')}</Text>
            <View style={styles.rowRight}><Text style={styles.rowArrow}>›</Text></View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <View style={styles.iconCircle}><Text style={styles.icon}>🛡️</Text></View>
            <Text style={styles.rowLabel}>{t('help')}</Text>
            <View style={styles.rowRight}><Text style={styles.rowArrow}>›</Text></View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoutCard} onPress={() => router.replace('/LoginScreen')}>
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
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} onPress={() => setLanguageModalVisible(false)}>
          <View style={{ position: 'absolute', left: 32, right: 32, top: 180, backgroundColor: '#fff', borderRadius: 14, padding: 24, elevation: 8 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 17, marginBottom: 18, color: '#E53935' }}>{t('language')}</Text>
            <TouchableOpacity style={{ paddingVertical: 12 }} onPress={() => handleLanguageSelect('en')}>
              <Text style={{ fontSize: 16, color: language === 'en' ? '#E53935' : '#222', fontWeight: language === 'en' ? 'bold' : 'normal' }}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingVertical: 12 }} onPress={() => handleLanguageSelect('ms')}>
              <Text style={{ fontSize: 16, color: language === 'ms' ? '#E53935' : '#222', fontWeight: language === 'ms' ? 'bold' : 'normal' }}>Bahasa Melayu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingVertical: 12 }} onPress={() => handleLanguageSelect('zh')}>
              <Text style={{ fontSize: 16, color: language === 'zh' ? '#E53935' : '#222', fontWeight: language === 'zh' ? 'bold' : 'normal' }}>中文 (Chinese)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingVertical: 12 }} onPress={() => handleLanguageSelect('ta')}>
              <Text style={{ fontSize: 16, color: language === 'ta' ? '#E53935' : '#222', fontWeight: language === 'ta' ? 'bold' : 'normal' }}>தமிழ் (Tamil)</Text>
            </TouchableOpacity>
          </View>
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
  elevation: 2,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 18,
    ...cardShadow,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    marginLeft: 12,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    color: '#888',
    fontSize: 14,
    marginRight: 4,
  },
  rowArrow: {
    color: '#bbb',
    fontSize: 22,
    marginLeft: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    color: '#E53935',
  },
  logoutCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    marginBottom: 18,
    ...cardShadow,
  },
  logoutIcon: {
    color: '#E53935',
    fontSize: 18,
    marginRight: 8,
  },
  logoutText: {
    color: '#E53935',
    fontSize: 15,
    fontWeight: 'bold',
  },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E2E8F0', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 8, paddingBottom:  (Dimensions.get('window').height * 0.01) < 5 ? 5 : (Dimensions.get('window').height * 0.01), zIndex: 5, },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 24, marginBottom: 3, color: '#A0AEC0' },
  navIconActive: { color: '#E53935' },
  navLabel: { fontSize: 11, color: '#718096' },
  navLabelActive: { color: '#E53935', fontWeight: '600' },
}); 