"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { StravaDataDisplay } from "@/components/strava-data-display"
import { LastRide } from "@/components/last-ride"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useStrava } from "@/lib/strava-context"

export default function Page() {
  const { accessToken, setAccessToken } = useStrava()
  const [goal, setGoal] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Handle access token from URL
    const tokenFromUrl = searchParams?.get("access_token")
    if (tokenFromUrl) {
      console.log("Access token received from URL")
      setAccessToken(tokenFromUrl)
      // Clean up URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("access_token")
      window.history.replaceState({}, "", newUrl.toString())
    }

    // Get stored goal
    const storedGoal = localStorage.getItem("cyclingGoal")
    if (storedGoal) {
      setGoal(storedGoal)
    }
  }, [searchParams, setAccessToken])

  const handleAIAnalysis = () => {
    if (!accessToken) {
      toast({
        title: "Error",
        description: "Please connect your Strava account first.",
        variant: "destructive",
      })
      return
    }
    if (!goal) {
      toast({
        title: "No Goal Set",
        description: "Please set a cycling goal before requesting AI analysis.",
        variant: "destructive",
      })
      return
    }
    router.push("/ai-assistant")
  }

  if (!accessToken) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-gray-800/80 p-8 text-center">
          <p className="text-lg text-gray-300">Please connect your Strava account to view your dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Your Cycling Dashboard</h1>
      <div className="grid gap-6">
        <LastRide />
        <StravaDataDisplay />
        <Button onClick={handleAIAnalysis} className="w-full md:w-auto">
          Get AI Training Advice
        </Button>
      </div>
    </div>
  )
}

