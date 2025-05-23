import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from './i18n/LanguageContext';

const { width } = Dimensions.get('window');

export default function DataConsentScreen() {
  const router = useRouter();
  const [agreed, setAgreed] = React.useState(false);
  const { t } = useLanguage();

  const { name, patientId: patientIdParam } = useLocalSearchParams() as { name?: string, patientId?: string };
  const patientId = patientIdParam;

  const patientCredentials = {
    name: name,    
    patientId: patientId, 
    
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('dataUsageConsent')}</Text>
        <Text style={styles.description}>
          {t('dataConsentDescription')}
        </Text>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18, alignSelf: 'flex-start' }} onPress={() => setAgreed(!agreed)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <View style={styles.checkboxInner} />}
          </View>
          <Text style={styles.agreement}>{t('privacyAgreement')}</Text>
        </Pressable>
        <TouchableOpacity
          style={[styles.button, !agreed && styles.disabledButton]}
          onPress={() => agreed && router.replace({pathname:'/PermissionsScreen',params: patientCredentials})}
          disabled={!agreed}
        >
          <Text style={[styles.buttonText, !agreed && styles.disabledButtonText]}>{t('agreeAndContinue')}</Text>
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
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 20,
  },
  agreement: {
    fontSize: 13,
    color: '#444',
    textAlign: 'left',
    marginBottom: 0,
    marginLeft: 8,
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#B0B7BF',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#E53935',
    backgroundColor: '#E53935',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    width: '100%',
    backgroundColor: '#B0B7BF',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 0,
  },
  disabledButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 