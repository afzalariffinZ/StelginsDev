import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, FlatList, Modal, Animated, Image, TouchableWithoutFeedback, Pressable, Alert, Dimensions, LogBox
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import chatHistoriesData from '../assets/chatHistories.json';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from './i18n/LanguageContext';
import * as FileSystem from 'expo-file-system'; // <-- ADDED IMPORT

const BOTTOM_NAV_HEIGHT = 64; // Define this for clarity and reuse
const { width, height } = Dimensions.get('window');

// To suppress THIS SPECIFIC error globally (use with extreme caution for this error type)
//LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component.']);

export default function AIChatScreen() {
  // ... (your existing state and functions up to createNewChat) ...
  const [chatHistories, setChatHistories] = useState(chatHistoriesData);
  const initialMessages = chatHistoriesData.length > 0 ? chatHistoriesData[0].messages : [{ from: 'ai', text: 'Welcome!' }];
  const initialSessionId = chatHistoriesData.length > 0 ? chatHistoriesData[0].id : 'default_session';

  const { name, patientId: patientIdParam } = useLocalSearchParams() as { name?: string, patientId?: string };
  const patientId = patientIdParam;

  const patientCredentials = {
    name: name,    
    patientId: patientId, 
    
  };

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const flatListRef = useRef<FlatList<any>>(null);
  const router = useRouter();
  const sidebarAnimation = useRef(new Animated.Value(-280)).current;
  const [activeSessionId, setActiveSessionId] = useState(initialSessionId);
  const [image, setImage] = useState<string | null>(null); // This stores the image URI
  const [imagePickerMenuVisible, setImagePickerMenuVisible] = useState(false);
  const { t } = useLanguage();

  
  useEffect(() => {
    const session = chatHistories.find(s => s.id === activeSessionId);
    if (session) {
      setMessages(session.messages);
    } else if (chatHistories.length > 0) {
      setActiveSessionId(chatHistories[0].id);
      setMessages(chatHistories[0].messages);
    }
  }, [activeSessionId, chatHistories]);

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

  const loadChatSession = (session: { id: string; title: string; messages: Array<{ from: string; text: string, image?: string }> }) => {
    setActiveSessionId(session.id);
    setMessages(session.messages); // Ensure messages are updated immediately
    closeSidebar();
  };

  const createNewChat = () => {
    const newSessionId = Date.now().toString();
    const newSession = {
      id: newSessionId,
      title: t('newChat') || "New Chat",
      messages: [{ from: 'ai', text: t('aiGreeting') || "Hello! How can I help you?" }],
    };
    setChatHistories(prev => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setMessages(newSession.messages); // Set messages for the new chat
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
        quality: 0.7, // <-- CHANGED: Reduced quality to potentially avoid issues with very large files
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        console.log("Image picked from library URI:", result.assets[0].uri); // Added log
        // You could also log result.assets[0].mimeType here if you want to use it later
        // console.log("Image MIME type from picker:", result.assets[0].mimeType);
      }
    } catch (error) {
      console.error("pickImageFromLibrary Error: ", error);
      Alert.alert(t('errorTitle') || 'Error', t('imagePickerErrorMessage') || 'Could not pick image.');
    }
  };

  const takePicture = async () => {
    console.log("sendMessage: Function called.");
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
        console.log("Image taken with camera URI:", result.assets[0].uri); // Added log
      }
    } catch (error) {
      console.error("takePicture Error: ", error);
      Alert.alert(t('errorTitle') || 'Error', t('cameraErrorMessage') || 'Could not take picture.');
    }
  };

  // ---- START OF MODIFIED sendMessage FUNCTION ----
  const sendMessage = async () => {
    console.log("sendMessage: Function called.");

    const userText = input.trim();
    const currentImageUri = image; // This is the URI from your component's state
    const hasImage = !!currentImageUri;

    const uriToLog = currentImageUri ? (currentImageUri.length > 100 ? currentImageUri.substring(0, 100) + "..." : currentImageUri) : "null";
    console.log(`sendMessage: User text: "${userText}", Has image URI? ${hasImage}, Image URI: ${uriToLog}`);

    if (!userText) {
        Alert.alert(t('promptRequiredTitle'), t('promptRequiredMessage'));
        return;
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
                        console.log("sendMessage: Data URI MIME type parsed with fallback:", actualMimeTypeToSend);
                    } else {
                        throw new Error(`Could not parse supported MIME type from Data URI: ${metaPart}`);
                    }
                }
                 if (!actualMimeTypeToSend || !['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif'].includes(actualMimeTypeToSend)) {
                    throw new Error(`Unsupported or unparsed MIME type from Data URI: ${actualMimeTypeToSend || 'unknown'}`);
                }
                if (!imageBase64) throw new Error("Base64 data missing in Data URI.");
                console.log(`sendMessage: DATA URI Parse SUCCESS. MIME: ${actualMimeTypeToSend}, Base64 Length: ${imageBase64.length}`);

            } else { // File URI
                console.log("sendMessage: Processing as FILE URI. Path:", currentImageUri);
                let inferredMimeType: string | null = null;
                const uriPath = currentImageUri.split('?')[0].split('#')[0].toLowerCase();
                const extensionMatch = uriPath.match(/\.([a-z0-9]+)$/);
                const extension = extensionMatch ? extensionMatch[1] : null;

                console.log("sendMessage: Extracted file extension:", extension);

                if (extension === 'png') inferredMimeType = 'image/png';
                else if (extension === 'jpg' || extension === 'jpeg') inferredMimeType = 'image/jpeg';
                else if (extension === 'webp') inferredMimeType = 'image/webp';
                else if (extension === 'gif') inferredMimeType = 'image/gif';
                else if (extension === 'heic' || extension === 'heif') inferredMimeType = 'image/heic';

                if (!inferredMimeType) {
                    Alert.alert(t('imageErrorTitle'), `Unsupported image file type (ext: ${extension}). Please use PNG, JPG, WEBP, GIF, or HEIC.`);
                    return;
                }
                actualMimeTypeToSend = inferredMimeType;
                console.log("sendMessage: FILE URI - MIME type inferred:", actualMimeTypeToSend);

                imageBase64 = await FileSystem.readAsStringAsync(currentImageUri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                console.log("sendMessage: FILE URI - Base64 conversion SUCCESS. Length:", imageBase64.length);
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

    // --- UI Updates & Clearing State ---
    const userMsg: { from: string; text: string; image?: string } = (hasImage && currentImageUri)
      ? { from: 'user', text: userText, image: currentImageUri } // CORRECTED LINE: Use currentImageUri for local display
      : { from: 'user', text: userText };
    

    const newMessagesWithUser = [...messages, userMsg];
    setMessages(newMessagesWithUser);
    setChatHistories(histories =>
      histories.map(session =>
        session.id === activeSessionId ? { ...session, messages: newMessagesWithUser } : session
      )
    );
    setInput('');
    setImage(null);
    // If you were storing MIME type in a separate state for UI purposes (which you are not based on code):
    // setImageMimeType(null);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);


    // --- API Payload ---
    const apiPayload: { message: string; image_base64?: string; image_mime_type?: string } = {
      message: userText,
    };

    if (hasImage && imageBase64 && actualMimeTypeToSend) {
      apiPayload.image_base64 = imageBase64;
      apiPayload.image_mime_type = actualMimeTypeToSend;
    }

    const payloadSize = JSON.stringify(apiPayload).length;
    console.log(`sendMessage: Preparing to send API Payload. Est. size: ${payloadSize} bytes. Base64 length (if image): ${apiPayload.image_base64 ? apiPayload.image_base64.length : 0}`);
    if (payloadSize > 10 * 1024 * 1024) {
        console.warn("sendMessage: Payload size is large (>10MB), this might cause issues with server limits.");
    }


    try { 
      const API_URL = `${process.env.EXPO_PUBLIC_API_BASE}/chat`; // <<--- REPLACE WITH YOUR ACTUAL CORRECT IP or 10.0.2.2 or 127.0.0.1 as appropriate
      console.log("sendMessage: Attempting API call to:", API_URL);


      const response = await fetch(`${API_URL}?patientid=${patientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      console.log("sendMessage: API response status:", response.status);

      let aiTextResponse: string;

      if (response.ok) {
        const data = await response.json();
        let rawAiText = data.message;
        aiTextResponse = rawAiText.replace(/^\* /gm, "\u2022 ");
        console.log("sendMessage: API call successful. AI Response (first 100 chars):", aiTextResponse.substring(0,100));
      } else {
        let errorDetail = `API Error (${response.status})`;
        let responseText = "";
        try {
            // Try to read response text first, as .json() might fail if not JSON
            responseText = await response.text();
            const errorData = JSON.parse(responseText); // Then try to parse if it was text
            errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (e) {
            // If JSON.parse fails, use the raw responseText (if available) or a generic message
            errorDetail += responseText ? ` - ${responseText.substring(0, 200)}...` : " - Could not parse error response.";
            console.warn("sendMessage: Could not parse API error response as JSON. Raw text (first 200 chars):", responseText.substring(0,200));
        }
        console.error('sendMessage: API Error Detail:', errorDetail);
        aiTextResponse = errorDetail; // Send this detailed error to the chat
      }

      const aiMsg = { from: 'ai', text: aiTextResponse };
      setMessages(prevMessages => [...prevMessages, aiMsg]);
      setChatHistories(histories =>
        histories.map(session =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, aiMsg] }
            : session
        )
      );
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    } catch (error: any) {
      console.error('sendMessage: FULL NETWORK/FETCH ERROR:', error.name, error.message, error.stack);
      const errorText = error.message.includes("Failed to connect") || error.message.includes("timeout") || error.name === "TypeError" && error.message.toLowerCase().includes("network request failed") ?
                        t('networkErrorTimeout') :
                        t('networkErrorGeneric');
      const aiErrorMsg = { from: 'ai', text: errorText };
      setMessages(prevMessages => [...prevMessages, aiErrorMsg]);
      setChatHistories(histories =>
        histories.map(session =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, aiErrorMsg] }
            : session
        )
      );
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
};
  // ---- END OF MODIFIED sendMessage FUNCTION ----


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
        {/* ... (sidebar content remains the same) ... */}
        <TouchableWithoutFeedback onPress={closeSidebar}>
          <View style={styles.sidebarOverlay}>
            <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnimation }] }]}>
              <TouchableOpacity onPress={closeSidebar} style={styles.sidebarCloseIcon}>
                <Text style={{ fontSize: 24, color: '#E53935' }}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.sidebarTitle}>{t('chatHistory')}</Text>
              <FlatList
                data={chatHistories}
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

      {/* Main Content Area (Chat + Input) - This View handles padding for the bottomNav */}
      <View style={styles.mainContentWrapper}>
        {/* Chat Area (FlatList) */}
        <View style={{ flex: 1, position: 'relative' }}>
          {imagePickerMenuVisible && (
            <Pressable onPress={() => setImagePickerMenuVisible(false)} style={styles.popoverBackdrop} />
          )}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, idx) => `msg-${idx}-${activeSessionId}`}
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
            contentContainerStyle={styles.chatArea} // paddingBottom here for scrolling content above input
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        </View>

        {/* Input Area, wrapped by KeyboardAvoidingView */}
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
              <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
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

      {/* Bottom nav, absolutely positioned */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/HomeScreen',params: patientCredentials})}><Text style={[styles.navIcon]}>🏠</Text><Text style={[styles.navLabel]}>{t('home')}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/AIChatScreen',params: patientCredentials})}><Text style={styles.navIcon}>💬</Text><Text style={[styles.navLabel, styles.navLabelActive]}>{t('stelgginAI')}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/ProgressScreen',params: patientCredentials})}><Text style={styles.navIcon}>📊</Text><Text style={styles.navLabel}>{t('progress')}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace({pathname:'/SettingsScreen',params: patientCredentials})}><Text style={styles.navIcon}>⚙️</Text><Text style={styles.navLabel}>{t('settings')}</Text></TouchableOpacity>
      </View>
    </View>
  );
}

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
  // Sidebar styles remain the same
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

  // New wrapper for main content (Chat + Input)
  mainContentWrapper: {
    flex: 1,
    paddingBottom: BOTTOM_NAV_HEIGHT, // IMPORTANT: Creates space for the absolute bottomNav
  },
  chatArea: { // Padding for FlatList content to scroll above input
    paddingHorizontal: 16,
    paddingTop: 16,
    // Adjust this based on combined height of inputArea and previewImageContainer
    paddingBottom: 160, // e.g. inputArea (~70-90) + previewImage (~70-80)
  },
  messageRow: { flexDirection: 'row', marginBottom: 10 },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAI: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '75%', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16 },
  userBubble: { backgroundColor: '#E53935' },
  aiBubble: { backgroundColor: '#f2f2f2' },
  messageText: { fontSize: 15 },
  userText: { color: '#fff' },
  aiText: { color: '#222' },
  inputArea: { // This View is directly inside KAV's content view
    flexDirection: 'row', alignItems: 'center', padding: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee',
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22,
    backgroundColor: '#f2f2f2', paddingHorizontal: 18, paddingVertical: 10,
    fontSize: 15, color: '#222',
  },
  sendBtn: { marginLeft: 8, padding: 8 },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E2E8F0', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 8, paddingBottom:  (Dimensions.get('window').height * 0.01) < 5 ? 5 : (Dimensions.get('window').height * 0.01), zIndex: 5, },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 24, marginBottom: 3, color: '#A0AEC0' },
  navIconActive: { color: '#E53935' },
  navLabel: { fontSize: 11, color: '#718096' },
  navLabelActive: { color: '#E53935', fontWeight: '600' },
  imagePickerBtn: { marginRight: 8, padding: 8 },
  previewImageContainer: {
    flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  previewImage: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
  removeImageBtn: { padding: 6 },
  chatImage: { width: 120, height: 120, borderRadius: 10, marginBottom: 6 },
  popoverBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'transparent', zIndex: 99,
  },
  imagePickerPopover: {
    position: 'absolute', left: 16, bottom: '100%', marginBottom: 8, // Position above input area
    width: 180, backgroundColor: '#fff', borderRadius: 10, padding: 8,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 }, zIndex: 100, // Highest zIndex for popover
  },
  imagePickerChoiceBtn: {
    width: '100%', backgroundColor: '#f2f2f2', borderRadius: 8, paddingVertical: 12,
    alignItems: 'center', marginBottom: 10,
  },
  mascotChatIcon: {
    width: 30,
    height: 30,
    marginRight: 8,
    resizeMode: 'contain',
    alignSelf: 'flex-end',
    backgroundColor: '#FDEAEA',
    borderRadius: 16,
    padding: 4,
  },
});