import { BarChart } from "@tremor/react"

interface Activity {
  start_date: string
  distance: number
}

interface WeeklyDistanceChartProps {
  activities: Activity[]
}

export function WeeklyDistanceChart({ activities }: WeeklyDistanceChartProps) {
  if (!activities || activities.length === 0) {
    return <div>No weekly distance data available</div>
  }

  const weeklyData = activities.reduce(
    (acc, activity) => {
      if (activity.start_date && activity.distance !== undefined) {
        const date = new Date(activity.start_date)
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
        const weekKey = weekStart.toISOString().split("T")[0]

        if (!acc[weekKey]) {
          acc[weekKey] = 0
        }
        acc[weekKey] += activity.distance / 1000 // Convert to km
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const chartdata = Object.entries(weeklyData)
    .map(([week, distance]) => ({
      week: `Week of ${new Date(week).toLocaleDateString()}`,
      distance: Number(distance.toFixed(1)),
    }))
    .reverse()
    .slice(0, 4) // Get last 4 weeks

  if (chartdata.length === 0) {
    return <div>No valid weekly distance data available</div>
  }

  return (
    <BarChart
      className="mt-6"
      data={chartdata}
      index="week"
      categories={["distance"]}
      colors={["purple"]}
      valueFormatter={(value) => `${value} km`}
      yAxisWidth={48}
    />
  )
}
