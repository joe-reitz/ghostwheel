"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import AIAnalysis from "@/components/AIAnalysis"
import { Loader2 } from "lucide-react"
import {
  AreaChart,
  BarChart,
  Card as TremorCard,
  Title,
  Text,
  Tab,
  TabList,
  TabGroup,
  TabPanel,
  TabPanels,
  Metric,
  Flex,
  Grid,
  BadgeDelta,
  type DeltaType,
} from "@tremor/react"

interface Activity {
  id: number
  name: string
  distance: number
  moving_time: number
  average_speed: number
  average_cadence?: number
  average_watts?: number
  total_elevation_gain?: number
  start_date: string
}

function calculateDelta(activities: Activity[]): { value: number; type: DeltaType } {
  if (activities.length < 2) return { value: 0, type: "unchanged" }

  const latest = activities[0].distance
  const previous = activities[1].distance
  const percentChange = ((latest - previous) / previous) * 100

  return {
    value: Math.abs(Math.round(percentChange)),
    type: percentChange > 0 ? "increase" : percentChange < 0 ? "decrease" : "unchanged",
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}

function AnalysisContent() {
  const searchParams = useSearchParams()
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [daysToAnalyze, setDaysToAnalyze] = useState(30)
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState("weekly")

  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      fetchActivities(token)
    }
  }, [searchParams])

  const fetchActivities = async (token: string) => {
    setIsLoading(true)
    try {
      const after = new Date()
      after.setDate(after.getDate() - daysToAnalyze)
      const afterTimestamp = Math.floor(after.getTime() / 1000)

      const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${afterTimestamp}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setActivities(data)
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getChartData = () => {
    return activities
      .map((activity) => ({
        date: formatDate(activity.start_date),
        distance: Number((activity.distance / 1000).toFixed(2)),
        elevation: activity.total_elevation_gain || 0,
        speed: Number((activity.average_speed * 3.6).toFixed(2)),
      }))
      .reverse()
  }

  const getAggregatedData = () => {
    const data: Record<string, { distance: number; count: number }> = {}

    activities.forEach((activity) => {
      const date = new Date(activity.start_date)
      let key

      if (timeframe === "weekly") {
        const week = `${date.getFullYear()}-W${Math.ceil((date.getDate() + date.getDay()) / 7)}`
        key = `Week ${week.split("-W")[1]}`
      } else {
        key = date.toLocaleString("default", { month: "short" })
      }

      if (!data[key]) {
        data[key] = { distance: 0, count: 0 }
      }
      data[key].distance += activity.distance / 1000
      data[key].count += 1
    })

    return Object.entries(data).map(([date, stats]) => ({
      date,
      distance: Number(stats.distance.toFixed(2)),
      rides: stats.count,
    }))
  }

  const totalDistance = activities.reduce((sum, activity) => sum + activity.distance, 0) / 1000
  const averageSpeed = (activities.reduce((sum, activity) => sum + activity.average_speed, 0) / activities.length) * 3.6
  const delta = calculateDelta(activities)

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4 text-white">Ride Analysis</h1>
        <div className="flex gap-4 items-center">
          <Input
            type="number"
            value={daysToAnalyze}
            onChange={(e) => setDaysToAnalyze(Number(e.target.value))}
            placeholder="Days to analyze"
            className="w-48 bg-gray-900 border-purple-500/20 text-white"
          />
          <Button
            onClick={() => {
              const token = searchParams.get("token")
              if (token) fetchActivities(token)
            }}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Update
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center text-gray-400">No activities found in the selected time period</div>
      ) : (
        <>
          <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6 mb-6">
            <TremorCard className="bg-gray-900/50 border-purple-500/20">
              <Text>Total Distance</Text>
              <Metric>{totalDistance.toFixed(1)} km</Metric>
              <Flex justifyContent="start" className="mt-4">
                <BadgeDelta deltaType={delta.type}>{delta.value}% vs previous</BadgeDelta>
              </Flex>
            </TremorCard>
            <TremorCard className="bg-gray-900/50 border-purple-500/20">
              <Text>Average Speed</Text>
              <Metric>{averageSpeed.toFixed(1)} km/h</Metric>
            </TremorCard>
            <TremorCard className="bg-gray-900/50 border-purple-500/20">
              <Text>Total Rides</Text>
              <Metric>{activities.length}</Metric>
            </TremorCard>
          </Grid>

          <TabGroup className="mt-6">
            <TabList color="purple">
              <Tab>Performance</Tab>
              <Tab>Distance</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <TremorCard className="bg-gray-900/50 border-purple-500/20 mt-6">
                  <Title>Speed & Elevation</Title>
                  <AreaChart
                    className="mt-4 h-72"
                    data={getChartData()}
                    index="date"
                    categories={["speed", "elevation"]}
                    colors={["purple", "indigo"]}
                    valueFormatter={(number) => `${number.toFixed(1)}`}
                  />
                </TremorCard>
              </TabPanel>
              <TabPanel>
                <div className="mt-6">
                  <TabGroup>
                    <TabList color="purple">
                      <Tab onClick={() => setTimeframe("weekly")}>Weekly</Tab>
                      <Tab onClick={() => setTimeframe("monthly")}>Monthly</Tab>
                    </TabList>
                  </TabGroup>
                  <TremorCard className="bg-gray-900/50 border-purple-500/20 mt-6">
                    <Title>Distance Overview</Title>
                    <BarChart
                      className="mt-4 h-72"
                      data={getAggregatedData()}
                      index="date"
                      categories={["distance"]}
                      colors={["purple"]}
                      valueFormatter={(number) => `${number.toFixed(1)} km`}
                    />
                  </TremorCard>
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {activities.map((activity) => (
              <Card
                key={activity.id}
                className="cursor-pointer border-purple-500/20 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-900 transition-colors"
                onClick={() => setSelectedActivity(activity)}
              >
                <CardHeader>
                  <CardTitle className="text-white">{activity.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300">
                  <p>Distance: {(activity.distance / 1000).toFixed(2)} km</p>
                  <p>Time: {Math.floor(activity.moving_time / 60)} minutes</p>
                  <p>Avg Speed: {(activity.average_speed * 3.6).toFixed(2)} km/h</p>
                  {activity.total_elevation_gain && <p>Elevation Gain: {activity.total_elevation_gain}m</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {selectedActivity && <AIAnalysis activity={selectedActivity} />}
    </div>
  )
}

export default function AnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-4 flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      }
    >
      <AnalysisContent />
    </Suspense>
  )
}
