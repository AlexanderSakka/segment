"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function ImageGenerator() {
  const [imageUrl, setImageUrl] = useState<string>("")
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string>("")
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async () => {
    if (!imageUrl) {
      alert("Please upload an image first")
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setStatusMessage("Preparing your image...")
    
    // Start progress timer with status messages for a longer waiting period
    // Progress will reach ~90% in about 4 minutes, leaving room for completion
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          // Don't clear the interval, just stop incrementing
          return prev
        }
        
        // Update status message based on progress
        if (prev < 10) {
          setStatusMessage("Processing image...")
        } else if (prev < 20) {
          setStatusMessage("Applying PIXAR styling...")
        } else if (prev < 30) {
          setStatusMessage("Preserving facial features...")
        } else if (prev < 40) {
          setStatusMessage("Enhancing details...")
        } else if (prev < 50) {
          setStatusMessage("Generating PIXAR style...")
        } else if (prev < 60) {
          setStatusMessage("Refining the image...")
        } else if (prev < 70) {
          setStatusMessage("Almost there...")
        } else if (prev < 80) {
          setStatusMessage("Final touches...")
        } else {
          setStatusMessage("Waiting for response...")
        }
        
        // Slower increment for longer waiting time
        // This will take about 4-5 minutes to reach 90%
        return prev + 0.4
      })
    }, 1000)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageUrl,
          prompt: prompt || "PIXAR style", // Provide a default prompt if empty
        }),
      })

      const data = await response.json()
      
      // Log the response for debugging
      console.log("API response:", data)
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image")
      }
      
      if (data.success && data.image) {
        setProgress(100)
        setGeneratedImage(data.image)
        setStatusMessage("Image generated successfully!")
      } else if (data.isTimeout) {
        // Special handling for timeout errors
        setStatusMessage("Generation is taking longer than expected")
        throw new Error("The image generation is taking longer than expected. Please try again in a few minutes.")
      } else if (data.debug) {
        // If we got a debug response instead of an image
        console.error("Received debug data instead of image:", data.debug)
        throw new Error("Image data not found in response")
      } else {
        throw new Error(data.error || "No image data received")
      }
    } catch (error: any) {
      console.error("Error generating image:", error)
      setStatusMessage(`Error: ${error.message || "Failed to generate image"}`)
      
      // Show a more user-friendly alert for timeout errors
      if (error.message && error.message.includes("taking longer than expected")) {
        alert("The image generation is taking longer than expected. This could be due to high server load. Please try again in a few minutes.")
      } else {
        alert(`Error: ${error.message || "Failed to generate image"}. Check console for details.`)
      }
    } finally {
      clearInterval(progressInterval)
      setIsGenerating(false)
      // Only reset progress if there was an error
      if (!generatedImage) {
        setProgress(0)
      }
    }
  }

  return (
    <main className="container mx-auto max-w-2xl py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-4">AI Image Generator</h1>
      
      <div className="text-center mb-8 text-gray-600">
        <p>Upload a photo and transform it into a beautiful PIXAR-style image.</p>
        <p className="text-sm mt-2">Our AI preserves facial features while applying the iconic PIXAR animation style.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div
            className="border-2 border-dashed rounded-lg p-12 text-center mb-6"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleUpload} />
            {imageUrl ? (
              <img src={imageUrl || "/placeholder.svg"} alt="Uploaded image" className="max-w-full h-auto mx-auto" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8" />
                <span>Upload an image</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="prompt" className="text-sm font-medium">
                Prompt <span className="text-xs text-gray-500">(Optional)</span>
              </label>
              <Input
                id="prompt"
                placeholder="Add custom instructions or leave empty for default PIXAR style"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <Button 
              className="w-full relative" 
              onClick={handleGenerate} 
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span>{statusMessage} {progress.toFixed(0)}%</span>
                  <div 
                    className="absolute left-0 bottom-0 h-1 bg-primary-foreground transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </>
              ) : (
                "Generate PIXAR Style Image"
              )}
            </Button>
            
            <p className="text-xs text-center text-gray-500 mt-2">
              Image generation may take up to 5 minutes. Please be patient while we create your PIXAR-style image.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Generated Image Card */}
      {generatedImage && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="rounded-lg overflow-hidden">
              <img 
                src={generatedImage} 
                alt="Generated image" 
                className="max-w-full h-auto mx-auto"
                onError={(e) => {
                  console.error("Error loading image:", e)
                  alert("Error displaying the generated image. The image data may be invalid.")
                  setGeneratedImage("")
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}

