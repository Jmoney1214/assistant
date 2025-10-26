
import React, { useState, useRef, useEffect } from 'react';
import { Type } from "@google/genai";
import { Send, Loader } from 'lucide-react';
import { Task, Priority, TaskStatus, CalendarEvent } from '../types';
import { getGeminiModel, extractText } from '../utils/geminiClient';

interface ChatInterfaceProps {
    addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
    addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
}

interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ addTask, addEvent }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const model = getGeminiModel();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMessage: ChatMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: input }]}],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.3,
                    topP: 0.8,
                    topK: 40,
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            action: { type: Type.STRING, enum: ["create_task", "create_calendar_event", "chat_response"] },
                            task: {
                                type: Type.OBJECT,
                                nullable: true,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    priority: { type: Type.STRING, enum: ["Urgent", "High", "Normal", "Low"] },
                                    due_at: { type: Type.STRING, description: "ISO 8601 format" },
                                },
                            },
                            event: {
                                type: Type.OBJECT,
                                nullable: true,
                                properties: {
                                    title: { type: Type.STRING },
                                    start_at: { type: Type.STRING, description: "ISO 8601 format" },
                                    end_at: { type: Type.STRING, description: "ISO 8601 format" },
                                    attendees: {
                                        type: Type.ARRAY,
                                        items: { type: Type.STRING, description: "Email address" }
                                    }
                                },
                            },
                            response_text: { type: Type.STRING, nullable: true }
                        }
                    }
                }
            });

            const responseText = extractText(response);
            let botMessage: ChatMessage;

            try {
                const parsedResponse = JSON.parse(responseText);
                if (parsedResponse.action === 'create_task' && parsedResponse.task) {
                    const { title, description = '', priority = 'Normal', due_at = null } = parsedResponse.task;
                    const newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
                        title,
                        description,
                        priority: priority as Priority,
                        due_at,
                        status: 'To Do' as TaskStatus,
                        source: 'notion',
                        notion_page_id: `notion_${Date.now()}`,
                        start_at: null,
                        estimated_minutes: null,
                        stakeholders: [],
                        related_emails: [],
                        related_events: [],
                        reminders: due_at ? [{
                            type: 'audible',
                            start_at: new Date(new Date(due_at).getTime() - 30 * 60000).toISOString(),
                            repeat: 'every_2_min',
                            stop_condition: 'status>=Started'
                        }] : [],
                        last_briefed_at: null,
                    };
                    addTask(newTask);
                    botMessage = { sender: 'bot', text: `Task "${title}" created successfully!` };
                } else if (parsedResponse.action === 'create_calendar_event' && parsedResponse.event) {
                    const { title, start_at, end_at, attendees = [] } = parsedResponse.event;
                     const newEvent: Omit<CalendarEvent, 'id'> = {
                        title,
                        start_at,
                        end_at,
                        attendees,
                    };
                    addEvent(newEvent);
                    botMessage = { sender: 'bot', text: `Event "${title}" has been scheduled.` };
                } else {
                    botMessage = { sender: 'bot', text: parsedResponse.response_text || "I'm sorry, I couldn't process that." };
                }
            } catch (e) {
                // If parsing fails, it's likely a simple chat response not in JSON format.
                 botMessage = { sender: 'bot', text: responseText };
            }
             setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessage: ChatMessage = { sender: 'bot', text: "Sorry, I encountered an error. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-64 flex flex-col">
            <div className="flex-1 overflow-y-auto p-2 space-y-3 text-sm">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-3 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-lg' : 'bg-gray-700 text-gray-200 rounded-bl-lg'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>
            <div className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask your assistant... (e.g., 'Schedule a meeting with the design team for Friday at 3pm')"
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                />
                <button 
                    onClick={handleSend}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-500 transition-colors"
                >
                    {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};
