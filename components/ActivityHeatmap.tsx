import { ResponsiveContainer, Tooltip, XAxis, YAxis, HeatmapChart, Heatmap } from "recharts"

interface Activity {
  start_date: string
}

interface ActivityHeatmapProps {
  activities: Activity[]
}

export function ActivityHeatmap({ activities }: ActivityHeatmapProps) {
  if (!activities || activities.length === 0) {
    return <div>No activity data available for heatmap</div>
  }

  const activityCounts = activities.reduce(
    (acc, activity) => {
      if (activity.start_date) {
        const date = new Date(activity.start_date)
        const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()]
        const hour = date.getHours()
        const key = `${day}-${hour}`
        acc[key] = (acc[key] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const data = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].flatMap((day) =>
    Array.from({ length: 24 }, (_, hour) => ({
      day,
      hour: `${hour.toString().padStart(2, "0")}:00`,
      value: activityCounts[`${day}-${hour}`] || 0,
    })),
  )

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`)

  return (
    <div className="mt-6 h-80">
      <ResponsiveContainer width="100%" height="100%">
        <HeatmapChart data={data}>
          <XAxis dataKey="day" type="category" tickLine={false} axisLine={false} />
          <YAxis dataKey="hour" type="category" tickLine={false} axisLine={false} />
          <Heatmap dataKey="value" stroke="#fff" />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="bg-gray-800 p-2 rounded shadow">
                    <p className="text-white">{`${data.day} ${data.hour}`}</p>
                    <p className="text-purple-500">{`Activities: ${data.value}`}</p>
                  </div>
                )
              }
              return null
            }}
          />
        </HeatmapChart>
      </ResponsiveContainer>
    </div>
  )
}
