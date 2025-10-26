import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { LiveSession, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
import { Mic, MicOff, Zap, Loader } from 'lucide-react';
import { encode, decode, decodeAudioData } from '../utils/audio';
import { Task, CalendarEvent, Priority, TaskStatus } from '../types';
import { getGeminiClient } from '../utils/geminiClient';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';
interface VoiceMessage {
    sender: 'user' | 'bot';
    text: string;
}
interface VoiceInterfaceProps {
    addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
    addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
}

const createTaskFunctionDeclaration: FunctionDeclaration = {
    name: 'create_task',
    parameters: {
        type: Type.OBJECT,
        description: 'Creates a new task in the system.',
        properties: {
            title: { type: Type.STRING, description: 'The title of the task.' },
            priority: { type: Type.STRING, enum: ["Urgent", "High", "Normal", "Low"], description: 'The priority of the task. Defaults to Normal.' },
            due_at: { type: Type.STRING, description: 'The due date and time in ISO 8601 format.' },
        },
        required: ['title'],
    },
};

const createCalendarEventFunctionDeclaration: FunctionDeclaration = {
    name: 'create_calendar_event',
    parameters: {
        type: Type.OBJECT,
        description: 'Creates a new event in the calendar.',
        properties: {
            title: { type: Type.STRING, description: 'The title of the event.' },
            start_at: { type: Type.STRING, description: 'The start date and time in ISO 8601 format.' },
            end_at: { type: Type.STRING, description: 'The end date and time in ISO 8601 format.' },
        },
        required: ['title', 'start_at', 'end_at'],
    },
};

const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
};

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ addTask, addEvent }) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
    const [messages, setMessages] = useState<VoiceMessage[]>([]);
    const [isListening, setIsListening] = useState<boolean>(false);
    
    const sessionRef = useRef<LiveSession | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const geminiClient = useMemo(() => getGeminiClient(), []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const startConversation = useCallback(async () => {
        if (connectionState === 'connected' || connectionState === 'connecting') return;

        setConnectionState('connecting');
        setMessages([{ sender: 'bot', text: 'Connecting to assistant...' }]);

        try {
            const ai = geminiClient;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = inputAudioContext;

            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setConnectionState('connected');
                        setIsListening(true);
                        setMessages([{ sender: 'bot', text: 'Assistant is listening...' }]);
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle transcriptions
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            currentInputTranscriptionRef.current += text;
                            setMessages(prev => {
                                const lastMessage = prev[prev.length - 1];
                                if (lastMessage?.sender === 'user') {
                                    const newMessages = [...prev];
                                    newMessages[prev.length - 1] = { ...lastMessage, text: currentInputTranscriptionRef.current };
                                    return newMessages;
                                }
                                return [...prev, { sender: 'user', text: currentInputTranscriptionRef.current }];
                            });
                        }
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            currentOutputTranscriptionRef.current += text;
                             setMessages(prev => {
                                const lastMessage = prev[prev.length - 1];
                                if (lastMessage?.sender === 'bot') {
                                    const newMessages = [...prev];
                                    newMessages[prev.length - 1] = { ...lastMessage, text: currentOutputTranscriptionRef.current };
                                    return newMessages;
                                }
                                 return [...prev, { sender: 'bot', text: currentOutputTranscriptionRef.current }];
                            });
                        }
                        if (message.serverContent?.turnComplete) {
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }

                        // Handle function calls
                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                let result: any = { status: 'OK' };
                                try {
                                    if (fc.name === 'create_task' && fc.args) {
                                        const { title, priority = 'Normal', due_at = null } = fc.args;
                                        const newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
                                            title, description: 'Created via voice command', priority: priority as Priority, due_at,
                                            status: 'To Do' as TaskStatus, source: 'voice', notion_page_id: `notion_voice_${Date.now()}`,
                                            start_at: null, estimated_minutes: null, stakeholders: [], related_emails: [], related_events: [],
                                            reminders: due_at ? [{ type: 'audible', start_at: new Date(new Date(due_at).getTime() - 30 * 60000).toISOString(), repeat: 'every_2_min', stop_condition: 'status>=Started' }] : [],
                                            last_briefed_at: null,
                                        };
                                        addTask(newTask);
                                        result.message = `Task "${title}" created successfully.`;
                                    } else if (fc.name === 'create_calendar_event' && fc.args) {
                                        const { title, start_at, end_at } = fc.args;
                                        const newEvent: Omit<CalendarEvent, 'id'> = { title, start_at, end_at, attendees: [] };
                                        addEvent(newEvent);
                                        result.message = `Event "${title}" has been scheduled.`;
                                    }
                                } catch (e) {
                                    result = { status: 'Error', message: (e as Error).message };
                                }
                                sessionPromise.then((session) => {
                                    session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: JSON.stringify(result) } } });
                                });
                            }
                        }

                        // Handle audio playback
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const outCtx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
                            const source = outCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outCtx.destination);
                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Connection error:', e);
                        setConnectionState('error');
                        setMessages([{ sender: 'bot', text: 'Connection error. Please try again.' }]);
                    },
                    onclose: () => {
                        setConnectionState('closed');
                        setIsListening(false);
                         setMessages(prev => [...prev, { sender: 'bot', text: 'Conversation ended.' }]);
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    systemInstruction: 'You are a friendly and helpful executive assistant. When asked to create a task or event, use the provided tools.',
                    tools: [{ functionDeclarations: [createTaskFunctionDeclaration, createCalendarEventFunctionDeclaration] }],
                },
            });
            sessionRef.current = await sessionPromise;
        } catch (error) {
            console.error('Failed to start conversation:', error);
            setConnectionState('error');
            setMessages([{ sender: 'bot', text: 'Failed to get microphone access. Please check permissions.' }]);
        }
    }, [connectionState, addTask, addEvent, geminiClient]);

    const stopConversation = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (outputAudioContextRef.current) {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        setConnectionState('idle');
        setIsListening(false);
    }, []);
    
    useEffect(() => {
        return () => stopConversation();
    }, [stopConversation]);

    const buttonState = () => {
        switch (connectionState) {
            case 'idle': case 'closed': case 'error':
                return { Icon: Mic, text: 'Start Conversation', action: startConversation, bgColor: 'bg-indigo-600 hover:bg-indigo-500', pulse: false };
            case 'connecting':
                return { Icon: Loader, text: 'Connecting...', action: () => {}, bgColor: 'bg-gray-500', pulse: true };
            case 'connected':
                return { Icon: MicOff, text: 'Stop Conversation', action: stopConversation, bgColor: 'bg-red-600 hover:bg-red-500', pulse: isListening };
        }
    };
    
    const { Icon, text, action, bgColor, pulse } = buttonState();

    return (
        <div className="h-64 flex flex-col items-center justify-between">
            <div className="w-full flex-1 overflow-y-auto p-2 space-y-3 text-sm">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-3 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-lg' : 'bg-gray-700 text-gray-200 rounded-bl-lg'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className='flex flex-col items-center justify-center space-y-2 py-2'>
                <button
                    onClick={action}
                    className={`relative flex items-center justify-center w-16 h-16 rounded-full text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${bgColor}`}
                >
                    {pulse && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>}
                    <Icon className={`w-7 h-7 ${connectionState === 'connecting' && 'animate-spin'}`} />
                </button>
                <p className="text-xs font-semibold">{text}</p>
            </div>
        </div>
    );
};
