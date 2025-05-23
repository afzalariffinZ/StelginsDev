// components/chatbot-toggle-button.tsx
"use client";

import React from "react";
import { MessageSquare, X } from "lucide-react"; // Added X for when it's open (alternative)

const THEME_COLOR_RED = "#df0000";

interface ChatbotToggleButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const ChatbotToggleButton: React.FC<ChatbotToggleButtonProps> = ({
  onClick,
  isOpen,
}) => {
  // This button is now always visible, and its icon/action changes.
  // The chatbot itself will appear/disappear based on isOpen.

  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center justify-center w-14 h-14"
      style={{
        backgroundColor: THEME_COLOR_RED,
        borderColor: THEME_COLOR_RED,
        // @ts-ignore
        '--tw-ring-color': THEME_COLOR_RED, // For focus ring
      }}
      aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
    >
      {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
    </button>
  );
};