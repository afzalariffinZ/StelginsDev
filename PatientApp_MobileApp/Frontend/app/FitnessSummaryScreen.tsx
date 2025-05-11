import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform,
  Animated, BackHandler
} from 'react-native';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Circle } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from './i18n/LanguageContext';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');
const RING_SIZE = 280;
const RING_STROKE = 40;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUM = 2 * Math.PI * RING_RADIUS;
const MAX_CALORIE_GOAL = 300;
const BOTTOM_NAV_HEIGHT = 64;
const AI_MASCOT_SIZE = 50;

// --- FAKE DATA (remains the same) ---
const dailyFitnessData = [
  { moveValue: 250, distance: 2.1, steps: 2800, time: 40, activities: [ { id: 'mon-act1', icon: '🚶', nameKey: 'walking', startTime: '07:30', endTime: '08:10', calories: 150 }, { id: 'mon-act2', icon: '🧘', nameKey: 'yoga', startTime: '18:00', endTime: '18:30', calories: 100 }]},
  { moveValue: 350, distance: 3.5, steps: 4500, time: 55, activities: [ { id: 'tue-act1', icon: '🏃', nameKey: 'running', startTime: '06:45', endTime: '07:20', calories: 220 }, { id: 'tue-act2', icon: '💪', nameKey: 'strengthTraining', startTime: '19:00', endTime: '19:35', calories: 130 }]},
  { moveValue: 21,  distance: 0.47,steps: 686,  time: 30, activities: [ { id: 'wed-act1', icon: '🚶', nameKey: 'walking', startTime: '08:30', endTime: '09:00', calories: 150 }]},
  { moveValue: 290, distance: 5.2, steps: 7200, time: 75, activities: [ { id: 'thu-act1', icon: '🚴', nameKey: 'cycling', startTime: '17:30', endTime: '18:30', calories: 200 }, { id: 'thu-act2', icon: '🚶', nameKey: 'walking', startTime: '20:00', endTime: '20:30', calories: 90 }]},
  { moveValue: 180, distance: 1.8, steps: 2200, time: 35, activities: [ { id: 'fri-act1', icon: '🤸', nameKey: 'stretching', startTime: '09:00', endTime: '09:20', calories: 80 }, { id: 'fri-act2', icon: '🚶', nameKey: 'leisureWalk', startTime: '13:00', endTime: '13:30', calories: 100 }]},
  { moveValue: 550, distance: 8.1, steps: 10500,time: 90, activities: [ { id: 'sat-act1', icon: '🏞️', nameKey: 'hiking', startTime: '10:00', endTime: '12:00', calories: 400 }, { id: 'sat-act2', icon: '🏊', nameKey: 'swimming', startTime: '16:00', endTime: '16:45', calories: 150 }]},
  { moveValue: 90,  distance: 1.0, steps: 1200, time: 20, activities: [ { id: 'sun-act1', icon: '🚶', nameKey: 'lightWalk', startTime: '11:00', endTime: '11:20', calories: 90 }]},
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const cleanPlaceholder = (textWithPlaceholder: string, placeholder: string = '{{count}}'): string => {
  if (typeof textWithPlaceholder === 'string') {
    const regex = new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
    return textWithPlaceholder.replace(regex, '').trim();
  }
  return textWithPlaceholder;
};

export default function FitnessSummaryScreen() {
  const { name, patientId: patientIdParam } = useLocalSearchParams() as { name?: string, patientId?: string };
  const patientId = patientIdParam;
  const lastBackPress = useRef(0);

  const patientCredentials = {
    name: name,    
    patientId: patientId, 
    
  };
  
  const [selectedDay, setSelectedDay] = useState(3);
  const router = useRouter();
  const { t, formatNumber } = useLanguage();

  const animatedProgress = useRef(new Animated.Value(0)).current;
  const isInitialMount = useRef(true); // To skip reset animation on first load

  useEffect(() => {
    const currentDayData = dailyFitnessData[selectedDay];
    const targetProgressRatio = MAX_CALORIE_GOAL > 0 ? currentDayData.moveValue / MAX_CALORIE_GOAL : 0;
    const visualTargetProgress = Math.min(1, targetProgressRatio);

    if (isInitialMount.current) {
      // On initial mount, set value directly without animation
      animatedProgress.setValue(visualTargetProgress);
      isInitialMount.current = false;
    } else {
      // On subsequent day changes:
      // 1. Reset progress to 0 instantly
      animatedProgress.setValue(0); 
      // 2. Animate from 0 to the new target
      Animated.timing(animatedProgress, {
        toValue: visualTargetProgress,
        duration: 750,
        useNativeDriver: false, // SVG properties typically require false
      }).start();
    }
  }, [selectedDay, animatedProgress]); // Rerun when selectedDay changes

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


  const currentDayData = dailyFitnessData[selectedDay];

  const weekdays = [
    t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun'),
  ];

  const getLabel = (key: string): string => {
    const rawText = t(key);
    const cleaned = cleanPlaceholder(rawText);
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };
  
  const getUnit = (key: string): string => {
      const rawText = t(key);
      return cleanPlaceholder(rawText).toLowerCase();
  };

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUM, 0],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace({pathname:'/HomeScreen',params:patientCredentials})}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('exerciseSummary')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Weekday Selector */}
        <View style={styles.weekdays}>
          {weekdays.map((d, i) => (
            <TouchableOpacity key={i} onPress={() => setSelectedDay(i)}>
              <View style={[styles.dayCircle, i === selectedDay && styles.activeDay]}>
                <Text style={[styles.dayText, i === selectedDay && styles.activeDayText]}>{d}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress Ring */}
        <View style={styles.progressRing}>
          <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
            <Circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
              stroke="#f0f0f0" strokeWidth={RING_STROKE} fill="none"
            />
            <AnimatedCircle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
              stroke="#E53935" strokeWidth={RING_STROKE} fill="none"
              strokeDasharray={`${RING_CIRCUM},${RING_CIRCUM}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2},${RING_SIZE / 2}`}
            />
          </Svg>
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressValue}>{formatNumber(currentDayData.moveValue)}</Text>
            <Text style={styles.progressLabel}>{getLabel('calories')}</Text>
            <Text style={styles.progressGoal}>{t('from')} {formatNumber(MAX_CALORIE_GOAL)}</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}><MaterialCommunityIcons name="map-marker-distance" size={24} color="#E53935" /></View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statLabel}>{getLabel('distance')}</Text>
              <Text style={styles.statValue}>
                {formatNumber(currentDayData.distance, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
              </Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}><MaterialCommunityIcons name="shoe-print" size={24} color="#E53935" /></View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statLabel}>{getLabel('steps')}</Text>
              <Text style={styles.statValue}>{formatNumber(currentDayData.steps)}</Text>
            </View>
          </View>
        </View>        
      </ScrollView>

      <View style={styles.bottomNav}>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/HomeScreen',params: patientCredentials})}><Text style={[styles.navIcon, styles.navIconActive]}>🏠</Text><Text style={[styles.navLabel, styles.navLabelActive]}>{t('home')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/AIChatScreen',params: patientCredentials})}><Text style={styles.navIcon}>💬</Text><Text style={styles.navLabel}>{t('stelgginAI')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/ProgressScreen',params: patientCredentials})}><Text style={styles.navIcon}>📊</Text><Text style={styles.navLabel}>{t('progress')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/SettingsScreen',params: patientCredentials})}><Text style={styles.navIcon}>⚙️</Text><Text style={styles.navLabel}>{t('settings')}</Text></TouchableOpacity>
            </View>
    </View>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { padding: 8, marginRight: 8 },
  backIcon: { fontSize: 24, color: '#222' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  scrollView: { flex: 1 },
  scrollViewContent: { paddingBottom: 50 },
  weekdays: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 8, marginTop: 16, marginBottom: 8 },
  dayCircle: { width: (width - 16 - (6 * 6)) / 7, maxWidth: 40, aspectRatio: 1, borderRadius: 20, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', marginHorizontal: 3 },
  activeDay: { backgroundColor: '#E53935' },
  dayText: { color: '#666', fontWeight: '600', fontSize: 12 },
  activeDayText: { color: '#fff' },
  progressRing: { alignItems: 'center', marginVertical: 24, justifyContent: 'center' },
  progressTextContainer: { position: 'absolute', alignItems: 'center' },
  progressValue: { fontSize: 36, fontWeight: 'bold', color: '#222' },
  progressLabel: { fontSize: 16, color: '#666', marginTop: -4 },
  progressGoal: { fontSize: 14, color: '#888', marginTop: 4 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 8, marginHorizontal: 4, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  statIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FDEAEA', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statTextContainer: { alignItems: 'center' },
  statLabel: { fontSize: 13, color: '#666', marginBottom: 2, textAlign: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#222', textAlign: 'center' },
  metricCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  metricIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  metricIcon: { fontSize: 24, color: '#222' },
  metricTextContainer: { flex: 1 },
  metricLabel: { fontSize: 13, color: '#666', marginBottom: 2 },
  metricValue: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E2E8F0', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 8, paddingBottom:  (Dimensions.get('window').height * 0.01) < 5 ? 5 : (Dimensions.get('window').height * 0.01), zIndex: 5, },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 24, marginBottom: 3, color: '#A0AEC0' },
  navIconActive: { color: '#E53935' },
  navLabel: { fontSize: 11, color: '#718096' },
  navLabelActive: { color: '#E53935', fontWeight: '600' },
  aiNavItem: {
    // Likely empty unless specific flex/size adjustments needed
  },
  aiIconContainer: {
    width: AI_MASCOT_SIZE,
    height: AI_MASCOT_SIZE,
    position: 'absolute',
    alignSelf: 'center',
    // *** Use the exact 'bottom' value from HomeScreen ***
    bottom: BOTTOM_NAV_HEIGHT / 2 - (AI_MASCOT_SIZE / 2), // <<< REPLACE with your working value from HomeScreen
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiMascotNavIcon: {
    width: AI_MASCOT_SIZE,
    height: AI_MASCOT_SIZE,
    resizeMode: 'contain',
  },
  aiNavLabel: {
    position: 'absolute',
    bottom: 0, // Same as other navLabels for consistency from bottom of nav bar
    alignSelf: 'center',
  },
  navLabelActiveAi: {
    // Inherits from navLabelActive (absolute, bottom: 6)
    // If you need different active styles specifically for AI label
    color: '#E53935',    // Example
    fontWeight: 'bold', // Example
    fontSize: 12,
  },
});