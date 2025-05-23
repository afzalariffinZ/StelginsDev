import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Image,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
  ScrollView,
  TextInput
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
// import * as FileSystem from 'expo-file-system'; // Usually not needed for FormData with URIs

import { useLanguage } from './i18n/LanguageContext'; // Adjust path if needed
import AnimatedNumber from './components/AnimatedNumber';
import { fetchTodayDietLog, takePicture } from './utils/api';
import FoodConfirmationModal from './components/FoodConfirmationModal';
import ManualFoodInputModal from './components/ManualFoodInputModal';

const { width, height } = Dimensions.get('window');

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE; // Ensure this is correct

interface FoodAnalysisResult {
  Food: string;
  "calories(kcal)": number;
  "fat(g)": number;
  "sodium(g)": number; // Assuming your API might return sodium in grams
  "sugar(g)": number;
  image_link?: string;
}

interface TodayDietLogResponse {
  patientid: number;
  date: string;
  total_calorie: number;
  total_fat: number;
  total_sodium: number; // Expecting sodium in mg from this endpoint based on card display
  total_sugar: number;
}

interface SuggestedDiet {
  Max_Fat: number;
  Max_Sodium: number;
  Max_Sugar: number;
  Notes: String;
  PatientID: number; // Expecting sodium in mg from this endpoint based on card display
  Target_Daily_Calories: number;
}

