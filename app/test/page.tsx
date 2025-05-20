'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function TestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);

  const testGenerate = async () => {
    setLoading(true);
    setError('');
    setStartTime(Date.now());
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            input_image: "https://firebasestorage.googleapis.com/v0/b/pixar-7765f.firebasestorage.app/o/1.jpeg?alt=media&token=ca2b50bb-56d1-44c6-aa82-5fa16b5201e9",
            prompt: "Make it look like a Pixar character",
            model: "model_1"
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data.resultImage);
      } else {
        setError(data.error || 'Failed to generate image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const elapsedTime = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

  return (
    <div className="container mx-auto p-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">RunPod API Test</h1>
        
        <Button 
          onClick={testGenerate}
          disabled={loading}
          className="w-full mb-4"
        >
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating... ({elapsedTime}s)
            </div>
          ) : (
            'Test Generate'
          )}
        </Button>

        {error && (
          <div className="text-red-500 p-4 rounded bg-red-50 mb-4">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Original Image:</h3>
              <img 
                src="https://firebasestorage.googleapis.com/v0/b/pixar-7765f.firebasestorage.app/o/1.jpeg?alt=media&token=ca2b50bb-56d1-44c6-aa82-5fa16b5201e9" 
                alt="Original" 
                className="rounded-lg shadow-md max-w-md"
              />
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Generated Image:</h3>
              <img 
                src={result} 
                alt="Generated" 
                className="rounded-lg shadow-md max-w-md"
              />
              <p className="text-sm text-gray-500 mt-2">
                Generation took {elapsedTime} seconds
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 