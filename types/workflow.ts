export interface Workflow {
  [key: string]: {
    inputs: {
      [key: string]: string | number | boolean | string[] | number[] | boolean[]; // Made inputs more flexible
    };
    class_type?: string;
    _meta?: {
      title: string;
    };
  };
} 