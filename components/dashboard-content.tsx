"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, Title, DonutChart, Grid, Text, Metric, Flex, ProgressBar, Toggle, ToggleItem } from "@tremor/react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"

// Dynamically import AIAnalysis with no SSR
const AIAnalysis = dynamic(() => import("@/components/AIAnalysis"), { ssr: false })

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
  average_cadence?: number
  average_watts?: number
  weighted_average_watts?: number
  kilojoules?: number
  average_heartrate?: number
  max_heartrate?: number
  elev_high?: number
  elev_low?: number
  suffer_score?: number
  description?: string
  map?: {
    summary_polyline: string
    resource_state: number
    id: string
  }
}

export default function DashboardContent() {
  const [mounted, setMounted] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unit, setUnit] = useState<"km" | "mi">("km")
  const searchParams = useSearchParams()

  // Handle mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle data fetching
  useEffect(() => {
    if (!mounted) return

    const fetchActivity = async () => {
      const token = searchParams?.get("token")
      if (!token) {
        setError("No access token provided")
        setIsLoading(false)
        setInitialized(true)
        return
      }

      try {
        const response = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=1", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch activity")
        }

        const data = await response.json()
        if (data.length > 0) {
          setActivity(data[0])
        } else {
          setError("No recent activities found")
        }
      } catch (err) {
        setError("Error fetching activity")
        console.error(err)
      } finally {
        setIsLoading(false)
        setInitialized(true)
      }
    }

    fetchActivity()
  }, [mounted, searchParams])

  // Don't render anything until we're mounted and initialized
  if (!mounted || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (error || !activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error || "No activity data available"}</p>
        <Button asChild className="bg-purple-500 hover:bg-purple-600">
          <a href="/">Go back home</a>
        </Button>
      </div>
    )
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const convertDistance = (km: number) => {
    return unit === "km" ? km : km * 0.621371
  }

  const convertSpeed = (kmh: number) => {
    return unit === "km" ? kmh : kmh * 0.621371
  }

  const convertElevation = (meters: number) => {
    return unit === "km" ? meters : meters * 3.28084
  }

  const distanceUnit = unit === "km" ? "km" : "mi"
  const speedUnit = unit === "km" ? "km/h" : "mph"
  const elevationUnit = unit === "km" ? "m" : "ft"

  const speedData = [
    { name: "Average", value: convertSpeed((activity.average_speed || 0) * 3.6) },
    { name: "Max", value: convertSpeed((activity.max_speed || 0) * 3.6) },
  ]

  const heartRateData =
    activity.average_heartrate && activity.max_heartrate
      ? [
          { name: "Average", value: activity.average_heartrate },
          { name: "Max", value: activity.max_heartrate },
        ]
      : []

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-purple-500">Your Latest Ride</h1>

      <div className="mb-4 flex justify-end">
        <Toggle color="purple" defaultValue={unit} onValueChange={(value) => setUnit(value as "km" | "mi")}>
          <ToggleItem value="km" text="Kilometers" />
          <ToggleItem value="mi" text="Miles" />
        </Toggle>
      </div>

      <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6 mb-6">
        <Card className="bg-gray-900/50 border-purple-500/20">
          <Text>Distance</Text>
          <Metric>
            {convertDistance(activity.distance / 1000).toFixed(2)} {distanceUnit}
          </Metric>
        </Card>
        <Card className="bg-gray-900/50 border-purple-500/20">
          <Text>Duration</Text>
          <Metric>{formatDuration(activity.moving_time)}</Metric>
        </Card>
        <Card className="bg-gray-900/50 border-purple-500/20">
          <Text>Elevation Gain</Text>
          <Metric>
            {convertElevation(activity.total_elevation_gain).toFixed(0)} {elevationUnit}
          </Metric>
        </Card>
      </Grid>

      <Grid numItems={1} numItemsSm={2} className="gap-6 mb-6">
        <Card className="bg-gray-900/50 border-purple-500/20">
          <Title>Speed ({speedUnit})</Title>
          <DonutChart
            className="mt-6"
            data={speedData}
            category="value"
            index="name"
            colors={["purple", "indigo"]}
            valueFormatter={(value) => `${value.toFixed(1)} ${speedUnit}`}
          />
        </Card>
        {heartRateData.length > 0 && (
          <Card className="bg-gray-900/50 border-purple-500/20">
            <Title>Heart Rate (bpm)</Title>
            <DonutChart
              className="mt-6"
              data={heartRateData}
              category="value"
              index="name"
              colors={["red", "rose"]}
              valueFormatter={(value) => `${value.toFixed(0)} bpm`}
            />
          </Card>
        )}
      </Grid>

      {/* Power */}
      <Card className="bg-secondary aspect-square p-2">
        <div className="h-full flex flex-col items-center justify-center">
          <Text className="text-secondary-foreground text-xs">Power</Text>
          {activity.weighted_average_watts ? (
            <>
              <Metric className="text-primary text-xl">{Math.round(activity.weighted_average_watts)}</Metric>
              <Text className="text-secondary-foreground text-xs">watts</Text>
            </>
          ) : (
            <Text className="text-secondary-foreground text-xs">No data</Text>
          )}
        </div>
      </Card>

      {activity.suffer_score && (
        <Card className="mb-6 bg-gray-900/50 border-purple-500/20">
          <Title>Relative Effort</Title>
          <Flex className="mt-4">
            <Text>Suffer Score</Text>
            <Text>{activity.suffer_score}</Text>
          </Flex>
          <ProgressBar value={activity.suffer_score} className="mt-2" color="purple" />
        </Card>
      )}

      {activity && <AIAnalysis activity={activity} unit={unit} />}
    </div>
  )
}
