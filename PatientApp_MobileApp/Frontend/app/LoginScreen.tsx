import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from './i18n/LanguageContext';

const { width } = Dimensions.get('window');

const API_URL = process.env.EXPO_PUBLIC_API_BASE;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleLogin = async () => { // Make the function async
    if (!email || !password) {
      setError(t('emailPasswordRequired'));
      return;
    }
    // Simple email format check
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email)) {
      setError(t('invalidEmail'));
      return;
    }
    setError(''); // Clear previous errors

    try {
      // ---- START OF MODIFIED SECTION ----
      const API_URL = `${process.env.EXPO_PUBLIC_API_BASE}/login_patient`; 

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Login successful
        // You might want to store user data from `data` (e.g., in context or async storage)
        console.log('Login successful, patient data:', data);

        const patientCredentials = {
          name: data.PatientName,    
          patientId: data.PatientID, 
          
        };

        if (typeof patientCredentials.name === 'undefined' || typeof patientCredentials.patientId === 'undefined') {
          console.warn(
              "Warning: 'name' or 'patientId' could not be extracted from the backend response. " +
              "Please check that the keys ('Name', 'PatientID' in this example) " +
              "match exactly with what your backend sends. Backend response data:",
              data
          );
      }

      console.log('Navigating to HomeScreen with params:', patientCredentials);
      router.replace({
        pathname: '/HomeScreen',
        params: patientCredentials, // Pass the extracted credentials
      });

      } else {
        // Login failed - backend returned success: false or an HTTP error
        setError(data.detail || t('Invalid Credentials')); // Use backend error message if available
      }
      // ---- END OF MODIFIED SECTION ----
    } catch (err) {
      console.error('Login API call error:', err);
      setError(t('networkError')); // Or a more generic t('loginFailed')
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/mascot.png')} style={styles.mascotImage} />
          <Text style={styles.appName}>Stelggin</Text>
        </View>
        <Text style={styles.title}>{t('login')}</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('email')}</Text>
          <TextInput
            style={[styles.input, error && !email ? styles.inputError : null]}
            placeholder={t('emailPlaceholder')}
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('password')}</Text>
          <TextInput
            style={[styles.input, error && !password ? styles.inputError : null]}
            placeholder=""
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>{t('login')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/SignUpScreen')}>
          <Text style={styles.signUp}>{t('signUp')}</Text>
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#222',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: '#222',
    marginBottom: 2,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fafafa',
    fontSize: 15,
  },
  forgotPassword: {
    alignSelf: 'flex-start',
    color: '#E53935',
    fontSize: 13,
    marginBottom: 16,
    marginTop: 2,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUp: {
    color: '#E53935',
    fontSize: 15,
    marginTop: 4,
  },
  inputError: {
    borderColor: '#E53935',
  },
  errorText: {
    color: '#E53935',
    fontSize: 13,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
}); 