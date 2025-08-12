"use client"

import { useState, useEffect } from "react"
import { Title, Text } from "@tremor/react"
import { Loader2, Brain } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface Activity {
  id: number
  name: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  type: string
  start_date: string
  average_speed: number
  max_speed: number
  average_watts?: number
  weighted_average_watts?: number
  kilojoules?: number
  average_heartrate?: number
  max_heartrate?: number
  suffer_score?: number
  description?: string
  average_cadence?: number
}

interface AIAnalysisProps {
  activity: Activity
}

export default function AIAnalysis({ activity }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const generateAnalysis = async () => {
      setIsLoading(true)
      setError(null)
      console.log("Generating AI analysis for activity:", JSON.stringify(activity, null, 2))
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ activity }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to generate analysis: ${response.status} ${response.statusText}. ${errorText}`)
        }

        const data = await response.json()
        console.log("Received AI analysis:", data.analysis)
        setAnalysis(data.analysis)
      } catch (err) {
        console.error("Error generating analysis:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    generateAnalysis()
  }, [activity])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-primary" />
        <Title className="text-xl text-primary">AI Performance Analysis</Title>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <Text className="text-muted-foreground">Analyzing your performance...</Text>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <Text className="text-red-400">{error}</Text>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
          <ReactMarkdown
            className="prose prose-invert max-w-none"
            components={{
              h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-3 text-primary" {...props} />,
              h2: ({ node, ...props }) => (
                <h2 className="text-lg font-semibold mb-2 mt-4 text-primary flex items-center gap-2" {...props} />
              ),
              h3: ({ node, ...props }) => <h3 className="text-md font-medium mb-2 mt-3 text-primary/80" {...props} />,
              p: ({ node, ...props }) => <p className="mb-3 text-gray-300 leading-relaxed" {...props} />,
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside mb-3 text-gray-300 space-y-1" {...props} />
              ),
              li: ({ node, ...props }) => <li className="mb-1" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-bold text-primary" {...props} />,
              em: ({ node, ...props }) => <em className="italic text-primary/80" {...props} />,
              code: ({ node, ...props }) => (
                <code className="bg-primary/20 text-primary px-1 py-0.5 rounded text-sm" {...props} />
              ),
            }}
          >
            {analysis}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}
