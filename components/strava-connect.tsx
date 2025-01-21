"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useStrava } from "@/lib/strava-context"
import { FaStrava } from "react-icons/fa"

export function StravaConnect() {
  const [isLoading, setIsLoading] = useState(false)
  const { accessToken } = useStrava()

  const handleStravaConnect = () => {
    setIsLoading(true)

    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/strava/callback`
    const scope = "activity:read_all,profile:read_all"

    if (!clientId) {
      console.error("Strava Client ID is not defined")
      setIsLoading(false)
      return
    }

    const authUrl = new URL("https://www.strava.com/oauth/authorize")
    authUrl.searchParams.append("client_id", clientId)
    authUrl.searchParams.append("redirect_uri", redirectUri)
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append("scope", scope)

    console.log("Redirecting to Strava auth URL:", authUrl.toString())
    window.location.href = authUrl.toString()
  }

  return (
    <Button
      onClick={handleStravaConnect}
      className="w-full bg-[#FC4C02] text-white hover:bg-[#E34902] focus:ring-2 focus:ring-[#FC4C02] focus:ring-offset-2 focus:ring-offset-gray-800"
      disabled={isLoading || !!accessToken}
    >
      <FaStrava className="mr-2 h-5 w-5" />
      {isLoading ? "Connecting..." : accessToken ? "Connected to Strava" : "Connect with Strava"}
    </Button>
  )
}

