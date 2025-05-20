'use server'

import { GeneratedImage } from '../types'
import { generateImageWithRunpod } from '../services/runpod'

export async function generateImageAction(prompt: string): Promise<GeneratedImage> {
  if (!prompt) {
    throw new Error('Prompt is required');
  }

  try {
    // Generate image with RunPod ComfyUI
    const imageUrl = await generateImageWithRunpod(prompt);

    return {
      id: Date.now().toString(),
      prompt,
      imageUrl,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in generateImageAction:', error);
    if (error instanceof Error) {
      throw new Error(`Image generation failed: ${error.message}`);
    }
    throw new Error('Failed to generate image');
  }
}

