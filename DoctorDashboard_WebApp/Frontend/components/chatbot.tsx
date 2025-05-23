// components/chatbot.tsx
"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { X, Send, User, Bot } from "lucide-react";

const THEME_COLOR_RED = "#df0000";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          id: crypto.randomUUID(),
          text: "Hello! How can I assist you today?",
          sender: "ai",
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setMessages([]);
      setInputValue("");
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      text: trimmedInput,
      sender: "user",
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    setIsAiTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
    const aiResponse: Message = {
      id: crypto.randomUUID(),
      text: `AI response to: "${trimmedInput}". I am here to help with your queries.`,
      sender: "ai",
    };
    setMessages((prev) => [...prev, aiResponse]);
    setIsAiTyping(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 h-[500px] sm:h-[550px] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Chatbot Header */}
      <div
        className="flex items-center justify-between p-3 text-white"
        style={{ backgroundColor: THEME_COLOR_RED }}
      >
        <div className="flex items-center space-x-2">
          <Bot size={20} />
          <h3 className="text-lg font-semibold">AI Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-red-700 transition-colors"
          aria-label="Close chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* Chatbot Body - Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-white dark:bg-gray-800"> {/* Added distinct bg for message area */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${ // Use w-full on the outer div
              msg.sender === "user" ? "justify-end" : "justify-start" // This controls the alignment of the inner flex container
            }`}
          >
            <div className={`flex items-end space-x-2 max-w-[85%]`}> {/* Inner container for avatar + bubble */}
              {/* AI Avatar on the LEFT */}
              {msg.sender === "ai" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: THEME_COLOR_RED}}>
                  <Bot size={18} className="text-white" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`px-3 py-2 text-sm ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-lg rounded-br-none" // User bubble style
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg rounded-bl-none" // AI bubble style
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>

              {/* User Avatar on the RIGHT */}
              {msg.sender === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                  <User size={18} className="text-gray-700 dark:text-gray-200" />
                </div>
              )}
            </div>
          </div>
        ))}
        {isAiTyping && (
          <div className="flex justify-start"> {/* AI typing indicator always on the left */}
            <div className="flex items-end space-x-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: THEME_COLOR_RED}}>
                  <Bot size={18} className="text-white" />
              </div>
              <div className="px-3 py-2 text-sm text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 rounded-lg rounded-bl-none">
                <span className="italic">AI is typing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chatbot Input Area */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"> {/* Ensure consistent bg */}
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask anything..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            style={{borderColor: THEME_COLOR_RED, '--tw-ring-color': THEME_COLOR_RED} as React.CSSProperties}
            disabled={isAiTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isAiTyping}
            className="p-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10"
            style={{ backgroundColor: !inputValue.trim() || isAiTyping ? '#9ca3af' : THEME_COLOR_RED, /* gray-400 for disabled */
                     borderColor: !inputValue.trim() || isAiTyping ? '#9ca3af' : THEME_COLOR_RED }}
            aria-label="Send message"
          >
            {isAiTyping ? (
                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-t-2 border-white"></div>
            ) : (
                 <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};