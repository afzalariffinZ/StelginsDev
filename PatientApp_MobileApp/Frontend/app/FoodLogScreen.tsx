import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  BackHandler,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from './i18n/LanguageContext'; // Assuming this path is correct

const BOTTOM_NAV_HEIGHT = 64;
const AI_MASCOT_SIZE = 50;

// --- Configuration: Replace with your actual values ---
// IMPORTANT: For Android emulators/physical devices, 127.0.0.1 will NOT work.
// Use your computer's network IP address (e.g., http://192.168.1.100:8000).
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE;
// --- End Configuration ---

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Helper function to format date as YYYY-MM-DD
const getFormattedDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Dynamically calculate date strings for filters
const todayDateStr = getFormattedDate(new Date());

const getWeekStartDateStr = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff));
  return getFormattedDate(weekStart);
};
const weekStartDateStr = getWeekStartDateStr();

const getMonthStartDateStr = (): string => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return getFormattedDate(monthStart);
};
const monthStartDateStr = getMonthStartDateStr();

// Interface for backend log item structure (matches your new JSON)
interface BackendFoodLog {
  PatientID: number;
  calorie_intake: number;
  datetime: string; // e.g., "2025-05-08 16:13:07"
  fat_intake: number;
  imagelink: string;
  notes: string;
  sodium_intake: number; // Assuming this is in grams, e.g., 0.8
  sugar_intake: number;
  // Add any other fields returned by your backend if necessary
}

// Interface for frontend log item structure
interface FoodLogItem {
  id: string; // Will be generated client-side
  name: string;
  date: string;
  image: string;
  nutrients: {
    calories: string;
    sodium: string;
    fat: string;
    sugar: string;
  };
}


const TIME_FRAMES_DYNAMIC = [
  {
    key: 'today',
    filter: (log: FoodLogItem) => log.date.startsWith(todayDateStr),
  },
  {
    key: 'thisWeek',
    filter: (log: FoodLogItem) => log.date.substring(0, 10) >= weekStartDateStr,
  },
  {
    key: 'thisMonth',
    filter: (log: FoodLogItem) => log.date.substring(0, 10) >= monthStartDateStr,
  },
  { key: 'all', filter: () => true },
];


