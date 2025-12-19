"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function StravaLoginButton() {
  const router = useRouter()

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/auth/strava", {
        method: "POST",
      })
      const data = await response.json()
      if (data.url) {
        router.push(data.url)
      }
    } catch (error) {
      console.error("Error during Strava login:", error)
    }
  }

  return (
    <Button onClick={handleLogin} className="bg-[#FC4C02] hover:bg-[#FC4C02]/80 text-white">
      Connect with Strava
    </Button>
  )
}

