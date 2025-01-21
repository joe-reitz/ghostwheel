"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

const data = [
  {
    zone: "Z1",
    time: 120,
    percentage: 15,
  },
  {
    zone: "Z2",
    time: 240,
    percentage: 30,
  },
  {
    zone: "Z3",
    time: 180,
    percentage: 22,
  },
  {
    zone: "Z4",
    time: 160,
    percentage: 20,
  },
  {
    zone: "Z5",
    time: 100,
    percentage: 13,
  },
]

export function PowerZones() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Power Zones</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            time: {
              label: "Time (minutes)",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="zone" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}min`}
              />
              <ChartTooltip />
              <Bar dataKey="time" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

