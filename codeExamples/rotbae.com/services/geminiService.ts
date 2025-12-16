import { GoogleGenAI } from "@google/genai";

// Helper to ensure key is selected before API calls
const ensureApiKey = async (): Promise<string | undefined> => {
  if ((window as any).aistudio) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }
    // We assume the environment injects the key into process.env.API_KEY
    // after selection for the library to use, or the library handles it internally in this environment.
    // However, specifically for the `fetch` call for Veo, we might need it.
    // In this specific sandbox environment, process.env.API_KEY is populated automatically.
    return process.env.API_KEY;
  }
  return process.env.API_KEY;
};

export const generateStockVideo = async (prompt: string): Promise<string> => {
  const apiKey = await ensureApiKey();
  // Create a FRESH instance to ensure we pick up any newly selected key
  const ai = new GoogleGenAI({ apiKey: apiKey });

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Lo-fi, gritty, high-fashion surveillance footage. ${prompt}. 90s aesthetic, vhs glitch, brutalist style.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");

  // Fetch the actual blob to display
  const response = await fetch(`${videoUri}&key=${apiKey}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const generateProductImage = async (prompt: string): Promise<string> => {
    const apiKey = await ensureApiKey();
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
            parts: [{ text: `High fashion product photography, white background, studio lighting, brutalist aesthetic. ${prompt}` }]
        },
        config: {
            imageConfig: {
                aspectRatio: "1:1",
                imageSize: "1K"
            }
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Image generation failed");
};

export const generateManifesto = async (): Promise<string> => {
    // Uses Flash for quick text generation
    const apiKey = await ensureApiKey();
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Write a short, cryptic, 2-sentence manifesto for a brutalist fashion brand called ROTBAE. Use uppercase. Sound detached and cool.",
    });
    return response.text || "CONSUME. REPLICATE. ROTBAE.";
}