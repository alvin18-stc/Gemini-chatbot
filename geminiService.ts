
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, GenerateContentParameters, Part, GenerateContentResponse } from '@google/genai';

const TEXT_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
const IMAGE_MODEL_NAME = 'imagen-3.0-generate-002';

function getGoogleAI(apiKey: string) {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure the API_KEY environment variable.");
  }
  return new GoogleGenAI({apiKey});
}

export async function* streamQueryWithGoogleSearch(
  prompt: string, 
  apiKey: string,
  imagePart: Part | null = null // Optional image part
): AsyncGenerator<GenerateContentResponse, void, undefined> {
  const ai = getGoogleAI(apiKey);
  
  const userMessageParts: Part[] = [];
  if (prompt.trim()) {
    userMessageParts.push({ text: prompt });
  }
  if (imagePart) {
    userMessageParts.push(imagePart);
  }

  if (userMessageParts.length === 0) {
    throw new Error("Cannot send an empty query. Please provide text or an image.");
  }
  
  const params: GenerateContentParameters = {
    model: TEXT_MODEL_NAME,
    contents: [{ role: "user", parts: userMessageParts }],
    config: {
      temperature: 1.25,
      thinkingConfig: {
        thinkingBudget: 24576, 
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ],
      tools: [{ googleSearch: {} }],
    }
  };

  try {
    const stream = await ai.models.generateContentStream(params); 
    for await (const chunk of stream) {
      yield chunk;
    }
  } catch (error) {
    console.error('Error in generateContentStream:', error);
    let message = 'An unknown error occurred while communicating with the Gemini API for text generation.';
    if (error instanceof Error) {
        message = `Gemini API Error (Text): ${error.message}`;
        // Attempt to parse if the error.message is a JSON string from the API
        // This regex is a bit more robust for finding JSON within a string
        const jsonMatch = error.message.match(/({.*})/s);
        if (jsonMatch && jsonMatch[1]) {
            try {
                const parsedError = JSON.parse(jsonMatch[1]);
                if (parsedError && parsedError.error && parsedError.error.message) {
                    message = `Gemini API Error (Text): ${parsedError.error.message}`;
                }
            } catch (e) {
                // If parsing fails, use the existing message or the original error message
                console.warn("Failed to parse JSON from error message:", e);
            }
        }
    }
    throw new Error(message);
  }
}

export async function generateImageFromPrompt(prompt: string, apiKey: string): Promise<string> {
  const ai = getGoogleAI(apiKey);
   if (!prompt.trim()) {
    throw new Error("Image generation prompt cannot be empty.");
  }

  try {
    const response = await ai.models.generateImages({
      model: IMAGE_MODEL_NAME,
      prompt: prompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      throw new Error('No image data received from API. The prompt might have been blocked or unfulfillable.');
    }
  } catch (error) {
    console.error('Error in generateImages:', error);
    let message = 'An unknown error occurred while communicating with the Gemini API for image generation.';
    if (error instanceof Error) {
        message = `Gemini API Error (Image): ${error.message}`;
        const jsonMatch = error.message.match(/({.*})/s);
        if (jsonMatch && jsonMatch[1]) {
            try {
                const parsedError = JSON.parse(jsonMatch[1]);
                if (parsedError && parsedError.error && parsedError.error.message) {
                    message = `Gemini API Error (Image): ${parsedError.error.message}`;
                }
            } catch (e) {
                 console.warn("Failed to parse JSON from error message:", e);
            }
        }
    }
    throw new Error(message);
  }
}
