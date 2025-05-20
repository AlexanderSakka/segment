'use client'

import { useState } from 'react'
import { GeneratedImage } from '../types'
import { generateImageAction } from '../actions/generateImage'
import { ImageDisplay } from './ImageDisplay'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export function ImageGenerator() {
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null)
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<any>(null)

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await generateImageAction(trimmedPrompt)
      if (!result) {
        throw new Error('No response from image generation')
      }
      setGeneratedImage(result)
      setPrompt('')
    } catch (error) {
      console.error('Error generating image:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate image')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setConnectionStatus({ message: 'Testing connection...' })
    try {
      const response = await fetch('/api/s3-test')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setConnectionStatus(result)
    } catch (error) {
      console.error('Connection test error:', error)
      setConnectionStatus({
        success: false,
        message: 'Failed to connect to S3',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-2">
        <Input
          type="text"
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isLoading && prompt.trim()) {
              e.preventDefault()
              handleGenerate()
            }
          }}
          placeholder="Describe the image you want to generate..."
          className="flex-grow"
          disabled={isLoading}
        />
        <Button 
          onClick={handleGenerate} 
          disabled={isLoading || !prompt.trim()}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating
            </>
          ) : (
            'Generate'
          )}
        </Button>
      </div>

      <Button 
        onClick={handleTestConnection} 
        variant="outline"
        className="w-full"
      >
        Test S3 Connection
      </Button>

      {connectionStatus && (
        <Alert variant={connectionStatus.success ? 'default' : 'destructive'}>
          <AlertTitle>
            {connectionStatus.success ? 'Connection Successful' : 'Connection Failed'}
          </AlertTitle>
          <AlertDescription>
            <p>{connectionStatus.message}</p>
            {connectionStatus.details && (
              <pre className="mt-2 text-sm bg-muted p-2 rounded">
                {JSON.stringify(connectionStatus.details, null, 2)}
              </pre>
            )}
          </AlertDescription>
        </Alert>
      )}

      <ImageDisplay 
        image={generatedImage} 
        className={isLoading ? 'opacity-50' : ''}
      />
    </div>
  )
}

