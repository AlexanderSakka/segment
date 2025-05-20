import { readFileSync } from "fs";
import { join } from "path";
// Attempting to fix type imports with relative paths
import type { Workflow } from "../../../types/workflow";
import type { RunpodResponse } from "../../../types/result";

async function pollResult(jobId: string) {
  const endpoint = `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/status/${jobId}`;
  
  // Poll for 3 minutes (180 attempts * 1 second delay = 180 seconds)
  for (let i = 0; i < 180; i++) { 
    console.log(`Polling job ${jobId}, attempt ${i + 1}/180`); // Added polling log
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
      },
    });

    const data: RunpodResponse = await response.json(); // Explicitly type data
    
    if (data.status === "COMPLETED") {
      console.log(`Job ${jobId} completed.`, data);
      return data;
    } else if (data.status === "FAILED") {
      console.error(`RunPod job ${jobId} failed on RunPod side. Full status:`, data);
      throw new Error(data.error?.message || `Job failed on RunPod. Status: ${data.status}`);
    } else if (data.status === "IN_PROGRESS" || data.status === "IN_QUEUE") {
      // Continue polling
    } else {
      // Unexpected status
      console.warn(`Job ${jobId} has unexpected status: ${data.status}`, data);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.error(`Timeout waiting for RunPod job ${jobId} to complete after 3 minutes.`);
  throw new Error("Timeout waiting for RunPod job to complete after 3 minutes");
}

export async function generateImage(productImageBase64Url: string, modelImageBase64Url: string, prompt: string) {
  console.log("generateImage called with prompt:", prompt);
  // Avoid logging full base64 strings to keep logs cleaner, log lengths instead
  console.log("Product Image URL length:", productImageBase64Url.length);
  console.log("Model Image URL length:", modelImageBase64Url.length);

  try {
    const productBase64Data = productImageBase64Url.split(",")[1];
    const modelBase64Data = modelImageBase64Url.split(",")[1];

    if (!productBase64Data || !modelBase64Data) {
        throw new Error("Failed to extract base64 data from one or both image URLs.");
    }
    console.log("Extracted base64 data for product and model images.");

    const productImageName = `product-${Date.now()}.png`;
    const modelImageName = `model-${Date.now()}.png`;

    const workflowPath = join(process.cwd(), "workflows", "gelato_swap_20250519_dev_api.json");
    console.log(`Loading workflow from: ${workflowPath}`);
    // Basic check if file exists (readFileSync will throw if not found, which is handled by catch)
    const workflowFileContent = readFileSync(workflowPath, "utf-8");
    const workflow: Workflow = JSON.parse(workflowFileContent);
    console.log("Workflow loaded and parsed successfully.");

    if (workflow["12"] && workflow["12"].inputs) {
      workflow["12"].inputs["image"] = productImageName;
    } else {
      console.warn("Workflow node '12' (product image) or its inputs are undefined. Product image name not set.");
    }

    if (workflow["13"] && workflow["13"].inputs) {
      workflow["13"].inputs["image"] = modelImageName;
    } else {
      console.warn("Workflow node '13' (model image) or its inputs are undefined. Model image name not set.");
    }
    
    if (workflow["148"] && workflow["148"].inputs) {
      workflow["148"].inputs["prompt"] = prompt;
    } else {
      console.warn("Workflow node '148' (prompt) or its inputs are undefined. Prompt not set.");
    }
    
    const requestBody = {
      input: {
        workflow: workflow,
        images: [
          { name: productImageName, image: productBase64Data }, // Base64 data without prefix
          { name: modelImageName, image: modelBase64Data }   // Base64 data without prefix
        ]
      }
    };

    console.log("Sending request to RunPod /run endpoint with body (workflow object not fully logged for brevity):");
    console.log({ input: { images: requestBody.input.images, workflow_keys: Object.keys(requestBody.input.workflow) } });

    const runEndpoint = `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/run`;
    const runResponse = await fetch(runEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const runData: RunpodResponse = await runResponse.json(); // Explicitly type runData
    console.log("Initial response from RunPod /run endpoint:", runData);

    if (!runResponse.ok || !runData.id) {
      console.error("RunPod /run request failed. Status:", runResponse.status, "Response data:", runData);
      throw new Error(runData.error?.message || `Failed to initiate job on RunPod. Status: ${runResponse.status}`);
    }
    
    console.log(`RunPod job started with ID: ${runData.id}. Starting to poll for results.`);
    const result = await pollResult(runData.id);
    
    if (result.status === "COMPLETED" && result.output?.message) {
      console.log("RunPod job output (message):");
      return {
        success: true,
        image: `data:image/png;base64,${result.output.message}`
      };
    } else if (result.status === "COMPLETED" && result.output?.images && Array.isArray(result.output.images) && result.output.images.length > 0) {
        console.log("RunPod job output (images array):");
        return {
          success: true,
          image: `data:image/png;base64,${result.output.images[0]}`
        };
    } else {
      console.error("RunPod job did not complete with expected output format:", result);
      throw new Error(result.error?.message || "Failed to generate image or unexpected output format from RunPod.");
    }
  } catch (error) {
    // Log the full error object if it's an instance of Error for more details
    if (error instanceof Error) {
        console.error("Error in generateImage function:", error.message, error.stack);
    }
    console.error("Error details in generateImage:", error);
    throw error; 
  }
}

export async function POST(req: Request) {
  try {
    const { productImage, modelImage, prompt } = await req.json();

    if (!productImage || !modelImage || !prompt) {
      return Response.json(
        { success: false, error: "Missing productImage, modelImage, or prompt in request body" },
        { status: 400 }
      );
    }

    if (!process.env.RUNPOD_API_KEY || !process.env.RUNPOD_ENDPOINT_ID) {
      return Response.json(
        { success: false, error: "RunPod API Key or Endpoint ID not configured on the server." },
        { status: 500 }
      );
    }

    const result = await generateImage(productImage, modelImage, prompt);
    return Response.json(result); 
  } catch (error: any) {
    console.error(`Error in POST /api/generate: ${error.message}`, { stack: error.stack, details: error });
    return Response.json(
      { success: false, error: error.message || "Failed to process request due to an internal server error." },
      { status: 500 }
    );
  }
} 