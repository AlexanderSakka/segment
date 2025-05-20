import Image from 'next/image'
import { GeneratedImage } from '../types'

interface HistorySectionProps {
  history: GeneratedImage[]
}

export function HistorySection({ history }: HistorySectionProps) {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Generation History</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {history.map((item) => (
          <div key={item.id} className="border rounded-lg p-2">
            <Image
              src={item.imageUrl}
              alt={item.prompt}
              width={128}
              height={128}
              className="rounded-lg"
            />
            <p className="mt-2 text-sm text-gray-600 truncate">{item.prompt}</p>
            <p className="text-xs text-gray-400">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

