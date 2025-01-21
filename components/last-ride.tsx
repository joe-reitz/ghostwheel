"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, Map, TrendingUp } from "lucide-react"

interface StravaActivity {
  id: number
  name: string
  type: string
  distance: number
  moving_time: number
  total_elevation_gain: number
  start_date: string
  average_speed: number
  max_speed: number
  sport_type: string
}

export function LastRide({ accessToken }: { accessToken: string }) {
  const [activity, setActivity] = useState<StravaActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLastRide = async () => {
      try {
        // Fetch more activities to ensure we find a ride
        const response = await fetch(
          `https://www.strava.com/api/v3/athlete/activities?per_page=50&access_token=${accessToken}`,
        )

        if (!response.ok) {
          throw new Error("Failed to fetch activities")
        }

        const activities: StravaActivity[] = await response.json()

        // Find the most recent ride activity by filtering first, then taking the first result
        const rides = activities.filter(
          (activity) =>
            activity.sport_type === "Ride" ||
            activity.sport_type === "GravelRide" ||
            activity.sport_type === "VirtualRide" ||
            activity.sport_type === "MountainBikeRide" ||
            activity.sport_type === "EBikeRide",
        )

        const lastRide = rides[0] // Get the most recent ride (activities are returned in reverse chronological order)

        if (!lastRide) {
          setError("No ride activities found in your recent history")
          setLoading(false)
          return
        }

        setActivity(lastRide)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch last ride")
        setLoading(false)
      }
    }

    if (accessToken) {
      fetchLastRide()
    }
  }, [accessToken])

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Last Ride</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Last Ride</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!activity) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last Ride</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold">{activity.name}</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(activity.start_date).toLocaleDateString()} - {activity.sport_type}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Distance</p>
                <p className="text-lg">{(activity.distance / 1000).toFixed(2)} km</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-lg">
                  {Math.floor(activity.moving_time / 3600)}h {Math.floor((activity.moving_time % 3600) / 60)}m
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Elevation</p>
                <p className="text-lg">{Math.round(activity.total_elevation_gain)}m</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

