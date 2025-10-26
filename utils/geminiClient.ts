import { GoogleGenerativeAI, GenerativeModel, GenerateContentResult } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const DEFAULT_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-pro';

let client: GoogleGenerativeAI | null = null;

const ensureClient = () => {
  if (!client) {
    if (!API_KEY) {
      throw new Error('VITE_GEMINI_API_KEY is not set. Add it to your .env.local file.');
    }
    client = new GoogleGenerativeAI({ apiKey: API_KEY });
  }
  return client;
};

export const getGeminiModel = (model = DEFAULT_MODEL): GenerativeModel => {
  return ensureClient().getGenerativeModel({ model });
};

export const getGeminiClient = (): GoogleGenerativeAI => {
  return ensureClient();
};

export const extractText = (result: GenerateContentResult | undefined): string => {
  if (!result) return '';
  const { response } = result;
  if (!response) return '';
  try {
    const textFn = (response as any).text;
    if (typeof textFn === 'function') {
      return textFn.call(response) ?? '';
    }
    if (typeof textFn === 'string') {
      return textFn;
    }
  } catch (error) {
    console.warn('Failed to read response.text()', error);
  }

  const candidates = (response as any).candidates ?? [];
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    if (Array.isArray(parts)) {
      const text = parts.map((part: any) => part?.text ?? '').join('').trim();
      if (text) return text;
    }
  }

  const outputs = (response as any).output ?? [];
  if (outputs.length > 0 && Array.isArray(outputs[0]?.content?.parts)) {
    return outputs[0].content.parts.map((part: any) => part?.text ?? '').join('').trim();
  }
  return '';
};
