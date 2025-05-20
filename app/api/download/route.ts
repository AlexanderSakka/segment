import { NextResponse } from 'next/server'

// Increase timeout for large files
export const maxDuration = 60 // 60 seconds timeout

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 })
    }

    // Add timeout to fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'image/*'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const arrayBuffer = await response.arrayBuffer()
      const base64 = `data:${contentType};base64,${Buffer.from(arrayBuffer).toString('base64')}`

      return NextResponse.json({ 
        success: true, 
        data: { base64 }
      })
    } finally {
      clearTimeout(timeoutId)
    }

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to download image'
      },
      { status: 500 }
    )
  }
} 