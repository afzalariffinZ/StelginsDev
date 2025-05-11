// ProgressScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, useWindowDimensions, Animated, ActivityIndicator, Platform } from 'react-native'; // Added Platform
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Rect, Line, Text as SvgText, Path } from 'react-native-svg';
import { useLanguage } from './i18n/LanguageContext';

const CHART_HEIGHT = 90;
const CHART_DRAW_TOP_PADDING = 10;
const CHART_DRAW_BOTTOM_PADDING = 20;
const BAR_CHART_DRAW_HEIGHT = CHART_HEIGHT - CHART_DRAW_TOP_PADDING - CHART_DRAW_BOTTOM_PADDING;
const LINE_CHART_DRAW_HEIGHT = CHART_HEIGHT - CHART_DRAW_TOP_PADDING - CHART_DRAW_BOTTOM_PADDING; // Kept for potential future use or other charts


const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_SHORT = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'];

const DAYS_MONTH_ALL = Array.from({ length: 30 }, (_, i) => (i + 1).toString());
const MONTH_BAR_CHART_LABELS = ['1', '5', '10', '15', '20', '25', '30'];
const MONTH_LINE_CHART_LABELS = ['1', '5', '10', '15', '20', '25', '30'];

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE;


// --- Dummy data for 'Month' ---
const sugarDataMonth = [20, 22, 25, 18, 30, 28, 24, 26, 19, 21, 23, 27, 29, 22, 20, 18, 25, 28, 30, 24, 26, 19, 21, 23, 27, 29, 22, 20, 18, 25];
const sodiumDataMonth = [1300, 1400, 1200, 1500, 1100, 1432, 1300, 1400, 1250, 1350, 1450, 1200, 1500, 1100, 1432, 1300, 1400, 1250, 1350, 1450, 1200, 1500, 1100, 1432, 1300, 1400, 1250, 1350, 1450, 1200];
const calorieDataMonth = [1700, 1600, 1800, 1500, 1700, 1750, 1650, 1550, 1600, 1800, 1500, 1700, 1750, 1650, 1550, 1700, 1600, 1800, 1500, 1700, 1750, 1650, 1550, 1600, 1800, 1500, 1700, 1750, 1650, 1550];
const fatDataMonth = [62, 65, 60, 70, 55, 65, 68, 62, 58, 60, 70, 55, 65, 68, 62, 58, 62, 65, 60, 70, 55, 65, 68, 62, 58, 60, 70, 55, 65, 68];
const stepsDataMonth = [8000, 9500, 7200, 8800, 10200, 7800, 8500, 9200, 7500, 8900, 9800, 8200, 9000, 7600, 8400, 9600, 7800, 8800, 9400, 8000, 9200, 7600, 8500, 9800, 8200, 9000, 7500, 8900, 9400, 8000];
const distanceDataMonth = [5.2, 6.1, 4.7, 5.8, 6.5, 5.0, 5.5, 6.0, 4.9, 5.7, 6.3, 5.3, 5.9, 4.8, 5.6, 6.2, 5.1, 5.8, 6.1, 5.2, 6.0, 4.9, 5.7, 6.4, 5.3, 5.9, 4.8, 5.6, 6.1, 5.2];
const caloriesBurnedDataMonth = [320, 380, 290, 350, 410, 310, 340, 370, 300, 360, 390, 330, 360, 290, 350, 400, 310, 340, 380, 320, 370, 300, 350, 410, 330, 360, 290, 360, 380, 320];


const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path); // Kept for potential future use

const AnimatedBar = ({ index, value, maxValue, minValue, chartWidth, labelsLength, delay, barChartDrawHeight }) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    animatedHeight.setValue(0);
    Animated.timing(animatedHeight, {
      toValue: value >= minValue ? ((value - minValue) / (Math.max(1, maxValue - minValue))) * barChartDrawHeight : 0,
      duration: 300, delay: delay, useNativeDriver: false,
    }).start();
  }, [value, maxValue, minValue, delay, barChartDrawHeight, animatedHeight]);
  const barWidth = labelsLength > 7 ? Math.max(4, chartWidth / labelsLength / 2.5) : 22;
  const barSpace = (chartWidth - 16) / labelsLength;
  const xPosition = 8 + index * barSpace;
  const yPosition = Animated.subtract(CHART_DRAW_TOP_PADDING + barChartDrawHeight, animatedHeight);
  return <AnimatedRect x={xPosition} y={yPosition} width={barWidth} height={animatedHeight} rx={4} fill="#E53935" opacity={0.85} />;
};

