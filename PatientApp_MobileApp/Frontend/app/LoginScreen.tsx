import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from './i18n/LanguageContext';

const { width } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE;

export default function LoginScreen() {
  const [patientId, setPatientId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  const handleLogin = async () => {
    if (!patientId.trim() || !password.trim()) {
      Alert.alert(
        t('errorTitle') || 'Error',
        t('emptyFieldsError') || 'Please fill in all fields'
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientid: patientId,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        router.replace({
          pathname: '/HomeScreen',
          params: {
            name: data.name,
            patientId: patientId
          }
        });
      } else {
        Alert.alert(
          t('errorTitle') || 'Error',
          data.detail || t('loginError') || 'Login failed'
        );
      }
    } catch (error) {
      Alert.alert(
        t('errorTitle') || 'Error',
        t('networkError') || 'Network error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('welcomeBack')}</Text>
        <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('patientId')}</Text>
            <TextInput
              style={styles.input}
              value={patientId}
              onChangeText={setPatientId}
              placeholder={t('enterPatientId')}
              keyboardType="numeric"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('password')}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('enterPassword')}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>{t('login')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => router.push('/SignUpScreen')}
          >
            <Text style={styles.signupButtonText}>{t('noAccount')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7'
  },
  content: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: 60
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 40
  },
  form: {
    width: '100%'
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1A202C',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  loginButton: {
    backgroundColor: '#E53935',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  signupButton: {
    marginTop: 16,
    alignItems: 'center'
  },
  signupButtonText: {
    color: '#4A5568',
    fontSize: 14
  }
}); 