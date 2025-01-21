import { Tooltip } from "@nextui-org/react"

const MyComponent = () => {
  const data = [
    { week: 1, distance: 10.5 },
    { week: 2, distance: 12.2 },
    { week: 3, distance: 15 },
    { week: 4, distance: 11.8 },
  ]

  return (
    <div>
      {/* ... other code ... */}
      <Tooltip
        content={({ active, payload }) => {
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
                    <span className="font-bold">
                      {typeof payload[0].value === "number" ? payload[0].value.toFixed(1) : payload[0].value}km
                    </span>
                  </div>
                </div>
              </div>
            )
          }
          return null
        }}
      >
        {/* ... element to which the tooltip is attached ... */}
      </Tooltip>
      {/* ... rest of the code ... */}
    </div>
  )
}

export default MyComponent

