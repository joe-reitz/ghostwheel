"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface Activity {
  distance: number
  start_date: string
}

interface WeeklyData {
  week: string
  distance: number
}

export function WeeklyDistanceChart({ activities }: { activities: Activity[] }) {
  // Process activities into weekly data
  const weeklyData: WeeklyData[] = activities.reduce((acc: WeeklyData[], activity) => {
    const date = new Date(activity.start_date)
    const week = `${date.getFullYear()}-W${Math.ceil((date.getDate() + date.getDay()) / 7)}`

    const existingWeek = acc.find((d) => d.week === week)
    if (existingWeek) {
      existingWeek.distance += activity.distance / 1000 // Convert to km
    } else {
      acc.push({ week, distance: activity.distance / 1000 })
    }

    return acc
  }, [])

  // Sort by week
  weeklyData.sort((a, b) => a.week.localeCompare(b.week))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Distance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <XAxis dataKey="week" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}km`}
              />
              <Tooltip
                content={({
                  active,
                  payload,
                }: {
                  active: boolean | undefined
                  payload: Array<{ value: number; payload: { week: string } }> | undefined
                }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Week</span>
                            <span className="font-bold">{payload[0].payload.week}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Distance</span>
                            <span className="font-bold">{payload[0].value.toFixed(1)}km</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line type="monotone" dataKey="distance" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

