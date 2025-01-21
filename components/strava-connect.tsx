"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function StravaConnect() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleStravaConnect = () => {
    setIsLoading(true)

    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/strava/callback`

    console.log("Client ID:", clientId)
    console.log("Redirect URI:", redirectUri)

    if (!clientId) {
      console.error("Strava Client ID is not defined")
      setIsLoading(false)
      return
    }

    const scope = "activity:read_all,profile:read_all"
    const responseType = "code"

    const authUrl = new URL("https://www.strava.com/oauth/authorize")
    authUrl.searchParams.append("client_id", clientId)
    authUrl.searchParams.append("redirect_uri", redirectUri)
    authUrl.searchParams.append("response_type", responseType)
    authUrl.searchParams.append("scope", scope)

    console.log("Environment variables:", {
      NEXT_PUBLIC_STRAVA_CLIENT_ID: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    })
    console.log("Window location:", window.location.toString())

    console.log("Auth URL:", authUrl.toString())

    window.location.href = authUrl.toString()
  }

  return (
    <Button
      onClick={handleStravaConnect}
      className="bg-[#FC4C02] text-white hover:bg-[#FC4C02]/90"
      disabled={isLoading}
    >
      {isLoading ? "Connecting..." : "Connect with Strava"}
    </Button>
  )
}

