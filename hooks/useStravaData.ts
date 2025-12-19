import { useState, useEffect } from "react"

interface StravaActivity {
  type: string
  start_date: string
  distance: number
  total_elevation_gain: number
  moving_time: number
  [key: string]: any
}

export function useStravaData(lookback: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Replace with your actual API endpoint
        const response = await fetch(`/api/strava/activities?lookback=${lookback}`)
        if (!response.ok) {
          throw new Error("Failed to fetch data")
        }
        const activities: StravaActivity[] = await response.json()
        // Process and filter activities here
        const processedData = activities
          .filter((activity: StravaActivity) => activity.type === "Ride")
          .map((activity: StravaActivity) => ({
            date: activity.start_date,
            distance: activity.distance / 1000, // Convert to km
            elevation: activity.total_elevation_gain,
            time: activity.moving_time,
            // Add more fields as needed
          }))
        setData(processedData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [lookback])

  return { data, loading, error }
}