// Kept AnimatedLinePath for potential future use, though not used by activity charts anymore
const AnimatedLinePath = ({ data, minValue, maxValue, chartWidth, lineChartDrawHeight, chartDrawTopPadding }) => {
    const animatedDraw = useRef(new Animated.Value(0)).current;
    const getXY = (val, i, dataLength) => {
        const x = 8 + i * ((chartWidth - 16) / (dataLength > 1 ? dataLength - 1 : 1) );
        const yValue = val >= minValue ? val : minValue;
        const y = chartDrawTopPadding + lineChartDrawHeight - (((yValue - minValue) / (Math.max(1, maxValue - minValue))) * lineChartDrawHeight);
        return [x, y];
    };
    let d = "";
    if (data.length > 0) { data.forEach((val, i) => { const [x, y] = getXY(val, i, data.length); if (i === 0) d = `M${x},${y}`; else d += ` L${x},${y}`; }); }
    useEffect(() => { animatedDraw.setValue(0); Animated.timing(animatedDraw, { toValue: 1, duration: 1000, delay: 200, useNativeDriver: false, }).start(); }, [data, animatedDraw]);
    const estimatedPathLength = chartWidth * 1.5;
    const strokeDashoffset = animatedDraw.interpolate({ inputRange: [0, 1], outputRange: [estimatedPathLength, 0], });
    return <AnimatedPath d={d} fill="none" stroke="#E53935" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${estimatedPathLength}, ${estimatedPathLength}`} strokeDashoffset={strokeDashoffset} />;
};

const getRefLineY = (value, minVal, maxVal, drawHeight, topPadding) => {
    if (maxVal === minVal) return topPadding + drawHeight / 2;
    return topPadding + drawHeight - (((value - minVal) / (maxVal - minVal)) * drawHeight);
};

// --- Backend Data Interfaces ---
interface DietTrendItem {
  date: string;
  sodium_intake: number;
  sugar_intake: number;
  fat_intake: number;
  calorie_intake: number;
  day: string;
}
interface NutrientTrendResponse {
  patientid: number;
  from: string;
  to: string;
  trend: DietTrendItem[];
}
interface StepDataItem {
    Date: string;
    NumberOfSteps: number;
    PatientID: number;
    day: string;
    Calories_Burned: number;
    Total_Distance_km: number;
}
type StepsApiResponse = StepDataItem[];


export default function ProgressScreen() {
  const [activeTab, setActiveTab] = useState('Diet');
  const [sugarRange, setSugarRange] = useState('Week');
  const [sodiumRange, setSodiumRange] = useState('Week');
  const [calorieRange, setCalorieRange] = useState('Week');
  const [fatRange, setFatRange] = useState('Week');
  const [stepsRange, setStepsRange] = useState('Week');
  const [distanceRange, setDistanceRange] = useState('Week');
  const [caloriesBurnedRange, setCaloriesBurnedRange] = useState('Week');

  const { name, patientId: patientIdParam } = useLocalSearchParams() as { name?: string, patientId?: string };
  const patientId = patientIdParam;

  const patientCredentials = { name: name, patientId: patientId };

  const router = useRouter();
  const { width } = useWindowDimensions();
  const { t } = useLanguage();
  const CARD_HORIZONTAL_PADDING = 32;
  const CHART_WIDTH = width - CARD_HORIZONTAL_PADDING - 16;

  const [nutrientTrendData, setNutrientTrendData] = useState<NutrientTrendResponse | null>(null);
  const [isLoadingDietTrend, setIsLoadingDietTrend] = useState(false);
  const [fetchedSugarDataWeek, setFetchedSugarDataWeek] = useState<number[]>(Array(7).fill(0));
  const [fetchedSodiumDataWeek, setFetchedSodiumDataWeek] = useState<number[]>(Array(7).fill(0));
  const [fetchedCalorieDataWeek, setFetchedCalorieDataWeek] = useState<number[]>(Array(7).fill(0));
  const [fetchedFatDataWeek, setFetchedFatDataWeek] = useState<number[]>(Array(7).fill(0));

  const [stepsTrendData, setStepsTrendData] = useState<StepsApiResponse | null>(null);
  const [isLoadingStepsTrend, setIsLoadingStepsTrend] = useState(false);
  const [fetchedStepsDataWeek, setFetchedStepsDataWeek] = useState<number[]>(Array(7).fill(0));
  const [fetchedDistanceDataWeek, setFetchedDistanceDataWeek] = useState<number[]>(Array(7).fill(0));
  const [fetchedCaloriesBurnedDataWeek, setFetchedCaloriesBurnedDataWeek] = useState<number[]>(Array(7).fill(0));

  useEffect(() => {
    const fetchNutrientTrend = async () => {
      if (!patientId) { console.warn("Patient ID is missing for diet trends."); return; }
      setIsLoadingDietTrend(true);
      try {
        const response = await fetch(`${API_BASE_URL}/get_nutrient_trend_phone_week?patientid=${patientId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: NutrientTrendResponse = await response.json();
        setNutrientTrendData(data);
      } catch (error) {
        console.error("Failed to fetch nutrient trend:", error);
        setNutrientTrendData(null);
      } finally {
        setIsLoadingDietTrend(false);
      }
    };
    fetchNutrientTrend();
  }, [patientId]);

  useEffect(() => {
    if (nutrientTrendData && nutrientTrendData.trend) {
      const newSugarData = Array(7).fill(0);
      const newSodiumData = Array(7).fill(0);
      const newCalorieData = Array(7).fill(0);
      const newFatData = Array(7).fill(0);
      nutrientTrendData.trend.forEach(item => {
        const dayIndex = DAYS_ORDER.indexOf(item.day);
        if (dayIndex !== -1) {
          newSugarData[dayIndex] = item.sugar_intake;
          newSodiumData[dayIndex] = item.sodium_intake * 1000;
          newCalorieData[dayIndex] = item.calorie_intake;
          newFatData[dayIndex] = item.fat_intake;
        }
      });
      setFetchedSugarDataWeek(newSugarData);
      setFetchedSodiumDataWeek(newSodiumData);
      setFetchedCalorieDataWeek(newCalorieData);
      setFetchedFatDataWeek(newFatData);
    } else {
      setFetchedSugarDataWeek(Array(7).fill(0));
      setFetchedSodiumDataWeek(Array(7).fill(0));
      setFetchedCalorieDataWeek(Array(7).fill(0));
      setFetchedFatDataWeek(Array(7).fill(0));
    }
  }, [nutrientTrendData]);

  useEffect(() => {
    const fetchStepsTrend = async () => {
        if (!patientId) { console.warn("Patient ID is missing for steps trends."); return; }
        setIsLoadingStepsTrend(true);
        try {
            const response = await fetch(`${API_BASE_URL}/get_steps_phone?patientid=${patientId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data: StepsApiResponse = await response.json();
            setStepsTrendData(data);
        } catch (error) {
            console.error("Failed to fetch steps trend:", error);
            setStepsTrendData(null);
        } finally {
            setIsLoadingStepsTrend(false);
        }
    };
    fetchStepsTrend();
  }, [patientId]);

  useEffect(() => {
    if (stepsTrendData) {
        const newStepsData = Array(7).fill(0);
        const newDistanceData = Array(7).fill(0);
        const newCaloriesBurnedData = Array(7).fill(0);
        const latestDataPerDay: { [key: string]: StepDataItem } = {};
        stepsTrendData.forEach(item => { latestDataPerDay[item.day] = item; });
        DAYS_ORDER.forEach((dayName, index) => {
            const item = latestDataPerDay[dayName];
            if (item) {
                newStepsData[index] = item.NumberOfSteps;
                newDistanceData[index] = item.Total_Distance_km;
                newCaloriesBurnedData[index] = item.Calories_Burned;
            }
        });
        setFetchedStepsDataWeek(newStepsData);
        setFetchedDistanceDataWeek(newDistanceData);
        setFetchedCaloriesBurnedDataWeek(newCaloriesBurnedData);
    } else {
        setFetchedStepsDataWeek(Array(7).fill(0));
        setFetchedDistanceDataWeek(Array(7).fill(0));
        setFetchedCaloriesBurnedDataWeek(Array(7).fill(0));
    }
  }, [stepsTrendData]);

  const sugarData = sugarRange === 'Week' ? fetchedSugarDataWeek : sugarDataMonth;
  const sodiumData = sodiumRange === 'Week' ? fetchedSodiumDataWeek : sodiumDataMonth;
  const calorieData = calorieRange === 'Week' ? fetchedCalorieDataWeek : calorieDataMonth;
  const fatData = fatRange === 'Week' ? fetchedFatDataWeek : fatDataMonth;

  const stepsData = stepsRange === 'Week' ? fetchedStepsDataWeek : stepsDataMonth;
  const distanceData = distanceRange === 'Week' ? fetchedDistanceDataWeek : distanceDataMonth;
  const caloriesBurnedData = caloriesBurnedRange === 'Week' ? fetchedCaloriesBurnedDataWeek : caloriesBurnedDataMonth;

  const getLabels = (range, chartType) => {
    if (range === 'Week') return DAYS_SHORT;
    if (range === 'Month') {
        return chartType === 'bar' ? MONTH_BAR_CHART_LABELS : MONTH_LINE_CHART_LABELS;
    }
    return DAYS_SHORT;
  }

  const sugarLabels = getLabels(sugarRange, 'bar');
  const sodiumLabels = getLabels(sodiumRange, 'bar');
  const calorieLabels = getLabels(calorieRange, 'bar');
  const fatLabels = getLabels(fatRange, 'bar');
  const stepsLabels = getLabels(stepsRange, 'bar'); // Changed to 'bar' for steps
  const distanceLabels = getLabels(distanceRange, 'bar'); // Changed to 'bar' for distance
  const caloriesBurnedLabels = getLabels(caloriesBurnedRange, 'bar'); // Changed to 'bar' for cals burned

  const calculateAverage = (dataArray: number[]) => {
    const filteredData = dataArray.filter(d => d > 0);
    return Math.round(filteredData.reduce((a, b) => a + b, 0) / (filteredData.length || 1));
  }
  const calculateAverageFloat = (dataArray: number[]) => {
    const filteredData = dataArray.filter(d => d > 0);
    return parseFloat((filteredData.reduce((a, b) => a + b, 0) / (filteredData.length || 1)).toFixed(1)) || 0;
  }

  const avgSugar = calculateAverage(sugarData);
  const avgSodium = calculateAverage(sodiumData);
  const avgCalorie = calculateAverage(calorieData);
  const avgFat = calculateAverage(fatData);
  const avgSteps = calculateAverage(stepsData);
  const avgDistance = calculateAverageFloat(distanceData);
  const avgCaloriesBurned = calculateAverage(caloriesBurnedData);

  const maxSugar = 30; const minSugar = 0;
  const maxSodium = 2500; const minSodium = 0;
  const maxCalorie = 2500; const minCalorie = 0;
  const maxFat = 100; const minFat = 0;
  const maxSteps = Math.max(12000, ...stepsData); const minSteps = 0;
  const maxDistance = Math.max(8, ...distanceData); const minDistance = 0;
  const maxCaloriesBurned = Math.max(500, ...caloriesBurnedData); const minCaloriesBurned = 0;

  const renderXLabels = (displayLabels, currentRange, chartType, dataForChartLength) => {
    return displayLabels.map((labelValue, displayIndex) => {
      let xPos;
      let dataPointsCount = chartType === 'bar' && currentRange === 'Month' ? 30 : dataForChartLength;
      dataPointsCount = dataPointsCount || displayLabels.length;
      if (chartType === 'bar') {
        const dataIndex = currentRange === 'Month' ? parseInt(labelValue) -1 : displayIndex;
        const barSpace = (CHART_WIDTH - 16) / dataPointsCount;
        const barWidth = dataPointsCount > 7 ? Math.max(4, CHART_WIDTH / dataPointsCount / 2.5) : 22;
        xPos = 8 + dataIndex * barSpace + barWidth / 2;
      } else { // This 'else' block is for line charts, kept for potential future use
        const dataIndex = currentRange === 'Month' ? parseInt(labelValue) -1 : displayIndex;
        xPos = 8 + dataIndex * ((CHART_WIDTH - 16) / (dataPointsCount > 1 ? dataPointsCount - 1 : 1) );
      }
      return (
        <SvgText key={`${labelValue}-${displayIndex}`} x={xPos} y={CHART_HEIGHT - 5} fontSize="11" fill="#888" textAnchor="middle">
          {labelValue}
        </SvgText>
      );
    });
  };

  const isDietLoading = activeTab === 'Diet' && isLoadingDietTrend &&
                       (sugarRange === 'Week' || sodiumRange === 'Week' || calorieRange === 'Week' || fatRange === 'Week');
  const isActivityLoading = activeTab === 'Aktiviti' && isLoadingStepsTrend &&
                           (stepsRange === 'Week' || distanceRange === 'Week' || caloriesBurnedRange === 'Week');

  if (isDietLoading || isActivityLoading) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color="#E53935" />
        <Text>
  {t('loading')}{' '}
  {t(activeTab.toLowerCase())}{' '}
  {t('trend')}
</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>{t('progress')}</Text>
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab === 'Diet' && styles.tabActive]} onPress={() => setActiveTab('Diet')}><Text style={[styles.tabText, activeTab === 'Diet' && styles.tabTextActive]}>{t('Diet')}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'Aktiviti' && styles.tabActive]} onPress={() => setActiveTab('Aktiviti')}><Text style={[styles.tabText, activeTab === 'Aktiviti' && styles.tabTextActive]}>{t('Activity')}</Text></TouchableOpacity>
        </View>

        {activeTab === 'Diet' ? (
          <>
            {/* Sugar Intake Card */}
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>{t('avgSugarIntake')}</Text>
              <View style={styles.rangeTabs}><TouchableOpacity onPress={() => setSugarRange('Week')} style={[styles.rangeTab, sugarRange === 'Week' && styles.rangeTabActive]}><Text style={[styles.rangeTabText, sugarRange === 'Week' && styles.rangeTabTextActive]}>{t('week')}</Text></TouchableOpacity><TouchableOpacity onPress={() => setSugarRange('Month')} style={[styles.rangeTab, sugarRange === 'Month' && styles.rangeTabActive]}><Text style={[styles.rangeTabText, sugarRange === 'Month' && styles.rangeTabTextActive]}>{t('month')}</Text></TouchableOpacity></View>
              <Text style={styles.metricValue}>{avgSugar}g</Text>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chartSvg}>
                <Line x1={0} y1={getRefLineY(30, minSugar, maxSugar, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} x2={CHART_WIDTH} y2={getRefLineY(30, minSugar, maxSugar, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} stroke="#E53935" strokeDasharray="4 3" strokeWidth={1} />
                <Line x1={0} y1={getRefLineY(20, minSugar, maxSugar, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} x2={CHART_WIDTH} y2={getRefLineY(20, minSugar, maxSugar, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} stroke="#bbb" strokeDasharray="4 3" strokeWidth={1} />
                {sugarData.map((val, i) => <AnimatedBar key={`sugar-${sugarRange}-${i}`} index={i} value={val} maxValue={maxSugar} minValue={minSugar} chartWidth={CHART_WIDTH} labelsLength={sugarData.length} delay={i * 30} barChartDrawHeight={BAR_CHART_DRAW_HEIGHT}/>)}
                {renderXLabels(sugarLabels, sugarRange, 'bar', sugarData.length)}
                <SvgText x={CHART_WIDTH - 5} y={getRefLineY(30, minSugar, maxSugar, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING) - 2} fontSize="12" fill="#E53935" textAnchor="end">30g</SvgText>
                <SvgText x={CHART_WIDTH - 5} y={getRefLineY(20, minSugar, maxSugar, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING) - 2} fontSize="12" fill="#bbb" textAnchor="end">20g</SvgText>
              </Svg>
            </View>

            {/* Sodium Intake Card */}
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>{t('avgSodiumIntake')}</Text>
              <View style={styles.rangeTabs}><TouchableOpacity onPress={() => setSodiumRange('Week')} style={[styles.rangeTab, sodiumRange === 'Week' && styles.rangeTabActive]}><Text style={[styles.rangeTabText, sodiumRange === 'Week' && styles.rangeTabTextActive]}>{t('week')}</Text></TouchableOpacity><TouchableOpacity onPress={() => setSodiumRange('Month')} style={[styles.rangeTab, sodiumRange === 'Month' && styles.rangeTabActive]}><Text style={[styles.rangeTabText, sodiumRange === 'Month' && styles.rangeTabTextActive]}>{t('month')}</Text></TouchableOpacity></View>
              <Text style={styles.metricValue}>{avgSodium} mg</Text>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chartSvg}>
                <Line x1={0} y1={getRefLineY(1500, minSodium, maxSodium, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} x2={CHART_WIDTH} y2={getRefLineY(1500, minSodium, maxSodium, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} stroke="#E53935" strokeDasharray="4 3" strokeWidth={1} />
                <Line x1={0} y1={getRefLineY(1000, minSodium, maxSodium, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} x2={CHART_WIDTH} y2={getRefLineY(1000, minSodium, maxSodium, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} stroke="#bbb" strokeDasharray="4 3" strokeWidth={1} />
                {sodiumData.map((val, i) => <AnimatedBar key={`sodium-${sodiumRange}-${i}`} index={i} value={val} maxValue={maxSodium} minValue={minSodium} chartWidth={CHART_WIDTH} labelsLength={sodiumData.length} delay={i * 30} barChartDrawHeight={BAR_CHART_DRAW_HEIGHT}/>)}
                {renderXLabels(sodiumLabels, sodiumRange, 'bar', sodiumData.length)}
                <SvgText x={CHART_WIDTH - 5} y={getRefLineY(1500, minSodium, maxSodium, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING) - 2} fontSize="12" fill="#E53935" textAnchor="end">1500mg</SvgText>
                <SvgText x={CHART_WIDTH - 5} y={getRefLineY(1000, minSodium, maxSodium, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING) - 2} fontSize="12" fill="#bbb" textAnchor="end">1000mg</SvgText>
              </Svg>
            </View>

            {/* Calorie Intake Card */}
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>{t('avgCalorieIntake')}</Text>
              <View style={styles.rangeTabs}><TouchableOpacity onPress={() => setCalorieRange('Week')} style={[styles.rangeTab, calorieRange === 'Week' && styles.rangeTabActive]}><Text style={[styles.rangeTabText, calorieRange === 'Week' && styles.rangeTabTextActive]}>{t('week')}</Text></TouchableOpacity><TouchableOpacity onPress={() => setCalorieRange('Month')} style={[styles.rangeTab, calorieRange === 'Month' && styles.rangeTabActive]}><Text style={[styles.rangeTabText, calorieRange === 'Month' && styles.rangeTabTextActive]}>{t('month')}</Text></TouchableOpacity></View>
              <Text style={styles.metricValue}>{avgCalorie} kcal</Text>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chartSvg}>
                <Line x1={0} y1={getRefLineY(1800, minCalorie, maxCalorie, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} x2={CHART_WIDTH} y2={getRefLineY(1800, minCalorie, maxCalorie, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} stroke="#E53935" strokeDasharray="4 3" strokeWidth={1} />
                <Line x1={0} y1={getRefLineY(1500, minCalorie, maxCalorie, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} x2={CHART_WIDTH} y2={getRefLineY(1500, minCalorie, maxCalorie, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} stroke="#bbb" strokeDasharray="4 3" strokeWidth={1} />
                {calorieData.map((val, i) => <AnimatedBar key={`calorie-${calorieRange}-${i}`} index={i} value={val} maxValue={maxCalorie} minValue={minCalorie} chartWidth={CHART_WIDTH} labelsLength={calorieData.length} delay={i * 30} barChartDrawHeight={BAR_CHART_DRAW_HEIGHT}/>)}
                {renderXLabels(calorieLabels, calorieRange, 'bar', calorieData.length)}
                <SvgText x={CHART_WIDTH - 5} y={getRefLineY(1800, minCalorie, maxCalorie, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING) - 2} fontSize="12" fill="#E53935" textAnchor="end">1800kcal</SvgText>
                <SvgText x={CHART_WIDTH - 5} y={getRefLineY(1500, minCalorie, maxCalorie, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING) - 2} fontSize="12" fill="#bbb" textAnchor="end">1500kcal</SvgText>
              </Svg>
            </View>

            {/* Fat Intake Card */}
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>{t('avgFatIntake')}</Text>
              <View style={styles.rangeTabs}><TouchableOpacity onPress={() => setFatRange('Week')} style={[styles.rangeTab, fatRange === 'Week' && styles.rangeTabActive]}><Text style={[styles.rangeTabText, fatRange === 'Week' && styles.rangeTabTextActive]}>{t('week')}</Text></TouchableOpacity><TouchableOpacity onPress={() => setFatRange('Month')} style={[styles.rangeTab, fatRange === 'Month' && styles.rangeTabActive]}><Text style={[styles.rangeTabText, fatRange === 'Month' && styles.rangeTabTextActive]}>{t('month')}</Text></TouchableOpacity></View>
              <Text style={styles.metricValue}>{avgFat}g</Text>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chartSvg}>
                <Line x1={0} y1={getRefLineY(70, minFat, maxFat, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} x2={CHART_WIDTH} y2={getRefLineY(70, minFat, maxFat, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} stroke="#E53935" strokeDasharray="4 3" strokeWidth={1} />
                <Line x1={0} y1={getRefLineY(50, minFat, maxFat, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} x2={CHART_WIDTH} y2={getRefLineY(50, minFat, maxFat, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} stroke="#bbb" strokeDasharray="4 3" strokeWidth={1} />
                {fatData.map((val, i) => <AnimatedBar key={`fat-${fatRange}-${i}`} index={i} value={val} maxValue={maxFat} minValue={minFat} chartWidth={CHART_WIDTH} labelsLength={fatData.length} delay={i * 30} barChartDrawHeight={BAR_CHART_DRAW_HEIGHT}/>)}
                {renderXLabels(fatLabels, fatRange, 'bar', fatData.length)}
                <SvgText x={CHART_WIDTH - 5} y={getRefLineY(70, minFat, maxFat, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING) -2} fontSize="12" fill="#E53935" textAnchor="end">70g</SvgText>
                <SvgText x={CHART_WIDTH - 5} y={getRefLineY(50, minFat, maxFat, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING) -2} fontSize="12" fill="#bbb" textAnchor="end">50g</SvgText>
              </Svg>
            </View>
          </>
        ) : ( // Aktiviti Tab
          <>
            {/* Steps Card - Now Bar Chart */}
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>{t('avgSteps')}</Text>
              <View style={styles.rangeTabs}><TouchableOpacity onPress={() => setStepsRange('Week')} style={[styles.rangeTab, stepsRange === 'Week' && styles.rangeTabActive]}><Text style={[styles.rangeTabText, stepsRange === 'Week' && styles.rangeTabTextActive]}>{t('week')}</Text></TouchableOpacity><TouchableOpacity onPress={() => setStepsRange('Month')} style={[styles.rangeTab, stepsRange === 'Month' && styles.rangeTabActive]}><Text style={[styles.rangeTabText, stepsRange === 'Month' && styles.rangeTabTextActive]}>{t('month')}</Text></TouchableOpacity></View>
              <Text style={styles.metricValue}>{avgSteps} steps</Text>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chartSvg}>
                <Line x1={0} y1={getRefLineY(maxSteps, minSteps, maxSteps, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} x2={CHART_WIDTH} y2={getRefLineY(maxSteps, minSteps, maxSteps, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} stroke="#E53935" strokeDasharray="4 3" strokeWidth={1} />
                <Line x1={0} y1={getRefLineY(minSteps + (maxSteps - minSteps) * 0.66, minSteps, maxSteps, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} x2={CHART_WIDTH} y2={getRefLineY(minSteps + (maxSteps - minSteps) * 0.66, minSteps, maxSteps, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} stroke="#bbb" strokeDasharray="4 3" strokeWidth={1} />
                {stepsData.map((val, i) => <AnimatedBar key={`steps-${stepsRange}-${i}`} index={i} value={val} maxValue={maxSteps} minValue={minSteps} chartWidth={CHART_WIDTH} labelsLength={stepsData.length} delay={i * 30} barChartDrawHeight={BAR_CHART_DRAW_HEIGHT}/>)}
                {renderXLabels(stepsLabels, stepsRange, 'bar', stepsData.length)}
                <SvgText x={CHART_WIDTH - 5} y={getRefLineY(maxSteps, minSteps, maxSteps, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING) - 2} fontSize="12" fill="#E53935" textAnchor="end">{Math.round(maxSteps/1000)}k</SvgText>
                <SvgText x={CHART_WIDTH - 5} y={getRefLineY(minSteps + (maxSteps-minSteps)*0.66, minSteps, maxSteps, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING) - 2} fontSize="12" fill="#bbb" textAnchor="end">{Math.round((minSteps + (maxSteps-minSteps)*0.66)/1000)}k</SvgText>
              </Svg>
            </View>

            {/* Distance Card - Now Bar Chart */}
             <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>{t('avgDistance')}</Text>
              <View style={styles.rangeTabs}><TouchableOpacity onPress={() => setDistanceRange('Week')} style={[styles.rangeTab, distanceRange === 'Week' && styles.rangeTabActive]}><Text style={[styles.rangeTabText, distanceRange === 'Week' && styles.rangeTabTextActive]}>{t('week')}</Text></TouchableOpacity><TouchableOpacity onPress={() => setDistanceRange('Month')} style={[styles.rangeTab, distanceRange === 'Month' && styles.rangeTabActive]}><Text style={[styles.rangeTabText, distanceRange === 'Month' && styles.rangeTabTextActive]}>{t('month')}</Text></TouchableOpacity></View>
              <Text style={styles.metricValue}>{avgDistance} km</Text>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chartSvg}>
                <Line x1={0} y1={getRefLineY(maxDistance, minDistance, maxDistance, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} x2={CHART_WIDTH} y2={getRefLineY(maxDistance, minDistance, maxDistance, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} stroke="#E53935" strokeDasharray="4 3" strokeWidth={1} />
                <Line x1={0} y1={getRefLineY(minDistance + (maxDistance - minDistance) * 0.57, minDistance, maxDistance, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} x2={CHART_WIDTH} y2={getRefLineY(minDistance + (maxDistance - minDistance) * 0.57, minDistance, maxDistance, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} stroke="#bbb" strokeDasharray="4 3" strokeWidth={1} />
                {distanceData.map((val, i) => <AnimatedBar key={`distance-${distanceRange}-${i}`} index={i} value={val} maxValue={maxDistance} minValue={minDistance} chartWidth={CHART_WIDTH} labelsLength={distanceData.length} delay={i * 30} barChartDrawHeight={BAR_CHART_DRAW_HEIGHT}/>)}
                {renderXLabels(distanceLabels, distanceRange, 'bar', distanceData.length)}
                <SvgText x={CHART_WIDTH - 5} y={getRefLineY(maxDistance, minDistance, maxDistance, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING) -2} fontSize="12" fill="#E53935" textAnchor="end">{Math.round(maxDistance)}km</SvgText>
                <SvgText x={CHART_WIDTH - 5} y={getRefLineY(minDistance + (maxDistance - minDistance) * 0.57, minDistance, maxDistance, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING) -2} fontSize="12" fill="#bbb" textAnchor="end">{Math.round(minDistance + (maxDistance - minDistance) * 0.57)}km</SvgText>
              </Svg>
            </View>

            {/* Calories Burned Card - Now Bar Chart */}
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>{t('avgCaloriesBurned')}</Text>
              <View style={styles.rangeTabs}><TouchableOpacity onPress={() => setCaloriesBurnedRange('Week')} style={[styles.rangeTab, caloriesBurnedRange === 'Week' && styles.rangeTabActive]}><Text style={[styles.rangeTabText, caloriesBurnedRange === 'Week' && styles.rangeTabTextActive]}>{t('week')}</Text></TouchableOpacity><TouchableOpacity onPress={() => setCaloriesBurnedRange('Month')} style={[styles.rangeTab, caloriesBurnedRange === 'Month' && styles.rangeTabActive]}><Text style={[styles.rangeTabText, caloriesBurnedRange === 'Month' && styles.rangeTabTextActive]}>{t('month')}</Text></TouchableOpacity></View>
              <Text style={styles.metricValue}>{avgCaloriesBurned} kcal</Text>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chartSvg}>
                <Line x1={0} y1={getRefLineY(maxCaloriesBurned, minCaloriesBurned, maxCaloriesBurned, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} x2={CHART_WIDTH} y2={getRefLineY(maxCaloriesBurned, minCaloriesBurned, maxCaloriesBurned, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} stroke="#E53935" strokeDasharray="4 3" strokeWidth={1} />
                <Line x1={0} y1={getRefLineY(minCaloriesBurned + (maxCaloriesBurned - minCaloriesBurned) * 0.6, minCaloriesBurned, maxCaloriesBurned, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} x2={CHART_WIDTH} y2={getRefLineY(minCaloriesBurned + (maxCaloriesBurned - minCaloriesBurned) * 0.6, minCaloriesBurned, maxCaloriesBurned, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING)} stroke="#bbb" strokeDasharray="4 3" strokeWidth={1} />
                {caloriesBurnedData.map((val, i) => <AnimatedBar key={`calsBurned-${caloriesBurnedRange}-${i}`} index={i} value={val} maxValue={maxCaloriesBurned} minValue={minCaloriesBurned} chartWidth={CHART_WIDTH} labelsLength={caloriesBurnedData.length} delay={i * 30} barChartDrawHeight={BAR_CHART_DRAW_HEIGHT}/>)}
                {renderXLabels(caloriesBurnedLabels, caloriesBurnedRange, 'bar', caloriesBurnedData.length)}
                <SvgText x={CHART_WIDTH - 5} y={getRefLineY(maxCaloriesBurned, minCaloriesBurned, maxCaloriesBurned, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING) -2} fontSize="12" fill="#E53935" textAnchor="end">{maxCaloriesBurned}kcal</SvgText>
                <SvgText x={CHART_WIDTH - 5} y={getRefLineY(minCaloriesBurned + (maxCaloriesBurned - minCaloriesBurned) * 0.6, minCaloriesBurned, maxCaloriesBurned, BAR_CHART_DRAW_HEIGHT, CHART_DRAW_TOP_PADDING) -2} fontSize="12" fill="#bbb" textAnchor="end">{Math.round(minCaloriesBurned + (maxCaloriesBurned - minCaloriesBurned) * 0.6)}kcal</SvgText>
              </Svg>
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.bottomNav}>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/HomeScreen',params: patientCredentials})}><Text style={[styles.navIcon]}>🏠</Text><Text style={[styles.navLabel]}>{t('home')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/AIChatScreen',params: patientCredentials})}><Text style={styles.navIcon}>💬</Text><Text style={styles.navLabel}>{t('stelgginAI')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/ProgressScreen',params: patientCredentials})}><Text style={[styles.navIcon, styles.navIconActive]}>📊</Text><Text style={[styles.navLabel, styles.navLabelActive]}>{t('progress')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/SettingsScreen',params: patientCredentials})}><Text style={styles.navIcon}>⚙️</Text><Text style={styles.navLabel}>{t('settings')}</Text></TouchableOpacity>
            </View>
          </View>
  );
}

const cardShadow = { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, };
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', },
  scrollContent: { paddingBottom: 100, paddingHorizontal: 16, paddingTop: 18, },
  header: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 12, },
  tabs: { flexDirection: 'row', marginBottom: 18, backgroundColor: '#fff', borderRadius: 8, ...cardShadow, overflow: 'hidden', },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff', },
  tabActive: { backgroundColor: '#E53935', },
  tabText: { color: '#222', fontSize: 14, fontWeight: 'bold', },
  tabTextActive: { color: '#fff', },
  metricCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 18, ...cardShadow, },
  metricTitle: { fontWeight: 'bold', color: '#E53935', fontSize: 15, marginBottom: 6, },
  metricValue: { color: '#222', fontSize: 22, fontWeight: 'bold', marginTop: 2, marginBottom: 2, },
  rangeTabs: { flexDirection: 'row', marginBottom: 6, marginTop: 2, },
  rangeTab: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12, backgroundColor: '#f2f2f2', marginRight: 8, },
  rangeTabActive: { backgroundColor: '#E53935', },
  rangeTabText: { color: '#888', fontSize: 13, fontWeight: 'bold', },
  rangeTabTextActive: { color: '#fff', },
  chartSvg: { alignSelf: 'center', marginTop: 8, minWidth: 180 },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E2E8F0', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 8, paddingBottom:  (Dimensions.get('window').height * 0.01) < 5 ? 5 : (Dimensions.get('window').height * 0.01), zIndex: 5, },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 24, marginBottom: 3, color: '#A0AEC0' },
  navIconActive: { color: '#E53935' },
  navLabel: { fontSize: 11, color: '#718096' },
  navLabelActive: { color: '#E53935', fontWeight: '600' },
});