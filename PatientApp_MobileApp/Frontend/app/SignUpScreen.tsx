import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from './i18n/LanguageContext';

const { width } = Dimensions.get('window');

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleSignUp = async () => { // Make the function async
      if (!name || !email || !password || !confirmPassword) { // TODO: Add age to this check if you make it required
        setError(t('allFieldsRequired'));
        return;
      }
      // Simple email format check
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRegex.test(email)) {
        setError(t('invalidEmail'));
        return;
      }
      if (password !== confirmPassword) {
        setError(t('passwordsDoNotMatch'));
        return;
      }
      // TODO: Add age validation if necessary (e.g., isNumeric, within a range)
  
      setError(''); // Clear previous errors
  
      try {
        // ---- START OF MODIFIED SECTION ----
        const API_URL = `${process.env.EXPO_PUBLIC_API_BASE}/signup_pat`;
  
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name,
            email: email,
            password: password, // Sending password, though backend doesn't store it for auth
            age: 0, // !! IMPORTANT: Placeholder for age. Add an age input to your form.
                    // Your FastAPI endpoint expects `age`.
                    // Change to: age: parseInt(age, 10) OR handle as needed.
          }),
        });
  
        const data = await response.json();
  
        if (response.ok && data.success) {

          const patientCredentials = {
            name: name,    
            patientId: patientId, 
            
          };
          // Sign up successful
          console.log('Sign up successful:', data.message);
          // You might want to pass some data to DataConsentScreen or store it
          router.replace('/DataConsentScreen');
        } else {
          // Sign up failed
          setError(data.message || t('signUpFailed'));
        }
        // ---- END OF MODIFIED SECTION ----
      } catch (err) {
        console.error('Sign up API call error:', err);
        setError(t('networkError'));
      }
    };
  
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.logoContainer}>
                    <Image source={require('../assets/images/mascot.png')} style={styles.mascotImage} />
                    <Text style={styles.appName}>Stelggin</Text>
                  </View>
          <Text style={styles.title}>{t('signUp')}</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('name')}</Text>
            <TextInput
              style={[styles.input, error && !name ? styles.inputError : null]}
              placeholder=""
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
            />
          </View>
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
          {/* TODO: Add an Age input field here */}
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
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('confirmPassword')}</Text>
            <TextInput
              style={[styles.input, error && (!confirmPassword || password !== confirmPassword) ? styles.inputError : null]}
              placeholder=""
              placeholderTextColor="#aaa"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleSignUp}
          >
            <Text style={styles.signUpButtonText}>{t('signUp')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/LoginScreen')}>
            <Text style={styles.loginLink}>{t('alreadyHaveAccount')}</Text>
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
    width: 54,
    height: 54,
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
  signUpButton: {
    width: '100%',
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    color: '#E53935',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
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