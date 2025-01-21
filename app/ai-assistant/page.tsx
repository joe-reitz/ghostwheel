"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useStrava } from "@/lib/strava-context"

interface Activity {
  id: number
  name: string
  distance: number
  moving_time: number
  total_elevation_gain: number
  average_speed: number
  max_speed: number
  average_watts?: number
  weighted_average_watts?: number
  kilojoules?: number
  average_heartrate?: number
  max_heartrate?: number
  start_date: string
  sport_type: string
}

export default function AIAssistantPage() {
  const { accessToken } = useStrava()
  const [lastRide, setLastRide] = useState<Activity | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [goal, setGoal] = useState<string | null>(null)

  useEffect(() => {
    const fetchLastRide = async () => {
      if (!accessToken) {
        setError("Please connect your Strava account")
        return
      }

      try {
        const storedGoal = localStorage.getItem("cyclingGoal")
        if (storedGoal) {
          setGoal(storedGoal)
        }

        const response = await fetch(
          `https://www.strava.com/api/v3/athlete/activities?per_page=1&access_token=${accessToken}`,
        )

        if (!response.ok) {
          throw new Error("Failed to fetch Strava data")
        }

        const activities = await response.json()
        if (activities.length > 0) {
          setLastRide(activities[0])
        } else {
          setError("No activities found")
        }
      } catch (error) {
        setError("Error fetching ride data")
        console.error("Error fetching last ride:", error)
      }
    }

    fetchLastRide()
  }, [accessToken])

  const generateAnalysis = async () => {
    if (!lastRide) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/analyze-ride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ride: lastRide, goal }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate analysis")
      }

      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (error) {
      setError("Failed to generate analysis")
      console.error("Error generating analysis:", error)
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!lastRide) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>AI Training Assistant</CardTitle>
          <CardDescription>Get personalized advice based on your last ride and goal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Last Ride: {lastRide.name}</h3>
              <p className="text-sm text-muted-foreground">{new Date(lastRide.start_date).toLocaleDateString()}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium">Distance</p>
                <p className="text-2xl font-bold">{(lastRide.distance / 1000).toFixed(2)} km</p>
              </div>
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-2xl font-bold">{Math.floor(lastRide.moving_time / 60)} minutes</p>
              </div>
              <div>
                <p className="text-sm font-medium">Elevation Gain</p>
                <p className="text-2xl font-bold">{lastRide.total_elevation_gain} m</p>
              </div>
            </div>

            {goal && (
              <div>
                <p className="text-sm font-medium">Current Goal</p>
                <p className="text-lg font-semibold">{goal}</p>
              </div>
            )}

            {!analysis && !loading && (
              <Button onClick={generateAnalysis} className="w-full">
                Analyze Ride
              </Button>
            )}

            {loading && (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[85%]" />
              </div>
            )}

            {analysis && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">AI Analysis:</h4>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {analysis.split("\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

