"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, Title, Text, Metric, AreaChart, BarChart, DonutChart, LineChart, Grid, Flex, Badge } from "@tremor/react"
import { Loader2, TrendingUp, TrendingDown, ActivityIcon, Heart, Zap, Mountain } from "lucide-react"
import { formatDuration, metersToMiles } from "@/lib/utils"
import dynamic from "next/dynamic"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Dynamically import AIAnalysis
const AIAnalysis = dynamic(() => import("@/components/AIAnalysis"), { ssr: false })

interface StravaActivity {
  id: number
  name: string
  distance: number
  moving_time: number
  total_elevation_gain: number
  average_speed: number
  max_speed: number
  average_heartrate?: number
  max_heartrate?: number
  average_watts?: number
  weighted_average_watts?: number
  normalized_power?: number
  average_cadence?: number
  start_date: string
  suffer_score?: number
  heartrate?: number[]
  kilojoules?: number
  elev_high?: number
  elev_low?: number
  type: string
}

// Calculate power zones (assuming FTP of 250W for demo - in real app this would be user-configurable)
const calculatePowerZones = (watts: number, ftp = 250) => {
  const percentage = (watts / ftp) * 100
  if (percentage < 55) return { zone: 1, color: "gray", name: "Active Recovery" }
  if (percentage < 75) return { zone: 2, color: "blue", name: "Endurance" }
  if (percentage < 90) return { zone: 3, color: "green", name: "Tempo" }
  if (percentage < 105) return { zone: 4, color: "yellow", name: "Lactate Threshold" }
  if (percentage < 120) return { zone: 5, color: "orange", name: "VO2 Max" }
  return { zone: 6, color: "red", name: "Neuromuscular" }
}

// Calculate heart rate zones (assuming max HR of 190 for demo)
const calculateHRZones = (hr: number, maxHR = 190) => {
  const percentage = (hr / maxHR) * 100
  if (percentage < 60) return { zone: 1, color: "gray", name: "Recovery" }
  if (percentage < 70) return { zone: 2, color: "blue", name: "Aerobic Base" }
  if (percentage < 80) return { zone: 3, color: "green", name: "Aerobic" }
  if (percentage < 90) return { zone: 4, color: "yellow", name: "Lactate Threshold" }
  return { zone: 5, color: "red", name: "VO2 Max" }
}