export default function HomeScreen() {
  const { name, patientId: patientIdParam } = useLocalSearchParams() as { name?: string, patientId?: string };
  const patientId = patientIdParam; // This will be a string, needs conversion for API if number is expected

  const patientCredentials = {
    name: name,    
    patientId: patientId, 
    
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [logMakananVisible, setLogMakananVisible] = useState(false);
  const [foodResultVisible, setFoodResultVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSavingFoodLog, setIsSavingFoodLog] = useState(false); // Renamed from isLoading for clarity
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const { t, isLanguageLoaded } = useLanguage();

  const [nutrientData, setNutrientData] = useState<FoodAnalysisResult | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // State for today's diet summary
  const [todaySodium, setTodaySodium] = useState(0);
  const [todayFat, setTodayFat] = useState(0);
  const [todayCalories, setTodayCalories] = useState(0);
  const [todaySugar, setTodaySugar] = useState(0);
  const [sugSodium, setSugSodium] = useState(0);
  const [sugFat, setSugFat] = useState(0);
  const [sugCal, setSugCal] = useState(0);
  const [sugsug, setSugSug] = useState(0);
  const [sugDoc, setSugDoc] = useState('');
  const [isLoadingDietLog, setIsLoadingDietLog] = useState(true); // For fetching diet log
  const [dietLogError, setDietLogError] = useState<string | null>(null);

  // State variables for the new food confirmation flow
  const [showFoodConfirmation, setShowFoodConfirmation] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualFoodName, setManualFoodName] = useState('');
  const [tempNutrientData, setTempNutrientData] = useState<FoodAnalysisResult | null>(null);

  const fetchDietLog = useCallback(async () => {
    if (!isLanguageLoaded) return;

    if (!patientId) {
      Alert.alert(t('errorTitle') || 'Error', t('patientIdMissingError') || 'Patient ID is missing. Cannot load data.');
      setIsLoadingDietLog(false);
      setTodayCalories(0); setTodayFat(0); setTodaySodium(0); setTodaySugar(0);
      setSugCal(0); setSugFat(0); setSugSodium(0); setSugSug(0); setSugDoc('');
      return;
    }

    try {
      const { dietLog, suggestedDiet } = await fetchTodayDietLog(patientId, t);
      setTodayCalories(dietLog.total_calorie);
      setTodayFat(dietLog.total_fat);
      setTodaySodium(dietLog.total_sodium);
      setTodaySugar(dietLog.total_sugar);
      setSugCal(suggestedDiet.Target_Daily_Calories);
      setSugSug(suggestedDiet.Max_Sugar);
      setSugFat(suggestedDiet.Max_Fat);
      setSugSodium(suggestedDiet.Max_Sodium);
      setSugDoc(String(suggestedDiet.Notes));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setDietLogError(errorMessage);
    } finally {
      setIsLoadingDietLog(false);
    }
  }, [patientId, isLanguageLoaded, t]);

  useEffect(() => {
    fetchDietLog();
  }, [fetchDietLog]);

  const handleTakePicture = async () => {
    if (!patientId) {
      Alert.alert(t('errorTitle') || 'Error', t('patientIdMissingError') || 'Patient ID is missing.');
        return;
    }

    try {
      // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('errorTitle') || 'Error', t('cameraPermissionDenied') || 'Camera permission is required to take pictures.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setLogMakananVisible(false);
        setIsProcessingImage(true);
        setApiError(null);

        try {
          const formData = new FormData();
          formData.append('patientid', patientId);

          // Create file object for the image
          const imageUri = result.assets[0].uri;
          const filename = imageUri.split('/').pop() || `camera_image_${Date.now()}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

          let fileToUpload: any;
          if (Platform.OS === 'web') {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            fileToUpload = new File([blob], filename, { type: blob.type || type });
            } else { 
            fileToUpload = {
              uri: imageUri,
              name: filename,
              type: type,
            };
          }

          formData.append('file', fileToUpload);

          const response = await fetch(`${API_BASE_URL}/upload-image`, {
            method: 'POST',
            body: formData,
          });

          const responseData = await response.json();
        if (response.ok) {
            handleImageAnalysisSuccess(responseData);
          } else {
            const errorMessage = responseData?.detail || responseData?.message || 'Failed to analyze image';
            setApiError(errorMessage);
            Alert.alert(t('errorTitle') || 'Error', errorMessage);
          }
        } catch (error: any) {
          console.error("Error analyzing image:", error);
          const errorMsg = error.message || t('networkErrorGeneric') || 'A network error occurred';
          setApiError(errorMsg);
          Alert.alert(t('errorTitle') || 'Error', errorMsg);
    } finally {
        setIsProcessingImage(false);
        }
      }
    } catch (error: any) {
      console.error("Error taking picture:", error);
      Alert.alert(t('errorTitle') || 'Error', error.message || t('cameraError') || 'Failed to take picture');
    }
  };

  const handleUploadPicture = async () => {
    if (!patientId) {
      Alert.alert(t('errorTitle') || 'Error', t('patientIdMissingError') || 'Patient ID is missing.');
      return;
    }

    try {
      // Request media library permissions
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('errorTitle') || 'Error', t('galleryPermissionDenied') || 'Gallery permission is required to upload pictures.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setLogMakananVisible(false);
        setIsProcessingImage(true);
        setApiError(null);

        try {
          const formData = new FormData();
          formData.append('patientid', patientId);

          // Create file object for the image
          const imageUri = result.assets[0].uri;
          const filename = imageUri.split('/').pop() || `upload_image_${Date.now()}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

          let fileToUpload: any;
          if (Platform.OS === 'web') {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            fileToUpload = new File([blob], filename, { type: blob.type || type });
          } else {
            fileToUpload = {
              uri: imageUri,
              name: filename,
              type: type,
            };
          }

          formData.append('file', fileToUpload);

          const response = await fetch(`${API_BASE_URL}/upload-image`, {
            method: 'POST',
            body: formData,
          });

          const responseData = await response.json();
      if (response.ok) {
            handleImageAnalysisSuccess(responseData);
          } else {
            const errorMessage = responseData?.detail || responseData?.message || 'Failed to analyze image';
            setApiError(errorMessage);
            Alert.alert(t('errorTitle') || 'Error', errorMessage);
          }
        } catch (error: any) {
          console.error("Error analyzing image:", error);
          const errorMsg = error.message || t('networkErrorGeneric') || 'A network error occurred';
          setApiError(errorMsg);
          Alert.alert(t('errorTitle') || 'Error', errorMsg);
  } finally {
      setIsProcessingImage(false);
      }
      }
    } catch (error: any) {
      console.error("Error uploading picture:", error);
      Alert.alert(t('errorTitle') || 'Error', error.message || t('uploadError') || 'Failed to upload picture');
  }
};

  // MODIFIED: Handles success from initial image analysis (/upload-image)
  const handleImageAnalysisSuccess = (data: FoodAnalysisResult) => {
    setApiError(null); // Clear previous errors
    setTempNutrientData(data); // Store data temporarily
    setShowFoodConfirmation(true); // Show confirmation modal
    setLogMakananVisible(false); // Ensure log food option modal is closed
  };

  // NEW/MODIFIED: Handles user confirming the food name from initial analysis
  const handleFoodConfirmation = () => {
    if (tempNutrientData) {
      setNutrientData(tempNutrientData); // Set final nutrient data
      setTempNutrientData(null); // Clear temporary data
      setShowFoodConfirmation(false); // Close confirmation modal
      setFoodResultVisible(true); // Show results modal
    }
  };

  // NEW/MODIFIED: Handles user choosing to input food name manually
  const handleManualInputSelection = () => {
    setManualFoodName(tempNutrientData?.Food || ''); // Pre-fill with detected name if available
    setShowFoodConfirmation(false); // Close confirmation modal
    setShowManualInput(true); // Show manual input modal
  };

  // MODIFIED: Handles submission of manually entered food name with the original image
  const handleManualFoodSubmit = async () => {
    if (!manualFoodName.trim()) {
      Alert.alert(t('errorTitle') || 'Error', t('foodNameRequired') || 'Please enter a food name');
      return;
    }
    if (!patientId) {
      Alert.alert(t('errorTitle') || 'Error', t('patientIdMissingError') || 'Patient ID is missing.');
      return;
    }

    setIsProcessingImage(true);
    setApiError(null);
    try {
      const formData = new FormData();
      formData.append('FoodName', manualFoodName); // FastAPI expects 'FoodName'
      formData.append('patientid', patientId);
      
      if (selectedImage) { // selectedImage should still hold the URI from the initial pick/take
        // Re-create file object for FormData. This logic might need adjustment based on how selectedImage URI is stored (blob, file URI, data URI)
        // For simplicity, assuming selectedImage is a displayable URI that can also be fetched or directly used.
        // The original pickImage/takePicture logic already prepares 'fileToUpload'. We need similar here.
        // This part is tricky if selectedImage is a blob URL that got revoked.
        // Best to re-use the logic from pickImage/takePicture if possible, or ensure selectedImage is robust.
        // For now, construct a basic file object, actualMimeType might need to be re-derived or stored.

        let fileForManualUpload: any = null;
        const imageUri = selectedImage;
        const filename = imageUri.split('/').pop() || `manual_image_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        // Try to guess type, default to jpeg. If more precise type was stored from initial upload, use that.
        let type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
        if (type === 'image/jpg') type = 'image/jpeg';


        if (Platform.OS === 'web' && imageUri.startsWith('blob:')) {
            // If it's a blob URI, it might have been created by URL.createObjectURL.
            // We need to fetch it and convert to a File object.
            const response = await fetch(imageUri);
            const blob = await response.blob();
            fileForManualUpload = new File([blob], filename, { type: blob.type || type });
        } else if (Platform.OS === 'web' && imageUri.startsWith('data:')) {
            const parts = imageUri.split(',');
            const metaPart = parts[0]; const base64Data = parts[1];
            let actualMimeTypeFromDataUri = 'image/jpeg';
            const mimeMatchWeb = metaPart.match(/^data:(image\/(?:png|jpe?g|webp|gif|heic|heif));base64$/i);
             if (mimeMatchWeb && mimeMatchWeb[1]) {
                actualMimeTypeFromDataUri = mimeMatchWeb[1].toLowerCase();
                if (actualMimeTypeFromDataUri === 'image/jpg') actualMimeTypeFromDataUri = 'image/jpeg';
            }
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: actualMimeTypeFromDataUri });
            fileForManualUpload = new File([blob], filename, { type: actualMimeTypeFromDataUri });

        } else { // Native
            fileForManualUpload = {
                uri: imageUri,
                name: filename,
                type: type, // This might need to be more robust, e.g., store original mimeType
            };
        }
        formData.append('file', fileForManualUpload); // FastAPI expects 'file'
      } else {
        Alert.alert(t('errorTitle') || 'Error', t('imageMissingError') || 'Original image is missing for re-analysis.');
        setIsProcessingImage(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/upload-image-and-Name`, { // Corrected endpoint
        method: 'POST',
        body: formData,
        // Headers for FormData are set automatically by fetch
      });

      const responseData = await response.json();
      if (response.ok) {
        // The FastAPI endpoint /upload-image-and-Name should ideally set the Food name correctly.
        // This ensures the display name is what user typed.
        const updatedResponseData = {
          ...responseData,
          Food: manualFoodName 
        };
        setNutrientData(updatedResponseData as FoodAnalysisResult);
        setShowManualInput(false);
        setFoodResultVisible(true);
        setTempNutrientData(null); // Clear temp data
        setManualFoodName(''); // Clear manual input
      } else {
        const errorMessage = responseData?.detail || responseData?.message || 'Failed to analyze food with manual name';
        setApiError(errorMessage);
        Alert.alert(t('errorTitle') || 'Error', errorMessage);
      }
    } catch (err: any) {
      console.error("Error analyzing food with manual name:", err);
      const errorMsg = err.message || t('networkErrorGeneric') || 'A network error occurred';
      setApiError(errorMsg);
      Alert.alert(t('errorTitle') || 'Error', errorMsg);
    } finally {
      setIsProcessingImage(false);
    }
  };


  // MODIFIED: Handles saving the food log to the backend using /insert_logs
  const handleSaveFoodLog = async () => {
    if (!nutrientData || !patientId) {
      Alert.alert(t('errorTitle') || 'Error', t('noDataToSaveError') || 'No nutrient data or patient ID to save.');
      return;
    }

    setIsSavingFoodLog(true);
    setApiError(null);

    try {
      const logEntryPayload = {
        patientid: parseInt(patientId), 
        Food_name: nutrientData.Food,
        Calorie_kcal: nutrientData["calories(kcal)"],
        Fat_g: nutrientData["fat(g)"],
        Sugar_g: nutrientData["sugar(g)"],
        Sodium_g: nutrientData["sodium(g)"], // Ensure this is in grams
        image_link: nutrientData.image_link || "", // FastAPI expects image_link
      };
      
      const response = await fetch(`${API_BASE_URL}/insert_logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntryPayload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Failed to save log to server.'}));
        throw new Error(errData.detail || `Failed to save log. Server responded with ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log("Food log saved to backend via /insert_logs:", responseData);

      setIsSavingFoodLog(false);
      setFoodResultVisible(false);
      setShowSuccess(true);
      setSelectedImage(null); 
      setNutrientData(null); 
      setTempNutrientData(null);
      setManualFoodName('');

      fetchDietLog(); // Refresh today's summary

    } catch (error: any) {
      console.error("Error saving food log:", error);
      setApiError(error.message || t('saveFoodLogError') || 'Could not save food log data.');
      Alert.alert(t('errorTitle') || 'Error', error.message || t('saveFoodLogError') || 'Could not save food log data.');
      setIsSavingFoodLog(false);
    }
  };

  const closeFoodResultModal = () => {
    setFoodResultVisible(false);
    // Keep selectedImage if user might go back to manual input, or clear it.
    // Let's clear it for a cleaner state after closing result.
    setSelectedImage(null); 
    setNutrientData(null);
    setTempNutrientData(null);
    setApiError(null);
    setManualFoodName('');
  };


  if (!isLanguageLoaded) {
    return ( <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}><ActivityIndicator size="large" color="#E53935" /></View> );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
            <Text style={styles.greeting}>{t('goodMorning')}, {name || 'User'}!</Text>
            <Text style={styles.subtitle}>{t('haveANiceDay')}</Text>
            
            {isLoadingDietLog && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E53935" />
                    <Text style={styles.loadingTextCards}>{t('loadingDietData') || "Loading today's summary..."}</Text>
                </View>
            )}

            {dietLogError && !isLoadingDietLog && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTextCards}>{dietLogError}</Text>
              <TouchableOpacity onPress={fetchDietLog} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>{t('retry') || "Retry"}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!isLoadingDietLog && !dietLogError && (
              <>
                <View style={styles.card}>
                <View style={styles.cardIconCircle}>
                  <Text style={styles.cardIcon}>🧂</Text>
                </View>
                  <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle}>{t('todaySodium')}</Text>
                      <Text style={styles.cardValueDisplay}>
                          <AnimatedNumber toValue={todaySodium} decimals={0} style={styles.cardValueAnimated} /> / {sugSodium} g
                      </Text>
                  </View>
                </View>
                
                <View style={styles.card}>
                <View style={styles.cardIconCircle}>
                  <Text style={styles.cardIcon}>🥓</Text>
                </View>
                  <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle}>{t('todayFat')}</Text>
                      <Text style={styles.cardValueDisplay}>
                    <AnimatedNumber toValue={todayFat} decimals={1} style={styles.cardValueAnimated} /> / {sugFat} g
                      </Text>
                  </View>
                </View>

                <View style={styles.card}>
                <View style={styles.cardIconCircle}>
                  <Text style={styles.cardIcon}>🔥</Text>
                </View>
                  <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle}>{t('todayCalories')}</Text>
                      <Text style={styles.cardValueDisplay}>
                    <AnimatedNumber toValue={todayCalories} decimals={0} style={styles.cardValueAnimated} /> / {sugCal} kcal
                      </Text>
                  </View>
                </View>

                <View style={styles.card}>
                <View style={styles.cardIconCircle}>
                  <Text style={styles.cardIcon}>🍬</Text>
                </View>
                  <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle}>{t('todaySugar')}</Text>
                      <Text style={styles.cardValueDisplay}>
                    <AnimatedNumber toValue={todaySugar} decimals={1} style={styles.cardValueAnimated} /> / {sugsug} g
                      </Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.aiCard}>
          <Text style={styles.aiCardTitle}>{t('latestAISuggestion')}</Text>
          <View style={styles.aiSuggestionBox}>
              <Text style={styles.aiSuggestionText}>{sugDoc}</Text>
          </View>
        </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>☰</Text>
      </TouchableOpacity>
      
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('logData')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setModalVisible(false);
                router.replace({pathname:'/FoodLogScreen',params:patientCredentials});
              }}
            >
              <View style={styles.modalIconCircle}>
                <Text style={styles.modalIcon}>📋</Text>
              </View>
              <Text style={styles.modalItemLabel}>{t('viewFoodLog')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setModalVisible(false);
                setLogMakananVisible(true);
              }}
            >
              <View style={styles.modalIconCircle}>
                <Text style={styles.modalIcon}>🍽️</Text>
              </View>
              <Text style={styles.modalItemLabel}>{t('addFoodLog')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setModalVisible(false);
                router.replace({pathname:'/FitnessSummaryScreen',params:patientCredentials});
              }}
            >
              <View style={styles.modalIconCircle}>
                <Text style={styles.modalIcon}>📈</Text>
              </View>
              <Text style={styles.modalItemLabel}>{t('viewExerciseLog')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Modal for logging food (camera/upload options) */}
      <Modal visible={logMakananVisible} transparent animationType="fade" onRequestClose={() => setLogMakananVisible(false)}>
        <TouchableOpacity style={styles.modalOverlayTouchable} activeOpacity={1} onPressOut={() => setLogMakananVisible(false)}>
            <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{t('logFood')}</Text>
                    <TouchableOpacity onPress={() => setLogMakananVisible(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
                </View>
                <View style={styles.cameraBox}>
                    <TouchableOpacity style={{alignItems:'center'}} onPress={handleTakePicture} disabled={isProcessingImage}>
                        <View style={styles.cameraIconCircle}><Text style={styles.cameraIcon}>📷</Text></View>
                        <Text style={styles.cameraLabel}>{t('takePicture')}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPicture} disabled={isProcessingImage}>
                    <Text style={styles.uploadIcon}>⤴️</Text><Text style={styles.uploadLabel}>{t('uploadImage')}</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal for displaying food analysis result */}
      <Modal visible={foodResultVisible} transparent animationType="fade" onRequestClose={closeFoodResultModal}>
        <TouchableOpacity style={styles.modalOverlayTouchable} activeOpacity={1} onPressOut={closeFoodResultModal}>
            <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{nutrientData?.Food || t('logFood')}</Text>
                    <TouchableOpacity onPress={closeFoodResultModal}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
                </View>
                {selectedImage && ( <Image source={{ uri: selectedImage }} style={styles.foodImage} resizeMode="cover" /> )}
                <Text style={styles.nutrientTitle}>{t('detectedNutrients')}</Text>
                
                {nutrientData && (
                    <View style={styles.nutrientBox}>
                        {/* Corrected Sodium display to show grams with 3 decimal places */}
                        <View style={styles.nutrientRow}><Text style={styles.nutrientLabel}>{t('sodium')} :</Text><Text style={styles.nutrientValueNum}>{nutrientData['sodium(g)'] !== undefined ? `${nutrientData['sodium(g)'].toFixed(3)} g` : 'N/A'}</Text></View>
                        <View style={styles.nutrientRow}><Text style={styles.nutrientLabel}>{t('fat')} :</Text><Text style={styles.nutrientValueNum}>{nutrientData['fat(g)'] !== undefined ? `${nutrientData['fat(g)'].toFixed(1)} g` : 'N/A'}</Text></View>
                        <View style={styles.nutrientRow}><Text style={styles.nutrientLabel}>{t('calories')} :</Text><Text style={styles.nutrientValueNum}>{nutrientData['calories(kcal)'] !== undefined ? `${nutrientData['calories(kcal)'].toFixed(0)} kcal` : 'N/A'}</Text></View>
                        <View style={styles.nutrientRow}><Text style={styles.nutrientLabel}>{t('sugar')} :</Text><Text style={styles.nutrientValueNum}>{nutrientData['sugar(g)'] !== undefined ? `${nutrientData['sugar(g)'].toFixed(1)} g` : 'N/A'}</Text></View>
                    </View>
                )}
                {apiError && <Text style={styles.errorTextModal}>{apiError}</Text>}
                <TouchableOpacity style={[styles.saveButton, {marginTop: 16}]} onPress={handleSaveFoodLog} disabled={isSavingFoodLog || isProcessingImage || !nutrientData}>
                    {isSavingFoodLog ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t('save')}</Text>}
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal for image processing loader (covers all processing) */}
      <Modal visible={isProcessingImage} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, styles.loadingCard]}>
                <ActivityIndicator size="large" color="#E53935" />
                <Text style={styles.loadingText}>{t('processingImage') || 'Processing Image...'}</Text>
            </View>
        </View>
      </Modal>
      
      {/* Modal for "Saving data..." loader */}
      <Modal visible={isSavingFoodLog} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={[styles.modalCard, styles.loadingCard]}><ActivityIndicator size="large" color="#E53935" /><Text style={styles.loadingText}>{t('savingData')}</Text></View></View>
      </Modal>

      {/* Modal for success message */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={[styles.modalCard, styles.successCard]}><Text style={styles.successIcon}>✅</Text><Text style={styles.successTitle}>{t('success')}</Text><Text style={styles.successText}>{t('foodDataSaved')}</Text><TouchableOpacity style={styles.successButton} onPress={() => setShowSuccess(false)}><Text style={styles.successButtonText}>OK</Text></TouchableOpacity></View></View>
      </Modal>

      {/* Food Confirmation Modal */}
      <FoodConfirmationModal
        visible={showFoodConfirmation}
        onClose={() => setShowFoodConfirmation(false)}
        onConfirm={handleFoodConfirmation}
        onManualInput={() => {
          setShowFoodConfirmation(false);
          setShowManualInput(true);
        }}
        selectedImage={selectedImage}
        foodName={tempNutrientData?.Food || ''}
        t={t}
      />

      {/* Manual Food Input Modal */}
      <ManualFoodInputModal
        visible={showManualInput}
        onClose={() => setShowManualInput(false)}
        onSubmit={handleManualFoodSubmit}
        selectedImage={selectedImage}
        t={t}
        foodName={manualFoodName}
        onFoodNameChange={setManualFoodName}
        isProcessing={isProcessingImage}
      />

      {/* --- BOTTOM NAVIGATION --- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/HomeScreen',params: patientCredentials})}><Text style={[styles.navIcon, styles.navIconActive]}>🏠</Text><Text style={[styles.navLabel, styles.navLabelActive]}>{t('home')}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/AIChatScreen',params: patientCredentials})}><Text style={styles.navIcon}>💬</Text><Text style={styles.navLabel}>{t('stelgginAI')}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/ProgressScreen',params: patientCredentials})}><Text style={styles.navIcon}>📊</Text><Text style={styles.navLabel}>{t('progress')}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/SettingsScreen',params: patientCredentials})}><Text style={styles.navIcon}>⚙️</Text><Text style={styles.navLabel}>{t('settings')}</Text></TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  scrollContent: { paddingBottom: 80 }, 
  content: { width: '100%', paddingHorizontal: width * 0.05, paddingTop: 30 },
  greeting: { fontSize: 24, fontWeight: '600', color: '#1A202C', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#4A5568', marginBottom: 24, },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, },
  cardIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEEBC8', justifyContent: 'center', alignItems: 'center', marginRight: 16, },
  cardIcon: { fontSize: 24, color: '#DD6B20', }, 
  cardTextContainer: { flex: 1, },
  cardTitle: { fontSize: 14, color: '#4A5568', fontWeight: '500', marginBottom: 4, },
  cardValueDisplay: { fontSize: 20, color: '#1A202C', fontWeight: 'bold', },
  cardValueAnimated: { /* Potentially different style for the animated number itself */ },
  
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, },
  loadingTextCards: { marginTop: 10, fontSize: 16, color: '#4A5568' },
  errorContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: '#FFF0F0', borderRadius: 8, marginHorizontal: 10, padding: 20, marginBottom: 20 },
  errorTextCards: { fontSize: 15, color: '#C53030', textAlign: 'center', marginBottom: 15 },
  retryButton: { backgroundColor: '#E53935', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6,},
  retryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15},

  aiCard: { marginTop: 16, marginBottom: 16, },
  aiCardTitle: { backgroundColor: '#E53935', color: '#fff', fontWeight: 'bold', fontSize: 16, borderTopLeftRadius: 10, borderTopRightRadius: 10, paddingVertical: 10, paddingHorizontal: 16, },
  aiSuggestionBox: { backgroundColor: '#fff', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, },
  aiSuggestionText: { fontSize: 14, color: '#2D3748', lineHeight: 20, marginBottom: 10, },
  aiMeta: { fontSize: 12, color: '#718096', textAlign: 'right', }, // Not used in current JSX but kept style
  fab: { position: 'absolute', right: 24, bottom: 88, width: 56, height: 56, borderRadius: 28, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 6, zIndex: 10, },
  fabIcon: { color: '#fff', fontSize: 28, fontWeight: 'bold', },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E2E8F0', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 8, paddingBottom:  (Dimensions.get('window').height * 0.01) < 5 ? 5 : (Dimensions.get('window').height * 0.01), zIndex: 5, },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 24, marginBottom: 3, color: '#A0AEC0' },
  navIconActive: { color: '#E53935' },
  navLabel: { fontSize: 11, color: '#718096' },
  navLabelActive: { color: '#E53935', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'},
  modalOverlayTouchable: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'},
  modalCard: { width: width * 0.9, backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: height * 0.85, overflow: 'hidden' }, // Added overflow for potential scrollview inside modal
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1A202C' },
  modalClose: { fontSize: 24, color: '#A0AEC0', padding: 5 }, 
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 0 },
  modalIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  modalIcon: { fontSize: 20, color: '#E53935' },
  modalItemLabel: { fontSize: 16, color: '#2D3748', fontWeight: '500' },
  cameraBox: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center', marginBottom: 16, marginTop: 8, backgroundColor: '#F7FAFC' },
  cameraIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  cameraIcon: { fontSize: 28, color: '#E53935' },
  cameraLabel: { fontSize: 15, color: '#2D3748', fontWeight: '500' },
  uploadButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', paddingVertical: 10 },
  uploadIcon: { fontSize: 18, color: '#718096', marginRight: 8 },
  uploadLabel: { fontSize: 15, color: '#2D3748', fontWeight: '500' },
  foodImage: { width: '100%', height: 180, borderRadius: 10, marginBottom: 16, backgroundColor: '#EDF2F7' },
  nutrientTitle: { fontSize: 16, fontWeight: '600', color: '#1A202C', marginBottom: 12, textAlign: 'center' },
  nutrientBox: { backgroundColor: '#F7FAFC', borderRadius: 8, padding: 16 },
  nutrientRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EDF2F7', },
  nutrientLabel: { fontSize: 14, color: '#4A5568' },
  nutrientValueNum: { fontSize: 14, color: '#1A202C', fontWeight: '600' },
  saveButton: { width: '100%', backgroundColor: '#E53935', borderRadius: 8, alignItems: 'center', minHeight: 48, justifyContent: 'center', paddingVertical: 12, },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loadingCard: { width: width * 0.75, padding: 28, alignItems: 'center' },
  loadingText: { marginTop: 18, fontSize: 16, color: '#2D3748', fontWeight: '500' },
  successCard: { width: width * 0.75, padding: 28, alignItems: 'center' },
  successIcon: { fontSize: 52, marginBottom: 18, color: '#48BB78'},
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A202C', marginBottom: 10 },
  successText: { fontSize: 16, color: '#4A5568', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  successButton: { backgroundColor: '#48BB78', paddingVertical: 12, paddingHorizontal: 36, borderRadius: 8 },
  successButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorTextModal: { color: '#E53935', fontSize: 14, textAlign: 'center', marginVertical: 10, paddingHorizontal: 10},
  mascotHome: { width: 70, height: 70, alignSelf: 'center', marginBottom: 12, resizeMode: 'contain' }, // Not used, kept style
  confirmationText: {
    fontSize: 16,
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 8, // Adjusted margin
    lineHeight: 22,
  },
  foodNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 16, // Adjusted margin
    paddingHorizontal: 10, // Allow wrapping
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12, // For spacing between buttons if supported, otherwise use margins
    marginTop: 12, // Added margin top
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 14, // Increased padding
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmButton: {
    backgroundColor: '#48BB78', // Green
  },
  manualButton: {
    backgroundColor: '#F59E0B', // Amber/Orange for "No" or "Manual"
  },
  confirmationButtonText: {
    color: '#fff',
    fontSize: 15, // Slightly adjusted
    fontWeight: 'bold',
    textAlign: 'center',
  },
  foodInput: {
    borderWidth: 1,
    borderColor: '#CBD5E0', // Slightly different color
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A202C',
    marginBottom: 20, // Increased margin
    backgroundColor: '#F7FAFC',
  },
  submitButton: {
    backgroundColor: '#E53935',
    paddingVertical: 14, // Increased padding
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});