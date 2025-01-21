"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WeeklyDistanceChart } from "./weekly-distance-chart"
import { HeartRateZones } from "./heart-rate-zones"
import { ElevationProfile } from "./elevation-profile"

interface StravaActivity {
  id: number
  name: string
  distance: number
  moving_time: number
  total_elevation_gain: number
  start_date: string
  average_heartrate?: number
  max_heartrate?: number
  average_watts?: number
}

interface StravaData {
  activities: StravaActivity[]
  totalDistance: number
  totalTime: number
  totalElevation: number
}

export function StravaDataDisplay({ accessToken }: { accessToken: string }) {
  const [stravaData, setStravaData] = useState<StravaData | null>(null)
  const [timeframe, setTimeframe] = useState("30") // Default to 30 days
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStravaData = async () => {
      setLoading(true)
      try {
        // Calculate the epoch timestamp for the start date based on timeframe
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - Number.parseInt(timeframe))
        const epochStart = Math.floor(startDate.getTime() / 1000)

        const response = await fetch(
          `https://www.strava.com/api/v3/athlete/activities?after=${epochStart}&per_page=200&access_token=${accessToken}`,
        )
        const activities: StravaActivity[] = await response.json()

        // Filter only cycling activities
        const cyclingActivities = activities.filter(
          (activity) =>
            activity.type === "Ride" ||
            activity.type === "GravelRide" ||
            activity.type === "VirtualRide" ||
            activity.type === "MountainBikeRide" ||
            activity.type === "EBikeRide",
        )

        const totalDistance = cyclingActivities.reduce((sum, activity) => sum + activity.distance, 0) / 1000 // Convert to km
        const totalTime = cyclingActivities.reduce((sum, activity) => sum + activity.moving_time, 0) / 3600 // Convert to hours
        const totalElevation = cyclingActivities.reduce((sum, activity) => sum + activity.total_elevation_gain, 0)

        setStravaData({
          activities: cyclingActivities,
          totalDistance,
          totalTime,
          totalElevation,
        })
      } catch (error) {
        console.error("Error fetching Strava data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (accessToken) {
      fetchStravaData()
    }
  }, [accessToken, timeframe])

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Strava Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stravaData) {
    return <div>No data available</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Activity Analysis</h2>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <h3 className="text-lg font-semibold">Total Distance</h3>
              <p className="text-3xl font-bold">{stravaData.totalDistance.toFixed(1)} km</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Total Time</h3>
              <p className="text-3xl font-bold">{stravaData.totalTime.toFixed(1)} hrs</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Total Elevation</h3>
              <p className="text-3xl font-bold">{Math.round(stravaData.totalElevation)} m</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <WeeklyDistanceChart activities={stravaData.activities} />
        <HeartRateZones activities={stravaData.activities} />
      </div>

      <ElevationProfile activities={stravaData.activities} />
    </div>
  )
}

