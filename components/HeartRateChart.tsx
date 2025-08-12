import { DonutChart, Legend } from "@tremor/react"

interface Activity {
  average_heartrate?: number
}

interface HeartRateChartProps {
  activities: Activity[]
}

export function HeartRateChart({ activities }: HeartRateChartProps) {
  if (!activities || activities.length === 0) {
    return <div>No heart rate data available</div>
  }

  const heartRateZones = activities.reduce(
    (acc, activity) => {
      if (activity.average_heartrate) {
        if (activity.average_heartrate < 123) acc.zone1++
        else if (activity.average_heartrate < 153) acc.zone2++
        else if (activity.average_heartrate < 169) acc.zone3++
        else if (activity.average_heartrate < 184) acc.zone4++
        else acc.zone5++
      }
      return acc
    },
    { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 },
  )

  const total = Object.values(heartRateZones).reduce((sum, value) => sum + value, 0)

  if (total === 0) {
    return <div>No valid heart rate data available</div>
  }

  const heartRateData = Object.entries(heartRateZones).map(([name, value]) => ({
    name,
    value: (value / total) * 100,
  }))

  return (
    <div className="mt-6">
      <DonutChart
        data={heartRateData}
        category="value"
        index="name"
        valueFormatter={(value) => `${value.toFixed(1)}%`}
        colors={["slate", "violet", "indigo", "rose", "cyan"]}
      />
      <Legend
        className="mt-3"
        categories={["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"]}
        colors={["slate", "violet", "indigo", "rose", "cyan"]}
      />
    </div>
  )
}
