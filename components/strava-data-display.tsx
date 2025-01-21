interface StravaActivity {
  id: number
  name: string
  distance: number
  moving_time: number
  total_elevation_gain: number
  start_date: string
  average_heartrate?: number
  max_heartrate?: number
  average_watts?: number
  sport_type: string
}

const activities: StravaActivity[] = [
  {
    id: 1,
    name: "Morning Ride",
    distance: 25.5,
    moving_time: 3600,
    total_elevation_gain: 200,
    start_date: "2024-03-08T07:00:00Z",
    sport_type: "Ride",
  },
  {
    id: 2,
    name: "Afternoon Gravel Ride",
    distance: 30,
    moving_time: 4200,
    total_elevation_gain: 300,
    start_date: "2024-03-08T14:00:00Z",
    sport_type: "GravelRide",
  },
  {
    id: 3,
    name: "Evening Run",
    distance: 5,
    moving_time: 1800,
    total_elevation_gain: 50,
    start_date: "2024-03-08T19:00:00Z",
    sport_type: "Run",
  },
  {
    id: 4,
    name: "Virtual Training",
    distance: 10,
    moving_time: 3000,
    total_elevation_gain: 100,
    start_date: "2024-03-09T08:00:00Z",
    sport_type: "VirtualRide",
  },
  {
    id: 5,
    name: "Mountain Bike Adventure",
    distance: 20,
    moving_time: 4800,
    total_elevation_gain: 400,
    start_date: "2024-03-10T10:00:00Z",
    sport_type: "MountainBikeRide",
  },
  {
    id: 6,
    name: "Ebike Commute",
    distance: 15,
    moving_time: 2400,
    total_elevation_gain: 150,
    start_date: "2024-03-11T07:30:00Z",
    sport_type: "EBikeRide",
  },
]

const cyclingActivities = activities.filter(
  (activity) =>
    activity.sport_type === "Ride" ||
    activity.sport_type === "GravelRide" ||
    activity.sport_type === "VirtualRide" ||
    activity.sport_type === "MountainBikeRide" ||
    activity.sport_type === "EBikeRide",
)

console.log(cyclingActivities)

