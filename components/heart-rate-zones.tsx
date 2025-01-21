import { Tooltip } from "recharts"

const MyChart = () => {
  // ... other code ...

  return (
    <div>
      {/* ... other elements ... */}
      <Tooltip
        content={({ active, payload }) => {
          if (active && payload && payload.length) {
            return (
              <div className="rounded-lg border bg-background p-2 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <span className="text-[0.70rem] uppercase text-muted-foreground">Zone</span>
                    <span className="font-bold">{payload[0].payload.zone}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[0.70rem] uppercase text-muted-foreground">Time</span>
                    <span className="font-bold">{Math.round(payload[0].value as number)}min</span>
                  </div>
                </div>
              </div>
            )
          }
          return null
        }}
      />
      {/* ... rest of the chart ... */}
    </div>
  )
}

export default MyChart

