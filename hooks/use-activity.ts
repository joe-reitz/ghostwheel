"use client"

import { useState, useEffect } from "react"

interface Activity {
  id: number
  name: string
  distance: number
  moving_time: number
  total_elevation_gain: number
  type: string
  start_date: string
  average_speed: number
  max_speed: number
}

export function useActivity(token: string | null) {
  const [activity, setActivity] = useState<Activity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!token) {
      setError(new Error("No access token provided"))
      setIsLoading(false)
      return
    }

    async function fetchActivity() {
      try {
        const response = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=1", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch activity")
        }

        const data = await response.json()
        if (data.length > 0) {
          setActivity(data[0])
        } else {
          throw new Error("No recent activities found")
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivity()
  }, [token])

  return { activity, isLoading, error }
}