export default function FoodLogScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState('all');
  const [loading, setLoading] = useState(true);
  const [foodLogs, setFoodLogs] = useState<FoodLogItem[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const lastBackPress = useRef(0);

  const { name, patientId: patientIdParam } = useLocalSearchParams() as { name?: string, patientId?: string };
  const patientId = patientIdParam;


  const patientCredentials = {
    name: name,    
    patientId: patientId, 
    
  };

  // const patientCredentials = { // This variable is defined but not used elsewhere in the provided snippet
  //   name: name,
  //   patientId: patientId,
  // };


  useEffect(() => {
    const fetchFoodLogs = async () => {
      if (!patientId) {
        console.warn("Patient ID is missing, cannot fetch food logs.");
        setLoading(false);
        setFoodLogs([]);
        return;
      }
      setLoading(true);
      console.log(`Fetching food logs for PatientID: ${patientId} from ${API_BASE_URL}/get_diet_logs?patientid=${patientId}`);
      try {
        const response = await fetch(
          `${API_BASE_URL}/get_diet_logs?patientid=${patientId}`
        );
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('HTTP error response text:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data: BackendFoodLog[] = await response.json();
        console.log('Raw data from backend:', JSON.stringify(data, null, 2));

        // Transform backend data to frontend format
        const transformedLogs: FoodLogItem[] = data.map((item, index) => ({
          // Generate a client-side ID as backend doesn't provide one
          id: item.datetime + '-' + index, // Or just String(index) if datetime might not be unique enough
          name: item.notes,
          date: item.datetime,
          image: item.imagelink,
          nutrients: {
            calories: String(item.calorie_intake) + ' kcal',
            // Assuming sodium_intake is in grams (e.g., 0.8g), convert to mg for consistency with typical UI
            sodium: String(item.sodium_intake * 1000) + ' mg', // Adjust if unit is different
            fat: String(item.fat_intake) + ' g',
            sugar: String(item.sugar_intake) + ' g',
          },
        }));
        console.log('Transformed logs:', JSON.stringify(transformedLogs, null, 2));
        setFoodLogs(transformedLogs);
      } catch (error) {
        console.error('Failed to fetch or transform food logs:', error);
        setFoodLogs([]);
      } finally {
        setLoading(false);
        console.log('Finished fetching, loading set to false.');
      }
    };

    fetchFoodLogs();
  }, [patientId]); // Re-fetch if patient ID changes

  // Filter logs based on selected time frame
  const selectedFrame =
    TIME_FRAMES_DYNAMIC.find((frame) => frame.key === timeFrame) ||
    TIME_FRAMES_DYNAMIC[3];
  const filteredLogs = foodLogs.filter(selectedFrame.filter);

  // Handle hardware back button with debounce
  useEffect(() => {
      const onBackPress = () => {
        const now = Date.now();
        // Debounce back press to prevent multiple navigations if user spams back button
        if (now - lastBackPress.current < 500) { // 500ms debounce
          console.log("Back press debounced");
          return true; // Indicate event was handled
        }
        lastBackPress.current = now;

        // Check if router can go back before calling router.back()
        if (router.canGoBack()) {
          router.back();
        } else {
          // Optional: If router cannot go back, you might want to exit the app or do nothing
          // console.log("Router cannot go back further.");
          // To exit app (use with caution, usually not standard UX on all screens):
          // BackHandler.exitApp();
          // Or, if you want the default Android behavior (exit app on root screen)
          // return false; // Allow default behavior
        }
        return true; // Important: return true to prevent default back behavior (e.g., exiting app)
      };

      // Add the event listener and store the subscription
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      // Cleanup function: remove the listener using the subscription object
      return () => {
        subscription.remove();
      };
    }, [router]); // Dependency array: re-run effect if router instance changes (usually stable)

  // Loading indicator when switching time frame (original logic)
  useEffect(() => {
    if (foodLogs.length === 0 && !loading) return;

    // Only show simulated loading if not already in a loading state from fetching
    // And if there are logs to filter, or if initial load has some logs
    if (timeFrame !== 'all' || (timeFrame === 'all' && foodLogs.length > 0)){
        setLoading(true); // Show loading briefly for filter change
        const timer = setTimeout(() => setLoading(false), 400);
        return () => clearTimeout(timer);
    }
  }, [timeFrame]); // Removed foodLogs.length from dependency array to avoid re-triggering this specific loading too often

  // Scroll to top when changing time frame
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ y: 0, animated: true });
  }, [timeFrame]);

  // Animate card expand/collapse
  const handleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel={t('back')}
          style={styles.backButton}
          onPress={() => router.replace({pathname:'/HomeScreen',params:patientCredentials})}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('foodLog') || 'Food Log'}</Text>
      </View>
      {/* Time Frame Selector */}
      <View style={styles.timeFrameRow}>
        {TIME_FRAMES_DYNAMIC.map((frame) => (
          <TouchableOpacity
            key={frame.key}
            accessibilityLabel={t(frame.key)}
            style={[
              styles.timeFrameBtn,
              timeFrame === frame.key && styles.timeFrameBtnActive,
            ]}
            onPress={() => setTimeFrame(frame.key)}
          >
            <Text
              style={[
                styles.timeFrameText,
                timeFrame === frame.key && styles.timeFrameTextActive,
              ]}
            >
              {t(frame.key)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <ActivityIndicator size="large" color="#E53935" />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {filteredLogs.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: '#888', fontSize: 16 }}>
                {t('noLogsFound') || 'No food logs found.'}
              </Text>
            </View>
          ) : (
            filteredLogs.map((log) => {
              const expanded = expandedId === log.id;
              return (
                <TouchableOpacity
                  key={log.id}
                  accessibilityLabel={log.name}
                  style={styles.logCard}
                  activeOpacity={0.9}
                  onPress={() => handleExpand(log.id)}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: log.image }}
                      style={styles.foodImage}
                      accessibilityLabel={log.name + ' image'}
                      onError={(e) => console.log("Failed to load image:", log.image, e.nativeEvent.error)}
                    />
                  </View>
                  <View style={styles.infoSection}>
                    <Text style={styles.foodDate}>{log.date}</Text>
                    <Text style={styles.foodName}>{log.name}</Text>
                  </View>
                  {expanded && (
                    <View style={styles.nutrientsSection}>
                      <View style={styles.nutrientRow}>
                        <Text style={styles.nutrientLabel}>{t('calories')}</Text>
                        <Text style={styles.nutrientValue}>
                          {log.nutrients.calories}
                        </Text>
                      </View>
                      <View style={styles.nutrientRow}>
                        <Text style={styles.nutrientLabel}>{t('sodium')}</Text>
                        <Text style={styles.nutrientValue}>
                          {log.nutrients.sodium}
                        </Text>
                      </View>
                      <View style={styles.nutrientRow}>
                        <Text style={styles.nutrientLabel}>{t('fat')}</Text>
                        <Text style={styles.nutrientValue}>
                          {log.nutrients.fat}
                        </Text>
                      </View>
                      <View style={styles.nutrientRow}>
                        <Text style={styles.nutrientLabel}>{t('sugar')}</Text>
                        <Text style={styles.nutrientValue}>
                          {log.nutrients.sugar}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
      {/* Bottom NavBar (same as HomeScreen) */}
      <View style={styles.bottomNav}>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/HomeScreen',params: patientCredentials})}><Text style={[styles.navIcon, styles.navIconActive]}>🏠</Text><Text style={[styles.navLabel, styles.navLabelActive]}>{t('home')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/AIChatScreen',params: patientCredentials})}><Text style={styles.navIcon}>💬</Text><Text style={styles.navLabel}>{t('stelgginAI')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/ProgressScreen',params: patientCredentials})}><Text style={styles.navIcon}>📊</Text><Text style={styles.navLabel}>{t('progress')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/SettingsScreen',params: patientCredentials})}><Text style={styles.navIcon}>⚙️</Text><Text style={styles.navLabel}>{t('settings')}</Text></TouchableOpacity>
            </View>
    </View>
  );
}

