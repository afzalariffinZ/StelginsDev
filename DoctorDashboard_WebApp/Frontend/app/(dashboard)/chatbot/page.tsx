// app/page.js (or your specific page route in Next.js App Router)
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Assuming this path is correct for your project
import { Input } from '@/components/ui/input';   // Assuming this path is correct for your project

const API_BASE_URL = 'http://127.0.0.1:8000';
const API_ENDPOINT = '/chat_bot_dr';
// const DR_ID = 20001; // This line is removed as DrID will be dynamic

// Helper function to format date and time strings (remains the same)
const formatDateAndTime = (text) => {
    if (typeof text !== 'string') return text;
    const dateTimeRegex = /(\d{4}-\d{2}-\d{2}) at (\d{2}:\d{2}:\d{2})/g;
    return text.replace(dateTimeRegex, (match, dateStr, timeStr) => {
        const isoDateTimeStr = `${dateStr}T${timeStr}`;
        const dateObj = new Date(isoDateTimeStr);
        if (isNaN(dateObj.getTime())) return match;
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
        const formattedTime = dateObj.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true,
        });
        return `${formattedDate}, ${formattedTime}`;
    });
};

// Helper component to render text (remains the same)
const RenderMessageContent = ({ text }) => {
    if (typeof text !== 'string' || text.trim() === '') return null;
    const lines = text.split('\n');
    const elements = [];
    let currentListItems = [];
    let listKeyBase = 0;

    const flushListItems = () => {
        if (currentListItems.length > 0) {
            elements.push(
                <ul key={`ul-${listKeyBase}`} className="list-disc pl-5 sm:pl-6 space-y-1 my-2">
                    {currentListItems}
                </ul>
            );
            currentListItems = [];
            listKeyBase++;
        }
    };

    lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trimStart();
        if (trimmedLine.startsWith('* ')) {
            const listItemText = trimmedLine.substring(2);
            const parts = listItemText.split('**');
            currentListItems.push(
                <li key={`li-${listKeyBase}-${lineIndex}`}>
                    {parts.map((part, partIndex) =>
                        partIndex % 2 === 1 ? (
                            <strong key={partIndex}>{part}</strong>
                        ) : (
                            <React.Fragment key={partIndex}>{formatDateAndTime(part)}</React.Fragment>
                        )
                    )}
                </li>
            );
        } else {
            flushListItems();
            const parts = line.split('**');
            if (line.trim() === '') {
                elements.push(<div key={`div-empty-${lineIndex}`} className="h-[0.75em]" aria-hidden="true" />);
            } else {
                elements.push(
                    <div key={`div-text-${lineIndex}`}>
                        {parts.map((part, partIndex) =>
                            partIndex % 2 === 1 ? (
                                <strong key={partIndex}>{part}</strong>
                            ) : (
                                <React.Fragment key={partIndex}>{formatDateAndTime(part)}</React.Fragment>
                            )
                        )}
                    </div>
                );
            }
        }
    });
    flushListItems();
    if (elements.length === 0) return null;
    return <>{elements}</>;
};


