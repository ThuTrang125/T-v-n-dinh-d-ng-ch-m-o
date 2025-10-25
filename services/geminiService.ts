import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import type { AdviceResponse, UploadedImage } from '../types';

export async function getPetAdvice(userInput: string, images: UploadedImage[]): Promise<AdviceResponse> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const fullPrompt = `${SYSTEM_PROMPT}\n\n[INPUT]:\n${userInput}`;

    const promptParts: any[] = [{ text: fullPrompt }];
    for (const image of images) {
        promptParts.push({
            inlineData: {
                mimeType: image.type,
                data: image.base64,
            }
        });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: promptParts },
        config: {
            responseMimeType: "application/json",
            temperature: 0.2,
        }
    });
    
    const rawText = response.text.trim();
    
    // Sanitize the response to handle potential malformations from the AI
    // 1. Remove markdown fences that the model might wrap the JSON in.
    let sanitizedText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    // 2. Replace the custom newline token '[NL]' with the correctly escaped newline for JSON parsing.
    sanitizedText = sanitizedText.replace(/\[NL\]/g, '\\n');

    try {
        const advice: AdviceResponse = JSON.parse(sanitizedText);
        return advice;
    } catch (parseError) {
        console.error("Failed to parse sanitized JSON:", sanitizedText);
        console.error("Original raw text from AI:", rawText);
        console.error("JSON Parse Error:", parseError);
        throw new Error("AI response was not in the expected JSON format, even after sanitization. Please try again.");
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof SyntaxError) {
      // This happens if Gemini doesn't return valid JSON
      throw new Error("AI response was not in the expected format. Please try rephrasing your question.");
    }
    const errorMessage = (error as any)?.message || "An unexpected error occurred.";
    if (errorMessage.includes("400 Bad Request")) {
       throw new Error("The AI model couldn't process the request. This might be due to the images provided. Please try with different or clearer images.");
    }
    throw new Error("An unexpected error occurred while getting advice. Please try again later.");
  }
}