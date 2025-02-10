export interface RunpodResponse {
  delayTime: number
  executionTime: number
  id: string
  output: {
    message: string // base64 encoded image
    status: "success" | "error"
  }
  status: "COMPLETED" | "FAILED" | "IN_PROGRESS"
} 