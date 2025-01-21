"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { StravaDataDisplay } from "@/components/strava-data-display"
import { LastRide } from "@/components/last-ride"

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get("access_token")
    if (token) {
      setAccessToken(token)
    }
  }, [searchParams])

  if (!accessToken) {
    return <div>Please connect your Strava account to view your dashboard.</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Your Cycling Dashboard</h1>
      <div className="grid gap-6">
        <LastRide accessToken={accessToken} />
        <StravaDataDisplay accessToken={accessToken} />
      </div>
    </div>
  )
}