export default function DoctorChatbotPage() {
    const [messages, setMessages] = useState([
        {
            id: 'initial',
            text: "Hello Doctor! How can I assist you with your patients today? (e.g., 'Which patients are critical?', 'Any discharges scheduled for today?', 'What are Mr. Smith's latest vitals?')",
            sender: 'bot',
            imageLink: null,
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isBotTyping, setIsBotTyping] = useState(false);
    const chatContainerRef = useRef(null);
    const [dynamicDrId, setDynamicDrId] = useState(null); // State to hold DrID
    const [drIdError, setDrIdError] = useState(''); // State to hold error message for DrID

    // Effect to retrieve DrID from localStorage on component mount
    useEffect(() => {
        const doctorDataString = localStorage.getItem("doctor");
        if (doctorDataString) {
            try {
                const doctorDataObject = JSON.parse(doctorDataString);
                if (doctorDataObject && typeof doctorDataObject.DrID !== 'undefined') {
                    setDynamicDrId(doctorDataObject.DrID);
                    setDrIdError(''); // Clear any previous error
                    console.log("Successfully fetched DrID:", doctorDataObject.DrID);
                } else {
                    const errorMsg = "DrID not found in localStorage data. Chat functions may be limited.";
                    console.error(errorMsg);
                    setDrIdError(errorMsg);
                    setMessages(prev => [...prev, { id: 'drIdError', text: errorMsg, sender: 'bot', imageLink: null }]);

                }
            } catch (error) {
                const errorMsg = "Error parsing doctor data from localStorage. Chat functions may be limited.";
                console.error(errorMsg, error);
                setDrIdError(errorMsg);
                setMessages(prev => [...prev, { id: 'drIdParseError', text: errorMsg, sender: 'bot', imageLink: null }]);
            }
        } else {
            const errorMsg = "Doctor data not found in localStorage. Please log in. Chat functions may be limited.";
            console.warn(errorMsg);
            setDrIdError(errorMsg);
            setMessages(prev => [...prev, { id: 'noDrData', text: errorMsg, sender: 'bot', imageLink: null }]);
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    // Effect to scroll chat to bottom (remains the same)
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleSendMessage = async () => {
        if (inputValue.trim() === '' || isBotTyping) {
            return;
        }

        if (!dynamicDrId) {
            console.error("DrID is not available. Cannot send message.");
            const errorMsg = "Doctor ID is not configured. Cannot send message. Please ensure you are logged in correctly.";
            // Add a message to the chat UI indicating the error
            setMessages((prevMessages) => [...prevMessages, {
                id: Date.now().toString(),
                text: errorMsg,
                sender: 'bot',
                imageLink: null,
            }]);
            setDrIdError(errorMsg); // Update error state
            setIsBotTyping(false); // Ensure bot is not marked as typing
            return;
        }

        const userMessageText = inputValue;
        const newUserMessage = {
            id: Date.now().toString(),
            text: userMessageText,
            sender: 'user',
            imageLink: null,
        };
        setMessages((prevMessages) => [...prevMessages, newUserMessage]);
        setInputValue('');
        setIsBotTyping(true);
        setDrIdError(''); // Clear error on successful attempt to send

        try {
            const payload = {
                dr_id: dynamicDrId, // Use the dynamic DrID from state
                question: userMessageText,
            };

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                throw new Error(
                    `API request failed with status ${response.status}. ${errorText || 'Please check the console for more details.'}`
                );
            }

            const data = await response.json();
            const botResponseText = data.text_response || "I received a response, but couldn't understand its content.";
            const graphPresent = data.graph_present || false;
            const imageLinkFromApi = data.image_link || null;

            const newBotMessage = {
                id: (Date.now() + 1).toString(),
                text: botResponseText,
                sender: 'bot',
                imageLink: graphPresent ? imageLinkFromApi : null,
            };
            setMessages((prevMessages) => [...prevMessages, newBotMessage]);

        } catch (error) {
            console.error('Error fetching bot response:', error);
            const errorBotMessage = {
                id: (Date.now() + 1).toString(),
                text: error.message || "Sorry, I couldn't connect to the assistant. Please try again later.",
                sender: 'bot',
                imageLink: null,
            };
            setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
        } finally {
            setIsBotTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isBotTyping && inputValue.trim() !== '' && dynamicDrId) { // Also check dynamicDrId here
                handleSendMessage();
            } else if (!dynamicDrId && inputValue.trim() !== '') {
                // Optionally trigger the error display if user tries to send without DrID
                 handleSendMessage();
            }
        }
    };

    const getPlaceholderText = () => {
        if (drIdError) return drIdError;
        if (isBotTyping) return "Assistant is replying...";
        return "Ask about your patients...";
    };

    return (
        <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900 font-sans">
            <header
                className="bg-[#df0000] text-white p-4 text-center text-xl font-semibold shadow-md sticky top-0 z-10"
            >
                Doctor's Patient Assistant
            </header>

            <div
                ref={chatContainerRef}
                className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4"
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${
                            msg.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        <div
                            className={`max-w-[75%] lg:max-w-[65%] p-3 rounded-xl shadow break-words ${
                                msg.sender === 'user'
                                    ? 'bg-[#df0000] text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                            }`}
                        >
                            <RenderMessageContent text={msg.text} />
                            {msg.sender === 'bot' && msg.imageLink && (
                                <div className="mt-2">
                                    <img
                                        src={msg.imageLink}
                                        alt={ (msg.text && msg.text.length > 50) ? msg.text.substring(0, 50) + "..." : (msg.text || "Patient data graph") }
                                        className="max-w-full h-auto rounded-md border border-slate-200 dark:border-slate-700 shadow-sm"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isBotTyping && (
                     <div className="flex justify-start">
                        <div className="text-sm text-slate-500 dark:text-slate-400 italic py-2 px-3 bg-white dark:bg-slate-800 rounded-lg shadow">
                            Assistant is typing...
                        </div>
                    </div>
                )}
            </div>

            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 backdrop-blur-sm sticky bottom-0 z-10">
                {/* Optionally, display a persistent error message if DrID is missing */}
                {/* {drIdError && !dynamicDrId && <p className="text-red-500 text-xs text-center mb-2">{drIdError}</p>} */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <Input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder={getPlaceholderText()}
                        className="flex-grow bg-slate-50 dark:bg-slate-700 dark:text-slate-50 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-[#df0000] border-slate-300 dark:border-slate-600 rounded-lg text-base"
                        aria-label="Chat input"
                        disabled={!dynamicDrId && !!drIdError} // Disable input if DrID error is critical
                    />
                    <Button
                        onClick={handleSendMessage}
                        className="bg-[#df0000] hover:bg-[#c50000] text-white px-3 sm:px-4 py-2 rounded-lg h-auto min-h-[40px] flex items-center justify-center"
                        aria-label="Send message"
                        size="lg"
                        type="submit"
                        disabled={isBotTyping || inputValue.trim() === '' || (!dynamicDrId && !!drIdError) } // Disable if bot typing, input empty, or critical DrID error
                    >
                        <Send size={20} className="sm:mr-2" />
                        <span className="hidden sm:inline text-base font-medium">Send</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
