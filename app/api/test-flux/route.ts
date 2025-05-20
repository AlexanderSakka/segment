import { generateImageWithRunpod } from '../../services/runpod';

export async function GET() {
  try {
    // Test with a simple prompt
    const testPrompt = "beautiful scenery nature glass bottle landscape, purple galaxy bottle";
    const result = await generateImageWithRunpod(testPrompt);
    
    return Response.json({ 
      success: true, 
      message: 'Test generation successful',
      result 
    });
  } catch (error) {
    console.error('Test generation error:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 