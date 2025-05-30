export const RUNPOD_CONFIG = {
  API_KEY: process.env.RUNPOD_API_KEY,
  ENDPOINT_ID: process.env.RUNPOD_ENDPOINT_ID,
  // Basic SDXL workflow for testing
  DEFAULT_WORKFLOW: {
    "3": {
      "inputs": {
        "seed": 1337,
        "steps": 20,
        "cfg": 8,
        "sampler_name": "euler",
        "scheduler": "normal",
        "denoise": 1,
        "model": ["4",0],
        "positive": ["6",0],
        "negative": ["7",0],
        "latent_image": ["5",0]
      },
      "class_type": "KSampler"
    },
    "4": {
      "inputs": {
        "ckpt_name": "sd_xl_base_1.0.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "5": {
      "inputs": {
        "width": 512,
        "height": 512,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage"
    },
    "6": {
      "inputs": {
        "text": "",  // Will be filled with the prompt
        "clip": ["4",1]
      },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": {
        "text": "text, watermark",
        "clip": ["4",1]
      },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": {
        "samples": ["3",0],
        "vae": ["4",2]
      },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": {
        "filename_prefix": "ComfyUI",
        "images": ["8",0]
      },
      "class_type": "SaveImage"
    }
  }
}; 