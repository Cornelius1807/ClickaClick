import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
console.log('[GEMINI] Initializing, key exists?', !!apiKey);

if (!apiKey) {
  throw new Error('GEMINI_API_KEY no definido en el entorno');
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function askGemini(prompt: string): Promise<string> {
  const modelName = 'gemini-2.5-pro';
  console.log('[GEMINI] Invoking model:', modelName);
  
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('[GEMINI] Response received, length:', text.length);
    console.log('[GEMINI] Response text:', text.substring(0, 100));
    
    return text || '';
  } catch (err: any) {
    console.error('[GEMINI] Request failed:', err?.message || err);
    return '';
  }
}
