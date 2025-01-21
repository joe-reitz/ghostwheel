"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface Activity {
  average_heartrate?: number
  moving_time: number
}

interface ZoneData {
  zone: string
  minutes: number
}

interface HeartRateZonesProps {
  activities: Activity[]
}

export function HeartRateZones({ activities }: HeartRateZonesProps) {
  // Calculate time spent in each heart rate zone
  const zoneRanges = [
    { name: "Zone 1", min: 0, max: 123 },
    { name: "Zone 2", min: 124, max: 144 },
    { name: "Zone 3", min: 145, max: 165 },
    { name: "Zone 4", min: 166, max: 185 },
    { name: "Zone 5", min: 186, max: 999 },
  ]

  const zoneData: ZoneData[] = zoneRanges.map((zone) => ({
    zone: zone.name,
    minutes: activities.reduce((total, activity) => {
      if (
        activity.average_heartrate &&
        activity.average_heartrate >= zone.min &&
        activity.average_heartrate < zone.max
      ) {
        return total + activity.moving_time / 60
      }
      return total
    }, 0),
  }))

  if (zoneData.every((zone) => zone.minutes === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Heart Rate Zones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No heart rate data available for the selected time period.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Heart Rate Zones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={zoneData}>
              <XAxis dataKey="zone" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => `${Math.round(value)}min`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0] as { value: number; payload: ZoneData }
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Zone</span>
                            <span className="font-bold">{data.payload.zone}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Time</span>
                            <span className="font-bold">{Math.round(data.value)}min</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default HeartRateZones

