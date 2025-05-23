import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Platform } from 'react-native'; // Added ActivityIndicator
// import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // These were imported but not used
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from './i18n/LanguageContext';

// --- Configuration: Replace with your actual values ---
// IMPORTANT: For Android emulators/physical devices, 127.0.0.1 will NOT work.
// Use your computer's network IP address (e.g., http://192.168.1.100:8000).
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE;
// --- End Configuration ---

// Interface for the patient data expected from the backend
interface PatientData {
  Age: number; // Age as provided by backend (can be used as fallback)
  DateOfBirth: string; // Date of birth string (e.g., "YYYY-MM-DD")
  Email: string;
  HealthCondition: string;
  PatientID: number;
  PatientName: string;
  patient_status: string; // "warning", "normal", etc.
  "Last Activity": string; // ISO date-time string e.g., "2025-05-09T02:18:55"
  // Add other fields if your backend might return them (e.g., Gender, Weight, Height)
  Gender?: string;
  Weight?: number;
  Height?: number;
}

// Helper function to calculate age from date of birth string
const calculateAge = (dateOfBirthString: string): number | null => {
  if (!dateOfBirthString) {
    console.warn("DateOfBirth string is missing for age calculation.");
    return null;
  }
  try {
    const birthDate = new Date(dateOfBirthString);
    // Check if birthDate is a valid date
    if (isNaN(birthDate.getTime())) {
      console.warn("Invalid DateOfBirth string for age calculation:", dateOfBirthString);
      return null;
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null; // Return null if age is negative (e.g. future birth date)
  } catch (error) {
    console.error("Error calculating age:", error);
    return null;
  }
};

export default function ProfileScreen() {
  const { name: nameParam, patientId: patientIdParam } = useLocalSearchParams() as { name?: string, patientId?: string };
  const patientId = patientIdParam;

  const patientCredentials = { name: nameParam, patientId: patientId }; // Defined but not used further in this component for navigation

  const router = useRouter();
  const { t } = useLanguage();

  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) {
        console.warn("Patient ID is missing. Cannot fetch profile.");
        setIsLoading(false);
        setPatientData(null);
        return;
      }
      setIsLoading(true);
      try {
        console.log(`Fetching patient data for ID: ${patientId} from ${API_BASE_URL}/get_patient_by_id?id=${patientId}`);
        const response = await fetch(`${API_BASE_URL}/get_patient_by_id?id=${patientId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: "Failed to parse error response" }));
          console.error("Error fetching patient data:", response.status, errorData);
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        const data: PatientData = await response.json();
        if (data && (data as any).error) { // Handle FastAPI's {"error": "Patient not found"}
            console.warn("Patient not found from API:", (data as any).error);
            setPatientData(null);
        } else {
            console.log("Fetched patient data:", data);
            setPatientData(data);
        }
      } catch (error) {
        console.error('Failed to fetch patient profile:', error);
        setPatientData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  const formatLastActivity = (dateTimeString?: string) => {
    if (!dateTimeString) return t('notAvailable');
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString(undefined, { // Or use your preferred locale from i18n
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return dateTimeString; // Return original if formatting fails
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#E53935" />
        <Text style={styles.loadingText}>{t('loadingProfile') || 'Loading Profile...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace({ pathname: '/SettingsScreen', params: { patientId, name: nameParam }})} // Pass params back if needed
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile')}</Text>
      </View>

      {!patientData ? (
         <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>{t('profileNotFound') || 'Profile data not found.'}</Text>
         </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.content}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>👤</Text>
              </View>
              <Text style={styles.name}>{patientData?.PatientName || t('notAvailable')}</Text>
              <Text style={styles.email}>{patientData?.Email || t('notAvailable')}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('personalInfo')}</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('age')}</Text>
                  <Text style={styles.infoValue}>
                    {(() => {
                      // Priority 1: Calculate from DateOfBirth
                      if (patientData?.DateOfBirth) {
                        const calculatedAge = calculateAge(patientData.DateOfBirth);
                        if (calculatedAge !== null) {
                          return `${calculatedAge} ${t('years') || 'tahun'}`;
                        }
                      }
                      // Priority 2: Use pre-existing Age from API if DateOfBirth calculation failed or DOB not present
                      // Check if Age is a number (including 0)
                      if (patientData?.Age !== undefined && patientData.Age !== null && typeof patientData.Age === 'number') {
                        return `${patientData.Age} ${t('years') || 'tahun'}`;
                      }
                      // Fallback: Not available
                      return t('notAvailable');
                    })()}
                  </Text>
                </View>
                {/* Gender, Weight, Height are not in the API response, keeping dummy/placeholder for now */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('gender')}</Text>
                  <Text style={styles.infoValue}>{patientData?.Gender || t('male')}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('weight')}</Text>
                  <Text style={styles.infoValue}>{patientData?.Weight ? `${patientData.Weight} kg` : '70 kg'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('height')}</Text>
                  <Text style={styles.infoValue}>{patientData?.Height ? `${patientData.Height} cm` : '175 cm'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('lastActivity')}</Text>
                  <Text style={styles.infoValue}>{formatLastActivity(patientData["Last Activity"])}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('health')}</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('healthCondition')}</Text>
                  <Text style={styles.infoValue}>{patientData?.HealthCondition || t('notAvailable')}</Text>
                </View>
                {/* Health targets are not in API, keeping dummy values */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('targetDailyCalories')}</Text>
                  <Text style={styles.infoValue}>1800 kcal</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('maxDailySugar')}</Text>
                  <Text style={styles.infoValue}>50g</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('maxDailyFat')}</Text>
                  <Text style={styles.infoValue}>70g</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('maxDailySodium')}</Text>
                  <Text style={styles.infoValue}>2000mg</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/HomeScreen',params: patientCredentials})}><Text style={[styles.navIcon]}>🏠</Text><Text style={[styles.navLabel]}>{t('home')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/AIChatScreen',params: patientCredentials})}><Text style={styles.navIcon}>💬</Text><Text style={styles.navLabel}>{t('stelgginAI')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/ProgressScreen',params: patientCredentials})}><Text style={styles.navIcon}>📊</Text><Text style={styles.navLabel}>{t('progress')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/SettingsScreen',params: patientCredentials})}><Text style={[styles.navIcon, styles.navIconActive]}>⚙️</Text><Text style={[styles.navLabel, styles.navLabelActive]}>{t('settings')}</Text></TouchableOpacity>
            </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8, // To make tap area closer to edge
  },
  backIcon: {
    fontSize: 24,
    color: '#222',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80, // Ensure space for bottom nav
  },
  content: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FDEAEA', // A light, pleasant color
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarText: {
    fontSize: 48,
    color: '#E53935' // Theme color for the icon
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E53935', // Theme color for section titles
    marginBottom: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16, // Only horizontal padding, vertical handled by infoRow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // Softer shadow
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14, // Increased padding for better spacing
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5', // Lighter border
  },
  infoRowLast: { // Add this style to the last infoRow in a card to remove border
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 16,
    color: '#555', // Slightly darker grey for better readability
  },
  infoValue: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
    textAlign: 'right', // Ensure long values don't push labels
    flexShrink: 1, // Allow value text to shrink if needed
  },
bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E2E8F0', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 8, paddingBottom:  (Dimensions.get('window').height * 0.01) < 5 ? 5 : (Dimensions.get('window').height * 0.01), zIndex: 5, },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 24, marginBottom: 3, color: '#A0AEC0' },
  navIconActive: { color: '#E53935' },
  navLabel: { fontSize: 11, color: '#718096' },
  navLabelActive: { color: '#E53935', fontWeight: '600' },
});