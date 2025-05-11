import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from './i18n/LanguageContext';

export default function LanguageScreen() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<'en' | 'ms' | 'zh' | 'ta'>(language as any);

  const handleConfirm = async () => {
    await setLanguage(selectedLang as any);
    router.replace('/LoginScreen');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/mascot.png')} style={styles.mascotImage} />
          <Text style={styles.appName}>Stelggin</Text>
        </View>
        <Text style={styles.welcome}>Welcome</Text>
        <Text style={styles.subtitle}>Please select your language / Sila pilih bahasa anda</Text>
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionRow} onPress={() => setSelectedLang('en')}>
            <Text style={styles.optionLabel}>English</Text>
            <View style={[styles.radioOuter, selectedLang === 'en' && styles.radioOuterSelected]}>
              {selectedLang === 'en' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={() => setSelectedLang('ms')}>
            <Text style={styles.optionLabel}>Bahasa Melayu</Text>
            <View style={[styles.radioOuter, selectedLang === 'ms' && styles.radioOuterSelected]}>
              {selectedLang === 'ms' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={() => setSelectedLang('zh')}>
            <Text style={styles.optionLabel}>中文 (Chinese)</Text>
            <View style={[styles.radioOuter, selectedLang === 'zh' && styles.radioOuterSelected]}>
              {selectedLang === 'zh' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={() => setSelectedLang('ta')}>
            <Text style={styles.optionLabel}>தமிழ் (Tamil)</Text>
            <View style={[styles.radioOuter, selectedLang === 'ta' && styles.radioOuterSelected]}>
              {selectedLang === 'ta' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#222',
    marginRight: 8,
  },
  mascotImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginRight: 10,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#444',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 28,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  optionLabel: {
    fontSize: 16,
    color: '#222',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#bbb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  radioOuterSelected: {
    borderColor: '#E53935',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E53935',
  },
  confirmBtn: {
    width: '100%',
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});