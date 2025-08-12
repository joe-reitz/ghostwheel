import { LineChart } from "@tremor/react"

interface Activity {
  start_date: string
  average_speed: number
}

interface SpeedChartProps {
  activities: Activity[]
}

export function SpeedChart({ activities }: SpeedChartProps) {
  if (!activities || activities.length === 0) {
    return <div>No speed data available</div>
  }

  const chartdata = activities
    .filter((activity) => activity.start_date && activity.average_speed !== undefined)
    .map((activity) => ({
      date: new Date(activity.start_date).toLocaleDateString(),
      speed: activity.average_speed * 3.6, // Convert m/s to km/h
    }))
    .reverse()

  if (chartdata.length === 0) {
    return <div>No valid speed data available</div>
  }

  return (
    <LineChart
      className="mt-6"
      data={chartdata}
      index="date"
      categories={["speed"]}
      colors={["purple"]}
      yAxisWidth={40}
      valueFormatter={(value) => `${value.toFixed(1)} km/h`}
    />
  )
}
