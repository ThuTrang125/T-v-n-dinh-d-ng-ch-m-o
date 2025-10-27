import { GoogleGenAI, Type } from '@google/genai';
import { SYSTEM_PROMPT } from '../constants';
import { AdviceResponse, PetFormData, UploadedImage } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const productRecommendationSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    reason: { type: Type.STRING },
    quantity: { type: Type.NUMBER },
    price: { type: Type.NUMBER },
  },
  required: ['name', 'reason', 'quantity', 'price'],
};

const adviceResponseSchema = {
  type: Type.OBJECT,
  properties: {
    visualAnalysis: { type: Type.STRING },
    nutritionHypothesis: { type: Type.STRING },
    nutritionAdvice: { type: Type.STRING },
    habitAdvice: { type: Type.STRING },
    warnings: { type: Type.STRING },
    connectionAdvice: { type: Type.STRING },
    productRecommendations: {
      type: Type.ARRAY,
      items: productRecommendationSchema,
    },
  },
  required: [
    'visualAnalysis',
    'nutritionHypothesis',
    'nutritionAdvice',
    'habitAdvice',
    'warnings',
    'connectionAdvice',
    'productRecommendations',
  ],
};

export const getPetAdvice = async (
  userInput: string,
  images: UploadedImage[]
): Promise<AdviceResponse> => {
  try {
    const contents: any[] = [{ text: userInput }];
    images.forEach(image => {
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: image.base64,
        },
      });
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: contents },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: adviceResponseSchema,
      },
    });

    let text = response.text.trim();
    
    // Clean potential markdown
    if (text.startsWith('```json')) {
      text = text.slice(7, -3).trim();
    }

    // The component layer will handle the [NL] tag for display.
    // text = text.replace(/\[NL\]/g, '\\n');

    const advice: AdviceResponse = JSON.parse(text);
    return advice;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Không thể nhận tư vấn từ AI. Vui lòng thử lại sau.');
  }
};