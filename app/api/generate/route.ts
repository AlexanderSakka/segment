import { readFileSync } from "fs";
import { join } from "path";
import type { Workflow } from "@/types/workflow";
import type { RunpodResponse } from "@/types/result";

async function pollResult(jobId: string) {
  const endpoint = `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/status/${jobId}`;
  
  for (let i = 0; i < 40; i++) { // Try for about 40 seconds (40 * 1000ms)
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
      },
    });

    const data = await response.json();
    
    if (data.status === "COMPLETED") {
      return data;
    } else if (data.status === "FAILED") {
      throw new Error("Job failed");
    }

    // Wait 1 second before next poll
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error("Timeout waiting for result");
}

export async function generateImage(inputImage: string, prompt: string) {
  try {
    // Extract base64 data from data URL
    const base64Data = inputImage.split(",")[1];

    // Generate a unique image name
    const imageName = `input-${Date.now()}.png`;

    // Read the ComfyUI workflow JSON
    const workflowPath = join(process.cwd(), "workflows", "Segmentapi.json");
    const workflow = JSON.parse(readFileSync(workflowPath, "utf-8"));

    // Replace prompt and image name in the workflow
    workflow["70"]["inputs"]["image"] = imageName;
    workflow["86"]["inputs"]["prompt"] = prompt;

    // Format the request body according to RunPod API requirements
    const requestBody = {
      input: {
        workflow: workflow,
        images: [
          {
            name: imageName,
            image: base64Data
          }
        ]
      }
    };

    // Make the API request to RunPod
    const endpoint = `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/run`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    
    // Poll for the result
    const result = await pollResult(data.id);
    
    // Handle the response format
    if (result.status === "COMPLETED" && result.output?.message) {
      return {
        success: true,
        image: `data:image/png;base64,${result.output.message}`
      };
    } else {
      throw new Error("Failed to generate image");
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { image, prompt } = await req.json();

    if (!process.env.RUNPOD_API_KEY || !process.env.RUNPOD_ENDPOINT_ID) {
      return Response.json(
        { error: "RunPod configuration missing" },
        { status: 500 }
      );
    }

    const result = await generateImage(image, prompt);
    return Response.json(result);
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 