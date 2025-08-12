import { Card, Metric, Text, Grid } from "@tremor/react"

interface Activity {
  distance: number
  moving_time: number
  total_elevation_gain: number
}

interface RideSummaryProps {
  activities: Activity[]
}

export function RideSummary({ activities }: RideSummaryProps) {
  if (!activities || activities.length === 0) {
    return <Text>No activities data available</Text>
  }

  const totalDistance = activities.reduce((sum, activity) => sum + (activity.distance || 0), 0) / 1000
  const totalTime = activities.reduce((sum, activity) => sum + (activity.moving_time || 0), 0)
  const totalElevation = activities.reduce((sum, activity) => sum + (activity.total_elevation_gain || 0), 0)

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <Grid numItemsLg={3} className="gap-6">
      <Card className="bg-gray-900/50 border-purple-500/20">
        <Text>Total Distance</Text>
        <Metric className="text-purple-500">{totalDistance.toFixed(1)} km</Metric>
      </Card>
      <Card className="bg-gray-900/50 border-purple-500/20">
        <Text>Total Time</Text>
        <Metric className="text-purple-500">{formatDuration(totalTime)}</Metric>
      </Card>
      <Card className="bg-gray-900/50 border-purple-500/20">
        <Text>Elevation Gain</Text>
        <Metric className="text-purple-500">{totalElevation.toFixed(0)} m</Metric>
      </Card>
    </Grid>
  )
}
