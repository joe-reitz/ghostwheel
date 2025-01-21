"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

const data = [
  {
    date: "Jan 01",
    distance: 45,
    elevation: 350,
  },
  {
    date: "Jan 02",
    distance: 52,
    elevation: 420,
  },
  {
    date: "Jan 03",
    distance: 38,
    elevation: 280,
  },
  {
    date: "Jan 04",
    distance: 65,
    elevation: 550,
  },
  {
    date: "Jan 05",
    distance: 48,
    elevation: 400,
  },
  {
    date: "Jan 06",
    distance: 70,
    elevation: 680,
  },
  {
    date: "Jan 07",
    distance: 55,
    elevation: 450,
  },
]

export function Overview() {
  return (
    <ChartContainer
      config={{
        distance: {
          label: "Distance (km)",
          color: "hsl(var(--chart-1))",
        },
        elevation: {
          label: "Elevation (m)",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[400px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <ChartTooltip />
          <Line
            type="monotone"
            dataKey="distance"
            strokeWidth={2}
            activeDot={{
              r: 6,
              style: { fill: "var(--chart-1)" },
            }}
          />
          <Line
            type="monotone"
            dataKey="elevation"
            strokeWidth={2}
            activeDot={{
              r: 6,
              style: { fill: "var(--chart-2)" },
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

