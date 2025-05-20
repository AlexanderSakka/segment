import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { GeneratedImage } from '../types'

interface ImageDisplayProps {
  image: GeneratedImage | null
}

export function ImageDisplay({ image }: ImageDisplayProps) {
  if (!image) return null

  // Convert base64 to data URL if needed
  const imageSource = image.imageUrl.startsWith('data:') || image.imageUrl.startsWith('http') 
    ? image.imageUrl 
    : `data:image/png;base64,${image.imageUrl}`

  const handleDownload = () => {
    if (!imageSource) return
    
    // If it's a base64 image, create a downloadable link
    if (imageSource.startsWith('data:')) {
      const link = document.createElement('a')
      link.href = imageSource
      link.download = `generated-image-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // For regular URLs, open in new tab
      window.open(imageSource, '_blank')
    }
  }

  return (
    <div className="mt-4">
      <div className="relative w-[512px] h-[512px]">
        <Image
          src={imageSource}
          alt={image.prompt}
          fill
          style={{ objectFit: 'contain' }}
          className="rounded-lg shadow-md"
          unoptimized={imageSource.startsWith('data:')} // Disable optimization for base64 images
        />
      </div>
      <p className="mt-2 text-sm text-gray-600">{image.prompt}</p>
      <Button onClick={handleDownload} className="mt-2">
        Download Image
      </Button>
    </div>
  )
}