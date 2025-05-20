export interface RunpodJobOutput {
  message?: string;      // Expected for single base64 image output
  images?: string[];     // Fallback for array of base64 images
  status?: "success" | "error" | string; // More flexible status
  [key: string]: any;    // Allow other potential output fields
}

export interface RunpodResponse {
  id: string;
  status: "COMPLETED" | "FAILED" | "IN_PROGRESS" | "IN_QUEUE" | "CANCELLED" | string; // More flexible status
  output?: RunpodJobOutput;
  error?: {
    message?: string;
    [key: string]: any;
  };
  delayTime?: number;
  executionTime?: number;
  [key: string]: any; // Allow other potential top-level fields
}

// This is for the response from our API to the frontend
export interface ApiResponse {
  success: boolean;
  image?: string; // data:image/png;base64,...
  error?: string;
} 