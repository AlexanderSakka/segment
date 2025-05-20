'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface GeneratedImageProps {
  imageUrl: string
  alt?: string
}

export default function GeneratedImage({ imageUrl, alt = 'Generated image' }: GeneratedImageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageHeight, setImageHeight] = useState<number>(0)

  useEffect(() => {
    if (imageUrl) {
      setLoading(true)
      setError(null)
      
      // Pre-load the image to get dimensions
      const img = document.createElement('img')
      img.src = imageUrl
      img.onload = () => {
        // Calculate height maintaining aspect ratio
        const aspectRatio = img.height / img.width
        setImageHeight(Math.round(aspectRatio * 640)) // assuming max width of 640px
        setLoading(false)
      }
      img.onerror = () => {
        setError('Failed to load image')
        setLoading(false)
      }
    }
  }, [imageUrl])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="relative w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      )}
      <div 
        className="relative rounded-lg overflow-hidden"
        style={{ height: imageHeight || 400 }}
      >
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className={`object-contain transition-opacity duration-300 ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
          priority
        />
      </div>
    </div>
  )
} 