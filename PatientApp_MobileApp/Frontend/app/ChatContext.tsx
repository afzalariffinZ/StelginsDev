// src/contexts/ChatContext.tsx (or wherever you prefer to put contexts)
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import initialChatHistoriesData from '../assets/chatHistories.json'; // Adjust path as needed
import { useLanguage } from '../app/i18n/LanguageContext'; // Adjust path to your LanguageContext

// Define types for chat messages and sessions
export interface Message {
  from: 'user' | 'ai';
  text: string;
  image?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

interface ChatContextType {
  chatHistories: ChatSession[];
  activeSessionId: string | null;
  currentMessages: Message[];
  setActiveSessionId: (id: string | null) => void;
  addMessageToActiveSession: (message: Message) => void;
  createNewChatSession: () => string; // Returns the new session ID
  loadChatSessionFromHistory: (sessionId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useLanguage(); // For default "New Chat" title

  // Helper to get initial state based on JSON
  const getInitialSessionId = (): string | null => {
    return initialChatHistoriesData.length > 0 ? initialChatHistoriesData[0].id : null;
  };

  const getInitialMessagesForSession = (sessionId: string | null): Message[] => {
    if (sessionId) {
      const session = initialChatHistoriesData.find(s => s.id === sessionId);
      return session ? (session.messages as Message[]) : [{ from: 'ai', text: t('aiGreeting') || 'Welcome!' }];
    }
    return [{ from: 'ai', text: t('aiGreeting') || 'Welcome!' }];
  };

  const [chatHistories, setChatHistories] = useState<ChatSession[]>(initialChatHistoriesData as ChatSession[]);
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(getInitialSessionId());
  const [currentMessages, setCurrentMessages] = useState<Message[]>(getInitialMessagesForSession(activeSessionId));

  const setActiveSessionIdAndMessages = (sessionId: string | null) => {
    setActiveSessionIdState(sessionId);
    if (sessionId) {
      const session = chatHistories.find(s => s.id === sessionId);
      setCurrentMessages(session ? session.messages : getInitialMessagesForSession(sessionId));
    } else {
      // If no active session, maybe create one or show a default state
      const newId = createNewChatSessionInternal(false); // Don't set active yet
      setActiveSessionIdState(newId);
      setCurrentMessages(chatHistories.find(s => s.id === newId)?.messages || getInitialMessagesForSession(null));
    }
  };


  // Effect to ensure currentMessages are in sync if chatHistories or activeSessionId changes externally
  useEffect(() => {
    if (activeSessionId) {
      const session = chatHistories.find(s => s.id === activeSessionId);
      if (session) {
        if (JSON.stringify(session.messages) !== JSON.stringify(currentMessages)) {
           setCurrentMessages(session.messages);
        }
      } else {
        // Active session ID no longer exists in histories (e.g., deleted)
        // Fallback to the first session or create a new one
        if (chatHistories.length > 0) {
          setActiveSessionIdAndMessages(chatHistories[0].id);
        } else {
          const newId = createNewChatSessionInternal(true); // Create and set active
          setActiveSessionIdAndMessages(newId);
        }
      }
    } else if (chatHistories.length > 0) {
      // No active session, but histories exist, activate the first one
      setActiveSessionIdAndMessages(chatHistories[0].id);
    } else {
      // No active session and no histories, create a new one
      const newId = createNewChatSessionInternal(true);
      setActiveSessionIdAndMessages(newId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId, chatHistories]); // currentMessages is intentionally omitted to avoid loops if it's set from here

  const addMessageToActiveSession = (message: Message) => {
    if (!activeSessionId) {
      console.warn("No active session to add message to. Creating a new one.");
      const newId = createNewChatSessionInternal(true); // Create and set active
      setActiveSessionIdState(newId); // Ensure activeSessionId is set before proceeding

      // Add message to this newly created session
      setChatHistories(prevHistories =>
        prevHistories.map(session =>
          session.id === newId
            ? { ...session, messages: [...session.messages, message] }
            : session
        )
      );
      setCurrentMessages(prev => [...prev, message]); // Also update current messages
      return;
    }

    setCurrentMessages(prevMessages => [...prevMessages, message]);
    setChatHistories(prevHistories =>
      prevHistories.map(session =>
        session.id === activeSessionId
          ? { ...session, messages: [...session.messages, message] }
          : session
      )
    );
  };

  const createNewChatSessionInternal = (setActive: boolean): string => {
    const newSessionId = Date.now().toString();
    const newSession: ChatSession = {
      id: newSessionId,
      title: t('newChat') || "New Chat",
      messages: [{ from: 'ai', text: t('aiGreeting') || "Hello! How can I help you?" }],
    };
    setChatHistories(prev => [newSession, ...prev]);
    if (setActive) {
        // setActiveSessionIdState(newSessionId); // This will be handled by the calling function or effect
        // setCurrentMessages(newSession.messages);
    }
    return newSessionId;
  };


  const createNewChatSession = (): string => {
    const newId = createNewChatSessionInternal(true);
    setActiveSessionIdAndMessages(newId);
    return newId;
  };

  const loadChatSessionFromHistory = (sessionId: string) => {
    setActiveSessionIdAndMessages(sessionId);
  };


  return (
    <ChatContext.Provider value={{
      chatHistories,
      activeSessionId,
      currentMessages,
      setActiveSessionId: setActiveSessionIdAndMessages,
      addMessageToActiveSession,
      createNewChatSession,
      loadChatSessionFromHistory,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};