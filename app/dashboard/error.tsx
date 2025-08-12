"use client"

import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-red-500">Something went wrong!</h2>
      <p className="text-gray-400 mb-4">{error.message}</p>
      <div className="space-x-4">
        <Button onClick={reset} className="bg-purple-500 hover:bg-purple-600">
          Try again
        </Button>
        <Button asChild className="bg-gray-700 hover:bg-gray-600">
          <a href="/">Go home</a>
        </Button>
      </div>
    </div>
  )
}
