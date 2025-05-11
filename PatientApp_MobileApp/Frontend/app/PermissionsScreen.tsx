import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from './i18n/LanguageContext';


const { width } = Dimensions.get('window');

export default function PermissionsScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('appPermissions')}</Text>
        <View style={styles.permissionItem}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>📷</Text>
          </View>
          <View style={styles.permissionTextContainer}>
            <Text style={styles.permissionTitle}>{t('camera')}</Text>
            <Text style={styles.permissionDescription}>
              {t('cameraPermissionDescription')}
            </Text>
          </View>
        </View>
        <View style={styles.permissionItem}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🔔</Text>
          </View>
          <View style={styles.permissionTextContainer}>
            <Text style={styles.permissionTitle}>{t('notifications')}</Text>
            <Text style={styles.permissionDescription}>
              {t('notificationsPermissionDescription')}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.continueButton} onPress={() => router.replace('/HomeScreen')}>
          <Text style={styles.continueButtonText}>{t('continue')}</Text>
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
    marginBottom: 22,
    textAlign: 'center',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 18,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  icon: {
    fontSize: 22,
    color: '#E53935',
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 