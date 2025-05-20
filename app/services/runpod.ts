import { TEST_WORKFLOW } from './comfyWorkflow';

export async function generateImageWithRunpod(prompt: string) {
  const workflow = { ...TEST_WORKFLOW };
  // Insert the prompt into the workflow
  workflow["6"].inputs.text = prompt;

  try {
    const response = await fetch(`https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/runsync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          workflow
        }
      })
    });

    const data = await response.json();
    console.log('RunPod response:', data); // Added for debugging
    
    if (data.status === 'COMPLETED') {
      return data.output.message;
    } else {
      throw new Error(`Image generation failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('RunPod API error:', error);
    throw new Error('Failed to generate image through RunPod');
  }
}

export async function testRunpodModels() {
  try {
    const response = await fetch(`https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/runsync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          // Special command to list available models
          prompt: "list_models"
        }
      })
    });

    const data = await response.json();
    console.log('Available models:', data);
    return data;
  } catch (error) {
    console.error('RunPod API error:', error);
    throw new Error('Failed to get model list from RunPod');
  }
} 