export interface Workflow {
  [key: string]: {
    inputs: {
      [key: string]: string | number | boolean
    }
    class_type?: string
  }
} 