import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, FlatList, Modal, Animated, Image, TouchableWithoutFeedback, Pressable, Alert, Dimensions, LogBox
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
// REMOVED: import chatHistoriesData from '../assets/chatHistories.json';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from './i18n/LanguageContext'; // Adjust path if needed
import * as FileSystem from 'expo-file-system';
import { useChat, Message as ContextMessage, ChatSession as ContextChatSession } from './ChatContext'; // IMPORT FROM CONTEXT

const BOTTOM_NAV_HEIGHT = 64;
const { width, height } = Dimensions.get('window');

// LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component.']);

export default function AIChatScreen() {
  const {
    chatHistories,
    activeSessionId,
    currentMessages,
    setActiveSessionId,
    addMessageToActiveSession,
    createNewChatSession: createNewChatSessionContext, // Renamed to avoid conflict if needed
    loadChatSessionFromHistory,
  } = useChat();

  const { name, patientId: patientIdParam } = useLocalSearchParams() as { name?: string, patientId?: string };
  const patientId = patientIdParam;

  const patientCredentials = {
    name: name,
    patientId: patientId,
  };

  // Local state for UI elements specific to this screen
  const [input, setInput] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const flatListRef = useRef<FlatList<any>>(null);
  const router = useRouter();
  const sidebarAnimation = useRef(new Animated.Value(-280)).current;
  const [image, setImage] = useState<string | null>(null);
  const [imagePickerMenuVisible, setImagePickerMenuVisible] = useState(false);
  const { t } = useLanguage();


  // Effect to ensure a session is active if none is when screen loads
  // or if the activeSessionId from context is not found in current chatHistories (e.g., after app restart with context rehydration)
  useEffect(() => {
    if (!activeSessionId && chatHistories.length > 0) {
      console.log("AIChatScreen Effect: No active session, setting to first in history:", chatHistories[0].id);
      setActiveSessionId(chatHistories[0].id);
    } else if (activeSessionId && !chatHistories.find(s => s.id === activeSessionId) && chatHistories.length > 0) {
      console.log("AIChatScreen Effect: Active session not found in history, setting to first:", chatHistories[0].id);
      setActiveSessionId(chatHistories[0].id);
    } else if ((!activeSessionId || !chatHistories.find(s => s.id === activeSessionId)) && chatHistories.length === 0) {
      console.log("AIChatScreen Effect: No active session and no history, creating new chat.");
      createNewChatSessionContext(); // This will also set it active in the context
    }
  }, [activeSessionId, chatHistories, setActiveSessionId, createNewChatSessionContext]);


  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.timing(sidebarAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(sidebarAnimation, {
      toValue: -280,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSidebarVisible(false));
  };

  const loadChatSession = (session: ContextChatSession) => { // Use ContextChatSession type
    loadChatSessionFromHistory(session.id);
    closeSidebar();
  };

  const createNewChat = () => {
    createNewChatSessionContext();
    closeSidebar();
  };

  const pickImageFromLibrary = async () => {
    setImagePickerMenuVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('permissionDeniedTitle') || 'Permission Denied', t('permissionDeniedMediaMessage') || 'Permission to access photo library is required.');
      return;
    }
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("pickImageFromLibrary Error: ", error);
      Alert.alert(t('errorTitle') || 'Error', t('imagePickerErrorMessage') || 'Could not pick image.');
    }
  };

  const takePicture = async () => {
    setImagePickerMenuVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('permissionDeniedTitle') || 'Permission Denied', t('permissionDeniedCameraMessage') || 'Permission to access camera is required.');
      return;
    }
    try {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("takePicture Error: ", error);
      Alert.alert(t('errorTitle') || 'Error', t('cameraErrorMessage') || 'Could not take picture.');
    }
  };

  const sendMessage = async () => {
    console.log("sendMessage: Function called.");

    const userText = input.trim();
    const currentImageUri = image;
    const hasImage = !!currentImageUri;

    const uriToLog = currentImageUri ? (currentImageUri.length > 100 ? currentImageUri.substring(0, 100) + "..." : currentImageUri) : "null";
    console.log(`sendMessage: User text: "${userText}", Has image URI? ${hasImage}, Image URI: ${uriToLog}`);

    if (!userText) {
        Alert.alert(t('promptRequiredTitle'), t('promptRequiredMessage'));
        return;
    }

    // Ensure there's an active session. If not, create one.
    let currentActiveSessionId = activeSessionId;
    if (!currentActiveSessionId) {
      console.log("sendMessage: No active session ID found. Attempting to create a new one.");
      currentActiveSessionId = createNewChatSessionContext(); // This should set it active
      if (!currentActiveSessionId) {
        Alert.alert(t('errorTitle'), "Could not start a new chat session. Please try again.");
        return;
      }
      console.log("sendMessage: New session created with ID:", currentActiveSessionId);
    }


    let imageBase64: string | null = null;
    let actualMimeTypeToSend: string | null = null;

    if (hasImage && currentImageUri) {
        console.log("sendMessage: Image processing block entered. URI starts with:", currentImageUri.substring(0, 30));
        try {
            if (currentImageUri.startsWith('data:')) {
                console.log("sendMessage: Processing as DATA URI.");
                const parts = currentImageUri.split(',');
                if (parts.length < 2) throw new Error("Invalid Data URI format.");
                const metaPart = parts[0];
                imageBase64 = parts[1];
                const mimeMatch = metaPart.match(/^data:(image\/(?:png|jpe?g|webp|gif|heic|heif));base64$/i);
                if (mimeMatch && mimeMatch[1]) {
                    actualMimeTypeToSend = mimeMatch[1].toLowerCase();
                    if (actualMimeTypeToSend === 'image/jpg') actualMimeTypeToSend = 'image/jpeg';
                } else {
                    const simpleMimePart = metaPart.substring(5).split(';')[0].toLowerCase();
                    if (simpleMimePart.startsWith('image/')) {
                        actualMimeTypeToSend = simpleMimePart;
                        if (actualMimeTypeToSend === 'image/jpg') actualMimeTypeToSend = 'image/jpeg';
                    } else {
                        throw new Error(`Could not parse supported MIME type from Data URI: ${metaPart}`);
                    }
                }
                 if (!actualMimeTypeToSend || !['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif'].includes(actualMimeTypeToSend)) {
                    throw new Error(`Unsupported or unparsed MIME type from Data URI: ${actualMimeTypeToSend || 'unknown'}`);
                }
                if (!imageBase64) throw new Error("Base64 data missing in Data URI.");
            } else { // File URI
                console.log("sendMessage: Processing as FILE URI. Path:", currentImageUri);
                let inferredMimeType: string | null = null;
                const uriPath = currentImageUri.split('?')[0].split('#')[0].toLowerCase();
                const extensionMatch = uriPath.match(/\.([a-z0-9]+)$/);
                const extension = extensionMatch ? extensionMatch[1] : null;
                if (extension === 'png') inferredMimeType = 'image/png';
                else if (extension === 'jpg' || extension === 'jpeg') inferredMimeType = 'image/jpeg';
                // ... (add other supported types: webp, gif, heic, heif)
                else if (extension === 'webp') inferredMimeType = 'image/webp';
                else if (extension === 'gif') inferredMimeType = 'image/gif';
                else if (extension === 'heic' || extension === 'heif') inferredMimeType = 'image/heic'; // or image/heif based on server
                if (!inferredMimeType) {
                    Alert.alert(t('imageErrorTitle'), `Unsupported image file type (ext: ${extension}). Please use PNG, JPG, WEBP, GIF, or HEIC.`);
                    return;
                }
                actualMimeTypeToSend = inferredMimeType;
                imageBase64 = await FileSystem.readAsStringAsync(currentImageUri, { encoding: FileSystem.EncodingType.Base64 });
            }
        } catch (e: any) {
            console.error("sendMessage: ERROR during image processing:", e.message, e);
            Alert.alert(t('imageErrorTitle'), `Image processing failed: ${e.message}`);
            return;
        }
    }
    if (hasImage && (!imageBase64 || !actualMimeTypeToSend)) {
        Alert.alert(t('imageErrorTitle'), "Image selected, but failed to prepare for sending. Please try again.");
        return;
    }

    const userMsg: ContextMessage = (hasImage && currentImageUri)
      ? { from: 'user', text: userText, image: currentImageUri }
      : { from: 'user', text: userText };

    addMessageToActiveSession(userMsg);

    setInput('');
    setImage(null);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    const apiPayload: { message: string; image_base64?: string; image_mime_type?: string } = {
      message: userText,
    };
    if (hasImage && imageBase64 && actualMimeTypeToSend) {
      apiPayload.image_base64 = imageBase64;
      apiPayload.image_mime_type = actualMimeTypeToSend;
    }

    try {
      const API_URL = `${process.env.EXPO_PUBLIC_API_BASE}/chat`;
      const response = await fetch(`${API_URL}?patientid=${patientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });
      let aiTextResponse: string;
      if (response.ok) {
        const data = await response.json();
        let rawAiText = data.message;
        aiTextResponse = rawAiText.replace(/^\* /gm, "\u2022 ");
      } else {
        let errorDetail = `API Error (${response.status})`;
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (e) { /* ignore if not json */ }
        aiTextResponse = errorDetail;
      }
      const aiMsg: ContextMessage = { from: 'ai', text: aiTextResponse };
      addMessageToActiveSession(aiMsg);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: any) {
      const errorText = error.message.includes("Failed to connect") || error.message.includes("timeout") || error.name === "TypeError" && error.message.toLowerCase().includes("network request failed") ?
                        t('networkErrorTimeout') :
                        t('networkErrorGeneric');
      const aiErrorMsg: ContextMessage = { from: 'ai', text: errorText };
      addMessageToActiveSession(aiErrorMsg);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={openSidebar} style={styles.menuButton}>
          <Text style={{ fontSize: 24 }}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('stelgginAI')}</Text>
        <TouchableOpacity onPress={createNewChat} style={styles.newChatIcon}>
          <Text style={{ fontSize: 24, color: '#E53935' }}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Sidebar Modal */}
      <Modal visible={sidebarVisible} animationType="none" transparent={true} onRequestClose={closeSidebar}>
        <TouchableWithoutFeedback onPress={closeSidebar}>
          <View style={styles.sidebarOverlay}>
            <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnimation }] }]}>
              <TouchableOpacity onPress={closeSidebar} style={styles.sidebarCloseIcon}>
                <Text style={{ fontSize: 24, color: '#E53935' }}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.sidebarTitle}>{t('chatHistory')}</Text>
              <FlatList
                data={chatHistories} // FROM CONTEXT
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.sidebarItem} onPress={() => loadChatSession(item)}>
                    <Text>{item.title}</Text>
                  </TouchableOpacity>
                )}
              />
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Main Content Area (Chat + Input) */}
      <View style={styles.mainContentWrapper}>
        <View style={{ flex: 1, position: 'relative' }}>
          {imagePickerMenuVisible && (
            <Pressable onPress={() => setImagePickerMenuVisible(false)} style={styles.popoverBackdrop} />
          )}
          <FlatList
            ref={flatListRef}
            data={currentMessages} // FROM CONTEXT
            keyExtractor={(_, idx) => `msg-${idx}-${activeSessionId || 'no-session'}`} // Ensure activeSessionId for key
            renderItem={({ item }) => (
              <View style={[styles.messageRow, item.from === 'user' ? styles.messageRowUser : styles.messageRowAI]}>
                {item.from === 'ai' && (
                  <Image source={require('../assets/images/mascot.png')} style={styles.mascotChatIcon} />
                )}
                <View style={[styles.messageBubble, item.from === 'user' ? styles.userBubble : styles.aiBubble]}>
                  {item.image && (
                    <Image source={{ uri: item.image }} style={styles.chatImage} />
                  )}
                  <Text style={[styles.messageText, item.from === 'user' ? styles.userText : styles.aiText]}>{item.text}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.chatArea}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        </View>

        {/* Input Area */}
          <View style={{ position: 'relative' }}>
            {imagePickerMenuVisible && (
              <View style={styles.imagePickerPopover}>
                <TouchableOpacity style={styles.imagePickerChoiceBtn} onPress={pickImageFromLibrary}>
                  <Text style={{ fontSize: 16 }}>{t('uploadFromPhone')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imagePickerChoiceBtn} onPress={takePicture}>
                  <Text style={{ fontSize: 16 }}>{t('takePicture')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setImagePickerMenuVisible(false)}>
                  <Text style={{ color: '#E53935', fontWeight: 'bold', textAlign: 'center', marginTop: 4 }}>{t('cancel')}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputArea}>
              <TouchableOpacity onPress={() => setImagePickerMenuVisible(true)} style={styles.imagePickerBtn}>
                <Text style={{ fontSize: 24 }}>🖼️</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder={t('typeMessage')}
                placeholderTextColor="#aaa"
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                multiline={true}
                textAlignVertical="top"
              />
              <TouchableOpacity onPress={sendMessage} style={styles.sendBtn} disabled={!activeSessionId && !input.trim() && !image}>
                <Text style={{ fontSize: 24 }}>➤</Text>
              </TouchableOpacity>
            </View>
            {image && (
              <View style={styles.previewImageContainer}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <TouchableOpacity onPress={() => setImage(null)} style={styles.removeImageBtn}>
                  <Text style={{ color: '#E53935' }}>{t('remove')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
      </View>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/HomeScreen',params: patientCredentials})}><Text style={[styles.navIcon]}>🏠</Text><Text style={[styles.navLabel]}>{t('home')}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/AIChatScreen',params: patientCredentials})}><Text style={styles.navIcon}>💬</Text><Text style={[styles.navLabel, styles.navLabelActive]}>{t('stelgginAI')}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/ProgressScreen',params: patientCredentials})}><Text style={styles.navIcon}>📊</Text><Text style={styles.navLabel}>{t('progress')}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/SettingsScreen',params: patientCredentials})}><Text style={styles.navIcon}>⚙️</Text><Text style={styles.navLabel}>{t('settings')}</Text></TouchableOpacity>
      </View>
    </View>
  );
}

// Styles (make sure these match your existing styles)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  menuButton: { padding: 8 },
  newChatIcon: { padding: 8 },
  sidebarOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sidebar: {
    width: 280, backgroundColor: '#fff', height: '100%',
    paddingTop: Platform.OS === 'android' ? 20 : 40, paddingHorizontal: 16,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10,
  },
  sidebarTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  sidebarItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sidebarCloseIcon: {
    position: 'absolute', top: Platform.OS === 'android' ? 15 : 35, right: 10, zIndex: 10, padding: 8,
  },
  mainContentWrapper: {
    flex: 1,
    paddingBottom: BOTTOM_NAV_HEIGHT,
  },
  chatArea: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 160, // Adjust if needed based on input area + preview
  },
  messageRow: { flexDirection: 'row', marginBottom: 10 },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAI: { justifyContent: 'flex-start' },
  mascotChatIcon: {
    width: 30, height: 30, marginRight: 8, resizeMode: 'contain',
    alignSelf: 'flex-end', backgroundColor: '#FDEAEA', borderRadius: 16, padding: 4,
  },
  messageBubble: { maxWidth: '75%', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16 },
  userBubble: { backgroundColor: '#E53935' },
  aiBubble: { backgroundColor: '#f2f2f2' },
  messageText: { fontSize: 15 },
  userText: { color: '#fff' },
  aiText: { color: '#222' },
  chatImage: { width: 120, height: 120, borderRadius: 10, marginBottom: 6 },
  inputArea: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee',
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22,
    backgroundColor: '#f2f2f2', paddingHorizontal: 18, paddingVertical: 10,
    fontSize: 15, color: '#222',
  },
  sendBtn: { marginLeft: 8, padding: 8 },
  imagePickerBtn: { marginRight: 8, padding: 8 },
  previewImageContainer: {
    flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  previewImage: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
  removeImageBtn: { padding: 6 },
  popoverBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'transparent', zIndex: 99,
  },
  imagePickerPopover: {
    position: 'absolute', left: 16, bottom: '100%', marginBottom: 8,
    width: 180, backgroundColor: '#fff', borderRadius: 10, padding: 8,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 }, zIndex: 100,
  },
  imagePickerChoiceBtn: {
    width: '100%', backgroundColor: '#f2f2f2', borderRadius: 8, paddingVertical: 12,
    alignItems: 'center', marginBottom: 10,
  },
  bottomNav: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 70,
    flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1,
    borderTopColor: '#E2E8F0', justifyContent: 'space-around',
    alignItems: 'flex-start', paddingTop: 8,
    paddingBottom: (Dimensions.get('window').height * 0.01) < 5 ? 5 : (Dimensions.get('window').height * 0.01),
    zIndex: 5,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 24, marginBottom: 3, color: '#A0AEC0' },
  navLabel: { fontSize: 11, color: '#718096' },
  navLabelActive: { color: '#E53935', fontWeight: '600' },
});