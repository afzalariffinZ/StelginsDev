import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from './i18n/LanguageContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [DateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'web') {
      const { value } = event.target as HTMLInputElement;

      // Ignore empty strings while the user is still typing
      if (!value) return;

      const parsed = new Date(value);

      // Ignore obviously bad dates like 00-month or 32-day
      if (isNaN(parsed.getTime())) return;

      setDateOfBirth(parsed);
    } else {
      const currentDate = selectedDate || DateOfBirth;
      setShowDatePicker(false);
      setDateOfBirth(currentDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const formatDateForDB = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
            password: password, // Sending pTassword, though backend doesn't store it for auth
            age: 0, 
            dateofbirth: formatDateForDB(DateOfBirth) // Format date as YYYY-MM-DD
          }),
        });
  
        const data = await response.json();
  
        if (response.ok && data.success) {
          const patientCredentials = {
            name: name,    
            patientId: data.patientId, // Get patientId from the response
          };
          // Sign up successful
          console.log('Sign up successful:', data.message);
          // You might want to pass some data to DataConsentScreen or store it
          router.replace({
            pathname: '/DataConsentScreen',
            params: patientCredentials
          });
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
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('DateOfBirth')}</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid #f2f2f2',
                  borderRadius: '6px',
                  padding: '0 10px',
                  backgroundColor: '#fafafa',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
                value={DateOfBirth && !isNaN(DateOfBirth.getTime())
                ? DateOfBirth.toISOString().split('T')[0]
                : ''}
                onChange={onDateChange}
                max={new Date().toISOString().split('T')[0]}
              />
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.datePickerText}>{formatDate(DateOfBirth
                  )}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={DateOfBirth}
                    mode="date"
                    display="calendar"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </>
            )}
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
  datePickerButton: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
  },
  datePickerText: {
    fontSize: 15,
    color: '#222',
  },
}); 