// Styles (kept as provided by you)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  timeFrameRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeFrameBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 2,
  },
  timeFrameBtnActive: {
    backgroundColor: '#E53935',
  },
  timeFrameText: {
    color: '#888',
    fontSize: 13,
    fontWeight: 'bold',
  },
  timeFrameTextActive: {
    color: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Ensure content doesn't hide behind nav bar
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
    backgroundColor: '#eee', // Placeholder while image loads
  },
  foodImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoSection: {
    padding: 16,
    paddingBottom: 8,
  },
  foodDate: {
    fontSize: 14,
    color: '#222',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  nutrientsSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutrientRow: {
    width: '48%', // Two items per row
    marginBottom: 8,
  },
  nutrientLabel: {
    fontSize: 14,
    color: '#888',
  },
  nutrientValue: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
  },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E2E8F0', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 8, paddingBottom:  (Dimensions.get('window').height * 0.01) < 5 ? 5 : (Dimensions.get('window').height * 0.01), zIndex: 5, },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 24, marginBottom: 3, color: '#A0AEC0' },
  navIconActive: { color: '#E53935' },
  navLabel: { fontSize: 11, color: '#718096' },
  navLabelActive: { color: '#E53935', fontWeight: '600' },
  aiNavItem: {
  },
  aiIconContainer: {
    width: AI_MASCOT_SIZE,
    height: AI_MASCOT_SIZE,
    position: 'absolute',
    alignSelf: 'center',
    bottom: BOTTOM_NAV_HEIGHT / 2 - AI_MASCOT_SIZE / 2 + 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiMascotNavIcon: {
    width: AI_MASCOT_SIZE,
    height: AI_MASCOT_SIZE,
    resizeMode: 'contain',
  },
  aiNavLabel: {
  },
  navLabelActiveAi: {
    color: '#E53935',
    fontWeight: 'bold',
  },
});