export default function Dashboard() {
  const [activities, setActivities] = useState<StravaActivity[]>([])
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchActivities = async () => {
      const token = searchParams?.get("token")
      if (!token) {
        setError("No access token provided")
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=20", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch activities")
        }

        const data = await response.json()
        if (data.length > 0) {
          setActivities(data)
          setSelectedActivityId(data[0].id)
        } else {
          setError("No activities found")
        }
      } catch (err) {
        setError("Error fetching activities")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || activities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Text className="text-destructive">{error || "No activity data available"}</Text>
      </div>
    )
  }

  const activity = activities.find((a) => a.id === selectedActivityId) || activities[0]
  const previousActivity = activities[1] // For comparison

  // Calculate key metrics
  const avgPower = activity.average_watts || activity.weighted_average_watts || 0
  const powerZone = calculatePowerZones(avgPower)
  const hrZone = calculateHRZones(activity.average_heartrate || 0)

  // Performance comparison with previous ride
  const distanceChange = previousActivity
    ? ((activity.distance - previousActivity.distance) / previousActivity.distance) * 100
    : 0
  const speedChange = previousActivity
    ? ((activity.average_speed - previousActivity.average_speed) / previousActivity.average_speed) * 100
    : 0

  // Create elevation profile data (simulated - in real app would come from detailed activity data)
  const elevationData = Array.from({ length: 20 }, (_, i) => ({
    distance: (((activity.distance / 1000) * i) / 19).toFixed(1),
    elevation: Math.sin(i * 0.3) * (activity.total_elevation_gain * 0.3) + activity.total_elevation_gain * 0.5,
  }))

  // Power distribution data (simulated)
  const powerDistribution = [
    { zone: "Z1 (Recovery)", time: 25, color: "gray" },
    { zone: "Z2 (Endurance)", time: 35, color: "blue" },
    { zone: "Z3 (Tempo)", time: 20, color: "green" },
    { zone: "Z4 (Threshold)", time: 15, color: "yellow" },
    { zone: "Z5 (VO2)", time: 5, color: "orange" },
  ]

  // Recent performance trend
  const performanceData = activities
    .slice(0, 10)
    .reverse()
    .map((act, index) => ({
      ride: `Ride ${index + 1}`,
      power: act.average_watts || act.weighted_average_watts || 0,
      speed: act.average_speed * 2.237, // Convert to mph
      distance: act.distance / 1609.34, // Convert to miles
    }))

  return (
    <main className="p-4 mx-auto max-w-7xl space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <ActivityIcon className="w-6 h-6 text-primary" />
            <Title className="text-2xl font-bold text-primary">Ride Analysis Dashboard</Title>
          </div>
          <Text className="text-muted-foreground">{new Date(activity.start_date).toLocaleString()}</Text>
          <a
            href={`https://www.strava.com/activities/${activity.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FC4C02] hover:underline font-medium inline-flex items-center gap-1"
          >
            View on Strava →
          </a>
        </div>
        <Select value={selectedActivityId?.toString()} onValueChange={(value) => setSelectedActivityId(Number(value))}>
          <SelectTrigger className="w-[320px]">
            <SelectValue placeholder="Select a ride" />
          </SelectTrigger>
          <SelectContent>
            {activities.map((a) => (
              <SelectItem key={a.id} value={a.id.toString()}>
                {a.name} - {new Date(a.start_date).toLocaleDateString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Grid */}
      <Grid numItems={2} numItemsSm={3} numItemsLg={6} className="gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <Flex alignItems="start">
            <div>
              <Text className="text-blue-400">Distance</Text>
              <Metric className="text-white">{metersToMiles(activity.distance).toFixed(1)} mi</Metric>
              {distanceChange !== 0 && (
                <Flex className="mt-2" justifyContent="start">
                  {distanceChange > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <Text className={distanceChange > 0 ? "text-green-400" : "text-red-400"}>
                    {Math.abs(distanceChange).toFixed(1)}%
                  </Text>
                </Flex>
              )}
            </div>
          </Flex>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <Flex alignItems="start">
            <div>
              <Text className="text-green-400">Duration</Text>
              <Metric className="text-white">{formatDuration(activity.moving_time)}</Metric>
              <Text className="text-green-300 text-sm mt-1">{(activity.average_speed * 2.237).toFixed(1)} mph avg</Text>
            </div>
          </Flex>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <Flex alignItems="start">
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4 text-purple-400" />
              <Text className="text-purple-400">Elevation</Text>
            </div>
            <Metric className="text-white">{(activity.total_elevation_gain * 3.28084).toFixed(0)} ft</Metric>
            <Text className="text-purple-300 text-sm mt-1">
              {((activity.total_elevation_gain / (activity.distance / 1000)) * 100).toFixed(1)}% grade avg
            </Text>
          </Flex>
        </Card>

        {activity.average_heartrate && (
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
            <Flex alignItems="start">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />
                <Text className="text-red-400">Heart Rate</Text>
              </div>
              <Metric className="text-white">{Math.round(activity.average_heartrate)} bpm</Metric>
              <Badge color={hrZone.color} size="sm" className="mt-1">
                Zone {hrZone.zone} - {hrZone.name}
              </Badge>
            </Flex>
          </Card>
        )}

        {avgPower > 0 && (
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
            <Flex alignItems="start">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <Text className="text-yellow-400">Power</Text>
              </div>
              <Metric className="text-white">{Math.round(avgPower)} W</Metric>
              <Badge color={powerZone.color} size="sm" className="mt-1">
                Zone {powerZone.zone} - {powerZone.name}
              </Badge>
            </Flex>
          </Card>
        )}

        {activity.suffer_score && (
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
            <Flex alignItems="start">
              <div>
                <Text className="text-orange-400">Training Load</Text>
                <Metric className="text-white">{activity.suffer_score}</Metric>
                <Text className="text-orange-300 text-sm mt-1">Relative Effort</Text>
              </div>
            </Flex>
          </Card>
        )}
      </Grid>

      {/* Charts Section */}
      <Grid numItems={1} numItemsLg={2} className="gap-6">
        {/* Elevation Profile */}
        <Card className="bg-secondary/50 border-primary/20">
          <Title className="text-primary mb-4">Elevation Profile</Title>
          <AreaChart
            className="h-64"
            data={elevationData}
            index="distance"
            categories={["elevation"]}
            colors={["emerald"]}
            valueFormatter={(value) => `${Math.round(value)} ft`}
            yAxisWidth={60}
            showAnimation={true}
            curveType="natural"
          />
        </Card>

        {/* Performance Trends */}
        <Card className="bg-secondary/50 border-primary/20">
          <Title className="text-primary mb-4">Recent Performance Trend</Title>
          <LineChart
            className="h-64"
            data={performanceData}
            index="ride"
            categories={["power", "speed"]}
            colors={["yellow", "blue"]}
            valueFormatter={(value) => `${Math.round(value)}`}
            yAxisWidth={60}
            showAnimation={true}
          />
        </Card>
      </Grid>

      {/* Power and Heart Rate Analysis */}
      <Grid numItems={1} numItemsLg={2} className="gap-6">
        {avgPower > 0 && (
          <Card className="bg-secondary/50 border-primary/20">
            <Title className="text-primary mb-4">Power Zone Distribution</Title>
            <DonutChart
              className="h-64"
              data={powerDistribution}
              category="time"
              index="zone"
              colors={["gray", "blue", "green", "yellow", "orange"]}
              valueFormatter={(value) => `${value}%`}
              showAnimation={true}
            />
          </Card>
        )}

        {/* Weekly Training Load */}
        <Card className="bg-secondary/50 border-primary/20">
          <Title className="text-primary mb-4">Weekly Training Load</Title>
          <BarChart
            className="h-64"
            data={activities
              .slice(0, 7)
              .reverse()
              .map((act, i) => ({
                day: new Date(act.start_date).toLocaleDateString("en", { weekday: "short" }),
                load: act.suffer_score || 0,
                distance: act.distance / 1609.34,
              }))}
            index="day"
            categories={["load"]}
            colors={["purple"]}
            valueFormatter={(value) => `${Math.round(value)}`}
            yAxisWidth={60}
            showAnimation={true}
          />
        </Card>
      </Grid>

      {/* AI Analysis */}
      {activity && (
        <Card className="bg-secondary/50 border-primary/20">
          <AIAnalysis activity={activity} />
        </Card>
      )}
    </main>
  )
}
