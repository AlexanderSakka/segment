"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ImageGenerator() {
  const [clothingImageUrl, setClothingImageUrl] = useState<string>("")
  const [modelImageUrl, setModelImageUrl] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string>("")
  const [progress, setProgress] = useState(0)

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setImageUrl: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      // Add file size validation (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        // Consider using a toast notification for errors
        alert("File size exceeds 5MB. Please upload a smaller image.");
        return;
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async () => {
    if (!clothingImageUrl || !modelImageUrl) return

    setIsGenerating(true)
    setProgress(0)
    setGeneratedImage("") 
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 2
      })
    }, 800) 

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productImage: clothingImageUrl,
          modelImage: modelImageUrl,
          prompt: "shirt", 
        }),
      })

      const data = await response.json()
      
      clearInterval(progressInterval) 

      if (!response.ok || !data.success) {
        console.error("API Error:", data.error || "Failed to generate image")
        // Consider using a toast notification for errors
        alert(`Error generating image: ${data.error || "Unknown error"}`);
        throw new Error(data.error || "Failed to generate image")
      }

      setProgress(100)
      setGeneratedImage(data.image)
    } catch (error) {
      console.error("Error generating image:", error)
      // Consider using a toast notification for errors
      alert(`Error generating image: ${error instanceof Error ? error.message : "An unexpected error occurred"}`);
      clearInterval(progressInterval) 
      setProgress(0) 
    } finally {
      setIsGenerating(false)
    }
  }

  const ImageUploadCard = ({ title, imageUrl, onImageUpload, uploadId }: {
    title: string,
    imageUrl: string,
    onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void,
    uploadId: string
  }) => (
    <Card className="mb-6 flex-1">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold text-center mb-4">{title}</h2>
        <div
          className="border-2 border-dashed rounded-lg p-12 text-center mb-6 cursor-pointer min-h-[200px] flex flex-col justify-center items-center"
          onClick={() => document.getElementById(uploadId)?.click()}
        >
          <input id={uploadId} type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
          {imageUrl ? (
            <img src={imageUrl} alt={`${title} preview`} className="max-w-full h-auto mx-auto max-h-64" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8" />
              <span>Upload an image</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className="container mx-auto max-w-4xl py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">AI Image Generator</h1>

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <ImageUploadCard 
          title="Clothing Image" 
          imageUrl={clothingImageUrl} 
          onImageUpload={(e) => handleImageUpload(e, setClothingImageUrl)} 
          uploadId="clothing-image-upload"
        />
        <ImageUploadCard 
          title="Model Image" 
          imageUrl={modelImageUrl} 
          onImageUpload={(e) => handleImageUpload(e, setModelImageUrl)} 
          uploadId="model-image-upload"
        />
      </div>

      <div className="mb-6">
        <Button 
          className="w-full relative h-12 text-lg"
          onClick={handleGenerate} 
          disabled={isGenerating || !clothingImageUrl || !modelImageUrl}
        >
          {isGenerating ? (
            <>
              <span>Generating... {progress}%</span>
              <div 
                className="absolute left-0 bottom-0 h-full bg-primary/30 transition-all duration-300 -z-10"
                style={{ width: `${progress}%` }}
              />
            </>
          ) : (
            "Generate Image"
          )}
        </Button>
      </div>

      {isGenerating && progress < 100 && (
        <div className="text-center text-muted-foreground mb-4">
          Please wait, image generation can take up to 40 seconds...
        </div>
      )}

      {generatedImage && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold text-center mb-4">Generated Image</h2>
            <div className="rounded-lg overflow-hidden border">
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

