"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface Activity {
  total_elevation_gain: number
  start_date: string
  name: string
}

export function ElevationProfile({ activities }: { activities: Activity[] }) {
  // Process activities to show elevation gain over time
  const elevationData = activities
    .map((activity) => ({
      date: new Date(activity.start_date).toLocaleDateString(),
      elevation: activity.total_elevation_gain,
      name: activity.name,
    }))
    .reverse() // Show oldest to newest

  return (
    <Card>
      <CardHeader>
        <CardTitle>Elevation Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={elevationData}>
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}m`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Activity</span>
                            <span className="font-bold">{payload[0].payload.name}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Date</span>
                            <span className="font-bold">{payload[0].payload.date}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Elevation Gain</span>
                            <span className="font-bold">{payload[0].value}m</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="elevation"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary)/.2)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

