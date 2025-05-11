import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Modal, Image, ActivityIndicator,
  Animated, Platform,
  Alert, ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
// import * as FileSystem from 'expo-file-system'; // Usually not needed for FormData with URIs

import { useLanguage } from './i18n/LanguageContext'; // Adjust path if needed

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


type AnimatedNumberProps = {
  toValue: number;
  duration?: number;
  style?: any;
  prefix?: string;
  suffix?: string;
  decimals?: number; // Added for float values
};

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ toValue, duration = 1500, style, prefix = "", suffix = "", decimals = 0 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayText, setDisplayText] = useState(toValue.toFixed(decimals)); // Initialize with formatted toValue

  useEffect(() => {
    // setDisplayText(Number(0).toFixed(decimals)); // Start display from 0
    animatedValue.setValue(0); // Reset animation
    Animated.timing(animatedValue, {
      toValue: toValue,
      duration: duration,
      useNativeDriver: false, // false because we're updating a text component directly
    }).start();

    const listenerId = animatedValue.addListener(({ value }) => {
      setDisplayText(value.toFixed(decimals));
    });

    return () => {
      animatedValue.removeAllListeners(); // Use removeAllListeners or specific listenerId
    };
  }, [toValue, duration, animatedValue, decimals]);

  return <Text style={style}>{prefix}{displayText}{suffix}</Text>;
};


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

  // Function to fetch today's diet log
  const fetchTodayDietLog = useCallback(async () => {
    if (!patientId) {
      // This case should ideally be handled by the useEffect logic too
      // but good to have a guard here.
      setDietLogError(t('patientIdMissingError') || 'Patient ID is missing.');
      setIsLoadingDietLog(false);
      // Reset values if no patientId
      setSugCal(0); setSugFat(0); setSugSodium(0); setSugSug(0);

      setTodayCalories(0); setTodayFat(0); setTodaySodium(0); setTodaySugar(0);
      return;
    }

    console.log(`Fetching diet log for patient ID: ${patientId}`);
    setIsLoadingDietLog(true);
    setDietLogError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/get_today_diet_log?patientid=${patientId}`);
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
            const errData = await response.json();
            errorMsg = errData.detail || JSON.stringify(errData) || errorMsg;
        } catch (e) { /* Ignore if response isn't JSON */ }
        throw new Error(errorMsg);
      }
      const data: TodayDietLogResponse = await response.json();
      console.log("Fetched today's diet log:", data);


      const response2 = await fetch(`${API_BASE_URL}/get_diet_plan?patientid=${patientId}`);
      if (!response2.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
            const errData = await response2.json();
            errorMsg = errData.detail || JSON.stringify(errData) || errorMsg;
        } catch (e) { /* Ignore if response isn't JSON */ }
        throw new Error(errorMsg);
      }
      const data2:SuggestedDiet = await response2.json();
      console.log("Sugd today's diet log:", data2);
      



      setTodayCalories(data.total_calorie);
      setTodayFat(data.total_fat);
      // Assuming the FastAPI endpoint returns sodium in mg as per the card's display unit
      setTodaySodium(data.total_sodium); 
      setTodaySugar(data.total_sugar);

      setSugCal(data2.Target_Daily_Calories)
      setSugSug(data2.Max_Sugar)
      setSugFat(data2.Max_Fat)
      setSugSodium(data2.Max_Sodium)
      setSugDoc(String(data2.Notes))


    } catch (error: any) {
      console.error("Failed to fetch today's diet log:", error);
      setDietLogError(error.message || t('networkErrorGeneric') || 'Failed to load diet data.');
      // Optionally set to 0 on error or keep previous values
      // setTodayCalories(0); setTodayFat(0); setTodaySodium(0); setTodaySugar(0);
      Alert.alert(t('errorTitle') || 'Error', t('fetchDietLogError') || 'Could not fetch daily diet summary.');
    } finally {
      setIsLoadingDietLog(false);
    }
  }, [patientId, t, API_BASE_URL]); // Added dependencies

  useEffect(() => {
    if (!isLanguageLoaded) return; // Wait for translations

    if (!patientId) {
        Alert.alert(t('errorTitle') || 'Error', t('patientIdMissingError') || 'Patient ID is missing. Cannot load data.');
        setIsLoadingDietLog(false); // Stop loading if no patient ID
        // Reset values if patientId is missing
        setTodayCalories(0);
        setTodayFat(0);
        setTodaySodium(0);
        setTodaySugar(0);
        return;
    }
    fetchTodayDietLog();
  }, [patientId, isLanguageLoaded, t, fetchTodayDietLog]); // fetchTodayDietLog is now a dependency

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  // pickImage and takePicture functions remain unchanged from your provided code
  // ... (Your existing pickImage and takePicture functions) ...
  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    // --- takePicture function (can be similarly modified if needed) ---
const takePicture = async () => {
    console.log("HomeScreen takePicture: Called for /upload-image flow.");
    if (!patientId) { Alert.alert(t('errorTitle') || 'Error', t('patientIdMissingError') || 'Patient ID is missing.'); return; }
    setNutrientData(null); setApiError(null);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert(t('permissionDeniedTitle') || 'Permission Denied', t('permissionDeniedCameraMessage') || 'Camera permission is required.'); return; }

    let imageUriFromPicker: string | null = null;
    let fileToUpload: File | { uri: string; name: string; type: string } | null = null;
    let actualMimeType: string | null = null;
    let displayUri: string | null = null;


    try {
        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true, quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) { console.log("takePicture: Camera cancelled."); return; }

        imageUriFromPicker = result.assets[0].uri;
        displayUri = imageUriFromPicker;
        setSelectedImage(displayUri); // Show image immediately
        console.log("takePicture: Image captured:", imageUriFromPicker.substring(0,100)+"...");

        if (Platform.OS === 'web' && imageUriFromPicker.startsWith('data:')) {
            // setIsProcessingImage(true); // This will be set before fetch
            const parts = imageUriFromPicker.split(',');
            if (parts.length < 2) throw new Error("Invalid Data URI format.");
            const metaPart = parts[0]; const base64Data = parts[1]; let tempFileExtension = 'tmp';
            const mimeMatch = metaPart.match(/^data:(image\/(?:png|jpe?g|webp|gif|heic|heif));base64$/i);
            if (mimeMatch && mimeMatch[1]) { 
                actualMimeType = mimeMatch[1].toLowerCase(); if (actualMimeType === 'image/jpg') actualMimeType = 'image/jpeg'; tempFileExtension = actualMimeType.split('/')[1] || 'tmp';
            } else { 
                const simpleMimePart = metaPart.substring(5).split(';')[0].toLowerCase();
                if (simpleMimePart.startsWith('image/')) { actualMimeType = simpleMimePart; if (actualMimeType === 'image/jpg') actualMimeType = 'image/jpeg'; tempFileExtension = actualMimeType.split('/')[1] || 'tmp';}
                else { actualMimeType = 'image/jpeg'; tempFileExtension = 'jpg'; }
            }
            if (!actualMimeType || !['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif'].includes(actualMimeType)) throw new Error(`Unsupported MIME: ${actualMimeType || 'unknown'}`);
            const byteCharacters = atob(base64Data); const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
            const byteArray = new Uint8Array(byteNumbers); const blob = new Blob([byteArray], { type: actualMimeType });
            const filename = `web_camera_${Date.now()}.${tempFileExtension}`;
            fileToUpload = new File([blob], filename, { type: actualMimeType });
            // displayUri = URL.createObjectURL(blob); // No need to update displayUri here if setSelectedImage(imageUriFromPicker) is already done
        } else { // Native or File URI on Web (e.g. from camera on mobile web if it doesn't return data URI)
            const uriPath = imageUriFromPicker.split('?')[0].split('#')[0].toLowerCase();
            const extensionMatch = uriPath.match(/\.([a-z0-9]+)$/);
            // Prioritize extension from URI if available, otherwise check MIME type from picker if provided (result.assets[0].mimeType)
            let extension = extensionMatch ? extensionMatch[1] : (result.assets[0].mimeType ? result.assets[0].mimeType.split('/')[1] : 'jpg');
            
            if (result.assets[0].mimeType) {
                actualMimeType = result.assets[0].mimeType.toLowerCase();
                if (actualMimeType === 'image/jpg') actualMimeType = 'image/jpeg';
            } else { // Fallback based on extension
                 if (extension === 'png') actualMimeType = 'image/png';
                 else if (extension === 'jpg' || extension === 'jpeg') actualMimeType = 'image/jpeg';
                 else if (extension === 'webp') actualMimeType = 'image/webp';
                 else if (extension === 'gif') actualMimeType = 'image/gif';
                 else if (extension === 'heic' || extension === 'heif') actualMimeType = 'image/heic'; // Or image/jpeg if conversion happens
                 else { 
                    console.warn(`takePicture: Unknown extension '${extension}', defaulting to image/jpeg`);
                    actualMimeType = 'image/jpeg'; extension = 'jpg';
                 }
            }
            if (!actualMimeType) throw new Error("Could not determine image MIME type for camera.");
            
            const filename = imageUriFromPicker.split('/').pop() || `camera_image_${Date.now()}.${extension}`;
            fileToUpload = { uri: imageUriFromPicker, name: filename, type: actualMimeType };
        }
    } catch (error: any) { 
        console.error("takePicture: Error during image capture/preparation:", error); 
        Alert.alert(t('errorTitle') || 'Error', t('cameraErrorMessage') || 'Could not capture or prepare image.'); 
        // setIsProcessingImage(false); // This state is for the fetch, not for picking
        setSelectedImage(null); 
        return; 
    }

    if (!fileToUpload) { Alert.alert(t('errorTitle') || 'Error', "Failed to prepare image from camera."); return; }

    setIsProcessingImage(true); // Set loading for API call
    const formData = new FormData();
    formData.append('file', fileToUpload as any);
    formData.append('patientid', patientId.toString());
    console.log(`takePicture: Uploading. File type: ${typeof fileToUpload === 'object' && 'uri' in fileToUpload ? 'RN File Obj' : 'Web File Obj'}, MIME: ${actualMimeType}`);
    try {
        const response = await fetch(`${API_BASE_URL}/upload-image`, { method: 'POST', body: formData });
        const responseText = await response.text(); let responseData: any;
        try { responseData = JSON.parse(responseText); } catch (e) { console.error("takePicture: Failed to parse JSON:", responseText.substring(0,500)); if (!response.ok) throw new Error(responseText || `Server error: ${response.status}`); throw new Error("Received non-JSON success response."); }
        console.log(`takePicture: API Response Status: ${response.status}. Data:`, responseData);
        if (response.ok) {
            setNutrientData(responseData as FoodAnalysisResult); setLogMakananVisible(false); setFoodResultVisible(true);
        } else { const errorMessage = responseData?.detail || responseData?.message || JSON.stringify(responseData) || `Request failed: ${response.status}`; setApiError(errorMessage); Alert.alert(t('errorTitle') || 'Error', errorMessage); }
    } catch (err: any) { console.error("takePicture: Network/fetch error:", err); const netErrorMsg = err.message || t('networkErrorGeneric') || 'A network error occurred.'; setApiError(netErrorMsg); Alert.alert(t('errorTitle') || 'Error', netErrorMsg);
    } finally {
        setIsProcessingImage(false);
        // Revoke object URL if one was created for display (less common for camera unless converting from data URI)
        if (Platform.OS === 'web' && displayUri && displayUri.startsWith('blob:') && displayUri !== imageUriFromPicker) { 
            URL.revokeObjectURL(displayUri); console.log("takePicture (Web): Revoked temporary blob URL."); 
        }
    }
};

const pickImage = async () => {
  console.log("HomeScreen pickImage: Called for /upload-image flow.");

  if (!patientId) {
      Alert.alert(t('errorTitle') || 'Error', t('patientIdMissingError') || 'Patient ID is missing.');
      return;
  }

  setNutrientData(null);
  setApiError(null);

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
      Alert.alert(t('permissionDeniedTitle') || 'Permission Denied', t('permissionDeniedMediaMessage') || 'Permission to access photo library is required.');
      return;
  }

  let imageUriFromPicker: string | null = null;
  let fileToUpload: File | { uri: string; name: string; type: string } | null = null;
  let actualMimeType: string | null = null;
  let displayUriForSelectedImage: string | null = null; 

  try {
      let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
          console.log("pickImage: Image selection canceled or no assets.");
          return;
      }

      imageUriFromPicker = result.assets[0].uri;
      displayUriForSelectedImage = imageUriFromPicker; 
      setSelectedImage(displayUriForSelectedImage); // Update UI with the URI that can be displayed

      console.log("pickImage: Image selected by picker:", imageUriFromPicker.substring(0, 100) + "...");
      
      // Determine MIME type and filename
      const asset = result.assets[0];
      actualMimeType = asset.mimeType || null;
      let filename = asset.fileName || imageUriFromPicker.split('/').pop() || `gallery_image_${Date.now()}`;
      let extension = filename.split('.').pop()?.toLowerCase();


      if (Platform.OS === 'web' && imageUriFromPicker.startsWith('data:')) {
          console.log("pickImage (Web): Data URI detected. Converting to File object.");
          const parts = imageUriFromPicker.split(',');
          if (parts.length < 2) throw new Error("Invalid Data URI format for conversion.");
          
          const metaPart = parts[0]; const base64Data = parts[1];
          let tempFileExtensionFromDataUri = 'tmp';

          const mimeMatch = metaPart.match(/^data:(image\/(?:png|jpe?g|webp|gif|heic|heif));base64$/i);
          if (mimeMatch && mimeMatch[1]) {
              actualMimeType = mimeMatch[1].toLowerCase();
              if (actualMimeType === 'image/jpg') actualMimeType = 'image/jpeg';
              tempFileExtensionFromDataUri = actualMimeType.split('/')[1] || 'tmp';
          } else {
              const simpleMimePart = metaPart.substring(5).split(';')[0].toLowerCase();
              if (simpleMimePart.startsWith('image/')) {
                  actualMimeType = simpleMimePart;
                  if (actualMimeType === 'image/jpg') actualMimeType = 'image/jpeg';
                  tempFileExtensionFromDataUri = actualMimeType.split('/')[1] || 'tmp';
              } else {
                  console.warn("pickImage (Web): Could not accurately parse MIME type from Data URI, using image/jpeg as default.");
                  actualMimeType = 'image/jpeg'; tempFileExtensionFromDataUri = 'jpg';
              }
          }
          if (!actualMimeType || !['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif'].includes(actualMimeType)) {
              throw new Error(`Unsupported or unparsed MIME type from Data URI: ${actualMimeType || 'unknown'}`);
          }

          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: actualMimeType });

          filename = `web_upload_${Date.now()}.${tempFileExtensionFromDataUri}`;
          fileToUpload = new File([blob], filename, { type: actualMimeType });
          displayUriForSelectedImage = URL.createObjectURL(blob); // Create a blob URL for local display
          console.log("pickImage (Web): Converted Data URI to File object:", filename, actualMimeType);
          
      } else { // Native or File URI on Web
          if (!actualMimeType) { // Fallback if mimeType from asset is missing
              const uriPath = imageUriFromPicker.split('?')[0].split('#')[0].toLowerCase();
              const extensionMatch = uriPath.match(/\.([a-z0-9]+)$/);
              extension = extensionMatch ? extensionMatch[1] : extension; // Keep existing extension if available

              if (extension === 'png') actualMimeType = 'image/png';
              else if (extension === 'jpg' || extension === 'jpeg') actualMimeType = 'image/jpeg';
              else if (extension === 'webp') actualMimeType = 'image/webp';
              else if (extension === 'gif') actualMimeType = 'image/gif';
              else if (extension === 'heic' || extension === 'heif') actualMimeType = 'image/heic'; // Or image/jpeg if converted
              else {
                  console.warn(`pickImage: Unknown extension '${extension}', attempting to use image/jpeg.`);
                  actualMimeType = 'image/jpeg';
                  if (filename && !filename.includes('.')) filename = `${filename}.jpg`;
              }
          }
          if (!actualMimeType) {
            Alert.alert(t('imageErrorTitle') || 'Image Error', t('imageMimeError') || 'Could not determine image type.');
            return;
          }
          if (actualMimeType === 'image/jpg') actualMimeType = 'image/jpeg'; // Normalize
          fileToUpload = { uri: imageUriFromPicker, name: filename, type: actualMimeType };
      }
      setSelectedImage(displayUriForSelectedImage); // Update UI with the URI that can be displayed

  } catch (error: any) {
      console.error("pickImage: Error during image picking/conversion:", error);
      Alert.alert(t('errorTitle') || 'Error', t('imagePickerErrorMessage') || 'Could not pick or prepare image.');
      setSelectedImage(null);
      return;
  }

  if (!fileToUpload) {
      Alert.alert(t('errorTitle') || 'Error', "Failed to prepare image for upload.");
      return;
  }

  setIsProcessingImage(true);

  const formData = new FormData();
  formData.append('file', fileToUpload as any);
  formData.append('patientid', patientId.toString());

  console.log(`pickImage: Uploading to ${API_BASE_URL}/upload-image. File type being sent: ${typeof fileToUpload === 'object' && 'uri' in fileToUpload ? 'RN File Object' : 'Web File Obj'}, MIME: ${actualMimeType}`);

  try {
      const response = await fetch(`${API_BASE_URL}/upload-image`, {
          method: 'POST',
          body: formData,
      });

      const responseText = await response.text();
      let responseData: any;
      try {
          responseData = JSON.parse(responseText);
      } catch (e) {
          console.error("pickImage: Failed to parse JSON response:", responseText.substring(0, 500));
          if (!response.ok) throw new Error(responseText || `Server error: ${response.status}`);
          throw new Error("Received non-JSON success response from server.");
      }
      console.log(`pickImage: API Response Status: ${response.status}. Data:`, responseData);

      if (response.ok) {
          setNutrientData(responseData as FoodAnalysisResult);
          setLogMakananVisible(false);
          setFoodResultVisible(true);
      } else {
          const errorMessage = responseData?.detail || responseData?.message || JSON.stringify(responseData) || `Request failed: ${response.status}`;
          setApiError(errorMessage);
          Alert.alert(t('errorTitle') || 'Error', errorMessage);
      }
  } catch (err: any) {
      console.error("pickImage: Network or fetch error:", err);
      const netErrorMsg = err.message || t('networkErrorGeneric') || 'A network error occurred.';
      setApiError(netErrorMsg);
      Alert.alert(t('errorTitle') || 'Error', netErrorMsg);
  } finally {
      setIsProcessingImage(false);
      if (Platform.OS === 'web' && displayUriForSelectedImage && displayUriForSelectedImage.startsWith('blob:') && displayUriForSelectedImage !== imageUriFromPicker) {
          URL.revokeObjectURL(displayUriForSelectedImage);
          console.log("pickImage (Web): Revoked blob URL:", displayUriForSelectedImage);
      }
  }
};


  const handleSaveFoodLog = async () => {
    setIsSavingFoodLog(true);

    // --- Backend Save Logic (Placeholder) ---
    // Here, you would typically make another API call to your FastAPI backend
    // to save the `nutrientData` to the database.
    // For example:
    /*
    if (nutrientData && patientId) {
      try {
        const logEntryPayload = {
          PatientID: parseInt(patientId), // Ensure patientId is number if backend expects int
          datetime: new Date().toISOString(), // Or use server's timestamp
          calorie_intake: nutrientData["calories(kcal)"],
          fat_intake: nutrientData["fat(g)"],
          // Ensure your FastAPI endpoint expects sodium in grams if nutrientData provides it in grams
          // Or convert it here if necessary.
          // The /get_today_diet_log endpoint returns total_sodium, presumably in mg.
          // Let's assume the food log entry expects grams for consistency with other intakes.
          sodium_intake: nutrientData["sodium(g)"], 
          sugar_intake: nutrientData["sugar(g)"],
          FoodItem: nutrientData.Food,
          // image_url: nutrientData.image_link, // If you save image URL
        };
        
        // const response = await fetch(`${API_BASE_URL}/log-new-diet-entry`, { // Example endpoint
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(logEntryPayload),
        // });

        // if (!response.ok) {
        //   const errData = await response.json().catch(() => ({ detail: 'Failed to save log to server.'}));
        //   throw new Error(errData.detail || 'Failed to save log to server.');
        // }
        // console.log("Food log saved to backend.");

        // Simulate backend save with a delay
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        console.log("Simulated food log save complete.");


      } catch (error: any) {
        console.error("Error saving food log:", error);
        Alert.alert(t('errorTitle') || 'Error', t('saveFoodLogError') || 'Could not save food log data.');
        setIsSavingFoodLog(false);
        return; // Stop if save fails
      }
    } else {
      Alert.alert(t('errorTitle') || 'Error', t('noDataToSaveError') || 'No nutrient data to save.');
      setIsSavingFoodLog(false);
      return;
    }
    */
    // End of Backend Save Logic (Placeholder)
    
    // For now, just simulate success
    await new Promise(resolve => setTimeout(resolve, 1500));


    setIsSavingFoodLog(false);
    setFoodResultVisible(false);
    setShowSuccess(true);
    setSelectedImage(null); // Clear image after saving
    setNutrientData(null); // Clear nutrient data

    // Refresh today's diet log from the server
    if (patientId) {
        fetchTodayDietLog();
    }
  };

  const closeFoodResultModal = () => {
    setFoodResultVisible(false);
    setSelectedImage(null);
    setNutrientData(null);
    setApiError(null); // Clear API error when closing modal
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
                    <TouchableOpacity onPress={fetchTodayDietLog} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>{t('retry') || "Retry"}</Text>
                    </TouchableOpacity>
                </View>
            )}

{!isLoadingDietLog && !dietLogError && (
              <>
                <View style={styles.card}>
                  <View style={styles.cardIconCircle}><Text style={styles.cardIcon}>🧂</Text></View>
                  <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle}>{t('todaySodium')}</Text>
                      <Text style={styles.cardValueDisplay}>
                          {/* Assuming todaySodium and sugSodium (from data2.max_sodium) are in mg */}
                          <AnimatedNumber toValue={todaySodium} decimals={0} style={styles.cardValueAnimated} /> / {sugSodium} g
                      </Text>
                  </View>
                </View>
                
                <View style={styles.card}>
                  <View style={styles.cardIconCircle}><Text style={styles.cardIcon}>🥓</Text></View>
                  <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle}>{t('todayFat')}</Text>
                      <Text style={styles.cardValueDisplay}>
                          <AnimatedNumber toValue={todayFat} decimals={1} style={styles.cardValueAnimated} /> / { sugFat} g
                      </Text>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardIconCircle}><Text style={styles.cardIcon}>🔥</Text></View>
                  <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle}>{t('todayCalories')}</Text>
                      <Text style={styles.cardValueDisplay}>
                          <AnimatedNumber toValue={todayCalories} decimals={0} style={styles.cardValueAnimated} /> / { sugCal } kcal
                      </Text>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardIconCircle}><Text style={styles.cardIcon}>🍬</Text></View>
                  <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle}>{t('todaySugar')}</Text>
                      <Text style={styles.cardValueDisplay}>
                          <AnimatedNumber toValue={todaySugar} decimals={1} style={styles.cardValueAnimated} /> / { sugsug } g
                      </Text>
                  </View>
                </View>
              </>
            )}


            <View style={styles.aiCard}>
          <Text style={styles.aiCardTitle}>{t('latestAISuggestion')}</Text>
          <View style={styles.aiSuggestionBox}>
            <Text style={styles.aiSuggestionText}>
              {sugDoc}
            </Text>
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

      {/* --- MODALS --- */}
      {/* Modal for choosing log type */}
      

      {/* Modal for logging food (camera/upload options) */}
      <Modal visible={logMakananVisible} transparent animationType="fade" onRequestClose={() => setLogMakananVisible(false)}>
        <TouchableOpacity style={styles.modalOverlayTouchable} activeOpacity={1} onPressOut={() => setLogMakananVisible(false)}>
            <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{t('logFood')}</Text>
                    <TouchableOpacity onPress={() => setLogMakananVisible(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
                </View>
                <View style={styles.cameraBox}>
                    <TouchableOpacity style={{alignItems:'center'}} onPress={takePicture} disabled={isProcessingImage}>
                        <View style={styles.cameraIconCircle}><Text style={styles.cameraIcon}>📷</Text></View>
                        <Text style={styles.cameraLabel}>{t('takePicture')}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage} disabled={isProcessingImage}>
                    <Text style={styles.uploadIcon}>⤴️</Text><Text style={styles.uploadLabel}>{t('uploadImage')}</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal for displaying food analysis result */}
      <Modal visible={foodResultVisible} transparent animationType="fade" onRequestClose={closeFoodResultModal}>
        <TouchableOpacity style={styles.modalOverlayTouchable} activeOpacity={1} onPressOut={closeFoodResultModal}>
            <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{nutrientData?.Food || t('logFood')}</Text>
                    <TouchableOpacity onPress={closeFoodResultModal}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
                </View>
                {selectedImage && (
                    <Image 
                        source={{ uri: selectedImage }}
                        style={styles.foodImage} 
                        resizeMode="cover"
                    />
                )}
                <Text style={styles.nutrientTitle}>{t('detectedNutrients')}</Text>
                {/* This specific loading indicator is for image processing, not nutrient display */}
                {/* {isProcessingImage && !nutrientData && <ActivityIndicator color="#E53935" style={{marginVertical: 20}}/>} */}
                
                {nutrientData && (
                    <View style={styles.nutrientBox}>
                        {/* Assuming nutrientData.sodium(g) is in grams, needs conversion to mg if display is mg */}
                        <View style={styles.nutrientRow}><Text style={styles.nutrientLabel}>{t('sodium')} :</Text><Text style={styles.nutrientValueNum}>{nutrientData['sodium(g)'] !== undefined ? `${(nutrientData['sodium(g)'] * 1000).toFixed(0)} g` : 'N/A'}</Text></View>
                        <View style={styles.nutrientRow}><Text style={styles.nutrientLabel}>{t('fat')} :</Text><Text style={styles.nutrientValueNum}>{nutrientData['fat(g)'] !== undefined ? `${nutrientData['fat(g)']} g` : 'N/A'}</Text></View>
                        <View style={styles.nutrientRow}><Text style={styles.nutrientLabel}>{t('calories')} :</Text><Text style={styles.nutrientValueNum}>{nutrientData['calories(kcal)'] !== undefined ? `${nutrientData['calories(kcal)']} kcal` : 'N/A'}</Text></View>
                        <View style={styles.nutrientRow}><Text style={styles.nutrientLabel}>{t('sugar')} :</Text><Text style={styles.nutrientValueNum}>{nutrientData['sugar(g)'] !== undefined ? `${nutrientData['sugar(g)']} g` : 'N/A'}</Text></View>
                    </View>
                )}
                {apiError && <Text style={styles.errorTextModal}>{apiError}</Text>}
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveFoodLog} disabled={isSavingFoodLog || isProcessingImage || !nutrientData}>
                    {isSavingFoodLog ? <ActivityIndicator color="#E53935" /> : <Text style={styles.saveButtonText}>{t('save')}</Text>}
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal for image processing loader */}
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
  // ... (Your existing styles)
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  scrollContent: { paddingBottom: 80 }, // Ensure content doesn't hide behind nav
  content: { width: '100%', paddingHorizontal: width * 0.05, paddingTop: 30 },
  greeting: { fontSize: 24, fontWeight: '600', color: '#1A202C', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#4A5568', marginBottom: 24, },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, },
  cardIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEEBC8', justifyContent: 'center', alignItems: 'center', marginRight: 16, },
  cardIcon: { fontSize: 24, color: '#DD6B20', }, // Example, specific icons might need different colors
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
  aiMeta: { fontSize: 12, color: '#718096', textAlign: 'right', },
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
  modalCard: { width: width * 0.9, backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: height * 0.85 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1A202C' },
  modalClose: { fontSize: 24, color: '#A0AEC0', padding: 5 }, // Make close button easier to tap
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
  nutrientRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#EDF2F7', },
  nutrientLabel: { fontSize: 14, color: '#4A5568' },
  nutrientValueNum: { fontSize: 14, color: '#1A202C', fontWeight: '600' },
  saveButton: { width: '100%', backgroundColor: '#E53935', borderRadius: 8, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loadingCard: { width: width * 0.75, padding: 28, alignItems: 'center' },
  loadingText: { marginTop: 18, fontSize: 16, color: '#2D3748', fontWeight: '500' },
  successCard: { width: width * 0.75, padding: 28, alignItems: 'center' },
  successIcon: { fontSize: 52, marginBottom: 18, color: '#48BB78'},
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A202C', marginBottom: 10 },
  successText: { fontSize: 16, color: '#4A5568', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  successButton: { backgroundColor: '#48BB78', paddingVertical: 12, paddingHorizontal: 36, borderRadius: 8 },
  successButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorTextModal: { color: '#E53935', fontSize: 14, textAlign: 'center', marginBottom: 10, paddingHorizontal: 10},
  mascotHome: { width: 70, height: 70, alignSelf: 'center', marginBottom: 12, resizeMode: 'contain' },
});