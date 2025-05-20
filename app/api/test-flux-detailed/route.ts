import { generateImageWithRunpod, testRunpodModels } from '../../services/runpod';

export async function GET() {
  try {
    // First, test the connection and get available models
    const modelsData = await testRunpodModels();
    
    // Then try to generate an image
    const testPrompt = "beautiful scenery nature glass bottle landscape, purple galaxy bottle";
    const generationResult = await generateImageWithRunpod(testPrompt);
    
    return Response.json({ 
      success: true,
      endpoint: process.env.RUNPOD_ENDPOINT_ID,
      models: modelsData,
      generationResult,
      prompt: testPrompt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Detailed test error:', error);
    return Response.json({ 
      success: false, 
      endpoint: process.env.RUNPOD_ENDPOINT_ID,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 