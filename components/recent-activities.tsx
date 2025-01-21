import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

const activities = [
  {
    id: "1",
    name: "Morning Ride",
    date: "2024-01-19",
    distance: "45.2 km",
    time: "1h 35m",
    elevation: "350m",
  },
  {
    id: "2",
    name: "Afternoon Training",
    date: "2024-01-18",
    distance: "52.8 km",
    time: "1h 45m",
    elevation: "420m",
  },
  {
    id: "3",
    name: "Evening Recovery",
    date: "2024-01-17",
    distance: "38.5 km",
    time: "1h 15m",
    elevation: "280m",
  },
  {
    id: "4",
    name: "Weekend Long Ride",
    date: "2024-01-16",
    distance: "65.3 km",
    time: "2h 15m",
    elevation: "550m",
  },
]

export function RecentActivities() {
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarFallback>
                {activity.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{activity.name}</p>
              <p className="text-sm text-muted-foreground">
                {activity.date} • {activity.distance} • {activity.time}
              </p>
            </div>
            <div className="ml-auto font-medium">{activity.elevation}</div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

