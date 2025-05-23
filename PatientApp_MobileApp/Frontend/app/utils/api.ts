import { Alert } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE;

interface FoodAnalysisResult {
  Food: string;
  "calories(kcal)": number;
  "fat(g)": number;
  "sodium(g)": number;
  "sugar(g)": number;
  image_link?: string;
}

interface TodayDietLogResponse {
  patientid: number;
  date: string;
  total_calorie: number;
  total_fat: number;
  total_sodium: number;
  total_sugar: number;
}

interface SuggestedDiet {
  Max_Fat: number;
  Max_Sodium: number;
  Max_Sugar: number;
  Notes: String;
  PatientID: number;
  Target_Daily_Calories: number;
}

export const fetchTodayDietLog = async (patientId: string, t: (key: string) => string) => {
  if (!patientId) {
    throw new Error(t('patientIdMissingError') || 'Patient ID is missing.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/get_today_diet_log?patientid=${patientId}`);
    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try { const errData = await response.json(); errorMsg = errData.detail || JSON.stringify(errData) || errorMsg; } catch (e) { /* Ignore */ }
      throw new Error(errorMsg);
    }
    const data: TodayDietLogResponse = await response.json();
    console.log("Fetched today's diet log:", data);

    const response2 = await fetch(`${API_BASE_URL}/get_diet_plan?patientid=${patientId}`);
    if (!response2.ok) {
      let errorMsg = `HTTP error! status: ${response2.status}`;
      try { const errData = await response2.json(); errorMsg = errData.detail || JSON.stringify(errData) || errorMsg; } catch (e) { /* Ignore */ }
      throw new Error(errorMsg);
    }
    const data2: SuggestedDiet = await response2.json();
    console.log("Suggested today's diet log:", data2);

    return { dietLog: data, suggestedDiet: data2 };
  } catch (error: any) {
    console.error("Failed to fetch today's diet log:", error);
    Alert.alert(t('errorTitle') || 'Error', t('fetchDietLogError') || 'Could not fetch daily diet summary.');
    throw error;
  }
};

export const takePicture = async (patientId: string, t: (key: string) => string) => {
  if (!patientId) {
    Alert.alert(t('errorTitle') || 'Error', t('patientIdMissingError') || 'Patient ID is missing.');
    return null;
  }

  // Reset states
  let imageUriFromPicker: string | null = null;
  let fileToUpload: File | { uri: string; name: string; type: string } | null = null;
  let actualMimeType: string | null = null;
  let displayUri: string | null = null;

  // Implement image picking logic here
  // ...

  return { imageUriFromPicker, fileToUpload, actualMimeType, displayUri };
}; 