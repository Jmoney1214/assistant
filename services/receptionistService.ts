import { GoogleGenAI, Type } from "@google/genai";
import { Priority } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const systemInstruction = `You are a receptionist AI for an executive assistant. Your role is to read inbound messages (SMS or email), analyze them, and turn them into structured data for creating tasks or calendar events. You must extract intent, dates, names, and action items.

You MUST respond with a single JSON object that follows the provided schema. The JSON object must contain an 'action' and the corresponding arguments. The possible actions are 'create_task', 'create_calendar_event', or 'clarify_request'.

- For 'create_task', you must extract a clear title, a priority, and a due date if mentioned. If urgency is implied (e.g., "ASAP", "by Friday"), set priority to 'High' or 'Urgent'. If no due date is specified, leave it null.
- For 'create_calendar_event', extract a title, start time, end time, and any attendees if mentioned.
- If the request is ambiguous, use the 'clarify_request' action and provide a question to ask the user.
- Always provide an 'autoSummary' of the original request.
- Provide a confidence score between 0 and 1 for your extraction.

Do not include any text, markdown, or explanations outside of the single JSON object response.`;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        action: { type: Type.STRING, enum: ["create_task", "create_calendar_event", "clarify_request"] },
        task: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
                title: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ["Urgent", "High", "Normal", "Low"] },
                due_at: { type: Type.STRING, description: "Full ISO 8601 format if a date is found, otherwise null." },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
        },
        event: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
                title: { type: Type.STRING },
                start_at: { type: Type.STRING, description: "Full ISO 8601 format." },
                end_at: { type: Type.STRING, description: "Full ISO 8601 format." },
                attendees: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
        },
        autoSummary: { type: Type.STRING, description: "A 1-3 line summary of the original request." },
        confidence: { type: Type.NUMBER, description: "Extraction confidence score from 0.0 to 1.0." },
        clarification: { type: Type.STRING, nullable: true, description: "Question to ask user if request is ambiguous."}
    },
    required: ["action", "autoSummary", "confidence"]
};


export const processInboundMessage = async (prompt: string): Promise<any> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
            },
        });

        const responseText = response.text;
        return JSON.parse(responseText);

    } catch (error) {
        console.error("Error processing inbound message with Gemini:", error);
        throw new Error("Failed to parse the inbound message.");
    }
};
