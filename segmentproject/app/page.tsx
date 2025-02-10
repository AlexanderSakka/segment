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
    if (!prompt || !imageUrl) return

    setIsGenerating(true)
    setProgress(0)
    
    // Start progress timer
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 2
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
          prompt: prompt,
        }),
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate image")
      }

      setProgress(100)
      setGeneratedImage(data.image)
    } catch (error) {
      console.error("Error generating image:", error)
    } finally {
      clearInterval(progressInterval)
      setIsGenerating(false)
      setProgress(0)
    }
  }

  return (
    <main className="container mx-auto max-w-2xl py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">AI Image Generator</h1>

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
                Prompt
              </label>
              <Input
                id="prompt"
                placeholder="Enter your prompt..."
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
                  <span>Generating... {progress}%</span>
                  <div 
                    className="absolute left-0 bottom-0 h-1 bg-primary-foreground transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </>
              ) : (
                "Generate"
              )}
            </Button>
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
              />
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}

