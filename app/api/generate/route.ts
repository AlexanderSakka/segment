import { readFileSync } from "fs";
import { join } from "path";
import type { Workflow } from "@/types/workflow";
import type { RunpodResponse } from "@/types/result";

async function pollResult(jobId: string) {
  const endpoint = `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/status/${jobId}`;
  
  // Increase timeout to 5 minutes (300 seconds)
  for (let i = 0; i < 300; i++) {
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

  throw new Error("Timeout waiting for result after 5 minutes");
}

export async function generateImage(inputImage: string, prompt: string) {
  try {
    // Extract base64 data from data URL
    const base64Data = inputImage.split(",")[1];

    // Use the fixed image name "7.jpg" as required by the workflow
    const imageName = "7.jpg";

    // Read the ComfyUI workflow JSON
    const workflowPath = join(process.cwd(), "workflows", "Segmentapi.json");
    const workflow = JSON.parse(readFileSync(workflowPath, "utf-8"));

    // The workflow is already configured to use "7.jpg" in node 131
    // No need to modify the workflow for the image name
    
    // If the workflow has a prompt node that needs updating, uncomment and adjust this line:
    // if (workflow["173"] && workflow["173"]["inputs"] && workflow["173"]["inputs"]["text2"]) {
    //   workflow["173"]["inputs"]["text2"] = prompt;
    // }

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
    
    // Add debug logging to see the structure of the result
    console.log("RunPod result structure:", JSON.stringify(result, null, 2));
    
    // Handle the response format
    if (result.status === "COMPLETED") {
      // Based on the logs, the message field contains the base64 image data
      // The log shows: "runpod-worker-comfy - the image was generated and converted to base64"
      
      let imageData = null;
      
      // Check for message field (common in RunPod responses)
      if (result.output?.message) {
        // From the logs, this is likely where the base64 image data is
        imageData = result.output.message;
        console.log("Found image data in message field");
      } 
      // Check for direct output string
      else if (typeof result.output === 'string') {
        imageData = result.output;
      }
      // Check for output array
      else if (Array.isArray(result.output) && result.output.length > 0) {
        // Try to find the image in the array
        for (const item of result.output) {
          if (typeof item === 'string' && (
              item.startsWith('data:image') || 
              item.match(/^[A-Za-z0-9+/=]+$/) // Basic check for base64
            )) {
            imageData = item;
            break;
          }
        }
      }
      // Check for image field
      else if (result.output?.image) {
        imageData = result.output.image;
      }
      // Check for files field (sometimes used by RunPod)
      else if (result.output?.files && Array.isArray(result.output.files) && result.output.files.length > 0) {
        imageData = result.output.files[0].data || result.output.files[0].url;
      }
      
      if (imageData) {
        // Log the first 100 characters of the image data for debugging
        console.log("Image data preview:", imageData.substring(0, 100) + "...");
        
        // Make sure we have a proper base64 string without data:image prefix
        if (imageData.startsWith('data:image')) {
          return { success: true, image: imageData };
        } else {
          // Validate that it looks like base64
          if (!/^[A-Za-z0-9+/=]+$/.test(imageData)) {
            console.warn("Image data doesn't appear to be valid base64");
            // Try to clean it up - remove any non-base64 characters
            imageData = imageData.replace(/[^A-Za-z0-9+/=]/g, '');
          }
          
          return { success: true, image: `data:image/png;base64,${imageData}` };
        }
      }
      
      // If we couldn't find image data in the expected places, return the full output for debugging
      return {
        success: false,
        error: "Could not extract image data from response",
        debug: result.output
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
        { success: false, error: "RunPod configuration missing" },
        { status: 500 }
      );
    }

    try {
      const result = await generateImage(image, prompt);
      return Response.json(result);
    } catch (error: any) {
      console.error("Error generating image:", error);
      
      // Check for timeout error
      if (error.message && error.message.includes("Timeout waiting for result")) {
        return Response.json(
          { 
            success: false, 
            error: "The image generation is taking longer than expected. Please try again or check the server logs.",
            isTimeout: true
          },
          { status: 504 } // Gateway Timeout status
        );
      }
      
      return Response.json(
        { success: false, error: error.message || "Failed to process request" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error parsing request:", error);
    return Response.json(
      { success: false, error: "Invalid request format" },
      { status: 400 }
    );
  }
} 